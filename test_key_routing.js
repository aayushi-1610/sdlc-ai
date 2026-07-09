// Verifies all 12 API keys are assigned to distinct modules across Analysis + Design phases
require("dotenv").config();
const {
  getGeminiKeyIndex,
  getMiniMaxKeyIndex,
  getNemotronKeyIndex,
} = require("./server/services/orchestrator");

const ANALYSIS_MODULES = {
  Gemini: ["OrchestratorElicitation", "Analyze", "CostGemini", "FusionResponses"],
  MiniMax: ["OrchestratorValidation", "Validate", "RiskValidate", "CostMiniMax"],
  Nemotron: ["OrchestratorNemotron", "AnalyzeRecommendation", "Feasibility", "RiskIdentify", "CostNemotron"],
};

const DESIGN_MODULES = {
  Gemini: ["HLD", "Database", "UIUX", "ValidationGemini", "ValidationFusion", "Fusion"],
  MiniMax: ["API", "LLD", "ValidationMiniMax"],
  Nemotron: ["Security", "Performance", "Deployment", "ValidationNemotron"],
};

const PARALLEL_GROUPS = [
  { label: "Design Batch 1 (Gemini)", provider: "Gemini", modules: ["HLD", "Database", "UIUX"] },
  { label: "Design Batch 2 (MiniMax)", provider: "MiniMax", modules: ["API", "LLD"] },
  { label: "Design Batch 3 (Nemotron)", provider: "Nemotron", modules: ["Security", "Performance", "Deployment"] },
  { label: "Cost Estimation (all providers)", provider: "mixed", modules: ["CostGemini", "CostMiniMax", "CostNemotron"] },
  { label: "Design Validation (all providers)", provider: "mixed", modules: ["ValidationGemini", "ValidationMiniMax", "ValidationNemotron"] },
];

const getters = {
  Gemini: getGeminiKeyIndex,
  MiniMax: getMiniMaxKeyIndex,
  Nemotron: getNemotronKeyIndex,
};

function keyFor(provider, module) {
  if (module.startsWith("Cost")) {
    if (module.includes("Gemini")) return getGeminiKeyIndex(module);
    if (module.includes("MiniMax")) return getMiniMaxKeyIndex(module);
    return getNemotronKeyIndex(module);
  }
  if (module.startsWith("Validation")) {
    if (module.includes("Gemini")) return getGeminiKeyIndex(module);
    if (module.includes("MiniMax")) return getMiniMaxKeyIndex(module);
    return getNemotronKeyIndex(module);
  }
  return getters[provider](module);
}

console.log("\n============================================");
console.log("   API KEY ROUTING — MODULE ASSIGNMENTS");
console.log("============================================\n");

for (const [provider, modules] of Object.entries({ ...ANALYSIS_MODULES, ...DESIGN_MODULES })) {
  // dedupe by merging - actually print separately
}

console.log("--- Analysis Phase ---");
for (const [provider, modules] of Object.entries(ANALYSIS_MODULES)) {
  console.log(`\n${provider}:`);
  const used = new Set();
  modules.forEach((m) => {
    const idx = getters[provider](m);
    used.add(idx);
    console.log(`  KEY_${idx + 1} ← ${m}`);
  });
  console.log(`  Keys used: ${[...used].map(i => i + 1).sort().join(", ")}/4`);
}

console.log("\n--- Design Phase ---");
for (const [provider, modules] of Object.entries(DESIGN_MODULES)) {
  console.log(`\n${provider}:`);
  const used = new Set();
  modules.forEach((m) => {
    const idx = getters[provider](m);
    used.add(idx);
    console.log(`  KEY_${idx + 1} ← ${m}`);
  });
  console.log(`  Keys used: ${[...used].map(i => i + 1).sort().join(", ")}/4`);
}

console.log("\n--- Parallel Batch Key Conflicts ---");
let conflicts = 0;
PARALLEL_GROUPS.forEach(({ label, modules }) => {
  const indices = modules.map((m) => {
    if (m.startsWith("Cost")) {
      if (m.includes("Gemini")) return `G${getGeminiKeyIndex(m)}`;
      if (m.includes("MiniMax")) return `M${getMiniMaxKeyIndex(m)}`;
      return `N${getNemotronKeyIndex(m)}`;
    }
    if (m.startsWith("Validation")) {
      if (m.includes("Gemini")) return `G${getGeminiKeyIndex(m)}`;
      if (m.includes("MiniMax")) return `M${getMiniMaxKeyIndex(m)}`;
      return `N${getNemotronKeyIndex(m)}`;
    }
    const provider = label.includes("Gemini") ? "Gemini" : label.includes("MiniMax") ? "MiniMax" : label.includes("Nemotron") ? "Nemotron" : null;
    if (provider) return `${provider[0]}${getters[provider](m)}`;
    return "?";
  });
  const sameProviderIndices = {};
  modules.forEach((m, i) => {
    const tag = indices[i];
    const prov = tag[0];
    const idx = tag.slice(1);
    if (!sameProviderIndices[prov]) sameProviderIndices[prov] = [];
    sameProviderIndices[prov].push({ module: m, idx });
  });
  let groupOk = true;
  Object.entries(sameProviderIndices).forEach(([prov, entries]) => {
    const idxSet = entries.map(e => e.idx);
    const unique = new Set(idxSet);
    if (unique.size < idxSet.length) {
      groupOk = false;
      conflicts++;
      console.log(`  ✗ ${label}: duplicate ${prov} key index among ${entries.map(e => e.module).join(", ")}`);
    }
  });
  if (groupOk) console.log(`  ✓ ${label}: ${modules.map((m, i) => `${m}→${indices[i]}`).join(", ")}`);
});

console.log(`\n${conflicts === 0 ? "All parallel batches use distinct keys per provider." : `${conflicts} conflict(s) found.`}`);
console.log("============================================\n");
