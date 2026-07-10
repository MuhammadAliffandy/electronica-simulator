/**
 * Builds an adjacency list from the React Flow edges.
 */
function buildAdjacencyList(nodes, edges) {
  const adj = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push({ node: e.target, fromPin: e.sourceHandle, toPin: e.targetHandle });
    if (adj[e.target]) adj[e.target].push({ node: e.source, fromPin: e.targetHandle, toPin: e.sourceHandle });
  });
  return adj;
}

/**
 * Run deterministic circuit validation and return analysis log + error log.
 */
function validateCircuit(nodes, edges) {
  const analysisLog = [];
  const errorLog = [];
  const errorNodes = {}; // Map of nodeId -> specific error message
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

  if (nodes.length < 2) {
    errorLog.push("❌ Sebuah rangkaian membutuhkan setidaknya 2 komponen.");
  }
  if (edges.length === 0) {
    errorLog.push("❌ Tidak ada kabel yang terdeteksi. Hubungkan komponenmu!");
  }

  // Check connectivity
  let hasOpenPins = false;
  nodes.forEach(n => {
    if ((adj[n.id] || []).length < 2) {
      errorNodes[n.id] = "Koneksi terbuka! Komponen ini bukan bagian dari loop yang tertutup.";
      hasOpenPins = true;
    }
  });

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

  if (battery) {
    const voltage = battery.data?.voltage || 9;
    const isAC = battery.data?.sourceType === "ac";

    if (isAC) {
      analysisLog.push(`⚠️ Sumber tegangan adalah AC (${voltage}V). Perhitungan menggunakan pendekatan nilai puncak untuk simulasi dasar.`);
    }

    // Capacitor Explosion logic
    capacitors.forEach(c => {
      if (c.data?.capType === "elco" && voltage > 16) {
         errorLog.push(`💥 BOOM! Ledakan Tegangan! Kapasitor Elco batas 16V terpapar tegangan ${voltage}V!`);
         errorNodes[c.id] = "Ledakan Tegangan! Tegangan melebihi batas aman 16V.";
      }
    });

    if (hasLoop) {
      // ── HITUNG TOTAL HAMBATAN (DETEKSI SERI & PARALEL) ───────────────
      let resistorDetails = [];
      let totalResistance = 0;

      // Kelompokkan resistor berdasarkan node yang sama (paralel = terhubung ke 2 node yang sama)
      const resistorGroups = {};
      resistors.forEach((r) => {
        const rEdges = edges.filter(e => e.source === r.id || e.target === r.id);
        const connectedNodes = rEdges
          .map(e => e.source === r.id ? e.target : e.source)
          .sort();
        const key = connectedNodes.join(',');
        if (!resistorGroups[key]) resistorGroups[key] = [];
        resistorGroups[key].push(r);
      });

      let groupIndex = 0;
      const parallelGroupDetails = [];
      Object.values(resistorGroups).forEach(group => {
        groupIndex++;
        if (group.length === 1) {
          const rVal = group[0].data?.resistance || 220;
          totalResistance += rVal;
          resistorDetails.push({ label: `R${groupIndex}`, value: rVal, unit: 'Ω', isParallel: false });
          parallelGroupDetails.push({ type: 'series', label: `R${groupIndex}`, equiv: rVal, resistors: group });
        } else {
          // Paralel: 1/Req = 1/R1 + 1/R2 + ...
          const invSum = group.reduce((acc, r) => acc + 1 / (r.data?.resistance || 220), 0);
          const Req = 1 / invSum;
          totalResistance += Req;
          const labels = group.map((r, i) => `R${groupIndex}${String.fromCharCode(97+i)}`).join('‖');
          resistorDetails.push({ label: labels, value: Req, unit: 'Ω', isParallel: true, components: group });
          parallelGroupDetails.push({ type: 'parallel', label: labels, equiv: Req, resistors: group });
        }
      });

      pots.forEach((p, i) => {
        const effectiveR = ((p.data?.maxResistance || 10000) * (p.data?.wiperPercent || 50)) / 100;
        totalResistance += effectiveR;
        resistorDetails.push({ label: `Pot${i + 1}`, value: effectiveR, unit: 'Ω', isParallel: false });
      });

      inductors.forEach((ind, i) => {
        resistorDetails.push({ label: `L${i + 1} (DC Short)`, value: 0, unit: 'Ω' });
      });

      // Log resistor topology
      parallelGroupDetails.forEach(g => {
        if (g.type === 'parallel') {
          const formula = g.resistors.map(r => `${r.data?.resistance||220}`).join(' + ');
          const invFormula = g.resistors.map(r => `1/${r.data?.resistance||220}`).join(' + ');
          analysisLog.push(`🔀 Resistor PARALEL (${g.label}): 1/Req = ${invFormula} → Req = ${g.equiv.toFixed(2)}Ω`);
        }
      });

      // ── HITUNG TEGANGAN JATUH (VOLTAGE DROP) ──────────────────────────
      const ledSpecs = {
        Red:    { vf: 2.0, ifMax: 20 },
        Yellow: { vf: 2.1, ifMax: 20 },
        Green:  { vf: 2.2, ifMax: 25 },
        Blue:   { vf: 3.2, ifMax: 20 },
        White:  { vf: 3.2, ifMax: 20 },
      };
      let totalVoltageDrop = 0;
      let dropDetails = [];

      // ── CEK ARAH DIODA ────────────────────────────────────────────────
      let diodeBlocked = false;
      diodes.forEach((d, i) => {
        const dEdges = edges.filter(e => e.source === d.id || e.target === d.id);
        const anodeEdge = dEdges.find(e => 
          (e.source === d.id && e.sourceHandle === 'anode') ||
          (e.target === d.id && e.targetHandle === 'anode')
        );
        const cathodeEdge = dEdges.find(e =>
          (e.source === d.id && e.sourceHandle === 'cathode') ||
          (e.target === d.id && e.targetHandle === 'cathode')
        );
        if (!anodeEdge || !cathodeEdge) {
          totalVoltageDrop += 0.7;
          dropDetails.push(`Dioda #${i+1}: Vf = 0.7V (forward bias)`);
        } else {
          // BFS polarity check
          const anodeNode = anodeEdge.source === d.id ? anodeEdge.target : anodeEdge.source;
          const cathodeNode = cathodeEdge.source === d.id ? cathodeEdge.target : cathodeEdge.source;
          const batteryNode = batteries[0];
          if (batteryNode) {
            const visited = new Set();
            const queue = [batteryNode.id];
            visited.add(batteryNode.id);
            let reachesAnode = false;
            let reachesCathode = false;
            while (queue.length > 0) {
              const cur = queue.shift();
              if (cur === anodeNode) reachesAnode = true;
              if (cur === cathodeNode) reachesCathode = true;
              (adj[cur] || []).forEach(neighbor => {
                if (!visited.has(neighbor.node) && neighbor.node !== d.id) {
                  visited.add(neighbor.node);
                  queue.push(neighbor.node);
                }
              });
            }
            if (reachesAnode && !reachesCathode) {
              totalVoltageDrop += 0.7;
              dropDetails.push(`Dioda #${i+1}: Forward Bias → Vf = 0.7V`);
            } else if (reachesCathode && !reachesAnode) {
              diodeBlocked = true;
              errorLog.push(`🔴 Dioda #${i+1}: REVERSE BIAS — Dioda dipasang terbalik! Arus diblokir.`);
              errorNodes[d.id] = `Dioda terpasang terbalik (Reverse Bias). Tukar sambungan A+ dan K-.`;
            } else {
              totalVoltageDrop += 0.7;
              dropDetails.push(`Dioda #${i+1}: Vf = 0.7V`);
            }
          } else {
            totalVoltageDrop += 0.7;
            dropDetails.push(`Dioda #${i+1}: Vf = 0.7V`);
          }
        }
      });

      if (diodeBlocked) {
        hasLoop = false;
        analysisLog.push("❌ Rangkaian diblokir oleh dioda yang terpasang terbalik.");
      }

      let effectiveVoltage = voltage - totalVoltageDrop;
      if (effectiveVoltage < 0) effectiveVoltage = 0;

      // ── CEK & HITUNG TRANSISTOR ────────────────────────────────────────
      let transBlocked = false;
      transistors.forEach(t => {
        const conns = adj[t.id] || [];
        const isNPN = (t.data?.transistorType || 'npn') === 'npn';
        const hFE = isNPN ? 200 : 100; // typical hFE BC547 / BC557

        const hasBase = conns.some(c => c.fromPin === 'base' || c.toPin === 'base');
        const hasCollector = conns.some(c => c.fromPin === 'collector' || c.toPin === 'collector');
        const hasEmitter = conns.some(c => c.fromPin === 'emitter' || c.toPin === 'emitter');

        if (!hasBase) {
          transBlocked = true;
          errorLog.push(`⬛ Transistor ${isNPN ? 'NPN' : 'PNP'} MATI: Pin Basis (B) tidak terhubung. Arus diblokir.`);
          errorNodes[t.id] = `Transistor MATI. Pin B (Basis) belum terhubung ke rangkaian.`;
          return;
        }

        if (!hasCollector) {
          errorLog.push(`⚠️ Transistor: Pin Collector (C) tidak terhubung.`);
          errorNodes[t.id] = `Pin C (Collector) belum terhubung.`;
        }
        if (!hasEmitter) {
          errorLog.push(`⚠️ Transistor: Pin Emitter (E) tidak terhubung.`);
          errorNodes[t.id] = `Pin E (Emitter) belum terhubung.`;
        }

        if (hasBase && hasCollector && hasEmitter) {
          const baseNeighbors = conns.filter(c => c.fromPin === 'base' || c.toPin === 'base');
          let Rb = 0;
          baseNeighbors.forEach(neighbor => {
            const neighborNode = nodes.find(n => n.id === neighbor.node);
            if (neighborNode && (neighborNode.type === 'resistor' || neighborNode.data?.componentType === 'resistor')) {
              Rb += (neighborNode.data?.resistance || 10000);
            }
          });

          const Vbe = 0.7; // tegangan basis-emiter standar
          const VbeStr = `${Vbe}V`;
          let IB_mA = 0;
          let IBFormula = '';

          if (Rb > 0) {
            IB_mA = ((voltage - Vbe) / Rb) * 1000;
            IBFormula = `IB = (Vs - Vbe) / Rb = (${voltage}V - ${VbeStr}) / ${Rb}Ω = ${IB_mA.toFixed(3)} mA`;
          } else {
            IB_mA = ((voltage - Vbe) / 1000) * 1000; // asumsi Rb = 1kΩ default
            IBFormula = `IB ≈ (Vs - Vbe) / 1kΩ (asumsi) = ${IB_mA.toFixed(3)} mA`;
          }

          const IC_mA = hFE * IB_mA;
          const ICsat_mA = (effectiveVoltage / Math.max(totalResistance, 10)) * 1000; // IC saat saturasi
          const isSaturated = IC_mA >= ICsat_mA;

          analysisLog.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          analysisLog.push(`🔬 ANALISIS TRANSISTOR ${isNPN ? 'NPN' : 'PNP'} (${isNPN ? 'BC547' : 'BC557'})`);
          analysisLog.push(`📌 Parameter: hFE = ${hFE}, Vbe = ${VbeStr}`);
          analysisLog.push(`📌 Langkah 1 — Arus Basis: ${IBFormula}`);
          analysisLog.push(`📌 Langkah 2 — Arus Kolektor: IC = hFE × IB = ${hFE} × ${IB_mA.toFixed(3)}mA = ${IC_mA.toFixed(2)} mA`);
          if (totalResistance > 0) {
            analysisLog.push(`📌 Langkah 3 — IC saturasi: IC(sat) = Veff / Rc = ${effectiveVoltage.toFixed(2)}V / ${totalResistance.toFixed(1)}Ω = ${ICsat_mA.toFixed(2)} mA`);
          }
          analysisLog.push(`📌 Status Transistor: ${isSaturated ? '🟢 SATURASI — transistor ON penuh, arus mengalir maksimum' : '🟡 AKTIF (Linear) — transistor menguat, IC = hFE × IB'}`);

          if (isSaturated) {
            analysisLog.push(`✅ Transistor dalam kondisi SATURASI. Arus kolektor ≈ ${ICsat_mA.toFixed(2)} mA.`);
          } else {
            analysisLog.push(`✅ Transistor dalam kondisi AKTIF. Arus kolektor = ${IC_mA.toFixed(2)} mA.`);
          }
        }
      });

      if (transBlocked) {
        hasLoop = false;
        analysisLog.push("❌ Rangkaian terblokir oleh transistor yang tidak aktif.");
      }

      if (hasLoop) {
        // ── ANALISIS PERHITUNGAN STEP-BY-STEP ─────────────────────────
        analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        analysisLog.push("📐 ANALISIS PERHITUNGAN RANGKAIAN");
        analysisLog.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        let step1 = `📌 Diketahui: Sumber tegangan Vs = ${voltage}V${isAC ? " AC" : " DC"}`;
        if (resistorDetails.length > 0) {
          step1 += " | " + resistorDetails.map(d => `${d.label} = ${d.value}${d.unit}`).join(", ");
        }
        if (leds.length > 0) {
          step1 += " | " + leds.map((l, i) => {
            const color = l.data?.color || "Red";
            const spec = ledSpecs[color] || ledSpecs.Red;
            return `LED ${color} #${i+1} (Vf=${spec.vf}V, If_max=${spec.ifMax}mA)`;
          }).join(", ");
        }
        analysisLog.push(step1);

        if (resistorDetails.length > 1) {
          const rFormula = resistorDetails.map(d => `${d.value}`).join(" + ");
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = ${rFormula} = ${totalResistance.toFixed(1)}Ω`);
        } else if (resistorDetails.length === 1) {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = ${totalResistance.toFixed(1)}Ω`);
        } else {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = 0Ω (tidak ada resistor!)`);
        }

        if (dropDetails.length > 0) {
          analysisLog.push(`📌 Langkah 2 — Tegangan Jatuh Semikonduktor: ${dropDetails.join(" + ")} → ΣVf = ${totalVoltageDrop.toFixed(2)}V`);
          analysisLog.push(`📌 Langkah 3 — Tegangan Efektif: Veff = Vs - ΣVf = ${voltage}V - ${totalVoltageDrop.toFixed(2)}V = ${effectiveVoltage.toFixed(2)}V`);
        } else {
          analysisLog.push(`📌 Langkah 2 — Tegangan Efektif: Veff = Vs = ${voltage}V (tidak ada komponen semikonduktor)`);
        }

        if (totalResistance > 0) {
          const current = effectiveVoltage / totalResistance;
          const currentMa = current * 1000;
          const vResistor = effectiveVoltage; 

          analysisLog.push(`📌 Langkah 4 — Hukum Ohm: I = Veff / R_total = ${effectiveVoltage.toFixed(2)}V / ${totalResistance.toFixed(1)}Ω = ${currentMa.toFixed(2)} mA`);

          if (resistorDetails.length > 0) {
            const vPerResistor = resistorDetails.map(d => {
              const vr = (d.value / totalResistance) * vResistor;
              return `${d.label}: V = ${vr.toFixed(2)}V`;
            }).join(" | ");
            analysisLog.push(`📌 Distribusi Tegangan Resistor: ${vPerResistor}`);
          }

          let naratif = `✅ Kesimpulan: Rangkaian dinyatakan TERHUBUNG dan arus mengalir sebesar ${currentMa.toFixed(2)} mA`;
          if (resistorDetails.length > 0) {
            naratif += ` dengan total hambatan ${totalResistance.toFixed(1)}Ω`;
          }
          naratif += ` dan tegangan sumber ${voltage}V`;
          if (totalVoltageDrop > 0) {
            naratif += ` (tegangan jatuh semikonduktor: ${totalVoltageDrop.toFixed(2)}V)`;
          }
          naratif += ".";
          analysisLog.push(naratif);

          // Evaluasi LED
          leds.forEach((l, i) => {
            const color = l.data?.color || "Red";
            const spec = ledSpecs[color] || ledSpecs.Red;
            
            totalVoltageDrop += spec.vf;
            dropDetails.push(`LED #${i+1} (${color}): Vf = ${spec.vf}V`);

            if (currentMa > spec.ifMax) {
              burnoutRisk = true;
              errorLog.push(`🔥 PERINGATAN: Arus ${currentMa.toFixed(1)}mA melebihi batas aman LED #${i+1} (${spec.ifMax}mA)! LED Terbakar! 💥`);
              errorNodes[l.id] = `Arus (${currentMa.toFixed(1)}mA) terlalu besar! Tambahkan/perbesar resistor.`;
              nodes_state[l.id] = { ledState: "burn" };
            } else if (currentMa > 0 && effectiveVoltage > 0) {
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

  // Handle multimeter reading
  // ── KALKULASI HAMBATAN UNIVERSAL (Untuk Multimeter & Simulasi Utama) ──
  let totalHambatanUniversal = 0;
  const resGroups = {};
  resistors.forEach((r) => {
    const rEdges = edges.filter(e => e.source === r.id || e.target === r.id);
    const connectedNodes = rEdges.map(e => e.source === r.id ? e.target : e.source).sort();
    const key = connectedNodes.join(',');
    if (!resGroups[key]) resGroups[key] = [];
    resGroups[key].push(r);
  });
  Object.values(resGroups).forEach(group => {
    if (group.length === 1) {
      totalHambatanUniversal += (group[0].data?.resistance || 220);
    } else {
      const invSum = group.reduce((acc, r) => acc + 1 / (r.data?.resistance || 220), 0);
      totalHambatanUniversal += (1 / invSum);
    }
  });
  pots.forEach((p) => {
    totalHambatanUniversal += ((p.data?.maxResistance || 10000) * (p.data?.wiperPercent || 50)) / 100;
  });

  const multimeters = nodes.filter((n) => n.data?.componentType === "multimeter" || n.type === "multimeter");
  multimeters.forEach(mm => {
    const mmMode = mm.data?.mode || "V";
    let reading = "0.00";
    let unit = mmMode;
    if (hasLoop && !burnoutRisk && !hasOpenPins) {
      if (mmMode === "V") {
         const voltage = battery?.data?.voltage || 9;
         reading = voltage.toFixed(2);
      } else if (mmMode === "A") {
         const v = battery?.data?.voltage || 9;
         if(totalHambatanUniversal > 0) {
             const i = (v / totalHambatanUniversal) * 1000;
             reading = i.toFixed(2);
             unit = "mA";
         }
      } else if (mmMode === "Ω") {
         reading = totalHambatanUniversal.toFixed(1);
      }
    } else if (mmMode === "Ω" && !hasOpenPins) {
      // Multimeter bisa mengukur hambatan meskipun baterai tidak terpasang
      reading = totalHambatanUniversal.toFixed(1);
    }
    nodes_state[mm.id] = { reading, unit };
  });

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
