import React from 'react';

function RawTableCard({
  summary,
  fileIndex,
  sheetIndex,
  customFileName,
  sampleNames,
  excludedCells,
  toggleCellExclusion,
}) {
  if (!summary || !summary.columns || !summary.preview) return null;
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>{customFileName || summary.fileName}</h2>
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
                    {sampleNames[idx] || `Sample ${idx + 1}`}
                  </th>
                ))}
              </tr>
              <tr>
                <th></th>
                {Array.from({ length: sampleCount }).map((_, idx) => (
                  <React.Fragment key={idx}>
                    <th>1</th>
                    <th>2</th>
                  </React.Fragment>
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

export default RawTableCard;