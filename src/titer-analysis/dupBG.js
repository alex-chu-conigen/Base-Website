import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SummaryCard({
  summary,
  fileIndex,
  getCellColor,
  toggleCellExclusion,
  customName,
  onNameChange,
  plateNumber,
  sampleNames = [],
  excludedCells = new Set(), // <-- add this

}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customName);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `file-${fileIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNameChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(customName);
    setIsEditing(false);
  };

// Calculate sample count (number of pairs)
const sampleCount = summary && summary.columns ? Math.floor((summary.columns.length - 1) / 2) : 0;

// Calculate background ONCE: last row, last two columns of the entire table
let background = 0;
let lastRow = [];
if (summary && summary.preview && summary.preview.length > 0) {
  lastRow = summary.preview[summary.preview.length - 1];
  const bg1 = parseFloat(lastRow[lastRow.length - 2]);
  const bg2 = parseFloat(lastRow[lastRow.length - 1]);
  if (!isNaN(bg1) && !isNaN(bg2)) {
    background = (bg1 + bg2) / 2;
  } else if (!isNaN(bg1)) {
    background = bg1;
  } else if (!isNaN(bg2)) {
    background = bg2;
  }

}

  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;

  // Prepare averaged data: for each row, for each pair, take average and subtract global background
  const averagedRows = summary && summary.preview
    ? summary.preview.map((row, rowIdx) => {
        const newRow = [];
        for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
          const n1Idx = 1 + sampleIdx * 2;
          const n2Idx = n1Idx + 1;
          const n1Key = getCellKey(rowIdx, sampleIdx, 0);
          const n2Key = getCellKey(rowIdx, sampleIdx, 1);

          const n1 = excludedCells.has(n1Key) ? '' : parseFloat(row[n1Idx]);
          const n2 = excludedCells.has(n2Key) ? '' : parseFloat(row[n2Idx]);

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
          newRow.push(avg);
        }
        // For the last row, ensure the last value is 0.000
        if (rowIdx === summary.preview.length - 1) {
          newRow[newRow.length - 1] = "0.000";
        }
        // First column is label, then averaged values
        return [row[0], ...newRow];
      })
    : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="summary-card"
    >
      <div className="drag-handle" {...attributes} {...listeners}>☰</div>
      <div className="card-header">
        <div className="card-title">
          <h2>Mean of Duplicate - Background</h2>
        </div>
      </div>
      {summary && summary.columns && summary.preview ? (
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
                {averagedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => {
                      // Only the first column is the label, others are averaged values
                      const rowKey = row[0] || `Row ${rowIndex + 1}`;
                      const colKey = cellIndex === 0
                        ? summary.columns[0]
                        : sampleNames[cellIndex - 1] || `Sample ${cellIndex}`;
                      return (
                        <td
                          key={cellIndex}
                          className={cellIndex === 0 ? '' : getCellColor(cell, rowKey, colKey)}
                          onClick={cellIndex === 0 ? undefined : () =>
                            toggleCellExclusion(fileIndex, 0, rowIndex, cellIndex, rowKey, colKey)
                          }
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SummaryCard;