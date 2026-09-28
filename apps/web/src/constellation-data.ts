/**
 * ARGUS Constellation & Institutional Intelligence Data Store
 * Models the sovereign multi-repository architecture connecting ARGUS with
 * Eye-of-Argus, Civil-Sentry, NPM-Supply-Chain-Auditor, iAquarius-Gateway,
 * CalMap, Arnhem-Biz-Radar, and Civic-Relay.
 * 
 * Provides specifications for Europol EC3, Interpol, NATO/Defensie,
 * NIS2 Directive, DORA, and STIX 2.1 interoperability.
 */

export interface ConstellationNode {
  id: string;
  name: string;
  codeName: string;
  repoPath: string;
  category: 'CORE_ENGINE' | 'GEOSPATIAL' | 'PERIMETER' | 'SUPPLY_CHAIN' | 'AI_GATEWAY' | 'CIVIC';
  status: 'ACTIVE' | 'OPERATIONAL' | 'STANDBY';
  leadTech: string;
  roleDescription: string;
  keyCapabilities: string[];
  institutionalApplication: string;
  telemetryInput: string;
  telemetryOutput: string;
  badgeColor: string;
}

export interface ConstellationEdge {
  source: string;
  target: string;
  flowType: 'CRYPTOGRAPHIC_PROOF' | 'EVIDENCE_INGEST' | 'AIRGAPPED_INFERENCE' | 'GEOSPATIAL_FUSION' | 'SUPPLY_CHAIN_ALERT';
  label: string;
  protocol: string;
}

export interface InstitutionalProfile {
  agencyId: string;
  agencyName: string;
  jurisdiction: string;
  mandate: string;
  applicableFrameworks: string[];
  argusCapability: string;
  evidenceStandard: string;
  stixMapping: string;
}

