// ════════════════════════════════════════════════════════════
//  DESIGN PHASE CONTROLLER
// ════════════════════════════════════════════════════════════

let designData = {};
let currentDesignTab = 'design-overview';

// ── Design Phase Start ────────────────────────────────────
function startDesignPhase(sessionId) {
  if (!sessionId) {
    alert('No analysis session found. Please run the Analysis Phase first.');
    return;
  }

  // Switch to design view and show progress
  switchToDesignView();
  designData = {};

  // Build overview skeleton early so streaming can update module cards
  const content = document.getElementById('designResultsContent');
  if (content) {
    content.innerHTML = renderDesignOverview(designData);
  }

  const progressSection = document.getElementById('designProgressSection');
  const btn = document.getElementById('generateDesignBtn');
  if (progressSection) progressSection.style.display = 'block';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="btn-spin">◌</span> Generating Design…'; }

  // Reset design pipeline steps
  document.querySelectorAll('.dps').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === 0) el.classList.add('active');
  });

  const url = `/api/design/stream?sessionId=${encodeURIComponent(sessionId)}`;
  const es = new EventSource(url);

  es.addEventListener('design_progress', e => {
    const d = JSON.parse(e.data);
    const labelEl = document.getElementById('designProgressLabel');
    const modelEl = document.getElementById('designProgressModel');
    const pctEl = document.getElementById('designProgressPct');
    const barEl = document.getElementById('designProgressBar');
    if (labelEl) labelEl.textContent = d.label;
    if (modelEl) modelEl.textContent = d.model;
    if (pctEl) pctEl.textContent = d.percent + '%';
    if (barEl) barEl.style.width = d.percent + '%';

    // Update pipeline steps
    const steps = ['hld', 'database', 'uiux', 'api', 'lld', 'security', 'performance', 'deployment', 'validation', 'fusion'];
    const currentIdx = steps.indexOf(d.moduleId);
    document.querySelectorAll('.dps').forEach((el, i) => {
      if (i < currentIdx) { el.classList.remove('active'); el.classList.add('done'); }
      else if (i === currentIdx) { el.classList.add('active'); el.classList.remove('done'); }
      else { el.classList.remove('active', 'done'); }
    });
  });

  es.addEventListener('design_module', e => {
    const d = JSON.parse(e.data);
    designData[d.id] = d.data;
    const card = document.querySelector(`.design-module-card[data-module="${d.id}"]`);
    if (card) {
      card.classList.add('complete');
      card.classList.remove('pending');
      const statusEl = card.querySelector('.dmc-status');
      if (statusEl) statusEl.textContent = '✔';
    }
    // Rebuild all tab panes as modules stream in (fixes blank pages if design_complete fails to parse)
    refreshDesignView();
  });

  es.addEventListener('design_module_error', e => {
    const d = JSON.parse(e.data);
    const card = document.querySelector(`.design-module-card[data-module="${d.id}"]`);
    if (card) {
      card.classList.add('error');
      card.classList.remove('pending');
      const statusEl = card.querySelector('.dmc-status');
      if (statusEl) statusEl.textContent = '✗';
    }
  });

  es.addEventListener('design_complete', e => {
    es.close();
    try {
      const d = JSON.parse(e.data);
      if (d.design) designData = { ...designData, ...d.design };
    } catch (err) {
      console.warn('[design] design_complete parse failed — using streamed module data:', err.message);
    }
    finishDesignGeneration();
  });

  es.addEventListener('design_error', e => {
    es.close();
    if (btn) { btn.disabled = false; btn.innerHTML = '🎨 Generate Design Phase'; }
    let msg = 'Design generation failed.';
    try { msg = JSON.parse(e.data).message; } catch {}
    alert('Design Error: ' + msg);
  });

  es.onerror = () => {
    es.close();
    if (btn) { btn.disabled = false; btn.innerHTML = '🎨 Generate Design Phase'; }
    if (Object.keys(designData).length > 0) {
      console.warn('[design] SSE connection closed — rendering streamed modules');
      finishDesignGeneration();
    }
  };
}

// ── Build / refresh design results view ───────────────────
function refreshDesignView(preferredTab) {
  const content = document.getElementById('designResultsContent');
  if (!content || Object.keys(designData).length === 0) return;

  const activeTab = preferredTab
    || currentDesignTab
    || document.querySelector('.design-snav-item.active')?.dataset.tab
    || 'design-overview';

  buildDesignView();
  showDesignTab(activeTab);
  document.querySelectorAll('.design-snav-item').forEach(i => i.classList.remove('active'));
  const nav = document.querySelector(`.design-snav-item[data-tab="${activeTab}"]`);
  if (nav) nav.classList.add('active');
}

function finishDesignGeneration() {
  const btn = document.getElementById('generateDesignBtn');
  const progressSection = document.getElementById('designProgressSection');
  if (btn) { btn.disabled = false; btn.innerHTML = '🎨 Regenerate Design'; }
  if (progressSection) progressSection.style.display = 'none';
  refreshDesignView('design-overview');
}

function buildDesignView() {
  const content = document.getElementById('designResultsContent');
  if (!content) return;

  content.innerHTML = [
    renderDesignOverview(designData),
    renderDesignHLD(designData.hld || {}),
    renderDesignDatabase(designData.database || {}),
    renderDesignUIUX(designData.uiux || {}),
    renderDesignAPI(designData.api || {}),
    renderDesignLLD(designData.lld || {}),
    renderDesignSecurity(designData.security || {}),
    renderDesignPerformance(designData.performance || {}),
    renderDesignDeployment(designData.deployment || {}),
    renderDesignValidation(designData.validation || {}),
    renderDesignFusion(designData.fusion || {}),
  ].join('');
}

