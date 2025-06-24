import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import Plot from 'react-plotly.js';
import './SnakeplotPage.css';

const defaultSeqs = {
  ec1: "",
  tm1: "",
  ic1: "",
  tm2: "",
  ec2: "",
  tm3: "",
  ic2: "",
  tm4: "",
  ec3: "",
  tm5: "",
  ic3: "",
  tm6: "",
  ec4: "",
  tm7: "",
  ic4: ""
};


function SnakeplotPage() {
  // Color and size states
  const [pcirc, setPcirc] = useState("#74786F");
  const [pfill, setPfill] = useState("#CEEBAB");
  const [lcol, setLcol] = useState("#4D4D48");
  const [aacol, setAacol] = useState("#03170C");
  const [psize, setPsize] = useState(7);

  // Sequence for each region
  const [seqs, setSeqs] = useState(defaultSeqs);

  // Handler for region sequence input
  const handleSeqChange = (region, value) => {
    setSeqs(prev => ({ ...prev, [region]: value }));
  };

  // --- Snakeplot logic ported from R to JS ---
  function tmPart(x0, y0, n, direction) {
    const coords = [];
    const baseX = [2, 0, -2, 3, 1, -1, -3];
    const baseY = [-0.00000002987013, -1.212121, -2.424242, -1.818182, -3.030303, -4.242424, -5.454545];
    for (let i = 0; i < n; ++i) {
      const group = Math.floor(i / 7);
      const idx = i % 7;
      const x = x0 + baseX[idx];
      const y = y0 + baseY[idx] - group * 5.454545;
      coords.push([x, y]);
    }
    if (direction === -1) coords.reverse();
    return coords;
  }

  function tmToCenter(TM, y_center) {
    const meanY = TM.reduce((sum, pt) => sum + pt[1], 0) / TM.length;
    const diff = meanY - y_center;
    return TM.map(([x, y]) => [x, y - diff]);
  }

  function smoothCurve(x0, x1, y0, y1, n, direction) {
    const m = Math.min((n % 2) + 6, n);
    const c = (x0 + x1) / 2;
    const r = 5;
    let circ_part_x = [], circ_part_y = [];
    for (let i = 1; i <= m; ++i) {
      circ_part_x.push(direction * Math.cos(Math.PI - i * Math.PI / (m + 1)) * r + c);
      circ_part_y.push(direction * Math.sin(Math.PI - i * Math.PI / (m + 1)) * r);
    }
    if (direction === -1) circ_part_x.reverse();
    if (n <= m) {
      const yBase = direction === 1 ? Math.max(y0, y1) : Math.min(y0, y1);
      return circ_part_x.map((x, i) => [x, circ_part_y[i] + yBase]);
    }
    const ndiff = Math.round((y1 - y0) / 4) * 2 * direction;
    let na = (n - m + ndiff) / 2;
    let nb = (n - m - ndiff) / 2;
    if (ndiff >= n - m) { na = n - m; nb = 0; }
    if (ndiff < 0 && Math.abs(ndiff) >= n - m) { na = 0; nb = n - m; }
    const xa = Array(na).fill(x0);
    const xb = Array(nb).fill(x1);
    let ya, yb, circY = circ_part_y.slice();
    if (direction === 1) {
      const top = Math.max(y0 + (na + 1) * 2, y1 + (nb + 1) * 2);
      circY = circY.map(y => y + top);
      ya = Array.from({ length: na }, (_, i) => y0 + 2 + (top - (y0 + 2)) * (i / Math.max(1, na - 1)));
      yb = Array.from({ length: nb }, (_, i) => top + (y1 + 2 - top) * (i / Math.max(1, nb - 1)));
    } else {
      const bottom = Math.min(y0 - (na - 1) * 2, y1 - (nb + 1) * 2);
      circY = circY.map(y => y + bottom);
      ya = Array.from({ length: na }, (_, i) => y0 - 2 + (bottom - (y0 - 2)) * (i / Math.max(1, na - 1)));
      yb = Array.from({ length: nb }, (_, i) => bottom + (y1 - 2 - bottom) * (i / Math.max(1, nb - 1)));
    }
    return [
      ...xa.map((x, i) => [x, ya[i]]),
      ...circ_part_x.map((x, i) => [x, circY[i]]),
      ...xb.map((x, i) => [x, yb[i]])
    ];
  }

  function endCurve(x0, y0, n, direction) {
    const r = 5;
    const m = Math.min((n % 2) + 6, n);
    const xa = Array(n - m).fill(x0);
    let ya = [];
    for (let i = 0; i < n - m; ++i) ya.push(y0 + i * direction * 2);
    let circ_part_x = [], circ_part_y = [];
    for (let i = 1; i <= m; ++i) {
      circ_part_x.push(direction * Math.cos(Math.PI - i * Math.PI / (m + 1)) * r + x0 - direction * r);
      circ_part_y.push(direction * Math.sin(Math.PI - i * Math.PI / (m + 1)) * r);
    }
    if (direction === -1) {
      circ_part_y = circ_part_y.map(y => y + Math.min(...ya, y0));
      return [...circ_part_x, ...xa.reverse()].map((x, i) => [x, (circ_part_y[i] || ya.reverse()[i])]);
    } else {
      circ_part_y = circ_part_y.map(y => y + Math.max(...ya, y0));
      let combine_y = [...circ_part_y, ...ya.reverse()];
      return [...circ_part_x, ...xa.reverse()].map((x, i) => [x, combine_y[i]]);
    }
  }

  function getSnakeplotCoords() {
    // Get region lengths from input
    const ec1Len = seqs.ec1.length;
    const tm1Len = seqs.tm1.length;
    const ic1Len = seqs.ic1.length;
    const tm2Len = seqs.tm2.length;
    const ec2Len = seqs.ec2.length;
    const tm3Len = seqs.tm3.length;
    const ic2Len = seqs.ic2.length;
    const tm4Len = seqs.tm4.length;
    const ec3Len = seqs.ec3.length;
    const tm5Len = seqs.tm5.length;
    const ic3Len = seqs.ic3.length;
    const tm6Len = seqs.tm6.length;
    const ec4Len = seqs.ec4.length;
    const tm7Len = seqs.tm7.length;
    const ic4Len = seqs.ic4.length;

    let TM1 = tmPart(20, 90, tm1Len, 1);
    let TM2 = tmPart(30, 90, tm2Len, -1);
    let TM3 = tmPart(40, 90, tm3Len, 1);
    let TM4 = tmPart(50, 90, tm4Len, -1);
    let TM5 = tmPart(60, 90, tm5Len, 1);
    let TM6 = tmPart(70, 90, tm6Len, -1);
    let TM7 = tmPart(80, 90, tm7Len, 1);

    const allY = [...TM1, ...TM2, ...TM3, ...TM4, ...TM5, ...TM6, ...TM7].map(pt => pt[1]);
    const y_center = allY.length > 0 ? allY.reduce((a, b) => a + b, 0) / allY.length : 0;

    TM1 = tmToCenter(TM1, y_center);
    TM2 = tmToCenter(TM2, y_center);
    TM3 = tmToCenter(TM3, y_center);
    TM4 = tmToCenter(TM4, y_center);
    TM5 = tmToCenter(TM5, y_center);
    TM6 = tmToCenter(TM6, y_center);
    TM7 = tmToCenter(TM7, y_center);

    const EC1 = endCurve(20, (TM1[0]?.[1] ?? 90) + 1 , ec1Len, 1);
    const IC1 = smoothCurve(20, 30, TM1[TM1.length - 1]?.[1] - 1 ?? 90, (TM2[0]?.[1] ?? 90) - 1, ic1Len, -1);
    const EC2 = smoothCurve(30, 40, TM2[TM2.length - 1]?.[1] ?? 90, TM3[0]?.[1] ?? 90, ec2Len, 1);
    const IC2 = smoothCurve(40, 50, TM3[TM3.length - 1]?.[1] - 1 ?? 90, (TM4[0]?.[1] ?? 90) - 1, ic2Len, -1);
    const EC3 = smoothCurve(50, 60, TM4[TM4.length - 1]?.[1] ?? 90, TM5[0]?.[1] ?? 90, ec3Len, 1);
    const IC3 = smoothCurve(60, 70, TM5[TM5.length - 1]?.[1] - 1 ?? 90, (TM6[0]?.[1] ?? 90) - 1, ic3Len, -1);
    const EC4 = smoothCurve(70, 80, TM6[TM6.length - 1]?.[1] ?? 90, TM7[0]?.[1] ?? 90, ec4Len, 1);
    const IC4 = endCurve(80, TM7[TM7.length - 1]?.[1] - 1 ?? 90, ic4Len, -1);

    // Concatenate all region sequences and coordinates in order
    const coords = [
      ...EC1, ...TM1, ...IC1, ...TM2, ...EC2, ...TM3, ...IC2, ...TM4,
      ...EC3, ...TM5, ...IC3, ...TM6, ...EC4, ...TM7, ...IC4
    ];
    const allSeq = [
      seqs.ec1, seqs.tm1, seqs.ic1, seqs.tm2, seqs.ec2, seqs.tm3, seqs.ic2, seqs.tm4,
      seqs.ec3, seqs.tm5, seqs.ic3, seqs.tm6, seqs.ec4, seqs.tm7, seqs.ic4
    ].join('');
    const aaArr = allSeq.split('');
    const text = coords.map((_, i) => aaArr[i] || '');

    return { coords, text };
  }

  // Prepare plotly data
  const { coords, text } = getSnakeplotCoords();
  const x = coords.map(pt => pt[0]);
  const y = coords.map(pt => pt[1]);

  return (
    <div className="snakeplot-container">
      <h2 className="snakeplot-title">snakeplotter for GPCRs</h2>
      <div className="snakeplot-flex">
        <form className="snakeplot-form">
          
          <div className="snakeplot-form-group">
            <label>Size of residues:</label>
            <input type="number" value={psize} min={0} onChange={e => setPsize(Number(e.target.value))} />
          </div>
          <hr />
          <div className="snakeplot-form-group">
            <label>EC1 Sequence:</label>
            <input type="text" value={seqs.ec1} onChange={e => handleSeqChange('ec1', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM1 Sequence:</label>
            <input type="text" value={seqs.tm1} onChange={e => handleSeqChange('tm1', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>IC1 Sequence:</label>
            <input type="text" value={seqs.ic1} onChange={e => handleSeqChange('ic1', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM2 Sequence:</label>
            <input type="text" value={seqs.tm2} onChange={e => handleSeqChange('tm2', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>EC2 Sequence:</label>
            <input type="text" value={seqs.ec2} onChange={e => handleSeqChange('ec2', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM3 Sequence:</label>
            <input type="text" value={seqs.tm3} onChange={e => handleSeqChange('tm3', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>IC2 Sequence:</label>
            <input type="text" value={seqs.ic2} onChange={e => handleSeqChange('ic2', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM4 Sequence:</label>
            <input type="text" value={seqs.tm4} onChange={e => handleSeqChange('tm4', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>EC3 Sequence:</label>
            <input type="text" value={seqs.ec3} onChange={e => handleSeqChange('ec3', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM5 Sequence:</label>
            <input type="text" value={seqs.tm5} onChange={e => handleSeqChange('tm5', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>IC3 Sequence:</label>
            <input type="text" value={seqs.ic3} onChange={e => handleSeqChange('ic3', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM6 Sequence:</label>
            <input type="text" value={seqs.tm6} onChange={e => handleSeqChange('tm6', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>EC4 Sequence:</label>
            <input type="text" value={seqs.ec4} onChange={e => handleSeqChange('ec4', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>TM7 Sequence:</label>
            <input type="text" value={seqs.tm7} onChange={e => handleSeqChange('tm7', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>IC4 Sequence:</label>
            <input type="text" value={seqs.ic4} onChange={e => handleSeqChange('ic4', e.target.value)} />
          </div>
          <div className="snakeplot-form-group">
            <label>Color of residues (circle):</label>
            <HexColorPicker color={pcirc} onChange={setPcirc} />
          </div>
          <div className="snakeplot-form-group">
            <label>Color of residues (fill):</label>
            <HexColorPicker color={pfill} onChange={setPfill} />
          </div>
          <div className="snakeplot-form-group">
            <label>Color of connecting line:</label>
            <HexColorPicker color={lcol} onChange={setLcol} />
          </div>
          <div className="snakeplot-form-group">
            <label>Color of residue text:</label>
            <HexColorPicker color={aacol} onChange={setAacol} />
          </div>
        </form>
        <div className="snakeplot-plot">
          <Plot
            data={[
              {
                x, y,
                mode: 'lines+markers+text',
                type: 'scatter',
                line: { color: lcol, width: 2 },
                marker: {
                  color: pfill,
                  line: { color: pcirc, width: 2 },
                  size: psize * 2,
                  symbol: 'circle'
                },
                text: text,
                textfont: { color: aacol, size: psize * 2 },
                textposition: 'middle center',
                hoverinfo: 'text'
              }
            ]}
            layout={{
              width: 800,
              height: 800,
              margin: { l: 40, r: 40, t: 40, b: 40 },
              xaxis: { visible: false },
              yaxis: { visible: false, scaleanchor: "x", scaleratio: 1 },
              plot_bgcolor: "#fff",
              paper_bgcolor: "#fff",
              showlegend: false
            }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>
    </div>
  );
}

export default SnakeplotPage;
