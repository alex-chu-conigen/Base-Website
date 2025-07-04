import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import PercentCVCard from './percentCV';
import SummaryCard from './dupBG';
import ODTiterCard from './odAVG';
import styles from './TiterAnalysis.module.css';
import { FinSumCard } from './odAVG';
import { saveAs } from 'file-saver';
import { useRef } from 'react';



// New RawTableCard component
function RawTableCard({
  summary,

  customFileName,
  onFileNameChange,
  plateName,
  onPlateNameChange,
  sampleNames,
  onSampleNameChange,
}) {
  const dilutionFactors = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];

  const [excludedCells, setExcludedCells] = useState(new Set()); // Store excluded cell locations
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editFileNameValue, setEditFileNameValue] = useState(customFileName || summary.fileName || '');
  const [editingSampleIdx, setEditingSampleIdx] = useState(null);
  const [editSampleValue, setEditSampleValue] = useState('');
  const [isEditingPlateName, setIsEditingPlateName] = useState(false);
  const [editPlateNameValue, setEditPlateNameValue] = useState(plateName);

  const handlePlateNameEdit = () => {
    setEditPlateNameValue(plateName);
    setIsEditingPlateName(true);
  };
  const handlePlateNameEditSubmit = (e) => {
    e.preventDefault();
    onPlateNameChange(editPlateNameValue);
    setIsEditingPlateName(false);
  };
  const handlePlateNameEditCancel = () => {
    setIsEditingPlateName(false);
    setEditPlateNameValue(plateName);
  };

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
    <div className={styles.summary_card}>
      <div className={styles.card_header}>
        <div className={styles.card_title}>
          {isEditingFileName ? (
            <form onSubmit={handleFileNameEditSubmit} style={{ display: "inline-block" }}>
              <input
                type="text"
                value={editFileNameValue}
                onChange={e => setEditFileNameValue(e.target.value)}
                className={styles.name_edit_input}
                autoFocus
                style={{ fontSize: "1.1rem", fontWeight: "bold" }}
              />
              <button type="submit" className={styles.save_button} style={{ marginLeft: 4 }}>Save</button>
              <button type="button" className={styles.cancel_button} onClick={handleFileNameEditCancel} style={{ marginLeft: 4 }}>Cancel</button>
            </form>
          ) : (
            <>
              <h2>{customFileName || summary.fileName}</h2>
              <button
                onClick={handleFileNameEdit}
                className={styles.edit_button}
                style={{ marginLeft: 8 }}
                title="Edit file name"
              >✎</button>
            </>
          )}
        </div>
        <div style={{ fontSize: "0.95rem", marginTop: 4, color: "#666" }}>
            <div style={{ fontSize: "0.95rem", marginTop: 4, color: "#666" }}>
    {isEditingPlateName ? (
      <form onSubmit={handlePlateNameEditSubmit} style={{ display: "inline-block" }}>
        <input
          type="text"
          value={editPlateNameValue}
          onChange={e => setEditPlateNameValue(e.target.value)}
          className={styles.name_edit_input}
          autoFocus
          style={{ fontSize: "1rem" }}
        />
        <button type="submit" className={styles.save_button} style={{ marginLeft: 2, fontSize: "0.9rem" }}>Save</button>
        <button type="button" className={styles.cancel_button} onClick={handlePlateNameEditCancel} style={{ marginLeft: 2, fontSize: "0.9rem" }}>Cancel</button>
      </form>
    ) : (
      <>
        <h3 style={{ display: "inline" }}>{plateName}</h3>
        <button
          onClick={handlePlateNameEdit}
          className={styles.edit_button}
          style={{ marginLeft: 4, fontSize: "0.9rem" }}
          title="Edit plate name"
        >✎</button>
      </>
    )}
  </div>
        </div>
      </div>
      <div className={styles.sheet_summary}>
        <div className={styles.preview_table_titer}>
          <table>
            <thead>
              <tr>
      <th>Dilution Factor</th>
    {Array.from({ length: sampleCount }).map((_, idx) => (
      <th key={idx} colSpan={2} style={{ textAlign: 'center' }}>
        {editingSampleIdx === idx ? (
                      <form onSubmit={handleSampleEditSubmit} style={{ display: "inline-block" }}>
                        <input
                          type="text"
                          value={editSampleValue}
                          onChange={e => setEditSampleValue(e.target.value)}
                          className={styles.name_edit_input}
                          autoFocus
                          style={{ fontSize: "0.5vw" }}
                        />
                        <button type="submit" className={styles.save_button} style={{ marginLeft: 2, fontSize: "0.9rem" }}>Save</button>
                        <button type="button" className={styles.cancel_button} onClick={handleSampleEditCancel} style={{ marginLeft: 2, fontSize: "0.9rem" }}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        {sampleNames[idx] || `Sample ${idx + 1}`}
                        <button
                          onClick={() => handleSampleEdit(idx)}
                          className={styles.edit_button}
                          style={{ marginLeft: 4, fontSize: "0.9rem" }}
                          title="Edit sample name"
                        >✎</button>
                      </>
                    )}
                  </th>
                ))}
              </tr>
              <tr>
              </tr>
            </thead>
            <tbody>
              {summary.preview.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td>{dilutionFactors[rowIdx] || ''}</td>
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
                            background: isExcluded ? '#ff5c40 ' : undefined,
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
  const [showInstructions, setShowInstructions] = useState(true);
  const [editingTab, setEditingTab] = useState({ file: null, sheet: null });
  const [editingTabValue, setEditingTabValue] = useState('');
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
  const finalTableRef = useRef(null);

  

  const getCellColor = (value, rowKey, colKey) => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    const location = `${rowKey}${colKey}`;
    if (excludedCells.has(location)) return 'excluded-cell';
    if (numValue >= 0.5) return styles.highlight_green;
    if (numValue < 0.5) return styles.highlight_yellow;
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
    setShowInstructions(false);
    setIsLoading(true);
    setExcludedCells(new Set());
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
  // Get the current file name (custom or original) for the active tab
  const currentCustomName = customNames[activeTab.file];
  const defaultName =
    currentCustomName ||
    excelSummaries[activeTab.file]?.fileName ||
    "TiterAnalysis";
  setFileName(defaultName);
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
  const wb = new ExcelJS.Workbook();

  excelSummaries.forEach((summary, fileIndex) => {
    summary.sheets.forEach((sheet, sheetIndex) => {
      const ws = wb.addWorksheet(
      (plateNames[fileIndex] && plateNames[fileIndex][sheetIndex]) ||
      `Plate ${sheetIndex + 1}`
     );

      let currentRow = 1;
      const dilutionFactors = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];
      const sampleCount = Math.floor((sheet.columns.length - 1) / 2);
      const totalCols = 1 + sampleCount * 2;

      // --- RAW DATA TABLE ---
      ws.mergeCells(currentRow, 1, currentRow, totalCols);
      ws.getCell(currentRow, 1).value = "Raw Data";
      ws.getCell(currentRow, 1).font = { bold: true, size: 14 };
      ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE5B4" } };
      ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
      currentRow++;

      const sampleNameRow = ["Dilution Factor"];
      for (let i = 0; i < sampleCount; i++) {
        const name =
          (sampleNames[fileIndex] &&
            sampleNames[fileIndex][sheetIndex] &&
            sampleNames[fileIndex][sheetIndex][i]) ||
          `Sample ${i + 1}`;
        sampleNameRow.push(name, "");
      }
      ws.addRow(sampleNameRow);

      for (let i = 0; i < sampleCount; i++) {
        const startCol = 2 + i * 2;
        ws.mergeCells(currentRow, startCol, currentRow, startCol + 1);
        ws.getCell(currentRow, startCol).alignment = { horizontal: "center", vertical: "middle" };
        ws.getCell(currentRow, startCol).font = { italic: true };
        ws.getCell(currentRow, startCol).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6E0" } };
      }
      ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6E0" } };
      ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(currentRow).height = 22;
      ws.columns.forEach((col, idx) => {
        ws.getColumn(idx + 1).width = 24;
      });
      currentRow++;

sheet.preview.forEach((row, rowIndex) => {
  const rowData = [dilutionFactors[rowIndex] || ''];
  for (let i = 0; i < sampleCount; i++) {
    rowData.push(row[1 + i * 2], row[2 + i * 2]);
  }
  const excelRow = ws.addRow(rowData);
  excelRow.eachCell((cell, colNumber) => {
    // Alternating row background
    cell.fill = ((rowIndex % 2) === 0)
      ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } }
      : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };

    // Cross out excluded cells
    if (colNumber > 1) {
      // Calculate sampleIdx and dupIdx from colNumber
      const zeroBased = colNumber - 2;
      const sampleIdx = Math.floor(zeroBased / 2);
      const dupIdx = zeroBased % 2;
      const key = `r${rowIndex}s${sampleIdx}d${dupIdx}`;
      if (excludedCells.has(key)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { rgb: "f5a4c3" } }; // light red for excluded
      }
    }
  });
});

      for (let r = currentRow; r <= currentRow + sheet.preview.length; r++) {
        ws.getRow(r).alignment = { horizontal: "center", vertical: "middle" };
      }
      currentRow += sheet.preview.length;

      // Border for RAW DATA table
      for (let r = currentRow - sheet.preview.length; r < currentRow; r++) {
        ws.getRow(r).eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: r === currentRow - sheet.preview.length ? "thick" : "thin" },
            left: { style: colNumber === 1 ? "thick" : "thin" },
            bottom: { style: r === currentRow - 1 ? "thick" : "thin" },
            right: { style: colNumber === totalCols ? "thick" : "thin" }
          };
        });
        ws.getRow(r).eachCell(cell => {
          cell.fill = cell.fill || {};
          cell.fill = ((r - (currentRow - sheet.preview.length)) % 2 === 0)
            ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } }
            : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        });
      }
      currentRow++;

      // --- PERCENT CV TABLE ---
      ws.mergeCells(currentRow, 1, currentRow, sampleCount + 1);
      ws.getCell(currentRow, 1).value = "Percent CV";
      ws.getCell(currentRow, 1).font = { bold: true, size: 14 };
      ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE5E5" } };
      ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
      currentRow++;

      const cvSampleNameRow = ["Dilution Factor"];
      for (let i = 0; i < sampleCount; i++) {
        const name =
          (sampleNames[fileIndex] &&
            sampleNames[fileIndex][sheetIndex] &&
            sampleNames[fileIndex][sheetIndex][i]) ||
          `Sample ${i + 1}`;
        cvSampleNameRow.push(name);
      }
      ws.addRow(cvSampleNameRow);
      ws.getRow(currentRow).eachCell(cell => {
        cell.font = { italic: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF6F6" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      ws.getRow(currentRow).height = 22;
      ws.columns.forEach((col, idx) => {
        ws.getColumn(idx + 1).width = 24;
      });
      currentRow++;

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
  const rowData = [dilutionFactors[rowIdx] || ''];
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
    rowData.push(cv !== '' ? `${cv}%` : '');
  }
  const excelRow = ws.addRow(rowData);
  excelRow.eachCell((cell, colNumber) => {
    // Set alternating row background
    cell.fill = ((rowIdx % 2) === 0)
      ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } }
      : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    // Only highlight data columns (not the first/dilution column)
    if (colNumber > 1) {
      const value = parseFloat(cell.value);
      if (!isNaN(value) && value >= 20) {
        // Override with green if over 20
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ffabffea' } // Green
        };
      }
    }
  });
});

