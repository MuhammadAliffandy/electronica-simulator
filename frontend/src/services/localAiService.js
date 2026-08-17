import { MLCEngine } from "@mlc-ai/web-llm";

let engine = null;
let currentProgressCallback = null;
let isLoaded = false;

// We use Phi-3-mini because it's small (~1.8GB) and great at reasoning.
export const LOCAL_MODEL = "Phi-3-mini-4k-instruct-q4f16_1-MLC";

export const initLocalAI = async (onProgress) => {
  if (isLoaded && engine) return engine;
  currentProgressCallback = onProgress;

  const initProgressCallback = (initProgress) => {
    if (currentProgressCallback) {
      currentProgressCallback(initProgress);
    }
  };

  engine = new MLCEngine();
  engine.setInitProgressCallback(initProgressCallback);
  
  await engine.reload(LOCAL_MODEL);
  isLoaded = true;
  return engine;
};

export const chatLocalAI = async (messages, circuitContext) => {
  if (!engine || !isLoaded) throw new Error("Local AI Engine not initialized");

  // Construct system prompt similar to backend aiService
  const systemPrompt = `You are ELVO AI, an electronics lab assistant. 
You are analyzing a circuit simulation.
Current Circuit Status:
- Total Nodes: ${circuitContext?.current_nodes?.length || 0}
- Has Errors: ${circuitContext?.errorLog?.length > 0 ? 'Yes' : 'No'}
${circuitContext?.analysisLog ? 'Analysis Log:\\n' + circuitContext.analysisLog.join('\\n') : ''}
${circuitContext?.errorLog ? 'Error Log:\\n' + circuitContext.errorLog.join('\\n') : ''}

Guidelines:
- Speak like an encouraging lab partner.
- Guide through curiosity, never give direct answers.
- Relate to Ohm's Law (V = I * R).
- Professional and encouraging tone in Indonesian.
- Be concise (1-3 paragraphs).`;

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter(m => m.isSystem !== true).map(m => ({ role: m.role, content: m.content }))
  ];

  const completion = await engine.chat.completions.create({
    messages: formattedMessages,
    temperature: 0.7,
  });

  return {
    role: "assistant",
    content: completion.choices[0].message.content
  };
};
