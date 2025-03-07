import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './ExcelProcessor.css';

function ExcelProcessor() {
  const [excelSummaries, setExcelSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lowerThreshold, setLowerThreshold] = useState('');
  const [higherThreshold, setHigherThreshold] = useState('');
  const [showFileNameInput, setShowFileNameInput] = useState(false);
  const [fileName, setFileName] = useState('');
  const DEFAULT_RANGE = 'B25:N33'; // Default range for single file
  const MULTI_FILE_RANGE = 'A7:M15'; // Range for multiple files

  const getCellColor = (value) => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    if (numValue >= parseFloat(higherThreshold)) return 'highlight-green';
    if (numValue >= parseFloat(lowerThreshold)) return 'highlight-yellow';
    return '';
  };

  const getThresholdSummary = (data, sheetName, headers) => {
    if (!lowerThreshold && !higherThreshold) return [];
    
    const summary = [];
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Skip the first data point (C25)
        if (rowIndex === 0 && colIndex === 0) return;
        
        if (cell === '') return;
        const numValue = parseFloat(cell);
        if (isNaN(numValue)) return;
        
        if (higherThreshold && numValue >= parseFloat(higherThreshold)) {
          summary.push({
            value: numValue,
            rowKey: data[rowIndex][0] || `Row ${rowIndex + 1}`, // Use first column value or fallback
            colKey: headers[colIndex] || `Column ${String.fromCharCode(66 + colIndex)}`, // Use header or fallback
            threshold: 'higher',
            sheetName
          });
        } else if (lowerThreshold && numValue >= parseFloat(lowerThreshold)) {
          summary.push({
            value: numValue,
            rowKey: data[rowIndex][0] || `Row ${rowIndex + 1}`,
            colKey: headers[colIndex] || `Column ${String.fromCharCode(66 + colIndex)}`,
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
        const sheetSummaries = getThresholdSummary(sheet.dataRows, sheet.sheetName, sheet.columns);
        allSummaries.push(...sheetSummaries.map(item => ({
          ...item,
          fileNumber: fileIndex + 1, // Add file number starting from 1
          sheetNumber: sheetIndex + 1 // Add sheet number starting from 1
        })));
      });
    });
    
    // Sort by file number (numeric), then sheet number (numeric), then row key (alphabetical), then column key (numeric)
    return allSummaries.sort((a, b) => {
      // First sort by file number
      if (a.fileNumber !== b.fileNumber) {
        return a.fileNumber - b.fileNumber;
      }
      
      // Then sort by sheet number
      if (a.sheetNumber !== b.sheetNumber) {
        return a.sheetNumber - b.sheetNumber;
      }
      
      // Then sort by row key (alphabetical)
      if (a.rowKey !== b.rowKey) {
        return a.rowKey.localeCompare(b.rowKey);
      }
      
      // Finally sort by column key (numeric)
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
      downloadExcel(fileName.trim());
      setShowFileNameInput(false);
      setFileName('');
    }
  };

  const downloadExcel = (fileName) => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Add the threshold summary sheet
    const isSingleFile = excelSummaries.length === 1;
    const thresholdData = getAllThresholdSummaries().map(item => {
      // Extract just the letter/number parts from rowKey and colKey
      const rowLetter = item.rowKey.match(/[A-Za-z]+/)?.[0] || item.rowKey;
      const colNumber = item.colKey.match(/\d+/)?.[0] || item.colKey;
      
      return {
        'Location': `${isSingleFile ? item.sheetNumber : item.fileNumber}${rowLetter}${colNumber}`,
        'Value': item.value
      };
    });

    const thresholdWs = XLSX.utils.json_to_sheet(thresholdData);
    
    // Add highlighting to the Value column
    const range = XLSX.utils.decode_range(thresholdWs['!ref']);
    for (let R = 1; R <= range.e.r; ++R) {
      const valueCell = thresholdWs[XLSX.utils.encode_cell({ r: R, c: 1 })]; // Value is in column B
      if (valueCell) {
        const value = parseFloat(valueCell.v);
        if (!isNaN(value)) {
          valueCell.s = {
            fill: {
              fgColor: {
                rgb: value >= parseFloat(higherThreshold) ? "D4EDDA" : // Green
                      value >= parseFloat(lowerThreshold) ? "FFF3CD" : // Yellow
                      "FFFFFF" // White
              }
            }
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, thresholdWs, 'Threshold Summary');

    // Add individual file sheets
    excelSummaries.forEach((summary, fileIndex) => {
      summary.sheets.forEach((sheet, sheetIndex) => {
        // Create sheet data with headers
        const sheetData = sheet.preview.map(row => {
          const rowData = {};
          sheet.columns.forEach((col, colIndex) => {
            rowData[col] = row[colIndex] || '';
          });
          return rowData;
        });

        const ws = XLSX.utils.json_to_sheet(sheetData);
        
        // Add highlighting to all cells in the sheet
        const sheetRange = XLSX.utils.decode_range(ws['!ref']);
        for (let R = 1; R <= sheetRange.e.r; ++R) {
          for (let C = 0; C <= sheetRange.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell) {
              const value = parseFloat(cell.v);
              if (!isNaN(value)) {
                cell.s = {
                  fill: {
                    fgColor: {
                      rgb: value >= parseFloat(higherThreshold) ? "D4EDDA" : // Green
                            value >= parseFloat(lowerThreshold) ? "FFF3CD" : // Yellow
                            "FFFFFF" // White
                    }
                  }
                };
              }
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, `File${fileIndex + 1}_Sheet${sheetIndex + 1}`);
      });
    });

    // Save the file with user-provided name
    XLSX.writeFile(wb, `${fileName}.xlsx`);
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

      <div className="main-content">
        <div className="tables-container">
          {excelSummaries.map((summary, fileIndex) => (
            <div key={fileIndex} className="summary-card">
              <h2>{summary.fileName}</h2>
              {summary.sheets.map((sheet, sheetIndex) => (
                <div key={sheetIndex} className="sheet-summary">
                  {excelSummaries.length === 1 && <h3>Sheet: {sheet.sheetName}</h3>}
                  <div className="preview-table">
                    <table>
                      <thead>
                        <tr>
                          {sheet.columns.map((col, colIndex) => (
                            <th key={colIndex}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.preview.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex}
                                className={getCellColor(cell)}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {excelSummaries.length > 0 && (
          <div className="global-threshold-summary">
            <h4>Combined Threshold Summary</h4>
            <div className="summary-list">
              {getAllThresholdSummaries().map((item, index) => {
                const rowLetter = item.rowKey.match(/[A-Za-z]+/)?.[0] || item.rowKey;
                const colNumber = item.colKey.match(/\d+/)?.[0] || item.colKey;
                const isSingleFile = excelSummaries.length === 1;
                const location = `${isSingleFile ? item.sheetNumber : item.fileNumber}${rowLetter}${colNumber}`;
                
                return (
                  <div 
                    key={index} 
                    className={`summary-item ${item.threshold === 'higher' ? 'highlight-green' : 'highlight-yellow'}`}
                  >
                    {location}: {item.value}
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