import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SummaryCard({ summary, fileIndex, excelSummaries, getCellColor, toggleCellExclusion, customName, onNameChange }) {
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

  // Only render a single sheet (the one passed in as summary)
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="summary-card"
    >
      <div className="drag-handle" {...attributes} {...listeners}>☰</div>
      <div className="card-header">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="name-edit-form">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter name"
              autoFocus
              className="name-edit-input"
            />
            <button type="submit" className="save-button">Save</button>
            <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
          </form>
        ) : (
          <div className="card-title">
            <h2>{customName || summary.fileName || summary.sheetName}</h2>
            <button onClick={() => setIsEditing(true)} className="edit-button">✎</button>
          </div>
        )}
      </div>
      {summary && summary.columns && summary.preview ? (
        <div className="sheet-summary">
          <h3>Sheet: {summary.sheetName}</h3>
          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {summary.columns.map((col, colIndex) => (
                    <th key={colIndex}>{col}</th>
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