export const CONSTELLATION_NODES: ConstellationNode[] = [
  {
    id: 'argus',
    name: 'ARGUS Control Plane',
    codeName: 'ARGUS-CORE',
    repoPath: 'c:\\dev\\02_PROJECTS\\ARGUS',
    category: 'CORE_ENGINE',
    status: 'ACTIVE',
    leadTech: 'TypeScript / Node.js 22 / Offline-First Engine',
    roleDescription: 'Passive surface hygiene and lead-intelligence platform. Performs strict public observation, deterministic rule evaluation, SHA-256 evidence hashing, and turnkey remediation mapping.',
    keyCapabilities: [
      'Deterministic 11-Rule Security Engine (0 hallucinations)',
      'Immutable Object.freeze Evidence Vault with SHA-256 digests',
      'Dutch-First Positive Reframing ("Wat er al goed is")',
      'Turnkey AUX Design Remediation SOW generation',
      'Dual-view outputs: Commercial Client vs Forensic Technical Dossier'
    ],
    institutionalApplication: 'Automated digital perimeter verification and supply-chain hygiene assessments for NIS2 / DORA without invasive scanning.',
    telemetryInput: 'Public DNS (SOA, TXT, DMARC, CAA), TLS handshakes, HTTP response headers, security.txt',
    telemetryOutput: 'Cryptographic Proof Bundles, STIX 2.1 Observables, ExcelJS Lead Books, Client Dossiers',
    badgeColor: '#00e5ff'
  },
  {
    id: 'eye-of-argus',
    name: 'Eye of Argus',
    codeName: 'EYE-OF-ARGUS',
    repoPath: 'c:\\dev\\eye-of-argus',
    category: 'GEOSPATIAL',
    status: 'ACTIVE',
    leadTech: 'Node.js / NDW Datex II XML Parser / Turf.js / Leaflet',
    roleDescription: 'Privacy-preserving geospatial intelligence and living human-context engine. Integrates Dutch National Road Data (NDW), OpenStreetMap, traffic flow cameras, and physical event telemetry.',
    keyCapabilities: [
      'Datex II XML real-time traffic feed parser (10,000+ sensor points)',
      'Privacy Release Gate with strict spatial hashing and k-anonymity',
      'Pedestrian & vehicular flow density modeling without facial recognition',
      'Offline-first GIS tile caching and spatial query engine'
    ],
    institutionalApplication: 'Smart city situational awareness, municipal emergency routing, crowd density management, and critical infrastructure physical security.',
    telemetryInput: 'NDW XML Open Data, BGT Topography, OSM Vector Tiles, Public Traffic Webcams',
    telemetryOutput: 'GeoJSON Activity Layers, Privacy-Sanitized Event Streams, Spatial Alerts',
    badgeColor: '#10b981'
  },
  {
    id: 'civil-sentry',
    name: 'Civil Sentry',
    codeName: 'CIVIL-SENTRY',
    repoPath: 'c:\\dev\\recruiter-evidence\\civil-sentry',
    category: 'PERIMETER',
    status: 'OPERATIONAL',
    leadTech: 'TypeScript / STIX 2.1 Engine / Perimeter Boundary Validator',
    roleDescription: 'Evidence-driven cyber situational-awareness platform. Enforces mathematical boundaries between public observation and authorized intrusion analysis, emitting standard STIX/TAXII objects.',
    keyCapabilities: [
      'Strict Authorization Scope Boundary (Fail-Closed Gatekeeper)',
      'Native STIX 2.1 Observable & Threat Object serialization',
      'Perimeter Exposure Score computation with verified evidence trails',
      'Defensive indicator correlation against known state-actor signatures'
    ],
    institutionalApplication: 'Europol EC3 / Interpol cyber situational awareness, CERT incident tracking, and critical national infrastructure (CNI) exposure monitoring.',
    telemetryInput: 'ARGUS Evidence Vault, Network border observations, BGP routing announcements',
    telemetryOutput: 'STIX 2.1 JSON Bundles, TAXII 2.1 Server Feeds, Perimeter Alerts',
    badgeColor: '#f43f5e'
  },
  {
    id: 'npm-supply-chain-auditor',
    name: 'NPM Supply Chain Auditor',
    codeName: 'SUPPLY-CHAIN-AUDITOR',
    repoPath: 'c:\\dev\\recruiter-evidence\\npm-supply-chain-auditor',
    category: 'SUPPLY_CHAIN',
    status: 'OPERATIONAL',
    leadTech: 'PowerShell 7 / AST Static Parser / SHA-256 IOC Database',
    roleDescription: 'Sovereign open-source software supply chain auditor. Performs AST analysis, integrity validation, and known IOC hunting across node_modules without executing malicious payload code.',
    keyCapabilities: [
      'Ground-truth IOC dataset mapping 85+ malicious package campaigns',
      'False-Positive elimination policy with AST syntax pattern matching',
      'Deterministic tarball integrity verification with npm registry digests',
      'Automated SBOM generation (CycloneDX / SPDX compliant)'
    ],
    institutionalApplication: 'NIS2 Article 21 supply chain assurance, defense software procurement verification, and sovereign repository auditing.',
    telemetryInput: 'package.json, pnpm-lock.yaml, package-lock.json, raw node_modules tarballs',
    telemetryOutput: 'Cryptographic Supply Chain Attestation, IOC Match Dossiers, SBOMs',
    badgeColor: '#f59e0b'
  },
  {
    id: 'iaquarius-gateway',
    name: 'iAquarius AI Gateway',
    codeName: 'IAQUARIUS-GATEWAY',
    repoPath: 'c:\\dev\\recruiter-evidence\\iaquarius-gateway',
    category: 'AI_GATEWAY',
    status: 'OPERATIONAL',
    leadTech: 'LiteLLM Proxy / Docker Compose / Prometheus / Grafana / Python',
    roleDescription: 'Sovereign AI inference gateway and prompt safety firewall. Enforces air-gapped LLM routing, deterministic fallback policies, token economics, and rigorous zero-data-leakage constraints.',
    keyCapabilities: [
      'Unified OpenAI-compatible proxy with local Ollama / vLLM routing',
      'Full observability with Prometheus metric scrape and Grafana dashboards',
      'Rate-limiting, failover cascades, and model latency optimization',
      'PII redaction and air-gapped sovereign inference gating'
    ],
    institutionalApplication: 'Classified or sensitive environment AI processing (Armed Forces, Police, Healthcare) ensuring data never leaves sovereign sovereign enclaves.',
    telemetryInput: 'AI inference prompts, rule explainability tasks, natural language summarization requests',
    telemetryOutput: 'Sanitized LLM completions, PromQL latency/cost metrics, Audit access logs',
    badgeColor: '#9d4edd'
  },
  {
    id: 'calmpath-maps-pro',
    name: 'CalmPath / CalMap',
    codeName: 'CALMAP-ARNHEM',
    repoPath: 'c:\\dev\\recruiter-evidence\\calmpath-maps-pro',
    category: 'GEOSPATIAL',
    status: 'ACTIVE',
    leadTech: 'Leaflet 1.9 / OpenStreetMap / Progressive Disclosure Cartography',
    roleDescription: 'The human-scale situation map. Fuses ARGUS commercial intelligence with municipal reality, allowing operators to visualize cyber hygiene posture directly overlaid on city topography.',
    keyCapabilities: [
      '6-tier progressive disclosure controls (Basic, Traffic, Activity, Events, Webcams, Leads)',
      'Deterministic color-coded pin clustering for 171 Arnhem commercial targets',
      'One-click commercial dossier drawer with Debbie sales pitches',
      'Zero third-party tracking, 100% offline-tile compatible'
    ],
    institutionalApplication: 'Urban ground operations, commercial sales walking route optimization, and cross-domain cyber-physical intelligence.',
    telemetryInput: 'ARGUS Scanned Leads JSON, CalMap Geodata, NDW Open Data',
    telemetryOutput: 'Interactive Web Cartography, Walking Field Coordinates, Tactical Overlays',
    badgeColor: '#38bdf8'
  },
  {
    id: 'arnhem-biz-radar',
    name: 'Arnhem Biz Radar',
    codeName: 'BIZ-RADAR',
    repoPath: 'c:\\dev\\recruiter-evidence\\arnhem-biz-radar',
    category: 'CIVIC',
    status: 'OPERATIONAL',
    leadTech: 'Node.js / OpenKvK Scraper / Overpass API / GeoJSON',
    roleDescription: 'Local business registry harvester and commercial reconnaissance pipeline. Resolves company legal names, KvK numbers, domain mappings, and geographic centroids.',
    keyCapabilities: [
      'KvK / Handelsregister public entity cross-referencing',
      'Overpass API query synthesis for commercial address deduplication',
      'Phone and contact point resolution from verified public websites',
      'Target cohort clustering (Center, Sonsbeek, Spijkerkwartier, Rijnhal, Docks)'
    ],
    institutionalApplication: 'Economic health analysis, regional critical supplier mapping, and municipal digital transformation audits.',
    telemetryInput: 'Dutch Chamber of Commerce (KvK) public records, OpenStreetMap retail nodes',
    telemetryOutput: 'Canonical Business Registry JSON, Validated Domain Seeds',
    badgeColor: '#a855f7'
  },
  {
    id: 'civic-relay',
    name: 'Civic Relay',
    codeName: 'CIVIC-RELAY',
    repoPath: 'c:\\dev\\recruiter-evidence\\civic-relay',
    category: 'CIVIC',
    status: 'STANDBY',
    leadTech: 'WebSockets / PWA / Service Worker / Encrypted Push',
    roleDescription: 'Resilient community alerting and emergency notification mesh. Dispatches verified civic bulletins and critical infrastructure warning alerts across local devices.',
    keyCapabilities: [
      'Store-and-forward offline message synchronization',
      'End-to-end authenticated cryptographic dispatch signatures',
      'Low-bandwidth mesh topology support for disaster recovery',
      'Zero-knowledge subscriber privacy preserving channels'
    ],
    institutionalApplication: 'Civil protection, Veiligheidsregio crisis communication, and municipal emergency broadcasting.',
    telemetryInput: 'Veiligheidsregio crisis alerts, Weather warning feeds, Infrastructure outage signals',
    telemetryOutput: 'Encrypted PWA Push Notifications, Local Broadcast Signals',
    badgeColor: '#ec4899'
  }
];

