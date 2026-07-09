// ════════════════════════════════════════════════════════════
//  SDLC·AI Platform – App Controller
// ════════════════════════════════════════════════════════════

let analysisData = {};
let currentTab = 'overview';
let currentDesignSessionId = null; // Stored after Analysis completes

// ── Navigation ────────────────────────────────────────────
document.getElementById('navPills').addEventListener('click', e => {
  const pill = e.target.closest('.nav-pill');
  if (!pill) return;
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  const view = pill.dataset.view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  if (view === 'input') document.getElementById('viewInput').classList.add('active');
  else if (view === 'results') document.getElementById('viewResults').classList.add('active');
  else if (view === 'design') document.getElementById('viewDesign').classList.add('active');
});

document.getElementById('sidebarNav').addEventListener('click', e => {
  const item = e.target.closest('.snav-item');
  if (!item) return;
  document.querySelectorAll('.snav-item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  currentTab = item.dataset.tab;
  showTab(currentTab);
});

function showTab(tab) {
  const content = document.getElementById('resultsContent');
  // Hide all panes
  content.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  // Show requested pane
  const pane = content.querySelector(`#tab-${tab}`);
  if (pane) pane.classList.add('active');
}

// ── Analysis Start ────────────────────────────────────────
function startAnalysis() {
  const input = document.getElementById('requirementsInput').value.trim();
  if (!input) {
    alert('Please enter your project requirements first.');
    return;
  }

  // Reset
  analysisData = {};
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('progressSection').style.display = 'block';
  document.getElementById('progressSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Reset pipeline steps
  document.querySelectorAll('.ps').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === 0) el.classList.add('active');
  });

  // Start SSE
  const url = `/api/analysis/stream?requirements=${encodeURIComponent(input)}`;
  const es = new EventSource(url);

  es.addEventListener('progress', e => {
    const d = JSON.parse(e.data);
    document.getElementById('progressLabel').textContent = d.label;
    document.getElementById('progressModel').textContent = d.model;
    document.getElementById('progressPct').textContent = d.percent + '%';
    document.getElementById('progressBar').style.width = d.percent + '%';

    // Update steps
    document.querySelectorAll('.ps').forEach(el => {
      const s = parseInt(el.dataset.step);
      if (s < d.step) { el.classList.remove('active'); el.classList.add('done'); }
      else if (s === d.step) { el.classList.add('active'); el.classList.remove('done'); }
      else { el.classList.remove('active', 'done'); }
    });
  });

  es.addEventListener('module', e => {
    const d = JSON.parse(e.data);
    // Store partial results
    switch (d.id) {
      case 0: analysisData.orchestrator = d.data; break;
      case 1: analysisData.extracted = d.data; break;
      case 2: analysisData.analyzed = d.data; break;
      case 3: analysisData.validated = d.data; break;
      case 4: analysisData.srs = d.data; break;
      case 5: analysisData.feasibility = d.data; break;
      case 6: analysisData.risks = d.data; break;
      case 7: analysisData.cost = d.data; break;
      case 8: analysisData.roi = d.data; break;
      case 9: analysisData.aiDashboard = d.data; break;
      case 10: analysisData.report = d.data; break;
    }
  });

  es.addEventListener('orchestrator_metrics', e => {
    try {
      const metrics = JSON.parse(e.data);
      analysisData.orchestrator = analysisData.orchestrator || {};
      analysisData.orchestrator.modelMetrics = metrics;
    } catch {}
  });

  es.addEventListener('complete', e => {
    es.close();
    document.getElementById('analyzeBtn').disabled = false;
    const d = JSON.parse(e.data);
    analysisData = d.modules;
    // Store session ID for Design Phase
    currentDesignSessionId = d.sessionId;
    try { sessionStorage.setItem('sdlc_session_id', d.sessionId); } catch {}
    // Enable Design Phase button
    const designBtn = document.getElementById('generateDesignBtn');
    if (designBtn) {
      designBtn.disabled = false;
      designBtn.style.display = 'flex';
    }
    // Enable Design nav pill
    const designPill = document.getElementById('navDesign');
    if (designPill) designPill.removeAttribute('disabled');
    buildResultsView();
    switchToResults();
  });

  es.addEventListener('error', e => {
    es.close();
    document.getElementById('analyzeBtn').disabled = false;
    let msg = 'Analysis failed. Please check your API key and try again.';
    try { msg = JSON.parse(e.data).message; } catch {}
    alert('Error: ' + msg);
  });
}

