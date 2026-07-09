// Re-exports Gemini client from orchestrator (legacy test compatibility)
const { callGeminiDirect } = require("./orchestrator");

async function callGemini(systemPrompt, userPrompt, moduleName) {
  return callGeminiDirect(systemPrompt, userPrompt, moduleName || "LegacyTest");
}

module.exports = { callGemini, callGeminiDirect };
