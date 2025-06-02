import React from 'react';
import Plot from 'react-plotly.js';

//Polynomial 2 - Quadratic regression   
function poly2Regression(x, y) {
  const n = x.length;
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumY = 0, sumXY = 0, sumX2Y = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumX2 += x[i] ** 2;
    sumX3 += x[i] ** 3;
    sumX4 += x[i] ** 4;
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2Y += (x[i] ** 2) * y[i];
  }
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const B = [sumY, sumXY, sumX2Y];

  function gauss(A, B) {
    const n = B.length;
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }
      for (let k = i; k < n; k++) {
        let tmp = A[maxRow][k];
        A[maxRow][k] = A[i][k];
        A[i][k] = tmp;
      }
      let tmp = B[maxRow];
      B[maxRow] = B[i];
      B[i] = tmp;

      for (let k = i + 1; k < n; k++) {
        let c = -A[k][i] / A[i][i];
        for (let j = i; j < n; j++) {
          if (i === j) {
            A[k][j] = 0;
          } else {
            A[k][j] += c * A[i][j];
          }
        }
        B[k] += c * B[i];
      }
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = B[i] / A[i][i];
      for (let k = i - 1; k >= 0; k--) {
        B[k] -= A[k][i] * x[i];
      }
    }
    return x;
  }
  const [c, b, a] = gauss(A, B);
  return { a, b, c };
}

function solvePoly2(a, b, c, y0) {
  const d = b * b - 4 * a * (c - y0);
  if (d < 0) return null;
  const sqrtD = Math.sqrt(d);
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  return Math.max(x1, x2);
}
// Polynomial 3 - Cubic regression
function poly3Regression(x, y) {
  const n = x.length;
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumX5 = 0, sumX6 = 0;
  let sumY = 0, sumXY = 0, sumX2Y = 0, sumX3Y = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i], yi = y[i];
    const xi2 = xi * xi, xi3 = xi2 * xi, xi4 = xi3 * xi, xi5 = xi4 * xi, xi6 = xi5 * xi;
    sumX += xi;
    sumX2 += xi2;
    sumX3 += xi3;
    sumX4 += xi4;
    sumX5 += xi5;
    sumX6 += xi6;
    sumY += yi;
    sumXY += xi * yi;
    sumX2Y += xi2 * yi;
    sumX3Y += xi3 * yi;
  }
  // Solve the system: [ [n, sumX, sumX2, sumX3], ... ]
  const A = [
    [n, sumX, sumX2, sumX3],
    [sumX, sumX2, sumX3, sumX4],
    [sumX2, sumX3, sumX4, sumX5],
    [sumX3, sumX4, sumX5, sumX6]
  ];
  const B = [sumY, sumXY, sumX2Y, sumX3Y];

  // Gaussian elimination for 4x4
  function gauss(A, B) {
    const n = B.length;
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) {
          maxEl = Math.abs(A[k][i]);
          maxRow = k;
        }
      }
      for (let k = i; k < n; k++) {
        let tmp = A[maxRow][k];
        A[maxRow][k] = A[i][k];
        A[i][k] = tmp;
      }
      let tmp = B[maxRow];
      B[maxRow] = B[i];
      B[i] = tmp;

      for (let k = i + 1; k < n; k++) {
        let c = -A[k][i] / A[i][i];
        for (let j = i; j < n; j++) {
          if (i === j) {
            A[k][j] = 0;
          } else {
            A[k][j] += c * A[i][j];
          }
        }
        B[k] += c * B[i];
      }
    }
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = B[i] / A[i][i];
      for (let k = i - 1; k >= 0; k--) {
        B[k] -= A[k][i] * x[i];
      }
    }
    return x;
  }
  const [d, c, b, a] = gauss(A, B);
  return { a, b, c, d };
}

// Solve cubic: a*x^3 + b*x^2 + c*x + d = y0
function solvePoly3(a, b, c, d, y0) {
  // Solve a*x^3 + b*x^2 + c*x + (d - y0) = 0
  d = d - y0;
  // Use Cardano's method or numeric root finding
  // We'll use numeric root finding (Newton-Raphson with fallback to bisection)
  function f(x) { return a*x*x*x + b*x*x + c*x + d; }
  // Try several initial guesses in the range [0, 10]
  let root = null;
  for (let guess = 0; guess <= 10; guess += 0.1) {
    let x0 = guess;
    let x = x0;
    let maxIter = 100;
    for (let i = 0; i < maxIter; i++) {
      let fx = f(x);
      let dfx = 3*a*x*x + 2*b*x + c;
      if (Math.abs(dfx) < 1e-8) break;
      let x1 = x - fx / dfx;
      if (Math.abs(x1 - x) < 1e-7) {
        if (x1 > 0 && x1 < 10) {
          root = x1;
          break;
        }
      }
      x = x1;
    }
    if (root !== null) break;
  }
  return root;
}


