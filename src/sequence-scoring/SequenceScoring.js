import React, { useState } from 'react';
import './SequenceScoring.css';
import SequenceScoringPage1 from './SequenceScoringPage1';
import SequenceScoringPage2 from './SequenceScoringPage2';
import SequenceScoringPage3 from './SequenceScoringPage3';

function SequenceScoring() {
    const [activePage, setActivePage] = useState('page1');

    return (
        <div className="page-selector">
            <div className="page-selection">
                <button 
                    className={`page-button ${activePage === 'page1' ? 'active' : ''}`}
                    onClick={() => setActivePage('page1')}
                >
                    Scoring
                </button>
                <button 
                    className={`page-button ${activePage === 'page2' ? 'active' : ''}`}
                    onClick={() => setActivePage('page2')}
                >
                    Comparison
                </button>
                <button 
                    className={`page-button ${activePage === 'page3' ? 'active' : ''}`}
                    onClick={() => setActivePage('page3')}
                >
                    Sequence Formatting
                </button>
            </div>
            <div>
                {activePage === 'page1' && <SequenceScoringPage1 />}
                {activePage === 'page2' && <SequenceScoringPage2 />}
                {activePage === 'page3' && <SequenceScoringPage3 />}
            </div>
        </div>
    );
}

export default SequenceScoring;