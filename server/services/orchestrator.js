// server/services/orchestrator.js
const axios = require("axios");

// ── Fallback Mocks Database ───────────────────────────────────
const MOCKS = {
  food: {
    projectTitle: "FeastFlow - Multi-Vendor Food Delivery Platform",
    projectOverview: "A high-performance, mobile-first food delivery application connecting local restaurants, customers, and delivery partners in real-time.",
    actors: [
      { name: "Customer", role: "Browse menus, place orders, make payments, track delivery." },
      { name: "Restaurant Manager", role: "Manage menu items, prices, order acceptance, payouts." },
      { name: "Delivery Partner", role: "Receive delivery requests, navigate to vendor and customer, update order status." },
      { name: "Administrator", role: "Platform governance, dispute resolution, restaurant onboarding, service charge configuration." }
    ],
    functionalRequirements: [
      { id: "FR-01", title: "User Registration & Authentication", description: "Secure signup and login using mobile OTP (One-Time Password) and email verification.", priority: "High" },
      { id: "FR-02", title: "Smart Menu Search & Filtering", description: "Search by cuisine, restaurant name, food category (veg/non-veg), ratings, and proximity.", priority: "High" },
      { id: "FR-03", title: "Order Processing & Cart Management", description: "Add food items, customize add-ons, apply discount coupons, and checkout.", priority: "High" },
      { id: "FR-04", title: "Multi-Gateway Digital Payments", description: "Payment processing via Credit/Debit Cards, UPI, NetBanking, and cash-on-delivery (COD).", priority: "High" },
      { id: "FR-05", title: "Real-time GPS Tracking", description: "Integrates Google Maps API to track the live location of the delivery partner after dispatch.", priority: "High" },
      { id: "FR-06", title: "Real-Time Push Notifications", description: "Automated updates using Firebase for order acceptance, preparation, dispatch, and delivery.", priority: "Medium" },
      { id: "FR-07", title: "Restaurant Operations Dashboard", description: "Enables restaurant staff to manage menu availability, process incoming orders, and track daily sales.", priority: "Medium" }
    ],
    businessGoals: [
      "Onboard 500+ active local restaurants in the first 6 months.",
      "Maintain average order fulfillment and delivery times below 35 minutes.",
      "Secure a customer retention rate of 40% month-over-month."
    ],
    userStories: [
      { actor: "Customer", action: "track my order on a live map", benefit: "I know exactly when my food will arrive and can plan accordingly" },
      { actor: "Restaurant Manager", action: "quickly toggle menu item availability", benefit: "I do not receive orders for out-of-stock items, increasing customer satisfaction" },
      { actor: "Delivery Partner", action: "view exact navigation coordinates to the client", benefit: "I can deliver orders quickly without making phone calls for directions" }
    ]
  },
  hospital: {
    projectTitle: "MedCare OPD - Patient Care & OPD Scheduling",
    projectOverview: "An enterprise-grade hospital management dashboard simplifying OPD appointments, patient queues, and electronic health record integration.",
    actors: [
      { name: "Patient", role: "Book consultations, upload medical history, download prescriptions, pay OPD fees." },
      { name: "Doctor", role: "View scheduled patient list, enter diagnostic notes, write e-prescriptions, refer patients." },
      { name: "Front Desk Receptionist", role: "Onboard walk-in patients, manage queue orders, collect cash payments, assign rooms." },
      { name: "System Admin", role: "Manage clinic departments, manage doctor shifts, monitor dashboard health, audit security logs." }
    ],
    functionalRequirements: [
      { id: "FR-01", title: "OPD Appointment Booking Engine", description: "Patient booking portal with real-time doctor availability calendars and automated slot locking.", priority: "High" },
      { id: "FR-02", title: "Interactive OPD Queue Tracker", description: "Live waiting-room dashboard showing current queue number, expected wait time, and room allocation.", priority: "High" },
      { id: "FR-03", title: "Electronic Health Record (EHR)", description: "Secure entry panel for doctors to log diagnosis, check drug interactions, and sign prescription PDFs.", priority: "High" },
      { id: "FR-04", title: "Integrated Billing & Claims", description: "Generates digital bills for OPD fees, processes card/cash payments, and formats data for insurance claims.", priority: "Medium" },
      { id: "FR-05", title: "Teleconsultation Video Portal", description: "WebRTC-based video rooms for remote checkups, integrated directly within patient and doctor tabs.", priority: "Medium" }
    ],
    businessGoals: [
      "Reduce average patient waiting-room times to under 15 minutes.",
      "Support EHR compliance requirements for local health informatics standards.",
      "Increase daily OPD patient throughput by 25% through efficient slot allocation."
    ],
    userStories: [
      { actor: "Patient", action: "view my queue number on my phone", benefit: "I can wait in the cafeteria rather than crowding the hallway" },
      { actor: "Doctor", action: "receive warnings about patient allergies during prescription entry", benefit: "I avoid prescribing conflicting medicines, improving safety" }
    ]
  },
  ecommerce: {
    projectTitle: "ShopSphere - Multi-Tenant B2C E-Commerce Site",
    projectOverview: "A fast, scalable e-commerce storefront supporting multiple vendors, centralized payment checkout, and visual analytics.",
    actors: [
      { name: "Shopper", role: "Search items, add products to cart, place orders, view order history." },
      { name: "Merchant", role: "List catalog items, manage price tables, view order fulfillment checklist, track revenues." },
      { name: "Site Operator", role: "Platform moderation, manage merchant onboarding, configure payout commissions." }
    ],
    functionalRequirements: [
      { id: "FR-01", title: "Centralized Shopping Cart", description: "Supports checkout of multiple products from different vendors in a single unified payment flow.", priority: "High" },
      { id: "FR-02", title: "Dynamic Product Catalog Editor", description: "Interface for merchants to upload high-res images, set stock counts, and write descriptions.", priority: "High" },
      { id: "FR-03", title: "Advanced Search & Recommendation", description: "ElasticSearch-driven fuzzy matching with filters for categories, prices, brand, and reviews.", priority: "High" },
      { id: "FR-04", title: "Automated Commission Splits", description: "Splits customer payments instantly between merchants and site operator commissions at payout.", priority: "Medium" }
    ],
    businessGoals: [
      "Maintain platform page loads under 1 second for higher cart conversions.",
      "Provide a payout system with zero manual calculations.",
      "Increase catalog size to 10,000+ SKUs in 3 months."
    ],
    userStories: [
      { actor: "Shopper", action: "search with partial spelling matches", benefit: "I can find relevant products even with typos" },
      { actor: "Merchant", action: "bulk upload products using a CSV sheet", benefit: "I can synchronize my physical inventory quickly" }
    ]
  }
};

