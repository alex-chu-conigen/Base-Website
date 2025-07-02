// compound-dr.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
// import PercentCVCard from './percentCV';
// import SummaryCard from './dupBG';
import PLCard from './4pl.js';
import styles from './compound-dr.module.css';
import { saveAs } from 'file-saver';
import { useRef } from 'react';
import { fit4PL, solve4PL, PercentInhibitionCard } from './4pl';



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

function CompoundDR() {
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

  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetSummaries = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const fullData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              raw: false,
            });

            // Find the row with 'inhibitor conc' (case-insensitive)
            const headerRowIndex = fullData.findIndex(row =>
              row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('inhibitor conc'))
            );
            if (headerRowIndex === -1) throw new Error('Could not find inhibitor concentration row.');

            // The cleaned summary: first row is ['inhibitor conc', ...concentrations],
            // second row is a spacer, next 3 rows are triplicates (no extra columns)
            const headerRow = fullData[headerRowIndex];
            // Remove any trailing empty columns
            const lastDataCol = headerRow.map((v, i) => [v, i]).reverse().find(([v]) => v !== '' && v !== undefined);
            const colCount = lastDataCol ? lastDataCol[1] + 1 : headerRow.length;
            const cleanedHeader = headerRow.slice(0, colCount);
            // Spacer row (all dashes)
            const spacerRow = Array(colCount).fill('-');
            // Next 4 rows: triplicates
            const tripRows = fullData.slice(headerRowIndex + 1, headerRowIndex + 5).map(row => row.slice(0, colCount));
            return {
              sheetName,
              columns: cleanedHeader,
              preview: [cleanedHeader, spacerRow, ...tripRows],
              dataRows: [cleanedHeader, spacerRow, ...tripRows],
            };
          });

          resolve({
            fileName: file.name,
            sheets: sheetSummaries
          });
        } catch (error) {
          console.error('Error processing Excel:', error);
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
    "CompoundDR";
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


// R2 for 4PL fit
function calculateR2_4PL(x_data, y_data, fit_model) {
  if (!fit_model || typeof fit_model.predict !== 'function' || y_data.length === 0) return null;
  const yMean = y_data.reduce((acc, val) => acc + val, 0) / y_data.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < x_data.length; i++) {
    const yPred = fit_model.predict(x_data[i]);
    ssTot += (y_data[i] - yMean) ** 2;
    ssRes += (y_data[i] - yPred) ** 2;
  }
  return ssTot === 0 ? 1 : (1 - ssRes / ssTot);
}


  // --- Helper functions for 4PL fitting (copied from odAVG.js or similar logic) ---
  // Remove local fit4PL and solve4PL, use imported ones

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
       {/* Raw Data Table: inhibitor conc, spacer, triplicates */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
        <div className={styles.summary_card}>
          <div className={styles.card_header}><h2>Raw Data Table</h2></div>
          <div className={styles.sheet_summary}>
            <table>
              <tbody>
                {excelSummaries[activeTab.file].sheets[activeTab.sheet].preview
                  .filter(row => !row.every(cell => cell === '-' || cell === '' || cell === undefined))
                  .map((row, rowIdx) => (
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
          )}

        {/* Percent Inhibition Card (Proximity Assay/TPD) */}
        {excelSummaries[activeTab.file] &&
          excelSummaries[activeTab.file].sheets &&
          excelSummaries[activeTab.file].sheets[activeTab.sheet] && (
            <PercentInhibitionCard
              summary={excelSummaries[activeTab.file].sheets[activeTab.sheet]}
            />
          )}



      </div>
    </div>
    </>
  );
}

export default CompoundDR;