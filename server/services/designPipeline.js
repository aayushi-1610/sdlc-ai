// designPipeline.js
// Orchestrates the Design Phase pipeline using the analysis session as input.
// Runs independent modules in parallel batches (Gemini / MiniMax / Nemotron).

const ai = require("./aiService");

function emit(send, event, data) {
  try { send(event, data); } catch (e) { console.warn("[designPipeline] emit error", event, e.message); }
}

async function runModule(send, key, name, fn, percent, model, step) {
  emit(send, "design_progress", { step, label: name, model, percent, moduleId: key });
  try {
    const data = await fn();
    emit(send, "design_module", { id: key, name, data });
    return data;
  } catch (e) {
    console.error(`[designPipeline] ${name} failed:`, e.message);
    emit(send, "design_module_error", { id: key, name, message: e.message });
    return {};
  }
}

/**
 * Main Design Phase entry point.
 * @param {object} analysisData - Full analysis artefacts from the session store
 * @param {function} send - SSE send callback(event, data)
 */
async function runDesignPipeline(analysisData, send) {
  const allDesign = {};

  // ── Batch 1: Gemini modules (HLD, Database, UI/UX) in parallel ─────────────
  emit(send, "design_progress", { step: 1, label: "Gemini Design Batch", model: "Gemini", percent: 5, moduleId: "hld" });
  const [hld, database, uiux] = await Promise.all([
    runModule(send, "hld", "High-Level Design", () => ai.generateHLD(analysisData), 12, "Gemini", 1),
    runModule(send, "database", "Database Design", () => ai.generateDatabaseDesign(analysisData), 18, "Gemini", 2),
    runModule(send, "uiux", "UI/UX Design", () => ai.generateUIUXDesign(analysisData), 28, "Gemini", 3),
  ]);
  Object.assign(allDesign, { hld, database, uiux });

  // ── Batch 2: MiniMax modules (API, LLD) in parallel ───────────────────────
  const [api, lld] = await Promise.all([
    runModule(send, "api", "API Design", () => ai.generateAPIDesign(analysisData), 42, "MiniMax-M3", 4),
    runModule(send, "lld", "Low-Level Design", () => ai.generateLLD(analysisData), 52, "MiniMax-M3", 5),
  ]);
  Object.assign(allDesign, { api, lld });

  // ── Batch 3: Nemotron modules (Security, Performance, Deployment) ───────────
  const [security, performance, deployment] = await Promise.all([
    runModule(send, "security", "Security Design", () => ai.generateSecurityDesign(analysisData), 63, "Nemotron-3-Super", 6),
    runModule(send, "performance", "Performance Design", () => ai.generatePerformanceDesign(analysisData), 73, "Nemotron-3-Super", 7),
    runModule(send, "deployment", "Deployment Design", () => ai.generateDeploymentDesign(analysisData), 82, "Nemotron-3-Super", 8),
  ]);
  Object.assign(allDesign, { security, performance, deployment });

  // ── Module D9: Design Validation (All 3 Models) ─────────────────────────────
  allDesign.validation = await runModule(
    send, "validation", "Design Validation",
    () => ai.validateDesign(allDesign, analysisData),
    91, "Gemini + MiniMax + Nemotron", 9
  );

  // ── Module D10: Design Fusion Engine (Gemini) ───────────────────────────────
  allDesign.fusion = await runModule(
    send, "fusion", "Design Fusion",
    () => ai.fuseDesign(allDesign),
    97, "Gemini (Fusion Engine)", 10
  );

  emit(send, "design_progress", { step: 10, label: "Design Phase Complete", model: "System", percent: 100, moduleId: "done" });
  emit(send, "design_complete", { design: allDesign });

  return allDesign;
}

module.exports = { runDesignPipeline };
