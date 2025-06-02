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

function getDOM(xmlContent) {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");
    // Name
    const name = doc.getElementsByTagName("name")[0]?.firstChild;
    // Domnains
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
    return [name, dtype, dstart, dend, sequence];
}
    
    
//  Main Scoring Page Component
function SequenceScoringPage1() {
    const [input1Type, setInput1Type] = useState('file');
    const [input1Value, setInput1Value] = useState('');
    const [csv1File, setCsv1File] = useState(null);
    const [csv2File, setCsv2File] = useState(null);
    const [onlyExtracellular, setOnlyExtracellular] = useState(false);
    const [legend, setLegend] = useState('');
    const [tableHTML, setTableHTML] = useState('');


    // Switch input type between file and text
    const handleSwitchInput1 = () => {
        setInput1Type((prev) => (prev === 'file' ? 'text' : 'file'));
        setInput1Value('');
    };

    const handlePrint = () => window.print();

    // Runs Script
    const handleRunScript = async () => {
        setLegend('');
        setTableHTML('');

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

        // Get UniProt ID and XML content
        if (input1Type === 'text'){
            id = input1Value.trim();
            if (!id) return;
            const url = 'https://rest.uniprot.org/uniprotkb/${id}.xml';
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
        
    }
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
                <button className="run-script-btn">Run Script</button>
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
                    <div className="legend" id="samples1"></div>
                    <div className="legend" id="table1"></div>
                </div>
                <div id="tableContainer1" className="table-container1"></div>
            </div>
            <div hidden id="i"></div>
        </div>
    );
}

export default SequenceScoringPage1;
