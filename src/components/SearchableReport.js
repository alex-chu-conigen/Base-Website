import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quickbaseService } from '../services/quickbaseService';
import './SearchableReport.css';

function SearchableReport({ searchFilter }) {
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            Object.values(item).some(value => {
                const stringValue = typeof value === 'object' && value !== null ? 
                    String(value.value || '') : 
                    String(value || '');
                return stringValue.toLowerCase().includes(searchTerm);
            })
        );
        setFilteredData(filtered);
    }, [searchFilter, reportData]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const data = await quickbaseService.getSummaryReport();
            setReportData(data.data);
            setError(null);
        } catch (err) {
            setError('Failed to load report. Please try again later.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (entry) => {
        navigate('/entry-details', { state: { entryData: entry } });
    };

    const renderCellValue = (cell) => {
        if (typeof cell === 'object' && cell !== null) {
            if(cell.value != null) {
                return cell.value;
            }
            if(cell.name != null) {
                return cell.name || '';
            }
            return cell.value || '';
        }
        return cell || '';
    };

    if (loading) return <div className="loading">Loading report...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!filteredData.length) return <div>No data found</div>;

    return (
        <div className="searchable-report">
            <div className="report-container">
                <table>
                    <thead>
                        <tr>
                            <th className="action-column"></th>
                            {Object.keys(filteredData[0]).map((header, index) => (
                                <th key={index}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="action-column">
                                    <button 
                                        onClick={() => handleViewDetails(row)}
                                        className="view-details-button"
                                    >
                                        View
                                    </button>
                                </td>
                                {Object.values(row).map((cell, cellIndex) => (
                                    <td key={cellIndex}>{renderCellValue(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SearchableReport; 