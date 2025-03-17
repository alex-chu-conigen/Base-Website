import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickbaseService } from '../services/quickbaseService';
import './QuickbaseReport.css';

function QuickbaseReport({ searchFilter }) {
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        fetchReportData();
    }, []);

    useEffect(() => {
        if (!searchFilter) {
            setFilteredData(reportData);
            return;
        }

        const searchTerm = searchFilter.toLowerCase();
        const filtered = reportData.filter(item => 
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            )
        );
        setFilteredData(filtered);
    }, [searchFilter, reportData]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const data = await quickbaseService.getReport();
            setReportData(data.data);
            console.log(data.data);
            setError(null);
        } catch (err) {
            setError('Failed to load report. Please try again later.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRowSelect = (rowIndex) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowIndex)) {
                newSet.delete(rowIndex);
            } else {
                newSet.add(rowIndex);
            }
            return newSet;
        });
    };

    const handleViewSelected = () => {
        const selectedData = Array.from(selectedRows).map(index => reportData[index]);
        // Store selected data in localStorage for the next page
        localStorage.setItem('selectedReportData', JSON.stringify(selectedData));
        // Navigate to the new page
        navigate('/selected-items');
    };

    if (loading) return <div className="loading">Loading report...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!filteredData.length) return <div>No data found</div>;

    return (
        <div className="quickbase-report">
            <h2>Quickbase Report</h2>
            <div className="report-container">
                {filteredData.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th className="checkbox-column"></th>
                                {Object.keys(filteredData[0]).map((header, index) => (
                                    <th key={index}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="checkbox-column">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(rowIndex)}
                                            onChange={() => handleRowSelect(rowIndex)}
                                        />
                                    </td>
                                    {Object.values(row).map((cell, cellIndex) => (
                                        <td key={cellIndex}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No records found</p>
                )}
            </div>
            <div className="button-container">
                <button onClick={fetchReportData} className="refresh-button">
                    Refresh Report
                </button>
                <button 
                    onClick={handleViewSelected} 
                    className="view-selected-button"
                    disabled={selectedRows.size === 0}
                >
                    View Selected ({selectedRows.size})
                </button>
            </div>
        </div>
    );
}

export default QuickbaseReport; 