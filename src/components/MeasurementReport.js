import React, { useState, useEffect } from 'react';
import { quickbaseService } from '../services/quickbaseService';
import './MeasurementReport.css';

function MeasurementReport({ id }) {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCell, setEditingCell] = useState(null);
    const [editedValue, setEditedValue] = useState('');
    const [validationError, setValidationError] = useState(null);

    // Define which columns should be editable
    const editableColumns = [
        'Value',
        'Unit',
        'Link To File'
        // Add more column names that should be editable
    ];

    // Helper function to safely render cell values
    const renderCellValue = (value) => {
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') {
            // If it's an object with a value property, use that
            if ('value' in value) return value.value;
            // Otherwise stringify the object
            return JSON.stringify(value);
        }
        return String(value);
    };

    // Validation function for different column types
    const validateValue = (columnName, value) => {
        if (columnName === 'Value') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return 'Value must be a valid number';
            }
            return null;
        }
        return null;
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchAdditionalReport(id);
        }
    }, [id]);

    const fetchAdditionalReport = async (id) => {
        try {
            const data = await quickbaseService.getAdditionalReport(id);
            setReportData(data.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching additional report:', error);
            setError('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (rowIndex, columnName, value) => {
        if (editableColumns.includes(columnName)) {
            setEditingCell({ rowIndex, columnName });
            setEditedValue(renderCellValue(value));
            setValidationError(null);
        }
    };

    const handleValueChange = (e) => {
        const newValue = e.target.value;
        setEditedValue(newValue);
        
        // Validate the value as the user types
        if (editingCell) {
            const error = validateValue(editingCell.columnName, newValue);
            setValidationError(error);
        }
    };

    const handleValueSave = async () => {
        if (!editingCell) return;

        const { rowIndex, columnName } = editingCell;
        
        // Validate before saving
        const error = validateValue(columnName, editedValue);
        if (error) {
            setValidationError(error);
            return;
        }

        try {
            // Create a copy of the current data
            const updatedData = [...reportData];
            const recordId = updatedData[rowIndex]['Record ID#'];

            // Update the value in the data
            updatedData[rowIndex][columnName] = editedValue;
            setReportData(updatedData);

            // Save to QuickBase
            await quickbaseService.updateMeasurementValue(recordId, rowIndex, columnName, editedValue);

            // Clear editing state
            setEditingCell(null);
            setEditedValue('');
            setValidationError(null);
        } catch (error) {
            console.error('Error saving value:', error);
            setError('Failed to save changes');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleValueSave();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditedValue('');
            setValidationError(null);
        }
    };

    if (loading) return <div className="loading">Loading report...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!reportData.length) return <div>No data found</div>;

    return (
        <div className="quickbase-report">
            <h2>Measurement Report</h2>
            <div className="report-container">
                {reportData.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(reportData[0]).map((header, index) => (
                                    <th key={index}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {Object.entries(row).map(([columnName, cell], cellIndex) => (
                                        <td 
                                            key={cellIndex}
                                            className={`${editableColumns.includes(columnName) ? 'editable' : ''} 
                                                      ${editingCell?.rowIndex === rowIndex && 
                                                        editingCell?.columnName === columnName ? 'editing' : ''}`}
                                            onClick={() => handleCellClick(rowIndex, columnName, cell)}
                                        >
                                            {editingCell?.rowIndex === rowIndex && 
                                             editingCell?.columnName === columnName ? (
                                                <div className="editing-container">
                                                    <input
                                                        type={columnName === 'Value' ? 'number' : 'text'}
                                                        step="any"
                                                        value={editedValue}
                                                        onChange={handleValueChange}
                                                        onBlur={handleValueSave}
                                                        onKeyDown={handleKeyDown}
                                                        autoFocus
                                                    />
                                                    {validationError && (
                                                        <div className="validation-error">
                                                            {validationError}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                renderCellValue(cell)
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No records found</p>
                )}
            </div>
        </div>
    );
}

export default MeasurementReport; 