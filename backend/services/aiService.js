// backend/services/aiService.js

function buildSystemPrompt(validationResult, lang) {
  let prompt = `You are "ELVO AI", a friendly, gamified physics tutor for an electronics learning simulator.

PERSONA RULES:
- You speak like an encouraging lab partner who genuinely loves circuits.
- Use the "fun way" teaching philosophy: guide through curiosity, NEVER give direct answers.
- Always relate concepts back to Ohm's Law (V = I × R) and basic circuit principles.
- Professional and encouraging tone.
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
  "suggestion_button_text": "A short, fun call-to-action text for a tip (e.g., 'Try adding a resistor!')"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no extra text.`;

  return prompt;
}

function generateMockAIResponse(validationResult, lang) {
  const { hasLoop, burnoutRisk } = validationResult;

  if (lang === "id") {
    if (burnoutRisk) {
      return {
        greeting: "Halo, penjelajah rangkaian yang berani! Sepertinya kamu sedang mencari bahaya!",
        explanation: "LED kamu terhubung langsung ke baterai — itu seperti minum dari selang pemadam kebakaran! Dalam elektronika, Hukum Ohm (V = I × R) mengatakan bahwa tanpa hambatan, arus akan menjadi terlalu tinggi. LED merah standar hanya bisa menangani sekitar 20mA dengan aman.",
        hint: "Komponen apa yang bisa kamu letakkan di antara baterai dan LED untuk membatasi aliran arus? Pikirkan tentang V = I × R... apa yang terjadi ketika R sangat kecil (atau nol)?",
        suggestion_button_text: "Coba tambahkan resistor!",
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
      greeting: "Hey there, brave circuit explorer! Looks like you're living dangerously!",
      explanation: "Your LED is connected straight to the battery — that's like drinking from a fire hose! In electronics, Ohm's Law (V = I × R) tells us that without resistance, the current goes way too high. A standard red LED can only handle about 20mA safely.",
      hint: "What component could you place between the battery and the LED to limit the current flow? Think about V = I × R... what happens when R is very small (or zero)?",
      suggestion_button_text: "Try adding a resistor!",
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
            ? "Analisis rangkaian saya dan berikan umpan balik sebagai ELVO AI sang tutor. Jawab HANYA dengan objek JSON."
            : "Analyze my circuit and give me feedback as ELVO AI the tutor. Respond ONLY with the JSON object.",
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
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

async function getAIInsights(validationResult, lang) {
  const apiKey = process.env.OPENAI_API_KEY;

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
              ? "Analisis rangkaian saya dan berikan umpan balik sebagai ELVO AI sang tutor. Jawab HANYA dengan objek JSON."
              : "Analyze my circuit and give me feedback as ELVO AI the tutor. Respond ONLY with the JSON object.",
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

  console.log("🤖 Using mock AI tutor response.");
  return {
    source: "mock",
    insights: generateMockAIResponse(validationResult, lang),
  };
}

async function detectAIMode() {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    return "openai (→ ollama → mock fallback)";
  }
  const ollama = await isOllamaAvailable();
  if (ollama) return "ollama (→ mock fallback)";
  return "mock (no LLM provider found)";
}

async function generateChatResponse(messages, circuitContext, lang) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";
  
  let systemContent = `You are "ELVO AI", a friendly, gamified physics tutor for an electronics learning simulator.
PERSONA RULES:
- You speak like an encouraging lab partner who genuinely loves circuits.
- Use the "fun way" teaching philosophy: guide through curiosity.
- Always relate concepts back to Ohm's Law (V = I × R) and basic circuit principles.
- Professional and encouraging tone.
- Be concise in your responses (1-3 paragraphs max).`;

  if (lang === "id") {
    systemContent += `\n- CRITICAL: You MUST respond entirely in Bahasa Indonesia. Gunakan bahasa Indonesia yang ramah, santai, dan edukatif.`;
  }

  if (circuitContext) {
    systemContent += `\n\nCURRENT CIRCUIT CONTEXT (Hidden from user):\n${JSON.stringify(circuitContext, null, 2)}`;
  }

  const payloadMessages = [
    { role: "system", content: systemContent },
    ...messages
  ];

  try {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: payloadMessages,
        options: {
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) throw new Error("Ollama returned an error");
    const data = await res.json();
    return data.message?.content || "No response";
  } catch (error) {
    console.warn("Chat generation failed:", error.message);
    if (lang === "id") {
      return "Maaf, mesin AI-ku sedang beristirahat. Pastikan Ollama berjalan di komputermu!";
    }
    return "Sorry, my AI engine is resting. Make sure Ollama is running!";
  }
}

module.exports = {
  getAIInsights,
  detectAIMode,
  generateChatResponse
};
