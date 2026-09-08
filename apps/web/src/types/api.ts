/**
 * API Contract for POST /api/inspect
 * Represents the interface for submitting a target for field intelligence gathering.
 */

export interface InspectRequest {
  domain: string;
  organisationLabel?: string;
  category: \"ecommerce\" | \"corporate\" | \"saas\";
  policyAcknowledged: boolean;
  // Future hooks for languages
  locale?: \"en\" | \"es\" | \"nl\";
}

export interface InspectResponse {
  jobId: string;
  status: \"pending\" | \"running\" | \"completed\" | \"failed\";
  target: string;
  postureScore: number;
  results: InspectResult[];
}

export interface InspectResult {
  id: string; // e.g. EV-001-A
  title: string;
  category: string; // e.g. Security, Performance
  status: \"critical\" | \"warning\" | \"good\";
  
  // Client Mode Fields
  clientDescription: string; // Plain-language explanation
  businessSignificance: string;
  recommendedAction: string;
  complexity: \"Low\" | \"Medium\" | \"High\";
  retestStatus: \"Pending\" | \"Verified\" | \"Failed\";
  
  // Engineer Mode Fields
  evidenceId: string;
  collector: string;
  source: string;
  timestamp: string; // ISO 8601
  hash: string;
  technicalDetails: string;
}

