function calculateSemiconductors(nodes, edges, adj, batteries, diodes, transistors, totalResistance) {
  let totalVoltageDrop = 0;
  let dropDetails = [];
  let diodeBlocked = false;
  let transBlocked = false;
  const errorLog = [];
  const errorNodes = {};
  const analysisLog = [];
  let transCurrent_mA = null;

  const battery = batteries[0];
  const voltage = battery ? (battery.data?.voltage || 9) : 0;

  // 1. DIODES
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
      const anodeNode = anodeEdge.source === d.id ? anodeEdge.target : anodeEdge.source;
      const cathodeNode = cathodeEdge.source === d.id ? cathodeEdge.target : cathodeEdge.source;
      if (battery) {
        const visited = new Set();
        const queue = [battery.id];
        visited.add(battery.id);
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
    analysisLog.push("❌ Rangkaian diblokir oleh dioda yang terpasang terbalik.");
  }

  let effectiveVoltage = voltage - totalVoltageDrop;
  if (effectiveVoltage < 0) effectiveVoltage = 0;

  // Helper to trace resistance from a pin to battery
  function getLoopResistance(startNodeId, targetNodeId, excludeNodeId) {
    const queue = [[startNodeId, 0]];
    const visited = new Set([startNodeId, excludeNodeId]);
    
    while (queue.length > 0) {
      const [curId, currentRes] = queue.shift();
      const node = nodes.find(n => n.id === curId);
      
      let r = 0;
      if (node && (node.type === 'resistor' || node.data?.componentType === 'resistor')) {
        r = node.data?.resistance || 0;
      }
      
      if (curId === targetNodeId) return currentRes + r;
      
      (adj[curId] || []).forEach(neighbor => {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node);
          queue.push([neighbor.node, currentRes + r]);
        }
      });
    }
    return 0; 
  }

  // 2. TRANSISTORS
  transistors.forEach(t => {
    const conns = adj[t.id] || [];
    const isNPN = (t.data?.transistorType || 'npn') === 'npn';
    const hFE = isNPN ? 200 : 100; 

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
      // Find nodes connected to each pin
      const baseNodeId = conns.find(c => c.fromPin === 'base' || c.toPin === 'base')?.node;
      const collectorNodeId = conns.find(c => c.fromPin === 'collector' || c.toPin === 'collector')?.node;
      
      let Rb = 0;
      let Rc = 0;
      
      if (battery) {
         Rb = getLoopResistance(baseNodeId, battery.id, t.id);
         Rc = getLoopResistance(collectorNodeId, battery.id, t.id);
      } else {
         // Fallback if no battery but analyzing
         Rb = 10000;
         Rc = totalResistance;
      }

      const Vbe = 0.7;
      const VbeStr = `${Vbe}V`;
      let IB_mA = 0;
      let IBFormula = '';

      if (Rb > 0) {
        IB_mA = ((voltage - Vbe) / Rb) * 1000;
        if (IB_mA < 0) IB_mA = 0;
        IBFormula = `IB = (Vs - Vbe) / Rb = (${voltage}V - ${VbeStr}) / ${Rb}Ω = ${IB_mA.toFixed(3)} mA`;
      } else {
        IB_mA = ((voltage - Vbe) / 1000) * 1000;
        if (IB_mA < 0) IB_mA = 0;
        IBFormula = `IB ≈ (Vs - Vbe) / 1kΩ (asumsi, awas terbakar!) = ${IB_mA.toFixed(3)} mA`;
      }

      const IC_mA = hFE * IB_mA;
      // Gunakan Rc khusus untuk kolektor
      const ICsat_mA = (effectiveVoltage / Math.max(Rc, 10)) * 1000;
      const isSaturated = IC_mA >= ICsat_mA;

      analysisLog.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      analysisLog.push(`🔬 ANALISIS TRANSISTOR ${isNPN ? 'NPN' : 'PNP'} (${isNPN ? 'BC547' : 'BC557'})`);
      analysisLog.push(`📌 Parameter: hFE = ${hFE}, Vbe = ${VbeStr}`);
      analysisLog.push(`📌 Hambatan Terdeteksi: Rb = ${Rb}Ω, Rc = ${Rc}Ω`);
      analysisLog.push(`📌 Langkah 1 — Arus Basis: ${IBFormula}`);
      analysisLog.push(`📌 Langkah 2 — Arus Kolektor: IC = hFE × IB = ${hFE} × ${IB_mA.toFixed(3)}mA = ${IC_mA.toFixed(2)} mA`);
      if (Rc > 0) {
        analysisLog.push(`📌 Langkah 3 — IC saturasi: IC(sat) = Veff / Rc = ${effectiveVoltage.toFixed(2)}V / ${Rc.toFixed(1)}Ω = ${ICsat_mA.toFixed(2)} mA`);
      }
      analysisLog.push(`📌 Status Transistor: ${isSaturated ? '🟢 SATURASI — transistor ON penuh, arus mengalir maksimum' : '🟡 AKTIF (Linear) — transistor menguat, IC = hFE × IB'}`);

      let finalTransistorCurrent = 0;
      if (isSaturated) {
        analysisLog.push(`✅ Transistor dalam kondisi SATURASI. Arus kolektor ≈ ${ICsat_mA.toFixed(2)} mA.`);
        finalTransistorCurrent = ICsat_mA;
      } else {
        analysisLog.push(`✅ Transistor dalam kondisi AKTIF. Arus kolektor = ${IC_mA.toFixed(2)} mA.`);
        finalTransistorCurrent = IC_mA;
      }
      
      // Allow overriding the main loop current
      transCurrent_mA = finalTransistorCurrent;
    }
  });

  if (transBlocked) {
    analysisLog.push("❌ Rangkaian terblokir oleh transistor yang tidak aktif.");
  }

  return {
    totalVoltageDrop,
    dropDetails,
    effectiveVoltage,
    diodeBlocked,
    transBlocked,
    errorLog,
    errorNodes,
    analysisLog,
    transCurrent_mA
  };
}

module.exports = {
  calculateSemiconductors
};
