import React, { useState } from 'react';
import SearchableReport from '../../components/SearchableReport';
import './Summary.css';

function Summary() {
    const [searchTerm, setSearchTerm] = useState('');
    const [reportKey, setReportKey] = useState(Date.now());

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRefresh = () => {
        setReportKey(Date.now());
    };

    return (
        <div className="summary-page">
            <div className="summary-header">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search in report..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>
                <button onClick={handleRefresh} className="refresh-button">
                    Refresh Report
                </button>
            </div>
            <div className="report-container">
                <SearchableReport 
                    key={reportKey}
                    searchFilter={searchTerm}
                />
            </div>
        </div>
    );
}

export default Summary; 