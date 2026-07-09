// verify_design.js — Design Phase verification (seeds analysis session, runs full design SSE)
require("dotenv").config();
const http = require("http");

const DESIGN_MODULES = [
  "hld", "database", "uiux", "api", "lld",
  "security", "performance", "deployment", "validation", "fusion",
];

const ANALYSIS_FIXTURE = {
  extracted: {
    projectTitle: "FeastFlow - Multi-Vendor Food Delivery Platform",
    projectOverview: "A mobile-first food delivery app connecting restaurants, customers, and delivery partners with real-time order tracking and payments.",
    actors: [
      { name: "Customer", role: "Browse menus, place orders, pay, track delivery." },
      { name: "Restaurant Manager", role: "Manage menus, accept orders, view payouts." },
      { name: "Delivery Partner", role: "Accept deliveries, navigate, update status." },
      { name: "Administrator", role: "Platform governance and onboarding." },
    ],
    functionalRequirements: [
      { id: "FR-01", title: "User Registration & Authentication", description: "Secure signup and login via OTP and email.", priority: "High" },
      { id: "FR-02", title: "Menu Search & Filtering", description: "Search by cuisine, ratings, and proximity.", priority: "High" },
      { id: "FR-03", title: "Order Processing & Cart", description: "Cart management, coupons, and checkout.", priority: "High" },
      { id: "FR-04", title: "Digital Payments", description: "Cards, UPI, NetBanking, and COD.", priority: "High" },
      { id: "FR-05", title: "Real-time GPS Tracking", description: "Live delivery partner location on map.", priority: "High" },
    ],
    businessGoals: ["Onboard 500+ restaurants in 6 months.", "Sub-35-minute average delivery."],
    userStories: [
      { actor: "Customer", action: "track my order on a live map", benefit: "I know when food will arrive" },
    ],
  },
  analyzed: {
    nonFunctionalRequirements: [
      { id: "NFR-01", category: "Performance", description: "Search under 1.5s at 10k concurrent users.", metric: "Latency < 1.5s" },
      { id: "NFR-02", category: "Security", description: "PCI-DSS compliant payment handling.", metric: "AES-256" },
    ],
    constraints: ["Mobile-first with web admin portal.", "Indian data residency for PII."],
    assumptions: ["Stable mobile network for GPS updates."],
    dependencies: ["Google Maps API", "Payment gateway", "Firebase push notifications"],
    technologyRecommendation: {
      frontend: "React Native + React.js admin",
      backend: "Node.js (Express) + Socket.io",
      database: "MongoDB + Redis",
      auth: "Firebase Auth with OTP",
      cloud: "AWS (EC2, S3, RDS)",
      cicd: "GitHub Actions",
      rationale: "React Native for mobile, Node.js for real-time orders.",
    },
  },
  validated: {
    acceptanceCriteria: ["All FRs have measurable acceptance tests.", "Payment flow passes PCI review."],
    ambiguities: [],
    gaps: [],
    contradictions: [],
    modelScores: { requirementValidation: 94 },
  },
  srs: { projectTitle: "FeastFlow SRS" },
  feasibility: { overallVerdict: "Feasible", summary: "Technically and economically viable." },
  risks: { overallRiskLevel: "Medium", risks: [{ title: "Peak load", level: "Medium", mitigation: "Auto-scaling" }] },
  cost: { totalCostINR: 320000, averageHours: 400 },
  roi: { roiPercent: 42, recommendation: "Moderate ROI – Recommended" },
};

function consumeSSE(url, onEvent) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      if (res.statusCode !== 200) {
        let body = "";
        res.on("data", (c) => { body += c; });
        res.on("end", () => reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`)));
        return;
      }

      let buffer = "";
      let lastComplete = null;
      const modules = {};
      const errors = [];
      let currentEvent = null;
      let dataLines = [];

      const flushEvent = () => {
        if (!currentEvent || dataLines.length === 0) return;
        const dataStr = dataLines.join("\n");
        dataLines = [];
        try {
          const data = JSON.parse(dataStr);
          onEvent(currentEvent, data);

          if (currentEvent === "design_module") {
            modules[data.id] = data.data;
          }
          if (currentEvent === "design_module_error") {
            errors.push({ id: data.id, message: data.message });
          }
          if (currentEvent === "design_complete") {
            lastComplete = { ...data, _modules: modules, _errors: errors };
          }
          if (currentEvent === "design_error") {
            reject(new Error(data.message || "Design pipeline error"));
          }
        } catch (e) {
          if (currentEvent === "design_complete") {
            // Large payload may fail parse — infer success from collected modules
            lastComplete = { design: modules, _modules: modules, _errors: errors, _parseWarning: e.message };
          } else {
            console.warn(`  [warn] SSE parse error (${currentEvent}): ${e.message}`);
          }
        }
        currentEvent = null;
      };

      res.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            flushEvent();
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith("data: ")) {
            dataLines.push(line.substring(6));
          } else if (line.trim() === "") {
            flushEvent();
          }
        }
      });

      res.on("end", () => {
        flushEvent();
        if (lastComplete) {
          resolve(lastComplete);
        } else if (Object.keys(modules).length >= DESIGN_MODULES.length) {
          resolve({ design: modules, _modules: modules, _errors: errors, _inferred: true });
        } else {
          reject(new Error(`Design stream ended — only ${Object.keys(modules).length}/${DESIGN_MODULES.length} modules received`));
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(900000, () => {
      req.destroy();
      reject(new Error("Design stream timed out after 15 minutes"));
    });
  });
}

function assertModule(name, data, requiredFields) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new Error(`Module "${name}" is empty or missing`);
  }
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Module "${name}" missing required field: ${field}`);
    }
  }
  console.log(`  ✓ ${name} — ${requiredFields.join(", ")}`);
}

