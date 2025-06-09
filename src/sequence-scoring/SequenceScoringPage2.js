import React, { useState } from 'react';
import { diffChars } from 'diff';
import styles from './SequenceScoring.module.css';


function SequenceScoringPage2() {
    const [inputs2, setInputs2] = useState([{ type: 'file', value: '' }]);
    const [csvRefFile, setCsvRefFile] = useState(null);
    const [legend, setLegend] = useState('');
    const [tableHtml, setTableHtml] = useState('');


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

    // Helper: align two sequences and mark differences
    function difference(refSequence, childSequence) {
        const diff = diffChars(refSequence, childSequence);
        let o3 = "", o4 = "";
        let refArr = [], childArr = [];
        diff.forEach(part => {
            if (!part.added) {
                for (const c of part.value) refArr.push({ char: c, color: part.removed ? 'red' : 'black' });
            }
            if (!part.removed) {
                for (const c of part.value) childArr.push({ char: c, color: part.added ? 'green' : 'black' });
            }
        });
        let i = 0, j = 0;
        while (i < refArr.length && j < childArr.length) {
            if (refArr[i].char === childArr[j].char) {
                o3 += refArr[i].char;
                o4 += '.';
                i++; j++;
            } else if (refArr[i].color === 'red' && childArr[j].color === 'green') {
                o3 += refArr[i].char;
                o4 += childArr[j].char;
                i++; j++;
            } else if (refArr[i].color === 'red') {
                o3 += refArr[i].char;
                o4 += '-';
                i++;
            } else if (childArr[j].color === 'green') {
                o3 += '-';
                o4 += childArr[j].char;
                j++;
            } else {
                i++; j++;
            }
        }
        while (i < refArr.length) { o3 += refArr[i++].char; o4 += '-'; }
        while (j < childArr.length) { o3 += '-'; o4 += childArr[j++].char; }
        return [o3, o4];
    }

    // Helper: create legends
    function createLegends(names, ids) {
        return (
            <>
                <div>
                    {names.map((n, i) => (
                        <h3 key={i}>Sample {i + 1}: {n} ({ids[i]})</h3>
                    ))}
                </div>
                <div>
                    <span className={styles.extracellular}>Extracellular</span>
                    <span className={styles.helical}>Helical</span>
                    <span className={styles.cytoplasmic}>Cytoplasmic</span>
                    <span className={styles.threshold}>Above Score Threshold</span>
                </div>
            </>
        );
    }

    // Helper: populate the comparison table
    function populateTable(finalresult, names, dtype, dend, rows, ids, dstart) {
        let ccount = Array(finalresult.length).fill(1);
        let icount = Array(finalresult.length).fill(0);
        let tables = [];
        let refIdx = 0; // Reference is always first

        for (let i = 0; i < finalresult[0].length; i += 25) {
            // Header row
            let headerRow = [<td key="header-blank"></td>];
            for (let j = i; j < i + 25 && j < finalresult[0].length; j++) {
                headerRow.push(<td key={`header-${j}`}>{j + 1}</td>);
            }

            // Sequence rows
            let seqRows = [];
            for (let x = 0; x < finalresult.length; x++) {
                let fr = finalresult[x];
                let dtype1 = dtype[x];
                let dend1 = dend[x];
                let dstart1 = dstart[x];
                let row = [<td key={`label-${x}`}>Sample {x + 1}</td>];

                let localC = ccount[x];
                let localI = icount[x];

                for (let j = i; j < i + 25 && j < finalresult[0].length; j++) {
                    let tdStyle = {};
                    // Color coding
                    if (dtype1[localI] !== undefined && localC >= dstart1[localI]) {
                        if (dtype1[localI] === "Extracellular") tdStyle.backgroundColor = "#ADD8E6";
                        else if (dtype1[localI].startsWith("Helical")) tdStyle.backgroundColor = "#FF7F7F";
                        else if (dtype1[localI] === "Cytoplasmic") tdStyle.backgroundColor = "#90EE90";
                    }
                    // Underline every 50th residue
                    if (localC % 50 === 0 && fr[j] !== '-') tdStyle.textDecoration = "underline";
                    row.push(<td key={`seq-${x}-${j}`} style={tdStyle}>{fr[j]}</td>);
                    if (fr[j] !== '-') localC++;
                    if (localC > dend1[localI]) localI++;
                }
                seqRows.push(<tr key={`seqrow-${x}`}>{row}</tr>);
                ccount[x] = localC;
                icount[x] = localI;
            }

            // Ref B Cell Scores row
            let bcellRow = [<td key="bcell-label">Ref B Cell Scores</td>];
            let localC = ccount[finalresult.length - 1] || 1;
            for (let j = i; j < i + 25 && j < finalresult[0].length; j++) {
                let tdStyle = {};
                let val = "";
                if (finalresult[0][j] !== '-') {
                    localC++;
                    let row = rows[localC];
                    if (row) {
                        const columns = row.split(",");
                        val = columns[2];
                        let threshold1 = columns[3];
                        if (threshold1) threshold1 = threshold1.replace(/[\r\n]+/gm, "");
                        if (threshold1 === "E") tdStyle.backgroundColor = "#FADA5E";
                    }
                }
                bcellRow.push(<td key={`bcell-${j}`} style={tdStyle}>{val}</td>);
            }

            tables.push(
                <table key={`table-${i}`}>
                    <tbody>
                        <tr>{headerRow}</tr>
                        {seqRows}
                        <tr>{bcellRow}</tr>
                    </tbody>
                </table>
            );
        }
        setTableHtml(<div>{tables}</div>);
    }

    // Run Script (core logic)
    const handleRunScript = async () => {
        setLegend('');
        setTableHtml('');
        // 1. Gather all sequence inputs and fetch XMLs
        let ids = [];
        let xmlPromises = inputs2.map(async (input) => {
            if (input.type === 'file' && input.value) {
                const file = input.value;
                const fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
                // Extract UniProt ID from FASTA header
                const firstLine = fileContent.split('\n')[0].trim();
                let idMatch = firstLine.match(/\|([A-Z0-9]+)\|/);
                let id = idMatch && idMatch[1] ? idMatch[1] : firstLine.replace(/^>/, '').split(' ')[0];
                ids.push(id);
                const url = `https://rest.uniprot.org/uniprotkb/${id}.xml`;
                return getXMLContent(url);
            } else if (input.type === 'text' && input.value) {
                let id = input.value.trim();
                ids.push(id);
                const url = `https://rest.uniprot.org/uniprotkb/${id}.xml`;
                return getXMLContent(url);
            }
            return null;
        });
        let xmlContents = await Promise.all(xmlPromises);

        // 2. Parse CSV reference file
        if (!csvRefFile) return;
        const csvContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(csvRefFile);
        });
        const rows = csvContent.split('\n');

        // 3. Parse XMLs and build aligned sequences
        let names = [], dtype = [], dend = [], dstart = [], inputSeqs = [];
        let refDom = getDOM(xmlContents[0]);
        names.push(refDom[0]?.textContent || "");
        dtype.push(refDom[1]);
        dend.push(refDom[2].map(Number));
        dstart.push(refDom[4].map(Number));
        let refSeq = refDom[3];
        for (let i = 1; i < xmlContents.length; i++) {
            let dom = getDOM(xmlContents[i]);
            names.push(dom[0]?.textContent || "");
            dtype.push(dom[1]);
            dend.push(dom[2].map(Number));
            dstart.push(dom[4].map(Number));
            inputSeqs.push(dom[3]);
        }

        // 4. Align all sequences to the reference
        let aligned = [refSeq];
        let r = refSeq;
        for (let i = 0; i < inputSeqs.length; i++) {
            let diffResult = difference(r, inputSeqs[i]);
            r = diffResult[0];
            aligned.push(diffResult[1]);
        }

        // 5. Render legends and table
        setLegend(createLegends(names, ids));
        populateTable(aligned, names, dtype, dend, rows, ids, dstart);
    };

    const handleAddInput2 = () => {
        setInputs2((prev) => [...prev, { type: 'file', value: '' }]);
    };

    const handleToggleInput2 = (idx) => {
        setInputs2((prev) =>
            prev.map((input, i) =>
                i === idx
                    ? { ...input, type: input.type === 'file' ? 'text' : 'file', value: '' }
                    : input
            )
        );
    };

    const handleInput2Change = (idx, e) => {
        const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setInputs2((prev) =>
            prev.map((input, i) =>
                i === idx ? { ...input, value } : input
            )
        );
    };

    const handlePrint = () => window.print();

    return (
        <div className={`${styles.page} ${styles.scoring_page2}`}>
            <div id="inputs2" className={styles.inputs2_section}>
                <div className={`${styles.button_wrapper} ${styles.upload_container}`}>
                    <h3>Reference CSV</h3>
                    <input
                        type="file"
                        id="csv"
                        accept=".csv"
                        onChange={e => setCsvRefFile(e.target.files[0])}
                        className={styles.sequence_file_input}
                    />
                    <h3>Sequences</h3>
                    {inputs2.map((input, idx) => (
                        <div className={`${styles.file_upload_container} ${styles.sequence_input_row}`} key={idx}>
                            {input.type === 'file' ? (
                                <input
                                    type="file"
                                    className={`${styles.upload_input} ${styles.sequence_file_input}`}
                                    accept=".txt"
                                    onChange={e => handleInput2Change(idx, e)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className={`${styles.upload_input} ${styles.sequence_text_input}`}
                                    placeholder="Enter UniProt ID"
                                    value={typeof input.value === 'string' ? input.value : ''}
                                    onChange={e => handleInput2Change(idx, e)}
                                />
                            )}
                            <button type="button" className={styles.toggle_input_btn} onClick={() => handleToggleInput2(idx)}>
                                Toggle Input
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div id="buttons2" className={styles.buttons_section}>
                <button className={styles.add_input_btn} onClick={handleAddInput2}>Add New Input</button>
                <button className={styles.run_script_btn} onClick={handleRunScript}>Run Script</button>
                <button className={styles.print_btn} onClick={handlePrint}>Print this page</button>
            </div>
            <div id="outputs2" className={styles.outputs2_section_seq}>
                <div id="legend" className={styles.legends2_row}>
                    <div className={styles.legend} id="samples2">{legend}</div>
                </div>
                <div id="tableContainer2" className={styles.table_container2_seq}>{tableHtml}</div>
            </div>
        </div>
    );
}

export default SequenceScoringPage2;