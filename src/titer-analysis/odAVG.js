import React from 'react';

// Simple 2nd degree polynomial regression using least squares
function poly2Regression(x, y) {
  // Fit y = a*x^2 + b*x + c
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
  // Solve the normal equations
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const B = [sumY, sumXY, sumX2Y];

  // Gaussian elimination
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

// Find root of ax^2 + bx + c = y0 (for OD=0.5)
function solvePoly2(a, b, c, y0) {
  // a*x^2 + b*x + (c-y0) = 0
  const d = b * b - 4 * a * (c - y0);
  if (d < 0) return null;
  const sqrtD = Math.sqrt(d);
  const x1 = (-b + sqrtD) / (2 * a);
  const x2 = (-b - sqrtD) / (2 * a);
  // Return the positive root (dilution increases with x)
  return Math.max(x1, x2);
}

// Calculate R^2 for fit
function calculateR2(x, y, fit) {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < x.length; i++) {
    const yPred = fit.a * x[i] * x[i] + fit.b * x[i] + fit.c;
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - yPred) ** 2;
  }
  return 1 - ssRes / ssTot;
}

function ODTiterCard({ summary, sampleNames = [], plateNumber }) {
  if (!summary || !summary.columns || !summary.preview) return null;

  // Assume first column is label, then pairs of OD values for each sample
  const sampleCount = Math.floor((summary.columns.length - 1) / 2);

  // Dilution factors (should match your experiment, adjust as needed)
  const dilutions = [
    1000, 3000, 9000, 27000, 81000, 243000, 729000, 2187000
  ];

  // For each sample, extract OD values across all rows
  const titers = [];
  const trendlineData = [];
  for (let sampleIdx = 0; sampleIdx < sampleCount; sampleIdx++) {
    // For each row, get the average OD for this sample (average of the pair)
    const ods = summary.preview.map(row => {
      const n1 = parseFloat(row[1 + sampleIdx * 2]);
      const n2 = parseFloat(row[2 + sampleIdx * 2]);
      if (!isNaN(n1) && !isNaN(n2)) return (n1 + n2) / 2;
      if (!isNaN(n1)) return n1;
      if (!isNaN(n2)) return n2;
      return NaN;
    });

    // Only use points with valid OD and dilution
    const x = [];
    const y = [];
    for (let i = 0; i < ods.length && i < dilutions.length; i++) {
      if (!isNaN(ods[i])) {
        x.push(Math.log10(dilutions[i]));
        y.push(ods[i]);
      }
    }

    // Find the three points: two above and one below OD=0.5 (or vice versa)
    let idxBelow = -1;
    for (let i = 0; i < y.length - 1; i++) {
      if ((y[i] >= 0.5 && y[i + 1] < 0.5) || (y[i] < 0.5 && y[i + 1] >= 0.5)) {
        idxBelow = y[i] < 0.5 ? i : i + 1;
        break;
      }
    }
    let xFit = [], yFit = [];
    if (idxBelow > 0 && idxBelow < y.length - 1) {
      // Two above, one below
      xFit = [x[idxBelow - 1], x[idxBelow], x[idxBelow + 1]];
      yFit = [y[idxBelow - 1], y[idxBelow], y[idxBelow + 1]];
    } else if (idxBelow === 0 && y.length >= 3) {
      // Edge case: first three points
      xFit = [x[0], x[1], x[2]];
      yFit = [y[0], y[1], y[2]];
    } else if (idxBelow === y.length - 1 && y.length >= 3) {
      // Edge case: last three points
      xFit = [x[y.length - 3], x[y.length - 2], x[y.length - 1]];
      yFit = [y[y.length - 3], y[y.length - 2], y[y.length - 1]];
    } else if (y.length >= 3) {
      // Fallback: use last three points
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
    if (xFit.length === 3) {
      fit = poly2Regression(xFit, yFit);
      // Only generate trendline points for the three fit points
      fitPoints = xFit.map((xi, i) => ({
        logDil: xi,
        od: fit.a * xi * xi + fit.b * xi + fit.c
      }));
      // Solve for OD=0.5
      const root = solvePoly2(fit.a, fit.b, fit.c, 0.5);
      if (root && isFinite(root)) {
        const dilutionAt05 = Math.pow(10, root);
        titer = Math.round(dilutionAt05).toLocaleString();
      }
      r2 = calculateR2(xFit, yFit, fit);
    }
    if (!titer) {
      if (y[0] < 0.5) titer = "<1,000";
      else if (y[y.length - 1] >= 0.5) titer = ">2,187,000";
      else titer = "N/A";
    }
    titers.push({ titer, r2 });
    trendlineData.push({ xFit, yFit, fit, fitPoints, r2 });
  }

    // Visualization using SVG (simple, no dependencies)
  function renderPlot(sampleIdx) {
  const { xFit, yFit, fit, fitPoints } = trendlineData[sampleIdx];
  if (!fit || !fitPoints.length) return null;
  // SVG dimensions
  const W = 380, H = 180, PAD = 50; // Increased width
  // X/Y ranges
  const minX = Math.min(...xFit), maxX = Math.max(...xFit);
  const minY = 0, maxY = Math.max(...yFit, 1.2);
  // Map logDil, od to SVG coords
  const xMap = xi => PAD + ((xi - minX) / (maxX - minX)) * (W - 2 * PAD);
  const yMap = yi => H - PAD - ((yi - minY) / (maxY - minY)) * (H - 2 * PAD);

  // Trendline curve (only for the three fit points)
  const trendPath = fitPoints.map((pt, i) =>
    `${i === 0 ? 'M' : 'L'}${xMap(pt.logDil)},${yMap(pt.od)}`
  ).join(' ');

  // OD=0.5 line
  const od05Y = yMap(0.5);

  return (
    <svg width={W} height={H} style={{ background: "#fff", border: "1px solid #ccc", margin: 8 }}>
      {/* Axes */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#333" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#333" />
      {/* OD=0.5 line */}
      <line x1={PAD} y1={od05Y} x2={W - PAD} y2={od05Y} stroke="#e55" strokeDasharray="4" />
      {/* Data points */}
      {xFit.map((xi, i) => (
        <circle key={i} cx={xMap(xi)} cy={yMap(yFit[i])} r={6} fill="#1976d2" />
      ))}
      {/* Trendline */}
      <path d={trendPath} fill="none" stroke="#43a047" strokeWidth={2} />
      {/* Labels */}
      <text x={PAD} y={PAD - 8} fontSize="12" fill="#333">OD</text>
      <text x={W - PAD} y={H - PAD + 16} fontSize="12" fill="#333" textAnchor="end">log₁₀(Dilution)</text>
      <text x={PAD + 4} y={od05Y - 4} fontSize="11" fill="#e55">OD=0.5</text>
    </svg>
  );
}
  return (
    <div className="summary-card">
      <div className="card-header">
        <div className="card-title">
          <h2>OD 0.5 Titer (Polynomial Fit, 3-point)</h2>
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
                {titers.map((t, idx) => (
                  <td key={idx}>
                    {t.titer}
                    <br />
                    <span style={{ fontSize: 12, color: t.r2 >= 0.7 ? "#43a047" : "#e55" }}>
                      R²: {t.r2 !== null ? t.r2.toFixed(3) : "N/A"}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {/* Show trendline data and plot for each sample */}
        {trendlineData.map((data, idx) => (
          <div key={idx} style={{ margin: "24px 0" }}>
            <h4 style={{ marginBottom: 4 }}>{sampleNames[idx] || `Sample ${idx + 1}`}</h4>
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              {renderPlot(idx)}
              <table style={{ marginLeft: 24, fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>log₁₀(Dilution)</th>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>OD</th>
                    <th style={{ border: "1px solid #ccc", padding: "2px 6px" }}>Trendline OD</th>
                  </tr>
                </thead>
                <tbody>
                  {data.xFit.map((xi, i) => (
                    <tr key={i}>
                      <td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>{xi.toFixed(3)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>{data.yFit[i].toFixed(3)}</td>
                      <td style={{ border: "1px solid #ccc", padding: "2px 6px" }}>
                        {data.fit ? (data.fit.a * xi * xi + data.fit.b * xi + data.fit.c).toFixed(3) : ""}
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