export const CONSTELLATION_EDGES: ConstellationEdge[] = [
  {
    source: 'arnhem-biz-radar',
    target: 'argus',
    flowType: 'EVIDENCE_INGEST',
    label: 'Seed Canonical Domains & KvK Records',
    protocol: 'Local JSON Schema / IPC'
  },
  {
    source: 'argus',
    target: 'calmpath-maps-pro',
    flowType: 'GEOSPATIAL_FUSION',
    label: '171 Color-Coded Cyber Leads Overlay',
    protocol: 'GeoJSON FeatureCollection'
  },
  {
    source: 'eye-of-argus',
    target: 'calmpath-maps-pro',
    flowType: 'GEOSPATIAL_FUSION',
    label: 'Real-time Traffic & Sensor Activity Streams',
    protocol: 'Datex II XML -> GeoJSON'
  },
  {
    source: 'argus',
    target: 'civil-sentry',
    flowType: 'CRYPTOGRAPHIC_PROOF',
    label: 'Verified Surface Evidence & Invariant Hashes',
    protocol: 'STIX 2.1 Observable Objects'
  },
  {
    source: 'npm-supply-chain-auditor',
    target: 'argus',
    flowType: 'SUPPLY_CHAIN_ALERT',
    label: 'Software Dependency Health & IOC Hits',
    protocol: 'CycloneDX JSON / SHA-256 Signatures'
  },
  {
    source: 'argus',
    target: 'iaquarius-gateway',
    flowType: 'AIRGAPPED_INFERENCE',
    label: 'Clamped Dutch Explanations & SOW Copy Synthesis',
    protocol: 'OpenAI-Compatible REST (Local Port 4000)'
  },
  {
    source: 'civil-sentry',
    target: 'civic-relay',
    flowType: 'CRYPTOGRAPHIC_PROOF',
    label: 'Signed Threat Bulletins & Critical Alerts',
    protocol: 'Ed25519 Signed Payloads'
  }
];

