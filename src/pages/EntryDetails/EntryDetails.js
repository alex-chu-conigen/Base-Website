import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quickbaseService } from '../../services/quickbaseService';
import './EntryDetails.css';

function EntryDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const entryData = location.state?.entryData;
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (entryData) {
            fetchEntryDetails();
        }
    }, [entryData]);

    const fetchEntryDetails = async () => {
        try {
            setLoading(true);
            const recordId = entryData['Project ID#'] || entryData['Run ID'];
            if (!recordId) {
                throw new Error('No record ID found');
            }
            const response = await quickbaseService.getEntryDetails(recordId);
            setDetails(response.data[0]);
            setError(null);
        } catch (err) {
            setError('Failed to load entry details. Please try again later.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderValue = (cell) => {
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

    if (loading) return <div className="entry-details loading">Loading details...</div>;
    if (error) return <div className="entry-details error">{error}</div>;
    if (!entryData) {
        return (
            <div className="entry-details">
                <div className="entry-header">
                    <h2>Entry Details</h2>
                    <button onClick={() => navigate(-1)} className="back-button">
                        Back to Summary
                    </button>
                </div>
                <div className="no-data">No entry data available</div>
            </div>
        );
    }

    return (
        <div className="entry-details">
            <div className="entry-header">
                <h2>Entry Details</h2>
                <button onClick={() => navigate(-1)} className="back-button">
                    Back to Summary
                </button>
            </div>
            <div className="entry-content">
                {details && (
                    <div className="details-section">
                        <table>
                            <tbody>
                                {Object.entries(details).map(([key, value], index) => (
                                    <tr key={index}>
                                        <th>{key}</th>
                                        <td>{renderValue(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EntryDetails; 