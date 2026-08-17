function getResistanceBetweenNodes(startNodeId, targetNodeId, nodes, adj) {
  const queue = [[startNodeId, 0]];
  const visited = new Set([startNodeId]);
  
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
  return 0; // Infinity or 0 if open loop
}

function calculateMultimeterReadings(multimeters, battery, totalHambatanUniversal, hasLoop, burnoutRisk, hasOpenPins, nodes_state, nodes, edges, adj) {
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
      } else if (mmMode === "Ohm" || mmMode === "Ω") {
         reading = totalHambatanUniversal.toFixed(1);
         unit = "Ω";
      }
    } else if (mmMode === "Ohm" || mmMode === "Ω") {
      unit = "Ω";
      // Coba lacak hambatan spesifik antar dua probe multimeter
      const conns = adj[mm.id] || [];
      const redPin = conns.find(c => c.fromPin === 'probe-red' || c.toPin === 'probe-red' || c.fromPin === 'red' || c.toPin === 'red')?.node;
      const blackPin = conns.find(c => c.fromPin === 'probe-black' || c.toPin === 'probe-black' || c.fromPin === 'black' || c.toPin === 'black')?.node;
      
      if (redPin && blackPin) {
        const measuredR = getResistanceBetweenNodes(redPin, blackPin, nodes, adj);
        if (measuredR > 0) {
          reading = measuredR.toFixed(1);
        } else {
          reading = totalHambatanUniversal.toFixed(1);
        }
      } else {
        reading = "0.00";
      }
    }
    
    nodes_state[mm.id] = { reading, unit };
  });
}

module.exports = {
  calculateMultimeterReadings
};
