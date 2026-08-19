const fs = require('fs');

let code = fs.readFileSync('backend/services/simulation/circuitAnalyzer.js', 'utf8');

// 1. Add computedValues object definition
code = code.replace(
  '    // Educational Summary\n    let totalPower = 0;',
  `    // Educational Summary
    let totalPower = 0;
    
    // Computed Values to pass to AI
    const computedValues = {
      V_s: batteries.length > 0 ? (batteries[0].data?.voltage || 9) : 0,
      I_mA: 0,
      R_total: 0,
      components: []
    };`
);

// 2. Extract values in the battery loop
code = code.replace(
  '         totalPower += v * current;\n         \n         let r_eq = current > 1e-6 ? v / current : 0;',
  `         totalPower += v * current;
         
         computedValues.I_mA = currentmA;
         
         let r_eq = current > 1e-6 ? v / current : 0;
         computedValues.R_total = r_eq;`
);

// 3. Add distribution for resistor
code = code.replace(
  '         analysisLog.push(` Distribusi Tegangan Resistor: R${idx+1}: V = ${vr.toFixed(2)}V`);\n       });',
  `         const r_val = r.data?.resistance || 1000;
         const ir = vr / r_val * 1000; // mA
         analysisLog.push(\` Distribusi Resistor R\${idx+1}: V = \${vr.toFixed(2)}V, I = \${ir.toFixed(2)}mA\`);
         computedValues.components.push({ type: 'resistor', id: r.id, v: vr, i_mA: ir, r: r_val });
       });`
);

// 4. Add capacitor and inductor educational logs before totalPower block
const capIndBlock = `
    if (capacitors.length > 0) {
       capacitors.forEach((c, idx) => {
         const n1 = engine.getElectricalNode(c.id, 'a');
         const n2 = engine.getElectricalNode(c.id, 'b');
         const vc = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
         const c_val = (c.data?.capacitance || 100) * 1e-6; // microFarad to Farad
         let tau = computedValues.R_total * c_val;
         analysisLog.push(\` Kapasitor C\${idx+1}: Terisi penuh pada Vc = \${vc.toFixed(2)}V (Steady State). Konstanta waktu tau = R*C = \${(tau*1000).toFixed(1)} ms\`);
         computedValues.components.push({ type: 'capacitor', id: c.id, v: vc, tau_s: tau });
       });
    }

    if (inductors.length > 0) {
       inductors.forEach((ind, idx) => {
         const l_val = (ind.data?.inductance || 10) * 1e-3; // mH to H
         let tau = computedValues.R_total > 0 ? l_val / computedValues.R_total : 0;
         analysisLog.push(\` Induktor L\${idx+1}: Hubung singkat pada DC (Steady State). Konstanta waktu tau = L/R = \${(tau*1e6).toFixed(1)} µs\`);
         computedValues.components.push({ type: 'inductor', id: ind.id, tau_s: tau });
       });
    }
`;

code = code.replace(
  '    if (totalPower > 0) {',
  capIndBlock + '\n    if (totalPower > 0) {'
);

// 5. Add computedValues to return
code = code.replace(
  '    burnoutRisk,\n    hasOpenPins,\n    nodes\n  };',
  '    burnoutRisk,\n    hasOpenPins,\n    nodes,\n    computedValues\n  };'
);

fs.writeFileSync('backend/services/simulation/circuitAnalyzer.js', code);
console.log('patched circuitAnalyzer.js');
