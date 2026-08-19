// backend/controllers/analysisController.js

const { validateCircuit } = require('../services/simulation/circuitAnalyzer');
const { getAIInsights } = require('../services/aiService');

exports.evaluateCircuit = async (req, res) => {
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

    console.log(` AI response source: ${source}`);

    // Step 3: Build response matching the required schema
    const response = {
      api_status: "ACTIVE",
      analysis_log: [
        ...validationResult.analysisLog,
      ].filter(Boolean),
      ai_insights: {
        greeting: insights.greeting || "Halo, pelajar rangkaian!",
        explanation: insights.explanation || "Mari analisis rangkaianmu...",
        hint: insights.hint || "Coba sambungkan semua komponen dalam satu loop!",
        suggestion_button_text:
          insights.suggestion_button_text || "Butuh bantuan?",
      },
      error_log: validationResult.errorLog,
      error_nodes: validationResult.errorNodes,
      nodes_state: validationResult.nodes_state,
    };

    res.json(response);
  } catch (error) {
    console.error(" Server error:", error);
    res.status(500).json({
      api_status: "ERROR",
      analysis_log: [],
      ai_insights: null,
      error_log: [`Server error: ${error.message}`],
    });
  }
};
