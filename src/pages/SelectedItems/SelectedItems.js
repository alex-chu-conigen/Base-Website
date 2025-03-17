import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MeasurementReport from '../../components/MeasurementReport';
import './SelectedItems.css';

function SelectedItems() {
    const [selectedData, setSelectedData] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [vessels, setVessels] = useState({});  // Map of itemIndex -> array of vessels
    const [newVessel, setNewVessel] = useState({ barcode: '', name: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const data = localStorage.getItem('selectedReportData');
        if (!data) {
            navigate('/');
            return;
        }
        const parsedData = JSON.parse(data);
        setSelectedData(parsedData);
        // Initialize vessels state for each item
        const initialVessels = {};
        parsedData.forEach((_, index) => {
            initialVessels[index] = [];
        });
        setVessels(initialVessels);
        // Fetch additional report data
        
    }, [navigate]);

    // Add useEffect to refetch when selectedIndex changes
    useEffect(() => {
        if (selectedData.length > 0) {
            
        }
    }, [selectedIndex, selectedData]);

    const handleBack = () => {
        navigate('/multiple-triad-runs');
    };

    const handleAddVessel = () => {
        if (!newVessel.barcode || !newVessel.name) return;
        
        setVessels(prev => ({
            ...prev,
            [selectedIndex]: [...(prev[selectedIndex] || []), { ...newVessel }]
        }));
        setNewVessel({ barcode: '', name: '' });
    };

    const handleRemoveVessel = (vesselIndex) => {
        setVessels(prev => ({
            ...prev,
            [selectedIndex]: prev[selectedIndex].filter((_, index) => index !== vesselIndex)
        }));
    };

    const handleSubmit = () => {
        // Here you would typically send the vessels data to your backend
        console.log('Submitting vessels:', vessels);
        // TODO: Add API call to save vessels
        alert('Vessels submitted successfully!');
    };

    const renderNavItem = (item, index) => {
        // Get a suitable title from the item data
        const title = item['Procedure Record - Project Name'] || Object.values(item)[0];
        return (
            <div 
                key={index}
                className={`nav-item ${index === selectedIndex ? 'active' : ''}`}
                onClick={() => setSelectedIndex(index)}
            >
                <span className="nav-item-title">{title}</span>
            </div>
        );
    };

    const renderDetailView = (item) => {
        if (!item) return null;
        return (
            <div className="detail-content">
                <div className="details-section">
                    <h3>Details</h3>
                    <table>
                        <tbody>
                            {Object.entries(item).map(([key, value], index) => (
                                <tr key={index}>
                                    <th>{key}</th>
                                    <td>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bottom-section">
                    <div className="vessels-section">
                        <h3>Vessels</h3>
                        <div className="vessels-list">
                            {vessels[selectedIndex]?.map((vessel, index) => (
                                <div key={index} className="vessel-item">
                                    <span>Barcode: {vessel.barcode}</span>
                                    <span>Name: {vessel.name}</span>
                                    <button 
                                        onClick={() => handleRemoveVessel(index)}
                                        className="remove-vessel-button"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="add-vessel-form">
                            <input
                                type="text"
                                placeholder="Barcode"
                                value={newVessel.barcode}
                                onChange={(e) => setNewVessel(prev => ({ ...prev, barcode: e.target.value }))}
                            />
                            <input
                                type="text"
                                placeholder="Name"
                                value={newVessel.name}
                                onChange={(e) => setNewVessel(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <button onClick={handleAddVessel} className="add-vessel-button">
                                Add Vessel
                            </button>
                        </div>
                    </div>

                    <div className="report-panel">
                        <h3>Additional Report</h3>
                        <div className="report-container">
                            <MeasurementReport id={selectedData[selectedIndex]?.['Record ID#']}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="selected-items">
            <div className="selected-items-header">
                <h2>Selected Items ({selectedData.length})</h2>
                <button onClick={handleBack} className="back-button">
                    Back to Report
                </button>
            </div>
            <div className="selected-items-content">
                <div className="navigation-pane">
                    {selectedData.map((item, index) => renderNavItem(item, index))}
                </div>
                <div className="detail-pane">
                    {selectedData.length > 0 ? (
                        <>
                            {renderDetailView(selectedData[selectedIndex])}
                            <div className="submit-section">
                                <button 
                                    onClick={handleSubmit} 
                                    className="submit-button"
                                    disabled={Object.values(vessels).every(arr => arr.length === 0)}
                                >
                                    Submit All Vessels
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="no-items">No items selected</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SelectedItems; 