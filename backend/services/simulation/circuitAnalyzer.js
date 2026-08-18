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
      
      // Update multimeters
      if (type === 'multimeter') {
        const mode = n.data?.mode || "V";
        const n1 = engine.getElectricalNode(n.id, 'a');
        const n2 = engine.getElectricalNode(n.id, 'b');
        
        if (mode === "V") {
          const v1 = engine.getNodeVoltage(n1, mnaResult.x);
          const v2 = engine.getNodeVoltage(n2, mnaResult.x);
          const v_diff = Math.abs(v1 - v2);
          nodes_state[n.id] = { reading: v_diff.toFixed(2) };
          analysisLog.push(`📌 Multimeter (Voltmeter) membaca tegangan: ${v_diff.toFixed(2)} V`);
        }
      }
    });

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

    analysisLog.push("✅ Kesimpulan MNA: Rangkaian berhasil dievaluasi secara matematis dengan iterasi non-linear.");
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
