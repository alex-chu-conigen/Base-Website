import React from 'react';

function calculateCV(val1, val2) {
  const n1 = parseFloat(val1);
  const n2 = parseFloat(val2);
  // Log the values being calculated
  // console.log('Calculating CV for:', { val1, val2, n1, n2 });
  if (isNaN(n1) || isNaN(n2)) return '';
  const avg = (n1 + n2) / 2;
  const stdev = Math.sqrt(((n1 - avg) ** 2 + (n2 - avg) ** 2) / 2);
  if (avg === 0) return '';
  return ((stdev / avg) * 100).toFixed(2); // percent CV
  
}

function PercentCVCard({ summary, sampleNames = [] }) {
  if (!summary || !summary.columns || !summary.preview) return null;

  // Calculate sample count
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  // Skip the first column (label), then pair columns: [1,2], [3,4], ..., [11,12]
  const pairedColumns = [];
  for (let i = 1; i < summary.columns.length; i += 2) {
    const colName1 = summary.columns[i];
    const colName2 = summary.columns[i + 1];
    pairedColumns.push(
      colName2 ? `${colName1}&${colName2}` : colName1
    );
  }

  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>Percent CV Table</h2>
        </div>
      </div>
      <div className="sheet-summary">
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>{summary.columns[0]}</th>
                {Array.from({ length: sampleCount }).map((_, idx) => (
                  <th key={idx} colSpan={1} style={{ textAlign: 'center' }}>
                    {sampleNames[idx] || `Sample ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.preview.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{row[0]}</td>
                  {(() => {
                    const cells = [];
                    for (let i = 1; i < row.length; i += 2) {
                      // Log the values for each cell calculation
                      console.log(`Row ${rowIndex}, Pair (${i}, ${i + 1}):`, row[i], row[i + 1]);
                      cells.push(
                        <td key={i}>
                          {row[i + 1] !== undefined
                            ? calculateCV(row[i], row[i + 1]) + '%'
                            : ''}
                        </td>
                      );
                    }
                    return cells;
                  })()}
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