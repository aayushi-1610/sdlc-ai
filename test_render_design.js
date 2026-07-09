// test_render_design.js — verifies all design tab renderers produce valid HTML
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const renderCode = fs.readFileSync(path.join(__dirname, "public/js/designRender.js"), "utf8");
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(renderCode, ctx);

const mock = {
  hld: {
    architectureStyle: "Microservices",
    architectureDiagram: "Client → API → DB",
    components: [{ name: "API Gateway", type: "Gateway", technology: "Node.js", responsibilities: ["Route requests"] }],
    dataFlowDiagram: "Client → API → Service → DB",
    technologyDecisions: [{ decision: "Use REST", rationale: "Simplicity", tradeoff: "Less flexible" }],
    moduleList: ["Auth", "Orders"],
    externalIntegrations: ["Stripe", "Google Maps"],
  },
  database: {
    erDiagram: "User ||--o{ Order",
    entities: [{ name: "User", primaryKey: "id", attributes: ["email"], description: "App users" }],
    relationships: [{ from: "User", to: "Order", type: "1:N", description: "places" }],
    schema: "CREATE TABLE users (id UUID PRIMARY KEY);",
    dataDictionary: [{ table: "users", columns: [{ name: "email", type: "VARCHAR", nullable: false, description: "Email" }] }],
  },
  uiux: {
    navigationFlow: "Splash → Login → Home",
    screenList: ["Splash", "Login", "Home", "Checkout"],
    userJourney: [{ step: 1, screen: "Login", action: "Sign in", outcome: "Authenticated" }],
    wireframes: [{ screen: "Login", layout: "Centered form", keyComponents: ["Email input"], interactions: ["Tap submit"] }],
    designSystem: { colorPalette: [{ name: "Primary", hex: "#00D4FF", usage: "CTAs" }], typography: { heading: "24px" }, components: ["Button"] },
    accessibilityGuidelines: ["WCAG 2.1 AA contrast"],
  },
  api: {
    authenticationFlow: "JWT Bearer token in Authorization header",
    endpoints: [{ method: "POST", path: "/api/orders", description: "Create order", auth: true, statusCodes: ["201", "400"] }],
    rateLimiting: "100 req/min per IP",
    openAPISpec: { openapi: "3.0.0", info: { title: "API" } },
  },
  lld: {
    modules: [{ name: "OrderService", responsibilities: ["Process orders"], inputs: ["orderDTO"], outputs: ["orderId"], businessLogic: "Validate and persist", errorHandling: ["400 Bad Request"] }],
    classDiagram: "class OrderService",
    sequenceDiagram: "Client->API: POST /orders",
    algorithms: [{ name: "PriceCalc", pseudocode: "total = sum(items.price)" }],
  },
  security: {
    securityArchitecture: { authentication: "JWT", authorization: "RBAC", jwtFlow: "Login → token → API" },
    threatModel: [{ threat: "SQL Injection", vector: "Input fields", likelihood: "Medium", impact: "High", mitigation: "Parameterized queries" }],
    owaspChecklist: [{ id: "A01", title: "Broken Access Control", status: "Mitigated", notes: "RBAC enforced" }],
  },
  performance: {
    targetMetrics: { p95Latency: "< 200ms", availability: "99.9%" },
    cachingStrategy: [{ layer: "Redis", cacheDuration: "5 min", targets: "sessions", tool: "ElastiCache" }],
    loadBalancing: { strategy: "Round-robin", tool: "ALB" },
  },
  deployment: {
    cicdPipeline: { tool: "GitHub Actions", stages: [{ name: "Build & Test", steps: ["npm ci", "npm test", "docker build"] }] },
    infrastructure: { provider: "AWS", regions: ["ap-south-1"] },
  },
  validation: {
    traceabilityMatrix: [{ requirementId: "FR-01", requirementTitle: "User login", designModule: "API", apiEndpoint: "POST /auth/login", status: "Covered", confidence: 95 }],
    overallDesignScore: 92,
    designReadinessVerdict: "Design Approved",
    qualityChecklist: [{ item: "All FRs traced", status: true }],
  },
  fusion: {
    summary: "Comprehensive design document synthesized from all modules.",
    finalDeliverables: ["HLD Document", "API Spec", "Security Architecture"],
    confidenceScores: { overall: 92, hld: 94, api: 90 },
  },
};

const designData = { ...mock };

const tests = [
  { fn: "renderDesignOverview", args: [designData], tab: "design-overview" },
  { fn: "renderDesignHLD", args: [mock.hld], tab: "design-hld" },
  { fn: "renderDesignDatabase", args: [mock.database], tab: "design-database" },
  { fn: "renderDesignUIUX", args: [mock.uiux], tab: "design-uiux" },
  { fn: "renderDesignAPI", args: [mock.api], tab: "design-api" },
  { fn: "renderDesignLLD", args: [mock.lld], tab: "design-lld" },
  { fn: "renderDesignSecurity", args: [mock.security], tab: "design-security" },
  { fn: "renderDesignPerformance", args: [mock.performance], tab: "design-performance" },
  { fn: "renderDesignDeployment", args: [mock.deployment], tab: "design-deployment" },
  { fn: "renderDesignValidation", args: [mock.validation], tab: "design-validation" },
  { fn: "renderDesignFusion", args: [mock.fusion], tab: "design-fusion" },
];

console.log("\n============================================");
console.log("   DESIGN RENDER SMOKE TEST");
console.log("============================================\n");

let passed = 0;
let failed = 0;

for (const t of tests) {
  try {
    if (typeof ctx[t.fn] !== "function") {
      throw new Error(`${t.fn} is not defined`);
    }
    const html = ctx[t.fn](...t.args);
    if (!html || typeof html !== "string") throw new Error("returned empty or non-string");
    if (!html.includes(`id="tab-${t.tab}"`)) throw new Error(`missing tab pane id tab-${t.tab}`);
    if (!html.includes("pane-title")) throw new Error("missing pane-title");
    if (html.length < 200) throw new Error(`HTML too short (${html.length} chars)`);
    console.log(`  ✓  ${t.fn.padEnd(26)} → ${html.length} chars, tab-${t.tab} OK`);
    passed++;
  } catch (err) {
    console.log(`  ✗  ${t.fn.padEnd(26)} → ${err.message}`);
    failed++;
  }
}

// Simulate buildDesignView join (what design.js does)
try {
  const combined = tests.map(t => ctx[t.fn](...t.args)).join("");
  const paneCount = (combined.match(/id="tab-design-/g) || []).length;
  if (paneCount !== 11) throw new Error(`expected 11 tab panes, got ${paneCount}`);
  console.log(`\n  ✓  buildDesignView simulation → ${paneCount} tab panes, ${combined.length} total chars`);
  passed++;
} catch (err) {
  console.log(`\n  ✗  buildDesignView simulation → ${err.message}`);
  failed++;
}

console.log("\n============================================");
console.log(`  Result: ${failed === 0 ? "ALL PASSED ✓" : `${failed} FAILED ✗`}  (${passed} checks)`);
console.log("============================================\n");

process.exit(failed > 0 ? 1 : 0);