for (let r = currentRow; r <= currentRow + sheet.preview.length; r++) {
  ws.getRow(r).alignment = { horizontal: "center", vertical: "middle" };
}
currentRow += sheet.preview.length;

// Border for Percent CV table
for (let r = currentRow - sheet.preview.length; r < currentRow; r++) {
  ws.getRow(r).eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: r === currentRow - sheet.preview.length ? "thick" : "thin" },
      left: { style: colNumber === 1 ? "thick" : "thin" },
      bottom: { style: r === currentRow - 1 ? "thick" : "thin" },
      right: { style: colNumber === sampleCount + 1 ? "thick" : "thin" }
    };
  });
}
      currentRow++;

// --- MEAN OF DUPLICATE - BG TABLE ---
ws.mergeCells(currentRow, 1, currentRow, sampleCount + 1);
ws.getCell(currentRow, 1).value = "Mean of Duplicate - BG";
ws.getCell(currentRow, 1).font = { bold: true, size: 14 };
ws.getCell(currentRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCE7FF" } };
ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
currentRow++;

const meanSampleNameRow = ["Dilution Factor"];
for (let i = 0; i < sampleCount; i++) {
  const name =
    (sampleNames[fileIndex] &&
      sampleNames[fileIndex][sheetIndex] &&
      sampleNames[fileIndex][sheetIndex][i]) ||
    `Sample ${i + 1}`;
  meanSampleNameRow.push(name);
}
ws.addRow(meanSampleNameRow);
ws.getRow(currentRow).eachCell(cell => {
  cell.font = { italic: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5F0FF" } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
});
ws.getRow(currentRow).height = 22;
ws.columns.forEach((col, idx) => {
  ws.getColumn(idx + 1).width = 24;
});
currentRow++;



// Calculate background (average of last row's last two columns)
let background = 0;
const lastRow = sheet.preview[sheet.preview.length - 1] || [];
const bg1 = parseFloat(lastRow[lastRow.length - 2]);
const bg2 = parseFloat(lastRow[lastRow.length - 1]);
if (!isNaN(bg1) && !isNaN(bg2)) {
  background = (bg1 + bg2) / 2;
} else if (!isNaN(bg1)) {
  background = bg1;
} else if (!isNaN(bg2)) {
  background = bg2;
}

// Add mean-bg rows
sheet.preview.forEach((row, rowIdx) => {
  const rowData = [dilutionFactors[rowIdx] || ''];
  for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
    const n1 = excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) ? '' : parseFloat(row[1 + sampleIdx * 2]);
    const n2 = excludedCells.has(`r${rowIdx}s${sampleIdx}d1`) ? '' : parseFloat(row[2 + sampleIdx * 2]);
    let avg = '';
    if (n1 !== '' && n2 !== '' && !isNaN(n1) && !isNaN(n2)) {
      avg = ((n1 + n2) / 2) - background;
      avg = avg.toFixed(3);
    } else if (n1 !== '' && !isNaN(n1)) {
      avg = n1 - background;
      avg = avg.toFixed(3);
    } else if (n2 !== '' && !isNaN(n2)) {
      avg = n2 - background;
      avg = avg.toFixed(3);
    }
    rowData.push(avg);
  }
  // For the last row, ensure the last value is 0.000
  if (rowIdx === sheet.preview.length - 1) {
    rowData[rowData.length - 1] = "0.000";
  }
  const excelRow = ws.addRow(rowData);
  excelRow.eachCell((cell, colNumber) => {
    // Only highlight data columns (not the first/dilution column)
    if (colNumber > 1) {
      const value = parseFloat(cell.value);
      if (!isNaN(value)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: value >= 0.5 ? 'FFD4EDDA' : // Green
                  value < 0.5 ? 'FFFFF3CD' : // Yellow
                  'FFFFFFFF' // White
          }
        };
      }
    }
  });
});
for (let r = currentRow; r <= currentRow + sheet.preview.length; r++) {
  ws.getRow(r).alignment = { horizontal: "center", vertical: "middle" };
}
currentRow += sheet.preview.length;

