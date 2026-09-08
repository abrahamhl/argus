const app = document.getElementById('app');

if (app) {
  app.innerHTML = `
    <header class="terminal-header">
      <div class="brand">ARGUS</div>
      <div class="mode-badge">PUBLIC PASSIVE</div>
    </header>
    <main class="container">
      
      <!-- SCREEN 1: HOME -->
      <section id="screen-home" class="screen active">
        <div class="panel">
          <h2 class="mb-1">Field Intelligence Control Plane</h2>
          <p class="mb-2 font-mono text-muted">Evidence & Opportunity Analysis System</p>
          <button class="btn primary" id="btn-new-target">New Target</button>
        </div>
      </section>

      <!-- SCREEN 2: TARGET -->
      <section id="screen-target" class="screen">
        <div class="step-indicator">
          <div class="step active">TARGET</div>
          <div class="step">INSPECTION</div>
          <div class="step">RESULTS</div>
        </div>
        
        <div class="panel">
          <h3 class="mb-1">Target Specification</h3>
          
          <div class="form-group">
            <label>Domain</label>
            <input type="url" id="input-domain" placeholder="https://example.com" required />
          </div>
          
          <div class="form-group">
            <label>Organisation Label (Optional)</label>
            <input type="text" id="input-org" placeholder="Example Corp" />
          </div>

          <div class="form-group">
            <label>Category</label>
            <select id="input-category" style="width:100%; padding: 0.75rem; background: var(--bg-surface); color: white; border: 1px solid rgba(255,255,255,0.1); font-family: var(--font-mono);">
              <option value="ecommerce">E-Commerce</option>
              <option value="corporate">Corporate / B2B</option>
              <option value="saas">SaaS</option>
            </select>
          </div>

          <div class="form-group mt-2 mb-2">
            <label class="text-cyan">Policy Acknowledgment</label>
            <label style="display: flex; gap: 0.5rem; align-items: flex-start; text-transform: none; color: var(--text-main); font-family: var(--font-sans);">
              <input type="checkbox" id="check-policy" style="margin-top: 0.25rem;" />
              I confirm authorization to perform passive intelligence gathering on this target.
            </label>
          </div>

          <button class="btn primary" id="btn-confirm-target">Confirm Target</button>
          <button class="btn" id="btn-cancel-target">Cancel</button>
        </div>
      </section>

      <!-- SCREEN 3: INSPECTION -->
      <section id="screen-inspection" class="screen">
        <div class="step-indicator">
          <div class="step">TARGET</div>
          <div class="step active">INSPECTION</div>
          <div class="step">RESULTS</div>
        </div>

        <div class="panel">
          <h3 class="mb-1 text-cyan">Active Intelligence Gathering</h3>
          <div class="font-mono text-muted mb-2">TARGET: <span id="display-target"></span></div>
          
          <div class="inspection-loader">
            <div class="inspection-step active" id="step-observe">OBSERVE</div>
            <div class="inspection-step" id="step-prove">PROVE</div>
            <div class="inspection-step" id="step-decide">DECIDE</div>
            <div class="inspection-step" id="step-fix">FIX</div>
            <div class="inspection-step" id="step-verify">VERIFY</div>
          </div>

          <div class="shadow-terminal" id="shadow-terminal" style="display: none;">
            <div class="shadow-terminal-line text-cyan">Init Shadow IT & Supply Chain Discovery...</div>
          </div>
        </div>
      </section>

      <!-- SCREEN 4: RESULTS -->
      <section id="screen-results" class="screen">
        <div class="step-indicator">
          <div class="step">TARGET</div>
          <div class="step">INSPECTION</div>
          <div class="step active">RESULTS</div>
        </div>

        <div class="mode-toggle">
          <button class="btn primary" style="padding: 0.5rem 1rem;" id="btn-mode-exec">Executive Brief</button>
          <button class="btn" style="padding: 0.5rem 1rem;" id="btn-mode-client">Client Mode</button>
          <button class="btn" style="padding: 0.5rem 1rem;" id="btn-mode-engineer">Engineer Mode</button>
        </div>
        
        <div class="panel" style="border-left-color: var(--warning);">
          <div class="font-mono text-muted mb-1" id="demo-badge">DEMO DATA</div>
          
          <div class="tabs" id="result-tabs">
            <div class="tab active" data-tab="posture">Posture & Legal</div>
            <div class="tab" data-tab="perimeter">Shadow Perimeter</div>
            <div class="tab" data-tab="findings">Findings</div>
          </div>
          
          <!-- Tabs Content -->
          <div id="tab-content" class="mt-1">
            <!-- Rendered by JS -->
          </div>
        </div>
        
        <button class="btn" id="btn-new-audit">New Target</button>
      </section>
      
    </main>
  `;

  // Flow Logic
  const showScreen = (id: string) => {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
  };

  document.getElementById("btn-new-target")?.addEventListener("click", () => {
    showScreen("screen-target");
  });

  document.getElementById("btn-cancel-target")?.addEventListener("click", () => {
    showScreen("screen-home");
  });

  document.getElementById("btn-new-audit")?.addEventListener("click", () => {
    showScreen("screen-home");
  });

  let currentMode = "exec";
  let demoData = {
    domain: "",
    postureScore: 42,
    legalFineExposure: "€125,000 - €250,000",
    remediationCostEst: "€4,500",
    shadowAssets: [
      { type: 'subdomain', value: 'staging.example.com', status: 'Exposed' },
      { type: 'bucket', value: 's3-dev-backup-2019', status: 'Public Read' },
      { type: 'api', value: 'api.v1.example.com', status: 'Deprecated/Unauth' }
    ],
    findings: [
      {
        id: "EV-001-A",
        title: "Missing Content Security Policy & Exposed Staging",
        clientDesc: "The website lacks security rulebooks, and a forgotten staging environment is publicly accessible. Attackers can inject malicious code and access pre-production data.",
        businessImpact: "High risk of data theft, GDPR non-compliance, and reputational damage.",
        recommendation: "Implement strict CSP headers and decommission or restrict access to staging environments.",
        category: "Security & Compliance",
        complexity: "Medium",
        retestStatus: "Pending",
        // Legal
        legalFramework: "GDPR Art. 32 / NIS2",
        // Engineer fields
        collector: "PerimeterRecon + HeaderAnalyzer",
        source: "HTTP GET / & DNS Brute",
        timestamp: new Date().toISOString(),
        hash: "a3b4c5d6e7f8...",
        technicalDetails: "No Content-Security-Policy header found. staging.example.com resolves to public IP without auth.",
        status: "critical"
      }
    ]
  };

  document.getElementById("btn-confirm-target")?.addEventListener("click", () => {
    const domain = (document.getElementById("input-domain") as HTMLInputElement).value;
    const policy = (document.getElementById("check-policy") as HTMLInputElement).checked;
    
    if (!domain) {
      alert("Domain is required");
      return;
    }
    if (!policy) {
      alert("You must confirm authorization");
      return;
    }
    
    demoData.domain = domain;
    const dt = document.getElementById("display-target");
    if(dt) dt.textContent = domain;
    
    showScreen("screen-inspection");
    runInspectionSimulation();
  });

  const shadowLines = [
    "[+] Scanning DNS records...",
    "[!] Discovered staging environment: staging.example.com",
    "[+] Enumerating cloud assets...",
    "[!] Found open S3 bucket: s3-dev-backup-2019",
    "[+] Analyzing HTTP Headers...",
    "[!] Missing CSP & HSTS detected.",
    "[*] Mapping findings to Legal Frameworks (NIS2/GDPR)...",
    "[*] Done."
  ];

  const runInspectionSimulation = () => {
    const steps = ["observe", "prove", "decide", "fix", "verify"];
    let i = 0;
    
    const terminal = document.getElementById("shadow-terminal");
    if(terminal) {
      terminal.style.display = "block";
      terminal.innerHTML = '<div class="shadow-terminal-line text-cyan">Init Shadow IT & Supply Chain Discovery...</div>';
    }

    let lineIdx = 0;
    const lineInterval = setInterval(() => {
      if(terminal && lineIdx < shadowLines.length) {
        const div = document.createElement("div");
        div.className = "shadow-terminal-line new";
        div.textContent = shadowLines[lineIdx];
        if (shadowLines[lineIdx].includes("[!]")) div.style.color = "var(--warning)";
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
        lineIdx++;
      }
    }, 400);

    const interval = setInterval(() => {
      if (i > 0) {
        document.getElementById(`step-${steps[i-1]}`)?.classList.replace("active", "done");
      }
      if (i < steps.length) {
        document.getElementById(`step-${steps[i]}`)?.classList.add("active");
      } else {
        clearInterval(interval);
        clearInterval(lineInterval);
        setTimeout(() => {
          showScreen("screen-results");
          renderResults("posture");
        }, 800);
      }
      i++;
    }, 800);
  };

  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      const target = e.currentTarget as HTMLElement;
      target.classList.add("active");
      renderResults(target.dataset.tab || "posture");
    });
  });

  // Modes
  const setMode = (mode: string) => {
    currentMode = mode;
    document.querySelectorAll(".mode-toggle .btn").forEach(b => b.classList.remove("primary"));
    document.getElementById(`btn-mode-${mode}`)?.classList.add("primary");
    
    const tabsEl = document.getElementById("result-tabs");
    if (mode === "exec") {
      if(tabsEl) tabsEl.style.display = "none";
      renderResults("exec");
    } else {
      if(tabsEl) tabsEl.style.display = "flex";
      const activeTab = document.querySelector(".tab.active") as HTMLElement;
      renderResults(activeTab?.dataset.tab || "posture");
    }
  };

  document.getElementById("btn-mode-exec")?.addEventListener("click", () => setMode("exec"));
  document.getElementById("btn-mode-client")?.addEventListener("click", () => setMode("client"));
  document.getElementById("btn-mode-engineer")?.addEventListener("click", () => setMode("engineer"));

  const renderResults = (tab: string) => {
    const container = document.getElementById("tab-content");
    if (!container) return;

    if (tab === "exec") {
      container.innerHTML = `
        <div class="exec-brief">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="exec-title font-mono">EXECUTIVE BRIEF: ${demoData.domain}</div>
            <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--text-muted); color: var(--text-muted);" onclick="window.print()">[ EXPORT PDF ]</button>
          </div>
          <div class="exec-text">
            Our passive intelligence gathering indicates a significant gap in perimeter security and regulatory compliance. 
            We identified forgotten digital assets ("Shadow IT") publicly exposing pre-production data, alongside missing foundational security controls.
            <br/><br/>
            Under the current NIS2 and GDPR frameworks, these exposures represent a quantifiable liability risk estimated between 
            <strong>${demoData.legalFineExposure}</strong>. Immediate remediation is strongly advised to prevent threat actor exploitation and regulatory penalties.
          </div>
          <div class="legal-widget" style="border-left: 4px solid var(--success); background: rgba(0,255,153,0.05);">
            <div>
              <div class="font-mono text-muted" style="font-size:0.75rem">RECOMMENDED ACTION</div>
              <div style="font-size:1.1rem; font-weight:bold;">Perimeter Hardening & Asset Decommissioning</div>
            </div>
            <div style="text-align:right">
              <div class="font-mono text-muted" style="font-size:0.75rem">EST. REMEDIATION ROI COST</div>
              <div class="legal-cost" style="color:var(--success)">${demoData.remediationCostEst}</div>
            </div>
          </div>
        </div>
      `;
    } else if (tab === "posture") {
      container.innerHTML = `
        <div class="grid mb-1">
          <div>
            <h4 class="text-cyan mb-1">Target Details</h4>
            <div class="data-row"><span class="data-label">Domain</span><span class="data-value">${demoData.domain}</span></div>
            <div class="data-row"><span class="data-label">Status</span><span class="data-value status-badge status-critical">Critical Exposure</span></div>
            <div class="data-row"><span class="data-label">Posture Score</span><span class="data-value">${demoData.postureScore}/100</span></div>
          </div>
        </div>
        <div class="legal-widget">
          <div>
            <div class="font-mono" style="font-size:0.8rem; color:var(--text-muted)">REGULATORY LIABILITY (NIS2/GDPR)</div>
            <div style="font-size: 0.9rem;">Estimated fine exposure due to discovered perimeter vulnerabilities.</div>
          </div>
          <div class="legal-cost">${demoData.legalFineExposure}</div>
        </div>
      `;
    } else if (tab === "perimeter") {
      let html = `<h4 class="text-cyan mb-1">Discovered Shadow IT Assets</h4>`;
      demoData.shadowAssets.forEach(asset => {
        html += `
          <div class="data-row">
            <span class="data-label" style="text-transform:uppercase">${asset.type}</span>
            <span class="font-mono" style="font-size:0.85rem">${asset.value}</span>
            <span class="status-badge status-warning">${asset.status}</span>
          </div>
        `;
      });
      container.innerHTML = html;
    } else if (tab === "findings") {
      let html = "";
      demoData.findings.forEach(f => {
        if (currentMode === "client") {
          html += `
            <div style="padding: 1rem; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem; background: var(--bg-surface);">
              <h4 style="margin-bottom: 0.5rem;">${f.title} <span class="status-badge status-${f.status}">${f.category}</span></h4>
              <p class="mb-1">${f.clientDesc}</p>
              <div class="data-row"><span class="data-label">Business Significance</span><span class="data-value">${f.businessImpact}</span></div>
              <div class="data-row"><span class="data-label">Regulatory Map</span><span class="data-value text-cyan">${f.legalFramework}</span></div>
              <div class="data-row"><span class="data-label">Recommended Action</span><span class="data-value">${f.recommendation}</span></div>
              <div class="data-row"><span class="data-label">Complexity</span><span class="data-value">${f.complexity}</span></div>
            </div>
          `;
        } else {
          // Engineer mode
          html += `
            <div style="padding: 1rem; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem; background: var(--bg-surface); font-family: var(--font-mono); font-size: 0.85rem;">
              <div class="mb-1 text-cyan">[${f.id}] ${f.title}</div>
              <div class="data-row"><span class="data-label">Collector</span><span class="data-value">${f.collector}</span></div>
              <div class="data-row"><span class="data-label">Source</span><span class="data-value">${f.source}</span></div>
              <div class="data-row"><span class="data-label">Timestamp</span><span class="data-value">${f.timestamp}</span></div>
              <div class="data-row"><span class="data-label">Hash</span><span class="data-value">${f.hash}</span></div>
              <div class="data-row"><span class="data-label">Technical</span><span class="data-value">${f.technicalDetails}</span></div>
            </div>
          `;
        }
      });
      container.innerHTML = html;
    }
  };

  // Initialize with Exec mode
  setMode("exec");
}