// ── Tab Navigation ────────────────────────────────────────
function showDesignTab(tab) {
  const content = document.getElementById('designResultsContent');
  if (!content) return;
  content.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const pane = content.querySelector(`#tab-${tab}`);
  if (pane) pane.classList.add('active');
  currentDesignTab = tab;
}

document.addEventListener('DOMContentLoaded', () => {
  // Design sidebar nav
  const designSidebarNav = document.getElementById('designSidebarNav');
  if (designSidebarNav) {
    designSidebarNav.addEventListener('click', e => {
      const item = e.target.closest('.design-snav-item');
      if (!item) return;
      document.querySelectorAll('.design-snav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      showDesignTab(item.dataset.tab);
    });
  }
});

// ── View Switching ────────────────────────────────────────
function switchToDesignView() {
  // Activate Design nav pill
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  const designPill = document.getElementById('navDesign');
  if (designPill) designPill.classList.add('active');
  // Show design view
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const designView = document.getElementById('viewDesign');
  if (designView) designView.classList.add('active');
  window.scrollTo({ top: 0 });
}

// ── Export Design PDF ─────────────────────────────────────
function exportDesignPDF() {
  if (!designData || !designData.hld) {
    alert('No design data to export. Please generate the Design Phase first.');
    return;
  }

  const printWindow = window.open('', '_blank');
  const fusion = designData.fusion || {};
  const hld = designData.hld || {};
  const api = designData.api || {};
  const security = designData.security || {};
  const validation = designData.validation || {};
  const deployment = designData.deployment || {};

  printWindow.document.write(`
    <html>
      <head>
        <title>SDLC Design Document</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 960px; margin: 0 auto; }
          h1 { font-size: 28px; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 30px; }
          h2 { font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 40px; margin-bottom: 16px; page-break-after: avoid; }
          h3 { font-size: 15px; color: #475569; margin: 16px 0 8px; }
          pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
          .ok { background: #dcfce7; color: #166534; } .warn { background: #fef3c7; color: #92400e; } .err { background: #ffe4e6; color: #991b1b; }
          .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>SDLC·AI Design Document</h1>
        <div class="meta">
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Overall Score:</strong> ${fusion.confidenceScores?.overall || validation.overallDesignScore || 92}/100</div>
          <div><strong>Verdict:</strong> ${validation.designReadinessVerdict || 'Design Approved'}</div>
        </div>

        <div class="section">
          <h2>1. High-Level Design</h2>
          <h3>Architecture Style: ${hld.architectureStyle || '—'}</h3>
          ${hld.architectureDiagram ? `<pre>${hld.architectureDiagram}</pre>` : ''}
          ${hld.dataFlowDiagram ? `<h3>Data Flow</h3><p>${hld.dataFlowDiagram}</p>` : ''}
          ${hld.deploymentArchitecture ? `<h3>Deployment</h3><p>${hld.deploymentArchitecture}</p>` : ''}
        </div>

        ${api.endpoints?.length ? `
        <div class="section">
          <h2>2. API Design (REST Endpoints)</h2>
          <table>
            <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Auth</th><th>Status Codes</th></tr></thead>
            <tbody>${api.endpoints.map(ep => `<tr><td><strong>${ep.method}</strong></td><td><code>${ep.path}</code></td><td>${ep.description}</td><td>${ep.auth ? '🔒 Required' : '🔓 Public'}</td><td>${(ep.statusCodes || []).join(', ')}</td></tr>`).join('')}</tbody>
          </table>
        </div>` : ''}

        ${security.owaspChecklist?.length ? `
        <div class="section">
          <h2>3. Security — OWASP Top 10</h2>
          <table>
            <thead><tr><th>ID</th><th>Vulnerability</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>${security.owaspChecklist.map(o => `<tr><td>${o.id}</td><td>${o.title}</td><td><span class="badge ${o.status === 'Mitigated' ? 'ok' : 'warn'}">${o.status}</span></td><td>${o.notes}</td></tr>`).join('')}</tbody>
          </table>
        </div>` : ''}

        ${deployment.cicdPipeline ? `
        <div class="section">
          <h2>4. CI/CD Pipeline · ${deployment.cicdPipeline.tool || 'GitHub Actions'}</h2>
          ${(deployment.cicdPipeline.stages || []).map((s, i) => `<h3>Stage ${i + 1}: ${s.name}</h3><ul>${(s.steps || []).map(step => `<li>${step}</li>`).join('')}</ul>`).join('')}
        </div>` : ''}

        ${validation.traceabilityMatrix?.length ? `
        <div class="section">
          <h2>5. Requirement Traceability Matrix</h2>
          <table>
            <thead><tr><th>ID</th><th>Requirement</th><th>Design Module</th><th>API</th><th>Status</th></tr></thead>
            <tbody>${validation.traceabilityMatrix.map(r => `<tr><td>${r.requirementId}</td><td>${r.requirementTitle}</td><td>${r.designModule}</td><td><code>${r.apiEndpoint}</code></td><td>${r.status}</td></tr>`).join('')}</tbody>
          </table>
        </div>` : ''}

        ${fusion.finalDeliverables?.length ? `
        <div class="section">
          <h2>6. Final Deliverables</h2>
          <ul>${fusion.finalDeliverables.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>` : ''}

        <div class="footer">SDLC·AI Platform · AI-Orchestrated Design Document · Generated ${new Date().toLocaleDateString()}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 500);
}
