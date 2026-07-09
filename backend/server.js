// ============================================
// AI Electronics Simulator - Backend Server
// Express + OpenAI + Ollama AI Tutor Agent
// Fallback chain: OpenAI → Ollama → Mock
// ============================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ============================================
// CIRCUIT VALIDATION ENGINE
// Deterministic analysis of circuit topology
// ============================================

/**
 * Builds an adjacency list from the React Flow edges.
 * Each edge has { source, target, sourceHandle, targetHandle } representing connected pins.
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
 * Supports extended component types: capacitor, switch, motor, buzzer, wire junction.
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

  // ── STATUS BADGE (ditampilkan pertama) ──────────────────────────────────
  if (hasLoop) {
    analysisLog.push("🟢 STATUS RANGKAIAN: AKTIF / TERHUBUNG");
  } else {
    analysisLog.push("🔴 STATUS RANGKAIAN: TERPUTUS / TIDAK AKTIF");
  }

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
        // Cek apakah ada koneksi ke anode dan cathode
        const anodeEdge = dEdges.find(e => 
          (e.source === d.id && e.sourceHandle === 'anode') ||
          (e.target === d.id && e.targetHandle === 'anode')
        );
        const cathodeEdge = dEdges.find(e =>
          (e.source === d.id && e.sourceHandle === 'cathode') ||
          (e.target === d.id && e.targetHandle === 'cathode')
        );
        if (!anodeEdge || !cathodeEdge) {
          // Handle jika pakai FourWayHandles / sambungan umum
          // Asumsikan forward bias jika terhubung lengkap
          totalVoltageDrop += 0.7;
          dropDetails.push(`Dioda #${i+1}: Vf = 0.7V (forward bias)`);
        } else {
          // Cek polaritas: telusuri BFS dari baterai ke node anode vs cathode
          // Simplified: anode side connected to battery+ side = forward
          const anodeNode = anodeEdge.source === d.id ? anodeEdge.target : anodeEdge.source;
          const cathodeNode = cathodeEdge.source === d.id ? cathodeEdge.target : cathodeEdge.source;
          
          // BFS dari battery positive
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
              // Forward bias
              totalVoltageDrop += 0.7;
              dropDetails.push(`Dioda #${i+1}: Forward Bias → Vf = 0.7V`);
            } else if (reachesCathode && !reachesAnode) {
              // Reverse bias — blokir arus
              diodeBlocked = true;
              errorLog.push(`🔴 Dioda #${i+1}: REVERSE BIAS — Dioda dipasang terbalik! Arus diblokir.`);
              errorNodes[d.id] = `Dioda terpasang terbalik (Reverse Bias). Tukar sambungan A+ dan K-.`;
            } else {
              // Tidak bisa dipastikan, asumsikan forward
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

        // Cek apakah basis terhubung
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
          // Hitung resistor yang terhubung ke basis untuk estimasi IB
          // Cari resistor yang bersebelahan dengan transistor (melalui basis)
          const baseNeighbors = conns.filter(c => c.fromPin === 'base' || c.toPin === 'base');
          let Rb = 0;
          baseNeighbors.forEach(neighbor => {
            const neighborNode = nodes.find(n => n.id === neighbor.node);
            if (neighborNode && (neighborNode.type === 'resistor' || neighborNode.data?.componentType === 'resistor')) {
              Rb += (neighborNode.data?.resistance || 10000);
            }
          });

          // Hitung IB: jika ada resistor basis, IB = (Vs - Vbe) / Rb
          const Vbe = 0.7; // tegangan basis-emiter standar
          const VbeStr = `${Vbe}V`;
          let IB_mA = 0;
          let IBFormula = '';

          if (Rb > 0) {
            IB_mA = ((voltage - Vbe) / Rb) * 1000;
            IBFormula = `IB = (Vs - Vbe) / Rb = (${voltage}V - ${VbeStr}) / ${Rb}Ω = ${IB_mA.toFixed(3)} mA`;
          } else {
            // Tidak ada resistor basis terdeteksi, estimasi dari tegangan
            IB_mA = ((voltage - Vbe) / 1000) * 1000; // asumsi Rb = 1kΩ default
            IBFormula = `IB ≈ (Vs - Vbe) / 1kΩ (asumsi) = ${IB_mA.toFixed(3)} mA`;
          }

          // IC = hFE × IB
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

        // Langkah 1 - Komponen diketahui
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

        // Langkah 2 - Total hambatan
        if (resistorDetails.length > 1) {
          const rFormula = resistorDetails.map(d => `${d.value}`).join(" + ");
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = ${rFormula} = ${totalResistance.toFixed(1)}Ω`);
        } else if (resistorDetails.length === 1) {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = ${totalResistance.toFixed(1)}Ω`);
        } else {
          analysisLog.push(`📌 Langkah 1 — Total Hambatan: R_total = 0Ω (tidak ada resistor!)`);
        }

        // Langkah 3 - Tegangan jatuh
        if (dropDetails.length > 0) {
          analysisLog.push(`📌 Langkah 2 — Tegangan Jatuh Semikonduktor: ${dropDetails.join(" + ")} → ΣVf = ${totalVoltageDrop.toFixed(2)}V`);
          analysisLog.push(`📌 Langkah 3 — Tegangan Efektif: Veff = Vs - ΣVf = ${voltage}V - ${totalVoltageDrop.toFixed(2)}V = ${effectiveVoltage.toFixed(2)}V`);
        } else {
          analysisLog.push(`📌 Langkah 2 — Tegangan Efektif: Veff = Vs = ${voltage}V (tidak ada komponen semikonduktor)`);
        }

        if (totalResistance > 0) {
          const current = effectiveVoltage / totalResistance;
          const currentMa = current * 1000;
          const vResistor = effectiveVoltage; // tegangan pada resistor (seri)

          analysisLog.push(`📌 Langkah 4 — Hukum Ohm: I = Veff / R_total = ${effectiveVoltage.toFixed(2)}V / ${totalResistance.toFixed(1)}Ω = ${currentMa.toFixed(2)} mA`);

          // Tegangan pada masing-masing resistor (proporsional)
          if (resistorDetails.length > 0) {
            const vPerResistor = resistorDetails.map(d => {
              const vr = (d.value / totalResistance) * vResistor;
              return `${d.label}: V = ${vr.toFixed(2)}V`;
            }).join(" | ");
            analysisLog.push(`📌 Distribusi Tegangan Resistor: ${vPerResistor}`);
          }

          // Kesimpulan naratif
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

          leds.forEach(l => {
            const color = l.data?.color || "Red";
            const spec = ledSpecs[color] || ledSpecs.Red;
            if (effectiveVoltage <= 0) {
              analysisLog.push(`💡 LED ${color}: Mati — tegangan efektif tidak cukup untuk menyalakan LED.`);
              nodes_state[l.id] = { ledState: "off" };
            } else if (currentMa > spec.ifMax) {
              errorLog.push(`⚠️ LED ${color}: Arus ${currentMa.toFixed(1)}mA MELEBIHI batas If_max=${spec.ifMax}mA → Risiko Terbakar!`);
              errorNodes[l.id] = `Terbakar! Arus ${currentMa.toFixed(1)}mA > batas ${spec.ifMax}mA.`;
              nodes_state[l.id] = { ledState: "burnt" };
              burnoutRisk = true;
            } else if (currentMa < 5) {
              analysisLog.push(`💡 LED ${color}: Menyala REDUP (${currentMa.toFixed(1)}mA < 5mA). Kurangi hambatan atau naikkan tegangan.`);
              nodes_state[l.id] = { ledState: "dim" };
            } else {
              analysisLog.push(`💡 LED ${color}: Menyala OPTIMAL ✅ — Arus ${currentMa.toFixed(1)}mA dalam rentang aman (5–${spec.ifMax}mA).`);
              nodes_state[l.id] = { ledState: "bright" };
            }
          });

        } else {
          // Korsleting — tidak ada hambatan
          analysisLog.push(`⚡ Langkah 4 — Hukum Ohm: I = ${effectiveVoltage.toFixed(2)}V / 0Ω = ∞ (TAK TERHINGGA!) → KORSLETING!`);
          analysisLog.push(`✅ Kesimpulan: Rangkaian terhubung TETAPI terjadi SHORT CIRCUIT karena tidak ada hambatan (resistor).`);
          if (leds.length > 0) {
            burnoutRisk = true;
            errorLog.push("🔥 PERINGATAN: LED terhubung langsung tanpa resistor pembatas arus — Risiko Terbakar Tinggi!");
            leds.forEach(l => {
              errorNodes[l.id] = "Short Circuit! Pasang resistor pembatas arus segera.";
              nodes_state[l.id] = { ledState: "burnt" };
            });
          }
        }

        // ── MULTIMETER READINGS ────────────────────────────────────────
        const multimeters = nodes.filter(n => n.data?.componentType === 'multimeter' || n.type === 'multimeter');
        multimeters.forEach(m => {
          const mode = m.data?.mode || 'V';
          const mEdges = edges.filter(e => e.source === m.id || e.target === m.id);
          if (mEdges.length >= 2 && totalResistance > 0) {
            const currentMaLocal = (effectiveVoltage / totalResistance) * 1000;
            if (mode === 'V') {
              const reading = effectiveVoltage.toFixed(2);
              nodes_state[m.id] = { reading, mode: 'V' };
              analysisLog.push(`📟 Multimeter (Voltmeter): Tegangan terukur = ${reading} V`);
            } else if (mode === 'A') {
              const reading = currentMaLocal.toFixed(2);
              nodes_state[m.id] = { reading, mode: 'A' };
              analysisLog.push(`📟 Multimeter (Ammeter): Arus terukur = ${reading} mA`);
            } else if (mode === 'Ohm') {
              const reading = totalResistance.toFixed(1);
              nodes_state[m.id] = { reading, mode: 'Ohm' };
              analysisLog.push(`📟 Multimeter (Ohmmeter): Hambatan terukur = ${reading} Ω`);
            }
          } else if (mEdges.length < 2) {
            nodes_state[m.id] = { reading: '---', mode };
            analysisLog.push(`📟 Multimeter: Belum tersambung ke 2 titik di rangkaian.`);
          }
        });
      }
    }
  }

  return { analysisLog, errorLog, hasLoop, burnoutRisk, errorNodes, nodes_state };
}

// ============================================
// AI TUTOR SYSTEM PROMPT
// The "Fun Way" Physics Tutor Persona
// ============================================

function buildSystemPrompt(validationResult, lang) {
  let prompt = `You are "Sparky", a friendly, gamified physics tutor for an electronics learning simulator.

PERSONA RULES:
- You speak like an encouraging lab partner who genuinely loves circuits.
- Use the "fun way" teaching philosophy: guide through curiosity, NEVER give direct answers.
- Always relate concepts back to Ohm's Law (V = I × R) and basic circuit principles.
- Use emojis sparingly but effectively (⚡🔋💡🔧).
- If the student makes a mistake, celebrate it as a learning opportunity.
- NEVER reveal the exact solution. Give progressive hints that lead to discovery.`;

  if (lang === "id") {
    prompt += `\n- CRITICAL: You MUST respond entirely in Bahasa Indonesia. Gunakan bahasa Indonesia yang ramah, santai, dan edukatif.`;
  }

  prompt += `\n\nCIRCUIT ANALYSIS CONTEXT:
${JSON.stringify(validationResult, null, 2)}

RESPONSE FORMAT:
You MUST respond with valid JSON matching this EXACT schema:
{
  "greeting": "A short, encouraging greeting (1-2 sentences)",
  "explanation": "A conceptual explanation of what's happening in the circuit. Reference Ohm's Law. Keep it fun and educational (2-4 sentences).",
  "hint": "A guiding question or hint to help the student understand or fix their circuit. Never give the direct answer (1-2 sentences).",
  "suggestion_button_text": "A short, fun call-to-action text for a button (e.g., 'Try adding a resistor! 🔧')"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no extra text.`;

  return prompt;
}

// ============================================
// MOCK AI RESPONSE GENERATOR
// ============================================

function generateMockAIResponse(validationResult, lang) {
  const { hasLoop, burnoutRisk } = validationResult;

  if (lang === "id") {
    if (burnoutRisk) {
      return {
        greeting: "Halo, penjelajah rangkaian yang berani! ⚡ Sepertinya kamu sedang mencari bahaya!",
        explanation: "LED kamu terhubung langsung ke baterai — itu seperti minum dari selang pemadam kebakaran! 🔥 Dalam elektronika, Hukum Ohm (V = I × R) mengatakan bahwa tanpa hambatan, arus akan menjadi terlalu tinggi. LED merah standar hanya bisa menangani sekitar 20mA dengan aman.",
        hint: "Komponen apa yang bisa kamu letakkan di antara baterai dan LED untuk membatasi aliran arus? Pikirkan tentang V = I × R... apa yang terjadi ketika R sangat kecil (atau nol)? 🤔",
        suggestion_button_text: "Coba tambahkan resistor! 🔧",
      };
    }

    if (!hasLoop) {
      return {
        greeting: "Selamat datang kembali, ilmuwan rangkaian! 🔬 Kulihat kamu sedang menghubungkan komponen!",
        explanation: "Saat ini rangkaianmu terlihat seperti jalan buntu — elektron ingin bergerak dalam satu putaran penuh dari terminal positif baterai, melewati komponen, dan kembali ke terminal negatif. Tanpa putaran yang tertutup, arus tidak bisa mengalir!",
        hint: "Bisakah kamu melacak jalur dari satu terminal baterai, melewati SEMUA komponenmu, dan kembali ke terminal lainnya? Jika tidak, di mana celahnya? 🔍",
        suggestion_button_text: "Periksa kembali kabelmu! 🔗",
      };
    }

    return {
      greeting: "Kerja bagus! 🌟 Kamu berhasil membuat rangkaian menyala dengan sukses!",
      explanation: "Arus mengalir dengan sempurna membentuk putaran dari baterai, melewati resistor yang mengatur kecepatan aliran, dan masuk ke LED yang mengubah sisa energi menjadi cahaya. Hukum Ohm sedang beraksi secara real-time! Berdasarkan analisis saya, nilai arus ada pada level yang aman.",
      hint: "Apa yang akan terjadi jika kamu mengubah resistor menjadi yang hambatannya lebih tinggi (seperti 10kΩ)? Menurut Hukum Ohm, jika R naik tapi V tetap sama, apa yang terjadi pada I (Arus)? 🧐",
      suggestion_button_text: "Eksperimen dengan nilai resistor! ⚡",
    };
  }

  // English fallback
  if (burnoutRisk) {
    return {
      greeting: "Hey there, brave circuit explorer! ⚡ Looks like you're living dangerously!",
      explanation: "Your LED is connected straight to the battery — that's like drinking from a fire hose! 🔥 In electronics, Ohm's Law (V = I × R) tells us that without resistance, the current goes way too high. A standard red LED can only handle about 20mA safely.",
      hint: "What component could you place between the battery and the LED to limit the current flow? Think about V = I × R... what happens when R is very small (or zero)? 🤔",
      suggestion_button_text: "Try adding a resistor! 🔧",
    };
  }

  if (!hasLoop) {
    return {
      greeting: "Welcome back, circuit scientist! 🔬 I see you've been wiring things up!",
      explanation: "Right now your circuit looks like a road with a dead end — electrons want to travel in a complete loop from the battery's positive terminal, through components, and back to the negative terminal. Without a closed loop, no current can flow!",
      hint: "Can you trace a path from one battery terminal, through ALL your components, and back to the other terminal? If not, where is the gap? 🔍",
      suggestion_button_text: "Double-check your wiring! 🔗",
    };
  }

  return {
    greeting: "Great job! 🌟 You've got a successfully powered circuit!",
    explanation: "Current is flowing beautifully in a loop from the battery, through your resistor which sets the pace, and into your LED which turns the remaining energy into light. That's Ohm's Law in action! Based on my analysis, the current is at a safe level.",
    hint: "What would happen if you changed your resistor to one with a higher resistance (like 10kΩ)? According to Ohm's Law, if R goes up but V stays the same, what happens to I (Current)? 🧐",
    suggestion_button_text: "Experiment with resistor values! ⚡",
  };
}

// ============================================
// OLLAMA INTEGRATION
// Calls local Ollama LLM as fallback for OpenAI
// ============================================

/**
 * Check if Ollama is running locally.
 * Returns true if the Ollama API is reachable.
 */
