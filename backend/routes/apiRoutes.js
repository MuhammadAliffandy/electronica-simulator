// backend/routes/apiRoutes.js

const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const chatController = require('../controllers/chatController');
const { detectAIMode } = require('../services/aiService');

// Health check
router.get("/health", async (req, res) => {
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
router.post("/evaluate-circuit", analysisController.evaluateCircuit);

// Chat endpoint
router.post("/chat", chatController.handleChat);

module.exports = router;
