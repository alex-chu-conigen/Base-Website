import React, { useState } from 'react';
import styles from './SequenceScoring.module.css';

// Helper: fetch XML content from UniProt
async function getXMLContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch XML file. Status code: ${response.status}`);
        return await response.text();
    } catch (error) {
        console.error("Error fetching XML file:", error);
        return null;
    }
}

// Helper: parse XML and extract info
function getDOM(xmlContent) {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    // Name
    const name = doc.getElementsByTagName("name")[0]?.firstChild;
    // Domains
    const features = doc.getElementsByTagName("feature");
    const dtype = [], dend = [], dstart = [];
    for (let i = 1; i < features.length; i++) {
        const f = features[i];
        if (f.attributes.type.value !== "topological domain" && f.attributes.type.value !== "transmembrane region") continue;
        dtype.push(f.attributes.description.value);
        dstart.push(Number(f.childNodes[1]?.childNodes[1]?.attributes.position.value));
        dend.push(Number(f.childNodes[1]?.childNodes[3]?.attributes.position.value));
    }
    // Sequence
    const seqNodes = doc.getElementsByTagName("sequence");
    const sequence = seqNodes[seqNodes.length - 1]?.firstChild?.nodeValue;
    return [name, dtype, dend, sequence, dstart];
}
// Main component
function SequenceScoringPage1() {
    const [input1Type, setInput1Type] = useState('file');
    const [input1Value, setInput1Value] = useState('');
    const [csv1File, setCsv1File] = useState(null);
    const [csv2File, setCsv2File] = useState(null);
    const [onlyExtracellular, setOnlyExtracellular] = useState(false);
    const [legend, setLegend] = useState('');
    const [tableHtml, setTableHtml] = useState('');

    // Switch between file and text input
    const handleSwitchInput1 = () => {
        setInput1Type(prev => prev === 'file' ? 'text' : 'file');
        setInput1Value('');
    };

    // Print page
    // Track if we are printing
    const [isPrinting, setIsPrinting] = useState(false);

    // Print page (hide extracellular summary during print)
    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100); // Give React time to update
    };

    // Run Script (core logic)
    const handleRunScript = async () => {
        setLegend('');
        setTableHtml('');
        let id = '';
        let xmlContent1 = null;
        let dom = null;
        let sequence = '';
        let rows3 = [];
        let rows5 = [];

        // Helper: read file as text
        const readFile = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });

        // 1. Get UniProt ID and fetch XML
        if (input1Type === 'text') {
            id = input1Value.trim();
            if (!id) return;
            const url = `https://rest.uniprot.org/uniprotkb/${id}.xml`;
            xmlContent1 = await getXMLContent(url);
        } else if (input1Value) {
            // File input: extract ID from first line
            const fileContent = await readFile(input1Value);
            const firstLine = fileContent.slice(0, fileContent.indexOf("\n"));
            id = firstLine.substring(4, 10);
            const url = `https://rest.uniprot.org/uniprotkb/${id}.xml`;
            xmlContent1 = await getXMLContent(url);
            sequence = fileContent
                .substring(fileContent.indexOf('\n') + 1)
                .trim()
                .replace(/[\n\r\s]+/g, '');
        } else {
            return;
        }
        if (!xmlContent1) return;
        dom = getDOM(xmlContent1);

        // 2. Read CSV files
        if (csv1File) {
            const csv1Content = await readFile(csv1File);
            rows3 = csv1Content.split('\n');
        }
        if (csv2File) {
            const csv2Content = await readFile(csv2File);
            rows5 = csv2Content.split('\n');
        }

        // 3. Prepare legend
        setLegend(
            <div>
                <h3>Sample 1: {dom[0]?.textContent} ({id})</h3>
                <div>
                    <span className={styles.extracellular}>Extracellular</span>
                    <span className={styles.helical}>Helical</span>
                    <span className={styles.cytoplasmic}>Cytoplasmic</span>
                    <span className={styles.threshold}>Above Score Threshold</span>
                </div>
            </div>
        );

        // 4. Parse MHCII CSV for score ranges
        let b = [], d = [], k = [];
        if (rows5.length > 0) {
            for (let i = 0; i < rows5.length; i++) {
                let columns1 = rows5[i].split(",");
                if (!columns1[8] || Number(columns1[8]) > 10) break;
                let ans = [Number(columns1[2]), Number(columns1[3]), columns1[7]];
                if (columns1[0] === "H2-IAk") k.push(ans);
                else if (columns1[0] === "H2-IAb") b.push(ans);
                else if (columns1[0] === "H2-IAd") d.push(ans);
            }
        }

        // 5. Build tables for each 25 characters
        let o3 = input1Type === 'file' ? sequence : dom[3];
        let dtype1 = dom[1], dend1 = dom[2], dstart1 = dom[4];
        let tables = [];

        for (let i = 0; i < o3.length; i += 25) {
            let headerRow = [<td key="header-blank"></td>];
            let seqRow = [<td key="label">Sample 1</td>];
            let bcellRow = [<td key="bcell-label">B Cell Scores</td>];
            let mhcIAbRow = [<td key="mhcIAb-label">Mouse MHCII H2-IAb</td>];
            let mhcIAdRow = [<td key="mhcIAd-label">Mouse MHCII H2-IAd</td>];
            let mhcIAkRow = [<td key="mhcIAk-label">Mouse MHCII H2-IAk</td>];

            for (let j = i; j < i + 25 && j < o3.length; j++) {
                const pos = j + 1; // 1-based position

                // Find which domain this residue belongs to
                let domainIdx = -1;
                for (let d = 0; d < dtype1.length; d++) {
                    if (pos >= dstart1[d] && pos <= dend1[d]) {
                        domainIdx = d;
                        break;
                    }
                }
                const domainType = domainIdx !== -1 ? dtype1[domainIdx] : null;

                // Only Extracellular filter
                let skip = false;
                if (onlyExtracellular && domainType !== "Extracellular") {
                    skip = true;
                }

                // Header
                headerRow.push(<td key={`header-${j}`}>{pos}</td>);

                // Sequence cell with coloring
                let seqStyle = {};
                if (!skip && domainType) {
                    if (domainType === "Extracellular") seqStyle.backgroundColor = "#ADD8E6";
                    else if (domainType.startsWith("Helical")) seqStyle.backgroundColor = "#FF7F7F";
                    else if (domainType === "Cytoplasmic") seqStyle.backgroundColor = "#90EE90";
                }
                seqRow.push(<td key={`seq-${j}`} style={seqStyle}>{!skip ? o3[j] : ""}</td>);

                // B Cell Scores
                let bcellScore = "";
                let bcellStyle = {};
                if (rows3.length > 0) {
                    let row3 = rows3[pos];
                    if (!skip && row3) {
                        let columns1 = row3.split(",");
                        bcellScore = columns1[2];
                        let threshold1 = columns1[3];
                        if (threshold1) threshold1 = threshold1.replace(/[\r\n]+/gm, "");
                        if (threshold1 === "E") bcellStyle.backgroundColor = "#FADA5E";
                    }
                }
                bcellRow.push(<td key={`bcell-${j}`} style={bcellStyle}>{!skip && rows3.length > 0 ? bcellScore : ""}</td>);

                // MHCII H2-IAb
                let mhcIAbScore = "";
                if (!skip && b.length > 0) {
                    for (let y = 0; y < b.length; y++) {
                        let [start, end, score] = b[y];
                        if (pos >= start && pos <= end) {
                            mhcIAbScore = score;
                            break;
                        }
                    }
                }
                mhcIAbRow.push(<td key={`mhcIAb-${j}`}>{!skip && b.length > 0 ? mhcIAbScore : ""}</td>);

                // MHCII H2-IAd
                let mhcIAdScore = "";
                if (!skip && d.length > 0) {
                    for (let y = 0; y < d.length; y++) {
                        let [start, end, score] = d[y];
                        if (pos >= start && pos <= end) {
                            mhcIAdScore = score;
                            break;
                        }
                    }
                }
                mhcIAdRow.push(<td key={`mhcIAd-${j}`}>{!skip && d.length > 0 ? mhcIAdScore : ""}</td>);

                // MHCII H2-IAk
                let mhcIAkScore = "";
                if (!skip && k.length > 0) {
                    for (let y = 0; y < k.length; y++) {
                        let [start, end, score] = k[y];
                        if (pos >= start && pos <= end) {
                            mhcIAkScore = score;
                            break;
                        }
                    }
                }
                mhcIAkRow.push(<td key={`mhcIAk-${j}`}>{!skip && k.length > 0 ? mhcIAkScore : ""}</td>);
            }

            let tableRows = [
                <tr key="header">{headerRow}</tr>,
                <tr key="seq">{seqRow}</tr>
            ];
            if (rows3.length > 0) tableRows.push(<tr key="bcell">{bcellRow}</tr>);
            if (b.length > 0) tableRows.push(<tr key="mhcIAb">{mhcIAbRow}</tr>);
            if (d.length > 0) tableRows.push(<tr key="mhcIAd">{mhcIAdRow}</tr>);
            if (k.length > 0) tableRows.push(<tr key="mhcIAk">{mhcIAkRow}</tr>);

            tables.push(
                <table id='seq-table' key={`table-${i}`}>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            );
        }

        // 6. If onlyExtracellular is checked, show a summary table of extracellular regions
        let extracellularSummary = null;
        if (onlyExtracellular) {
            // Find all extracellular regions and their sequences
            let extracellularCells = [];
            let o3seq = input1Type === 'file' ? sequence : dom[3];
            for (let d = 0; d < dtype1.length; d++) {
                if (dtype1[d] === "Extracellular") {
                    const start = dstart1[d] - 1; // 0_based
                    const end = dend1[d]; // exclusive
                    const seq = o3seq.slice(start, end);
                    extracellularCells.push(
                        <td
                            key={`extracellular_seq_${d}`}
                            style={{ fontFamily: "monospace", border: "1px solid black" }}
                        >
                            {seq}
                        </td>
                    );
                    extracellularCells.push(
                        <td
                            key={`extracellular_len_${d}`}
                            style={{ border: "1px solid black" }}
                        >
                            {seq.length}
                        </td>
                    );
                }
            }
            if (!isPrinting) {
                extracellularSummary = (
                    <div className='no_print' style={{marginTop: "1em"}}>
                        <h4>Extracellular Region Summary</h4>
                        <table
                id="extracellular_summary_table"
                            border="1"
                            style={{ borderCollapse: "collapse" }}
                        >
                            <tbody>
                                <tr>
                                    {extracellularCells}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                );
            }
        }

        setTableHtml(
            <div>
                {tables}
                {extracellularSummary}
            </div>
        );
    };

    return (
        <div className={`${styles.class1} ${styles.class2}`}>
            <div id="inputs1" className={styles.inputs1_section}>
                <div className={styles.button_wrapper}>
                    <h3>Submit Sequence</h3>
                    {input1Type === 'file' ? (
                        <input
                            type="file"
                            id="Input1"
                            accept=".txt"
                            className={styles.sequence_file_input}
                            onChange={e => setInput1Value(e.target.files[0])}
                        />
                    ) : (
                        <input
                            type="text"
                            id="Input1"
                            value={input1Value}
                            className={styles.sequence_text_input}
                            onChange={e => setInput1Value(e.target.value)}
                            placeholder="Enter sequence"
                        />
                    )}
                </div>
                <div className={styles.button_wrapper}>
                    <h3>Submit CSV 1</h3>
                    <input
                        type="file"
                        id="csv1"
                        accept=".csv"
                        className={styles.sequence_file_input}
                        onChange={e => setCsv1File(e.target.files[0])}
                    />
                </div>
                <div className={styles.button_wrapper}>
                    <h3>Submit Second Type of CSV</h3>
                    <input
                        type="file"
                        id="csv2"
                        accept=".csv"
                        className={styles.sequence_file_input}
                        onChange={e => setCsv2File(e.target.files[0])}
                    />
                </div>
                <label className={styles.checkbox_label}>
                    <input
                        type="checkbox"
                        id="myCheckbox"
                        checked={onlyExtracellular}
                        onChange={e => setOnlyExtracellular(e.target.checked)}
                    /> Only Extracellular
                </label>
                <br /><br />
            </div>
            <div id="buttons1" className={styles.buttons_section}>
                <button className={styles.add_input_btn} onClick={handleSwitchInput1}>Switch Inputs</button>
                <button className={styles.run_script_btn} onClick={handleRunScript}>Run Script</button>
                <button className={styles.print_btn} onClick={handlePrint}>Print this page</button>
                    <button
                    className={styles.jump_extracell_btn}
                    style={{ marginLeft: "1rem" }}
                    onClick={() => {
                        const elem = document.getElementById("extracellular_summary_table");
                        if (elem) elem.scrollIntoView({ behavior: "smooth" });
                    }}
                >
                    Jump to Extracellular Table
                </button>
            </div>
            <br />
            <div>
                <a href="http://tools.iedb.org/bcell/" target="_blank" rel="noopener noreferrer">
                    http://tools.iedb.org/bcell/
                </a>
                <br />
                <a href="http://tools.iedb.org/mhcii/" target="_blank" rel="noopener noreferrer">
                    http://tools.iedb.org/mhcii/
                </a>
            </div>
            <div className={styles.outputs1_section_seq}>
                <div id="legends1" className={styles.legends1_row}>
                    <div className={styles.legend} id="samples1">{legend}</div>
                </div>
                <div id="tableContainer1_seq" className={styles.table_container1_seq} style={{padding:"0 0 5rem 0"}}>{tableHtml}</div>
            </div>
            <div hidden id="i"></div>
        </div>
    );
}

export default SequenceScoringPage1;