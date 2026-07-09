// test_all_apis.js — Tests all Gemini, MiniMax, and Nemotron API keys
require("dotenv").config();
const axios = require("axios");

const MINIMAX_TIMEOUT_MS = Number(process.env.MINIMAX_TIMEOUT_MS) || Number(process.env.MODEL_TIMEOUT_MS) || 20 * 60 * 1000;
const NEMOTRON_TIMEOUT_MS = Number(process.env.NEMOTRON_TIMEOUT_MS) || 10 * 60 * 1000;
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 10 * 60 * 1000;

const results = [];

async function testGeminiKey(keyName, keyVal) {
  if (!keyVal) {
    results.push({ name: keyName, status: "SKIP", reason: "Not configured" });
    console.log(`[Gemini] ✗ ${keyName} → NOT CONFIGURED`);
    return;
  }
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyVal}`;
  try {
    const res = await axios.post(url, {
      contents: [{ role: "user", parts: [{ text: 'Reply with exactly the word: WORKING' }] }]
    }, { headers: { "Content-Type": "application/json" }, timeout: GEMINI_TIMEOUT_MS });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    results.push({ name: keyName, status: "PASS", response: text.substring(0, 60) });
    console.log(`[Gemini] ✓ ${keyName} → VALID  |  Response: "${text.substring(0, 60)}"`);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    results.push({ name: keyName, status: "FAIL", reason: msg.substring(0, 120) });
    console.log(`[Gemini] ✗ ${keyName} → FAILED  |  ${msg.substring(0, 120)}`);
  }
}

async function testMiniMaxKey(keyName, keyVal) {
  if (!keyVal) {
    results.push({ name: keyName, status: "SKIP", reason: "Not configured" });
    console.log(`[MiniMax] ✗ ${keyName} → NOT CONFIGURED`);
    return;
  }
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";
  try {
    const res = await axios.post(url, {
      model: "minimaxai/minimax-m3",
      messages: [{ role: "user", content: "Reply with exactly the word: WORKING" }],
      max_tokens: 30,
      temperature: 0.1
    }, {
      headers: { Authorization: `Bearer ${keyVal}`, "Content-Type": "application/json" },
      timeout: MINIMAX_TIMEOUT_MS
    });
    const text = res.data?.choices?.[0]?.message?.content?.trim() || "";
    results.push({ name: keyName, status: "PASS", response: text.substring(0, 60) });
    console.log(`[MiniMax] ✓ ${keyName} → VALID  |  Response: "${text.substring(0, 60)}" (${MINIMAX_TIMEOUT_MS / 1000}s timeout)`);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    results.push({ name: keyName, status: "FAIL", reason: msg.substring(0, 120) });
    console.log(`[MiniMax] ✗ ${keyName} → FAILED  |  ${msg.substring(0, 120)}`);
  }
}

async function testNemotronKey(keyName, keyVal) {
  if (!keyVal) {
    results.push({ name: keyName, status: "SKIP", reason: "Not configured" });
    console.log(`[Nemotron] ✗ ${keyName} → NOT CONFIGURED`);
    return;
  }
  const url = "https://integrate.api.nvidia.com/v1/chat/completions";
  try {
    const res = await axios.post(url, {
      model: "nvidia/nemotron-3-super-120b-a12b",
      messages: [{ role: "user", content: "Reply with exactly the word: WORKING" }],
      max_tokens: 30,
      temperature: 0.1
    }, {
      headers: { Authorization: `Bearer ${keyVal}`, "Content-Type": "application/json" },
      timeout: NEMOTRON_TIMEOUT_MS
    });
    const text = res.data?.choices?.[0]?.message?.content?.trim() || "";
    results.push({ name: keyName, status: "PASS", response: text.substring(0, 60) });
    console.log(`[Nemotron] ✓ ${keyName} → VALID  |  Response: "${text.substring(0, 60)}"`);
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    results.push({ name: keyName, status: "FAIL", reason: msg.substring(0, 120) });
    console.log(`[Nemotron] ✗ ${keyName} → FAILED  |  ${msg.substring(0, 120)}`);
  }
}

(async () => {
  console.log("\n============================================");
  console.log("   SDLC·AI PLATFORM — API KEY DIAGNOSTICS");
  console.log("============================================\n");

  console.log("--- 4x Gemini Keys ---");
  for (let i = 1; i <= 4; i++) {
    await testGeminiKey(`GEMINI_API_KEY_${i}`, process.env[`GEMINI_API_KEY_${i}`]);
  }

  console.log("\n--- 4x MiniMax Keys (Validation / API / LLD / Cost) ---");
  console.log(`    Timeout: ${MINIMAX_TIMEOUT_MS / 1000}s per key`);
  for (let i = 1; i <= 4; i++) {
    await testMiniMaxKey(`MINIMAX_API_KEY_${i}`, process.env[`MINIMAX_API_KEY_${i}`]);
  }

  console.log("\n--- 4x Nemotron Keys (Feasibility / Risk+Security / Perf+Deploy / Cost+Validation) ---");
  for (let i = 1; i <= 4; i++) {
    await testNemotronKey(`NIM_API_KEY_${i}`, process.env[`NIM_API_KEY_${i}`]);
  }
  await testNemotronKey("NIM_API_KEY (fallback)", process.env.NIM_API_KEY);

  console.log("\n============================================");
  console.log("                  SUMMARY");
  console.log("============================================");
  const passed  = results.filter(r => r.status === "PASS").length;
  const failed  = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;
  results.forEach(r => {
    const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "–";
    console.log(`  ${icon}  [${r.status}]  ${r.name}`);
  });
  console.log(`\n  Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  console.log("============================================\n");
})();
