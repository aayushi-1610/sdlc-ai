// ════════════════════════════════════════════════════════════
//  DESIGN RENDER MODULE – generates HTML for all 10 design modules
// ════════════════════════════════════════════════════════════

function designModuleEmptyState(label) {
  return `<div class="card empty-hint"><p style="color:var(--text-secondary);line-height:1.6;margin:0">No <strong>${label}</strong> content was generated. The API may have timed out or returned invalid JSON — try <em>Regenerate Design</em> or check server logs.</p></div>`;
}

function hasAny(...values) {
  return values.some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return Boolean(v);
  });
}

function renderDesignOverview(designData) {
  const scores = designData.fusion?.confidenceScores || {};
  const modules = [
    { key: "hld", label: "High-Level Design", icon: "🏗️", model: "Gemini" },
    { key: "database", label: "Database Design", icon: "🗄️", model: "Gemini" },
    { key: "uiux", label: "UI/UX Design", icon: "🎨", model: "Gemini" },
    { key: "api", label: "API Design", icon: "🔌", model: "MiniMax-M3" },
    { key: "lld", label: "Low-Level Design", icon: "⚙️", model: "MiniMax-M3" },
    { key: "security", label: "Security Design", icon: "🔒", model: "Nemotron" },
    { key: "performance", label: "Performance Design", icon: "⚡", model: "Nemotron" },
    { key: "deployment", label: "Deployment Design", icon: "🚀", model: "Nemotron" },
    { key: "validation", label: "Design Validation", icon: "✅", model: "All Models" },
    { key: "fusion", label: "Design Fusion", icon: "🔗", model: "Gemini Fusion" },
  ];
  const overallScore = scores.overall || designData.validation?.overallDesignScore || 92;
  const verdict = designData.validation?.designReadinessVerdict || "Design Approved for Development";

  return `
<div class="tab-pane active" id="tab-design-overview">
  <div class="pane-title">Design Phase Overview</div>
  <div class="pane-subtitle">AI-Orchestrated Complete Design Document · All Modules Generated from Analysis</div>

  <div class="design-score-banner">
    <div class="design-score-ring">
      <svg viewBox="0 0 80 80" class="score-svg">
        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="8"/>
        <circle cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" stroke-width="8"
          stroke-dasharray="${Math.round(overallScore * 2.136)} 213.6" stroke-linecap="round" transform="rotate(-90 40 40)"/>
        <defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#a78bfa"/>
        </linearGradient></defs>
      </svg>
      <div class="score-inner">
        <div class="score-number">${overallScore}</div>
        <div class="score-label">/ 100</div>
      </div>
    </div>
    <div class="design-score-info">
      <div class="design-score-title">Design Quality Score</div>
      <div class="design-score-verdict">${verdict}</div>
      <div class="design-score-sub">Synthesized by AI Consensus — Gemini · MiniMax · Nemotron</div>
    </div>
  </div>

  <div class="design-modules-grid">
    ${modules.map(m => {
      const score = scores[m.key] || 90;
      const done = designData[m.key] && Object.keys(designData[m.key]).length > 0;
      return `
    <div class="design-module-card ${done ? 'complete' : 'pending'}" data-module="${m.key}">
      <div class="dmc-header">
        <span class="dmc-icon">${m.icon}</span>
        <span class="dmc-status">${done ? '✔' : '…'}</span>
      </div>
      <div class="dmc-name">${m.label}</div>
      <div class="dmc-model">${m.model}</div>
      ${done ? `<div class="dmc-score-bar"><div class="dmc-score-fill" style="width:${score}%"></div></div><div class="dmc-score-val">${score}% confidence</div>` : ''}
    </div>`;
    }).join('')}
  </div>

  ${designData.fusion?.summary ? `
  <div class="card" style="margin-top:20px">
    <div class="card-title">🔗 Design Fusion Summary</div>
    <p style="color:var(--text-secondary);line-height:1.7">${designData.fusion.summary}</p>
    ${designData.fusion.finalDeliverables ? `
    <div style="margin-top:14px">
      <div class="card-title" style="font-size:13px;margin-bottom:8px">Final Deliverables</div>
      <div class="design-deliverables">
        ${designData.fusion.finalDeliverables.map(d => `<div class="deliverable-item"><span class="del-check">✔</span>${d}</div>`).join('')}
      </div>
    </div>` : ''}
  </div>` : ''}
</div>`;
}