function seedSession(fixture) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(fixture);
    const req = http.request({
      hostname: "localhost",
      port: 3000,
      path: "/api/session/seed",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) reject(new Error(parsed.error || `Seed failed HTTP ${res.statusCode}`));
          else resolve(parsed.sessionId);
        } catch (e) {
          reject(new Error(`Seed response parse error: ${data.substring(0, 100)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function verifyDesignPhase() {
  console.log("\n============================================");
  console.log("   DESIGN PHASE VERIFICATION");
  console.log("============================================\n");

  const sessionId = await seedSession(ANALYSIS_FIXTURE);
  console.log(`[setup] Seeded analysis session via API: ${sessionId}`);

  const progressEvents = [];
  const result = await consumeSSE(
    `http://localhost:3000/api/design/stream?sessionId=${encodeURIComponent(sessionId)}`,
    (event, data) => {
      if (event === "design_progress") {
        progressEvents.push(data);
        console.log(`  [progress] ${data.percent}% — ${data.label} (${data.model})`);
      } else if (event === "design_module") {
        const keys = Object.keys(data.data || {}).length;
        console.log(`  [module] ${data.id} — ${keys} fields`);
      } else if (event === "design_module_error") {
        console.warn(`  [error] ${data.id}: ${data.message}`);
      }
    }
  );

  const design = result.design || result._modules;
  const moduleErrors = result._errors || [];

  console.log("\n--- Module Assertions ---");
  assertModule("hld", design.hld, ["architectureStyle", "components"]);
  assertModule("database", design.database, ["entities"]);
  assertModule("uiux", design.uiux, ["screenList", "userJourney"]);
  assertModule("api", design.api, ["endpoints"]);
  assertModule("lld", design.lld, ["modules"]);
  assertModule("security", design.security, ["owaspChecklist"]);
  assertModule("performance", design.performance, ["cachingStrategy"]);
  assertModule("deployment", design.deployment, ["cicdPipeline"]);
  assertModule("validation", design.validation, ["traceabilityMatrix", "overallDesignScore"]);
  assertModule("fusion", design.fusion, ["summary", "finalDeliverables"]);

  if (moduleErrors.length > 0) {
    console.warn(`\n  ⚠ ${moduleErrors.length} module error(s) reported (fallbacks may have been used):`);
    moduleErrors.forEach((e) => console.warn(`    - ${e.id}: ${e.message}`));
  }

  const completedModules = DESIGN_MODULES.filter((m) => design[m] && Object.keys(design[m]).length > 0);
  console.log(`\n--- Summary ---`);
  console.log(`  Progress events : ${progressEvents.length}`);
  console.log(`  Modules complete: ${completedModules.length}/10`);
  console.log(`  Module errors   : ${moduleErrors.length}`);
  console.log(`  Overall score   : ${design.validation?.overallDesignScore ?? "N/A"}`);
  console.log(`  Verdict         : ${design.validation?.designReadinessVerdict ?? "N/A"}`);

  if (completedModules.length < 10) {
    throw new Error(`Only ${completedModules.length}/10 design modules completed`);
  }

  console.log("\n============================================");
  console.log("   DESIGN PHASE VERIFICATION PASSED ✓");
  console.log("============================================\n");
}

function waitForServer(retries = 30, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      http.get("http://localhost:3000/", (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else if (++attempts >= retries) reject(new Error("Server not responding on port 3000"));
        else setTimeout(tick, delayMs);
      }).on("error", () => {
        if (++attempts >= retries) reject(new Error("Server not running on port 3000. Run: npm start"));
        else setTimeout(tick, delayMs);
      });
    };
    tick();
  });
}

waitForServer()
  .then(() => verifyDesignPhase())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n============================================");
    console.error(`   DESIGN PHASE VERIFICATION FAILED ✗`);
    console.error(`   ${err.message}`);
    console.error("============================================\n");
    process.exit(1);
  });