// Border for Mean BG table
for (let r = currentRow - sheet.preview.length; r < currentRow; r++) {
  ws.getRow(r).eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: r === currentRow - sheet.preview.length ? "thick" : "thin" },
      left: { style: colNumber === 1 ? "thick" : "thin" },
      bottom: { style: r === currentRow - 1 ? "thick" : "thin" },
      right: { style: colNumber === sampleCount + 1 ? "thick" : "thin" }
    };
  });
}
currentRow++;

      // --- FINAL TITER TABLE ---
ws.mergeCells(currentRow, 1, currentRow, sampleCount + 1);
ws.getCell(currentRow, 1).value = "Final Titer (OD=0.5)";
ws.getCell(currentRow, 1).font = { bold: true, size: 14 };
ws.getCell(currentRow, 1).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFC8E6C9" }
};
ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
currentRow += 1;

// Sample names row (pastel)
const titerSampleNameRow = ["Dilution"];
for (let i = 0; i < sampleCount; i++) {
  const name =
    (sampleNames[fileIndex] &&
      sampleNames[fileIndex][sheetIndex] &&
      sampleNames[fileIndex][sheetIndex][i]) ||
    `Sample ${i + 1}`;
  titerSampleNameRow.push(name);
}
ws.addRow(titerSampleNameRow);
ws.getRow(currentRow).eachCell(cell => {
  cell.font = { italic: true };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F5E9" }
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
});
ws.getRow(currentRow).height = 22;
ws.columns.forEach((col, idx) => {
  ws.getColumn(idx + 1).width = 24;
});
currentRow += 1;

