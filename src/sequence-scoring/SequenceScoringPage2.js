import React, { useState } from 'react';

function SequenceScoringPage2() {
    const [inputs2, setInputs2] = useState([{ type: 'file', value: '' }]);
    const [csvRefFile, setCsvRefFile] = useState(null);

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
        <div className="page scoring-page2">
            <div id="inputs2" className="inputs2-section">
                <div className="button-wrapper upload-container">
                    <h3>Reference CSV</h3>
                    <input
                        type="file"
                        id="csv"
                        accept=".csv"
                        onChange={e => setCsvRefFile(e.target.files[0])}
                        className="sequence-file-input"
                    />
                    <h3>Sequences</h3>
                    {inputs2.map((input, idx) => (
                        <div className="file-upload-container sequence-input-row" key={idx}>
                            {input.type === 'file' ? (
                                <input
                                    type="file"
                                    className="upload-input sequence-file-input"
                                    accept=".txt"
                                    onChange={e => handleInput2Change(idx, e)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="upload-input sequence-text-input"
                                    placeholder="Enter sequence"
                                    value={typeof input.value === 'string' ? input.value : ''}
                                    onChange={e => handleInput2Change(idx, e)}
                                />
                            )}
                            <button type="button" className="toggle-input-btn" onClick={() => handleToggleInput2(idx)}>
                                Toggle Input
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div id="buttons2" className="buttons-section">
                <button className="add-input-btn" onClick={handleAddInput2}>Add New Input</button>
                <button className="run-script-btn">Run Script</button>
                <button className="print-btn" onClick={handlePrint}>Print this page</button>
            </div>
            <div id="outputs2" className="outputs2-section">
                <div id="legends2" className="legends2-row">
                    <div className="legend" id="samples2"></div>
                    <div className="legend" id="table2"></div>
                </div>
                <div id="tableContainer2" className="table-container2"></div>
                <div hidden id="output1"></div>
                <div hidden id="output2"></div>
            </div>
        </div>
    );
}

export default SequenceScoringPage2;
