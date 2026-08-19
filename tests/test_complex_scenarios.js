const { evaluateCircuit } = require('./backend/controllers/analysisController');

async function testScenario(name, nodes, edges) {
  let hasError = false;
  let log = [];
  
  const res = {
    json: (data) => {
      if (data.api_status === 'ERROR') hasError = true;
      if (data.error_log && data.error_log.length > 0) hasError = true;
      log = data.analysis_log;
      if (log.some(l => l.includes('Gagal'))) hasError = true;
    },
    status: () => res
  };

  const req = { body: { nodes, edges, lang: 'id' } };
  
  try {
    await evaluateCircuit(req, res);
    return { name, passed: !hasError, log };
  } catch (err) {
    return { name, passed: false, error: err.message };
  }
}

async function runAllTests() {
  const results = [];

  // 1. Parallel Resistors
  results.push(await testScenario("Parallel Resistors", [
    { id: "bat1", type: "battery", data: { voltage: 12 } },
    { id: "r1", type: "resistor", data: { resistance: 100 } },
    { id: "r2", type: "resistor", data: { resistance: 100 } },
  ], [
    { source: "bat1", sourceHandle: "positive", target: "r1", targetHandle: "a" },
    { source: "bat1", sourceHandle: "positive", target: "r2", targetHandle: "a" },
    { source: "r1", sourceHandle: "b", target: "bat1", targetHandle: "negative" },
    { source: "r2", sourceHandle: "b", target: "bat1", targetHandle: "negative" },
  ]));

  // 2. Diode Bridge (Complex loop)
  results.push(await testScenario("Diode Bridge", [
    { id: "bat1", type: "battery", data: { voltage: 9 } },
    { id: "d1", type: "diode", data: { vf: 0.7 } },
    { id: "d2", type: "diode", data: { vf: 0.7 } },
    { id: "d3", type: "diode", data: { vf: 0.7 } },
    { id: "r1", type: "resistor", data: { resistance: 330 } }
  ], [
    { source: "bat1", sourceHandle: "a", target: "d1", targetHandle: "anode" },
    { source: "bat1", sourceHandle: "a", target: "d2", targetHandle: "cathode" },
    { source: "d1", sourceHandle: "cathode", target: "r1", targetHandle: "a" },
    { source: "r1", sourceHandle: "b", target: "d3", targetHandle: "anode" },
    { source: "d3", sourceHandle: "cathode", target: "bat1", targetHandle: "b" }
  ]));

  // 3. Potentiometer Voltage Divider
  results.push(await testScenario("Potentiometer Divider", [
    { id: "bat1", type: "battery", data: { voltage: 10 } },
    { id: "pot1", type: "potentiometer", data: { resistance: 10000, position: 0.5 } },
    { id: "r1", type: "resistor", data: { resistance: 1000 } }
  ], [
    { source: "bat1", sourceHandle: "a", target: "pot1", targetHandle: "pin1" },
    { source: "pot1", sourceHandle: "pin3", target: "bat1", targetHandle: "b" },
    { source: "pot1", sourceHandle: "wiper", target: "r1", targetHandle: "a" },
    { source: "r1", sourceHandle: "b", target: "bat1", targetHandle: "b" }
  ]));

  // 4. Mixed RLC
  results.push(await testScenario("Mixed RLC Circuit", [
    { id: "bat1", type: "battery", data: { voltage: 5 } },
    { id: "r1", type: "resistor", data: { resistance: 100 } },
    { id: "l1", type: "inductor", data: { inductance: 10 } },
    { id: "c1", type: "capacitor", data: { capacitance: 100 } }
  ], [
    { source: "bat1", sourceHandle: "a", target: "r1", targetHandle: "a" },
    { source: "r1", sourceHandle: "b", target: "l1", targetHandle: "a" },
    { source: "l1", sourceHandle: "b", target: "c1", targetHandle: "a" },
    { source: "c1", sourceHandle: "b", target: "bat1", targetHandle: "b" }
  ]));

  // 5. Motor, Switch and Multimeter
  results.push(await testScenario("Motor Switch Multimeter", [
    { id: "bat1", type: "battery", data: { voltage: 9 } },
    { id: "sw1", type: "switch", data: { state: "closed" } },
    { id: "m1", type: "motor", data: {} },
    { id: "mul1", type: "multimeter", data: { mode: "V" } }
  ], [
    { source: "bat1", sourceHandle: "a", target: "sw1", targetHandle: "a" },
    { source: "sw1", sourceHandle: "b", target: "m1", targetHandle: "pos" },
    { source: "m1", sourceHandle: "neg", target: "bat1", targetHandle: "b" },
    { source: "m1", sourceHandle: "pos", target: "mul1", targetHandle: "probe-red" },
    { source: "m1", sourceHandle: "neg", target: "mul1", targetHandle: "probe-black" }
  ]));

  // 6. Extreme Values (Nano Ohms, Mega Volts)
  results.push(await testScenario("Extreme Values", [
    { id: "bat1", type: "battery", data: { voltage: 1000000 } },
    { id: "r1", type: "resistor", data: { resistance: 0.001 } },
    { id: "led1", type: "led", data: { vf: 2.0 } }
  ], [
    { source: "bat1", sourceHandle: "a", target: "r1", targetHandle: "a" },
    { source: "r1", sourceHandle: "b", target: "led1", targetHandle: "a" },
    { source: "led1", sourceHandle: "b", target: "bat1", targetHandle: "b" }
  ]));

  let allPassed = true;
  results.forEach(r => {
    if (r.passed) {
      console.log(`✅ PASSED: ${r.name}`);
    } else {
      console.log(`❌ FAILED: ${r.name}`);
      console.log(`   Error: ${r.error || r.log.find(l => l.includes('Gagal'))}`);
      allPassed = false;
    }
  });

  if (allPassed) console.log("\n🎉 ALL COMPLEX SCENARIOS PASSED WITH NO ERRORS!");
}

runAllTests();
