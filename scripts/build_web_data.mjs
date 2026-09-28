import fs from 'fs';

const targetFile = fs.existsSync('data/argus_cross_border_scanned_results.json')
  ? 'data/argus_cross_border_scanned_results.json'
  : 'data/argus_arnhem_scanned_results.json';

const scanned = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

const optimized = scanned.map(s => {
  const color = s.scores?.priorityColor || '⬜';
  let tier = 'GRAY';
  if (color === '🟥') tier = 'RED';
  else if (color === '🟧') tier = 'ORANGE';
  else if (color === '🟨') tier = 'YELLOW';
  else if (color === '🟩') tier = 'GREEN';

  return {
    id: s.company_id,
    name: s.business_name,
    domain: s.domain,
    city: s.city || 'Arnhem',
    region: s.region || (s.country === 'Duitsland' ? 'Nordrhein-Westfalen' : 'Gelderland'),
    country: s.country || 'Nederland',
    category: s.category || 'MKB / Zakelijk',
    address: s.address || `${s.city || 'Arnhem'} Centrum`,
    phone: s.phone_public || '',
    tier,
    colorEmoji: color,
    score: s.scores?.salesPriority || 0,
    pitch: s.debbiePitch || {
      oneLinerNL: 'Domeinanalyse uitgevoerd conform publieke observatieregels.',
      whyCareNL: 'Zekerheid over digitale bereikbaarheid en reputatie.',
      whatWeOfferNL: 'Onafhankelijk verificatierapport.',
      estimatedService: 'Preventieve Hygiëne Audit',
      indicativePriceEur: 495,
      nextAction: 'Vrijblijvend kennismakingsgesprek aanbieden.'
    },
    findings: (s.findings || []).map(f => ({
      id: f.finding_id,
      title: f.finding_title,
      technical: f.technical_description,
      plainNL: f.plain_language_description,
      impact: f.customer_impact,
      category: f.category,
      severity: f.severity_if_confirmed || 'LOW',
      service: f.commercial_service_mapping,
      remediation: f.suggested_remediation,
      evidenceType: f.evidence_type,
      evidenceLocation: f.evidence_location
    }))
  };
});

const tsContent = `// Auto-generated Cross-Border Regional Scanned Leads Dataset for ARGUS Cockpit
export interface ScannedFinding {
  id: string;
  title: string;
  technical: string;
  plainNL: string;
  impact: string;
  category: string;
  severity: string;
  service: string;
  remediation: string;
  evidenceType: string;
  evidenceLocation: string;
}

export interface DebbiePitch {
  oneLinerNL: string;
  whyCareNL: string;
  whatWeOfferNL: string;
  estimatedService: string;
  indicativePriceEur: number;
  nextAction: string;
}

export interface ScannedLead {
  id: string;
  name: string;
  domain: string;
  city: string;
  region: string;
  country: string;
  category: string;
  address: string;
  phone: string;
  tier: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'GRAY';
  colorEmoji: string;
  score: number;
  pitch: DebbiePitch;
  findings: ScannedFinding[];
}

export const ARNHEM_LEADS: ScannedLead[] = ${JSON.stringify(optimized, null, 2)};
`;

fs.writeFileSync('apps/web/src/arnhem-leads-data.ts', tsContent, 'utf8');
console.log('Successfully generated apps/web/src/arnhem-leads-data.ts with ' + optimized.length + ' leads');