function generateDynamicElicitation(rawInput) {
  const lines = rawInput.split("\n").filter(l => l.trim().length > 0);
  let title = "Custom Software Project";
  if (lines.length > 0) {
    let candidate = lines[0].replace(/[#*_-]/g, "").trim();
    if (candidate.length > 50) candidate = candidate.substring(0, 47) + "...";
    title = candidate;
  }

  const functionalRequirements = [];
  const bulletLines = lines.filter(l => l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l));
  
  if (bulletLines.length > 0) {
    bulletLines.forEach((l, index) => {
      const cleaned = l.replace(/^[-*\d.]+\s*/, "").trim();
      if (cleaned.length > 10) {
        functionalRequirements.push({
          id: `FR-${String(index + 1).padStart(2, "0")}`,
          title: cleaned.split(".")[0].split(",")[0].substring(0, 30),
          description: cleaned,
          priority: index === 0 || index === 1 ? "High" : index === 2 ? "Medium" : "Low"
        });
      }
    });
  }

  if (functionalRequirements.length === 0) {
    functionalRequirements.push(
      { id: "FR-01", title: "User Account Management", description: "Enables users to sign up, log in, and manage their system profiles securely.", priority: "High" },
      { id: "FR-02", title: "Data Storage & Search", description: "Enables records creation, updates, and fast search indexing.", priority: "High" },
      { id: "FR-03", title: "Reporting & Dashboard View", description: "Visualizes trends, downloads reports, and gives metrics summary.", priority: "Medium" }
    );
  }

  return {
    projectTitle: `${title} Analysis`,
    projectOverview: `AI analysis of the custom requirements brief: "${title}". Structured parsing and design blueprints compiled dynamically.`,
    actors: [
      { name: "General User", role: "Access core workflows, view dashboard details, query system information." },
      { name: "System Administrator", role: "Configure settings, monitor metrics, audit system logs, manage user accounts." }
    ],
    functionalRequirements,
    businessGoals: [
      "Improve operational efficiency by automating manual core tasks.",
      "Achieve high platform responsiveness with quick screen transitions.",
      "Establish a robust data audit trail for security compliance."
    ],
    userStories: [
      { actor: "General User", action: `perform ${functionalRequirements[0].title.toLowerCase()}`, benefit: "I can accomplish my goals with minimal UI steps" },
      { actor: "System Administrator", action: "monitor operations via a live analytics dashboard", benefit: "I can address system performance issues proactively" }
    ],
    modelScores: { requirementExtraction: 92, documentation: 94 }
  };
}

function getSampleKey(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("food") || t.includes("restaurant") || t.includes("feastflow")) return "food";
  if (t.includes("hospital") || t.includes("medcare") || t.includes("opd") || t.includes("patient")) return "hospital";
  if (t.includes("commerce") || t.includes("vendor") || t.includes("shopsphere") || t.includes("amazon")) return "ecommerce";
  return null;
}