// // // Calculate titers and R2 using cubic regression (poly3Regression)
// // const averagedRows = sheet.preview.map((row, rowIdx) => {
// //   const newRow = [];
// //   for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
// //     const n1 = excludedCells.has(`r${rowIdx}s${sampleIdx}d0`) ? NaN : parseFloat(row[1 + sampleIdx * 2]);
// //     const n2 = excludedCells.has(`r${rowIdx}s${sampleIdx}d1`) ? NaN : parseFloat(row[2 + sampleIdx * 2]);
// //     let avg = '';
// //     if (!isNaN(n1) && !isNaN(n2)) avg = ((n1 + n2) / 2);
// //     else if (!isNaN(n1)) avg = n1;
// //     else if (!isNaN(n2)) avg = n2;
// //     newRow.push(avg !== '' && !isNaN(avg) ? avg : '');
// //   }
// //   return newRow;
// // });

// // Poly3 regression helper (copy from odAVG.js)
// function poly3Regression(x, y) {
//   const n = x.length;
//   let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumX5 = 0, sumX6 = 0;
//   let sumY = 0, sumXY = 0, sumX2Y = 0, sumX3Y = 0;
//   for (let i = 0; i < n; i++) {
//     const xi = x[i], yi = y[i];
//     const xi2 = xi * xi, xi3 = xi2 * xi, xi4 = xi3 * xi, xi5 = xi4 * xi, xi6 = xi5 * xi;
//     sumX += xi;
//     sumX2 += xi2;
//     sumX3 += xi3;
//     sumX4 += xi4;
//     sumX5 += xi5;
//     sumX6 += xi6;
//     sumY += yi;
//     sumXY += xi * yi;
//     sumX2Y += xi2 * yi;
//     sumX3Y += xi3 * yi;
//   }
//   const A = [
//     [n, sumX, sumX2, sumX3],
//     [sumX, sumX2, sumX3, sumX4],
//     [sumX2, sumX3, sumX4, sumX5],
//     [sumX3, sumX4, sumX5, sumX6]
//   ];
//   const B = [sumY, sumXY, sumX2Y, sumX3Y];
//   function gauss(A, B) {
//     const n = B.length;
//     for (let i = 0; i < n; i++) {
//       let maxEl = Math.abs(A[i][i]);
//       let maxRow = i;
//       for (let k = i + 1; k < n; k++) {
//         if (Math.abs(A[k][i]) > maxEl) {
//           maxEl = Math.abs(A[k][i]);
//           maxRow = k;
//         }
//       }
//       for (let k = i; k < n; k++) {
//         let tmp = A[maxRow][k];
//         A[maxRow][k] = A[i][k];
//         A[i][k] = tmp;
//       }
//       let tmp = B[maxRow];
//       B[maxRow] = B[i];
//       B[i] = tmp;
//       for (let k = i + 1; k < n; k++) {
//         let c = -A[k][i] / A[i][i];
//         for (let j = i; j < n; j++) {
//           if (i === j) {
//             A[k][j] = 0;
//           } else {
//             A[k][j] += c * A[i][j];
//           }
//         }
//         B[k] += c * B[i];
//       }
//     }
//     const x = Array(n).fill(0);
//     for (let i = n - 1; i >= 0; i--) {
//       x[i] = B[i] / A[i][i];
//       for (let k = i - 1; k >= 0; k--) {
//         B[k] -= A[k][i] * x[i];
//       }
//     }
//     return x;
//   }
//   const [d, c, b, a] = gauss(A, B);
//   return { a, b, c, d };
// }

