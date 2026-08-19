const { validateCircuit } = require('./backend/services/simulation/circuitAnalyzer');

const nodes = [
  { id: 'battery-1', type: 'battery', data: { componentType: 'battery', voltage: 5 } },
  { id: 'switch-1', type: 'switch', data: { componentType: 'switch', state: 'closed' } },
  { id: 'resistor-1', type: 'resistor', data: { componentType: 'resistor', resistance: 220 } },
  { id: 'led-1', type: 'led', data: { componentType: 'led' } }
];

const edges = [
  { id: 'e1', source: 'battery-1', target: 'switch-1', sourceHandle: 'a', targetHandle: 'a' },
  { id: 'e2', source: 'switch-1', target: 'resistor-1', sourceHandle: 'b', targetHandle: 'a' },
  { id: 'e3', source: 'resistor-1', target: 'led-1', sourceHandle: 'b', targetHandle: 'a' },
  { id: 'e4', source: 'led-1', target: 'battery-1', sourceHandle: 'b', targetHandle: 'b' }
];

// Reconstruct adj list
const adj = {};
nodes.forEach(n => { adj[n.id] = new Set(); });
edges.forEach(e => {
  adj[e.source].add(e.target);
  adj[e.target].add(e.source);
});

const result = validateCircuit(nodes, edges, adj);

console.log("CIRCUIT EVALUATION RESULT:");
console.log("--------------------------");
console.log("Analysis Log:\n", result.analysisLog.join('\n'));
console.log("\nError Log:\n", result.errorLog.join('\n'));
console.log("\nNodes State:\n", JSON.stringify(result.nodes_state, null, 2));
