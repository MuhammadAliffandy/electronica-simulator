const { calculateACImpedance } = require('./backend/services/simulation/impedanceCalculator');

const nodes = [
  { id: 'b1', type: 'battery', data: { sourceType: 'ac', voltage: 220, frequency: 50 } },
  { id: 'r1', type: 'resistor', data: { resistance: 100 } },
  { id: 'c1', type: 'capacitor', data: { capacitance: 10, capType: 'elco' } }
];
const edges = [];

console.log(calculateACImpedance(nodes, edges, 50, 100));