// // R2 for cubic fit
// function calculateR2(x, y, fit) {
//   const yMean = y.reduce((a, b) => a + b, 0) / y.length;
//   let ssTot = 0, ssRes = 0;
//   for (let i = 0; i < x.length; i++) {
//     const yPred = fit.a * x[i] * x[i] * x[i] + fit.b * x[i] * x[i] + fit.c * x[i] + fit.d;
//     ssTot += (y[i] - yMean) ** 2;
//     ssRes += (y[i] - yPred) ** 2;
//   }
//   return 1 - ssRes / ssTot;
// }


  // --- Helper functions for 4PL fitting (copied from odAVG.js or similar logic) ---
  function fit4PL(x_coords, y_coords) { // x_coords are log10(dilution)
    const a_init = Math.min(...y_coords);
    const d_init = Math.max(...y_coords);
    const halfMax = (a_init + d_init) / 2;
    const closestIdx = y_coords.reduce((bestIdx, val, idx) =>
      Math.abs(val - halfMax) < Math.abs(y_coords[bestIdx] - halfMax) ? idx : bestIdx, 0);

    let d_param = a_init; // min asymptote
    let a_param = d_init; // max asymptote
    let c_param = x_coords[closestIdx]; // EC50 (log10 dilution)

    let b_initial_guess = 4.0;
    if (x_coords.length >= 2 && (d_init - a_init) > 1e-6) {
      const y_target_upper_norm_level = 0.80;
      const y_target_lower_norm_level = 0.20;
      const y_target_80_percent_response = a_init + y_target_upper_norm_level * (d_init - a_init);
      const y_target_20_percent_response = a_init + y_target_lower_norm_level * (d_init - a_init);

      const findClosestYPoint = (targetY, xs, ys) => {
        let minDiff = Infinity; let bestX = xs[0]; let bestY = ys[0];
        for (let i = 0; i < ys.length; i++) {
          const diff = Math.abs(ys[i] - targetY);
          if (diff < minDiff) { minDiff = diff; bestX = xs[i]; bestY = ys[i]; }
        }
        return { x: bestX, y: bestY };
      };
      const p80 = findClosestYPoint(y_target_80_percent_response, x_coords, y_coords);
      const p20 = findClosestYPoint(y_target_20_percent_response, x_coords, y_coords);
      const x1 = p80.y > p20.y ? p80.x : p20.x; const y1 = p80.y > p20.y ? p80.y : p20.y;
      const x2 = p80.y > p20.y ? p20.x : p80.x; const y2 = p80.y > p20.y ? p20.y : p80.y;

      if (x1 !== x2 && y1 !== y2 && (d_init - a_init) > 1e-6) {
        let Y1_n = Math.max(0.01, Math.min(0.99, (y1 - a_init) / (d_init - a_init)));
        let Y2_n = Math.max(0.01, Math.min(0.99, (y2 - a_init) / (d_init - a_init)));
        if (Y1_n > Y2_n && x2 !== 0) {
          const tNum = (1 / Y1_n) - 1; const tDenom = (1 / Y2_n) - 1;
          if (tDenom !== 0) {
            const logYRatio = tNum / tDenom; const logXRatio = x1 / x2;
            if (logYRatio > 0 && logXRatio > 0 && logXRatio !== 1) {
              const b_calc = Math.log(logYRatio) / Math.log(logXRatio);
              if (!isNaN(b_calc) && isFinite(b_calc)) {
                b_initial_guess = Math.max(0.5, Math.min(20.0, b_calc));
              }
            }
          }
        }
      }
    }
    let b_param = b_initial_guess; // Hill slope

    const maxIter = 1000; const tol = 1e-6;
    for (let iter = 0; iter < maxIter; iter++) {
      let grad = [0, 0, 0, 0]; let error = 0;
      for (let i = 0; i < x_coords.length; i++) {
        const xi = x_coords[i], yi = y_coords[i];
        const safeXiOverC = Math.max(xi / c_param, 1e-9); // Avoid log(0) or division by zero if c_param is 0
        const powVal = Math.pow(safeXiOverC, b_param);
        const denom = 1 + powVal;
        const fx = d_param + (a_param - d_param) / denom;
        const err_i = fx - yi; error += err_i ** 2;
        const lnxc = (c_param === 0 || xi === 0) ? 0 : Math.log(safeXiOverC); // Handle cases where xi or c_param is 0

        grad[0] += (err_i / denom); // d_error / d_a_param
        grad[1] += (err_i * (a_param - d_param) * -powVal * lnxc / (denom ** 2)); // d_error / d_b_param
        grad[2] += (err_i * (a_param - d_param) * b_param * powVal / (c_param * denom ** 2)); // d_error / d_c_param (simplified, assumes c_param != 0)
        grad[3] += (err_i * (1 - 1 / denom)); // d_error / d_d_param
      }
      const lr = 0.01 / (1 + iter * 0.05);
      a_param -= lr * grad[0]; b_param -= lr * grad[1]; 
      if (c_param !== 0) c_param -= lr * grad[2]; // Only update c_param if it's not zero
      d_param -= lr * grad[3];

      b_param = Math.max(0.1, Math.min(b_param, 25.0));
      c_param = Math.max(Math.min(...x_coords), Math.min(c_param, Math.max(...x_coords)));
      if (Math.sqrt(error) < tol) break;
    }
    return {
      a: a_param, b: b_param, c: c_param, d: d_param,
      predict: (xVal) => {
        const safeX = (c_param === 0) ? 0 : Math.max(xVal / c_param, 1e-9);
        const denom = 1 + Math.pow(safeX, b_param);
        return d_param + (a_param - d_param) / denom;
      }
    };
  }

  function solve4PL({ a, b, c, d }, y0_target) {
    if (y0_target <= Math.min(a, d) + 1e-4 || y0_target >= Math.max(a, d) - 1e-4) return null;
    const ratio_val = (a - d) / (y0_target - d) - 1;
    if (ratio_val <= 0) return null;
    return c * Math.pow(ratio_val, 1 / b);
  }

  function calculateR2_4PL(x_data, y_data, fit_model) {
    if (!fit_model || typeof fit_model.predict !== 'function' || y_data.length === 0) return null;
    const yMean = y_data.reduce((acc, val) => acc + val, 0) / y_data.length;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < x_data.length; i++) {
      const yPred = fit_model.predict(x_data[i]);
      ssTot += (y_data[i] - yMean) ** 2;
      ssRes += (y_data[i] - yPred) ** 2;
    }
    return ssTot === 0 ? 1 : (1 - ssRes / ssTot); // if ssTot is 0, all y_data are same, R2 is 1 if prediction matches
  }

  // calculating 4PL
   const averagedRows = summary.preview.map((row, rowIdx) => {
    const newRow = [];
    for (let i = 1, sampleIdx = 0; i < row.length - 1; i += 2, sampleIdx++) {
      const n1 = excludedCells(rowIdx, sampleIdx, 0) ? NaN : parseFloat(row[i]);
      const n2 = excludedCells(rowIdx, sampleIdx, 1) ? NaN : parseFloat(row[i + 1]);
      let avg_raw = !isNaN(n1) && !isNaN(n2) ? (n1 + n2) / 2 : (!isNaN(n1) ? n1 : n2);
      newRow.push(isNaN(avg_raw) ? NaN : parseFloat((avg_raw - background).toFixed(3))); // Store as number
    }
    if (rowIdx === summary.preview.length - 1 && newRow.length > 0) {
        newRow[newRow.length - 1] = 0.000;
    }
    return [row[0], ...newRow];
  });

  
