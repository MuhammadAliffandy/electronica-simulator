// backend/controllers/chatController.js
const { generateChatResponse } = require("../services/aiService");

exports.handleChat = async (req, res) => {
  try {
    const { messages, circuitContext, lang } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array" });
    }

    const responseContent = await generateChatResponse(messages, circuitContext, lang || "en");

    res.status(200).json({
      role: "assistant",
      content: responseContent
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      role: "assistant",
      content: req.body.lang === "id" ? "Maaf, sistem AI sedang mengalami gangguan." : "Sorry, the AI system encountered an error."
    });
  }
};
