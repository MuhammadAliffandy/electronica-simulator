// backend/services/aiService.js

function buildSystemPrompt(validationResult, lang) {
  let prompt = `You are "ELVO AI", a friendly, gamified physics tutor for an electronics learning simulator.

PERSONA RULES:
- You speak like an encouraging lab partner who genuinely loves circuits.
- Use the "fun way" teaching philosophy: guide through curiosity, NEVER give direct answers.
- ALWAYS analyze the mathematical data provided in the "analysisLog" (voltages, nodes, states).
- EXPLICITLY mention the specific numbers (e.g., 5V, 2V drop, open circuit) from the data in your explanation.
- Always relate these exact numbers back to Ohm's Law (V = I × R) and basic circuit principles.
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
  "explanation": "A deep, conceptual explanation of what's happening. You MUST include specific voltages or states from the analysisLog data. Reference Ohm's Law using the actual numbers (2-4 sentences).",
  "hint": "A guiding question or hint to help the student understand or fix their circuit. Never give the direct answer (1-2 sentences).",
  "suggestion_button_text": "A short, fun call-to-action text for a tip (e.g., 'Try adding a resistor!')"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no extra text.`;

  return prompt;
}

function generateMockAIResponse(validationResult, lang) {
  const { hasLoop, burnoutRisk, nodes = [] } = validationResult;
  
  const hasLed = nodes.some(n => n.type === 'led' || n.data?.componentType === 'led');
  const hasMotor = nodes.some(n => n.type === 'motor' || n.data?.componentType === 'motor');
  const hasCapacitor = nodes.some(n => n.type === 'capacitor' || n.data?.componentType === 'capacitor');
  const hasTransistor = nodes.some(n => n.type === 'transistor' || n.data?.componentType === 'transistor');
  const hasMultimeter = nodes.some(n => n.type === 'multimeter' || n.data?.componentType === 'multimeter');

  let activeComponent = hasLed ? "LED" : hasMotor ? "motor" : hasCapacitor ? "kapasitor" : hasTransistor ? "transistor" : "komponen";
  let activeComponentEng = hasLed ? "LED" : hasMotor ? "motor" : hasCapacitor ? "capacitor" : hasTransistor ? "transistor" : "component";

  if (lang === "id") {
    if (burnoutRisk) {
      return {
        greeting: "Halo, penjelajah rangkaian yang berani! Sepertinya kamu sedang mencari bahaya!",
        explanation: `${activeComponent} kamu terhubung langsung ke sumber tegangan tanpa hambatan yang cukup! Dalam elektronika, Hukum Ohm (V = I × R) mengatakan bahwa tanpa hambatan, arus akan menjadi terlalu tinggi dan merusak komponen.`,
        hint: `Komponen apa yang bisa kamu letakkan di antara baterai dan ${activeComponent} untuk membatasi aliran arus? Pikirkan tentang V = I × R...`,
        suggestion_button_text: "Coba tambahkan resistor!",
      };
    }

    if (!hasLoop) {
      return {
        greeting: "Selamat datang kembali, ilmuwan rangkaian! 🔬 Kulihat kamu sedang menghubungkan komponen!",
        explanation: "Saat ini rangkaianmu terlihat seperti jalan buntu — elektron ingin bergerak dalam satu putaran penuh dari terminal positif baterai, melewati komponen, dan kembali ke terminal negatif. Tanpa putaran yang tertutup, arus tidak bisa mengalir!",
        hint: "Bisakah kamu melacak jalur kabelmu? Apakah ada sakelar (switch) yang sedang terbuka? 🔍",
        suggestion_button_text: "Periksa sakelar dan kabelmu! 🔗",
      };
    }
    
    if (hasCapacitor) {
      return {
        greeting: "Kerja bagus! 🌟 Kamu sedang melihat fenomena RC (Resistor-Capacitor)!",
        explanation: "Kapasitor bertindak seperti tangki air. Saat ini, arus sedang mengisi tangki tersebut. Setelah tegangan kapasitor sama dengan sumber, arus akan berhenti mengalir (steady-state).",
        hint: "Perhatikan bagaimana arus meluruh menjadi 0. Apa yang terjadi jika kamu memperbesar nilai Kapasitor atau Resistor? (Petunjuk: Konstanta Waktu τ = R × C) 🧐",
        suggestion_button_text: "Eksperimen dengan nilai Kapasitansi! ⚡",
      };
    }
    
    if (hasTransistor) {
      return {
        greeting: "Luar biasa! 🌟 Transistor sedang beraksi sebagai sakelar otomatis!",
        explanation: "Arus kecil di basis (B) mengendalikan arus yang jauh lebih besar dari kolektor (C) ke emitor (E). Jika arus basis cukup, transistor masuk ke kondisi SATURASI (menyala penuh).",
        hint: "Coba ubah nilai resistor di jalur basis. Pada nilai hambatan berapa transistor mulai keluar dari saturasi dan meredup? 🧐",
        suggestion_button_text: "Ubah resistor basis! ⚡",
      };
    }

    if (hasMultimeter && activeComponent === "komponen") {
      return {
        greeting: "Pilihan alat yang tepat! 📏 Kamu sedang melakukan pengukuran dengan Multimeter!",
        explanation: "Multimeter adalah 'mata' kita untuk melihat aliran listrik. Voltmeter diletakkan secara paralel untuk mengukur beda potensial (Volt), sedangkan Ammeter diletakkan secara seri untuk menghitung elektron yang lewat (Ampere).",
        hint: "Bandingkan nilai yang ada di layarmu dengan Hukum Ohm manual (V = I × R). Apakah hasilnya cocok? 🧐",
        suggestion_button_text: "Uji mode ukur lainnya! ⚡",
      };
    }

    return {
      greeting: "Kerja bagus! 🌟 Kamu berhasil membuat rangkaian beroperasi dengan sukses!",
      explanation: `Arus mengalir dengan sempurna membentuk putaran dari baterai, melewati resistor yang mengatur kecepatan aliran, dan masuk ke ${activeComponent}. Hukum Ohm sedang beraksi secara real-time!`,
      hint: "Apa yang akan terjadi jika kamu mengubah resistor menjadi yang hambatannya lebih tinggi (seperti 10kΩ)? Menurut Hukum Ohm, jika R naik tapi V tetap sama, apa yang terjadi pada I (Arus)? 🧐",
      suggestion_button_text: "Eksperimen dengan nilai resistor! ⚡",
    };
  }

  // English fallback
  if (burnoutRisk) {
    return {
      greeting: "Hey there, brave circuit explorer! Looks like you're living dangerously!",
      explanation: `Your ${activeComponentEng} is connected with too little resistance! Ohm's Law (V = I × R) tells us that without resistance, the current goes way too high and destroys components.`,
      hint: `What component could you place to limit the current flow to the ${activeComponentEng}? Think about V = I × R...`,
      suggestion_button_text: "Try adding a resistor!",
    };
  }

  if (!hasLoop) {
    return {
      greeting: "Welcome back, circuit scientist! 🔬 I see you've been wiring things up!",
      explanation: "Right now your circuit looks like a road with a dead end. Without a closed loop, no current can flow!",
      hint: "Can you trace a path? Is there an open switch somewhere? 🔍",
      suggestion_button_text: "Double-check your switches! 🔗",
    };
  }

  if (hasMultimeter && activeComponentEng === "component") {
    return {
      greeting: "Great choice of tool! 📏 You're taking measurements with the Multimeter!",
      explanation: "A multimeter acts as our 'eyes' into the circuit. Voltmeters are placed in parallel to measure potential difference, while Ammeters are placed in series to count passing electrons.",
      hint: "Compare the reading on your screen with a manual Ohm's Law calculation (V = I × R). Do they match? 🧐",
      suggestion_button_text: "Test another measurement mode! ⚡",
    };
  }

  return {
    greeting: "Great job! 🌟 You've got a successfully powered circuit!",
    explanation: `Current is flowing beautifully in a loop from the battery, through your resistor which sets the pace, and into your ${activeComponentEng}. That's Ohm's Law in action!`,
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