function calculateR2(x, y, fit) {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < x.length; i++) {
    const yPred = fit.a * x[i] * x[i] * x[i] + fit.b * x[i] * x[i] + fit.c * x[i] + fit.d;
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - yPred) ** 2;
  }
  return 1 - ssRes / ssTot;
}


function ODTiterCard({ summary, sampleNames = [], plateNumber, excludedCells }) {
  if (!summary || !summary.columns || !summary.preview) return null;

  const sampleCount = Math.floor((summary.columns.length - 1) / 2);
  const dilutions = [
    1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000
  ];

  // --- Use the same background and averaging logic as dupBG.js ---
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

  // Helper for exclusion key
  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;
  const isExcluded = (rowIdx, sampleIdx, dupIdx) =>
    excludedCells && excludedCells.has(getCellKey(rowIdx, sampleIdx, dupIdx));

  // Prepare averaged data: for each row, for each pair, take average and subtract global background
  const averagedRows = summary && summary.preview
    ? summary.preview.map((row, rowIdx) => {
        const newRow = [];
        for (let i = 1, sampleIdx = 0; i < row.length - 1; i += 2, sampleIdx++) {
          const n1 = isExcluded(rowIdx, sampleIdx, 0) ? NaN : parseFloat(row[i]);
          const n2 = isExcluded(rowIdx, sampleIdx, 1) ? NaN : parseFloat(row[i + 1]);
          let avg = '';
          if (!isNaN(n1) && !isNaN(n2)) {
            avg = ((n1 + n2) / 2) - background;
            avg = avg.toFixed(3);
          } else if (!isNaN(n1)) {
            avg = n1 - background;
            avg = avg.toFixed(3);
          } else if (!isNaN(n2)) {
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

  const titers = [];
  const trendlineData = [];
  for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
    // Use the averagedRows for background-subtracted, averaged data
    const ods = averagedRows.map(row => {
      const v = parseFloat(row[1 + sampleIdx]);
      return !isNaN(v) ? v : NaN;
    });

    const x = [];
    const y = [];
    for (let i = 0; i < ods.length && i < dilutions.length; i++) {
      if (!isNaN(ods[i])) {
        x.push(Math.log10(dilutions[i]));
        y.push(ods[i]);
      }
    }

    // Find the three points: two above 0.5 and one below (or vice versa), all closest to 0.5
    let idxs = [];
    for (let i = 0; i < y.length - 1; i++) {
      if ((y[i] >= 0.5 && y[i + 1] < 0.5) || (y[i] < 0.5 && y[i + 1] >= 0.5)) {
        const above = [];
        const below = [];
        for (let j = 0; j < y.length; j++) {
          if (y[j] >= 0.5) {
            above.push({ idx: j, diff: Math.abs(y[j] - 0.5) });
          } else {
            below.push({ idx: j, diff: Math.abs(y[j] - 0.5) });
          }
        }
        above.sort((a, b) => a.diff - b.diff);
        below.sort((a, b) => a.diff - b.diff);

        if (above.length >= 2 && below.length >= 1) {
          idxs = [above[0].idx, above[1].idx, below[0].idx];
        } else if (below.length >= 2 && above.length >= 1) {
          idxs = [below[0].idx, below[1].idx, above[0].idx];
        } else {
          idxs = y
            .map((val, idx) => ({ idx, diff: Math.abs(val - 0.5) }))
            .sort((a, b) => a.diff - b.diff)
            .slice(0, 3)
            .map(obj => obj.idx);
        }
        idxs = idxs.sort((a, b) => a - b);
        break;
      }
    }
    if (idxs.length !== 3 && y.length >= 3) {
      idxs = y
        .map((val, idx) => ({ idx, diff: Math.abs(val - 0.5) }))
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 3)
        .map(obj => obj.idx)
        .sort((a, b) => a - b);
    }

    let xFit = [], yFit = [];
    if (idxs.length === 3) {
      xFit = idxs.map(i => x[i]);
      yFit = idxs.map(i => y[i]);
    } else if (y.length >= 3) {
      xFit = x.slice(-3);
      yFit = y.slice(-3);
    } else {
      xFit = x;
      yFit = y;
    }

    let titer = '';
    let fit = null;
    let fitPoints = [];
    let r2 = null;
    if (x.length >= 3) {
      // fit = poly2Regression(x, y);

      fit = poly3Regression(x, y);
fitPoints = x.map((xi, i) => ({
  logDil: xi,
  od: fit.a * xi * xi * xi + fit.b * xi * xi + fit.c * xi + fit.d
}));
if (xFit.length === 3) {
  const tFit = poly3Regression(xFit, yFit);
  const root = solvePoly3(tFit.a, tFit.b, tFit.c, tFit.d, 0.5);
  if (root && isFinite(root)) {
    const dilutionAt05 = Math.pow(10, root);
    titer = Math.round(dilutionAt05).toLocaleString();
  }
}
      r2 = calculateR2(x, y, fit); // R² with all points
    }
    if (!titer) {
      if (y[0] < 0.5) titer = "<1,000";
      else if (y[y.length - 1] >= 0.5) titer = ">2,187,000";
      else titer = "N/A";
    }
    titers.push({ titer, r2 });
    trendlineData.push({ x, y, fit, fitPoints, r2 });
  }

  function renderPlotly(sampleIdx) {
    const { x, y, fit } = trendlineData[sampleIdx];
    if (!fit || !x.length) return null;

    // Generate smooth curve for the fit
    const xSmooth = [];
    const ySmooth = [];
    const minX = Math.min(...x), maxX = Math.max(...x);
    for (let i = 0; i <= 40; i++) {
      const xi = minX + (maxX - minX) * (i / 40);
      xSmooth.push(xi);
      ySmooth.push(fit.a * xi * xi * xi + fit.b * xi * xi + fit.c * xi + fit.d);
    }

    return (
      <Plot
        data={[
          {
            x: x,
            y: y,
            mode: 'markers',
            marker: { color: '#1976d2', size: 12 },
            name: 'Data Points'
          },
          {
            x: xSmooth,
            y: ySmooth,
            mode: 'lines',
            line: { color: '#43a047', width: 3 },
            name: 'Cubic Fit'
          },
          {
            x: [Math.min(...x), Math.max(...x)],
            y: [0.5, 0.5],
            mode: 'lines',
            line: { color: '#e55', dash: 'dash', width: 2 },
            name: 'OD=0.5'
          }
        ]}
        layout={{
          width: 400,
          height: 300,
          margin: { l: 60, r: 30, t: 30, b: 60 },
          xaxis: {
            title: { text: 'log₁₀(Dilution)' },
            range: [Math.min(...x) - 0.1, Math.max(...x) + 0.1]
          },
          yaxis: {
            title: { text: 'OD' },
            range: [0, Math.max(...y, 1.2) + 0.1]
          },
          showlegend: true
        }}
        config={{ displayModeBar: false }}
      />
    );
  }

  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>OD 0.5 Titer (Polynomial Fit, BG subtracted)</h2>
        </div>
      </div>
      <div className="sheet-summary">
        <h3>Plate #{plateNumber}</h3>
       
        {/* Show trendline data and plot for each sample */}
        {trendlineData.map((data, idx) => (
          <div key={idx} style={{ margin: "24px 0" }}>
            <h4 style={{ marginBottom: 4 }}>{sampleNames[idx] || `Sample ${idx + 1}`}</h4>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              {renderPlotly(idx)}
              <table style={{ marginLeft: 24, fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>log₁₀(Dilution)</th>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>OD</th>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>Trendline OD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.x.map((xi, i) => (
                    <tr key={i}>
<td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>
  {Math.pow(10, xi).toLocaleString(undefined, { maximumFractionDigits: 0 })}
</td>                      <td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>{data.y[i].toFixed(3)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>
{data.fit ? (data.fit.a * xi * xi * xi + data.fit.b * xi * xi + data.fit.c * xi + data.fit.d).toFixed(3) : ""}
                      </td>
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

export function FinSumCard({ summary, sampleNames = [], plateNumber, excludedCells }) {
  if (!summary || !summary.columns || !summary.preview) return null;

  const sampleCount = Math.floor((summary.columns.length - 1) / 2);
  const dilutions = [
    1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000
  ];

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

  // Helper for exclusion key
  const getCellKey = (rowIdx, sampleIdx, dupIdx) => `r${rowIdx}s${sampleIdx}d${dupIdx}`;
  const isExcluded = (rowIdx, sampleIdx, dupIdx) =>
    excludedCells && excludedCells.has(getCellKey(rowIdx, sampleIdx, dupIdx));

  // Prepare averaged data: for each row, for each pair, take average and subtract global background
  const averagedRows = summary && summary.preview
    ? summary.preview.map((row, rowIdx) => {
        const newRow = [];
        for (let i = 1, sampleIdx = 0; i < row.length - 1; i += 2, sampleIdx++) {
          const n1 = isExcluded(rowIdx, sampleIdx, 0) ? NaN : parseFloat(row[i]);
          const n2 = isExcluded(rowIdx, sampleIdx, 1) ? NaN : parseFloat(row[i + 1]);
          let avg = '';
          if (!isNaN(n1) && !isNaN(n2)) {
            avg = ((n1 + n2) / 2) - background;
            avg = avg.toFixed(3);
          } else if (!isNaN(n1)) {
            avg = n1 - background;
            avg = avg.toFixed(3);
          } else if (!isNaN(n2)) {
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

  // For each sample, fit quadratic to all points and solve for dilution at OD=0.5
  // Replace the for loop in FinSumCard with this fixed version:

const titers = [];
const r2s = [];
for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
  const ods = averagedRows.map(row => {
    const v = parseFloat(row[1 + sampleIdx]);
    return !isNaN(v) ? v : NaN;
  });

  const x = [];
  const y = [];
  for (let i = 0; i < ods.length && i < dilutions.length; i++) {
    if (!isNaN(ods[i])) {
      x.push(Math.log10(dilutions[i]));
      y.push(ods[i]);
    }
  }

let titer = "N/A";
let r2 = null;
if (x.length >= 4) {
  const fit = poly3Regression(x, y);
  r2 = calculateR2(x, y, fit);
  // Bisection method in data range
  const f = xi => fit.a * xi ** 3 + fit.b * xi ** 2 + fit.c * xi + fit.d - 0.5;
  let minX = Math.min(...x), maxX = Math.max(...x);
  let left = minX, right = maxX, mid, fLeft = f(left), fRight = f(right);
  let found = false;
  if (fLeft * fRight < 0) {
    for (let i = 0; i < 50; i++) {
      mid = (left + right) / 2;
      let fMid = f(mid);
      if (Math.abs(fMid) < 1e-6) { found = true; break; }
      if (fLeft * fMid < 0) {
        right = mid;
        fRight = fMid;
      } else {
        left = mid;
        fLeft = fMid;
      }
    }
    if (found || Math.abs(f(mid)) < 1e-3) {
      const dilutionAt05 = Math.pow(10, mid);
      titer = Math.round(dilutionAt05).toLocaleString();
    }
  }
  // Add these checks for "<1,000" and ">2,187,000"
  if (titer === "N/A" || titer === "0") {
    if (y[0] < 0.5) {
      titer = "<1,000";
    } else if (y[y.length - 1] >= 0.5) {
      titer = ">2,187,000";
    }
  }
}
else {
  // Not enough points for fit, but still check edge cases
  if (y[0] < 0.5) {
    titer = "<1,000";
  } else if (y[y.length - 1] >= 0.5) {
    titer = ">2,187,000";
  }
}
  titers.push(titer);
  r2s.push(r2);
}

  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>Final Titer (OD=0.5 from Trendline)</h2>
        </div>
      </div>
      <div className="sheet-summary">
        <h3>Plate #{plateNumber}</h3>
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {Array.from({ length: sampleCount }).map((_, idx) => (
                  <th key={idx} style={{ textAlign: 'center' }}>
                    {sampleNames[idx] || `Sample ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {titers.map((titer, idx) => (
                  <td key={idx} style={{ fontWeight: 600, fontSize: 18 }}>
                    {titer}
                    <br />
                    <span style={{ fontSize: 12, color: r2s[idx] >= 0.7 ? "#43a047" : "#e55" }}>
                      R²: {r2s[idx] !== null ? r2s[idx].toFixed(3) : "N/A"}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}