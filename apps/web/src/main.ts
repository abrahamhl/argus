import { runInspection, InspectionResultV1 } from './api/argus';
import { t, setLocale } from './i18n';

const app = document.getElementById('app');
let isDemoMode = false;
let currentResult: InspectionResultV1 | null = null;
let currentFindingMode = 'client';

if (app) {
  app.innerHTML = `
    <!-- Persistent Demo Banner -->
    <div id="demo-banner" style="display: none; background: var(--warning); color: #000; text-align: center; font-weight: bold; padding: 0.5rem; letter-spacing: 0.2em; z-index: 1000; position: sticky; top: 0;">
      DEMO MODE ACTIVE - NOT LIVE DATA
    </div>

    <header class="terminal-header">
      <div class="brand">ARGUS</div>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <select id="lang-select" style="background: transparent; color: var(--text-muted); border: 1px solid var(--text-muted); padding: 0.2rem; font-family: var(--font-mono);">
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="nl">NL</option>
        </select>
        <div class="mode-badge" style="background: transparent; border-color: rgba(255,255,255,0.1); color: var(--text-muted); cursor: pointer;" id="toggle-demo">
          LIVE MODE
        </div>
        <div class="mode-badge" style="cursor: pointer;" onclick="navTo('00-about')">
          ${t('ABOUT_ARGUS')}
        </div>
      </div>
    </header>

    <!-- MAIN NAVIGATION -->
    <nav class="main-nav" id="main-nav">
      <div class="nav-item active" data-nav="01-discover">01 DISCOVER</div>
      <div class="nav-item" data-nav="02-inspect">02 INSPECT</div>
      <div class="nav-item" data-nav="03-evidence">03 EVIDENCE</div>
      <div class="nav-item" data-nav="04-findings">04 FINDINGS</div>
      <div class="nav-item" data-nav="05-opportunities">05 OPPORTUNITIES</div>
      <div class="nav-item" data-nav="06-retest">06 RETEST</div>
    </nav>

    <main class="container">
      
      <!-- 00 ABOUT -->
      <section id="screen-00-about" class="screen">
        <div class="panel">
          <h2 class="text-cyan mb-1">${t('ABOUT_ARGUS')}</h2>
          <p class="mb-1 text-muted">ARGUS is a deterministic, passive intelligence platform.</p>
          <ul style="color: var(--text-muted); margin-left: 1.5rem; line-height: 1.8;">
            <li><strong>PUBLIC PASSIVE:</strong> No active payloads or intrusive testing.</li>
            <li><strong>DETERMINISTIC:</strong> No LLM hallucinations. Findings are based on strict rule matching against verifiable evidence.</li>
            <li><strong>PRIVACY-FIRST:</strong> No telemetry, no persistent location tracking.</li>
          </ul>
          <button class="btn mt-2" onclick="navTo('01-discover')">BACK</button>
        </div>
      </section>

      <!-- 01 DISCOVER -->
      <section id="screen-01-discover" class="screen active">
        <div class="panel">
          <h2 class="mb-1 text-cyan">FIELD MISSION</h2>
          <p class="mb-2 font-mono text-muted">Evidence & Opportunity Control Plane.</p>
          
          <div class="grid mb-2">
            <button class="btn primary btn-lg" id="btn-new-field-audit">${t('NEW_FIELD_AUDIT')}</button>
            <button class="btn btn-lg" id="btn-near-me">${t('NEAR_ME')}</button>
          </div>

          <div id="target-dossier" style="display: none; margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
            <h3 class="mb-1">Target Dossier</h3>
            
            <div class="form-group">
              <label>Domain</label>
              <input type="text" id="input-domain" placeholder="example.com" required style="font-size: 1.2rem; padding: 1rem;" />
            </div>
            
            <div class="grid mb-1">
              <div class="form-group">
                <label>Organisation Label</label>
                <input type="text" id="input-org" placeholder="Example Corp" />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select id="input-category" class="select-input">
                  <option value="ecommerce">E-Commerce</option>
                  <option value="corporate">Corporate / B2B</option>
                  <option value="saas">SaaS</option>
                </select>
              </div>
            </div>

            <div class="legal-widget mb-2">
              <div>
                <div class="font-mono text-muted" style="font-size: 0.8rem">SCOPE POLICY</div>
                <div style="font-size: 1.1rem; color: #fff;">PUBLIC_PASSIVE</div>
              </div>
            </div>

            <div class="form-group mb-2">
              <label style="display: flex; gap: 0.5rem; align-items: flex-start; color: var(--text-main);">
                <input type="checkbox" id="check-policy" style="margin-top: 0.25rem; width: 1.5rem; height: 1.5rem;" />
                <span class="label-text">${t('POLICY_TEXT')}</span>
              </label>
            </div>

            <div class="grid">
              <button class="btn primary btn-lg" id="btn-confirm-target">${t('CONFIRM_TARGET')}</button>
              <button class="btn btn-lg" id="btn-cancel-target">${t('CANCEL')}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 02 INSPECT -->
      <section id="screen-02-inspect" class="screen">
        <div class="panel">
          <h3 class="mb-1 text-cyan">ACTIVE INTELLIGENCE GATHERING</h3>
          <div class="font-mono text-muted mb-2">TARGET: <span id="display-target"></span></div>
          
          <div class="inspection-loader" id="real-loader">
            <div class="inspection-step active" id="step-validate">VALIDATING TARGET</div>
            <div class="inspection-step" id="step-collect">COLLECTING DNS/HTTP</div>
            <div class="inspection-step" id="step-build">BUILDING EVIDENCE</div>
            <div class="inspection-step" id="step-eval">EVALUATING FINDINGS</div>
          </div>

          <div id="inspect-error" style="display: none; margin-top: 2rem; border-left: 4px solid var(--danger); padding: 1rem; background: rgba(255,0,0,0.1);">
            <h4 class="text-danger">INSPECTION FAILED</h4>
            <p id="error-msg" class="font-mono mt-1"></p>
            <button class="btn mt-1" onclick="navTo('01-discover')">BACK</button>
          </div>
        </div>
      </section>

      <!-- 03 EVIDENCE -->
      <section id="screen-03-evidence" class="screen">
        <div class="panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 class="text-cyan">EVIDENCE GRAPH</h3>
          </div>
          <div id="evidence-graph-container" class="evidence-graph"></div>
          <div class="grid mt-2">
            <button class="btn primary" onclick="navTo('04-findings')">CONTINUE TO FINDINGS</button>
            <button class="btn" onclick="navTo('08-field')">VIEW FIELD MODE</button>
          </div>
        </div>
      </section>

      <!-- 04 FINDINGS -->
      <section id="screen-04-findings" class="screen">
        <div class="mode-toggle">
          <button class="btn primary mode-btn" data-mode="client">CLIENT MODE</button>
          <button class="btn mode-btn" data-mode="engineer">ENGINEER MODE</button>
        </div>
        <div id="findings-container"></div>
        <button class="btn mt-2 primary" onclick="navTo('05-opportunities')">CONTINUE TO OPPORTUNITIES</button>
      </section>

      <!-- 05 OPPORTUNITIES -->
      <section id="screen-05-opportunities" class="screen">
        <div class="panel" style="border-left-color: var(--success);">
          <h3 class="mb-1 text-cyan">OPPORTUNITY COMMAND BOARD</h3>
          <div id="opp-container"></div>
        </div>
      </section>

      <!-- 06 RETEST -->
      <section id="screen-06-retest" class="screen">
        <div class="panel">
          <h3 class="mb-1 text-cyan">PROOF OF REMEDIATION</h3>
          <p class="font-mono text-muted mb-2">BASELINE → REMEDIATION → RETEST → VERIFIED CHANGE</p>
          <div class="grid mb-1">
            <button class="btn" disabled>SELECT BASELINE (PLANNED)</button>
            <button class="btn" disabled>RUN RETEST (PLANNED)</button>
          </div>
          <p class="text-muted text-center mt-2">Retest evidence comparison requires backend connection to Claude model.</p>
        </div>
      </section>

      <!-- 08 FIELD SALES MODE (Minimalist) -->
      <section id="screen-08-field" class="screen">
        <div class="panel" style="border-left-color: #fff; background: #000;">
          <h3 class="mb-1 text-cyan" style="font-size: 1.5rem;">FIELD SUMMARY</h3>
          <p class="text-muted mb-2">Minimal business view for presentation.</p>
          <div id="field-mode-content"></div>
          <div class="grid mt-2">
            <button class="btn primary" onclick="navTo('09-client-brief')">GENERATE CLIENT BRIEF</button>
            <button class="btn" onclick="navTo('04-findings')">EXIT FIELD MODE</button>
          </div>
        </div>
      </section>

      <!-- 09 CLIENT BRIEF (Printable) -->
      <section id="screen-09-client-brief" class="screen">
        <div class="panel print-panel" style="background: #fff; color: #000;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h2>ARGUS CLIENT BRIEF</h2>
            <button class="btn hide-print" style="color: #000; border-color: #000;" onclick="window.print()">[ PRINT / SAVE PDF ]</button>
          </div>
          <div id="client-brief-content"></div>
        </div>
        <button class="btn hide-print mt-1" onclick="navTo('05-opportunities')">BACK</button>
      </section>
      
    </main>
  `;

  // UI Flow Logic
  (window as any).navTo = (navId: string) => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(`screen-${navId}`)?.classList.add("active");
    
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const navEl = document.querySelector(`.nav-item[data-nav="${navId}"]`);
    if(navEl) navEl.classList.add("active");

    if (navId === '03-evidence') renderEvidence();
    if (navId === '04-findings') renderFindings();
    if (navId === '05-opportunities') renderOpportunities();
    if (navId === '08-field') renderFieldMode();
    if (navId === '09-client-brief') renderClientBrief();
  };

  document.querySelectorAll(".nav-item").forEach(el => {
    el.addEventListener("click", (e) => {
      const navId = (e.currentTarget as HTMLElement).dataset.nav;
      if(navId && currentResult) (window as any).navTo(navId);
    });
  });

  document.getElementById("toggle-demo")?.addEventListener("click", (e) => {
    isDemoMode = !isDemoMode;
    const btn = e.currentTarget as HTMLElement;
    const banner = document.getElementById("demo-banner");
    if (isDemoMode) {
      btn.textContent = "DEMO MODE";
      btn.style.color = "var(--warning)";
      btn.style.borderColor = "var(--warning)";
      if(banner) banner.style.display = "block";
    } else {
      btn.textContent = "LIVE MODE";
      btn.style.color = "var(--text-muted)";
      btn.style.borderColor = "rgba(255,255,255,0.1)";
      if(banner) banner.style.display = "none";
    }
  });

  document.getElementById("btn-new-field-audit")?.addEventListener("click", () => {
    document.getElementById("target-dossier")!.style.display = "block";
  });

  document.getElementById("btn-cancel-target")?.addEventListener("click", () => {
    document.getElementById("target-dossier")!.style.display = "none";
  });

  document.getElementById("btn-near-me")?.addEventListener("click", () => {
    alert("NEAR ME (BETA): Geolocation discovery is currently unlinked.");
  });

  document.getElementById("lang-select")?.addEventListener("change", (e) => {
    setLocale((e.target as HTMLSelectElement).value as any);
    document.getElementById("btn-new-field-audit")!.textContent = t('NEW_FIELD_AUDIT');
    document.getElementById("btn-near-me")!.textContent = t('NEAR_ME');
    document.getElementById("btn-confirm-target")!.textContent = t('CONFIRM_TARGET');
    document.getElementById("btn-cancel-target")!.textContent = t('CANCEL');
    const policyLabel = document.querySelector(".label-text");
    if (policyLabel) policyLabel.textContent = t('POLICY_TEXT');
  });

  const normalizeDomain = (input: string) => {
    let url = input.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    try {
      return new URL(url).hostname;
    } catch {
      return input;
    }
  };

  document.getElementById("btn-confirm-target")?.addEventListener("click", async () => {
    const rawDomain = (document.getElementById("input-domain") as HTMLInputElement).value;
    const policy = (document.getElementById("check-policy") as HTMLInputElement).checked;
    
    if (!rawDomain) return alert("Domain is required");
    if (!policy) return alert("You must confirm authorization");
    
    if (!navigator.onLine && !isDemoMode) {
      return alert(t('ERROR_NETWORK'));
    }

    const domain = normalizeDomain(rawDomain);
    const dt = document.getElementById("display-target");
    if(dt) dt.textContent = domain;
    
    (window as any).navTo('02-inspect');
    
    // Simulate UI loader while awaiting fetch
    const steps = ["step-validate", "step-collect", "step-build", "step-eval"];
    let stepIdx = 0;
    const loadInt = setInterval(() => {
      if (stepIdx > 0) document.getElementById(steps[stepIdx-1])?.classList.replace("active", "done");
      if (stepIdx < steps.length) document.getElementById(steps[stepIdx])?.classList.add("active");
      stepIdx++;
    }, 600);

    try {
      const res = await runInspection(domain, isDemoMode);
      clearInterval(loadInt);
      steps.forEach(s => document.getElementById(s)?.classList.add("done"));
      currentResult = res;
      setTimeout(() => (window as any).navTo('03-evidence'), 500);
    } catch (err: any) {
      clearInterval(loadInt);
      document.getElementById("inspect-error")!.style.display = "block";
      document.getElementById("error-msg")!.textContent = err.message || "Unknown error";
    }
  });

  // Renderers
  const renderEvidence = () => {
    const c = document.getElementById("evidence-graph-container");
    if (!c || !currentResult) return;
    
    if (currentResult.results.length === 0) {
      c.innerHTML = `<div class="panel" style="text-align: center; border-color: var(--text-muted);"><h4 class="text-muted">${t('NO_FINDINGS')}</h4><p>${t('NO_FINDINGS_DESC')}</p></div>`;
      return;
    }

    let html = `
      <div class="graph-node">
        <div class="node-type">TARGET</div>
        <div class="node-val">${currentResult.target}</div>
      </div>
    `;
    currentResult.results.forEach(f => {
      html += `
        <div class="graph-edge">↓</div>
        <div class="graph-node" style="border-color: var(--accent-cyan);">
          <div class="node-type" style="color: var(--accent-cyan);">EVIDENCE: ${f.collector}</div>
          <div class="node-val font-mono" style="font-size:0.8rem;">${f.evidenceId} | Hash: ${f.hash.substring(0,8)}</div>
          <div class="font-mono text-muted mt-1" style="font-size: 0.7rem;">[ PROVENANCE VERIFIED ]</div>
        </div>
      `;
    });
    c.innerHTML = html;
  };

  document.querySelectorAll(".mode-btn").forEach(el => {
    el.addEventListener("click", (e) => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("primary"));
      const btn = e.currentTarget as HTMLElement;
      btn.classList.add("primary");
      currentFindingMode = btn.dataset.mode || "client";
      renderFindings();
    });
  });

  const renderFindings = () => {
    const c = document.getElementById("findings-container");
    if(!c || !currentResult) return;
    if (currentResult.results.length === 0) {
      c.innerHTML = `<div class="panel"><h4 class="text-muted">${t('NO_FINDINGS')}</h4></div>`;
      return;
    }
    
    let html = "";
    currentResult.results.forEach(f => {
      if (currentFindingMode === "client") {
        html += `
          <div class="panel">
            <h4 style="margin-bottom: 0.5rem;">${f.title}</h4>
            <p class="mb-1">${f.clientDescription}</p>
            <div class="data-row"><span class="data-label">Business Significance</span><span class="data-value">${f.businessSignificance}</span></div>
            <div class="data-row"><span class="data-label">Recommended Action</span><span class="data-value">${f.recommendedAction}</span></div>
            <div class="data-row"><span class="data-label">Complexity</span><span class="data-value">${f.complexity}</span></div>
            <div class="data-row"><span class="data-label">Retest Availability</span><span class="data-value">${f.retestStatus}</span></div>
          </div>
        `;
      } else {
        html += `
          <div class="panel font-mono" style="font-size: 0.85rem;">
            <div class="mb-1 text-cyan">[${f.id}] ${f.title}</div>
            <div class="data-row"><span class="data-label">Collector</span><span class="data-value">${f.collector}</span></div>
            <div class="data-row"><span class="data-label">Rule ID</span><span class="data-value">${f.ruleId || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">Provenance</span><span class="data-value">${f.provenance || 'N/A'}</span></div>
            <div class="data-row"><span class="data-label">Source</span><span class="data-value">${f.source}</span></div>
            <div class="data-row"><span class="data-label">Hash</span><span class="data-value">${f.hash}</span></div>
            <div class="data-row"><span class="data-label">Technical</span><span class="data-value">${f.technicalDetails}</span></div>
          </div>
        `;
      }
    });
    c.innerHTML = html;
  };

  const renderOpportunities = () => {
    const c = document.getElementById("opp-container");
    if(!c || !currentResult) return;
    if (currentResult.results.length === 0) {
      c.innerHTML = `<div class="font-mono text-muted">${t('NO_FINDINGS')}</div>`;
      return;
    }
    
    let html = "";
    currentResult.results.forEach(f => {
      html += `
        <div class="opportunity-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h4 style="font-size:1.1rem;">${f.category} Hardening</h4>
            <span class="status-badge" style="border: 1px solid var(--accent-cyan); color: var(--accent-cyan);">IMPROVEMENT OPPORTUNITY</span>
          </div>
          <div class="data-row mt-1"><span class="data-label">Business Area</span><span class="data-value">${f.category}</span></div>
          <div class="data-row"><span class="data-label">Complexity</span><span class="data-value">${f.complexity}</span></div>
          <div class="data-row"><span class="data-label">Supporting Findings</span><span class="data-value">1</span></div>
          
          <div class="grid mt-2" style="gap:0.5rem;">
            <button class="btn primary" style="font-size:0.75rem;" onclick="navTo('09-client-brief')">CLIENT BRIEF</button>
            <button class="btn" style="font-size:0.75rem;" disabled>REMEDIATION PLAN (PLANNED)</button>
            <button class="btn" style="font-size:0.75rem;" disabled>ADD TO PROPOSAL (PLANNED)</button>
          </div>
        </div>
      `;
    });
    c.innerHTML = html;
  };

  const renderFieldMode = () => {
    const c = document.getElementById("field-mode-content");
    if(!c || !currentResult) return;
    if (currentResult.results.length === 0) {
      c.innerHTML = `<h4>${t('NO_FINDINGS')}</h4>`;
      return;
    }
    let html = `<h4 class="mb-1">${currentResult.target}</h4>`;
    currentResult.results.forEach(f => {
      html += `
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #333;">
          <div class="font-mono text-muted mb-1" style="font-size:0.8rem;">OBSERVED CONFIGURATION</div>
          <h4 style="font-size: 1.2rem; color: #fff; margin-bottom: 0.5rem;">${f.title}</h4>
          <p style="color: #ccc; margin-bottom: 1rem;">${f.clientDescription}</p>
          <div class="font-mono text-muted mb-1" style="font-size:0.8rem;">RECOMMENDED HARDENING</div>
          <p style="color: var(--accent-cyan);">${f.recommendedAction}</p>
        </div>
      `;
    });
    c.innerHTML = html;
  };

  const renderClientBrief = () => {
    const c = document.getElementById("client-brief-content");
    if(!c || !currentResult) return;
    const date = new Date().toLocaleDateString();
    let html = `
      <div style="margin-bottom: 2rem;">
        <strong>ORGANISATION:</strong> ${(document.getElementById('input-org') as HTMLInputElement).value || currentResult.target}<br/>
        <strong>DOMAIN:</strong> ${currentResult.target}<br/>
        <strong>DATE:</strong> ${date}<br/>
        <strong>SCOPE:</strong> PUBLIC PASSIVE
      </div>
      <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-bottom: 1rem;">EXECUTIVE SUMMARY</h3>
      <p style="margin-bottom: 2rem;">A passive intelligence gathering operation was performed on the public perimeter of ${currentResult.target}. The assessment identified specific configurations that present opportunities for hardening and improved compliance.</p>
      <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; margin-bottom: 1rem;">VERIFIED OBSERVATIONS & OPPORTUNITIES</h3>
    `;
    if (currentResult.results.length === 0) {
      html += `<p>${t('NO_FINDINGS_DESC')}</p>`;
    } else {
      currentResult.results.forEach(f => {
        html += `
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem;">${f.title}</h4>
            <p style="margin-bottom: 0.5rem;"><strong>Observation:</strong> ${f.clientDescription}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Business Relevance:</strong> ${f.businessSignificance}</p>
            <p><strong>Recommendation:</strong> ${f.recommendedAction}</p>
          </div>
        `;
      });
    }
    c.innerHTML = html;
  };
}
