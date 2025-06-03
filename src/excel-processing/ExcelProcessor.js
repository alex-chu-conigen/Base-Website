import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SummaryCard from './SummaryCard';
import './ExcelProcessor.css';

function ExcelProcessor() {
  const [excelSummaries, setExcelSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lowerThreshold, setLowerThreshold] = useState('');
  const [higherThreshold, setHigherThreshold] = useState('');
  const [showFileNameInput, setShowFileNameInput] = useState(false);
  const [fileName, setFileName] = useState('');
  const [excludedCells, setExcludedCells] = useState(new Set()); // Store excluded cell locations
  const [customNames, setCustomNames] = useState({}); // Store custom names for each file
  const DEFAULT_RANGE = 'B25:N33'; // Default range for single file
  const MULTI_FILE_RANGE = 'A7:M15'; // Range for multiple files

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCellColor = (value, rowKey, colKey) => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    // Check if cell is excluded - now using just rowKey and colKey
    const location = `${rowKey}${colKey}`;
    if (excludedCells.has(location)) return 'excluded-cell';
    
    if (numValue >= parseFloat(higherThreshold)) return 'highlight-green';
    if (numValue >= parseFloat(lowerThreshold)) return 'highlight-yellow';
    return '';
  };

  const toggleCellExclusion = (fileIndex, sheetIndex, rowIndex, colIndex, rowKey, colKey) => {
    // Use just rowKey and colKey for the location
    const location = `${rowKey}${colKey}`;
    
    setExcludedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(location)) {
        newSet.delete(location);
      } else {
        newSet.add(location);
      }
      return newSet;
    });
  };

  const getThresholdSummary = (data, sheetName, headers, fileIndex) => {
    if (!lowerThreshold && !higherThreshold) return [];
    
    const summary = [];
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Skip the first data point (C25)
        if (rowIndex === 0 && colIndex === 0) return;
        
        if (cell === '') return;
        const numValue = parseFloat(cell);
        if (isNaN(numValue)) return;
        
        const rowKey = data[rowIndex][0] || `Row ${rowIndex + 1}`;
        const colKey = headers[colIndex] || `Column ${String.fromCharCode(66 + colIndex)}`;
        const location = `${rowKey}${colKey}`;
        
        // Skip excluded cells
        if (excludedCells.has(location)) return;
        
        if (higherThreshold && numValue >= parseFloat(higherThreshold)) {
          summary.push({
            value: numValue,
            rowKey,
            colKey,
            threshold: 'higher',
            sheetName
          });
        } else if (lowerThreshold && numValue >= parseFloat(lowerThreshold)) {
          summary.push({
            value: numValue,
            rowKey,
            colKey,
            threshold: 'lower',
            sheetName
          });
        }
      });
    });
    return summary;
  };

  const getAllThresholdSummaries = () => {
    if (!excelSummaries.length) return [];
    
    const allSummaries = [];
    excelSummaries.forEach((summary, fileIndex) => {
      summary.sheets.forEach((sheet, sheetIndex) => {
        const sheetSummaries = getThresholdSummary(sheet.dataRows, sheet.sheetName, sheet.columns, fileIndex);
        allSummaries.push(...sheetSummaries.map(item => ({
          ...item,
          fileNumber: fileIndex + 1,
          sheetNumber: sheetIndex + 1,
          customName: customNames[fileIndex] // Add custom name to summary items
        })));
      });
    });
    
    return allSummaries.sort((a, b) => {
      if (a.fileNumber !== b.fileNumber) {
        return a.fileNumber - b.fileNumber;
      }
      if (a.sheetNumber !== b.sheetNumber) {
        return a.sheetNumber - b.sheetNumber;
      }
      if (a.rowKey !== b.rowKey) {
        return a.rowKey.localeCompare(b.rowKey);
      }
      const aColNum = parseInt(a.colKey.replace(/\D/g, '')) || 0;
      const bColNum = parseInt(b.colKey.replace(/\D/g, '')) || 0;
      return aColNum - bColNum;
    });
  };

  const processExcelFile = (file, isMultiFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Determine which sheets to process
          const sheetsToProcess = isMultiFile ? [workbook.SheetNames[0]] : workbook.SheetNames;
          const cellRange = isMultiFile ? MULTI_FILE_RANGE : DEFAULT_RANGE;
          
          // Process sheets
          const sheetSummaries = sheetsToProcess.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            
            // Get the data for the specified range
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              range: cellRange,
              header: 1, // This will give us raw data with headers as first row
              defval: '', // Use empty string for empty cells
              raw: false // Convert all values to strings
            });

            // Get headers from first row or create empty headers if no data
            const headers = jsonData[0] || Array(13).fill(''); // 13 columns
            const dataRows = jsonData.slice(1); // Skip the header row

            // Create summary for this sheet
            return {
              sheetName,
              columns: headers,
              preview: dataRows.slice(0, 9), // Show all rows since we know there are 9
              dataRows: dataRows // Store the full data for threshold processing
            };
          });

          // Create overall file summary
          const summary = {
            fileName: file.name,
            sheets: sheetSummaries
          };

          resolve(summary);
        } catch (error) {
          console.error('Error processing file:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    setIsLoading(true);
    try {
      const isMultiFile = files.length > 1;
      const summaries = await Promise.all(
        Array.from(files).map(file => processExcelFile(file, isMultiFile))
      );
      setExcelSummaries(summaries);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please make sure they are valid Excel files.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThresholdChange = (event, setter) => {
    const value = event.target.value;
    if (value === '' || !isNaN(value)) {
      setter(value);
    }
  };

  const handleDownloadClick = () => {
    setShowFileNameInput(true);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleFileNameSubmit = (e) => {
    e.preventDefault();
    if (fileName.trim()) {
      downloadExcel(fileName.trim()).catch(error => {
        console.error('Error downloading Excel file:', error);
        alert('Error creating Excel file. Please try again.');
      });
      setShowFileNameInput(false);
      setFileName('');
    }
  };

  const downloadExcel = async (fileName) => {
    // Create a new workbook
    const wb = new ExcelJS.Workbook();
    
    // Add the threshold summary sheet
    const thresholdWs = wb.addWorksheet('Threshold Summary');
    
    // Set up columns
    thresholdWs.columns = [
      { header: 'Location', key: 'location', width: 25 }, // Increased width for custom names
      { header: 'Value', key: 'value', width: 15 }
    ];

    // Add data
    const isSingleFile = excelSummaries.length === 1;
    const thresholdData = getAllThresholdSummaries().map(item => {
      const rowLetter = item.rowKey.match(/[A-Za-z]+/)?.[0] || item.rowKey;
      const colNumber = item.colKey.match(/\d+/)?.[0] || item.colKey;
      const location = `${isSingleFile ? item.sheetNumber : item.fileNumber}${rowLetter}${colNumber}`;
      const displayLocation = item.customName ? `${item.customName} - ${location}` : location;
      
      return {
        location: displayLocation,
        value: item.value
      };
    });

    // Add rows and apply conditional formatting
    thresholdData.forEach(row => {
      const excelRow = thresholdWs.addRow(row);
      const value = parseFloat(row.value);
      if (!isNaN(value)) {
        const cell = excelRow.getCell(2); // Value column
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: value >= parseFloat(higherThreshold) ? 'FFD4EDDA' : // Green
                  value >= parseFloat(lowerThreshold) ? 'FFFFF3CD' : // Yellow
                  'FFFFFFFF' // White
          }
        };
      }
    });

    // Add individual file sheets
    excelSummaries.forEach((summary, fileIndex) => {
      summary.sheets.forEach((sheet, sheetIndex) => {
        // Use custom name for sheet name if available, otherwise use default
        const customName = customNames[fileIndex];
        const sheetName = customName 
          ? `${customName}_Sheet${sheetIndex + 1}`
          : `File${fileIndex + 1}_Sheet${sheetIndex + 1}`;
        
        const ws = wb.addWorksheet(sheetName);
        
        // Add headers
        ws.columns = sheet.columns.map(header => ({
          header,
          key: header,
          width: 15
        }));

        // Add data rows and apply conditional formatting
        sheet.preview.forEach((row, rowIndex) => {
          const rowData = {};
          
          // Add data for each column
          sheet.columns.forEach((col, colIndex) => {
            // For the first column, use letters starting from 'A' at row 2
            if (colIndex === 0) {
              // If it's the first row, use the original header
              if (rowIndex === 0) {
                rowData[col] = row[colIndex] || '';
              } else {
                // For subsequent rows, use letters (A starts at row 2)
                rowData[col] = String.fromCharCode(65 + (rowIndex - 1)); // 65 is ASCII for 'A'
              }
            } else {
              rowData[col] = row[colIndex] || '';
            }
          });
          
          const excelRow = ws.addRow(rowData);
          
          // Apply conditional formatting to each cell
          row.forEach((cell, colIndex) => {
            if (colIndex === 0) return; // Skip the first column since it's now letters
            
            const value = parseFloat(cell);
            if (!isNaN(value)) {
              const colKey = sheet.columns[colIndex] || `Column ${String.fromCharCode(66 + colIndex)}`;
              // Use the new letter-based row key for location
              const letterRowKey = rowIndex === 0 ? row[0] : String.fromCharCode(65 + (rowIndex - 1));
              const location = `${letterRowKey}${colKey}`;
              
              // Only apply highlighting if the cell is not excluded
              if (!excludedCells.has(location)) {
                const excelCell = excelRow.getCell(colIndex + 1);
                excelCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {
                    argb: value >= parseFloat(higherThreshold) ? 'FFD4EDDA' : // Green
                          value >= parseFloat(lowerThreshold) ? 'FFFFF3CD' : // Yellow
                          'FFFFFFFF' // White
                  }
                };
              }
            }
          });
        });
      });
    });

    // Save the file
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const tablesContent = document.querySelector('.tables-container').innerHTML;
    const summaryContent = document.querySelector('.global-threshold-summary1').innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Excel Summary</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .print-layout {
              display: flex;
              gap: 2rem;
            }
            .tables-section {
              flex: 1;
            }
            .summary-section {
              width: 300px;
            }
            .summary-card {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              padding: 1rem;
              margin-bottom: 1rem;
            }
            .summary-card h2 {
              margin: 0 0 1rem 0;
              font-size: 1.2rem;
              color: #333;
            }
            .sheet-summary {
              margin-bottom: 1.5rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.85rem;
              margin-bottom: 1rem;
            }
            th, td {
              padding: 4px 6px;
              border: 1px solid #ddd;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .highlight-yellow {
              background-color: #fff3cd;
            }
            .highlight-green {
              background-color: #d4edda;
            }
            .summary-list {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            .summary-item {
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.8rem;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-layout {
                display: flex;
                gap: 2rem;
              }
              .summary-card, .summary-section {
                break-inside: avoid;
              }
              table {
                break-inside: avoid;
              }
              .summary-item {
                break-inside: avoid;
              }
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-layout">
            <div class="tables-section">
              ${tablesContent}
            </div>
            <div class="summary-section">
              ${summaryContent}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = parseInt(active.id.split('-')[1]);
      const newIndex = parseInt(over.id.split('-')[1]);

      setExcelSummaries((items) => arrayMove(items, oldIndex, newIndex));
      
      // Update custom names to maintain the association with moved tables
      setCustomNames(prev => {
        const newCustomNames = {};
        const oldNames = { ...prev };
        
        // Create array of indices to help with reordering
        const indices = Object.keys(oldNames).map(Number);
        if (indices.length === 0) return prev;
        
        // Reorder the indices
        const reorderedIndices = arrayMove(indices, oldIndex, newIndex);
        
        // Create new mapping with reordered indices
        reorderedIndices.forEach((oldIdx, newIdx) => {
          if (oldNames[oldIdx] !== undefined) {
            newCustomNames[newIdx] = oldNames[oldIdx];
          }
        });
        
        return newCustomNames;
      });
    }
  };

  // Add function to handle name updates
  const handleNameChange = (fileIndex, newName) => {
    setCustomNames(prev => ({
      ...prev,
      [fileIndex]: newName.trim()
    }));
  };

  return (
    <div className="excel-processor">
      <h1>Excel File Processor</h1>
      <div className="upload-section">
        <div className="threshold-inputs">
          <div className="threshold-input">
            <label htmlFor="lowerThreshold">Lower Threshold:</label>
            <input
              type="text"
              id="lowerThreshold"
              value={lowerThreshold}
              onChange={(e) => handleThresholdChange(e, setLowerThreshold)}
              placeholder="Enter lower threshold"
              className="threshold-field"
            />
          </div>
          <div className="threshold-input">
            <label htmlFor="higherThreshold">Higher Threshold:</label>
            <input
              type="text"
              id="higherThreshold"
              value={higherThreshold}
              onChange={(e) => handleThresholdChange(e, setHigherThreshold)}
              placeholder="Enter higher threshold"
              className="threshold-field"
            />
          </div>
        </div>
        <div className="file-controls">
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="file-input"
          />
          {excelSummaries.length > 0 && (
            <div className="download-section">
              {showFileNameInput ? (
                <form onSubmit={handleFileNameSubmit} className="file-name-form">
                  <input
                    type="text"
                    value={fileName}
                    onChange={handleFileNameChange}
                    placeholder="Enter file name"
                    className="file-name-input"
                    autoFocus
                  />
                  <button type="submit" className="save-button">Save</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowFileNameInput(false);
                      setFileName('');
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button 
                  onClick={handleDownloadClick}
                  className="download-button"
                >
                  Download Summary
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="loading">
          Processing files...
        </div>
      )}

      <div className="main-content2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="tables-container">
            <SortableContext
              items={excelSummaries.map((_, index) => `file-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              {excelSummaries.map((summary, fileIndex) => (
                <SummaryCard
                  key={`file-${fileIndex}`}
                  summary={summary}
                  fileIndex={fileIndex}
                  excelSummaries={excelSummaries}
                  getCellColor={getCellColor}
                  toggleCellExclusion={toggleCellExclusion}
                  customName={customNames[fileIndex] || ''}
                  onNameChange={(newName) => handleNameChange(fileIndex, newName)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
        {excelSummaries.length > 0 && (
          <div className="global-threshold-summary1">
            <div className="summary-header1">
              <h4>Combined Threshold Summary</h4>
              <button onClick={handlePrint} className="print-button">
                Print Summary
              </button>
            </div>
            <div className="summary-list">
              {getAllThresholdSummaries().map((item, index) => {
                const rowLetter = item.rowKey.match(/[A-Za-z]+/)?.[0] || item.rowKey;
                const colNumber = item.colKey.match(/\d+/)?.[0] || item.colKey;
                const isSingleFile = excelSummaries.length === 1;
                const location = `${isSingleFile ? item.sheetNumber : item.fileNumber}${rowLetter}${colNumber}`;
                const displayLocation = item.customName ? `${item.customName} - ${location}` : location;
                
                return (
                  <div 
                    key={index} 
                    className={`summary-item ${item.threshold === 'higher' ? 'highlight-green' : 'highlight-yellow'}`}
                  >
                    {displayLocation}: {item.value}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExcelProcessor; 