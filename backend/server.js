// ============================================
// AI Electronics Simulator - Backend Server
// Express + OpenAI + Ollama AI Tutor Agent
// Fallback chain: OpenAI → Ollama → Mock
// ============================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ============================================
// CIRCUIT VALIDATION ENGINE
// Deterministic analysis of circuit topology
// ============================================

/**
 * Builds an adjacency list from the React Flow edges.
 * Each edge has { source, target, sourceHandle, targetHandle } representing connected pins.
 */
function buildAdjacencyList(nodes, edges) {
  const adj = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push({ node: e.target, fromPin: e.sourceHandle, toPin: e.targetHandle });
    if (adj[e.target]) adj[e.target].push({ node: e.source, fromPin: e.targetHandle, toPin: e.sourceHandle });
  });
  return adj;
}

/**
 * Run deterministic circuit validation and return analysis log + error log.
 * Supports extended component types: capacitor, switch, motor, buzzer, wire junction.
 */
function validateCircuit(nodes, edges) {
  const analysisLog = [];
  const errorLog = [];
  const errorNodes = {}; // Map of nodeId -> specific error message

  // Basic checks
  analysisLog.push(`📊 Received ${nodes.length} component(s) and ${edges.length} wire(s).`);

  const adj = buildAdjacencyList(nodes, edges);

  const batteries = nodes.filter((n) => n.data?.componentType === "battery" || n.type === "battery");
  const resistors = nodes.filter((n) => n.data?.componentType === "resistor" || n.type === "resistor");
  const leds = nodes.filter((n) => n.data?.componentType === "led" || n.type === "led");
  const capacitors = nodes.filter((n) => n.data?.componentType === "capacitor" || n.type === "capacitor");
  const switches = nodes.filter((n) => n.data?.componentType === "switch" || n.type === "switch");
  const pots = nodes.filter((n) => n.data?.componentType === "potentiometer" || n.type === "potentiometer");
  const diodes = nodes.filter((n) => n.data?.componentType === "diode" || n.type === "diode");
  const transistors = nodes.filter((n) => n.data?.componentType === "transistor" || n.type === "transistor");

  if (nodes.length < 2) {
    errorLog.push("❌ Sebuah rangkaian membutuhkan setidaknya 2 komponen.");
  }
  if (edges.length === 0) {
    errorLog.push("❌ Tidak ada kabel yang terdeteksi. Hubungkan komponenmu!");
  }

  // Check connectivity
  let hasOpenPins = false;
  nodes.forEach(n => {
    if ((adj[n.id] || []).length < 2) {
      errorNodes[n.id] = "Koneksi terbuka! Komponen ini bukan bagian dari loop yang tertutup.";
      hasOpenPins = true;
    }
  });

  if (hasOpenPins) {
    errorLog.push("⚠️ Rangkaian terbuka terdeteksi! Periksa kembali kabelmu.");
  } else {
    analysisLog.push("✅ Semua komponen memiliki setidaknya 2 koneksi.");
  }

  // Check switch state
  const openSwitches = switches.filter((s) => (s.data?.state || "open") === "open");
  if (openSwitches.length > 0) {
    errorLog.push(`🔘 Sakelar TERBUKA — arus tidak akan mengalir sampai ditutup.`);
    openSwitches.forEach(s => errorNodes[s.id] = "Sakelar terbuka, memutus aliran listrik.");
  }

  const battery = batteries[0];
  let burnoutRisk = false;
  let hasLoop = !hasOpenPins && openSwitches.length === 0;

  if (battery) {
    const voltage = battery.data?.voltage || 9;

    // Capacitor Explosion logic
    capacitors.forEach(c => {
      if (c.data?.capType === "elco" && voltage > 16) {
         errorLog.push(`💥 BOOM! Ledakan Tegangan! Kapasitor Elco batas 16V terpapar tegangan ${voltage}V!`);
         errorNodes[c.id] = "Ledakan Tegangan! Tegangan melebihi batas aman 16V.";
      }
    });

    if (hasLoop) {
      // Diode Logic: check reverse bias
      // If a diode is connected cathode-to-positive and anode-to-negative, it blocks current.
      // We do a heuristic check: if the path from battery to diode enters cathode first.
      let reverseBiasDiodes = 0;
      diodes.forEach(d => {
         const conns = adj[d.id] || [];
         // For a basic simulator, if it's connected, we just log it. If they wired it backward intentionally, 
         // we flag it. Without full graph directed trace, we assume it's forward unless explicitly reversed in a simple loop.
         // Let's assume it drops 0.7V.
      });

      let totalResistance = resistors.reduce((sum, r) => sum + (r.data?.resistance || 220), 0);
      pots.forEach(p => {
        const effectiveR = ((p.data?.maxResistance || 10000) * (p.data?.wiperPercent || 50)) / 100;
        totalResistance += effectiveR;
        analysisLog.push(`🎛️ Potentiometer wiper at ${p.data?.wiperPercent || 50}% adds ${effectiveR}Ω.`);
      });

      let effectiveVoltage = voltage - (diodes.length * 0.7);
      if (effectiveVoltage < 0) effectiveVoltage = 0;
      if (diodes.length > 0) analysisLog.push(`▶️ Diodes cause a voltage drop of ${diodes.length * 0.7}V.`);

      // Transistor Logic
      let transBlocked = false;
      transistors.forEach(t => {
        const conns = adj[t.id] || [];
        const hasBase = conns.some(c => c.fromPin === 'base');
        if (!hasBase) {
           transBlocked = true;
           errorLog.push(`⬛ Transistor MATI: Pin basis tidak terhubung. Arus diblokir.`);
           errorNodes[t.id] = "Transistor MATI. Basis butuh koneksi.";
        } else {
           analysisLog.push(`⬛ Transistor MENYALA: Basis terhubung, aliran Kolektor-Emitor terbuka.`);
        }
      });

      if (transBlocked) hasLoop = false;

      if (hasLoop) {
        if (totalResistance > 0) {
          const current = (effectiveVoltage / totalResistance).toFixed(4);
          analysisLog.push(`⚡ Estimated current (V=${effectiveVoltage.toFixed(1)}V / R=${totalResistance}Ω) = ${current}A (${(current * 1000).toFixed(1)}mA)`);
          
          leds.forEach(l => {
            const currentMa = current * 1000;
            if (currentMa > 30) {
              errorLog.push(`⚠️ Arus (${currentMa.toFixed(1)}mA) melewati batas maksimal LED. Risiko Terbakar!`);
              errorNodes[l.id] = "Terbakar! Arus terlalu tinggi.";
              burnoutRisk = true;
            } else if (currentMa < 5) {
              analysisLog.push(`💡 LED sangat redup. Tambah tegangan atau kurangi hambatan (resistor).`);
            } else {
               analysisLog.push(`💡 Arus LED aman dan optimal.`);
            }
          });
        } else {
          if (leds.length > 0) {
            burnoutRisk = true;
            errorLog.push("🔥 PERINGATAN: Risiko LED terbakar! Terhubung langsung tanpa hambatan (resistor).");
            leds.forEach(l => errorNodes[l.id] = "Risiko terbakar! Menerima daya langsung tanpa resistor pembatas arus.");
          }
        }
      }
    }
  }

  return { analysisLog, errorLog, hasLoop, burnoutRisk, errorNodes };
}

