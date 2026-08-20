const { buildAdjacencyList, checkConnectivity } = require('./graphUtils');
const { calculateTotalResistance } = require('./resistanceCalculator');
const { calculateSemiconductors } = require('./semiconductorLogic');
const { calculateMultimeterReadings } = require('./multimeterLogic');
const { calculateACImpedance } = require('./impedanceCalculator');
const MNAEngine = require('./mnaSolver');

/**
 * Run deterministic circuit validation and return analysis log + error log.
 */
function validateCircuit(nodes, edges) {
  const analysisLog = [];
  let errorLog = [];
  let errorNodes = {}; // Map of nodeId -> specific error message
  const nodes_state = {}; // Map of nodeId -> specific state object
  let computedValues = null;

  const adj = buildAdjacencyList(nodes, edges);

  const batteries   = nodes.filter((n) => n.data?.componentType === "battery"      || n.type === "battery");
  const resistors   = nodes.filter((n) => n.data?.componentType === "resistor"     || n.type === "resistor");
  const leds        = nodes.filter((n) => n.data?.componentType === "led"          || n.type === "led");
  const capacitors  = nodes.filter((n) => n.data?.componentType === "capacitor"    || n.type === "capacitor");
  const switches    = nodes.filter((n) => n.data?.componentType === "switch"       || n.type === "switch");
  const pots        = nodes.filter((n) => n.data?.componentType === "potentiometer"|| n.type === "potentiometer");
  const diodes      = nodes.filter((n) => n.data?.componentType === "diode"        || n.type === "diode");
  const transistors = nodes.filter((n) => n.data?.componentType === "transistor"   || n.type === "transistor");
  const inductors   = nodes.filter((n) => n.data?.componentType === "inductor"     || n.type === "inductor");
  const multimeters = nodes.filter((n) => n.data?.componentType === "multimeter"   || n.type === "multimeter");
  const motors      = nodes.filter((n) => n.data?.componentType === "motor"        || n.type === "motor");
  const buzzers     = nodes.filter((n) => n.data?.componentType === "buzzer"       || n.type === "buzzer");

  const isAC = batteries.some(b => b.data?.sourceType === 'ac');
  const acFreq = isAC ? (batteries.find(b => b.data?.sourceType === 'ac').data?.frequency || 50) : 0;

  if (nodes.length < 2) {
    errorLog.push(" Sebuah rangkaian membutuhkan setidaknya 2 komponen.");
  }
  if (edges.length === 0) {
    errorLog.push(" Tidak ada kabel yang terdeteksi. Hubungkan komponenmu!");
  }

  const hasOpenPins = checkConnectivity(nodes, adj, errorNodes);
  if (hasOpenPins) {
    errorLog.push("️ Rangkaian terbuka terdeteksi! Periksa kembali kabelmu.");
  }

  // Check switch state
  const openSwitches = switches.filter((s) => (s.data?.state ?? "open") === "open");
  if (openSwitches.length > 0) {
    errorLog.push(`🔘 Sakelar TERBUKA — arus tidak akan mengalir sampai ditutup.`);
    openSwitches.forEach(s => errorNodes[s.id] = "Sakelar terbuka, memutus aliran listrik.");
  }

  let burnoutRisk = false;
  let hasLoop = !hasOpenPins && openSwitches.length === 0;

  // Initialize LED states to off
  leds.forEach(l => { nodes_state[l.id] = { ledState: "off" }; });

  // Calculate actual total resistance from resistors for use in tau formulas
  const R_resistors_total = resistors.reduce((sum, r) => sum + (r.data?.resistance ?? 1000), 0);

  // 1. Run Modified Nodal Analysis (MNA)
  const engine = new MNAEngine();
  engine.buildElectricalNodes(nodes, edges);
  engine.buildSystem();
  const mnaResult = engine.solve();

  if (mnaResult.success) {
    // 2. Map MNA Results to Component States
    const compStates = mnaResult.compStates || {};

    // Evaluate LEDs
    leds.forEach((l, i) => {
      const state = compStates[l.id];
      const na = engine.getElectricalNode(l.id, 'a');
      const nk = engine.getElectricalNode(l.id, 'b');
      const Va = engine.getNodeVoltage(na, mnaResult.x);
      const Vk = engine.getNodeVoltage(nk, mnaResult.x);
      const Vak = Va - Vk;

      if (state === 'ON') {
        nodes_state[l.id] = { ledState: "on" };
      } else {
        nodes_state[l.id] = { ledState: "off" };
      }
    });

    // Evaluate Transistors
    transistors.forEach((t, i) => {
      const state = compStates[t.id] || 'OFF';
      // state stored, not logged here — logged in edukatif section
    });

    // Evaluate Multimeters
    multimeters.forEach((m, i) => {
      const mode = m.data?.mode ?? "V";
      const n1 = engine.getElectricalNode(m.id, 'a');
      const n2 = engine.getElectricalNode(m.id, 'b');
      let readingStr = "0.00";

      if (mode === "V") {
        const v = engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x);
        readingStr = v.toFixed(2);
      } else if (mode === "Ohm") {
        const v = engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x);
        let R = Math.abs(v * 1000);
        readingStr = R > 1e6 ? "Open" : R.toFixed(0);
      } else if (mode === "A") {
        const vIdx = engine.compStates[`${m.id}_vIdx`];
        if (vIdx !== undefined) {
          const mRow = engine.N_vars + vIdx;
          const current = mnaResult.x[mRow];
          readingStr = (current * 1000).toFixed(2);
        }
      }

      nodes_state[m.id] = { reading: readingStr };
    });

    // 3. Educational Analysis Summary
    let totalPower = 0;

    computedValues = {
      V_s: batteries.length > 0 ? (batteries[0].data?.voltage ?? 9) : 0,
      I_mA: 0,
      R_total: R_resistors_total || 0,
      components: []
    };

    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    analysisLog.push(" ANALISIS EDUKATIF HUKUM OHM");
    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    batteries.forEach((b, i) => {
      const v = b.data?.voltage ?? 9;
      const vIdx = engine.compStates[`${b.id}_vIdx`];
      if (vIdx !== undefined) {
        const mRow = engine.N_vars + vIdx;
        let current = Math.abs(mnaResult.x[mRow]);
        let currentmA = current * 1000;
        totalPower += v * current;

        computedValues.I_mA = currentmA;

        // Estimasi Veff jika ada semikonduktor (LED/Diode) untuk tampilan edukatif
        let totalVf = 0;
        leds.forEach(l => {
          if (compStates[l.id] === 'ON') totalVf += (l.data?.vf ?? 2.0);
        });
        diodes.forEach(d => {
          if (compStates[d.id] === 'ON') totalVf += (d.data?.vf ?? 0.7);
        });
        let veff = v - totalVf;
        if (veff < 0) veff = 0;

        let hasSemiconductor = leds.length > 0 || diodes.length > 0 || transistors.length > 0;

        // Diketahui
        let sourceType = b.data?.sourceType || 'dc';
        let freq = b.data?.frequency || 50;
        let sourceLabel = sourceType === 'ac' ? `AC (${freq} Hz)` : 'DC';
        let knownStr = ` Diketahui: Vs = ${v.toFixed(2)} V ${sourceLabel}`;
        if (resistors.length > 0) {
          knownStr += ` | ` + resistors.map((r, idx) => `R${idx+1} = ${r.data?.resistance ?? 1000} Ω`).join(', ');
        }
        if (leds.length > 0) {
          knownStr += ` | ` + leds.map((l, idx) => `LED${idx+1} Vf ≈ ${l.data?.vf ?? 2.0} V`).join(', ');
        }
        if (capacitors.length > 0) {
          knownStr += ` | ` + capacitors.map((c, idx) => `C${idx+1} = ${c.data?.capacitance ?? 100} µF`).join(', ');
        }
        if (inductors.length > 0) {
          knownStr += ` | ` + inductors.map((ind, idx) => `L${idx+1} = ${ind.data?.inductance ?? 10} mH`).join(', ');
        }
        analysisLog.push(knownStr);

        // Langkah 1 - Total Hambatan
        if (R_resistors_total > 0) {
          if (resistors.length > 1) {
            // Tentukan apakah seri atau paralel berdasarkan struktur (MNA yang menghitung — kita tampilkan R_total dari V/I)
            const r_from_mna = current > 1e-6 ? veff / current : R_resistors_total;
            analysisLog.push(` Langkah 1 — Total Hambatan: R_total = ${r_from_mna.toFixed(1)} Ω`);
          } else {
            analysisLog.push(` Langkah 1 — Total Hambatan: R_total = ${R_resistors_total.toFixed(1)} Ω`);
          }
        } else if (current > 1e-6) {
          const r_from_mna = v / current;
          analysisLog.push(` Langkah 1 — Total Hambatan: R_total = ${r_from_mna.toFixed(1)} Ω (transistor/kapasitor efektif)`);
        } else {
          analysisLog.push(` Langkah 1 — Total Hambatan: R_total = ∞ Ω (Rangkaian Terbuka)`);
        }

        // Langkah 2 - Tegangan Efektif
        if (hasSemiconductor) {
          analysisLog.push(` Langkah 2 — Tegangan Efektif: Veff = Vs − Vf = ${v.toFixed(2)} V − ${totalVf.toFixed(2)} V = ${veff.toFixed(2)} V`);
        } else {
          analysisLog.push(` Langkah 2 — Tegangan Efektif: Veff = Vs = ${v.toFixed(2)} V (tidak ada komponen semikonduktor)`);
        }

        // Langkah 3 - Hukum Ohm
        if (current > 1e-6) {
          const r_display = current > 1e-6 ? veff / current : R_resistors_total;
          analysisLog.push(` Langkah 3 — Hukum Ohm: I = Veff / R_total = ${veff.toFixed(2)} V / ${r_display.toFixed(1)} Ω = ${currentmA.toFixed(2)} mA`);
        } else {
          analysisLog.push(` Langkah 3 — Hukum Ohm: Rangkaian Terbuka → I = 0.00 mA`);
        }
      }
    });

    // Detail Komponen
    if (resistors.length > 0) {
      resistors.forEach((r, idx) => {
        const n1 = engine.getElectricalNode(r.id, 'a');
        const n2 = engine.getElectricalNode(r.id, 'b');
        const vr = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
        const r_val = r.data?.resistance ?? 1000;
        const ir = r_val > 0 ? (vr / r_val * 1000) : 0; // mA — guard div-by-zero
        const ir_display = isFinite(ir) ? ir.toFixed(2) : '0.00';
        const vr_display = isFinite(vr) ? vr.toFixed(2) : '0.00';
        analysisLog.push(` Distribusi R${idx+1} (${r_val} Ω): V = ${vr_display} V, I = ${ir_display} mA`);
        computedValues.components.push({ type: 'resistor', id: r.id, v: vr, i_mA: ir, r: r_val });
      });
    }

    if (leds.length > 0) {
      leds.forEach((l, idx) => {
        const state = (mnaResult.compStates || {})[l.id];
        const na = engine.getElectricalNode(l.id, 'a');
        const nk = engine.getElectricalNode(l.id, 'b');
        const Vak = (engine.getNodeVoltage(na, mnaResult.x) - engine.getNodeVoltage(nk, mnaResult.x));
        const Vf = l.data?.vf ?? 2.0;
        if (state === 'ON') {
          analysisLog.push(` LED${idx+1}: MENYALA — Tegangan maju Vf = ${Vf.toFixed(2)} V, V(A-K) = ${Vak.toFixed(2)} V`);
        } else {
          analysisLog.push(` LED${idx+1}: PADAM — Tegangan maju tidak tercapai (Vf = ${Vf.toFixed(2)} V diperlukan)`);
        }
        computedValues.components.push({ type: 'led', id: l.id, state, vak: Vak });
      });
    }

    if (capacitors.length > 0) {
      capacitors.forEach((c, idx) => {
        const n1 = engine.getElectricalNode(c.id, 'a');
        const n2 = engine.getElectricalNode(c.id, 'b');
        const vc = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
        const c_val = (c.data?.capacitance ?? 100) * 1e-6; // µF → F
        const R_tau = R_resistors_total > 0 ? R_resistors_total : 1;
        const tau = R_tau * c_val;
        let xc = null;
        if (isAC) {
          xc = c_val > 0 ? 1 / (2 * Math.PI * acFreq * c_val) : 0;
          analysisLog.push(` Kapasitor C${idx+1} (${c.data?.capacitance ?? 100} µF): Xc (Reaktansi Kapasitif) = ${xc.toFixed(2)} Ω pada frekuensi ${acFreq} Hz`);
        } else {
          analysisLog.push(` Kapasitor C${idx+1} (${c.data?.capacitance ?? 100} µF): Vc = ${vc.toFixed(2)} V (steady-state). τ = R × C = ${R_tau.toFixed(0)} Ω × ${(c.data?.capacitance ?? 100)} µF = ${(tau * 1000).toFixed(2)} ms`);
        }
        computedValues.components.push({ type: 'capacitor', id: c.id, v: vc, tau_s: tau, xc });
      });
    }

    if (inductors.length > 0) {
      inductors.forEach((ind, idx) => {
        const l_val = (ind.data?.inductance ?? 10) * 1e-3; // mH → H
        const R_tau = R_resistors_total > 0 ? R_resistors_total : 1;
        const tau = l_val / R_tau;
        let xl = null;
        if (isAC) {
          xl = l_val > 0 ? 2 * Math.PI * acFreq * l_val : 0;
          analysisLog.push(` Induktor L${idx+1} (${ind.data?.inductance ?? 10} mH): Xl (Reaktansi Induktif) = ${xl.toFixed(2)} Ω pada frekuensi ${acFreq} Hz`);
        } else {
          analysisLog.push(` Induktor L${idx+1} (${ind.data?.inductance ?? 10} mH): Short circuit pada DC. τ = L / R = ${(ind.data?.inductance ?? 10)} mH / ${R_tau.toFixed(0)} Ω = ${(tau * 1e6).toFixed(1)} µs`);
        }
        computedValues.components.push({ type: 'inductor', id: ind.id, tau_s: tau, xl });
      });
    }

    if (diodes.length > 0) {
      diodes.forEach((d, idx) => {
        const state = (mnaResult.compStates || {})[d.id];
        const na = engine.getElectricalNode(d.id, 'a');
        const nk = engine.getElectricalNode(d.id, 'b');
        const Vak = engine.getNodeVoltage(na, mnaResult.x) - engine.getNodeVoltage(nk, mnaResult.x);
        const Vf = d.data?.vf ?? 0.7;
        if (state === 'ON') {
          analysisLog.push(` Dioda D${idx+1}: KONDUKSI MAJU — V(A-K) = ${Vak.toFixed(2)} V (Vf = ${Vf.toFixed(2)} V)`);
        } else {
          analysisLog.push(` Dioda D${idx+1}: TIDAK KONDUKSI — V(A-K) = ${Vak.toFixed(2)} V < Vf = ${Vf.toFixed(2)} V`);
        }
        computedValues.components.push({ type: 'diode', id: d.id, state: state || 'OFF', vak: Vak });
      });
    }

    if (pots.length > 0) {
      pots.forEach((p, idx) => {
        const nw = engine.getElectricalNode(p.id, 'w');
        const na = engine.getElectricalNode(p.id, 'a');
        const v_wiper = engine.getNodeVoltage(nw, mnaResult.x);
        const v_a = engine.getNodeVoltage(na, mnaResult.x);
        const pos = p.data?.position ?? 0.5;
        const Rtotal = p.data?.resistance ?? 10000;
        analysisLog.push(` Potensiometer P${idx+1} (${Rtotal} Ω, posisi ${(pos*100).toFixed(0)}%): V_wiper = ${v_wiper.toFixed(2)} V`);
        computedValues.components.push({ type: 'potentiometer', id: p.id, v_wiper, position: pos, r_total: Rtotal });
      });
    }

    if (transistors.length > 0) {
      transistors.forEach((t, idx) => {
        const state = (mnaResult.compStates || {})[t.id] || 'OFF';
        analysisLog.push(` Transistor T${idx+1}: State = ${state}`);
        computedValues.components.push({ type: 'transistor', id: t.id, state });
      });
    }

    if (multimeters.length > 0) {
      multimeters.forEach((m, idx) => {
        const mode = m.data?.mode ?? "V";
        const reading = nodes_state[m.id]?.reading || "0.00";
        const unit = mode === "V" ? "V" : mode === "A" ? "mA" : "Ω";
        analysisLog.push(` Multimeter M${idx+1} (mode: ${mode}): Pembacaan = ${reading} ${unit}`);
      });
    }

    if (motors.length > 0) {
      motors.forEach((m, idx) => {
        const n1 = engine.getElectricalNode(m.id, 'a');
        const n2 = engine.getElectricalNode(m.id, 'b');
        const v = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
        const rated = m.data?.ratedVoltage || 9;
        const state = v >= rated ? 'MENYALA' : 'TIDAK MENYALA (Tegangan Kurang)';
        analysisLog.push(` Motor DC M${idx+1}: ${state} — V_in = ${v.toFixed(2)} V (Rated = ${rated} V)`);
        computedValues.components.push({ type: 'motor', id: m.id, v, rated });
      });
    }

    if (buzzers.length > 0) {
      buzzers.forEach((bz, idx) => {
        const n1 = engine.getElectricalNode(bz.id, 'a');
        const n2 = engine.getElectricalNode(bz.id, 'b');
        const v = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
        const minV = bz.data?.minVoltage || 3;
        const state = v >= minV ? 'BERBUNYI' : 'SENYAP (Tegangan Kurang)';
        analysisLog.push(` Buzzer BZ${idx+1}: ${state} — V_in = ${v.toFixed(2)} V (Min = ${minV} V)`);
        computedValues.components.push({ type: 'buzzer', id: bz.id, v, minV });
      });
    }

    // Kesimpulan
    if (isAC) {
      const acZ = calculateACImpedance(nodes, edges, acFreq, R_resistors_total);
      const vs = batteries.length > 0 ? (batteries[0].data?.voltage ?? 9) : 1;
      const irms = vs / (acZ.Z > 0 ? acZ.Z : 1) * 1000;
      computedValues.ac = { isAC: true, z: acZ.Z, xl: acZ.Xl, xc: acZ.Xc, irms: irms, freq: acFreq };
      analysisLog.push(` Kesimpulan (Mode AC): Impedansi Total (Z) = ${acZ.Z.toFixed(2)} Ω, Arus RMS (I_rms) = ${irms.toFixed(2)} mA, Beda Fase = ${acZ.phaseAngleDeg.toFixed(1)}°`);
    } else {
      if (totalPower > 0) {
        const vs = batteries.length > 0 ? (batteries[0].data?.voltage ?? 9) : 1;
        const i_total = vs > 0 ? (totalPower * 1000 / vs) : 0;
        const p_total = totalPower * 1000;
        const i_str = isFinite(i_total) ? i_total.toFixed(2) : '∞';
        const p_str = isFinite(p_total) ? p_total.toFixed(2) : '∞';
        analysisLog.push(` Kesimpulan: Rangkaian AKTIF — I_total = ${i_str} mA, P_total = ${p_str} mW`);
      } else if (capacitors.length > 0) {
        analysisLog.push(" Kesimpulan: Kapasitor terisi penuh (Steady-State) — Arus DC = 0.00 mA (Kapasitor memblokir arus DC)");
      } else {
        analysisLog.push(" Kesimpulan: Rangkaian TERBUKA — Arus = 0.00 mA");
      }
    }

    // Update R_total in computedValues using actual MNA if available (only for DC)
    if (!isAC && computedValues.I_mA > 1e-3 && computedValues.V_s > 0) {
      computedValues.R_total = (computedValues.V_s / computedValues.I_mA) * 1000; // V / mA -> Ohm
    }

  } else {
    analysisLog.push(`️ MNA Gagal: ${mnaResult.message}`);
    errorLog.push(` Simulasi gagal: ${mnaResult.message}`);
  }

  return {
    errorLog,
    errorNodes,
    analysisLog,
    nodes_state,
    hasLoop,
    burnoutRisk,
    hasOpenPins,
    nodes,
    computedValues
  };
}

module.exports = {
  validateCircuit,
  buildAdjacencyList
};
