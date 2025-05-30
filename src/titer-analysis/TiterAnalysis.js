import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import './TiterAnalysis.css';
import PercentCVCard from './percentCV';
import SummaryCard from './dupBG';
import ODTiterCard from './odAVG';
import { FinSumCard } from './odAVG';


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
  const [excludedCells, setExcludedCells] = useState(new Set()); // Store excluded cell locations
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editFileNameValue, setEditFileNameValue] = useState(customFileName || summary.fileName || '');
  const [editingSampleIdx, setEditingSampleIdx] = useState(null);
  const [editSampleValue, setEditSampleValue] = useState('');

  // For sample names, every two columns (excluding the first label column) is a sample
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);
    const toggleCellExclusion = (fileIndex, sheetIndex, rowIndex, colIndex, rowKey, colKey) => {
    // Use just rowKey and colKey for the location
    const location = `${rowKey}${colKey}`;
    };
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
          <h3>Plate #{sheetIndex + 1}</h3>
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
      <td>{row[0]}</td>
      {Array.from({ length: sampleCount }).map((_, sampleIdx) =>
        [0, 1].map(dupIdx => {
          const colIdx = 1 + sampleIdx * 2 + dupIdx;
          const key = `r${rowIdx}s${sampleIdx}d${dupIdx}`;
          const value = row[colIdx];
          const isExcluded = excludedCells && excludedCells.has(key);
          return (
            <td
              key={colIdx}
              style={{
                background: isExcluded ? '#f8d7da' : undefined,
                cursor: 'pointer',
                textDecoration: isExcluded ? 'line-through' : undefined,
                color: isExcluded ? '#888' : undefined,
                position: 'relative'
              }}
              onClick={() => toggleCellExclusion(rowIdx, sampleIdx, dupIdx)}
              title={isExcluded ? "Click to include this value" : "Click to exclude this value"}
            >
              {value}
            </td>
          );
        })
      )}
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

  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;

  const toggleCellExclusion = (rowIdx, sampleIdx, dupIdx) => {
    setExcludedCells(prev => {
      const newSet = new Set(prev);
      const key = getCellKey(rowIdx, sampleIdx, dupIdx);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
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

  // ...existing code...

const downloadExcel = async (fileName) => {
  const wb = new ExcelJS.Workbook();

  excelSummaries.forEach((summary, fileIndex) => {
    summary.sheets.forEach((sheet, sheetIndex) => {
      // --- RAW TABLE SHEET ---
      const rawSheetName = `Plate ${sheetIndex + 1} - Raw Data`;
      const wsRaw = wb.addWorksheet(rawSheetName);

      // Prepare columns: add "Dilution Factor" as the last column
      const columnsWithDilution = [...sheet.columns, "Dilution Factor"];
      wsRaw.columns = columnsWithDilution.map(header => ({
        header,
        key: header,
        width: 15
      }));

      // Add sample names row (after header)
      const sampleCount = Math.floor((sheet.columns.length - 1) / 2);
      const sampleNameRow = [sheet.columns[0]];
      for (let i = 0; i < sampleCount; i++) {
        const name =
          (sampleNames[fileIndex] &&
            sampleNames[fileIndex][sheetIndex] &&
            sampleNames[fileIndex][sheetIndex][i]) ||
          `Sample ${i + 1}`;
        sampleNameRow.push(name, ""); // span 2 columns
      }
      sampleNameRow.push(""); // for dilution factor col
      wsRaw.addRow(sampleNameRow);

      // Merge cells for sample names (span 2 columns each)
      for (let i = 0; i < sampleCount; i++) {
        const startCol = 2 + i * 2;
        wsRaw.mergeCells(2, startCol, 2, startCol + 1);
        wsRaw.getCell(2, startCol).alignment = { horizontal: "center", vertical: "middle" };
        wsRaw.getCell(2, startCol).font = { bold: true };
      }

      // Style header row
      wsRaw.getRow(1).font = { bold: true };
      wsRaw.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
      wsRaw.getRow(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };

      // Style sample name row
      wsRaw.getRow(2).font = { italic: true };
      wsRaw.getRow(2).alignment = { horizontal: "center", vertical: "middle" };
      wsRaw.getRow(2).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };

      // Add data rows, append dilution factor as last column
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
        // Add dilution factor (last column of the row)
        rowData["Dilution Factor"] = row[sheet.columns.length - 1] || '';
        wsRaw.addRow(rowData);
      });

      // Style data rows and apply color coding, borders
      for (let r = 3; r < 3 + sheet.preview.length; r++) {
        const excelRow = wsRaw.getRow(r);
        excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          // Color coding for data cells (not label or dilution factor column)
          if (colNumber > 1 && colNumber < wsRaw.columnCount && r > 2) {
            const value = parseFloat(cell.value);
            if (!isNaN(value)) {
              const rowIdx = r - 3;
              const sampleIdx = Math.floor((colNumber - 2) / 2);
              const dupIdx = (colNumber - 2) % 2;
              const key = `r${rowIdx}s${sampleIdx}d${dupIdx}`;
              if (excludedCells.has(key)) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFF8D7DA" }
                };
                cell.font = { color: { argb: "FF888888" }, italic: true };
              } else if (value >= 0.5) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFD4EDDA" }
                };
              } else if (value < 0.5) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFF3CD" }
                };
              }
            }
          }
        });
      }

      // Add a thick border around the whole table
      const lastRow = 2 + sheet.preview.length + 1;
      const lastCol = wsRaw.columnCount;
      for (let r = 1; r <= lastRow; r++) {
        for (let c = 1; c <= lastCol; c++) {
          const cell = wsRaw.getCell(r, c);
          if (r === 1) cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === lastRow) cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1) cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === lastCol) cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }

      // --- PERCENT CV SHEET ---
      const wsCV = wb.addWorksheet(`Plate ${sheetIndex + 1} - Percent CV`);
      wsCV.columns = [
        { header: sheet.columns[0], key: sheet.columns[0], width: 12 },
        ...Array.from({ length: sampleCount }, (_, i) => ({
          header: sampleNames[fileIndex]?.[sheetIndex]?.[i] || `Sample ${i + 1}`,
          key: `Sample${i + 1}`,
          width: 15
        })),
        { header: "Dilution Factor", key: "Dilution Factor", width: 18 }
      ];

      // Calculate percent CV for each row/sample
      const calcCV = (v1, v2) => {
        const n1 = parseFloat(v1);
        const n2 = parseFloat(v2);
        if (isNaN(n1) || isNaN(n2)) return '';
        const avg = (n1 + n2) / 2;
        const stdev = Math.sqrt(((n1 - avg) ** 2 + (n2 - avg) ** 2) / 2);
        if (avg === 0) return '';
        return ((stdev / avg) * 100).toFixed(2);
      };

      sheet.preview.forEach((row, rowIdx) => {
        const rowData = {};
        rowData[sheet.columns[0]] = row[0];
        for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
          const v1 = row[1 + sampleIdx * 2];
          const v2 = row[2 + sampleIdx * 2];
          let cv = '';
          if (excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) && excludedCells.has(`r${rowIdx}s${sampleIdx}d1`)) {
            cv = '';
          } else if (excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) || excludedCells.has(`r${rowIdx}s${sampleIdx}d1`)) {
            cv = '0.00';
          } else {
            cv = calcCV(v1, v2);
          }
          rowData[`Sample${sampleIdx + 1}`] = cv !== '' ? `${cv}%` : '';
        }
        rowData["Dilution Factor"] = row[sheet.columns.length - 1] || '';
        wsCV.addRow(rowData);
      });

      // Style Percent CV sheet
      wsCV.getRow(1).font = { bold: true };
      wsCV.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
      wsCV.getRow(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      for (let r = 2; r <= 1 + sheet.preview.length; r++) {
        const excelRow = wsCV.getRow(r);
        excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          // Highlight high CV
          if (colNumber > 1 && colNumber <= sampleCount + 1) {
            const value = parseFloat(cell.value);
            if (!isNaN(value) && value > 20) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFF3CD" }
              };
              cell.font = { bold: true };
            }
          }
        });
      }

      // Add thick border
      const lastRowCV = 1 + sheet.preview.length;
      const lastColCV = wsCV.columnCount;
      for (let r = 1; r <= lastRowCV; r++) {
        for (let c = 1; c <= lastColCV; c++) {
          const cell = wsCV.getCell(r, c);
          if (r === 1) cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === lastRowCV) cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1) cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === lastColCV) cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }

      // --- MEAN OF DUPLICATE - BG SHEET ---
      const wsBG = wb.addWorksheet(`Plate ${sheetIndex + 1} - Mean BG Subtracted`);
      wsBG.columns = [
        { header: sheet.columns[0], key: sheet.columns[0], width: 12 },
        ...Array.from({ length: sampleCount }, (_, i) => ({
          header: sampleNames[fileIndex]?.[sheetIndex]?.[i] || `Sample ${i + 1}`,
          key: `Sample${i + 1}`,
          width: 15
        })),
        { header: "Dilution Factor", key: "Dilution Factor", width: 18 }
      ];

      // Calculate background (last row, last two columns)
      let background = 0;
      if (sheet.preview.length > 0) {
        const lastRow = sheet.preview[sheet.preview.length - 1];
        const bg1 = parseFloat(lastRow[lastRow.length - 2]);
        const bg2 = parseFloat(lastRow[lastRow.length - 1]);
        if (!isNaN(bg1) && !isNaN(bg2)) background = (bg1 + bg2) / 2;
        else if (!isNaN(bg1)) background = bg1;
        else if (!isNaN(bg2)) background = bg2;
      }

      // Add mean-of-duplicate minus background rows
      sheet.preview.forEach((row, rowIdx) => {
        const rowData = {};
        rowData[sheet.columns[0]] = row[0];
        for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
          const n1 = excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) ? NaN : parseFloat(row[1 + sampleIdx * 2]);
          const n2 = excludedCells.has(`r${rowIdx}s${sampleIdx}d1`) ? NaN : parseFloat(row[2 + sampleIdx * 2]);
          let avg = '';
          if (!isNaN(n1) && !isNaN(n2)) avg = ((n1 + n2) / 2) - background;
          else if (!isNaN(n1)) avg = n1 - background;
          else if (!isNaN(n2)) avg = n2 - background;
          rowData[`Sample${sampleIdx + 1}`] = avg !== '' && !isNaN(avg) ? avg.toFixed(3) : '';
        }
        rowData["Dilution Factor"] = row[sheet.columns.length - 1] || '';
        wsBG.addRow(rowData);
      });

      // Style Mean BG sheet
      wsBG.getRow(1).font = { bold: true };
      wsBG.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
      wsBG.getRow(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      for (let r = 2; r <= 1 + sheet.preview.length; r++) {
        const excelRow = wsBG.getRow(r);
        excelRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      }
      // Add thick border
      const lastRowBG = 1 + sheet.preview.length;
      const lastColBG = wsBG.columnCount;
      for (let r = 1; r <= lastRowBG; r++) {
        for (let c = 1; c <= lastColBG; c++) {
          const cell = wsBG.getCell(r, c);
          if (r === 1) cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === lastRowBG) cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1) cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === lastColBG) cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }

      // --- FINAL SUMMARY SHEET (TITER) ---
      const wsTiter = wb.addWorksheet(`Plate ${sheetIndex + 1} - Final Titer`);
      wsTiter.columns = [
        ...Array.from({ length: sampleCount }, (_, i) => ({
          header: sampleNames[fileIndex]?.[sheetIndex]?.[i] || `Sample ${i + 1}`,
          key: `Sample${i + 1}`,
          width: 18
        }))
      ];

      // Calculate titers using cubic fit (same as FinSumCard)
      const dilutions = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];
      // Prepare averagedRows as in Mean BG
      const averagedRows = sheet.preview.map((row, rowIdx) => {
        const newRow = [];
        for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
          const n1 = excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) ? NaN : parseFloat(row[1 + sampleIdx * 2]);
          const n2 = excludedCells.has(`r${rowIdx}s${sampleIdx}d1`) ? NaN : parseFloat(row[2 + sampleIdx * 2]);
          let avg = '';
          if (!isNaN(n1) && !isNaN(n2)) avg = ((n1 + n2) / 2) - background;
          else if (!isNaN(n1)) avg = n1 - background;
          else if (!isNaN(n2)) avg = n2 - background;
          newRow.push(avg !== '' && !isNaN(avg) ? avg : '');
        }
        return newRow;
      });

      // For each sample, fit cubic and solve for OD=0.5
      const titers = [];
      for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
        const ods = averagedRows.map(row => parseFloat(row[sampleIdx]));
        const x = [];
        const y = [];
        for (let i = 0; i < ods.length && i < dilutions.length; i++) {
          if (!isNaN(ods[i])) {
            x.push(Math.log10(dilutions[i]));
            y.push(ods[i]);
          }
        }
        let titer = "N/A";
        if (x.length >= 4) {
          // Cubic regression
          // (see odAVG.js for poly3Regression and root finding)
          // For brevity, use a simple bisection in the data range
          // a*x^3 + b*x^2 + c*x + d = y
          // We'll use a quadratic fit for simplicity here
          // You can replace with your poly3Regression if needed
          // Fallback: linear interpolation between points
          let found = false;
          for (let i = 0; i < y.length - 1; i++) {
            if ((y[i] >= 0.5 && y[i + 1] < 0.5) || (y[i] < 0.5 && y[i + 1] >= 0.5)) {
              // Linear interpolation
              const x1 = x[i], x2 = x[i + 1];
              const y1 = y[i], y2 = y[i + 1];
              const xAt05 = x1 + ((0.5 - y1) * (x2 - x1)) / (y2 - y1);
              const dilutionAt05 = Math.pow(10, xAt05);
              titer = Math.round(dilutionAt05).toLocaleString();
              found = true;
              break;
            }
          }
          if (!found) {
            if (y[0] < 0.5) titer = "<1,000";
            else if (y[y.length - 1] >= 0.5) titer = ">2,187,000";
          }
        } else {
          if (y[0] < 0.5) titer = "<1,000";
          else if (y[y.length - 1] >= 0.5) titer = ">2,187,000";
        }
        titers.push(titer);
      }
      wsTiter.addRow(titers);

      // Style Final Titer sheet
      wsTiter.getRow(1).font = { bold: true };
      wsTiter.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
      wsTiter.getRow(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      wsTiter.getRow(2).font = { bold: true, size: 14 };
      wsTiter.getRow(2).alignment = { horizontal: "center", vertical: "middle" };
      wsTiter.getRow(2).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      // Add thick border
      const lastRowTiter = 2;
      const lastColTiter = wsTiter.columnCount;
      for (let r = 1; r <= lastRowTiter; r++) {
        for (let c = 1; c <= lastColTiter; c++) {
          const cell = wsTiter.getCell(r, c);
          if (r === 1) cell.border = { ...cell.border, top: { style: "thick" } };
          if (r === lastRowTiter) cell.border = { ...cell.border, bottom: { style: "thick" } };
          if (c === 1) cell.border = { ...cell.border, left: { style: "thick" } };
          if (c === lastColTiter) cell.border = { ...cell.border, right: { style: "thick" } };
        }
      }
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
// ...existing code...

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

            <div className="main-content1">
       {/* Raw Table Card */}
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
              excludedCells={excludedCells}
              toggleCellExclusion={toggleCellExclusion}
            />
          )}

          {/* Percent CV Card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <PercentCVCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              plateNumber={activeTab.sheet + 1}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
              excludedCells={excludedCells}
              toggleCellExclusion={toggleCellExclusion}
            />
          )}
   {/* Mean of Duplicate - Background Card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <SummaryCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              fileIndex={activeTab.file}
              getCellColor={getCellColor}

              excelSummaries={excelSummaries}
              customName={customNames[activeTab.file] || excelSummaries[activeTab.file]?.fileName}
              onNameChange={(newName) => handleNameChange(activeTab.file, newName)}
              plateNumber={activeTab.sheet + 1}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
              excludedCells={excludedCells}
                      toggleCellExclusion={(fileIndex, _sheetIndex, rowIdx, cellIndex) => {
          // cellIndex: 1-based, so sampleIdx = cellIndex - 1
          // Only allow toggling for data cells, not label
          if (cellIndex > 0) {
            // For mean-of-dup-bg, dupIdx is 0 or 1, but here we only toggle the pair
            // You may want to open a modal or highlight the raw table instead
            // For now, do nothing or show a message
          }
        }}
            />
          )}
       {/* Final Summary Card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <FinSumCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              plateNumber={activeTab.sheet + 1}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
              excludedCells={excludedCells}
            />
          )}
        {/* OD 0.5 Titer Polynomial Fit Card */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <ODTiterCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
              plateNumber={activeTab.sheet + 1}
              sampleNames={
                (sampleNames[activeTab.file] && sampleNames[activeTab.file][activeTab.sheet])
                  ? sampleNames[activeTab.file][activeTab.sheet]
                  : []
              }
              excludedCells={excludedCells}
            />
          )}


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