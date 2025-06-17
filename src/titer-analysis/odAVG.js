// TiterAnalysis.js
import styles from './TiterAnalysis.module.css';
import React from 'react';
import Plot from 'react-plotly.js';

// --- Regression and Solvers ---
function fit4PL(x, y) {
  const a_init = Math.min(...y);
  const d_init = Math.max(...y);
  const halfMax = (a_init + d_init) / 2;

  // Find index of y closest to halfMax
  const closestIdx = y.reduce((bestIdx, val, idx) =>
    Math.abs(val - halfMax) < Math.abs(y[bestIdx] - halfMax) ? idx : bestIdx, 0);

  let d = a_init;
  let a = d_init;
  let c = x[closestIdx];  // better guess for inflection point
  let b = 2;              // reasonable slope start

  const maxIter = 1000;
  const tol = 1e-6;

  function f(xi, a, b, c, d) {
    return d + (a - d) / (1 + Math.pow(xi / c, b));
  }

  for (let iter = 0; iter < maxIter; iter++) {
    let grad = [0, 0, 0, 0];
    let error = 0;

    for (let i = 0; i < x.length; i++) {
      const xi = x[i], yi = y[i];
      const safeXiOverC = Math.max(xi / c, 1e-6);
      const denom = 1 + Math.pow(safeXiOverC, b);
      const fx = d + (a - d) / denom;
      const err = fx - yi;
      error += err ** 2;

      const lnxc = Math.log(safeXiOverC);

      grad[0] += (err / denom);
      grad[1] += (err * (a - d) * -Math.pow(safeXiOverC, b) * lnxc / (denom ** 2));
      grad[2] += (err * (a - d) * b * Math.pow(safeXiOverC, b) * lnxc / (c * denom ** 2));
      grad[3] += (err * (1 - 1 / denom));
    }

    const lr = 0.01 / (1 + iter * 0.05); // Adaptive learning rate

    a -= lr * grad[0];
    b -= lr * grad[1];
    c -= lr * grad[2];
    d -= lr * grad[3];

    // Parameter constraints
    b = Math.max(0.1, Math.min(b, 10));
    c = Math.max(Math.min(...x), Math.min(c, Math.max(...x)));

    if (Math.sqrt(error) < tol) break;
  }

  return {
    a, b, c, d,
    predict: (xVal) => {
      const safeX = Math.max(xVal, 1e-6);
      const denom = 1 + Math.pow(safeX / c, b);
      return d + (a - d) / denom;
    }
  };
}


function solve4PL({ a, b, c, d }, y0) {
  if (y0 <= Math.min(a, d) || y0 >= Math.max(a, d)) return null;
  const ratio = (a - d) / (y0 - d) - 1;
  if (ratio <= 0) return null;
  return c * Math.pow(ratio, 1 / b);
}

function calculateR2(x, y, fit) {
  if (!fit || typeof fit.predict !== 'function') return null;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < x.length; i++) {
    const yPred = fit.predict(x[i]);
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - yPred) ** 2;
  }
  return 1 - ssRes / ssTot;
}