export const INSTITUTIONAL_PROFILES: InstitutionalProfile[] = [
  {
    agencyId: 'europol-ec3',
    agencyName: 'Europol EC3 (European Cybercrime Centre)',
    jurisdiction: 'European Union (The Hague, NL)',
    mandate: 'Strengthen law enforcement response to cybercrime across the EU, protecting European citizens, businesses, and governments.',
    applicableFrameworks: ['Europol Regulation (EU) 2016/794', 'Directive (EU) 2022/2555 (NIS2)', 'Budapest Convention on Cybercrime'],
    argusCapability: 'Zero-invasion, open-source observational surface auditing with mathematically verifiable SHA-256 chain of custody, enabling non-coercive compliance monitoring.',
    evidenceStandard: 'ISO/IEC 27037 (Digital Evidence Handling) & RFC 3161 cryptographic timestamping.',
    stixMapping: 'STIX 2.1 Domain Objects (threat-actor, identity, observed-data) serialized with canonical SHA-256 hashes.'
  },
  {
    agencyId: 'interpol-igci',
    agencyName: 'INTERPOL Cybercrime Directorate',
    jurisdiction: 'Global (Lyon, FR & Singapore)',
    mandate: 'Prevent, detect, and investigate transnational cybercrime through cross-border police collaboration and threat intelligence sharing.',
    applicableFrameworks: ['INTERPOL Constitution', 'Global Cybercrime Threat Assessment Framework', 'ISO/IEC 27001'],
    argusCapability: 'Dual-use capability: assesses cross-border domain hygiene, e-mail spoofing exposure, and malicious infrastructure reuse without sending active intrusive probe packets.',
    evidenceStandard: 'Interpol Guidelines for Digital Forensics Laboratories (GDFL).',
    stixMapping: 'TAXII 2.1 Collections with STIX 2.1 Cyber Observable Objects (domain-name, ipv4-addr, x509-certificate).'
  },
  {
    agencyId: 'nato-c3-defensie',
    agencyName: 'Defensie / NATO Communications & Information (NCI) Agency',
    jurisdiction: 'NATO Alliance & Kingdom of the Netherlands',
    mandate: 'Ensure cyber defense, collective security, and resilience of national critical infrastructure against hybrid and asymmetric threats.',
    applicableFrameworks: ['NATO Cyber Defense Pledge', 'Defensie Cyber Strategie', 'NIS2 Essential Entities Requirements'],
    argusCapability: 'Air-gapped, offline-first situational awareness combining ARGUS public cyber hygiene with Eye-of-Argus physical sensor telemetry (Datex II NDW) and Civil-Sentry perimeter fences.',
    evidenceStandard: 'STANAG 4774 / 4778 (Confidentiality & Data Integrity Metadata).',
    stixMapping: 'STIX 2.1 Indicators with Military Threat Intelligence attributes and TLP (Traffic Light Protocol) markings.'
  },
  {
    agencyId: 'eu-nis2-dora',
    agencyName: 'National Cyber Security Centre (NCSC-NL) & DORA Supervisors (DNB / AFM)',
    jurisdiction: 'Kingdom of the Netherlands & EU Single Market',
    mandate: 'Supervise supply chain risk management (NIS2 Art. 21) and digital operational resilience in the financial sector (DORA Art. 16-20).',
    applicableFrameworks: ['EU NIS2 Directive 2022/2555', 'EU DORA Regulation 2022/2554', 'Baseline Informatiebeveiliging Overheid (BIO)'],
    argusCapability: 'Instant verification of supplier email security (SPF/DMARC), cryptographic transport (TLS 1.3/HSTS), and CVD compliance (RFC 9116 security.txt) with proof certificates.',
    evidenceStandard: 'Dutch NCSC Internet Standards Guidelines (internet.nl compliant methodology).',
    stixMapping: 'JSON-LD Verified Credentials & Cryptographic Proof Receipts.'
  }
];