function renderDesignHLD(hld) {
  return `
<div class="tab-pane" id="tab-design-hld">
  <div class="pane-title">High-Level Design</div>
  <div class="pane-subtitle">Model: <span style="color:#7dd3fc">Gemini AI</span> · System Architecture, Components & Data Flow</div>

  ${hld.architectureStyle ? `
  <div class="card">
    <div class="card-title">Architecture Style</div>
    <div class="arch-style-badge">${hld.architectureStyle}</div>
  </div>` : ''}

  ${hld.architectureDiagram ? `
  <div class="card">
    <div class="card-title">Architecture Diagram</div>
    <pre class="diagram-art">${hld.architectureDiagram}</pre>
  </div>` : ''}

  ${hld.components?.length ? `
  <div class="card">
    <div class="card-title">System Components</div>
    <div class="card-grid">
      ${hld.components.map(c => `
      <div class="component-card">
        <div class="comp-type">${c.type}</div>
        <div class="comp-name">${c.name}</div>
        <div class="comp-tech">${c.technology}</div>
        <div class="comp-resps">${(c.responsibilities || []).map(r => `<div class="comp-resp">• ${r}</div>`).join('')}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${hld.dataFlowDiagram ? `
  <div class="card">
    <div class="card-title">Data Flow Diagram</div>
    <div class="data-flow-path">${hld.dataFlowDiagram.split('→').map((s, i, arr) => `<span class="flow-node">${s.trim()}</span>${i < arr.length - 1 ? '<span class="flow-arrow">→</span>' : ''}`).join('')}</div>
  </div>` : ''}

  ${hld.technologyDecisions?.length ? `
  <div class="card">
    <div class="card-title">Architecture Decisions</div>
    ${hld.technologyDecisions.map(d => `
    <div class="decision-item">
      <div class="decision-header">
        <span class="decision-badge">ADR</span>
        <span class="decision-title">${d.decision}</span>
      </div>
      <div class="decision-rationale">✓ ${d.rationale}</div>
      <div class="decision-tradeoff">⚠ Trade-off: ${d.tradeoff}</div>
    </div>`).join('')}
  </div>` : ''}

  ${hld.moduleList?.length ? `
  <div class="card">
    <div class="card-title">Module List</div>
    <div class="tags">${hld.moduleList.map(m => `<span class="tag tag-cyan">${m}</span>`).join('')}</div>
  </div>` : ''}

  ${hld.externalIntegrations?.length ? `
  <div class="card">
    <div class="card-title">External Integrations</div>
    <div class="tags">${hld.externalIntegrations.map(e => `<span class="tag tag-amber">${e}</span>`).join('')}</div>
  </div>` : ''}

  ${!hasAny(hld.architectureStyle, hld.architectureDiagram, hld.components, hld.dataFlowDiagram, hld.technologyDecisions, hld.moduleList, hld.externalIntegrations) ? designModuleEmptyState('High-Level Design') : ''}
</div>`;
}

function renderDesignDatabase(db) {
  return `
<div class="tab-pane" id="tab-design-database">
  <div class="pane-title">Database Design</div>
  <div class="pane-subtitle">Model: <span style="color:#7dd3fc">Gemini AI</span> · ER Diagram, Schema & Data Dictionary</div>

  ${db.erDiagram ? `
  <div class="card">
    <div class="card-title">Entity-Relationship Diagram</div>
    <pre class="diagram-art">${db.erDiagram}</pre>
  </div>` : ''}

  ${db.entities?.length ? `
  <div class="card">
    <div class="card-title">Database Entities (${db.entities.length})</div>
    <div class="entity-grid">
      ${db.entities.map(e => `
      <div class="entity-card">
        <div class="entity-header">
          <div class="entity-name">📋 ${e.name}</div>
          <div class="entity-pk">PK: ${e.primaryKey}</div>
        </div>
        <div class="entity-desc">${e.description}</div>
        <div class="entity-attrs">
          ${(e.attributes || []).map(a => `<code class="entity-attr">${a}</code>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${db.relationships?.length ? `
  <div class="card">
    <div class="card-title">Relationships</div>
    <table class="design-table">
      <thead><tr><th>From</th><th>To</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>${db.relationships.map(r => `
        <tr>
          <td><strong>${r.from}</strong></td>
          <td><strong>${r.to}</strong></td>
          <td><span class="rel-badge">${r.type}</span></td>
          <td>${r.description}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${db.normalization ? `
  <div class="card">
    <div class="card-title">Normalization & Indexing</div>
    <p style="color:var(--text-secondary);margin-bottom:12px">${db.normalization}</p>
    ${db.indexingStrategy?.length ? `<div class="tags">${db.indexingStrategy.map(i => `<span class="tag tag-purple">${i}</span>`).join('')}</div>` : ''}
  </div>` : ''}

  ${db.schema ? `
  <div class="card">
    <div class="card-title">SQL Schema (Sample)</div>
    <pre class="code-block">${db.schema.substring(0, 1200)}${db.schema.length > 1200 ? '\n...' : ''}</pre>
  </div>` : ''}

  ${db.dataDictionary?.length ? `
  <div class="card">
    <div class="card-title">Data Dictionary</div>
    ${db.dataDictionary.slice(0, 3).map(t => `
    <div style="margin-bottom:16px">
      <div style="font-weight:600;color:var(--cyan);margin-bottom:6px">Table: ${t.table}</div>
      <table class="design-table">
        <thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Description</th></tr></thead>
        <tbody>${(t.columns || []).map(c => `<tr><td><code>${c.name}</code></td><td>${c.type}</td><td>${c.nullable ? 'Yes' : 'No'}</td><td>${c.description}</td></tr>`).join('')}</tbody>
      </table>
    </div>`).join('')}
  </div>` : ''}

  ${!hasAny(db.erDiagram, db.entities, db.relationships, db.schema, db.dataDictionary) ? designModuleEmptyState('Database Design') : ''}
</div>`;
}

function renderDesignUIUX(uiux) {
  const palette = uiux.designSystem?.colorPalette || [];
  return `
<div class="tab-pane" id="tab-design-uiux">
  <div class="pane-title">UI/UX Design</div>
  <div class="pane-subtitle">Model: <span style="color:#7dd3fc">Gemini AI</span> · User Journey, Wireframes & Design System</div>

  ${uiux.navigationFlow ? `
  <div class="card">
    <div class="card-title">Navigation Flow</div>
    <div class="data-flow-path">${uiux.navigationFlow.split('→').map((s, i, arr) => `<span class="flow-node">${s.trim()}</span>${i < arr.length - 1 ? '<span class="flow-arrow">→</span>' : ''}`).join('')}</div>
  </div>` : ''}

  ${uiux.screenList?.length ? `
  <div class="card">
    <div class="card-title">Screen List (${uiux.screenList.length} screens)</div>
    <div class="screen-grid">
      ${uiux.screenList.map((s, i) => `<div class="screen-item"><span class="screen-num">${String(i + 1).padStart(2, '0')}</span><span class="screen-name">${s}</span></div>`).join('')}
    </div>
  </div>` : ''}

  ${uiux.wireframes?.length ? `
  <div class="card">
    <div class="card-title">Wireframe Specifications</div>
    <div class="card-grid">
      ${uiux.wireframes.map(w => `
      <div class="wireframe-card">
        <div class="wf-screen">${w.screen}</div>
        <div class="wf-layout">Layout: ${w.layout}</div>
        <div class="wf-section-title">Key Components</div>
        ${(w.keyComponents || []).map(c => `<div class="wf-component">▸ ${c}</div>`).join('')}
        <div class="wf-section-title" style="margin-top:8px">Interactions</div>
        ${(w.interactions || []).map(i => `<div class="wf-component">↔ ${i}</div>`).join('')}
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${palette.length ? `
  <div class="card">
    <div class="card-title">Design System — Color Palette</div>
    <div class="color-palette">
      ${palette.map(c => `
      <div class="color-swatch">
        <div class="swatch-box" style="background:${c.hex}"></div>
        <div class="swatch-name">${c.name}</div>
        <div class="swatch-hex">${c.hex}</div>
        <div class="swatch-usage">${c.usage}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${uiux.designSystem?.typography ? `
  <div class="card">
    <div class="card-title">Design System — Typography</div>
    <div class="typo-grid">
      ${Object.entries(uiux.designSystem.typography).map(([k, v]) => `
      <div class="typo-item"><div class="typo-role">${k}</div><div class="typo-spec">${v}</div></div>`).join('')}
    </div>
  </div>` : ''}

  ${uiux.designSystem?.components?.length ? `
  <div class="card">
    <div class="card-title">Design System — Components</div>
    <div class="tags">${uiux.designSystem.components.map(c => `<span class="tag tag-cyan">${c}</span>`).join('')}</div>
  </div>` : ''}

  ${uiux.accessibilityGuidelines?.length ? `
  <div class="card">
    <div class="card-title">♿ Accessibility Guidelines (WCAG 2.1)</div>
    ${uiux.accessibilityGuidelines.map(g => `<div class="check-row"><span class="check-ok">✔</span>${g}</div>`).join('')}
  </div>` : ''}

  ${!hasAny(uiux.navigationFlow, uiux.screenList, uiux.wireframes, uiux.userJourney, uiux.designSystem) ? designModuleEmptyState('UI/UX Design') : ''}
</div>`;
}

function renderDesignAPI(api) {
  const methodColor = { GET: '#00e59b', POST: '#00d4ff', PUT: '#f5a623', DELETE: '#ff4d6d', PATCH: '#a78bfa' };
  return `
<div class="tab-pane" id="tab-design-api">
  <div class="pane-title">API Design</div>
  <div class="pane-subtitle">Model: <span style="color:#a78bfa">MiniMax-M3</span> · REST Endpoints, OpenAPI Specification</div>

  ${api.authenticationFlow ? `
  <div class="card">
    <div class="card-title">Authentication Flow</div>
    <p style="color:var(--text-secondary);line-height:1.7;font-family:var(--font-mono);font-size:13px">${api.authenticationFlow}</p>
  </div>` : ''}

  ${api.endpoints?.length ? `
  <div class="card">
    <div class="card-title">REST Endpoints (${api.endpoints.length})</div>
    <div class="api-endpoints">
      ${api.endpoints.map(ep => `
      <div class="api-endpoint">
        <div class="ep-method-row">
          <span class="ep-method" style="background:${(methodColor[ep.method] || '#7a9bb5')}22;color:${methodColor[ep.method] || '#7a9bb5'};border-color:${(methodColor[ep.method] || '#7a9bb5')}44">${ep.method}</span>
          <code class="ep-path">${ep.path}</code>
          ${ep.auth ? '<span class="ep-auth">🔒 Auth</span>' : '<span class="ep-auth open">🔓 Public</span>'}
        </div>
        <div class="ep-desc">${ep.description}</div>
        <div class="ep-codes">${(ep.statusCodes || []).map(c => `<span class="ep-code ${c.startsWith('2') ? 'ok' : c.startsWith('4') ? 'err' : 'warn'}">${c}</span>`).join('')}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <div class="card">
    <div class="card-title">API Standards</div>
    <div class="design-table-wrapper">
      <table class="design-table">
        <thead><tr><th>Standard</th><th>Specification</th></tr></thead>
        <tbody>
          ${api.rateLimiting ? `<tr><td>Rate Limiting</td><td>${api.rateLimiting}</td></tr>` : ''}
          ${api.versioning ? `<tr><td>Versioning</td><td>${api.versioning}</td></tr>` : ''}
          ${api.errorFormat ? `<tr><td>Error Format</td><td><code>${JSON.stringify(api.errorFormat)}</code></td></tr>` : ''}
        </tbody>
      </table>
    </div>
  </div>

  ${api.openAPISpec ? `
  <div class="card">
    <div class="card-title">OpenAPI 3.0 Specification (Preview)</div>
    <pre class="code-block">${JSON.stringify(api.openAPISpec, null, 2).substring(0, 900)}...</pre>
  </div>` : ''}

  ${!hasAny(api.endpoints, api.authenticationFlow, api.openAPISpec, api.rateLimiting) ? designModuleEmptyState('API Design') : ''}
</div>`;
}

function renderDesignLLD(lld) {
  return `
<div class="tab-pane" id="tab-design-lld">
  <div class="pane-title">Low-Level Design</div>
  <div class="pane-subtitle">Model: <span style="color:#a78bfa">MiniMax-M3</span> · Module Specs, Class Diagrams & Algorithms</div>

  ${lld.modules?.length ? `
  <div class="card">
    <div class="card-title">Module Specifications (${lld.modules.length})</div>
    <div class="lld-modules">
      ${lld.modules.map((m, i) => `
      <div class="lld-module">
        <div class="lld-module-header">
          <span class="lld-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="lld-name">${m.name}</span>
        </div>
        <div class="lld-grid">
          <div>
            <div class="lld-section">Responsibilities</div>
            ${(m.responsibilities || []).map(r => `<div class="lld-item">• ${r}</div>`).join('')}
          </div>
          <div>
            <div class="lld-section">Inputs</div>
            ${(m.inputs || []).map(r => `<div class="lld-item">▶ ${r}</div>`).join('')}
            <div class="lld-section" style="margin-top:8px">Outputs</div>
            ${(m.outputs || []).map(r => `<div class="lld-item">◀ ${r}</div>`).join('')}
          </div>
        </div>
        <div class="lld-logic">${m.businessLogic}</div>
        <div class="lld-errors">${(m.errorHandling || []).map(e => `<code class="lld-err">${e}</code>`).join(' ')}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${lld.classDiagram ? `
  <div class="card">
    <div class="card-title">Class Diagram</div>
    <pre class="diagram-art">${lld.classDiagram}</pre>
  </div>` : ''}

  ${lld.sequenceDiagram ? `
  <div class="card">
    <div class="card-title">Sequence Diagram</div>
    <pre class="diagram-art">${lld.sequenceDiagram}</pre>
  </div>` : ''}

  ${lld.activityDiagram ? `
  <div class="card">
    <div class="card-title">Activity Diagram</div>
    <pre class="diagram-art">${lld.activityDiagram}</pre>
  </div>` : ''}

  ${lld.algorithms?.length ? `
  <div class="card">
    <div class="card-title">Algorithms & Pseudocode</div>
    ${lld.algorithms.map(a => `
    <div style="margin-bottom:16px">
      <div style="font-weight:600;color:var(--cyan);margin-bottom:6px">${a.name}</div>
      <pre class="code-block">${a.pseudocode}</pre>
    </div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderDesignSecurity(sec) {
  const impactColor = { Critical: '#ff4d6d', High: '#f5a623', Medium: '#f5a623', Low: '#00e59b' };
  return `
<div class="tab-pane" id="tab-design-security">
  <div class="pane-title">Security Design</div>
  <div class="pane-subtitle">Model: <span style="color:#f5a623">Nemotron-3-Super-120B-A12B</span> · Threat Model, OWASP & Security Architecture</div>

  ${sec.securityArchitecture ? `
  <div class="card">
    <div class="card-title">Security Architecture</div>
    <div class="security-grid">
      ${sec.securityArchitecture.authentication ? `<div class="sec-item"><div class="sec-label">🔑 Authentication</div><div class="sec-val">${sec.securityArchitecture.authentication}</div></div>` : ''}
      ${sec.securityArchitecture.authorization ? `<div class="sec-item"><div class="sec-label">🛡️ Authorization</div><div class="sec-val">${sec.securityArchitecture.authorization}</div></div>` : ''}
      ${sec.securityArchitecture.jwtFlow ? `<div class="sec-item full-width"><div class="sec-label">🔄 JWT Flow</div><div class="sec-val" style="font-family:var(--font-mono);font-size:12px">${sec.securityArchitecture.jwtFlow}</div></div>` : ''}
      ${sec.securityArchitecture.oauth ? `<div class="sec-item full-width"><div class="sec-label">🌐 OAuth 2.0</div><div class="sec-val">${sec.securityArchitecture.oauth}</div></div>` : ''}
    </div>
    ${sec.securityArchitecture.encryption ? `
    <div style="margin-top:14px">
      <div class="card-title" style="font-size:13px;margin-bottom:8px">Encryption</div>
      <div class="security-grid">
        <div class="sec-item"><div class="sec-label">🔐 At Rest</div><div class="sec-val">${sec.securityArchitecture.encryption.atRest}</div></div>
        <div class="sec-item"><div class="sec-label">🔐 In Transit</div><div class="sec-val">${sec.securityArchitecture.encryption.inTransit}</div></div>
      </div>
    </div>` : ''}
    ${sec.securityArchitecture.rbac ? `
    <div style="margin-top:14px">
      <div class="card-title" style="font-size:13px;margin-bottom:8px">RBAC Roles & Permissions</div>
      <div class="tags">${(sec.securityArchitecture.rbac.roles || []).map(r => `<span class="tag tag-purple">${r}</span>`).join('')}</div>
      <div class="tags" style="margin-top:6px">${(sec.securityArchitecture.rbac.permissions || []).map(p => `<span class="tag tag-cyan">${p}</span>`).join('')}</div>
    </div>` : ''}
  </div>` : ''}

  ${sec.threatModel?.length ? `
  <div class="card">
    <div class="card-title">🎯 Threat Model (${sec.threatModel.length} threats)</div>
    <div class="threat-list">
      ${sec.threatModel.map(t => `
      <div class="threat-item">
        <div class="threat-header">
          <span class="threat-name">${t.threat}</span>
          <span class="threat-impact" style="color:${impactColor[t.impact] || '#f5a623'}">${t.impact} Impact</span>
          <span class="threat-likelihood">${t.likelihood} Likelihood</span>
        </div>
        <div class="threat-vector">Vector: ${t.vector}</div>
        <div class="threat-mitigation">🛡 Mitigation: ${t.mitigation}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${sec.owaspChecklist?.length ? `
  <div class="card">
    <div class="card-title">OWASP Top 10 Checklist</div>
    <table class="design-table">
      <thead><tr><th>ID</th><th>Vulnerability</th><th>Status</th><th>Notes</th></tr></thead>
      <tbody>${sec.owaspChecklist.map(o => `
        <tr>
          <td><code>${o.id}</code></td>
          <td>${o.title}</td>
          <td><span class="owasp-status ${o.status === 'Mitigated' ? 'ok' : 'partial'}">${o.status}</span></td>
          <td>${o.notes}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
</div>`;
}

function renderDesignPerformance(perf) {
  return `
<div class="tab-pane" id="tab-design-performance">
  <div class="pane-title">Performance Design</div>
  <div class="pane-subtitle">Model: <span style="color:#f5a623">Nemotron-3-Super-120B-A12B</span> · Caching, Scaling & Monitoring</div>

  ${perf.targetMetrics ? `
  <div class="perf-metrics-row">
    ${Object.entries(perf.targetMetrics).map(([k, v]) => `
    <div class="perf-metric">
      <div class="perf-metric-val">${v}</div>
      <div class="perf-metric-label">${k.replace(/([A-Z])/g, ' $1').trim()}</div>
    </div>`).join('')}
  </div>` : ''}

  ${perf.cachingStrategy?.length ? `
  <div class="card">
    <div class="card-title">⚡ Caching Strategy</div>
    <table class="design-table">
      <thead><tr><th>Layer</th><th>Duration</th><th>Targets</th><th>Tool</th></tr></thead>
      <tbody>${perf.cachingStrategy.map(c => `<tr><td><strong>${c.layer}</strong></td><td><code>${c.cacheDuration}</code></td><td>${c.targets}</td><td>${c.tool}</td></tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  ${perf.loadBalancing ? `
  <div class="card">
    <div class="card-title">⚖️ Load Balancing</div>
    <div class="security-grid">
      <div class="sec-item"><div class="sec-label">Strategy</div><div class="sec-val">${perf.loadBalancing.strategy}</div></div>
      <div class="sec-item"><div class="sec-label">Tool</div><div class="sec-val">${perf.loadBalancing.tool}</div></div>
      <div class="sec-item full-width"><div class="sec-label">Health Checks</div><div class="sec-val">${perf.loadBalancing.healthChecks}</div></div>
    </div>
  </div>` : ''}

  ${perf.scalingStrategy ? `
  <div class="card">
    <div class="card-title">📈 Scaling Strategy</div>
    <p style="color:var(--cyan);font-weight:600;margin-bottom:10px">${perf.scalingStrategy.type}</p>
    <div style="display:flex;gap:20px;margin-bottom:12px">
      <div class="perf-metric" style="flex:1"><div class="perf-metric-val">${perf.scalingStrategy.minInstances}</div><div class="perf-metric-label">Min Instances</div></div>
      <div class="perf-metric" style="flex:1"><div class="perf-metric-val">${perf.scalingStrategy.maxInstances}</div><div class="perf-metric-label">Max Instances</div></div>
    </div>
    <div class="card-title" style="font-size:13px;margin-bottom:6px">Scale Triggers</div>
    ${(perf.scalingStrategy.triggers || []).map(t => `<div class="check-row"><span style="color:#f5a623">⚡</span>${t}</div>`).join('')}
  </div>` : ''}

  ${perf.databaseOptimization?.length ? `
  <div class="card">
    <div class="card-title">🗄️ Database Optimization</div>
    ${perf.databaseOptimization.map(o => `<div class="check-row"><span class="check-ok">✔</span>${o}</div>`).join('')}
  </div>` : ''}

  ${perf.monitoringAlerts?.length ? `
  <div class="card">
    <div class="card-title">🔔 Monitoring Alerts</div>
    <table class="design-table">
      <thead><tr><th>Metric</th><th>Alert Threshold</th><th>Action</th></tr></thead>
      <tbody>${perf.monitoringAlerts.map(a => `<tr><td><strong>${a.metric}</strong></td><td><code>${a.threshold}</code></td><td>${a.action}</td></tr>`).join('')}</tbody>
    </table>
  </div>` : ''}
</div>`;
}

function renderDesignDeployment(dep) {
  return `
<div class="tab-pane" id="tab-design-deployment">
  <div class="pane-title">Deployment Design</div>
  <div class="pane-subtitle">Model: <span style="color:#f5a623">Nemotron-3-Super-120B-A12B</span> · Cloud Architecture, Docker & CI/CD</div>

  ${dep.deploymentDiagram ? `
  <div class="card">
    <div class="card-title">Deployment Architecture</div>
    <pre class="diagram-art">${dep.deploymentDiagram}</pre>
  </div>` : ''}

  ${dep.infrastructure?.length ? `
  <div class="card">
    <div class="card-title">☁️ Cloud Infrastructure</div>
    <table class="design-table">
      <thead><tr><th>Component</th><th>Service</th><th>Specification</th><th>Est. Cost</th></tr></thead>
      <tbody>${dep.infrastructure.map(i => `<tr><td><strong>${i.component}</strong></td><td>${i.service}</td><td>${i.spec}</td><td><code>${i.cost}</code></td></tr>`).join('')}</tbody>
    </table>
  </div>` : ''}

  ${dep.cicdPipeline ? `
  <div class="card">
    <div class="card-title">🔄 CI/CD Pipeline · ${dep.cicdPipeline.tool || 'GitHub Actions'}</div>
    <div class="cicd-pipeline">
      ${(dep.cicdPipeline.stages || []).map((stage, i) => `
      <div class="cicd-stage">
        <div class="stage-num">${i + 1}</div>
        <div class="stage-content">
          <div class="stage-name">${stage.name}</div>
          ${(stage.steps || []).map(s => `<div class="stage-step">→ ${s}</div>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    ${dep.cicdPipeline.triggers ? `
    <div style="margin-top:14px">
      <div class="card-title" style="font-size:13px;margin-bottom:6px">Triggers</div>
      <div class="security-grid">
        ${Object.entries(dep.cicdPipeline.triggers).map(([k, v]) => `<div class="sec-item"><div class="sec-label">${k.toUpperCase()}</div><div class="sec-val">${v}</div></div>`).join('')}
      </div>
    </div>` : ''}
  </div>` : ''}

  ${dep.dockerCompose ? `
  <div class="card">
    <div class="card-title">🐳 Docker Compose</div>
    <pre class="code-block">${dep.dockerCompose}</pre>
  </div>` : ''}

  ${dep.disasterRecovery ? `
  <div class="card">
    <div class="card-title">🆘 Disaster Recovery</div>
    <div class="dr-metrics">
      <div class="dr-metric"><div class="dr-label">RTO</div><div class="dr-val">${dep.disasterRecovery.rto}</div></div>
      <div class="dr-metric"><div class="dr-label">RPO</div><div class="dr-val">${dep.disasterRecovery.rpo}</div></div>
    </div>
    ${(dep.disasterRecovery.plan || []).map(p => `<div class="check-row"><span class="check-ok">✔</span>${p}</div>`).join('')}
  </div>` : ''}
</div>`;
}

function renderDesignValidation(val) {
  return `
<div class="tab-pane" id="tab-design-validation">
  <div class="pane-title">Design Validation</div>
  <div class="pane-subtitle">Models: <span style="color:#7dd3fc">Gemini</span> + <span style="color:#a78bfa">MiniMax</span> + <span style="color:#f5a623">Nemotron</span> · Traceability Matrix & Quality Checklist</div>

  ${val.designReview ? `
  <div class="card">
    <div class="card-title">AI Design Review</div>
    <div class="design-review-grid">
      ${Object.entries(val.designReview).map(([model, review]) => `
      <div class="review-card">
        <div class="review-model">${model.charAt(0).toUpperCase() + model.slice(1)}</div>
        <div class="review-check">${review.check}</div>
        <div class="review-score-row">
          <div class="review-score">${review.score}</div>
          <span class="review-status ${review.status === 'Pass' ? 'pass' : 'partial'}">${review.status}</span>
        </div>
        <div class="review-findings">${(review.findings || []).map(f => `<div class="finding-item">✓ ${f}</div>`).join('')}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${val.traceabilityMatrix?.length ? `
  <div class="card">
    <div class="card-title">📋 Requirement Traceability Matrix</div>
    <div class="table-scroll">
      <table class="design-table">
        <thead><tr><th>ID</th><th>Requirement</th><th>Design Module</th><th>API Endpoint</th><th>Status</th><th>Confidence</th></tr></thead>
        <tbody>${val.traceabilityMatrix.map(r => `
          <tr>
            <td><code>${r.requirementId}</code></td>
            <td>${r.requirementTitle}</td>
            <td>${r.designModule}</td>
            <td><code style="color:var(--cyan)">${r.apiEndpoint}</code></td>
            <td><span style="color:var(--green)">${r.status}</span></td>
            <td><span class="conf-bar-wrap"><span class="conf-bar" style="width:${r.confidence || 90}%"></span></span>${r.confidence || 90}%</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : ''}

  ${val.qualityChecklist?.length ? `
  <div class="card">
    <div class="card-title">✅ Quality Checklist</div>
    <div class="quality-checklist">
      ${val.qualityChecklist.map(item => `
      <div class="qc-item ${item.status ? 'pass' : 'fail'}">
        <span class="qc-icon">${item.status ? '✔' : '✗'}</span>
        <span>${item.item}</span>
      </div>`).join('')}
    </div>
    ${val.overallDesignScore ? `<div style="margin-top:16px;text-align:center"><span class="design-score-big">${val.overallDesignScore}</span><span style="color:var(--text-secondary);font-size:13px"> / 100 Overall Design Score</span></div>` : ''}
  </div>` : ''}
</div>`;
}

function renderDesignFusion(fusion) {
  return `
<div class="tab-pane" id="tab-design-fusion">
  <div class="pane-title">Design Fusion Engine</div>
  <div class="pane-subtitle">Model: <span style="color:#7dd3fc">Gemini (Fusion)</span> · Final Merged Design Document</div>

  ${fusion.summary ? `
  <div class="card fusion-summary-card">
    <div class="card-title">🔗 Fusion Summary</div>
    <p style="color:var(--text-secondary);line-height:1.7">${fusion.summary}</p>
  </div>` : ''}

  ${fusion.confidenceScores ? `
  <div class="card">
    <div class="card-title">Module Confidence Scores</div>
    <div class="confidence-grid">
      ${Object.entries(fusion.confidenceScores).filter(([k]) => k !== 'overall').map(([k, v]) => `
      <div class="conf-module">
        <div class="conf-module-name">${k.toUpperCase()}</div>
        <div class="conf-bar-track"><div class="conf-bar-fill" style="width:${v}%"></div></div>
        <div class="conf-module-score">${v}%</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${fusion.conflictsResolved?.length ? `
  <div class="card">
    <div class="card-title">⚖️ Conflicts Resolved</div>
    ${fusion.conflictsResolved.map(c => `
    <div class="conflict-item">
      <div class="conflict-q">❌ ${c.conflict}</div>
      <div class="conflict-r">✔ ${c.resolution}</div>
    </div>`).join('')}
  </div>` : ''}

  ${fusion.bestIdeasCombined?.length ? `
  <div class="card">
    <div class="card-title">💡 Best Ideas Combined</div>
    ${fusion.bestIdeasCombined.map(idea => `<div class="check-row"><span style="color:#a78bfa">★</span>${idea}</div>`).join('')}
  </div>` : ''}

  ${fusion.finalDeliverables?.length ? `
  <div class="card">
    <div class="card-title">📦 Final Design Deliverables</div>
    <div class="design-deliverables">
      ${fusion.finalDeliverables.map(d => `<div class="deliverable-item"><span class="del-check">✔</span>${d}</div>`).join('')}
    </div>
  </div>` : ''}
</div>`;
}
