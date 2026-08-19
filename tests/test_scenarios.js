const { evaluateCircuit } = require('./backend/controllers/analysisController');

async function testScenario(name, nodes, edges) {
  console.log(`\n========== ${name} ==========`);
  
  let responseData;
  const res = {
    json: (data) => { responseData = data; },
    status: () => res
  };

  const req = {
    body: { nodes, edges, lang: 'id' }
  };

  await evaluateCircuit(req, res);
  
  if (responseData) {
    console.log("--- LOG EDUKATIF ---");
    responseData.analysis_log.forEach(l => console.log(l));
    console.log("\n--- AI EXPLANATION ---");
    console.log(responseData.ai_insights?.explanation);
    console.log("\n--- AI HINT ---");
    console.log(responseData.ai_insights?.hint);
  }
}

async function run() {
  await testScenario("1. RC CIRCUIT (Kapasitor Mengisi)", [
    { id: "bat1", type: "battery", data: { voltage: 12 } },
    { id: "res1", type: "resistor", data: { resistance: 1000 } },
    { id: "cap1", type: "capacitor", data: { capacitance: 100 } }
  ], [
    { source: "bat1", sourceHandle: "positive", target: "res1", targetHandle: "left" },
    { source: "res1", sourceHandle: "right", target: "cap1", targetHandle: "a" },
    { source: "cap1", sourceHandle: "b", target: "bat1", targetHandle: "negative" }
  ]);

  await testScenario("2. TRANSISTOR SWITCH", [
    { id: "bat1", type: "battery", data: { voltage: 5 } },
    { id: "resBase", type: "resistor", data: { resistance: 1000 } },
    { id: "trans1", type: "transistor", data: {} },
    { id: "resCol", type: "resistor", data: { resistance: 100 } }
  ], [
    { source: "bat1", sourceHandle: "positive", target: "resBase", targetHandle: "left" },
    { source: "bat1", sourceHandle: "positive", target: "resCol", targetHandle: "left" },
    { source: "resBase", sourceHandle: "right", target: "trans1", targetHandle: "base" },
    { source: "resCol", sourceHandle: "right", target: "trans1", targetHandle: "collector" },
    { source: "trans1", sourceHandle: "emitter", target: "bat1", "targetHandle": "negative" }
  ]);

  await testScenario("3. BAHAYA KORSLETING (SHORT CIRCUIT)", [
    { id: "bat1", type: "battery", data: { voltage: 9 } },
    { id: "led1", type: "led", data: { vf: 2.0 } }
  ], [
    { source: "bat1", sourceHandle: "positive", target: "led1", targetHandle: "anode" },
    { source: "led1", sourceHandle: "cathode", target: "bat1", targetHandle: "negative" }
  ]);
}

run();
