export interface InspectionResultV1 {
  jobId: string;
  status: string;
  target: string;
  postureScore: number;
  results: FindingV1[];
}

export interface FindingV1 {
  id: string;
  title: string;
  category: string;
  status: string;
  clientDescription: string;
  businessSignificance: string;
  recommendedAction: string;
  complexity: string;
  retestStatus: string;
  evidenceId: string;
  collector: string;
  source: string;
  timestamp: string;
  hash: string;
  technicalDetails: string;
  ruleId?: string;
  provenance?: string;
}

export async function runInspection(domain: string, isDemo: boolean = false): Promise<InspectionResultV1> {
  if (isDemo) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          jobId: `job_${Date.now()}`,
          status: 'completed',
          target: domain,
          postureScore: 65,
          results: [
            {
              id: "EV-001-A",
              title: "Missing Content Security Policy",
              category: "Security",
              status: "critical",
              clientDescription: "The website lacks a security rulebook that tells browsers which resources are safe to load.",
              businessSignificance: "High risk of data theft if attackers compromise third-party scripts.",
              recommendedAction: "Implement a strict CSP header.",
              complexity: "Medium",
              retestStatus: "True",
              evidenceId: "ev_12345",
              collector: "HeaderAnalyzer",
              source: "HTTP GET /",
              timestamp: new Date().toISOString(),
              hash: "a3b4c5d6e7f8...",
              technicalDetails: "No Content-Security-Policy header found in HTTP response.",
              ruleId: "RULE_HTTP_CSP_01",
              provenance: "DETERMINISTIC_OBSERVATION"
            }
          ]
        });
      }, 1500);
    });
  }

  try {
    const res = await fetch('/api/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, policyAcknowledged: true })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Network request failed');
  }
}
