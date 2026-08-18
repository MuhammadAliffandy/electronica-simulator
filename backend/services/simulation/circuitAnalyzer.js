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

  // Basic checks
  analysisLog.push(`📊 Received ${nodes.length} component(s) and ${edges.length} wire(s).`);

  const adj = buildAdjacencyList(nodes, edges);

  const batteries = nodes.filter((n) => n.data?.componentType === "battery" || n.type === "battery");
  const resistors = nodes.filter((n) => n.data?.componentType === "resistor" || n.type === "resistor");
  const leds = nodes.filter((n) => n.data?.componentType === "led" || n.type === "led");
  const capacitors = nodes.filter((n) => n.data?.componentType === "capacitor" || n.type === "capacitor");
  const switches = nodes.filter((n) => n.data?.componentType === "switch" || n.type === "switch");
  const pots = nodes.filter((n) => n.data?.componentType === "potentiometer" || n.type === "potentiometer");
  const diodes = nodes.filter((n) => n.data?.componentType === "diode" || n.type === "diode");
  const transistors = nodes.filter((n) => n.data?.componentType === "transistor" || n.type === "transistor");
  const inductors = nodes.filter((n) => n.data?.componentType === "inductor" || n.type === "inductor");
  const multimeters = nodes.filter((n) => n.data?.componentType === "multimeter" || n.type === "multimeter");

  if (nodes.length < 2) {
    errorLog.push("❌ Sebuah rangkaian membutuhkan setidaknya 2 komponen.");
  }
  if (edges.length === 0) {
    errorLog.push("❌ Tidak ada kabel yang terdeteksi. Hubungkan komponenmu!");
  }

  const hasOpenPins = checkConnectivity(nodes, adj, errorNodes);
  if (hasOpenPins) {
    errorLog.push("⚠️ Rangkaian terbuka terdeteksi! Periksa kembali kabelmu.");
  } else {
    analysisLog.push("✅ Semua komponen memiliki setidaknya 2 koneksi.");
  }

  // Check switch state
  const openSwitches = switches.filter((s) => (s.data?.state || "open") === "open");
  if (openSwitches.length > 0) {
    errorLog.push(`🔘 Sakelar TERBUKA — arus tidak akan mengalir sampai ditutup.`);
    openSwitches.forEach(s => errorNodes[s.id] = "Sakelar terbuka, memutus aliran listrik.");
  }

  const battery = batteries[0];
  let burnoutRisk = false;
  let hasLoop = !hasOpenPins && openSwitches.length === 0;

  // Initialize LED states to off
  leds.forEach(l => { nodes_state[l.id] = { ledState: "off" }; });

  // 1. Run Modified Nodal Analysis (MNA)
  const engine = new MNAEngine();
  engine.buildElectricalNodes(nodes, edges);
  engine.buildSystem();
  const mnaResult = engine.solve();

  if (mnaResult.success) {
    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    analysisLog.push("📐 ANALISIS MNA (Modified Nodal Analysis)");
    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    analysisLog.push(`📌 Sistem berhasil dibangun dengan ${engine.nodeCount} node kelistrikan.`);
    
    // Log Node Voltages
    for (let i = 0; i < engine.nodeCount; i++) {
      const v = engine.getNodeVoltage(i, mnaResult.x);
      analysisLog.push(`   - Tegangan Node ${i}${i === engine.refNodeIndex ? " (Referensi/Ground)" : ""}: ${v.toFixed(3)} V`);
    }

    // Assign node states based on MNA voltages
    nodes.forEach(n => {
      const type = n.type || n.data?.componentType;
      
    // Nodes state mapped later

    // 2. Map MNA Results to Component States
    const compStates = mnaResult.compStates || {};
    
    // Evaluate LEDs
    leds.forEach((l, i) => {
      const state = compStates[l.id];
      const na = engine.getElectricalNode(l.id, 'a');
      const nk = engine.getElectricalNode(l.id, 'b');
      const Va = engine.getNodeVoltage(na, mnaResult.x);
      const Vk = engine.getNodeVoltage(nk, mnaResult.x);
      
      if (state === 'ON') {
        analysisLog.push(`📌 LED #${i+1} ON (Tegangan Anoda-Katoda: ${(Va - Vk).toFixed(2)} V)`);
        nodes_state[l.id] = { ledState: "on" };
      } else {
        analysisLog.push(`📌 LED #${i+1} OFF (Tegangan tidak cukup atau reverse biased)`);
        nodes_state[l.id] = { ledState: "off" };
      }
    });

    // Evaluate Transistors
    transistors.forEach((t, i) => {
      const state = compStates[t.id] || 'OFF';
      analysisLog.push(`📌 Transistor #${i+1} State: ${state}`);
    });

    // Evaluate Capacitors (Steady State)
    capacitors.forEach((c, i) => {
      const n1 = engine.getElectricalNode(c.id, 'a');
      const n2 = engine.getElectricalNode(c.id, 'b');
      const v = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
      analysisLog.push(`📌 Kapasitor #${i+1} (DC Steady State): Terisi penuh pada ${v.toFixed(2)} V. Arus = 0 A.`);
    });
    
    // Evaluate Inductors
    inductors.forEach((ind, i) => {
      analysisLog.push(`📌 Induktor #${i+1} (DC Steady State): Berlaku sebagai kabel pendek (Short Circuit).`);
    });

    // Evaluate Multimeters
    multimeters.forEach((m, i) => {
      const mode = m.data?.mode || "V";
      const n1 = engine.getElectricalNode(m.id, 'a');
      const n2 = engine.getElectricalNode(m.id, 'b');
      let readingStr = "0.00";
      
      if (mode === "V") {
        const v = engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x);
        readingStr = v.toFixed(2);
        analysisLog.push(`📌 Multimeter #${i+1} (Voltmeter): Mengukur ${readingStr} V.`);
      } else if (mode === "Ohm") {
        const v = engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x);
        let R = Math.abs(v * 1000); // 1mA test current
        if (R > 1e6) {
          readingStr = "Open";
        } else {
          readingStr = R.toFixed(0);
        }
        analysisLog.push(`📌 Multimeter #${i+1} (Ohmmeter): Mengukur hambatan ${readingStr} Ω.`);
      } else if (mode === "A") {
        const vIdx = engine.compStates[`${m.id}_vIdx`];
        if (vIdx !== undefined) {
           const mRow = engine.N_vars + vIdx;
           const current = mnaResult.x[mRow][0]; // in Amperes
           readingStr = (current * 1000).toFixed(2); // mA
           analysisLog.push(`📌 Multimeter #${i+1} (Ammeter): Mengukur arus ${readingStr} mA.`);
        }
      }
      
      nodes_state[m.id] = { reading: readingStr };
    });

    // Educational Summary
    let totalPower = 0;
    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    analysisLog.push("📐 ANALISIS EDUKATIF HUKUM OHM");
    analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    batteries.forEach((b, i) => {
      const v = b.data?.voltage || 9;
      const vIdx = engine.compStates[`${b.id}_vIdx`];
      if (vIdx !== undefined) {
         const mRow = engine.N_vars + vIdx;
         // Current through voltage source (absolute value for simplicity)
         let current = Math.abs(mnaResult.x[mRow][0]); 
         let currentmA = current * 1000;
         totalPower += v * current;
         
         let r_eq = current > 1e-6 ? v / current : 0;
         
         // Estimasi Veff jika ada semikonduktor (LED/Diode) untuk tampilan edukatif
         let totalVf = 0;
         leds.forEach(l => {
           if (compStates[l.id] === 'ON') totalVf += 2.0; // Vf rata-rata LED
         });
         let veff = v - totalVf;
         if (veff < 0) veff = 0;
         
         let hasSemiconductor = leds.length > 0 || diodes.length > 0 || transistors.length > 0;
         
         let knownStr = `📌 Diketahui: Sumber tegangan Vs = ${v.toFixed(2)}V DC`;
         if (resistors.length > 0) {
           knownStr += ` | ` + resistors.map((r, idx) => `R${idx+1} = ${r.data?.resistance || 1000}Ω`).join(', ');
         }
         analysisLog.push(knownStr);
         
         if (r_eq > 0) {
           analysisLog.push(`📌 Langkah 1 - Total Hambatan: R_total = ${r_eq.toFixed(1)}Ω`);
         } else {
           analysisLog.push(`📌 Langkah 1 - Total Hambatan: R_total = ∞ Ω (Rangkaian Terbuka)`);
         }
         
         if (hasSemiconductor) {
            analysisLog.push(`📌 Langkah 2 - Tegangan Efektif: Veff = Vs - Vf = ${v.toFixed(2)}V - ${totalVf.toFixed(2)}V = ${veff.toFixed(2)}V`);
            if (r_eq > 0) {
              // Hitung manual Req sebenarnya untuk display (karena Req = Veff/I)
              let req_display = current > 1e-6 ? veff / current : r_eq;
              analysisLog.push(`📌 Langkah 3 - Hukum Ohm: I = Veff / R_total = ${veff.toFixed(2)}V / ${req_display.toFixed(1)}Ω = ${currentmA.toFixed(2)} mA`);
            } else {
              analysisLog.push(`📌 Langkah 3 - Hukum Ohm: Rangkaian Terbuka (I = 0 mA)`);
            }
         } else {
            analysisLog.push(`📌 Langkah 2 - Tegangan Efektif: Veff = Vs = ${v.toFixed(2)}V (tidak ada komponen semikonduktor)`);
            if (r_eq > 0) {
              analysisLog.push(`📌 Langkah 3 - Hukum Ohm: I = Veff / R_total = ${v.toFixed(2)}V / ${r_eq.toFixed(1)}Ω = ${currentmA.toFixed(2)} mA`);
            } else {
              analysisLog.push(`📌 Langkah 3 - Hukum Ohm: Rangkaian Terbuka (I = 0 mA)`);
            }
         }
      }
    });

    if (resistors.length > 0) {
       resistors.forEach((r, idx) => {
         const n1 = engine.getElectricalNode(r.id, 'a');
         const n2 = engine.getElectricalNode(r.id, 'b');
         const vr = Math.abs(engine.getNodeVoltage(n1, mnaResult.x) - engine.getNodeVoltage(n2, mnaResult.x));
         analysisLog.push(`📌 Distribusi Tegangan Resistor: R${idx+1}: V = ${vr.toFixed(2)}V`);
       });
    }

    if (totalPower > 0) {
       analysisLog.push(`📌 Kesimpulan: Rangkaian dinyatakan TERHUBUNG dan arus mengalir sebesar ${(totalPower*1000/batteries[0]?.data?.voltage).toFixed(2)} mA dengan total daya ${(totalPower * 1000).toFixed(2)} mW.`);
    } else {
       analysisLog.push("✅ Kesimpulan: Rangkaian dinyatakan TERBUKA (Arus = 0 mA).");
    }
  } else {
    analysisLog.push(`⚠️ MNA Gagal: ${mnaResult.message}`);
    errorLog.push(`❌ Simulasi gagal: ${mnaResult.message}`);
  }

  return {
    errorLog,
    errorNodes,
    analysisLog,
    nodes_state,
    hasLoop,
    burnoutRisk,
    hasOpenPins,
    nodes
  };
}

module.exports = {
  validateCircuit,
  buildAdjacencyList
};
