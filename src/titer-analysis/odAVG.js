// odavg.js
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
  // let b = 10;              // reasonable slope start

    // Dynamically estimate initial b (Hill slope parameter for the model (logX/logC)^b)
  // x contains log10(dilution) values.
  let b_initial_guess = 4.0; // Default initial guess, more moderate than the previous 10

  // Ensure there's enough data and a valid y-range to attempt dynamic estimation
  if (x.length >= 2 && (d_init - a_init) > 1e-6) {
    const y_target_upper_norm_level = 0.80; // Target 80% of response range from min_y
    const y_target_lower_norm_level = 0.20; // Target 20% of response range from min_y

    const y_target_80_percent_response = a_init + y_target_upper_norm_level * (d_init - a_init);
    const y_target_20_percent_response = a_init + y_target_lower_norm_level * (d_init - a_init);

    const findClosestYPoint = (targetY, xs_coords, ys_coords) => {
      let minDiff = Infinity;
      let bestX = xs_coords[0]; // Default to first point
      let bestY = ys_coords[0];
      for (let i = 0; i < ys_coords.length; i++) {
        const diff = Math.abs(ys_coords[i] - targetY);
        if (diff < minDiff) {
          minDiff = diff;
          bestX = xs_coords[i];
          bestY = ys_coords[i];
        }
      }
      return { x: bestX, y: bestY };
    };

    const point_near_80_response = findClosestYPoint(y_target_80_percent_response, x, y);
    const point_near_20_response = findClosestYPoint(y_target_20_percent_response, x, y);

    // For a decreasing curve (OD vs log_dilution), y_upper_OD > y_lower_OD,
    // and x_for_y_upper_OD (log_dilution) < x_for_y_lower_OD (log_dilution).
    // Assign x1,y1 to the point with higher OD, and x2,y2 to the point with lower OD.
    const x1_log_dil = point_near_80_response.y > point_near_20_response.y ? point_near_80_response.x : point_near_20_response.x;
    const y1_od_actual = point_near_80_response.y > point_near_20_response.y ? point_near_80_response.y : point_near_20_response.y;
    const x2_log_dil = point_near_80_response.y > point_near_20_response.y ? point_near_20_response.x : point_near_80_response.x;
    const y2_od_actual = point_near_80_response.y > point_near_20_response.y ? point_near_20_response.y : point_near_80_response.y;

    if (x1_log_dil !== x2_log_dil && y1_od_actual !== y2_od_actual && (d_init - a_init) > 1e-6) {
      let Y1_norm = (y1_od_actual - a_init) / (d_init - a_init); // Normalized OD for y1_od_actual (closer to 0.8)
      let Y2_norm = (y2_od_actual - a_init) / (d_init - a_init); // Normalized OD for y2_od_actual (closer to 0.2)

      // Clamp normalized values to avoid issues with log or division by zero
      Y1_norm = Math.max(0.01, Math.min(0.99, Y1_norm));
      Y2_norm = Math.max(0.01, Math.min(0.99, Y2_norm));

      if (Y1_norm > Y2_norm && x2_log_dil !== 0) { // Ensure Y1_norm is higher and x2_log_dil (denominator for x-ratio) is not zero
        const term_numerator_y_norm = (1 / Y1_norm) - 1;
        const term_denominator_y_norm = (1 / Y2_norm) - 1;

        if (term_denominator_y_norm !== 0) {
          const log_argument_y_ratio = term_numerator_y_norm / term_denominator_y_norm;
          const log_argument_x_ratio = x1_log_dil / x2_log_dil; // x1_log_dil < x2_log_dil for decreasing curve, so ratio < 1

          if (log_argument_y_ratio > 0 && log_argument_x_ratio > 0 && log_argument_x_ratio !== 1) {
            // b = log( ((1/Y1_norm)-1) / ((1/Y2_norm)-1) ) / log(x1/x2)
            // For decreasing curve, Y1_norm > Y2_norm => log_arg_y_ratio < 1 => log(log_arg_y_ratio) is negative.
            // x1_log_dil < x2_log_dil => log_arg_x_ratio < 1 => log(log_arg_x_ratio) is negative.
            // So, b_calculated should be positive.
            const b_calculated = Math.log(log_argument_y_ratio) / Math.log(log_argument_x_ratio);
            
            if (!isNaN(b_calculated) && isFinite(b_calculated)) {
              if (b_calculated <= 0.1) b_initial_guess = 0.5; // Floor for very small calculated slopes
              else if (b_calculated >= 25.0) b_initial_guess = 20.0; // Cap if calculated slope is extremely high
              else b_initial_guess = b_calculated;
            }
          }
        }
      }
    }
  }
  let b = b_initial_guess; // Use the dynamically calculated or default guess


  const maxIter = 1000;
  const tol = 1e-6;

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
    b = Math.max(0.1, Math.min(b, 25.0)); 
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
        try {
            fit = fit4PL(x, y);
            if (fit && typeof fit.predict === 'function') {
            const root = solve4PL(fit, 0.5);
            if (root !== null && isFinite(root)) {
                const dilutionAt05 = Math.pow(10, root);
                titer = Math.round(dilutionAt05).toLocaleString();
            }
            r2 = calculateR2(x, y, fit);
            }
        } catch (e) {
            console.warn(`Sample ${sampleIdx + 1} failed to fit 4PL model:`, e);
            fit = null;
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
  if (!x || x.length === 0 || !fit || fit.a == null || fit.d == null) return null;

  const smoothOD = [], smoothLogDilution = [];

  // Make the trendline much longer by expanding the OD range
  const minDataOD = Math.min(...y);
  const maxDataOD = Math.max(...y);
  const odBuffer = 0.08 * (maxDataOD - minDataOD || 1); // 8% buffer or 0.08 if flat
  const odStart = minDataOD - 3 * odBuffer;
  const odEnd = maxDataOD + 1 * odBuffer;

  for (let i = 0; i <= 300; i++) {
    const od = odStart + (odEnd - odStart) * (i / 300);
    const logDil = solve4PL(fit, od);
    if (logDil !== null && isFinite(logDil)) {
      smoothOD.push(od);
      smoothLogDilution.push(logDil);
    }
  }

  return (
    <Plot
      data={[
        { x: y, y: x, mode: 'markers', marker: { color: '#006c02', size: 10 }, name: 'Data' },
        { x: smoothOD, y: smoothLogDilution, mode: 'lines', line: { color: '#00c60d', width: 2 }, name: '4PL Fit' },
        { x: [0.5, 0.5], y: [Math.min(...x), Math.max(...x)], mode: 'lines', line: { color: '#f1b100', dash: 'dash', width: 2 }, name: 'OD = 0.5' }
      ]}
      layout={{
        width: 550,
        height: 400,
        margin: { l: 60, r: 30, t: 30, b: 60 },
        xaxis: {
          title: { text: 'OD' },
          range: [odStart, odEnd],
        },
        yaxis: {
          title: { text: 'log₁₀(Dilution)' },
          autorange: 'reversed',
          range: [Math.max(...x), Math.min(...x)],
        },
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