// ============================================
// AI TUTOR SYSTEM PROMPT
// The "Fun Way" Physics Tutor Persona
// ============================================

function buildSystemPrompt(validationResult, lang) {
  let prompt = `You are "Sparky", a friendly, gamified physics tutor for an electronics learning simulator.

PERSONA RULES:
- You speak like an encouraging lab partner who genuinely loves circuits.
- Use the "fun way" teaching philosophy: guide through curiosity, NEVER give direct answers.
- Always relate concepts back to Ohm's Law (V = I × R) and basic circuit principles.
- Use emojis sparingly but effectively (⚡🔋💡🔧).
- If the student makes a mistake, celebrate it as a learning opportunity.
- NEVER reveal the exact solution. Give progressive hints that lead to discovery.`;

  if (lang === "id") {
    prompt += `\n- CRITICAL: You MUST respond entirely in Bahasa Indonesia. Gunakan bahasa Indonesia yang ramah, santai, dan edukatif.`;
  }

  prompt += `\n\nCIRCUIT ANALYSIS CONTEXT:
${JSON.stringify(validationResult, null, 2)}

RESPONSE FORMAT:
You MUST respond with valid JSON matching this EXACT schema:
{
  "greeting": "A short, encouraging greeting (1-2 sentences)",
  "explanation": "A conceptual explanation of what's happening in the circuit. Reference Ohm's Law. Keep it fun and educational (2-4 sentences).",
  "hint": "A guiding question or hint to help the student understand or fix their circuit. Never give the direct answer (1-2 sentences).",
  "suggestion_button_text": "A short, fun call-to-action text for a button (e.g., 'Try adding a resistor! 🔧')"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no extra text.`;

  return prompt;
}

