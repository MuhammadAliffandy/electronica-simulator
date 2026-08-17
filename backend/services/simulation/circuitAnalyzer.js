const { buildAdjacencyList, checkConnectivity } = require('./graphUtils');
const { calculateTotalResistance } = require('./resistanceCalculator');
const { calculateSemiconductors } = require('./semiconductorLogic');
const { calculateMultimeterReadings } = require('./multimeterLogic');
const { calculateACImpedance } = require('./impedanceCalculator');

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

  // 1. Calculate universal resistance (used for both loop and multimeter)
  const { totalHambatanUniversal, resistorDetails, parallelGroupDetails } = calculateTotalResistance(resistors, pots, edges);

  if (battery) {
    const voltage = battery.data?.voltage || 9;
    const isAC = battery.data?.sourceType === "ac";

    if (isAC) {
      analysisLog.push(`⚠️ Sumber tegangan adalah AC (${voltage}V). Perhitungan menggunakan pendekatan nilai puncak untuk simulasi dasar.`);
    }

    // Capacitor logic
    capacitors.forEach(c => {
      if (c.data?.capType === "elco" && voltage > 16) {
         errorLog.push(`💥 BOOM! Ledakan Tegangan! Kapasitor Elco batas 16V terpapar tegangan ${voltage}V!`);
         errorNodes[c.id] = "Ledakan Tegangan! Tegangan melebihi batas aman 16V.";
      }
    });

    if (hasLoop) {
      // 2. Semiconductor Logic
      const semiResult = calculateSemiconductors(
        nodes, edges, adj, batteries, diodes, transistors, totalHambatanUniversal
      );
      
      errorLog = errorLog.concat(semiResult.errorLog);
      errorNodes = { ...errorNodes, ...semiResult.errorNodes };
      analysisLog.push(...semiResult.analysisLog);

      if (semiResult.diodeBlocked || semiResult.transBlocked) {
        hasLoop = false;
      }

      if (hasLoop) {
        // 3. Step-by-Step Ohm's Law and Summary
        analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        analysisLog.push("📐 ANALISIS PERHITUNGAN RANGKAIAN");
        analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        let step1 = `📌 Diketahui: Sumber tegangan Vs = ${voltage}V${isAC ? " AC" : " DC"}`;
        if (resistorDetails.length > 0) {
          step1 += " | " + resistorDetails.map(d => `${d.label} = ${d.value.toFixed(1)}${d.unit}`).join(", ");
        }
        analysisLog.push(step1);

        if (totalHambatanUniversal > 0) {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = ${totalHambatanUniversal.toFixed(1)}Ω`);
        } else {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = 0Ω (tidak ada resistor!)`);
        }

        if (semiResult.dropDetails.length > 0) {
          analysisLog.push(`📌 Langkah 2 — Tegangan Jatuh Semikonduktor: ${semiResult.dropDetails.join(" + ")} → ΣVf = ${semiResult.totalVoltageDrop.toFixed(2)}V`);
          analysisLog.push(`📌 Langkah 3 — Tegangan Efektif: Veff = Vs - ΣVf = ${voltage}V - ${semiResult.totalVoltageDrop.toFixed(2)}V = ${semiResult.effectiveVoltage.toFixed(2)}V`);
        } else {
          analysisLog.push(`📌 Langkah 2 — Tegangan Efektif: Veff = Vs = ${voltage}V`);
        }

        if (totalHambatanUniversal > 0 || (isAC && hasLoop)) {
          let currentMa = 0;
          let currentA = 0;
          
          if (isAC) {
            const freq = battery.data?.frequency || 50;
            const acResult = calculateACImpedance(nodes, edges, freq, totalHambatanUniversal);
            
            if (acResult.hasACComponents) {
              analysisLog.push(`📌 Langkah Tambahan (AC RLC) — Frekuensi: ${freq} Hz`);
              if (acResult.Xl > 0) analysisLog.push(`📌 Reaktansi Induktif (XL): ${acResult.Xl.toFixed(2)} Ω`);
              if (acResult.Xc > 0) analysisLog.push(`📌 Reaktansi Kapasitif (XC): ${acResult.Xc.toFixed(2)} Ω`);
              analysisLog.push(`📌 Impedansi Total (Z): ${acResult.Z.toFixed(2)} Ω`);
              analysisLog.push(`📌 Sudut Fasa (θ): ${acResult.phaseAngleDeg.toFixed(2)}°`);
              
              currentA = acResult.Z > 0 ? (semiResult.effectiveVoltage / acResult.Z) : 0;
              currentMa = currentA * 1000;
              
              analysisLog.push(`📌 Langkah 4 — Hukum Ohm AC: I = Veff / Z = ${semiResult.effectiveVoltage.toFixed(2)}V / ${acResult.Z.toFixed(2)}Ω = ${currentMa.toFixed(2)} mA`);
              
              // VR, VL, VC
              if (totalHambatanUniversal > 0) analysisLog.push(`📌 Drop Tegangan Resistor (VR): ${(currentA * totalHambatanUniversal).toFixed(2)} V`);
              if (acResult.Xl > 0) analysisLog.push(`📌 Drop Tegangan Induktor (VL): ${(currentA * acResult.Xl).toFixed(2)} V`);
              if (acResult.Xc > 0) analysisLog.push(`📌 Drop Tegangan Kapasitor (VC): ${(currentA * acResult.Xc).toFixed(2)} V`);
              
            } else {
              currentMa = (semiResult.effectiveVoltage / totalHambatanUniversal) * 1000;
              analysisLog.push(`📌 Langkah 4 — Hukum Ohm: I = Veff / R_total = ${semiResult.effectiveVoltage.toFixed(2)}V / ${totalHambatanUniversal.toFixed(1)}Ω = ${currentMa.toFixed(2)} mA`);
            }
          } else {
            currentMa = (semiResult.effectiveVoltage / totalHambatanUniversal) * 1000;
            analysisLog.push(`📌 Langkah 4 — Hukum Ohm: I = Veff / R_total = ${semiResult.effectiveVoltage.toFixed(2)}V / ${totalHambatanUniversal.toFixed(1)}Ω = ${currentMa.toFixed(2)} mA`);
          }

          let naratif = `✅ Kesimpulan: Rangkaian dinyatakan TERHUBUNG dan arus mengalir sebesar ${currentMa.toFixed(2)} mA`;
          analysisLog.push(naratif);

          // Evaluasi LED
          const ledSpecs = {
            Red:    { vf: 2.0, ifMax: 20 },
            Yellow: { vf: 2.1, ifMax: 20 },
            Green:  { vf: 2.2, ifMax: 25 },
            Blue:   { vf: 3.2, ifMax: 20 },
            White:  { vf: 3.2, ifMax: 20 },
          };

          leds.forEach((l, i) => {
            const color = l.data?.color || "Red";
            const spec = ledSpecs[color] || ledSpecs.Red;

            if (currentMa > spec.ifMax) {
              burnoutRisk = true;
              errorLog.push(`🔥 PERINGATAN: Arus ${currentMa.toFixed(1)}mA melebihi batas aman LED #${i+1} (${spec.ifMax}mA)! LED Terbakar! 💥`);
              errorNodes[l.id] = `Arus (${currentMa.toFixed(1)}mA) terlalu besar! Tambahkan/perbesar resistor.`;
              nodes_state[l.id] = { ledState: "burn" };
            } else if (currentMa > 0 && semiResult.effectiveVoltage > 0) {
              nodes_state[l.id] = { ledState: "on", brightness: Math.min(100, (currentMa / spec.ifMax) * 100) };
            }
          });

        } else {
          burnoutRisk = true;
          errorLog.push("💥 SHORT CIRCUIT! Tidak ada hambatan! Baterai/komponen akan meledak! 🔥");
          errorNodes[battery.id] = "KORSLETING! Tidak ada hambatan dalam rangkaian tertutup ini.";
        }
      }
    }
  } else {
    errorLog.push("❌ Rangkaian tidak memiliki sumber tegangan (baterai)!");
  }

  // 4. Multimeter logic
  calculateMultimeterReadings(multimeters, battery, totalHambatanUniversal, hasLoop, burnoutRisk, hasOpenPins, nodes_state, nodes, edges, adj);

  return {
    analysisLog,
    errorLog,
    errorNodes,
    nodes_state,
    hasLoop,
    burnoutRisk,
    hasOpenPins
  };
}

module.exports = {
  validateCircuit,
  buildAdjacencyList
};