async function isOllamaAvailable() {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Call Ollama's local API for AI tutor response.
 * Uses the chat completions-style endpoint.
 */
async function callOllama(validationResult, lang) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: buildSystemPrompt(validationResult, lang) },
        {
          role: "user",
          content: lang === "id" 
            ? "Analisis rangkaian saya dan berikan umpan balik sebagai Sparky sang tutor. Jawab HANYA dengan objek JSON."
            : "Analyze my circuit and give me feedback as Sparky the tutor. Respond ONLY with the JSON object.",
        },
      ],
      options: {
        temperature: 0.7,
        num_predict: 500,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const raw = data.message?.content || "";

  // Parse JSON response, stripping any accidental markdown fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ============================================
// AI PROVIDER CHAIN
// Fallback: OpenAI → Ollama → Mock
// ============================================

async function getAIInsights(validationResult, lang) {
  const apiKey = process.env.OPENAI_API_KEY;

  // ---- Attempt 1: OpenAI ----
  if (apiKey && apiKey.trim() !== "") {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: "system", content: buildSystemPrompt(validationResult, lang) },
          {
            role: "user",
            content: lang === "id"
              ? "Analisis rangkaian saya dan berikan umpan balik sebagai Sparky sang tutor. Jawab HANYA dengan objek JSON."
              : "Analyze my circuit and give me feedback as Sparky the tutor. Respond ONLY with the JSON object.",
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const insights = JSON.parse(cleaned);

      return { source: "openai", insights };
    } catch (error) {
      console.warn("⚠️ OpenAI failed:", error.message);
      console.log("🔄 Falling back to Ollama...");
    }
  }

  // ---- Attempt 2: Ollama (local LLM) ----
  try {
    const ollamaReady = await isOllamaAvailable();
    if (ollamaReady) {
      console.log("🦙 Ollama detected! Using local LLM...");
      const insights = await callOllama(validationResult, lang);
      return { source: "ollama", insights };
    } else {
      console.log("🦙 Ollama not available at", process.env.OLLAMA_URL || "http://localhost:11434");
    }
  } catch (error) {
    console.warn("⚠️ Ollama failed:", error.message);
  }

  // ---- Attempt 3: Mock (deterministic fallback) ----
  console.log("🤖 Using mock AI tutor response.");
  return {
    source: "mock",
    insights: generateMockAIResponse(validationResult, lang),
  };
}

