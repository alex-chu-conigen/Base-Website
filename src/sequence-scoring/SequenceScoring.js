import React, { useState } from 'react';
import styles from './SequenceScoring.module.css';
import SequenceScoringPage1 from './SequenceScoringPage1';
import SequenceScoringPage2 from './SequenceScoringPage2';
import SequenceScoringPage3 from './SequenceScoringPage3';

function SequenceScoring() {
    const [activePage, setActivePage] = useState('page1');

    return (
        <div className={styles.page_selector}>
            <div className={styles.page_selection}>
                <button 
                    className={`${styles.page_button} ${activePage === 'page1' ? styles.active : ''}`}
                    onClick={() => setActivePage('page1')}
                >
                    Scoring
                </button>
                <button 
                    className={`${styles.page_button} ${activePage === 'page2' ? styles.active : ''}`}
                    onClick={() => setActivePage('page2')}
                >
                    Comparison
                </button>
                <button 
                    className={`${styles.page_button} ${activePage === 'page3' ? styles.active : ''}`}
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