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

function PercentCVCard({ summary, sampleNames = [], plateNumber, excludedCells }) {
  if (!summary || !summary.columns || !summary.preview) return null;

  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  // Helper to get exclusion key for a duplicate cell
  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;

  // Get value, but return '' if excluded
  const getValue = (row, rowIdx, sampleIdx, dupIdx) => {
    const key = getCellKey(rowIdx, sampleIdx, dupIdx);
    if (excludedCells && excludedCells.has(key)) return '';
    const colIdx = 1 + sampleIdx * 2 + dupIdx;
    return row[colIdx];
  };

  // Calculate CV for a pair, skipping if either is excluded
  const getCV = (row, rowIdx, sampleIdx) => {
    const v1 = getValue(row, rowIdx, sampleIdx, 0);
    const v2 = getValue(row, rowIdx, sampleIdx, 1);
    return calculateCV(v1, v2);
  };

  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>Percent CV Table</h2>
        </div>
      </div>
      <div className="sheet-summary">
        <h3>Plate #{plateNumber}</h3>
        <div className="preview-table">
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
                    const cv = getCV(row, rowIndex, sampleIdx);
                    const cvNum = parseFloat(cv);
                    return (
                      <td
                        key={sampleIdx}
                        style={{
                          background: !isNaN(cvNum) && cvNum > 20 ? '#fff3cd' : undefined,
                          fontWeight: !isNaN(cvNum) && cvNum > 20 ? 600 : undefined
                        }}
                      >
                        {cv !== '' ? `${cv}%` : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PercentCVCard;