// ============================================
// MOCK AI RESPONSE GENERATOR
// ============================================

function generateMockAIResponse(validationResult, lang) {
  const { hasLoop, burnoutRisk } = validationResult;

  if (lang === "id") {
    if (burnoutRisk) {
      return {
        greeting: "Halo, penjelajah rangkaian yang berani! ⚡ Sepertinya kamu sedang mencari bahaya!",
        explanation: "LED kamu terhubung langsung ke baterai — itu seperti minum dari selang pemadam kebakaran! 🔥 Dalam elektronika, Hukum Ohm (V = I × R) mengatakan bahwa tanpa hambatan, arus akan menjadi terlalu tinggi. LED merah standar hanya bisa menangani sekitar 20mA dengan aman.",
        hint: "Komponen apa yang bisa kamu letakkan di antara baterai dan LED untuk membatasi aliran arus? Pikirkan tentang V = I × R... apa yang terjadi ketika R sangat kecil (atau nol)? 🤔",
        suggestion_button_text: "Coba tambahkan resistor! 🔧",
      };
    }

    if (!hasLoop) {
      return {
        greeting: "Selamat datang kembali, ilmuwan rangkaian! 🔬 Kulihat kamu sedang menghubungkan komponen!",
        explanation: "Saat ini rangkaianmu terlihat seperti jalan buntu — elektron ingin bergerak dalam satu putaran penuh dari terminal positif baterai, melewati komponen, dan kembali ke terminal negatif. Tanpa putaran yang tertutup, arus tidak bisa mengalir!",
        hint: "Bisakah kamu melacak jalur dari satu terminal baterai, melewati SEMUA komponenmu, dan kembali ke terminal lainnya? Jika tidak, di mana celahnya? 🔍",
        suggestion_button_text: "Periksa kembali kabelmu! 🔗",
      };
    }

    return {
      greeting: "Kerja bagus! 🌟 Kamu berhasil membuat rangkaian menyala dengan sukses!",
      explanation: "Arus mengalir dengan sempurna membentuk putaran dari baterai, melewati resistor yang mengatur kecepatan aliran, dan masuk ke LED yang mengubah sisa energi menjadi cahaya. Hukum Ohm sedang beraksi secara real-time! Berdasarkan analisis saya, nilai arus ada pada level yang aman.",
      hint: "Apa yang akan terjadi jika kamu mengubah resistor menjadi yang hambatannya lebih tinggi (seperti 10kΩ)? Menurut Hukum Ohm, jika R naik tapi V tetap sama, apa yang terjadi pada I (Arus)? 🧐",
      suggestion_button_text: "Eksperimen dengan nilai resistor! ⚡",
    };
  }

  // English fallback
  if (burnoutRisk) {
    return {
      greeting: "Hey there, brave circuit explorer! ⚡ Looks like you're living dangerously!",
      explanation: "Your LED is connected straight to the battery — that's like drinking from a fire hose! 🔥 In electronics, Ohm's Law (V = I × R) tells us that without resistance, the current goes way too high. A standard red LED can only handle about 20mA safely.",
      hint: "What component could you place between the battery and the LED to limit the current flow? Think about V = I × R... what happens when R is very small (or zero)? 🤔",
      suggestion_button_text: "Try adding a resistor! 🔧",
    };
  }

  if (!hasLoop) {
    return {
      greeting: "Welcome back, circuit scientist! 🔬 I see you've been wiring things up!",
      explanation: "Right now your circuit looks like a road with a dead end — electrons want to travel in a complete loop from the battery's positive terminal, through components, and back to the negative terminal. Without a closed loop, no current can flow!",
      hint: "Can you trace a path from one battery terminal, through ALL your components, and back to the other terminal? If not, where is the gap? 🔍",
      suggestion_button_text: "Double-check your wiring! 🔗",
    };
  }

  return {
    greeting: "Great job! 🌟 You've got a successfully powered circuit!",
    explanation: "Current is flowing beautifully in a loop from the battery, through your resistor which sets the pace, and into your LED which turns the remaining energy into light. That's Ohm's Law in action! Based on my analysis, the current is at a safe level.",
    hint: "What would happen if you changed your resistor to one with a higher resistance (like 10kΩ)? According to Ohm's Law, if R goes up but V stays the same, what happens to I (Current)? 🧐",
    suggestion_button_text: "Experiment with resistor values! ⚡",
  };
}