// --- Main Card Components ---
function ODTiterCard({ summary, sampleNames = [], plateNumber, excludedCells }) {
  if (!summary || !summary.columns || !summary.preview) return null;
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);
  const dilutions = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];

  let background = 0;
  if (summary.preview.length > 0) {
    const lastRow = summary.preview[summary.preview.length - 1];
    const bg1 = parseFloat(lastRow[lastRow.length - 2]);
    const bg2 = parseFloat(lastRow[lastRow.length - 1]);
    background = (!isNaN(bg1) && !isNaN(bg2)) ? (bg1 + bg2) / 2 : (!isNaN(bg1) ? bg1 : bg2);
  }

  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;
  const isExcluded = (rowIdx, sampleIdx, dupIdx) =>
    excludedCells && excludedCells.has(getCellKey(rowIdx, sampleIdx, dupIdx));

  const averagedRows = summary.preview.map((row, rowIdx) => {
    const newRow = [];
    for (let i = 1, sampleIdx = 0; i < row.length - 1; i += 2, sampleIdx++) {
      const n1 = isExcluded(rowIdx, sampleIdx, 0) ? NaN : parseFloat(row[i]);
      const n2 = isExcluded(rowIdx, sampleIdx, 1) ? NaN : parseFloat(row[i + 1]);
      let avg = !isNaN(n1) && !isNaN(n2) ? (n1 + n2) / 2 : (!isNaN(n1) ? n1 : n2);
      newRow.push(isNaN(avg) ? NaN : parseFloat((avg - background).toFixed(3))); // Store as number
    }
    if (rowIdx === summary.preview.length - 1 && newRow.length > 0) {
        newRow[newRow.length - 1] = 0.000;
    }
    return [row[0], ...newRow];
  });

  const titers = [], trendlineData = [];

  for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
    const x = [], y = [];
    averagedRows.forEach((row, idx) => {
      const odVal = row[1 + sampleIdx]; // Already a number or NaN from parsing
      if (!isNaN(odVal) && idx < dilutions.length) {
        x.push(Math.log10(dilutions[idx]));
        y.push(odVal);
      }
    });

    let titer = '', fit = null, r2 = null;
    if (x.length >= 4) {
      fit = fit4PL(x, y);
      if (fit && fit.predict) {
        const root = solve4PL(fit, 0.5);
        if (root !== null && isFinite(root)) {
          const dilutionAt05 = Math.pow(10, root);
          titer = Math.round(dilutionAt05).toLocaleString();
        }
        r2 = calculateR2(x, y, fit);
      }
    }
    if (!titer || titer === "0") { // Fallback if no titer or fit failed/produced zero
      if (y.length > 0) {
        const firstDilutionStr = dilutions[0].toLocaleString();
        const lastDilutionStr = dilutions[dilutions.length - 1].toLocaleString();
        if (y[0] < 0.5 && y.every(val => val < 0.5)) titer = `<${firstDilutionStr}`;
        else if (y[y.length - 1] >= 0.5 && y.every(val => val >= 0.5)) titer = `>${lastDilutionStr}`;
        else if (y[0] < 0.5) titer = `<${firstDilutionStr}`; // Default if crosses but fit failed
        else if (y[y.length - 1] >= 0.5) titer = `>${lastDilutionStr}`; // Default if crosses but fit failed
        else titer = "N/A";
      } else {
        titer = "N/A";
      }
    }
    titers.push({ titer, r2 });
    trendlineData.push({ x, y, fit });
  }
  
  function renderPlotly(sampleIdx) {
    const { x, y, fit } = trendlineData[sampleIdx];
    if (!x || x.length === 0) return null;
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const xSmooth = [], ySmooth = [];
    
    if (fit && fit.predict) {

      for (let i = 0; i <= 40; i++) {
        const xi = minX + (maxX - minX) * (i / 40);
        xSmooth.push(xi);
        ySmooth.push(fit.predict(xi));
      }
    }

    return (
      <Plot
        data={[
          { x, y, mode: 'markers', marker: { color: '#1976d2', size: 12 }, name: 'Data' },
          { x: xSmooth, y: ySmooth, mode: 'lines', line: { color: '#43a047', width: 3 }, name: '4PL Fit' },
          { x: [minX, maxX], y: [0.5, 0.5], mode: 'lines', line: { color: '#e55', dash: 'dash', width: 2 }, name: 'OD=0.5' }
        ]}
        layout={{
          width: 400,
          height: 300,
          margin: { l: 60, r: 30, t: 30, b: 60 },
          xaxis: { title: { text: 'log₁₀(Dilution)' } },
          yaxis: { title: { text: 'OD' }, range: [0, Math.max(...y, 1.2) + 0.1] },
          showlegend: true
        }}
        config={{ displayModeBar: false }}
      />
    );
  }

  return (
    <div className={styles.summary_card}>
      <div className={styles.card_header}><h2>OD 0.5 Titer (4PL Fit)</h2></div>
      <div className={styles.sheet_summary}>
        <h3>Plate #{plateNumber}</h3>
        {trendlineData.map((data, idx) => (
          <div key={idx} style={{ margin: '24px 0' }}>
            <h4>{sampleNames[idx] || `Sample ${idx + 1}`}</h4>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {renderPlotly(idx)}
              <table style={{ marginLeft: 24, fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>log₁₀(Dilution)</th>
                    <th>OD</th>
                    <th>Trendline OD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.x.map((xi, i) => (
                    <tr key={i}>
                      <td>{Math.pow(10, xi).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>{data.y[i].toFixed(3)}</td>
                      <td>{data.fit && data.fit.predict ? data.fit.predict(xi).toFixed(3) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ODTiterCard;

// --- FinSumCard ---
export function FinSumCard({ summaries }) {
  if (!summaries || !summaries.length) return null;
  const dilutions = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];

  return (
    <div className={styles.summary_card}>
      <div className={styles.card_header}><h2>Final Titer Summary (4PL)</h2></div>
      <table className={styles.final_table}>
        <thead>
          <tr>
            <th>Sample Name</th>
            <th>Titer</th>
            <th>R²</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary, idx) => {
            const ods = summary.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
            const x = [], y = [];
            for (let i = 0; i < ods.length && i < dilutions.length; i++) {
              if (!isNaN(ods[i])) {
                x.push(Math.log10(dilutions[i]));
                y.push(ods[i]);
              }
            }

            let titer = '', r2 = null;
            if (x.length >= 3) {
              const fit = fit4PL(x, y);
              const root = solve4PL(fit, 0.5);
              if (root && isFinite(root)) {
                const dilutionAt05 = Math.pow(10, root);
                titer = Math.round(dilutionAt05).toLocaleString();
              }
              r2 = calculateR2(x, y, fit);
            }

            if (!titer) {
              if (y[0] < 0.5) titer = '<1,000';
              else if (y[y.length - 1] >= 0.5) titer = '>2,187,000';
              else titer = 'N/A';
            }

            return (
              <tr key={idx}>
                <td>{summary.name || `Sample ${idx + 1}`}</td>
                <td>{titer}</td>
                <td>{r2 !== null ? r2.toFixed(3) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- ODTiterCard component is already 4PL-based and unchanged from previous ---
