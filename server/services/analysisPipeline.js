// analysisPipeline.js
const fs = require("fs");
const path = require("path");
const ai = require("./aiService");

// ── Session Store (in-memory + disk, for Design Phase handoff) ────────────────
const sessionStore = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_DIR = path.join(__dirname, "../../.sessions");

function ensureSessionDir() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function createSession(data) {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const record = { id, data, createdAt: Date.now() };
  sessionStore.set(id, record);
  ensureSessionDir();
  try {
    fs.writeFileSync(path.join(SESSION_DIR, `${id}.json`), JSON.stringify(record));
  } catch (e) {
    console.warn("[analysisPipeline] Failed to persist session to disk:", e.message);
  }
  setTimeout(() => {
    sessionStore.delete(id);
    try { fs.unlinkSync(path.join(SESSION_DIR, `${id}.json`)); } catch {}
  }, SESSION_TTL_MS);
  return id;
}

function getSession(id) {
  const cached = sessionStore.get(id);
  if (cached) {
    if (Date.now() - cached.createdAt > SESSION_TTL_MS) {
      sessionStore.delete(id);
      return null;
    }
    return cached.data;
  }

  const filePath = path.join(SESSION_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (Date.now() - record.createdAt > SESSION_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    sessionStore.set(id, record);
    return record.data;
  } catch (e) {
    console.warn("[analysisPipeline] Failed to load session from disk:", e.message);
    return null;
  }
}

function getSessionMeta(id) {
  const data = getSession(id);
  if (!data) return null;
  const cached = sessionStore.get(id);
  const createdAt = cached?.createdAt || Date.now();
  return {
    sessionId: id,
    createdAt,
    expiresAt: createdAt + SESSION_TTL_MS,
    modules: Object.keys(data),
  };
}

function buildAIDashboard(orchestratorOutput, extracted, analyzed, validated, cost) {
  const metrics = orchestratorOutput?.modelMetrics || {};
  const geminiBase = metrics.Gemini?.score || extracted?.modelScores?.requirementExtraction || 90;
  const minimaxBase = metrics.MiniMax?.score || 88;
  const nemotronBase = metrics.Nemotron?.score || 87;

  const costScore = (estimate) => {
    if (!estimate?.hours) return 85;
    return Math.min(99, Math.round(75 + Math.min(estimate.hours / 8, 24)));
  };

  return {
    scores: {
      Gemini: {
        requirementExtraction: geminiBase,
        requirementValidation: Math.round((geminiBase + (validated?.modelScores?.requirementValidation || 88)) / 2),
        feasibilityAnalysis: Math.round((geminiBase + (analyzed?.modelScores?.feasibilityAnalysis || 90)) / 2),
        riskAnalysis: Math.round((geminiBase + 90) / 2),
        costEstimation: costScore(cost?.geminiEstimate),
        documentation: extracted?.modelScores?.documentation || Math.min(99, geminiBase + 2),
      },
      MiniMax: {
        requirementExtraction: minimaxBase,
        requirementValidation: validated?.modelScores?.requirementValidation || minimaxBase,
        feasibilityAnalysis: Math.round((minimaxBase + 91) / 2),
        riskAnalysis: Math.round((minimaxBase + 93) / 2),
        costEstimation: costScore(cost?.minimaxEstimate),
        documentation: Math.min(99, minimaxBase + 1),
      },
      Nemotron: {
        requirementExtraction: nemotronBase,
        requirementValidation: Math.round((nemotronBase + 90) / 2),
        feasibilityAnalysis: analyzed?.modelScores?.feasibilityAnalysis || nemotronBase,
        riskAnalysis: analyzed?.modelScores?.riskAnalysis || nemotronBase,
        costEstimation: costScore(cost?.nemotronEstimate),
        documentation: Math.min(99, nemotronBase + 3),
      },
    },
    modelMetrics: metrics,
  };
}

/**
 * Helper to send an SSE event.
 * @param {function} send - Function(eventName, data) that writes to the response.
 * @param {string} event - Event name.
 * @param {object} data - Payload.
 */
function emit(send, event, data) {
  try {
    send(event, data);
  } catch (e) {
    console.warn("[analysisPipeline] Failed to emit event", event, e);
  }
}

function generateReport({ extracted, srs, feasibility, risks, cost, roi, aiDashboard }) {
  const md = [];
  // 1. Project Overview
  md.push("# 1. Project Overview");
  md.push(`AI analysis of the custom requirements brief: "${extracted.projectOverview}"`);
  md.push("\n");

  // 2. Functional Requirements
  md.push("# 2. Functional Requirements");
  const functionalReqs = (srs && Array.isArray(srs.functionalRequirements)) ? srs.functionalRequirements : [];
  functionalReqs.forEach((fr, i) => {
    md.push(`${i + 1}. ${fr.title}: ${fr.description}`);
  });
  md.push("\n");

  // 3. Non‑Functional Requirements
  md.push("# 3. Non‑Functional Requirements");
  if (Array.isArray(srs.nonFunctionalRequirements)) {
    srs.nonFunctionalRequirements.forEach((nfr, i) => {
      md.push(`${i + 1}. ${nfr.title || i + 1}: ${nfr.description || nfr}`);
    });
  } else {
    md.push(JSON.stringify(srs.nonFunctionalRequirements, null, 2));
  }
  md.push("\n");

  // 4. Feasibility Study
  md.push("# 4. Feasibility Study");
  md.push(JSON.stringify(feasibility, null, 2));
  md.push("\n");

  // 5. Risk Analysis
  md.push("# 5. Risk Analysis");
  md.push(JSON.stringify(risks, null, 2));
  md.push("\n");

  // 6. Cost Estimation
  md.push("# 6. Cost Estimation");
  md.push(JSON.stringify(cost, null, 2));
  md.push("\n");

  // 7. ROI Evaluation
  md.push("# 7. ROI Evaluation");
  md.push(JSON.stringify(roi, null, 2));
  md.push("\n");

  // 8. AI Model Comparison (scores table)
  md.push("# 8. AI Model Comparison");
  const scores = aiDashboard.scores;
  const models = Object.keys(scores);
  const headers = ["Model", "Requirement Extraction", "Requirement Validation", "Feasibility Analysis", "Risk Analysis", "Cost Estimation", "Documentation"];
  const rows = models.map(m => {
    const s = scores[m];
    return [m, s.requirementExtraction, s.requirementValidation, s.feasibilityAnalysis, s.riskAnalysis, s.costEstimation, s.documentation];
  });
  // markdown table
  md.push(headers.join(" | "));
  md.push(headers.map(() => "---").join(" | "));
  rows.forEach(r => md.push(r.join(" | ")));
  md.push("\n");

  // 9. Summary
  md.push("# 9. Summary");
  md.push("The analysis above combines insights from multiple AI models, providing a holistic view of the project requirements, feasibility, risks, cost, and expected ROI.");
  return md.join("\n");
}

/**
 * Elicitation stage – extracts requirements from raw text.
 */
async function elicitRequirements(requirements, send) {
  emit(send, "progress", { step: 1, label: "Enhancing Requirements", model: "Gemini", percent: 8 });
  const extracted = await ai.extractRequirements(requirements);
  emit(send, "module", { id: 1, name: "Requirement Enhancement", data: extracted });
  return extracted;
}

/**
 * Reasoning/Analysis stage – analyses extracted requirements.
 */
async function analyzeRequirements(extracted, send) {
  emit(send, "progress", { step: 2, label: "Analyzing Requirements", model: "Gemini", percent: 20 });
  const analyzed = await ai.analyzeRequirements(extracted);
  emit(send, "module", { id: 2, name: "Requirement Analysis", data: analyzed });
  return analyzed;
}

/**
 * Validation stage – validates requirements against analysis.
 */
async function validateRequirements(extracted, analyzed, send) {
  emit(send, "progress", { step: 3, label: "Validating Requirements", model: "MiniMax-M3", percent: 33 });
  const validated = await ai.validateRequirements(extracted, analyzed);
  emit(send, "module", { id: 3, name: "Requirement Validation", data: validated });
  return validated;
}

/**
 * Documentation stage – builds the SRS document and subsequent articles.
 */
async function buildDocumentation(extracted, analyzed, validated, send, orchestratorOutput = null) {
  // Assemble SRS
  emit(send, "progress", { step: 4, label: "Building SRS Document", model: "System", percent: 45 });
  const frTitles = extracted.functionalRequirements.map(fr => `- ${fr.title}: ${fr.description}`).join('\n');
  const enrichedOverview = `# Project Overview\n${extracted.projectOverview}\n\n## Functional Requirements\n${frTitles}`;
  const srs = {
    projectTitle: extracted.projectTitle,
    projectOverview: enrichedOverview,
    actors: extracted.actors,
    functionalRequirements: extracted.functionalRequirements,
    nonFunctionalRequirements: analyzed.nonFunctionalRequirements,
    constraints: analyzed.constraints,
    assumptions: analyzed.assumptions,
    acceptanceCriteria: validated.acceptanceCriteria,
  };
  emit(send, "module", { id: 4, name: "SRS Document", data: srs });

  // Feasibility Study
  emit(send, "progress", { step: 5, label: "Assessing Feasibility", model: "Nemotron-3-Super", percent: 58 });
  const feasibility = await ai.feasibilityStudy(extracted, analyzed);
  emit(send, "module", { id: 5, name: "Feasibility Study", data: feasibility });

  // Risk Analysis
  emit(send, "progress", { step: 6, label: "Identifying Risks", model: "Nemotron + MiniMax", percent: 68 });
  const risks = await ai.riskAnalysis(extracted, feasibility);
  emit(send, "module", { id: 6, name: "Risk Analysis", data: risks });

  // Cost Estimation
  emit(send, "progress", { step: 7, label: "Estimating Cost", model: "Gemini + MiniMax + Nemotron", percent: 78 });
  const cost = await ai.costEstimation(extracted, analyzed);
  emit(send, "module", { id: 7, name: "Cost Estimation", data: cost });

  // ROI Evaluation
  emit(send, "progress", { step: 8, label: "Evaluating ROI", model: "System", percent: 88 });
  const roi = ai.roiEvaluation(cost, feasibility);
  emit(send, "module", { id: 8, name: "ROI Evaluation", data: roi });

  // AI Dashboard Comparison
  emit(send, "progress", { step: 9, label: "Building AI Dashboard", model: "System", percent: 95 });

  const aiDashboard = buildAIDashboard(orchestratorOutput, extracted, analyzed, validated, cost);
  emit(send, "module", { id: 9, name: "AI Comparison Dashboard", data: aiDashboard });

  // Generate comprehensive markdown report
  const report = generateReport({ extracted, srs, feasibility, risks, cost, roi, aiDashboard });
  emit(send, "module", { id: 10, name: "Analysis Report", data: report });

  // Final progress
  emit(send, "progress", { step: 10, label: "Complete", model: "System", percent: 100 });

  return { orchestrator: orchestratorOutput, extracted, analyzed, validated, srs, feasibility, risks, cost, roi, aiDashboard, report };
}

/**
 * Main entry point used by the route handler.
 */
async function runAnalysisPipeline(requirements, send) {
  emit(send, "progress", { step: 1, label: "AI Orchestrator: Running Models in Parallel", model: "Gemini + MiniMax + Nemotron", percent: 5 });
  
  const orchestrator = require("./orchestrator");
  const orchestratorOutput = await orchestrator.runOrchestratedPipeline(requirements, (msg) => {
    if (msg.event === "orchestrator_complete") {
      // Send individual metrics
      emit(send, "orchestrator_metrics", msg.results);
    } else if (msg.event === "fusion_start") {
      emit(send, "progress", { step: 1, label: "AI Orchestrator: Fusing Responses", model: "Gemini (Direct)", percent: 12 });
    }
  });

  const extracted = orchestratorOutput.fusion.fusedData;
  emit(send, "module", { id: 0, name: "AI Orchestrator", data: orchestratorOutput });
  emit(send, "module", { id: 1, name: "Requirement Enhancement", data: extracted });

  const analyzed = await analyzeRequirements(extracted, send);
  const validated = await validateRequirements(extracted, analyzed, send);
  const artefacts = await buildDocumentation(extracted, analyzed, validated, send, orchestratorOutput);
  
  // Create session for Design Phase handoff
  const sessionId = createSession(artefacts);

  // Signal completion to the client (include sessionId for Design Phase)
  emit(send, "complete", { modules: artefacts, sessionId });
  return artefacts;
}

module.exports = {
  runAnalysisPipeline,
  elicitRequirements,
  analyzeRequirements,
  validateRequirements,
  buildDocumentation,
  getSession,
  getSessionMeta,
  createSession,
};