const titers = [];
const r2s = [];
for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
  const ods_for_sample = averagedRows.map(row => parseFloat(row[sampleIdx + 1])); // +1 because row[0] is dilution label
  const x_log_dilutions = [];
  const y_ods = [];
  for (let i = 0; i < ods_for_sample.length && i < dilutionFactors.length; i++) {
    if (!isNaN(ods_for_sample[i])) {
        x_log_dilutions.push(Math.log10(dilutionFactors[i]));
        y_ods.push(ods_for_sample[i]);
      }
    }

  let titerStr = "N/A";
  let r2Val = null;

  if (x_log_dilutions.length >= 4) {
    const fit = fit4PL(x_log_dilutions, y_ods);
    if (fit && typeof fit.predict === 'function') {
      const root = solve4PL(fit, 0.5); // Target OD = 0.5
      if (root !== null && isFinite(root)) {
        const dilutionAt05 = Math.pow(10, root);
        if (!isNaN(dilutionAt05)) {
          titerStr = Math.round(dilutionAt05).toLocaleString();
        }
      }
      r2Val = calculateR2_4PL(x_log_dilutions, y_ods, fit);
    }
  }

  if (titerStr === "N/A" || titerStr === "0" || x_log_dilutions.length < 4) {
    if (y_ods.length > 0) {
      const firstDilutionStr = (dilutionFactors[0] || 1000).toLocaleString();
      const lastDilutionStr = (dilutionFactors[dilutionFactors.length - 1] || 2187000).toLocaleString();
      if (y_ods[0] < 0.5 && y_ods.every(val => val < 0.5)) titerStr = `<${firstDilutionStr}`;
      else if (y_ods[y_ods.length - 1] >= 0.5 && y_ods.every(val => val >= 0.5)) titerStr = `>${lastDilutionStr}`;
      else if (y_ods[0] < 0.5) titerStr = `<${firstDilutionStr}`;
      else if (y_ods[y_ods.length - 1] >= 0.5) titerStr = `>${lastDilutionStr}`;
    }
  }
  titers.push(titerStr);
  r2s.push(r2Val);
}
ws.addRow(["Dilution", ...titers]);
ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
currentRow += 1;
ws.addRow(["R^2", ...r2s.map(r2 => (r2 !== "" && r2 !== null ? Number(r2).toFixed(3) : ""))]);
ws.getRow(currentRow).alignment = { horizontal: "center", vertical: "middle" };
currentRow += 1;