// ============================================
// DETECT AVAILABLE AI MODE AT STARTUP
// ============================================

async function detectAIMode() {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    return "openai (→ ollama → mock fallback)";
  }
  const ollama = await isOllamaAvailable();
  if (ollama) return "ollama (→ mock fallback)";
  return "mock (no LLM provider found)";
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get("/api/health", async (req, res) => {
  const aiMode = await detectAIMode();
  res.json({
    status: "online",
    service: "AI Electronics Simulator",
    timestamp: new Date().toISOString(),
    ai_mode: aiMode,
    ollama_url: process.env.OLLAMA_URL || "http://localhost:11434",
  });
});

// Main circuit evaluation endpoint
app.post("/api/evaluate-circuit", async (req, res) => {
  try {
    const { nodes, edges, lang = "en" } = req.body;

    // Input validation
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        api_status: "ERROR",
        analysis_log: [],
        ai_insights: null,
        error_log: ["Invalid request: 'nodes' must be an array."],
      });
    }
    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({
        api_status: "ERROR",
        analysis_log: [],
        ai_insights: null,
        error_log: ["Invalid request: 'edges' must be an array."],
      });
    }

    console.log(
      `\n📡 Received evaluation request: ${nodes.length} nodes, ${edges.length} edges`
    );

    // Step 1: Deterministic circuit validation
    const validationResult = validateCircuit(nodes, edges);

    // Step 2: AI Tutor analysis (OpenAI → Ollama → Mock)
    const { source, insights } = await getAIInsights(validationResult, lang);

    console.log(`🤖 AI response source: ${source}`);

    // Step 3: Build response matching the required schema
    const response = {
      api_status: "ACTIVE",
      analysis_log: [
        ...validationResult.analysisLog,
        // Tampilkan sumber AI hanya jika bukan mock, atau ganti labelnya
        source !== 'mock' ? `🤖 Tutor AI: ${source.toUpperCase()}` : null,
      ].filter(Boolean),
      ai_insights: {
        greeting: insights.greeting || "Halo, pelajar rangkaian!",
        explanation: insights.explanation || "Mari analisis rangkaianmu...",
        hint: insights.hint || "Coba sambungkan semua komponen dalam satu loop!",
        suggestion_button_text:
          insights.suggestion_button_text || "Butuh bantuan? 🤔",
      },
      error_log: validationResult.errorLog,
      error_nodes: validationResult.errorNodes,
      nodes_state: validationResult.nodes_state,
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      api_status: "ERROR",
      analysis_log: [],
      ai_insights: null,
      error_log: [`Server error: ${error.message}`],
    });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
  const aiMode = await detectAIMode();
  console.log(`\n⚡ ====================================`);
  console.log(`   AI Electronics Simulator - Backend`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   AI Mode: ${aiMode}`);
  console.log(`⚡ ====================================\n`);
});
