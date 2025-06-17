// TiterAnalysis.js
import styles from './TiterAnalysis.module.css';
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
  let b = 10;              // reasonable slope start

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
  const minY = Math.min(a, d);
  const maxY = Math.max(a, d);
  if (y0 <= minY + 1e-4 || y0 >= maxY - 1e-4) return null;

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

  const minOD = Math.min(...y);
  const maxOD = Math.max(...y);
  const smoothOD = [], smoothLogDilution = [];

const minModelY = Math.min(fit.a, fit.d);
const maxModelY = Math.max(fit.a, fit.d);
const odBuffer = 0.05; // avoids edge instability

for (let i = 0; i <= 100; i++) {
  const od = minModelY + odBuffer + (maxModelY - minModelY - 2 * odBuffer) * (i / 100);
  const logDil = solve4PL(fit, od);
  if (logDil !== null && isFinite(logDil)) {
    smoothOD.push(od);
    smoothLogDilution.push(logDil);
  }
}

  return (
    <Plot
      data={[
        { x: y, y: x, mode: 'markers', marker: { color: '#1976d2', size: 12 }, name: 'Data' },
        { x: smoothOD, y: smoothLogDilution, mode: 'lines', line: { color: '#43a047', width: 3 }, name: '4PL Fit' },
        { x: [0.5, 0.5], y: [Math.min(...x), Math.max(...x)], mode: 'lines', line: { color: '#e55', dash: 'dash', width: 2 }, name: 'OD = 0.5' }
      ]}
      layout={{
        width: 400,
        height: 300,
        margin: { l: 60, r: 30, t: 30, b: 60 },
        xaxis: { title: { text: 'OD' } },
yaxis: {
  title: { text: 'log₁₀(Dilution)' },
  autorange: 'reversed',
  range: [Math.max(...x), Math.min(...x)], // or clamp manually if needed
}
,
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
export function FinSumCard({ summary: currentSheetSummary, sampleNames = [], excludedCells = new Set(), plateNumber }) {
  if (!currentSheetSummary || !currentSheetSummary.columns || !currentSheetSummary.preview) {
    // console.log("FinSumCard: Missing summary, columns, or preview");
    return null;
  }

  const sampleCount = Math.floor((currentSheetSummary.columns.length - 1) / 2);
  if (sampleCount <= 0) {
    // console.log("FinSumCard: No samples found");
    return null;
  }
  const dilutions = [1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000];

  let background = 0;
  if (currentSheetSummary.preview.length > 0) {
    const lastRowPreview = currentSheetSummary.preview[currentSheetSummary.preview.length - 1];
    // Ensure lastRowPreview is an array and has enough elements
    if (Array.isArray(lastRowPreview) && lastRowPreview.length >= 2) {
        const bg1 = parseFloat(lastRowPreview[lastRowPreview.length - 2]);
        const bg2 = parseFloat(lastRowPreview[lastRowPreview.length - 1]);
        if (!isNaN(bg1) && !isNaN(bg2)) {
            background = (bg1 + bg2) / 2;
        } else if (!isNaN(bg1)) {
            background = bg1;
        } else if (!isNaN(bg2)) {
            background = bg2;
        }
    }
  }

  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;
  const isExcluded = (rowIdx, sampleIdx, dupIdx) =>
    excludedCells && excludedCells.has(getCellKey(rowIdx, sampleIdx, dupIdx));

  const finalTitersData = [];

  for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
    const x_log_dilutions = [];
    const y_ods = [];

    currentSheetSummary.preview.forEach((row, rowIdx) => {
      if (rowIdx >= dilutions.length) return; // Only consider rows for which a dilution factor is defined

      const n1Idx = 1 + sampleIdx * 2;
      const n2Idx = n1Idx + 1;

      // Ensure row is an array and indices are within bounds
      if (!Array.isArray(row) || n1Idx >= row.length) {
        return; 
      }

      const n1_raw = row[n1Idx];
      const n2_raw = (n2Idx < row.length) ? row[n2Idx] : undefined;

      const n1 = isExcluded(rowIdx, sampleIdx, 0) ? NaN : parseFloat(n1_raw);
      const n2 = isExcluded(rowIdx, sampleIdx, 1) ? NaN : parseFloat(n2_raw);

      let avg_raw;
      if (!isNaN(n1) && !isNaN(n2)) {
        avg_raw = (n1 + n2) / 2;
      } else if (!isNaN(n1)) {
        avg_raw = n1;
      } else if (!isNaN(n2)) {
        avg_raw = n2;
      } else {
        avg_raw = NaN;
      }

      let od_value_for_fit = NaN;
      if (!isNaN(avg_raw)) {
        od_value_for_fit = avg_raw - background;
      }
      
      // Assumption: OD at highest dilution for the last sample is effectively zero after background subtraction.
      if (rowIdx === currentSheetSummary.preview.length - 1 && sampleIdx === sampleCount - 1) {
          od_value_for_fit = 0.000;
      }

      if (!isNaN(od_value_for_fit) && dilutions[rowIdx] !== undefined) {
        x_log_dilutions.push(Math.log10(dilutions[rowIdx]));
        y_ods.push(parseFloat(od_value_for_fit.toFixed(3)));
      }
    });

    let titerStr = 'N/A';
    let r2Val = null;
    const sampleName = sampleNames[sampleIdx] || `Sample ${sampleIdx + 1}`;

    if (x_log_dilutions.length >= 4) {
      const fit = fit4PL(x_log_dilutions, y_ods);
      if (fit && typeof fit.predict === 'function') {
        const root = solve4PL(fit, 0.5); // Target OD = 0.5
        if (root !== null && isFinite(root)) {
          const dilutionAt05 = Math.pow(10, root);
          titerStr = Math.round(dilutionAt05).toLocaleString();
        }
        r2Val = calculateR2(x_log_dilutions, y_ods, fit);
      }
    }

    if (titerStr === 'N/A' || titerStr === "0" || x_log_dilutions.length < 4) {
      if (y_ods.length > 0) {
        const firstDilutionStr = (dilutions[0] || 1000).toLocaleString();
        const lastDilutionStr = (dilutions[dilutions.length - 1] || 2187000).toLocaleString();
        if (y_ods[0] < 0.5 && y_ods.every(val => val < 0.5)) titerStr = `<${firstDilutionStr}`;
        else if (y_ods[y_ods.length - 1] >= 0.5 && y_ods.every(val => val >= 0.5)) titerStr = `>${lastDilutionStr}`;
        else if (y_ods[0] < 0.5) titerStr = `<${firstDilutionStr}`;
        else if (y_ods[y_ods.length - 1] >= 0.5) titerStr = `>${lastDilutionStr}`;
      } else {
        titerStr = "N/A";
      }
    }

    finalTitersData.push({ name: sampleName, titer: titerStr, r2: r2Val });
  }

  const getR2Style = (r2) => {
    if (r2 === null || isNaN(r2)) {
      return {};
    }
    if (r2 >= 0.95) {
      return { color: 'green', fontWeight: 'bold' };
    } else if (r2 >= 0.90) {
      return { color: 'orange', fontWeight: 'bold' };
    }
    return { color: 'red', fontWeight: 'bold' };
  };
  return (
    <div className={styles.summary_card}>
      <div className={styles.card_header}><h2>Final Titer Summary (4PL @ OD=0.5)</h2></div>
      <div className={styles.sheet_summary}>
        {plateNumber && <h3>Plate #{plateNumber}</h3>}
        <table className={styles.final_table} style={{ marginTop: '10px' }}>
          <thead>
            <tr>
              <th>Sample Name</th>
              <th>Titer</th>
              <th>R²</th>
            </tr>
          </thead>
          <tbody>
            {finalTitersData.map((data, idx) => (
              <tr key={idx}>
                <td>{data.name}</td>
                <td>{data.titer}</td>
                <td style={getR2Style(data.r2)}>{data.r2 !== null && !isNaN(data.r2) ? data.r2.toFixed(3) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// --- ODTiterCard component is already 4PL-based and unchanged from previous ---