// Border for Final Titer table
for (let r = currentRow - 2; r < currentRow; r++) {
  ws.getRow(r).eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: r === currentRow - 2 ? "thick" : "thin" },
      left: { style: colNumber === 1 ? "thick" : "thin" },
      bottom: { style: r === currentRow - 1 ? "thick" : "thin" },
      right: { style: colNumber === sampleCount + 1 ? "thick" : "thin" }
    };
    });
        ws.getRow(r).eachCell(cell => {
          cell.fill = cell.fill || {};
          cell.fill = ((r - (currentRow - sheet.preview.length)) % 2 === 0)
            ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F7F7" } }
            : { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        });
}
currentRow++;

    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, fileName);
};

const [plateNames, setPlateNames] = useState({});
const handlePlateNameChange = (fileIdx, sheetIdx, newName) => {
  setPlateNames(prev => ({
    ...prev,
    [fileIdx]: {
      ...(prev[fileIdx] || {}),
      [sheetIdx]: newName.trim()
    }
  }));
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
    <>
    {excelSummaries.length > 0 && (
<div className={`${styles.sheet_tabs} ${styles.sheet_tabs_sticky}`}>
  
  {excelSummaries.map((summary, fileIndex) =>
    summary.sheets.map((sheet, sheetIndex) => {
      const tabLabel =
        (plateNames[fileIndex] && plateNames[fileIndex][sheetIndex]) ||
        `Plate ${sheetIndex + 1}`;
      const isActive = activeTab.file === fileIndex && activeTab.sheet === sheetIndex;
      const isEditing = editingTab.file === fileIndex && editingTab.sheet === sheetIndex;

      return (
        <span key={`${fileIndex}-${sheetIndex}`} style={{ display: 'inline-block', position: 'relative' }}>
          {isEditing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                handlePlateNameChange(fileIndex, sheetIndex, editingTabValue);
                setEditingTab({ file: null, sheet: null });
                setEditingTabValue('');
              }}
              style={{ display: 'inline' }}
            >
              <input
                type="text"
                value={editingTabValue}
                onChange={e => setEditingTabValue(e.target.value)}
                className={styles.name_edit_input}
                style={{ width: '90px', fontSize: '1rem' }}
                autoFocus
                onBlur={() => {
                  setEditingTab({ file: null, sheet: null });
                  setEditingTabValue('');
                }}
              />
            </form>
          ) : (
            <button
              className={`${styles.sheetTab} ${isActive ? styles.active : ''}`}
              onClick={() => setActiveTab({ file: fileIndex, sheet: sheetIndex })}
              onDoubleClick={() => {
                setEditingTab({ file: fileIndex, sheet: sheetIndex });
                setEditingTabValue(tabLabel);
              }}
              title="Double-click to edit plate name"
              style={{ position: 'relative' }}
            >
              {tabLabel}
              <span
                className={styles.edit_button}
                onClick={e => {
                  e.stopPropagation();
                  setEditingTab({ file: fileIndex, sheet: sheetIndex });
                  setEditingTabValue(tabLabel);
                }}
                title="Edit plate name"
                tabIndex={-1}
              >✎</span>
            </button>
          )}
        </span>
      );
    })
  )}
