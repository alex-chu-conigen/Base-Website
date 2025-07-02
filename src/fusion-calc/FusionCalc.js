import React, { useState } from 'react';
import styles from './FusionCalc.module.css';

const tableConfigs = [
  { title: 'Splenocytes' },
  { title: 'SP2/0 Harvest' },
  { title: 'Post B-cell Isolation' },
  { title: 'Final Wash' },
];

function FusionTable({ title }) {
  const [rows, setRows] = useState(Array(4).fill({ cells: '', viability: '' }));
  const [volume, setVolume] = useState('');

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const avg = (field) => {
    const vals = rows.map((row) => parseFloat(row[field])).filter((val) => !isNaN(val));
    if (vals.length === 0) return 'Enter values';
    if (field === 'cells') {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return mean.toExponential(2);
    }
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  };

  return (
    <div className={styles.tableWrapper}>
      <h3 className={styles.title}>{title}</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th></th>
            <th># of cells/ml</th>
            <th>viability %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>#{i + 1}</td>
              <td><input value={row.cells} onChange={(e) => handleChange(i, 'cells', e.target.value)} /></td>
              <td><input value={row.viability} onChange={(e) => handleChange(i, 'viability', e.target.value)} /></td>
            </tr>
          ))}
          <tr className={styles.avgRow}>
            <td>average</td>
            <td>{avg('cells')}</td>
            <td>{avg('viability')}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <label>Volume (mL): <input value={volume} onChange={e => setVolume(e.target.value)} /></label>
      </div>
    </div>
  );
}

export default function FusionCalc() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>FusionCalc</h1>
      <div className={styles.grid}>
        {tableConfigs.map(({ title }) => (
          <FusionTable key={title} title={title} />
        ))}
      </div>
    </div>
  );
}
