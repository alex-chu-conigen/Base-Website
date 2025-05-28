import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SummaryCard({
  summary,
  fileIndex,
  excelSummaries,
  getCellColor,
  toggleCellExclusion,
  customName,
  onNameChange,
  plateNumber,
  sampleNames = []
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

  // Calculate sample count
  const sampleCount = summary && summary.columns ? Math.floor((summary.columns.length - 1) / 2) : 0;

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
                    <th key={idx} colSpan={2} style={{ textAlign: 'center' }}>
                      {sampleNames[idx] || `Sample ${idx + 1}`}
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
                {summary.preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => {
                      const rowKey = row[0] || `Row ${rowIndex + 1}`;
                      const colKey = summary.columns[cellIndex] || `Column ${String.fromCharCode(66 + cellIndex)}`;
                      return (
                        <td
                          key={cellIndex}
                          className={getCellColor(cell, rowKey, colKey)}
                          onClick={() => toggleCellExclusion(fileIndex, 0, rowIndex, cellIndex, rowKey, colKey)}
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