</div>
)}

    <div className={styles.excel_processor}>
        <h1 className={styles.titer_header}>Titer Analysis</h1>
      {showInstructions && (
        <div className={styles.instructions_card}>
          <h2>Instructions</h2>
          <ol>
            <li>Upload one or more Excel files (.xlsx or .xls) using the file input below.</li>
            <li>Click on the tabs to view and edit each plate.</li>
            <li>Edit file, plate, and sample names by clicking the ✎ icon.</li>
            <li>Click on table cells to exclude/include data points (strikethrough = excluded).</li>
            <li>Download your summary when finished.</li>
          </ol>
        </div>
      )}
      <div className={styles.upload_section}>
        <div className={styles.file_controls}>
          <label htmlFor="file-upload" className={styles.custom_file_upload}>
            Upload Excel Files
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className={styles.file_input}
          />
          {excelSummaries.length > 0 && (
            <div className={styles.download_section1}>
              {showFileNameInput ? (
                <form onSubmit={handleFileNameSubmit} className={styles.file_name_form}>
                  <input
                    type="text"
                    value={fileName}
                    onChange={handleFileNameChange}
                    placeholder="Enter file name"
                    className={styles.file_name_input}
                    autoFocus
                  />
                  <button type="submit" className={styles.save_button}>Save</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFileNameInput(false);
                      setFileName('');
                    }}
                    className={styles.cancel_button}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={handleDownloadClick}
                  className={styles.download_button}
                >
                  Download Summary
                </button>
                
              )}
              
            </div>
          )}
              {excelSummaries[activeTab.file]?.sheets?.[activeTab.sheet] && (
                <button
                  onClick={() => finalTableRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className={styles.ft_button}
                >
                  Jump to Final Table
                </button>
              )}
        </div>


      </div>

      {isLoading && (
        <div className={styles.loading}>
          Processing files...
        </div>
      )}

            <div className={styles.main_content1}>
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
          plateName={
            (plateNames[activeTab.file] && plateNames[activeTab.file][activeTab.sheet]) ||
            `Plate ${activeTab.sheet + 1}`
          }
          onPlateNameChange={newName => handlePlateNameChange(activeTab.file, activeTab.sheet, newName)}  // <-- Add this line
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
              plateName={    (plateNames[activeTab.file] && plateNames[activeTab.file][activeTab.sheet]) ||
    `Plate ${activeTab.sheet + 1}`}
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
       <div ref={finalTableRef}>
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
          </div>
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



      </div>
    </div>
    </>
  );
}

export default TiterAnalysis;