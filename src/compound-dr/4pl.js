// 4pl.js
import styles from './compound-dr.module.css';
import Plot from 'react-plotly.js';

function fourPL(logx, a, b, c, d) {
  const x = Math.pow(10, logx);
  return a + (d - a) / (1 + Math.pow(c / x, b));
}

function fit4PL(logxArr, yArr) {
  const a_init = Math.min(...yArr);
  const d_init = Math.max(...yArr);
  const halfMax = (a_init + d_init) / 2;
  const closestIdx = yArr.reduce((bestIdx, val, idx) =>
    Math.abs(val - halfMax) < Math.abs(yArr[bestIdx] - halfMax) ? idx : bestIdx, 0);

  let a = a_init;
  let d = d_init;
  let c = Math.pow(10, logxArr[closestIdx]);

  // Dynamically test different b values for best R²
  let bestB = 1.0;
  let bestFit = null;
  let bestR2 = -Infinity;

  for (let bTest = 0.2; bTest <= 10; bTest += 0.2) {
    const b = bTest;
    const predict = (logx) => fourPL(logx, a, b, c, d);
    const r2 = calculateR2(logxArr, yArr, { predict });
    if (r2 > bestR2) {
      bestR2 = r2;
      bestB = b;
      bestFit = { a, b, c, d, predict };
    }
  }

  bestFit.ic50 = bestFit.c; // Store IC50 as concentration directly
  return bestFit;
}

function solve4PL({ a, b, c, d }, y0) {
  const minY = Math.min(a, d), maxY = Math.max(a, d);
  if (y0 <= minY + 0.01 || y0 >= maxY - 0.01) return null;
  const ratio = (d - a) / (y0 - a) - 1;
  if (ratio <= 0) return null;
  const x = c / Math.pow(ratio, 1 / b);
  return Math.log10(x);
}

function calculateR2(x, y, fit) {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < x.length; i++) {
    const yPred = fit.predict(x[i]);
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - yPred) ** 2;
  }
  return 1 - ssRes / ssTot;
}




// PercentInhibitionCard.js
function PercentInhibitionCard({ summary }) {
  if (!summary || !summary.preview || summary.preview.length < 6) return null;
  const concRowIdx = summary.preview.findIndex(row =>
    typeof row[0] === 'string' && row[0].toLowerCase().includes('inhibitor conc')
  );
  if (concRowIdx === -1) return <div className={styles.summary_card}>Inhibitor concentration row not found.</div>;

  const headerRow = summary.preview[concRowIdx];
  const concentrations = headerRow.slice(1, -1).map(Number);
  const dataRows = summary.preview.slice(concRowIdx + 2, concRowIdx + 5).map(row => row.slice(1, -1));

  const avgByConc = concentrations.map((_, i) => {
    const vals = dataRows.map(row => parseFloat(row[i])).filter(v => !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
  });

  const negCtrl = avgByConc[0];
  const posCtrl = avgByConc[avgByConc.length - 2];
  const percentInhib = avgByConc.map(val => 100 - 100 * (val - negCtrl) / (posCtrl - negCtrl));

  const logX = [], y = [];
  concentrations.forEach((conc, i) => {
    const inhib = percentInhib[i];
    if (isFinite(conc) && isFinite(inhib)) {
      logX.push(Math.log10(conc === 0 ? 1e-9 : conc));
      y.push(inhib);
    }
  });

  if (logX.length < 4 || new Set(y).size < 4)
    return <div className={styles.summary_card}>Not enough valid data for 4PL fit.</div>;

  const fit = fit4PL(logX, y);
  const r2 = calculateR2(logX, y, fit);
  const ic50_log = solve4PL(fit, 50);
  const ic50 = ic50_log !== null ? Math.pow(10, ic50_log) : null;
  const minTick = 0.0001;
  const maxTick = 10000;
  // Extend fitLineX and fitLineY to cover a much wider x-axis range
  const fitLineMin = minTick / 100;
  const fitLineMax = maxTick * 100;
  const fitLineX = [], fitLineY = [];
  for (let i = 0; i <= 300; i++) {
    const lx = Math.log10(fitLineMin) + (Math.log10(fitLineMax) - Math.log10(fitLineMin)) * i / 300;
    fitLineX.push(Math.pow(10, lx));
    fitLineY.push(fit.predict(lx));
  }


  return (
    <div className={styles.summary_card}>
      <div className={styles.card_header}><h2>Percent Inhibition (4PL Fit)</h2></div>
      <div style={{ margin: '16px 0' }}>
        <b>4PL Fit Parameters:</b><br />
        Hillslope: {fit.b ? fit.b.toFixed(3) : 'N/A'}<br />
        R²: {r2 !== null && isFinite(r2) ? r2.toFixed(3) : 'N/A'}<br />
        IC₅₀: {fit.ic50 ? fit.ic50.toExponential(3) + ' μM' : 'N/A'}<br />
      </div>
      <Plot
        data={[
          {
            x: logX.map(x => Math.pow(10, x)),
            y: y,
            mode: 'markers',
            marker: { color: '#1976d2', size: 12 },
            name: 'Data',
          },
          {
            x: fitLineX,
            y: fitLineY,
            mode: 'lines',
            line: { color: '#00dded', width: 2 }, // Blue trendline
            name: '4PL Fit',
          },
          ic50 ? {
            x: [ic50, ic50],
            y: [0, 100],
            mode: 'lines',
            line: { color: '#888', dash: 'dot', width: 2 },
            name: 'IC₅₀'
          } : null,
          {
            x: [minTick, maxTick],
            y: [50, 50],
            mode: 'lines',
            line: { color: '#e55', dash: 'dash', width: 2 },
            name: '50% Inhibition',
          }
        ].filter(Boolean)}
        layout={{
          width: 900, // Increased width
          height: 600, // Increased height
          margin: { l: 80, r: 40, t: 40, b: 80 }, // More spacious margins
          xaxis: {
            title: { text: 'Inhibitor Concentration (uM)' },
            type: 'log',
            range: [Math.log10(fitLineMin), Math.log10(fitLineMax)],
            tickvals: [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000],
            ticktext: ['0.0001','0.001', '0.01', '0.1', '1', '10', '100', '1000', '10000'],
          },
          yaxis: {
            title: { text: 'Percent Inhibition (%)' },
            range: [-10, 120],
          },
          showlegend: true,
        }}
        config={{ displayModeBar: false }}
      />
      <div style={{ marginTop: 24 }}>
        <b>Data Table (Averaged Triplicates):</b>
        <table style={{ fontSize: 13, borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th>Conc (uM)</th>
              <th>% Inhibition</th>
            </tr>
          </thead>
          <tbody>
            {concentrations.map((conc, i) => (
              <tr key={i}>
                <td>{conc}</td>
                <td>{isNaN(percentInhib[i]) ? '' : percentInhib[i].toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



export { fit4PL, solve4PL, PercentInhibitionCard };
export default PercentInhibitionCard;
