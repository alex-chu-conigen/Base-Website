import React, { useState } from 'react';

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
        dstart.push(f.childNodes[1]?.childNodes[1]?.attributes.position.value);
        dend.push(f.childNodes[1]?.childNodes[3]?.attributes.position.value);
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
    const handlePrint = () => window.print();

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
        if (!csv1File || !csv2File) return;
        const csv1Content = await readFile(csv1File);
        const csv2Content = await readFile(csv2File);
        rows3 = csv1Content.split('\n');
        rows5 = csv2Content.split('\n');

        // 3. Prepare legend
        setLegend(
            <div>
                <h3>Sample 1: {dom[0]?.textContent} ({id})</h3>
                <div>
                    <span className="extracellular">Extracellular</span>
                    <span className="helical">Helical</span>
                    <span className="cytoplasmic">Cytoplasmic</span>
                    <span className="threshold">Above Score Threshold</span>
                </div>
            </div>
        );

        // 4. Generate table
        let b = [], d = [], k = [];
        for (let i = 0; i < rows5.length; i++) {
            let columns1 = rows5[i].split(",");
            if (!columns1[8] || Number(columns1[8]) > 10) break;
            let ans = [Number(columns1[2]), Number(columns1[3]), columns1[7]];
            if (columns1[0] === "H2-IAk") k.push(ans);
            else if (columns1[0] === "H2-IAb") b.push(ans);
            else if (columns1[0] === "H2-IAd") d.push(ans);
        }

        let c3 = 1, i1 = 0;
        let o3 = input1Type === 'file' ? sequence : dom[3];
        let dtype1 = dom[1], dend1 = dom[2], dstart1 = dom[4];

        // Build table rows
        let tables = [];
       for (let i = 0; i < o3.length; i += 25) {
            let headerRow = [<td key="header-blank"></td>];
            let seqRow = [<td key="label">Sample 1</td>];
            let bcellRow = [<td key="bcell-label">B Cell Scores</td>];
            let mhcIAbRow = [<td key="mhcIAb-label">Mouse MHCII H2-IAb</td>];
            let mhcIAdRow = [<td key="mhcIAd-label">Mouse MHCII H2-IAd</td>];
            let mhcIAkRow = [<td key="mhcIAk-label">Mouse MHCII H2-IAk</td>];

            let localC3 = c3;
            let localI1 = i1;

            for (let j = i; j < i + 25 && j < o3.length; j++) {
                // Only Extracellular filter
                if (onlyExtracellular && dtype1[localI1] !== "Extracellular") {
                    if (localC3 >= dend1[localI1]) localI1++;
                    localC3++;
                    continue;
                }

                // Header
                headerRow.push(<td key={`header-${j}`}>{j + 1}</td>);

                // Sequence cell with coloring
                let seqStyle = {};
                if (dtype1[localI1] && localC3 >= dstart1[localI1]) {
                    if (dtype1[localI1] === "Extracellular") seqStyle.backgroundColor = "#ADD8E6";
                    else if (dtype1[localI1].startsWith("Helical")) seqStyle.backgroundColor = "#FF7F7F";
                    else if (dtype1[localI1] === "Cytoplasmic") seqStyle.backgroundColor = "#90EE90";
                }
                seqRow.push(<td key={`seq-${j}`} style={seqStyle}>{o3[j]}</td>);

                // B Cell Scores
                let bcellScore = "";
                let bcellStyle = {};
                let row3 = rows3[localC3];
                if (row3) {
                    let columns1 = row3.split(",");
                    bcellScore = columns1[2];
                    let threshold1 = columns1[3];
                    if (threshold1) threshold1 = threshold1.replace(/[\r\n]+/gm, "");
                    if (threshold1 === "E") bcellStyle.backgroundColor = "#FADA5E";
                }
                bcellRow.push(<td key={`bcell-${j}`} style={bcellStyle}>{bcellScore}</td>);

                // MHCII H2-IAb
                let mhcIAbScore = "";
                for (let y = 0; y < b.length; y++) {
                    let [start, end, score] = b[y];
                    if (localC3 >= start && localC3 <= end) {
                        mhcIAbScore = score;
                        break;
                    }
                }
                mhcIAbRow.push(<td key={`mhcIAb-${j}`}>{mhcIAbScore}</td>);

                // MHCII H2-IAd
                let mhcIAdScore = "";
                for (let y = 0; y < d.length; y++) {
                    let [start, end, score] = d[y];
                    if (localC3 >= start && localC3 <= end) {
                        mhcIAdScore = score;
                        break;
                    }
                }
                mhcIAdRow.push(<td key={`mhcIAd-${j}`}>{mhcIAdScore}</td>);

                // MHCII H2-IAk
                let mhcIAkScore = "";
                for (let y = 0; y < k.length; y++) {
                    let [start, end, score] = k[y];
                    if (localC3 >= start && localC3 <= end) {
                        mhcIAkScore = score;
                        break;
                    }
                }
                mhcIAkRow.push(<td key={`mhcIAk-${j}`}>{mhcIAkScore}</td>);

                if (localC3 >= dend1[localI1]) localI1++;
                localC3++;
            }

            tables.push(
                <table key={`table-${i}`}>
                    <tbody>
                        <tr>{headerRow}</tr>
                        <tr>{seqRow}</tr>
                        <tr>{bcellRow}</tr>
                        <tr>{mhcIAbRow}</tr>
                        <tr>{mhcIAdRow}</tr>
                        <tr>{mhcIAkRow}</tr>
                    </tbody>
                </table>
            );
        }
        setTableHtml(<div>{tables}</div>);
    };

    return (
        <div className="page scoring-page1">
            <div id="inputs1" className="inputs1-section">
                <div className="button-wrapper">
                    <h3>Submit Sequence</h3>
                    {input1Type === 'file' ? (
                        <input
                            type="file"
                            id="Input1"
                            accept=".txt"
                            className="sequence-file-input"
                            onChange={e => setInput1Value(e.target.files[0])}
                        />
                    ) : (
                        <input
                            type="text"
                            id="Input1"
                            value={input1Value}
                            className="sequence-text-input"
                            onChange={e => setInput1Value(e.target.value)}
                            placeholder="Enter sequence"
                        />
                    )}
                </div>
                <div className="button-wrapper">
                    <h3>Submit CSV 1</h3>
                    <input
                        type="file"
                        id="csv1"
                        accept=".csv"
                        className="sequence-file-input"
                        onChange={e => setCsv1File(e.target.files[0])}
                    />
                </div>
                <div className="button-wrapper">
                    <h3>Submit Second Type of CSV</h3>
                    <input
                        type="file"
                        id="csv2"
                        accept=".csv"
                        className="sequence-file-input"
                        onChange={e => setCsv2File(e.target.files[0])}
                    />
                </div>
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        id="myCheckbox"
                        checked={onlyExtracellular}
                        onChange={e => setOnlyExtracellular(e.target.checked)}
                    /> Only Extracellular
                </label>
                <br /><br />
            </div>
            <div id="buttons1" className="buttons-section">
                <button className="add-input-btn" onClick={handleSwitchInput1}>Switch Inputs</button>
                <button className="run-script-btn" onClick={handleRunScript}>Run Script</button>
                <button className="print-btn" onClick={handlePrint}>Print this page</button>
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
            <div id="outputs1" className="outputs1-section">
                <div id="legends1" className="legends1-row">
                    <div className="legend" id="samples1">{legend}</div>
                </div>
                <div id="tableContainer1" className="table-container1">{tableHtml}</div>
            </div>
            <div hidden id="i"></div>
        </div>
    );
}

export default SequenceScoringPage1;