export const SAMPLE_STIX_BUNDLE = {
  type: "bundle",
  id: "bundle--c02b28cf-2139-4d69-83c9-d2b380b2a59a",
  spec_version: "2.1",
  objects: [
    {
      type: "identity",
      spec_version: "2.1",
      id: "identity--argus-control-plane",
      created: "2026-09-26T04:00:00.000Z",
      modified: "2026-09-26T04:00:00.000Z",
      name: "ARGUS Sovereign Intelligence Engine",
      identity_class: "system",
      description: "Non-invasive passive evidence and cryptographic posture auditor"
    },
    {
      type: "observed-data",
      spec_version: "2.1",
      id: "observed-data--582f3428-1b77-4404-8178-c11438903e1a",
      created_by_ref: "identity--argus-control-plane",
      created: "2026-09-26T04:00:00.000Z",
      modified: "2026-09-26T04:00:00.000Z",
      first_observed: "2026-09-26T02:14:15.000Z",
      last_observed: "2026-09-26T02:16:30.000Z",
      number_observed: 1,
      objects: {
        "0": {
          type: "domain-name",
          value: "example-business.nl"
        },
        "1": {
          type: "network-traffic",
          protocols: ["tcp", "tls", "http"],
          src_port: 443
        }
      },
      custom_properties: {
        x_argus_sha256: "928e4693bf7c7a2bb34460f1ad9226cbcf74c8646b997e068e5ff41b44b92b67",
        x_argus_scope_policy: "PUBLIC_PASSIVE_ONLY",
        x_argus_immutability: "FROZEN_OBJECT"
      }
    },
    {
      type: "indicator",
      spec_version: "2.1",
      id: "indicator--d18c0e27-5d29-43c3-b3eb-460f3e69ff98",
      created: "2026-09-26T04:00:00.000Z",
      modified: "2026-09-26T04:00:00.000Z",
      name: "Missing DMARC Enforcement (p=none)",
      description: "Domain allows spoofed email delivery due to passive monitoring mode",
      indicator_types: ["malicious-activity-risk"],
      pattern: "[domain-name:value = 'example-business.nl']",
      pattern_type: "stix",
      valid_from: "2026-09-26T00:00:00.000Z"
    }
  ]
};
