import React, { useState } from 'react';

function SequenceScoringPage1() {
    const [input1Type, setInput1Type] = useState('file');
    const [input1Value, setInput1Value] = useState('');
    const [csv1File, setCsv1File] = useState(null);
    const [csv2File, setCsv2File] = useState(null);
    const [onlyExtracellular, setOnlyExtracellular] = useState(false);

    const handleSwitchInput1 = () => {
        setInput1Type((prev) => (prev === 'file' ? 'text' : 'file'));
        setInput1Value('');
    };

    const handlePrint = () => window.print();

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
