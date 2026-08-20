const math = require('mathjs');

class MNAEngine {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.pinToElectricalNode = {};
    this.electricalNodes = []; // Array of sets of pins
    this.nodeCount = 0; // Number of electrical nodes (including ground/reference)
    this.voltageSources = [];
    
    // MNA Matrices
    // G: Conductance matrix (N x N)
    // B: Voltage source incidence matrix (N x M)
    // C: Transpose of B (M x N) - for ideal sources
    // D: Voltage source internal resistance/dependent sources (M x M), usually 0
    // A = [G B; C D]
    // z = [i; e] (known currents and voltages)
    // x = [v; j] (unknown node voltages and voltage source currents)
    this.G = [];
    this.B = [];
    this.C = [];
    this.D = [];
    this.z = [];
    
    // States for piecewise components
    this.compStates = {}; 
  }

  buildElectricalNodes(nodes, edges) {
    this.nodes = nodes;
    this.edges = edges;
    
    // Union-Find or BFS to group connected pins
    const pinAdj = {};
    
    // Add all explicit edges
    edges.forEach(e => {
      const p1 = `${e.source}:${e.sourceHandle || 'a'}`;
      const p2 = `${e.target}:${e.targetHandle || 'b'}`;
      if (!pinAdj[p1]) pinAdj[p1] = [];
      if (!pinAdj[p2]) pinAdj[p2] = [];
      pinAdj[p1].push(p2);
      pinAdj[p2].push(p1);
    });
    
    // Also add internal component ideal shorts (e.g. Switch CLOSED, Wire Junctions)
    nodes.forEach(n => {
      if (n.type === 'junction' || n.data?.componentType === 'junction') {
        const pins = edges.filter(e => e.source === n.id).map(e => `${n.id}:${e.sourceHandle || 'a'}`)
            .concat(edges.filter(e => e.target === n.id).map(e => `${n.id}:${e.targetHandle || 'b'}`));
        
        for (let i = 0; i < pins.length - 1; i++) {
          if (!pinAdj[pins[i]]) pinAdj[pins[i]] = [];
          if (!pinAdj[pins[i+1]]) pinAdj[pins[i+1]] = [];
          pinAdj[pins[i]].push(pins[i+1]);
          pinAdj[pins[i+1]].push(pins[i]);
        }
      }
    });

    const visited = new Set();
    this.electricalNodes = [];
    
    // All unique pins
    const allPins = Object.keys(pinAdj);
    
    allPins.forEach(pin => {
      if (!visited.has(pin)) {
        const cluster = new Set();
        const queue = [pin];
        visited.add(pin);
        
        while (queue.length > 0) {
          const curr = queue.shift();
          cluster.add(curr);
          (pinAdj[curr] || []).forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }
        this.electricalNodes.push(cluster);
      }
    });

    // Map each pin to its electrical node index
    this.electricalNodes.forEach((cluster, idx) => {
      cluster.forEach(pin => {
        this.pinToElectricalNode[pin] = idx;
      });
    });
    
    this.nodeCount = this.electricalNodes.length;
    
    // Assign nodes for all component pins to avoid dynamic allocation after matrix init
    this.nodes.forEach(n => {
      const type = n.type || n.data?.componentType;
      // Common pins
      this.getElectricalNode(n.id, 'a');
      this.getElectricalNode(n.id, 'b');
      
      if (type === 'potentiometer') {
        this.getElectricalNode(n.id, 'w');
      }
      if (type === 'transistor') {
        this.getElectricalNode(n.id, 'c');
        this.getElectricalNode(n.id, 'e');
      }
    });

    // Select Reference Node (Ground)
    // Find a battery negative terminal
    let refPin = null;
    const battery = nodes.find(n => n.type === 'battery' || n.data?.componentType === 'battery');
    if (battery) {
      refPin = `${battery.id}:b`; // Assuming 'b' or 'negative'
    } else {
      refPin = allPins[0];
    }
    
    if (refPin && this.pinToElectricalNode[refPin] !== undefined) {
      this.refNodeIndex = this.pinToElectricalNode[refPin];
    } else {
      this.refNodeIndex = 0;
    }
  }

  getElectricalNode(componentId, handleId) {
    const pin = `${componentId}:${handleId || 'a'}`;
    if (this.pinToElectricalNode[pin] !== undefined) {
      return this.pinToElectricalNode[pin];
    }
    // If floating, create a new isolated node
    const newIdx = this.nodeCount++;
    this.pinToElectricalNode[pin] = newIdx;
    return newIdx;
  }

  // MNA Size: (N-1) + M
  // N = nodeCount (including reference)
  // M = number of voltage sources
  initMatrices() {
    this.N_vars = this.nodeCount > 0 ? this.nodeCount - 1 : 0; // excluding ground
    this.M_vars = 0;
    this.voltageSources = [];
    
    // First pass to count voltage sources
    this.nodes.forEach(n => {
      if (n.type === 'battery' || n.data?.componentType === 'battery') {
        this.M_vars++;
      }
      if (n.type === 'multimeter' || n.data?.componentType === 'multimeter') {
        const mode = n.data?.mode ?? "V";
        if (mode === "A") {
          this.M_vars++;
        }
      }
      if (n.type === 'diode' || n.data?.componentType === 'diode' || 
          n.type === 'led' || n.data?.componentType === 'led') {
        this.M_vars++; // For Vf voltage source when ON
      }
      if (n.type === 'transistor' || n.data?.componentType === 'transistor') {
        this.M_vars += 2; // For Vbe and Vce voltage sources when SATURATION
      }
    });

    const size = this.N_vars + this.M_vars;
    if (size > 0) {
      this.A = math.zeros(size, size).toArray();
      this.z = math.zeros(size, 1).toArray();
    } else {
      this.A = [];
      this.z = [];
    }
  }

  // Returns matrix index for a given electrical node (0-based)
  // Reference node returns -1
  mapNode(eNodeIdx) {
    if (eNodeIdx === this.refNodeIndex) return -1;
    return eNodeIdx > this.refNodeIndex ? eNodeIdx - 1 : eNodeIdx;
  }

  stampResistor(node1, node2, R) {
    if (R <= 0) R = 1e-6; // Prevent div by zero
    const g = 1.0 / R;
    const n1 = this.mapNode(node1);
    const n2 = this.mapNode(node2);
    
    if (n1 >= 0) {
      this.A[n1][n1] += g;
    }
    if (n2 >= 0) {
      this.A[n2][n2] += g;
    }
    if (n1 >= 0 && n2 >= 0) {
      this.A[n1][n2] -= g;
      this.A[n2][n1] -= g;
    }
  }

  stampVoltageSource(nodePos, nodeNeg, voltage, vIdx) {
    const np = this.mapNode(nodePos);
    const nn = this.mapNode(nodeNeg);
    const mRow = this.N_vars + vIdx;
    
    // B and C matrices
    if (np >= 0) {
      this.A[np][mRow] += 1;
      this.A[mRow][np] += 1;
    }
    if (nn >= 0) {
      this.A[nn][mRow] -= 1;
      this.A[mRow][nn] -= 1;
    }
    
    // z vector
    this.z[mRow][0] = voltage;
  }

  stampCurrentSource(nodePos, nodeNeg, current) {
    const np = this.mapNode(nodePos);
    const nn = this.mapNode(nodeNeg);
    if (np >= 0) this.z[np][0] -= current;
    if (nn >= 0) this.z[nn][0] += current;
  }

  buildSystem() {
    this.initMatrices();
    if (this.N_vars + this.M_vars === 0) return;
    
    let vSourceIdx = 0;

    this.nodes.forEach(n => {
      const type = n.type || n.data?.componentType;
      
      if (type === 'resistor') {
        const R = n.data?.resistance ?? 1000;
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        this.stampResistor(n1, n2, R);
      }
      
      else if (type === 'battery') {
        const V = n.data?.voltage ?? 9;
        const np = this.getElectricalNode(n.id, 'a'); // +
        const nn = this.getElectricalNode(n.id, 'b'); // -
        this.compStates[`${n.id}_vIdx`] = vSourceIdx;
        this.stampVoltageSource(np, nn, V, vSourceIdx++);
      }
      
      else if (type === 'switch') {
        const state = n.data?.state ?? "open";
        const R = state === "closed" ? 1e-6 : 1e9; // 1 microOhm vs 1 GigaOhm
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        this.stampResistor(n1, n2, R);
      }
      
      else if (type === 'motor' || type === 'buzzer') {
        const R = 50; // simple 50 ohm internal resistance model
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        this.stampResistor(n1, n2, R);
      }
      
      else if (type === 'potentiometer') {
        const Rtotal = n.data?.resistance ?? 10000;
        const pos = Math.max(0, Math.min(1, n.data?.position ?? 0.5));
        const R1 = Math.max(1e-6, (1 - pos) * Rtotal);
        const R2 = Math.max(1e-6, pos * Rtotal);
        
        const na = this.getElectricalNode(n.id, 'a');
        const nw = this.getElectricalNode(n.id, 'w');
        const nb = this.getElectricalNode(n.id, 'b');
        
        this.stampResistor(na, nw, R1);
        this.stampResistor(nw, nb, R2);
      }
      
      else if (type === 'multimeter') {
        const mode = n.data?.mode ?? "V";
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        if (mode === "V") {
          this.stampResistor(n1, n2, 1e9); // 1 GigaOhm
        } else if (mode === "A") {
          this.compStates[`${n.id}_vIdx`] = vSourceIdx;
          this.stampVoltageSource(n1, n2, 0, vSourceIdx++);
        } else if (mode === "Ohm") {
          this.stampCurrentSource(n1, n2, 1e-3);
          this.stampResistor(n1, n2, 1e9);
        }
      }
      
      else if (type === 'capacitor') {
        // DC Steady state: Open Circuit
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        this.stampResistor(n1, n2, 1e9);
      }
      
      else if (type === 'inductor') {
        // DC Steady state: Short Circuit
        const n1 = this.getElectricalNode(n.id, 'a');
        const n2 = this.getElectricalNode(n.id, 'b');
        this.stampResistor(n1, n2, 1e-6);
      }
      
      else if (type === 'diode' || type === 'led') {
        const state = this.compStates[n.id] || 'OFF';
        const Vf = type === 'led' ? (n.data?.vf ?? 2.0) : (n.data?.vf ?? 0.7);
        const na = this.getElectricalNode(n.id, 'a'); // Anode
        const nk = this.getElectricalNode(n.id, 'b'); // Cathode
        
        if (state === 'ON') {
          this.stampVoltageSource(na, nk, Vf, vSourceIdx++);
          this.stampResistor(na, nk, 1e-6); // Small internal resistance
        } else {
          // Dummy source to satisfy matrix size without shorting circuit
          const mRow = this.N_vars + vSourceIdx++;
          this.A[mRow][mRow] = 1;
          this.stampResistor(na, nk, 1e9); // Open circuit
        }
      }
      
      else if (type === 'transistor') {
        const state = this.compStates[n.id] || 'OFF';
        const hFE = n.data?.hfe ?? 100;
        const Vbe = 0.7;
        const Vce_sat = 0.2;
        
        const nb = this.getElectricalNode(n.id, 'b'); // Base
        const nc = this.getElectricalNode(n.id, 'c'); // Collector
        const ne = this.getElectricalNode(n.id, 'e'); // Emitter
        
        // Base-Emitter Diode (Vbe)
        if (state === 'OFF') {
          let mRow = this.N_vars + vSourceIdx++;
          this.A[mRow][mRow] = 1;
          this.stampResistor(nb, ne, 1e9);
          
          mRow = this.N_vars + vSourceIdx++;
          this.A[mRow][mRow] = 1;
          this.stampResistor(nc, ne, 1e9);
        } else if (state === 'ACTIVE') {
          // BE is ON (Vbe drop)
          this.stampVoltageSource(nb, ne, Vbe, vSourceIdx++);
          this.stampResistor(nb, ne, 1e-6);
          // CE is a dependent current source: IC = hFE * IB
          // We will model this iteratively by reading IB from previous iteration
          const IB = this.compStates[`${n.id}_IB`] || 0;
          const IC = hFE * IB;
          this.stampCurrentSource(nc, ne, IC);
          
          let mRow = this.N_vars + vSourceIdx++;
          this.A[mRow][mRow] = 1; // Dummy Vce
          this.stampResistor(nc, ne, 1e9); // High impedance CE
        } else if (state === 'SATURATION') {
          // BE is ON
          this.stampVoltageSource(nb, ne, Vbe, vSourceIdx++);
          this.stampResistor(nb, ne, 1e-6);
          // CE is ON (Vce_sat drop)
          this.stampVoltageSource(nc, ne, Vce_sat, vSourceIdx++);
          this.stampResistor(nc, ne, 1e-6);
        }
      }
    });
    
    // Add small conductance to all nodes to prevent singular matrix (floating nodes)
    for (let i = 0; i < this.N_vars; i++) {
      this.A[i][i] += 1e-12;
    }
  }

  solveLinear() {
    try {
      if (this.N_vars + this.M_vars === 0) return { success: false, message: "No system" };
      
      const A_matrix = math.matrix(this.A);
      const z_matrix = math.matrix(this.z);
      
      const x_matrix = math.lusolve(A_matrix, z_matrix);
      const x = x_matrix.toArray().map(r => r[0]);
      
      return { success: true, x };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  solve() {
    // Piecewise Iterative Solver
    let converged = false;
    let iter = 0;
    const MAX_ITER = 15;
    let lastResult = null;

    // Initialize all states to OFF initially
    this.nodes.forEach(n => {
       const type = n.type || n.data?.componentType;
       if (type === 'diode' || type === 'led' || type === 'transistor') {
         if (!this.compStates[n.id]) this.compStates[n.id] = 'OFF';
       }
    });

    while (!converged && iter < MAX_ITER) {
      this.buildSystem();
      lastResult = this.solveLinear();
      
      if (!lastResult.success) break;
      const x = lastResult.x;
      let stateChanged = false;

      // Check non-linear components to update states for next iteration
      this.nodes.forEach(n => {
        const type = n.type || n.data?.componentType;
        if (type === 'diode' || type === 'led') {
          const Vf = type === 'led' ? (n.data?.vf ?? 2.0) : (n.data?.vf ?? 0.7);
          const na = this.getElectricalNode(n.id, 'a');
          const nk = this.getElectricalNode(n.id, 'b');
          const Va = this.getNodeVoltage(na, x);
          const Vk = this.getNodeVoltage(nk, x);
          const V_AK = Va - Vk;
          
          const currentState = this.compStates[n.id];
          if (currentState === 'OFF' && V_AK > Vf) {
            this.compStates[n.id] = 'ON';
            stateChanged = true;
          } else if (currentState === 'ON' && V_AK < Vf) {
            this.compStates[n.id] = 'OFF';
            stateChanged = true;
          }
        }
        else if (type === 'transistor') {
          const Vbe_f = 0.7;
          const nb = this.getElectricalNode(n.id, 'b');
          const nc = this.getElectricalNode(n.id, 'c');
          const ne = this.getElectricalNode(n.id, 'e');
          const Vb = this.getNodeVoltage(nb, x);
          const Vc = this.getNodeVoltage(nc, x);
          const Ve = this.getNodeVoltage(ne, x);
          
          const Vbe = Vb - Ve;
          const Vce = Vc - Ve;
          const currentState = this.compStates[n.id];
          
          // Simple heuristic logic for states
          let nextState = 'OFF';
          if (Vbe > Vbe_f - 0.1) {
            // It could be active or saturation
            // We need to estimate IB. If we were in OFF, let's assume ACTIVE first
            if (currentState === 'OFF') {
               nextState = 'ACTIVE';
               this.compStates[`${n.id}_IB`] = Math.max(0, (Vbe - Vbe_f) / 100); // Guess
            } else {
               // We can calculate actual IB from the voltages
               // Wait, a better way is to read the current from the Vbe voltage source!
               // Since we don't easily track the index of Vbe source without an array, 
               // let's estimate IB from the external resistors connected to Base.
               // Actually, for educational model, we can just say Vb > Ve + 0.7 => ON.
               // If Vce < 0.2 in ACTIVE, then it should be SATURATION.
               if (currentState === 'ACTIVE') {
                  if (Vce < 0.2) nextState = 'SATURATION';
                  else nextState = 'ACTIVE';
                  // Calculate IB roughly for next iteration
                  this.compStates[`${n.id}_IB`] = Math.max(0, (Vb - Ve) * 1e-4); 
               } else if (currentState === 'SATURATION') {
                  if (Vce > 0.2) nextState = 'ACTIVE';
                  else nextState = 'SATURATION';
               }
            }
          }
          
          if (currentState !== nextState) {
             this.compStates[n.id] = nextState;
             stateChanged = true;
          }
        }
      });

      if (!stateChanged) converged = true;
      iter++;
    }

    if (lastResult && lastResult.success) {
       lastResult.compStates = this.compStates;
       lastResult.iterations = iter;
    }
    return lastResult;
  }

  getNodeVoltage(eNodeIdx, x) {
    const idx = this.mapNode(eNodeIdx);
    if (idx === -1) return 0; // Reference node
    return x[idx];
  }
}

module.exports = MNAEngine;