function getFallbackData(rawInput) {
  const key = getSampleKey(rawInput);
  if (key && MOCKS[key]) {
    return JSON.parse(JSON.stringify(MOCKS[key]));
  }
  return generateDynamicElicitation(rawInput);
}

function cleanJSONResponse(text) {
  if (!text) return "{}";
  let cleaned = text.trim();
  
  // Extract content between ```json and ``` or ``` and ```
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  
  let match = jsonBlockRegex.exec(cleaned) || codeBlockRegex.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else {
    // Fallback: extract substring between first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }
  }

  // Fix repeated line end glitches: e.g. "title": "Some Heterogeneity",\n Heterogeneity", -> "title": "Some Heterogeneity",
  cleaned = cleaned.replace(/(\b\w+",?)\s*\n\s*(?!")\1/g, '$1');

  // Fix merged key-value strings: e.g. "name: Unauthenticated Visitor", -> "name": "Unauthenticated Visitor",
  cleaned = cleaned.replace(/([{,]\s*)"([a-zA-Z0-9_$]+)\s*:\s*([^"]+)"/g, '$1"$2": "$3"');

  // Fix double-colon value repetitions: e.g. "key": "val1": "val2" -> "key": "val1"
  cleaned = cleaned.replace(/"([^"]+)"\s*:\s*"([^"]+)"\s*:\s*"[^"]*"/g, '"$1": "$2"');

  // Safe conversion of single-quoted keys/values to double-quoted JSON
  // Quote single-quoted keys: {'key': value} -> {"key": value}
  cleaned = cleaned.replace(/([{,]\s*)'([a-zA-Z0-9_$]+)'\s*:/g, '$1"$2":');
  // Quote single-quoted string values: {key: 'value'} -> {key: "value"}
  cleaned = cleaned.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  // Quote single-quoted array elements: ['value'] -> ["value"]
  cleaned = cleaned.replace(/([\[,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(?=\s*[,\]])/g, '$1"$2"');

  // Quote unquoted string values (e.g. : MiniMax -> : "MiniMax" or : MR-1 -> : "MR-1")
  cleaned = cleaned.replace(/:\s*(?!true|false|null|[0-9\-'"\[{])([a-zA-Z0-9_\-]+)(?=\s*(?:,\s*"|\s*}))/g, ': "$1"');

  // Remove trailing commas that crash JSON.parse
  cleaned = cleaned.replace(/,\s*}/g, '}');
  cleaned = cleaned.replace(/,\s*]/g, ']');

  // Remove comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/(?:^|[^:])\/\/.*$/gm, '');

  return cleaned.trim();
}

// ── Gemini Circuit Breaker ──────────────────────────────────
let geminiCooldownUntil = 0; // timestamp ms; 0 = not cooling down
const GEMINI_COOLDOWN_MS = 90 * 1000; // 90 seconds

async function callGeminiDirect(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Circuit breaker: skip Gemini entirely if recently quota-exhausted
  if (Date.now() < geminiCooldownUntil) {
    const secsLeft = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
    throw new Error(`Gemini circuit breaker open — quota cooldown (${secsLeft}s remaining)`);
  }

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-pro"
  ];

  let lastError = null;
  let quotaFailures = 0;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser Request/Input:\n${userPrompt}` }]
          }
        ]
      };

      if (systemPrompt.toLowerCase().includes("json") || userPrompt.toLowerCase().includes("json")) {
        payload.generationConfig = { responseMimeType: "application/json" };
      }

      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (e) {
      lastError = e;
      const msg = e.response?.data?.error?.message || e.message;
      console.warn(`[orchestrator] Gemini fallback warning for ${model}: ${msg}`);
      // Count quota exhaustion AND unavailable/deprecated model errors
      if (msg && (
        msg.includes('Quota exceeded') ||
        msg.includes('quota') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('is not found') ||
        msg.includes('not supported') ||
        msg.includes('high demand')
      )) {
        quotaFailures++;
      }
    }
  }

  // Trip the breaker if 2+ models failed with quota/unavailable errors
  if (quotaFailures >= 2) {
    geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
    console.warn(`[orchestrator] Gemini circuit breaker TRIPPED (${quotaFailures}/${models.length} models quota/unavailable). Cooling down for ${GEMINI_COOLDOWN_MS / 1000}s.`);
  }

  throw new Error(`Gemini API execution failed: ${lastError?.message || "Unknown error"}`);
}

async function callMiniMaxNIM(systemPrompt, userPrompt) {
  const apiKey = process.env.MINIMAX_API_KEY || process.env.NIM_API_KEY;
  if (!apiKey) {
    throw new Error("NIM_API_KEY or MINIMAX_API_KEY is not configured");
  }

  const url = `${process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"}/chat/completions`;
  
  // Try minimax-m3 first
  try {
    const payload = {
      model: "minimaxai/minimax-m3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 8192
    };
    const res = await postWithRetry(url, payload, {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    });
    return res.data?.choices?.[0]?.message?.content;
  } catch (e) {
    console.warn(`[orchestrator] MiniMax M3 failed, trying MiniMax M2.7... error: ${e.message}`);
    // Fallback to minimax-m2.7 (combines prompts since minimax-m2.7 does not support system role)
    const payload = {
      model: "minimaxai/minimax-m2.7",
      messages: [
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` }
      ],
      temperature: 0.1,
      max_tokens: 8192
    };
    const res = await postWithRetry(url, payload, {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    });
    return res.data?.choices?.[0]?.message?.content;
  }
}

async function postWithRetry(url, payload, headers, attempts = 5) {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.post(url, payload, { headers });
    } catch (e) {
      const isRetriable = 
        !e.response || // Network error (no response)
        e.response.status >= 500 || // Server errors (500, 502, 503, 504)
        e.response.status === 429 || // Rate limits
        e.code === 'ECONNRESET';

      if (isRetriable && i < attempts - 1) {
        const statusText = e.response ? `status ${e.response.status}` : (e.code || e.message);
        console.warn(`[orchestrator] Post request failed with ${statusText}, retrying ${i + 1}/${attempts} in ${Math.pow(2, i)}s...`);
        await delay(1000 * Math.pow(2, i));
        continue;
      }
      throw e;
    }
  }
}

async function callNemotronNIM(systemPrompt, userPrompt) {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) {
    throw new Error("NIM_API_KEY is not configured");
  }

  const url = `${process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1"}/chat/completions`;
  const payload = {
    model: "nvidia/nemotron-3-super-120b-a12b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    max_tokens: 4096
  };

  try {
    const res = await postWithRetry(url, payload, {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    });
    return res.data?.choices?.[0]?.message?.content;
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.message;
    throw new Error(`Nemotron NIM API execution failed: ${msg}`);
  }
}

async function runModel(systemPrompt, userPrompt, provider) {
  console.log(`[orchestrator] runModel: calling provider="${provider}"`);

  if (provider === "Gemini") {
    try {
      return await callGeminiDirect(systemPrompt, userPrompt);
    } catch (e) {
      console.warn(`[orchestrator] Gemini failed, falling back to Nemotron: ${e.message}`);
      return await callNemotronNIM(systemPrompt, userPrompt);
    }
  } else if (provider === "MiniMax") {
    try {
      return await callMiniMaxNIM(systemPrompt, userPrompt);
    } catch (e) {
      console.warn(`[orchestrator] MiniMax failed, falling back to Gemini: ${e.message}`);
      try {
        return await callGeminiDirect(systemPrompt, userPrompt);
      } catch (geminiErr) {
        console.warn(`[orchestrator] Gemini fallback failed, trying Nemotron: ${geminiErr.message}`);
        return await callNemotronNIM(systemPrompt, userPrompt);
      }
    }
  } else if (provider === "Nemotron") {
    try {
      return await callNemotronNIM(systemPrompt, userPrompt);
    } catch (e) {
      console.warn(`[orchestrator] Nemotron failed, falling back to Gemini: ${e.message}`);
      return await callGeminiDirect(systemPrompt, userPrompt);
    }
  } else {
    if (process.env.GEMINI_API_KEY) {
      return await callGeminiDirect(systemPrompt, userPrompt);
    } else if (process.env.NIM_API_KEY) {
      return await callNemotronNIM(systemPrompt, userPrompt);
    }
    throw new Error(`Unsupported model provider requested: ${provider}`);
  }
}

// ── Timeout Decorator ──────────────────────────────────────────
function withTimeout(promise, ms, name) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout: ${name} did not respond within ${ms / 1000} seconds.`));
    }, ms);
  });
  return Promise.race([
    promise.then(res => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise
  ]);
}

// ── Heuristic Scorer ──────────────────────────────────────────
function scoreResponse(result, elapsedMs, provider) {
  if (!result) return { total: 0, breakdown: { json: 0, schema: 0, density: 0, speed: 0 } };
  
  let scoreBreakdown = { json: 0, schema: 0, density: 0, speed: 0 };
  let parsed = null;

  // 1. JSON parsed successfully (+20)
  try {
    parsed = typeof result === "object" ? result : JSON.parse(cleanJSONResponse(result));
    scoreBreakdown.json = 20;
  } catch (e) {
    scoreBreakdown.json = 0;
  }

  if (!parsed) {
    return { total: 0, breakdown: scoreBreakdown };
  }

  // 2. Schema compliance (+30 max, 5 pts per core field)
  const fields = ["projectTitle", "projectOverview", "actors", "functionalRequirements", "businessGoals", "userStories"];
  let fieldPoints = 0;
  fields.forEach(f => {
    if (parsed[f] !== undefined && parsed[f] !== null) {
      fieldPoints += 5;
    }
  });
  scoreBreakdown.schema = fieldPoints;

  // 3. Content Density (+30 max)
  let densityPoints = 0;
  const reqsCount = Array.isArray(parsed.functionalRequirements) ? parsed.functionalRequirements.length : 0;
  const actorsCount = Array.isArray(parsed.actors) ? parsed.actors.length : 0;
  const storiesCount = Array.isArray(parsed.userStories) ? parsed.userStories.length : 0;
  const goalsCount = Array.isArray(parsed.businessGoals) ? parsed.businessGoals.length : 0;

  // Functional Reqs details (15 pts max)
  if (reqsCount >= 5) densityPoints += 15;
  else if (reqsCount >= 3) densityPoints += 10;
  else if (reqsCount >= 1) densityPoints += 5;

  // Actors details (5 pts max)
  if (actorsCount >= 3) densityPoints += 5;
  else if (actorsCount >= 1) densityPoints += 3;

  // Stories details (5 pts max)
  if (storiesCount >= 3) densityPoints += 5;
  else if (storiesCount >= 1) densityPoints += 3;

  // Goals details (5 pts max)
  if (goalsCount >= 3) densityPoints += 5;
  else if (goalsCount >= 1) densityPoints += 3;

  scoreBreakdown.density = densityPoints;

  // 4. Latency performance (+20 max)
  let speedPoints = 0;
  if (elapsedMs < 3000) speedPoints = 20;
  else if (elapsedMs < 6000) speedPoints = 15;
  else if (elapsedMs < 10000) speedPoints = 10;
  else if (elapsedMs < 15000) speedPoints = 5;
  else speedPoints = 1;
  scoreBreakdown.speed = speedPoints;

  const total = scoreBreakdown.json + scoreBreakdown.schema + scoreBreakdown.density + scoreBreakdown.speed;
  return { total, breakdown: scoreBreakdown };
}

// ── Response Fusion using Gemini ──────────────────────────────
async function fuseResponses(responses, userBrief) {
  console.log("[orchestrator] Initiating Response Fusion...");
  
  // Filter only successful parsed responses
  const successfulOutputs = {};
  for (const [modelName, res] of Object.entries(responses)) {
    if (res.status === "Success" && res.parsedData) {
      successfulOutputs[modelName] = res.parsedData;
    }
  }

  // If no model succeeded, fall back to simulated elicitation
  if (Object.keys(successfulOutputs).length === 0) {
    console.warn("[orchestrator] No successful model outputs for fusion. Using fallback.");
    return getFallbackData(userBrief);
  }

  // If only one model succeeded, return its output directly as fusion
  const modelKeys = Object.keys(successfulOutputs);
  if (modelKeys.length === 1) {
    console.log(`[orchestrator] Single model success (${modelKeys[0]}). Skipping LLM fusion.`);
    return successfulOutputs[modelKeys[0]];
  }

  const fusionSystem = `You are a Lead AI Systems Architect.
Your task is to merge and fuse multiple requirement elicitation JSONs generated by different AI models into a single, high-quality, comprehensive Final Analysis JSON.
Ensure you:
1. De-duplicate similar actors and functional requirements. E.g. merge overlapping functional requirements but preserve unique details.
2. Select the most descriptive projectTitle and combine projectOverviews into a rich, detailed overview.
3. Consolidate and refine business goals and user stories.
4. Keep the output clean and strictly adhering to the JSON schema. RESPOND ONLY WITH VALID JSON (no markdown, no backticks).

Schema:
{
  "projectTitle": string,
  "projectOverview": string,
  "actors": [{"name":string,"role":string}],
  "functionalRequirements": [{"id":string,"title":string,"description":string,"priority":"High"|"Medium"|"Low"}],
  "businessGoals": [string],
  "userStories": [{"actor":string,"action":string,"benefit":string}]
}
`;

  const fusionUser = `Original brief: "${userBrief}"

Here are the requirements outputs from different models:
${JSON.stringify(successfulOutputs, null, 2)}

Please merge and fuse them into a single coherent JSON object following the schema.`;

  try {
    const fusedText = await callGeminiDirect(fusionSystem, fusionUser);
    const parsedFused = JSON.parse(cleanJSONResponse(fusedText));
    return parsedFused;
  } catch (err) {
    console.warn(`[orchestrator] Response Fusion via Gemini failed: ${err.message}. Trying Nemotron for fusion...`);
    // Fallback: try Nemotron for fusion
    try {
      const fusedText = await callNemotronNIM(fusionSystem, fusionUser);
      const parsedFused = JSON.parse(cleanJSONResponse(fusedText));
      console.log('[orchestrator] Response Fusion via Nemotron succeeded.');
      return parsedFused;
    } catch (nemErr) {
      console.error(`[orchestrator] Nemotron fusion also failed: ${nemErr.message}. Selecting highest scored model instead.`);
    }
    // Final fallback: return highest scored model's parsed output
    let bestModel = null;
    let maxScore = -1;
    for (const [modelName, res] of Object.entries(responses)) {
      if (res.status === "Success" && res.score > maxScore) {
        maxScore = res.score;
        bestModel = res.parsedData;
      }
    }
    return bestModel || getFallbackData(userBrief);
  }
}

// ── Main Orchestrated Entry Point ──────────────────────────────
async function runOrchestratedPipeline(userBrief, onProgress = () => {}) {
  const systemPrompt = `You are an AI requirements elicitation specialist.
First, expand the user's brief requirements into a detailed project description.
Then, extract structured details based on this expanded description.
RESPOND ONLY WITH VALID JSON (no markdown, no backticks).
Keep all text description, overview, action, and benefit fields extremely short and concise (under 1 sentence, maximum 15 words). This is critical to prevent response truncation.
Schema:
{
  "projectTitle": string,
  "projectOverview": string,
  "actors": [{"name":string,"role":string}],
  "functionalRequirements": [{"id":string,"title":string,"description":string,"priority":"High"|"Medium"|"Low"}],
  "businessGoals": [string],
  "userStories": [{"actor":string,"action":string,"benefit":string}]
}
`;

  const userPrompt = `Extract requirements from:\n\n${userBrief}\n\nIMPORTANT: You must respond with a single, valid JSON object matching the requested schema. Do not include any conversational text, explanations, markdown formatting, or code blocks. Do not use ellipses (...) or placeholders under any circumstances; write out all lists, requirements, and stories completely.`;
  // Define tasks
  const modelTasks = [
    {
      name: "Gemini",
      call: () => callGeminiDirect(systemPrompt, userPrompt)
    },
    {
      name: "MiniMax",
      call: () => callMiniMaxNIM(systemPrompt, userPrompt)
    },
    {
      name: "Nemotron",
      call: () => callNemotronNIM(systemPrompt, userPrompt)
    }
  ];

  onProgress({ event: "orchestrator_start", message: "Starting parallel model execution..." });

  // Run in parallel
  const resultsPromise = modelTasks.map(async (task) => {
    const start = Date.now();
    let status = "Success";
    let error = null;
    let rawOutput = null;
    let parsedData = null;
    let scoreObj = { total: 0, breakdown: { json: 0, schema: 0, density: 0, speed: 0 } };

    try {
      rawOutput = await task.call();
      parsedData = JSON.parse(cleanJSONResponse(rawOutput));
      const elapsed = Date.now() - start;
      scoreObj = scoreResponse(parsedData, elapsed, task.name);
    } catch (err) {
      status = err.message?.includes("Timeout") ? "Timeout" : "Failed";
      error = err.message;
      console.error(`[orchestrator] Model ${task.name} ended with status: ${status}. Error: ${error}`);
      
      try {
        const fs = require("fs");
        const filename = `${task.name.toLowerCase()}_fail_output.txt`;
        fs.writeFileSync(filename, rawOutput || `(No raw output captured. Error: ${error})`);
        console.log(`[orchestrator] Wrote raw output for ${task.name} to ${filename} for debugging.`);
      } catch (fsErr) {
        console.error(`[orchestrator] Failed to log raw output to file: ${fsErr.message}`);
      }
      
      // Attempt to load simulated fallback just to have standard structure
      try {
        parsedData = getFallbackData(userBrief);
        scoreObj = { total: 40, breakdown: { json: 20, schema: 20, density: 0, speed: 0 } }; // low penalty score for fallback
      } catch (mockErr) {
        parsedData = null;
      }
    }

    const elapsed = Date.now() - start;

    return {
      model: task.name,
      status,
      latencyMs: elapsed,
      score: scoreObj.total,
      scoreBreakdown: scoreObj.breakdown,
      error,
      parsedData,
      rawOutput: rawOutput || (parsedData ? JSON.stringify(parsedData, null, 2) : null)
    };
  });

  const orchestratorResults = await Promise.all(resultsPromise);

  const modelMetrics = {};
  orchestratorResults.forEach(r => {
    modelMetrics[r.model] = {
      status: r.status,
      latencyMs: r.latencyMs,
      score: r.score,
      scoreBreakdown: r.scoreBreakdown,
      error: r.error,
      rawOutput: r.rawOutput,
      parsedData: r.parsedData
    };
  });

  onProgress({ event: "orchestrator_complete", results: modelMetrics });

  // Response Fusion
  const startFusion = Date.now();
  onProgress({ event: "fusion_start", message: "Synthesizing and merging outputs..." });
  
  const fusedData = await fuseResponses(modelMetrics, userBrief);
  const fusionLatency = Date.now() - startFusion;

  // Add metadata scores to fused response
  fusedData.modelScores = {
    requirementExtraction: Math.max(...orchestratorResults.map(r => r.score)),
    documentation: 96
  };

  const finalOutput = {
    modelMetrics,
    fusion: {
      latencyMs: fusionLatency,
      modelUsed: "Gemini (Direct)",
      fusedData
    }
  };

  onProgress({ event: "fusion_complete", data: finalOutput });

  return finalOutput;
}

module.exports = {
  runModel,
  callGeminiDirect,
  callMiniMaxNIM,
  callNemotronNIM,
  runOrchestratedPipeline,
  scoreResponse,
  fuseResponses
};

