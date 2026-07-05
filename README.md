# SDLC·AI Platform

> **Requirements In, Architecture Out.**
> Paste a client brief. Three specialized AI models orchestrate a full Software Requirements Specification, Feasibility Study, Risk Assessment, and ROI — streamed live to your browser in under 2 minutes.

![SDLC·AI Platform](https://img.shields.io/badge/Node.js-v22-green?style=flat-square&logo=node.js) ![Express](https://img.shields.io/badge/Express-v5-black?style=flat-square&logo=express) ![Gemini](https://img.shields.io/badge/Gemini-2.5--flash-blue?style=flat-square&logo=google) ![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76b900?style=flat-square&logo=nvidia) ![License](https://img.shields.io/badge/license-ISC-lightgrey?style=flat-square)

---

## ✨ What It Does

SDLC·AI automates the **requirements engineering phase** of software development using three AI models running in parallel. Feed it any project brief and it generates:

| Module | Description |
|--------|-------------|
| 📋 **SRS Document** | Full Software Requirements Specification |
| ✅ **Validation Report** | Ambiguity, gap, and contradiction detection |
| 🔬 **Feasibility Study** | Technical, economic & operational analysis |
| ⚠️ **Risk Analysis** | Identified risks with probability, impact & mitigation |
| 💰 **Cost Estimation** | Phase-by-phase hours and INR cost breakdown |
| 📈 **ROI Evaluation** | ROI %, net profit, and payback period |
| 🤖 **AI Dashboard** | Per-model performance comparison across 6 dimensions |
| 📄 **Markdown Report** | Exportable full analysis report |

---

## 🤖 AI Models Used

| Model | Provider | Role |
|-------|----------|------|
| **Gemini 2.5 Flash** | Google AI (Generative Language API v1beta) | Requirements elicitation, NFR analysis, response fusion |
| **MiniMax-M3 / M2.7** | NVIDIA NIM | Requirements validation, risk prioritization |
| **Nemotron-3-Super-120B-A12B** | NVIDIA NIM | Tech stack recommendation, feasibility, risk identification, cost estimation |

---

## 🏗️ Architecture

```
Browser (HTML + CSS + Vanilla JS)
      │
      │  GET /api/analysis/stream?requirements=...  (Server-Sent Events)
      ▼
Express.js · Node.js · Port 3000
      │
      ├─ server/routes/analysis.js          ← SSE endpoint
      └─ server/services/
           ├─ analysisPipeline.js           ← 10-stage pipeline coordinator
           ├─ aiService.js                  ← Per-module prompts & mock fallbacks
           └─ orchestrator.js              ← Multi-model runner & resilience engine
```

### 10-Stage Pipeline

```
Stage 0  → Parallel Elicitation    (Gemini + MiniMax + Nemotron)
Stage 0  → Response Fusion         (Gemini → Nemotron fallback)
Stage 2  → Requirements Analysis   (Gemini: NFRs · Nemotron: Tech Stack)
Stage 3  → Requirements Validation (MiniMax-M3)
Stage 4  → SRS Assembly            (System — no LLM call)
Stage 5  → Feasibility Study       (Nemotron)
Stage 6  → Risk Analysis           (Nemotron identifies → MiniMax prioritizes)
Stage 7  → Cost Estimation         (Nemotron)
Stage 8  → ROI Evaluation          (Pure math — no LLM call)
Stage 9  → AI Dashboard            (System assembly)
Stage 10 → Markdown Report         (System assembly)
```

---

## 🛡️ Resilience Features

- **Gemini Circuit Breaker** — trips for 90s when quota is exhausted; auto-resets
- **Multi-Provider Fallback Mesh** — each model has 1-2 backup providers
- **Exponential Backoff Retry** — 5 attempts with 1s→2s→4s→8s→16s delays for NVIDIA NIM
- **MiniMax M3 → M2.7 Auto-Fallback** — seamless model downgrade on 504 errors
- **Nemotron Fusion Fallback** — replaces Gemini for response fusion when quota is down
- **LLM Output Repair Engine** — 8 regex rules fix common malformed JSON from models
- **Debug File Dumps** — raw model output saved to `*_fail_output.txt` on parse errors
- **Simulation Mode** — full mock engine for offline development (`USE_MOCK_FALLBACK=true`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- API keys for Google Gemini and NVIDIA NIM

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/sdlc-platform.git
cd sdlc-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in your API keys

# 4. Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```env
PORT=3000
USE_MOCK_FALLBACK=false

# Google Gemini (get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# NVIDIA NIM — Nemotron (get from https://build.nvidia.com/)
NIM_API_KEY=your_nvidia_nim_api_key_here
NIM_BASE_URL=https://integrate.api.nvidia.com/v1

# NVIDIA NIM — MiniMax (can use a separate key or same as NIM_API_KEY)
MINIMAX_API_KEY=your_minimax_nim_api_key_here
```

> **⚠️ Never commit your `.env` file.** It is listed in `.gitignore`.

### Getting API Keys

| Key | Where to Get |
|-----|-------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NIM_API_KEY` | [NVIDIA Build](https://build.nvidia.com/) → API Keys |
| `MINIMAX_API_KEY` | [NVIDIA Build](https://build.nvidia.com/) → MiniMax model page |

---

## 🧪 Testing API Connections

```bash
# Test Gemini API key and model availability
node test_gemini.mjs

# Test Nemotron (NVIDIA NIM)
node test_nemotron_super.mjs

# Test MiniMax (NVIDIA NIM)
node test_minimax.mjs
```

---

## 📁 Project Structure

```
sdlc-platform/
├── server/
│   ├── index.js                    # Express entry point
│   ├── routes/
│   │   └── analysis.js             # SSE streaming route
│   └── services/
│       ├── analysisPipeline.js     # 10-stage pipeline coordinator
│       ├── aiService.js            # AI prompts, schemas, mock fallbacks
│       └── orchestrator.js         # Multi-model runner & resilience engine
├── public/
│   ├── index.html                  # Single-page app shell
│   ├── css/
│   │   └── style.css               # Dark glassmorphism design system
│   └── js/
│       ├── app.js                  # SPA controller & SSE consumer
│       ├── render.js               # HTML renderers for all result modules
│       └── samples.js              # Pre-written sample project briefs
├── .env.example                    # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 💡 Usage Tips

- **Offline / No API keys?** Set `USE_MOCK_FALLBACK=true` in `.env` to use the built-in mock engine with pre-defined food delivery, hospital, and e-commerce scenarios.
- **Rate limits?** The platform automatically retries and switches providers. Wait 60–90 seconds and try again if Gemini quota is exhausted.
- **Export results** using the **"⤓ Export Report PDF"** button in the results sidebar.
- **Sample projects** are available via the buttons on the input screen (Food Delivery, Hospital, E-Commerce, Fintech, IoT, Ride-Sharing).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v22 |
| Web Framework | Express.js v5 |
| HTTP Client | Axios v1.18 |
| Gemini SDK | `@google/genai` v2.10 |
| NIM / OpenAI SDK | `openai` v6.45 |
| Environment | `dotenv` v17 |
| Frontend | Vanilla HTML5 + CSS3 + ES6+ JS |
| Streaming | Server-Sent Events (SSE) |
| Fonts | Google Fonts (Space Grotesk, JetBrains Mono) |

---

## 📄 License

ISC License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ⚡ by orchestrating Gemini · MiniMax · Nemotron</p>
