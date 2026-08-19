// backend/controllers/analysisController.js

const { validateCircuit } = require('../services/simulation/circuitAnalyzer');
const { getAIInsights } = require('../services/aiService');

/**
 * Normalize frontend handle IDs to the canonical 'a' / 'b' (and 'w','c','e','base') 
 * that the MNA engine expects.
 *
 * Frontend uses named handles like 'left','right','positive','negative',
 * 'anode','cathode','probe-red','probe-black','pin1','pin3','wiper',
 * 'base','collector','emitter','pos','neg','ch1','gnd', etc.
 *
 * Convention for MNA:
 *   a = first / positive / input pin
 *   b = second / negative / output pin
 *   w = wiper (potentiometer)
 *   c = collector (transistor)
 *   e = emitter (transistor)
 *   b_pin = base (transistor)  → stored as 'b', collector as 'c', emitter as 'e'
 */
function normalizeHandle(handle, nodeType) {
  if (!handle) return 'a';

  const h = handle.toLowerCase();

  // Transistor pins
  if (nodeType === 'transistor') {
    if (h === 'base')      return 'b';
    if (h === 'collector') return 'c';
    if (h === 'emitter')   return 'e';
  }

  // Potentiometer pins
  if (nodeType === 'potentiometer') {
    if (h === 'pin1')  return 'a';
    if (h === 'pin3')  return 'b';
    if (h === 'wiper') return 'w';
  }

  // Diode pins
  if (nodeType === 'diode' || nodeType === 'led') {
    if (h === 'anode'   || h === 'a') return 'a';
    if (h === 'cathode' || h === 'b') return 'b';
  }

  // Multimeter probes
  if (nodeType === 'multimeter') {
    if (h === 'probe-red'   || h === 'a') return 'a';
    if (h === 'probe-black' || h === 'b') return 'b';
  }

  // Oscilloscope
  if (nodeType === 'oscilloscope') {
    if (h === 'ch1') return 'a';
    if (h === 'gnd') return 'b';
  }

  // Motor
  if (nodeType === 'motor') {
    if (h === 'pos') return 'a';
    if (h === 'neg') return 'b';
  }

  // Generic left/right → a/b (used by battery, resistor, capacitor, inductor, switch, buzzer)
  if (h === 'left'     || h === 'positive' || h === 'a' || h === 'a-pin') return 'a';
  if (h === 'right'    || h === 'negative' || h === 'b' || h === 'b-pin') return 'b';

  // Fallback: return as-is (already canonical or unknown)
  return handle;
}

/**
 * Resolve node type from a node object (handles both ReactFlow 'type' field
 * and data.componentType field).
 */
function resolveType(node) {
  return (node.type || node.data?.componentType || '').toLowerCase();
}

/**
 * Normalize all edges so sourceHandle/targetHandle use MNA canonical pin names.
 */
function normalizeEdges(nodes, edges) {
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  return edges.map(e => {
    const srcNode = nodeMap[e.source];
    const tgtNode = nodeMap[e.target];
    return {
      ...e,
      sourceHandle: normalizeHandle(e.sourceHandle, srcNode ? resolveType(srcNode) : ''),
      targetHandle: normalizeHandle(e.targetHandle, tgtNode ? resolveType(tgtNode) : ''),
    };
  });
}

exports.evaluateCircuit = async (req, res) => {
  try {
    const { nodes, edges, lang = 'en' } = req.body;

    // Input validation
    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        api_status: 'ERROR',
        analysis_log: [],
        ai_insights: null,
        error_log: ["Invalid request: 'nodes' must be an array."],
      });
    }
    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({
        api_status: 'ERROR',
        analysis_log: [],
        ai_insights: null,
        error_log: ["Invalid request: 'edges' must be an array."],
      });
    }

    console.log(`\n📡 Received evaluation request: ${nodes.length} nodes, ${edges.length} edges`);

    // Normalize handle IDs before passing to the physics engine
    const normalizedEdges = normalizeEdges(nodes, edges);

    // Step 1: Deterministic circuit validation
    const validationResult = validateCircuit(nodes, normalizedEdges);

    // Step 2: AI Tutor analysis (OpenAI → Ollama → Mock)
    const { source, insights } = await getAIInsights(validationResult, lang);
    console.log(` AI response source: ${source}`);

    // Step 3: Build response
    const response = {
      api_status: 'ACTIVE',
      analysis_log: [...validationResult.analysisLog].filter(Boolean),
      ai_insights: {
        greeting:              insights.greeting              || 'Halo, pelajar rangkaian!',
        explanation:           insights.explanation           || 'Mari analisis rangkaianmu...',
        hint:                  insights.hint                  || 'Coba sambungkan semua komponen dalam satu loop!',
        suggestion_button_text: insights.suggestion_button_text || 'Butuh bantuan?',
      },
      error_log:   validationResult.errorLog,
      error_nodes: validationResult.errorNodes,
      nodes_state: validationResult.nodes_state,
    };

    res.json(response);
  } catch (error) {
    console.error(' Server error:', error);
    res.status(500).json({
      api_status: 'ERROR',
      analysis_log: [],
      ai_insights: null,
      error_log: [`Server error: ${error.message}`],
    });
  }
};
