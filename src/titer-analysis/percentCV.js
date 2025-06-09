import styles from './TiterAnalysis.module.css';
import React, { useState } from 'react';


// Calculate percent CV for two values
function calculateCV(val1, val2) {
  const n1 = parseFloat(val1);
  const n2 = parseFloat(val2);
  if (isNaN(n1) || isNaN(n2)) return '';
  const avg = (n1 + n2) / 2;
  const stdev = Math.sqrt(((n1 - avg) ** 2 + (n2 - avg) ** 2) / 2);
  if (avg === 0) return '';
  return ((stdev / avg) * 100).toFixed(2); // percent CV
}



function PercentCVCard({ summary, sampleNames = [], plateNumber, excludedCells = new Set(), toggleCellExclusion }) {

  if (!summary || !summary.columns || !summary.preview) return null;

  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  // Helper to get exclusion key for a duplicate cell
  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;

  // Get value, but return '' if excluded
  const getValue = (row, rowIdx, sampleIdx, dupIdx) => {
    const key = getCellKey(rowIdx, sampleIdx, dupIdx);
    if (excludedCells.has(key)) return '';
    const colIdx = 1 + sampleIdx * 2 + dupIdx;
    return row[colIdx];
  };

  const getCV = (row, rowIdx, sampleIdx) => {
    const v1 = getValue(row, rowIdx, sampleIdx, 0);
    const v2 = getValue(row, rowIdx, sampleIdx, 1);
    // If both excluded, return ''
    if (v1 === '' && v2 === '') return '';
    // If one excluded, show the other value (not a CV)
    if (v1 === '') return v2;
    if (v2 === '') return v1;
    // Both present, calculate CV
    return calculateCV(v1, v2);
  };

  // For highlighting: if CV > 20, highlight the two raw values used
  const isHighCV = (row, rowIdx, sampleIdx) => {
    const cv = getCV(row, rowIdx, sampleIdx);
    const cvNum = parseFloat(cv);
    return !isNaN(cvNum) && cvNum > 20;
  };

  // Render
  return (
    <div className={styles.summary_card}>
      <div className={styles.card_header}>
        <div className={styles.card_title}>
          <h2>Percent CV</h2>
        </div>
      </div>
      <div className={styles.sheet_summary}>
        <h3>Plate #{plateNumber}</h3>
        <div className={styles.preview_table_titer}>
          <table>
            <thead>
              <tr>
                <th>{summary.columns[0]}</th>
                {Array.from({ length: sampleCount }).map((_, idx) => (
                  <th key={idx} style={{ textAlign: 'center' }}>
                    {sampleNames[idx] || `Sample ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
 {summary.preview.map((row, rowIndex) => (
    <tr key={rowIndex}>
      <td>{row[0]}</td>
      {Array.from({ length: sampleCount }).map((_, sampleIdx) => {
        const v1 = getValue(row, rowIndex, sampleIdx, 0);
        const v2 = getValue(row, rowIndex, sampleIdx, 1);
        const bothExcluded = v1 === '' && v2 === '';
        const onlyOnePresent = (v1 === '' && v2 !== '') || (v2 === '' && v1 !== '');
        const cv = getCV(row, rowIndex, sampleIdx);
        const cvNum = parseFloat(cv);

        let displayValue = '';
        if (bothExcluded) {
          displayValue = '';
        } else if (onlyOnePresent) {
          displayValue = '0%';
        } else {
          displayValue = `${cv}%`;
        }

        return (
          <td
            key={sampleIdx}
            style={{
              background: !isNaN(cvNum) && cvNum > 20 ? 'rgb(203, 241, 199)' : undefined,
              color: !isNaN(cvNum) && cvNum > 20 ? 'rgb(12, 60, 6)' : undefined,

              fontWeight: !isNaN(cvNum) && cvNum > 20 ? 600 : undefined,
            }}
          >
            {displayValue}
          </td>
        );
      })}
    </tr>
  ))}
            </tbody>
          </table>
        </div>
        {/* Raw Data Table with exclusion buttons */}
        <div style={{ marginTop: 32 }}>
          <h4>Raw Data (click to exclude/include values)</h4>
          <div className={styles.preview_table_titer}>
            <table>
              <thead>
                <tr>
                  <th>{summary.columns[0]}</th>
                  {Array.from({ length: sampleCount }).map((_, idx) => (
                    <th key={idx * 2} colSpan={2} style={{ textAlign: 'center' }}>
                      {sampleNames[idx] || `Sample ${idx + 1}`}
                    </th>
                  ))}
                </tr>

              </thead>
              <tbody>
              {summary.preview.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td>{row[0]}</td>
                  {Array.from({ length: sampleCount }).map((_, sampleIdx) => {
                    // For each duplicate
                    return [0, 1].map(dupIdx => {
                      const colIdx = 1 + sampleIdx * 2 + dupIdx;
                      const key = getCellKey(rowIdx, sampleIdx, dupIdx);
                      const value = row[colIdx];
                      const isExcluded = excludedCells.has(key);
                      // Highlight if this value is used in a high CV pair and not excluded
                      const highlight = isHighCV(row, rowIdx, sampleIdx) && !isExcluded;
                      return (
                        <td
                          key={colIdx}
                          style={{
                            background: isExcluded
                              ? '#ffa1c5'
                              : highlight
                              ? '#cbf1c7' // You can optionally replace this too with a green, e.g., '#cbf1c7'
                              : undefined,
                            textDecoration: isExcluded ? 'line-through' : undefined,
                            color: isExcluded ? '#888' : highlight ? 'rgb(12, 60, 6)' : undefined,
                            fontWeight: isExcluded ? 600 : highlight ? 600 : undefined,
                            cursor: 'pointer',
                            position: 'relative',

                            border: isExcluded
                              ? '1.5px solid #c93059'
                              : highlight
                              ? '1.5px solid rgb(50, 186, 50)'
                              : undefined,

                            boxShadow: isExcluded
                              ? '0 0 8px #ff4d4d, 0 0 15px #ff1a1a, 0 0 20px #ff1a1a, 0 0 30px #ff0000'
                              : highlight
                              ? '0 0 8px #4cff4c, 0 0 15px #33ff33, 0 0 20px #33ff33, 0 0 30px #00cc00' // green glow
                              : undefined,
                          }}
                          title={
                            isExcluded
                              ? "Click to include this value"
                              : highlight
                              ? "Click to exclude this value (high CV)"
                              : "Click to exclude/include this value"
                          }
                          onClick={() => toggleCellExclusion(rowIdx, sampleIdx, dupIdx)}
                        >
                          {value}
                        </td>
                      );
                    });
                  })}
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PercentCVCard;