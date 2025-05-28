import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import './TiterAnalysis.css';
import PercentCVCard from './PercentCV';
import SummaryCard from './DupBG';

// New RawTableCard component
function RawTableCard({
  summary,
  fileIndex,
  sheetIndex,
  customFileName,
  onFileNameChange,
  sampleNames,
  onSampleNameChange,
}) {
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editFileNameValue, setEditFileNameValue] = useState(customFileName || summary.fileName || '');
  const [editingSampleIdx, setEditingSampleIdx] = useState(null);
  const [editSampleValue, setEditSampleValue] = useState('');

  // For sample names, every two columns (excluding the first label column) is a sample
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  // Editable file name logic
  const handleFileNameEdit = () => {
    setEditFileNameValue(customFileName || summary.fileName || '');
    setIsEditingFileName(true);
  };
  const handleFileNameEditSubmit = (e) => {
    e.preventDefault();
    onFileNameChange(editFileNameValue);
    setIsEditingFileName(false);
  };
  const handleFileNameEditCancel = () => {
    setIsEditingFileName(false);
    setEditFileNameValue(customFileName || summary.fileName || '');
  };

  // Editable sample name logic
  const handleSampleEdit = (idx) => {
    setEditSampleValue(sampleNames[idx] || `Sample ${idx + 1}`);
    setEditingSampleIdx(idx);
  };
  const handleSampleEditSubmit = (e) => {
    e.preventDefault();
    onSampleNameChange(editingSampleIdx, editSampleValue);
    setEditingSampleIdx(null);
  };
  const handleSampleEditCancel = () => {
    setEditingSampleIdx(null);
    setEditSampleValue('');
  };

  // Render header row: label column, then sample names (each spanning 2 columns)
  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          {isEditingFileName ? (
            <form onSubmit={handleFileNameEditSubmit} style={{ display: "inline-block" }}>
              <input
                type="text"
                value={editFileNameValue}
                onChange={e => setEditFileNameValue(e.target.value)}
                className="name-edit-input"
                autoFocus
                style={{ fontSize: "1.1rem", fontWeight: "bold" }}
              />
              <button type="submit" className="save-button" style={{ marginLeft: 4 }}>Save</button>
              <button type="button" className="cancel-button" onClick={handleFileNameEditCancel} style={{ marginLeft: 4 }}>Cancel</button>
            </form>
          ) : (
            <>
              <h2>{customFileName || summary.fileName}</h2>
              <button
                onClick={handleFileNameEdit}
                className="edit-button"
                style={{ marginLeft: 8 }}
                title="Edit file name"
              >✎</button>
            </>
          )}
        </div>
        <div style={{ fontSize: "0.95rem", marginTop: 4, color: "#666" }}>
          Plate {sheetIndex + 1}
        </div>
      </div>
      <div className="sheet-summary">
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>{summary.columns[0]}</th>
                {Array.from({ length: sampleCount }).map((_, idx) => (
                  <th key={idx} colSpan={2} style={{ textAlign: 'center' }}>
                    {editingSampleIdx === idx ? (
                      <form onSubmit={handleSampleEditSubmit} style={{ display: "inline-block" }}>
                        <input
                          type="text"
                          value={editSampleValue}
                          onChange={e => setEditSampleValue(e.target.value)}
                          className="name-edit-input"
                          autoFocus
                          style={{ fontSize: "1rem" }}
                        />
                        <button type="submit" className="save-button" style={{ marginLeft: 2, fontSize: "0.9rem" }}>Save</button>
                        <button type="button" className="cancel-button" onClick={handleSampleEditCancel} style={{ marginLeft: 2, fontSize: "0.9rem" }}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        {sampleNames[idx] || `Sample ${idx + 1}`}
                        <button
                          onClick={() => handleSampleEdit(idx)}
                          className="edit-button"
                          style={{ marginLeft: 4, fontSize: "0.9rem" }}
                          title="Edit sample name"
                        >✎</button>
                      </>
                    )}
                  </th>
                ))}
              </tr>
              <tr>
                {summary.columns.map((col, colIdx) => (
                  <th key={colIdx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.preview.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TiterAnalysis() {
  const [excelSummaries, setExcelSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFileNameInput, setShowFileNameInput] = useState(false);
  const [fileName, setFileName] = useState('');
  const [excludedCells, setExcludedCells] = useState(new Set());
  const [customNames, setCustomNames] = useState({});
  // New: sample names per file and sheet: { [fileIndex]: { [sheetIndex]: [sampleName1, sampleName2, ...] } }
  const [sampleNames, setSampleNames] = useState({});
  const DEFAULT_RANGE = 'B25:N33';
  const MULTI_FILE_RANGE = 'A7:M15';

  const getCellColor = (value, rowKey, colKey) => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    const location = `${rowKey}${colKey}`;
    if (excludedCells.has(location)) return 'excluded-cell';
    if (numValue >= 0.5) return 'highlight-green';
    if (numValue < 0.5) return 'highlight-yellow';
  };

  const toggleCellExclusion = (fileIndex, sheetIndex, rowIndex, colIndex, rowKey, colKey) => {
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

  const processExcelFile = (file, isMultiFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetsToProcess = isMultiFile ? [workbook.SheetNames[0]] : workbook.SheetNames;
          const cellRange = isMultiFile ? MULTI_FILE_RANGE : DEFAULT_RANGE;
          const sheetSummaries = sheetsToProcess.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              range: cellRange,
              header: 1,
              defval: '',
              raw: false
            });
            const headers = jsonData[0] || Array(13).fill('');
            const dataRows = jsonData.slice(1);
            return {
              sheetName,
              columns: headers,
              preview: dataRows.slice(0, 9),
              dataRows: dataRows
            };
          });
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

      // Initialize sample names for each file/sheet
      const newSampleNames = {};
      summaries.forEach((summary, fileIdx) => {
        newSampleNames[fileIdx] = {};
        summary.sheets.forEach((sheet, sheetIdx) => {
          const count = Math.floor((sheet.columns.length - 1) / 2);
          newSampleNames[fileIdx][sheetIdx] = Array.from({ length: count }, (_, i) => `Sample ${i + 1}`);
        });
      });
      setSampleNames(newSampleNames);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please make sure they are valid Excel files.');
    } finally {
      setIsLoading(false);
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

  // Download the original preview tables, label sheets as Plate #
  const downloadExcel = async (fileName) => {
    const wb = new ExcelJS.Workbook();
    excelSummaries.forEach((summary, fileIndex) => {
      summary.sheets.forEach((sheet, sheetIndex) => {
        const customName = customNames[fileIndex];
        const sheetName = `Plate ${sheetIndex + 1}`;
        const ws = wb.addWorksheet(sheetName);
        ws.columns = sheet.columns.map(header => ({
          header,
          key: header,
          width: 15
        }));
        sheet.preview.forEach((row, rowIndex) => {
          const rowData = {};
          sheet.columns.forEach((col, colIndex) => {
            if (colIndex === 0) {
              if (rowIndex === 0) {
                rowData[col] = row[colIndex] || '';
              } else {
                rowData[col] = String.fromCharCode(65 + (rowIndex - 1));
              }
            } else {
              rowData[col] = row[colIndex] || '';
            }
          });
          const excelRow = ws.addRow(rowData);
          row.forEach((cell, colIndex) => {
            if (colIndex === 0) return;
            const value = parseFloat(cell);
            if (!isNaN(value)) {
              const colKey = sheet.columns[colIndex] || `Column ${String.fromCharCode(66 + colIndex)}`;
              const letterRowKey = rowIndex === 0 ? row[0] : String.fromCharCode(65 + (rowIndex - 1));
              const location = `${letterRowKey}${colKey}`;
              if (!excludedCells.has(location)) {
                const excelCell = excelRow.getCell(colIndex + 1);
                excelCell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: {
                    argb: value >= 0.5 ? 'FFD4EDDA' : 'FFFFF3CD'
                  }
                };
              }
            }
          });
        });
      });
    });
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
    window.print();
  };

  const handleNameChange = (fileIndex, newName) => {
    setCustomNames(prev => ({
      ...prev,
      [fileIndex]: newName.trim()
    }));
  };

  // Sample name change handler
  const handleSampleNameChange = (fileIdx, sheetIdx, sampleIdx, newName) => {
    setSampleNames(prev => {
      const updated = { ...prev };
      if (!updated[fileIdx]) updated[fileIdx] = {};
      if (!updated[fileIdx][sheetIdx]) updated[fileIdx][sheetIdx] = [];
      updated[fileIdx][sheetIdx] = [...updated[fileIdx][sheetIdx]];
      updated[fileIdx][sheetIdx][sampleIdx] = newName.trim();
      return updated;
    });
  };

  const [activeTab, setActiveTab] = useState({ file: 0, sheet: 0 });

  return (
    <div className="excel-processor">
      <h1>Titer Analysis</h1>
      <div className="upload-section">
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
        {excelSummaries.length > 0 && (
          <div className="sheet-tabs">
            {excelSummaries.map((summary, fileIndex) =>
              summary.sheets.map((sheet, sheetIndex) => {
                const tabLabel = `Plate ${sheetIndex + 1}`;
                const isActive = activeTab.file === fileIndex && activeTab.sheet === sheetIndex;
                return (
                  <button
                    key={`${fileIndex}-${sheetIndex}`}
                    className={`sheet-tab${isActive ? ' active' : ''}`}
                    onClick={() => setActiveTab({ file: fileIndex, sheet: sheetIndex })}
                  >
                    {tabLabel}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading">
          Processing files...
        </div>
      )}

      <div className="main-content">
        {/* Editable Raw Table Card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <RawTableCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              fileIndex={activeTab.file}
              sheetIndex={activeTab.sheet}
              customFileName={customNames[activeTab.file] || excelSummaries[activeTab.file]?.fileName}
              onFileNameChange={newName => handleNameChange(activeTab.file, newName)}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
              onSampleNameChange={(sampleIdx, newName) =>
                handleSampleNameChange(activeTab.file, activeTab.sheet, sampleIdx, newName)
              }
            />
          )}
        {/* Existing summary card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <SummaryCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              fileIndex={activeTab.file}
              excelSummaries={excelSummaries}
              getCellColor={getCellColor}
              toggleCellExclusion={toggleCellExclusion}
              customName={customNames[activeTab.file] || excelSummaries[activeTab.file]?.fileName}
              onNameChange={(newName) => handleNameChange(activeTab.file, newName)}
              plateNumber={activeTab.sheet + 1}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
            />
          )}
        <div className="tables-container">
          {excelSummaries[activeTab.file] &&
            excelSummaries[activeTab.file].sheets &&
            excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
              <PercentCVCard
                summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
                sampleNames={
                  (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                    ? sampleNames[activeTab.file][activeTab.sheet]
                    : []
                }
              />
            )}
        </div>
        <div style={{ marginTop: 24 }}>
          <button onClick={handlePrint} className="print-button">
            Print Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default TiterAnalysis;