// ============================================
// OLLAMA INTEGRATION
// Calls local Ollama LLM as fallback for OpenAI
// ============================================

/**
 * Check if Ollama is running locally.
 * Returns true if the Ollama API is reachable.
 */
async function isOllamaAvailable() {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Call Ollama's local API for AI tutor response.
 * Uses the chat completions-style endpoint.
 */
async function callOllama(validationResult, lang) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: buildSystemPrompt(validationResult, lang) },
        {
          role: "user",
          content: lang === "id" 
            ? "Analisis rangkaian saya dan berikan umpan balik sebagai Sparky sang tutor. Jawab HANYA dengan objek JSON."
            : "Analyze my circuit and give me feedback as Sparky the tutor. Respond ONLY with the JSON object.",
        },
      ],
      options: {
        temperature: 0.7,
        num_predict: 500,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama returned ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const raw = data.message?.content || "";

  // Parse JSON response, stripping any accidental markdown fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ============================================
// AI PROVIDER CHAIN
// Fallback: OpenAI → Ollama → Mock
// ============================================

async function getAIInsights(validationResult, lang) {
  const apiKey = process.env.OPENAI_API_KEY;

  // ---- Attempt 1: OpenAI ----
  if (apiKey && apiKey.trim() !== "") {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: "system", content: buildSystemPrompt(validationResult, lang) },
          {
            role: "user",
            content: lang === "id"
              ? "Analisis rangkaian saya dan berikan umpan balik sebagai Sparky sang tutor. Jawab HANYA dengan objek JSON."
              : "Analyze my circuit and give me feedback as Sparky the tutor. Respond ONLY with the JSON object.",
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content || "";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const insights = JSON.parse(cleaned);

      return { source: "openai", insights };
    } catch (error) {
      console.warn("⚠️ OpenAI failed:", error.message);
      console.log("🔄 Falling back to Ollama...");
    }
  }

  // ---- Attempt 2: Ollama (local LLM) ----
  try {
    const ollamaReady = await isOllamaAvailable();
    if (ollamaReady) {
      console.log("🦙 Ollama detected! Using local LLM...");
      const insights = await callOllama(validationResult, lang);
      return { source: "ollama", insights };
    } else {
      console.log("🦙 Ollama not available at", process.env.OLLAMA_URL || "http://localhost:11434");
    }
  } catch (error) {
    console.warn("⚠️ Ollama failed:", error.message);
  }

  // ---- Attempt 3: Mock (deterministic fallback) ----
  console.log("🤖 Using mock AI tutor response.");
  return {
    source: "mock",
    insights: generateMockAIResponse(validationResult, lang),
  };
}

// ============================================
// DETECT AVAILABLE AI MODE AT STARTUP
// ============================================

async function detectAIMode() {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    return "openai (→ ollama → mock fallback)";
  }
  const ollama = await isOllamaAvailable();
  if (ollama) return "ollama (→ mock fallback)";
  return "mock (no LLM provider found)";
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get("/api/health", async (req, res) => {
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
app.post("/api/evaluate-circuit", async (req, res) => {
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

    console.log(`🤖 AI response source: ${source}`);

    // Step 3: Build response matching the required schema
    const response = {
      api_status: "ACTIVE",
      analysis_log: [
        ...validationResult.analysisLog,
        `🤖 AI Provider: ${source}`,
      ],
      ai_insights: {
        greeting: insights.greeting || "Hello, circuit builder!",
        explanation: insights.explanation || "Let me analyze your circuit...",
        hint: insights.hint || "Try connecting all components in a loop!",
        suggestion_button_text:
          insights.suggestion_button_text || "Need more help? 🤔",
      },
      error_log: validationResult.errorLog,
      error_nodes: validationResult.errorNodes,
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      api_status: "ERROR",
      analysis_log: [],
      ai_insights: null,
      error_log: [`Server error: ${error.message}`],
    });
  }
});

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
