// ============================================
// AI Electronics Simulator - Backend Server
// Express + OpenAI + Ollama AI Tutor Agent
// MVC Architecture
// ============================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const apiRoutes = require('./routes/apiRoutes');
const { detectAIMode } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.use('/api', apiRoutes);

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
  const aiMode = await detectAIMode();
  console.log(`\n⚡ ====================================`);
  console.log(`   AI Electronics Simulator - Backend`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   AI Mode: ${aiMode}`);
  console.log(`⚡ ====================================\n`);
});
