import React, { useState } from 'react';

function SequenceScoringPage3() {
    const [inputString, setInputString] = useState('');
    const [outputString, setOutputString] = useState('');

    const processString = () => {
        setOutputString(inputString.replace(/[0-9\s]/g, ''));
    };

    return (
        <div className="page" id="page3">
            <h1>Remove Numbers and Whitespace</h1>
            <form
                id="stringForm"
                onSubmit={e => {
                    e.preventDefault();
                    processString();
                }}
            >
                <label htmlFor="inputString">Enter a string:</label><br />
                <input
                    type="text"
                    id="inputString"
                    name="inputString"
                    value={inputString}
                    onChange={e => setInputString(e.target.value)}
                /><br /><br />
                <button type="submit">Submit</button>
            </form>
            <h2>Processed String:</h2>
            <p id="outputString">{outputString}</p>
        </div>
    );
}

export default SequenceScoringPage3;
