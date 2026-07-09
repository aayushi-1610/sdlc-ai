// Diagnostic: try multiple Gemini model names and HuggingFace endpoints
require("dotenv").config();
const axios = require("axios");

async function tryGeminiModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return console.log("[Gemini] No key set");

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await axios.post(url, {
        contents: [{ role: "user", parts: [{ text: 'Reply with exactly: {"status":"ok"}' }] }],
        generationConfig: { responseMimeType: "application/json" }
      }, { headers: { "Content-Type": "application/json" }, timeout: 600000 });
      console.log(`[Gemini] ✓ MODEL "${model}" WORKS! Response: ${res.data.candidates[0].content.parts[0].text.substring(0, 80)}`);
      return;
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message;
      console.log(`[Gemini] ✗ ${model}: ${e.response?.status || "ERR"} - ${msg.substring(0, 100)}`);
    }
  }
  console.log("[Gemini] All model names failed.");
}

async function tryHuggingFaceEndpoints() {
  const key = process.env.HF_API_KEY;
  if (!key) return console.log("[HuggingFace] No key set");

  const endpoints = [
    { name: "router.huggingface.co", url: "https://router.huggingface.co/v1/chat/completions" },
    { name: "api-inference.huggingface.co/v1", url: "https://api-inference.huggingface.co/v1/chat/completions" },
    { name: "huggingface.co/api", url: "https://huggingface.co/api/inference-proxy/together/v1/chat/completions" },
  ];

  const models = ["Qwen/Qwen2.5-7B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3", "meta-llama/Llama-3.1-8B-Instruct"];

  for (const ep of endpoints) {
    for (const model of models) {
      try {
        const res = await axios.post(ep.url, {
          model,
          messages: [{ role: "user", content: 'Reply with exactly: {"status":"ok"}' }],
          max_tokens: 50
        }, { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` }, timeout: 600000 });
        console.log(`[HuggingFace] ✓ ENDPOINT "${ep.name}" + MODEL "${model}" WORKS!`);
        console.log(`  Response: ${res.data.choices[0].message.content.substring(0, 80)}`);
        return;
      } catch (e) {
        const msg = e.response?.data?.error || e.message;
        console.log(`[HuggingFace] ✗ ${ep.name} + ${model}: ${e.response?.status || "ERR"} - ${JSON.stringify(msg).substring(0, 100)}`);
      }
    }
  }
  console.log("[HuggingFace] All endpoint/model combinations failed.");
}

(async () => {
  console.log("=== SDLC Platform – Extended API Diagnostics ===\n");
  console.log("--- Testing Gemini Models ---");
  await tryGeminiModels();
  console.log("\n--- Testing HuggingFace Endpoints ---");
  await tryHuggingFaceEndpoints();
  console.log("\n=== Done ===");
})();