// ── Build Results ─────────────────────────────────────────
function buildResultsView() {
  const content = document.getElementById('resultsContent');
  const { orchestrator, extracted, analyzed, validated, srs, feasibility, risks, cost, roi, aiDashboard, report } = analysisData;

  content.innerHTML = [
    renderOverview(analysisData),
    renderOrchestrator(orchestrator || {}),
    renderElicitation(extracted || {}),
    renderAnalysis(analyzed || {}),
    renderValidation(validated || {}),
    renderSRS(srs || {}),
    renderFeasibility(feasibility || {}),
    renderRisk(risks || {}),
    renderCost(cost || {}),
    renderROI(roi || {}),
    renderAIComparison(aiDashboard || { scores: {} }),
    renderReport(report || ''),
    renderRaw(analysisData || {}),
  ].join('');

  // Show overview by default
  showTab('overview');
}

function switchToResults() {
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  document.getElementById('navResults').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('viewResults').classList.add('active');
  window.scrollTo({ top: 0 });
}

function resetAnalysis() {
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-view="input"]').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('viewInput').classList.add('active');
  document.getElementById('progressSection').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = false;
  window.scrollTo({ top: 0 });
}

function downloadReportMarkdown() {
  const md = analysisData?.report;
  if (!md) { alert('No report available.'); return; }
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sdlc-analysis-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Restore session from previous analysis run
document.addEventListener('DOMContentLoaded', () => {
  try {
    const saved = sessionStorage.getItem('sdlc_session_id');
    if (saved) currentDesignSessionId = saved;
  } catch {}
});

function exportToPDF() {
  if (!analysisData || !analysisData.extracted) {
    alert("No analysis data available to export.");
    return;
  }

  const { orchestrator, extracted, analyzed, validated, srs, feasibility, risks, cost, roi } = analysisData;
  const tech = analyzed?.technologyRecommendation || {};
  const actors = extracted?.actors || [];
  const funcReqs = extracted?.functionalRequirements || [];
  const nonFuncReqs = analyzed?.nonFunctionalRequirements || [];
  const riskList = risks?.risks || [];
  const feasibilityTech = feasibility?.technical || {};
  const feasibilityEcon = feasibility?.economic || {};
  const feasibilityOper = feasibility?.operational || {};

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>SDLC Analysis Report - ${extracted.projectTitle || "Project Specification"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
          }
          
          h1, h2, h3 {
            color: #0f172a;
            font-weight: 700;
          }
          
          h1 {
            font-size: 28px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 30px;
          }
          
          h2 {
            font-size: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 40px;
            margin-bottom: 20px;
            page-break-after: avoid;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .meta-info {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 30px;
            font-size: 14px;
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 13px;
          }
          
          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px 12px;
            text-align: left;
          }
          
          th {
            background: #f1f5f9;
            font-weight: 600;
          }
          
          .priority-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .priority-High { background: #ffe4e6; color: #991b1b; }
          .priority-Medium { background: #fef3c7; color: #92400e; }
          .priority-Low { background: #dcfce7; color: #166534; }

          .tech-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 15px;
          }
          
          .tech-title {
            font-weight: 600;
            color: #475569;
            font-size: 13px;
            text-transform: uppercase;
          }
          
          .tech-val {
            font-size: 15px;
            font-weight: 500;
            margin-top: 4px;
          }
          
          .footer {
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          
          .check-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            margin-bottom: 6px;
          }
          
          .check-item .check {
            color: #16a34a;
            font-weight: bold;
          }

          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>SDLC System Specification & Blueprint</h1>
        
        <div class="meta-info">
          <div>
            <strong>Project Title:</strong> ${extracted.projectTitle || "Custom Software"}
          </div>
          <div>
            <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
          </div>
        </div>

        <!-- 1. Project Summary -->
        <div class="section">
          <h2>Project Summary</h2>
          <p>${extracted.projectOverview || "No overview available."}</p>
        </div>

        <!-- 2. Stakeholders -->
        <div class="section">
          <h2>Stakeholders</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Role/Actor</th>
                <th>Responsibilities</th>
              </tr>
            </thead>
            <tbody>
              ${actors.map(a => `
                <tr>
                  <td><strong>${a.name}</strong></td>
                  <td>${a.role}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 3. Functional Requirements -->
        <div class="section">
          <h2>Functional Requirements</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 12%">ID</th>
                <th style="width: 28%">Title</th>
                <th>Description</th>
                <th style="width: 15%">Priority</th>
              </tr>
            </thead>
            <tbody>
              ${funcReqs.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td><strong>${r.title}</strong></td>
                  <td>${r.description}</td>
                  <td><span class="priority-tag priority-${r.priority}">${r.priority}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 4. Non-Functional Requirements -->
        <div class="section">
          <h2>Non-Functional Requirements</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Category</th>
                <th>Description</th>
                <th style="width: 25%">Target Metric</th>
              </tr>
            </thead>
            <tbody>
              ${nonFuncReqs.map(n => `
                <tr>
                  <td><strong>${n.category}</strong></td>
                  <td>${n.description}</td>
                  <td><code>${n.metric}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Risk Analysis -->
        <div class="section">
          <h2>Risk Analysis</h2>
          <p><strong>Overall Risk Assessment:</strong> ${risks?.overallRiskLevel || "Not evaluated"} (Top Risk: ${risks?.topRisk || "None"})</p>
          <table style="margin-top: 12px;">
            <thead>
              <tr>
                <th>Risk Title</th>
                <th style="width: 15%">Severity</th>
                <th>Description</th>
                <th>Mitigation Strategy</th>
              </tr>
            </thead>
            <tbody>
              ${riskList.map(r => `
                <tr>
                  <td><strong>${r.title}</strong></td>
                  <td>${r.level}</td>
                  <td>${r.description}</td>
                  <td>${r.mitigation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 6. Feasibility -->
        <div class="section">
          <h2>Feasibility Study</h2>
          <p><strong>Overall Verdict:</strong> ${feasibility?.overallVerdict || "Not evaluated"}</p>
          <p>${feasibility?.summary || ""}</p>
          <table style="margin-top: 12px;">
            <thead>
              <tr>
                <th style="width: 25%">Feasibility Type</th>
                <th style="width: 20%">Status</th>
                <th>Assessment Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Technical</strong></td>
                <td>${feasibilityTech.status || "—"} (${feasibilityTech.score || 0}%)</td>
                <td>${(feasibilityTech.details || []).join(', ')}</td>
              </tr>
              <tr>
                <td><strong>Economic</strong></td>
                <td>${feasibilityEcon.status || "—"} (${feasibilityEcon.score || 0}%)</td>
                <td>${(feasibilityEcon.details || []).join(', ')}</td>
              </tr>
              <tr>
                <td><strong>Operational</strong></td>
                <td>${feasibilityOper.status || "—"} (${feasibilityOper.score || 0}%)</td>
                <td>${(feasibilityOper.details || []).join(', ')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 7. ROI -->
        <div class="section">
          <h2>ROI Evaluation</h2>
          <table style="width: 50%; margin-bottom: 12px;">
            <tr><th>Expected ROI</th><td><strong>${roi?.roiPercent || 0}%</strong></td></tr>
            <tr><th>Recommendation</th><td>${roi?.recommendation || "—"}</td></tr>
            <tr><th>Payback Period</th><td>${roi?.paybackPeriodMonths || 0} months</td></tr>
          </table>
          <p style="font-size: 13px; color: #475569;">${roi?.verdict || ""}</p>
        </div>

        <!-- 8. Recommended Tech Stack -->
        <div class="section">
          <h2>Recommended Tech Stack</h2>
          <div class="grid-2">
            <div class="tech-box"><div class="tech-title">Frontend</div><div class="tech-val">${tech.frontend || "—"}</div></div>
            <div class="tech-box"><div class="tech-title">Backend</div><div class="tech-val">${tech.backend || "—"}</div></div>
            <div class="tech-box"><div class="tech-title">Database</div><div class="tech-val">${tech.database || "—"}</div></div>
            <div class="tech-box"><div class="tech-title">Authentication</div><div class="tech-val">${tech.auth || "—"}</div></div>
            <div class="tech-box"><div class="tech-title">Cloud Infrastructure</div><div class="tech-val">${tech.cloud || "—"}</div></div>
            <div class="tech-box"><div class="tech-title">CI/CD</div><div class="tech-val">${tech.cicd || "—"}</div></div>
          </div>
          ${tech.rationale ? `<p style="font-size: 13px; color: #475569; margin-top: 10px;"><strong>Rationale:</strong> ${tech.rationale}</p>` : ""}
        </div>

        <!-- 9. Generated By -->
        <div class="section">
          <h2>Generated By</h2>
          <div class="check-item"><span class="check">✔</span> Gemini Requirements & Elicitation</div>
          <div class="check-item"><span class="check">✔</span> MiniMax Validation & Consistency Check</div>
          <div class="check-item"><span class="check">✔</span> Nemotron Feasibility, Costs & Risks Assessment</div>
        </div>

        <div class="footer">
          <p>SDLC·AI Orchestrated Platform • Highly Confidential • Printed ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
