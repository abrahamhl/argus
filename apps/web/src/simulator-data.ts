/**
 * ARGUS Simulator Data Store & Engine
 * Provides deterministic simulation fixtures, rules, AUX catalog, reports,
 * retest proofs, and Investor XYZ thesis metrics for browser execution.
 */

export interface RuleExplainability {
  observed: string;
  supports: string;
  whyItMatters: string;
  limitations: string;
}

export interface FindingItem {
  id: string;
  ruleId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: 'DNS' | 'TLS' | 'HTTP' | 'EMAIL' | 'DISCLOSURE';
  evidenceIds: string[];
  explanation: RuleExplainability;
  clientCopy: {
    nl: { title: string; explanation: string; action: string };
    en: { title: string; explanation: string; action: string };
    es: { title: string; explanation: string; action: string };
  };
  auxServiceId: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface AuxService {
  id: string;
  code: string;
  title: { nl: string; en: string; es: string };
  description: { nl: string; en: string; es: string };
  deliverables: { nl: string[]; en: string[]; es: string[] };
  indicativePriceEur: number;
  estimatedHours: string;
  recurring?: boolean;
}

export interface EvidenceRecord {
  id: string;
  collector: string;
  type: string;
  target: string;
  sha256: string;
  timestamp: string;
  immutable: boolean;
  rawSnippet: string;
}

export interface ProofRecord {
  id: string;
  findingId: string;
  ruleId: string;
  status: 'RESOLVED' | 'IMPROVED' | 'UNCHANGED';
  rationale: string;
  baselineEvidenceSha: string;
  retestEvidenceSha: string;
}

// 9 Modular AUX Design Commercial Services
export const AUX_SERVICES: AuxService[] = [
  {
    id: 'aux-dns-01',
    code: 'AUX-DNS-01',
    title: {
      nl: 'E-mail Authenticatie & Domeinbescherming (SPF / DMARC / CAA)',
      en: 'Email Authentication & Domain Protection (SPF / DMARC / CAA)',
      es: 'Autenticación de Email y Protección de Dominio (SPF / DMARC / CAA)'
    },
    description: {
      nl: 'Volledige inrichting van strikte SPF-records (-all), DMARC-handhavingsbeleid (p=reject of p=quarantine) en CAA-records om e-mail spoofing en factuurfraude namens uw domein tegen te gaan.',
      en: 'Complete configuration of strict SPF records (-all), DMARC enforcement (p=reject or quarantine), and CAA records to prevent email spoofing and invoice fraud on behalf of your domain.',
      es: 'Configuración integral de registros SPF estrictos (-all), política DMARC (p=reject) y CAA para erradicar suplantación de identidad y fraude de facturación.'
    },
    deliverables: {
      nl: ['Strikt SPF DNS-record', 'DMARC beleid met rapportage', 'CAA records voor geautoriseerde CAs', 'Verificatietest na 48 uur'],
      en: ['Strict SPF DNS record', 'DMARC policy with reporting', 'CAA records for authorized CAs', 'Verification test after 48h'],
      es: ['Registro SPF estricto', 'Política DMARC con reportes', 'Registros CAA autorizados', 'Test de verificación tras 48h']
    },
    indicativePriceEur: 495,
    estimatedHours: '3-5 uur'
  },
  {
    id: 'aux-tls-01',
    code: 'AUX-TLS-01',
    title: {
      nl: 'Transportbeveiliging & HSTS Verharding',
      en: 'Modern Transport Security & HSTS Hardening',
      es: 'Seguridad en Transporte y Endurecimiento HSTS'
    },
    description: {
      nl: 'Uitschakelen van verouderde TLS-protocollen (TLS 1.0/1.1), veilige cipher suites en implementatie van HTTP Strict Transport Security (HSTS) met long max-age en includeSubDomains.',
      en: 'Deprecation of outdated TLS versions (TLS 1.0/1.1), modern cipher configuration, and HTTP Strict Transport Security (HSTS) implementation with includeSubDomains.',
      es: 'Desactivación de TLS obsoletos, configuración de ciphers modernos e implementación de HSTS para forzar conexiones cifradas seguras.'
    },
    deliverables: {
      nl: ['Webserver TLS configuratie', 'HSTS header implementatie', 'A+ score op SSL Labs / internet.nl', 'Retest verificatierapport'],
      en: ['Web server TLS configuration', 'HSTS header deployment', 'A+ score verification', 'Retest verification report'],
      es: ['Configuración TLS de servidor', 'Implementación de cabecera HSTS', 'Calificación A+ verificada', 'Reporte criptográfico de retest']
    },
    indicativePriceEur: 395,
    estimatedHours: '2-4 uur'
  },
  {
    id: 'aux-sec-01',
    code: 'AUX-SEC-01',
    title: {
      nl: 'Beveiligingsheaders & Browserverharding (CSP / Anti-Clickjacking)',
      en: 'Security Headers & Browser Hardening (CSP / Anti-Clickjacking)',
      es: 'Cabeceras de Seguridad y Protección de Navegador (CSP)'
    },
    description: {
      nl: 'Inrichting van Content-Security-Policy (CSP), X-Content-Type-Options: nosniff, Referrer-Policy en frame protection om cross-site scripting (XSS), clickjacking en data-exfiltratie tegen te gaan.',
      en: 'Configuration of Content-Security-Policy (CSP), X-Content-Type-Options: nosniff, Referrer-Policy, and frame protection to prevent XSS and clickjacking.',
      es: 'Configuración de CSP, X-Content-Type-Options, Referrer-Policy y protección contra clickjacking para mitigar XSS e inyección.'
    },
    deliverables: {
      nl: ['Maatwerk CSP header', 'X-Content-Type-Options: nosniff', 'Referrer-Policy & Frame-Options', 'Compatibiliteitstest met website scripts'],
      en: ['Tailored CSP header', 'X-Content-Type-Options nosniff', 'Referrer & Frame policies', 'Script compatibility test'],
      es: ['Cabecera CSP a medida', 'Protección nosniff', 'Políticas de Frame y Referrer', 'Test de compatibilidad']
    },
    indicativePriceEur: 495,
    estimatedHours: '3-6 uur'
  },
  {
    id: 'aux-txt-01',
    code: 'AUX-TXT-01',
    title: {
      nl: 'Coordinated Vulnerability Disclosure (RFC 9116 security.txt)',
      en: 'Coordinated Vulnerability Disclosure & security.txt (RFC 9116)',
      es: 'Divulgación Coordinada de Vulnerabilidades (RFC 9116 security.txt)'
    },
    description: {
      nl: 'Opstellen en publiceren van een formeel CVD-beleid en conform RFC 9116 beveiligingsbestand (/.well-known/security.txt) voor verantwoorde melding van beveiligingslekken.',
      en: 'Creation and deployment of formal CVD policy and RFC 9116 security.txt file for responsible vulnerability reporting.',
      es: 'Elaboración y publicación de archivo security.txt estandarizado bajo RFC 9116 y política formal de divulgación coordinada.'
    },
    deliverables: {
      nl: ['security.txt bestand', 'CVD beleidsdocument', 'OpenPGP sleutelkoppeling optioneel'],
      en: ['security.txt file deployment', 'CVD policy documentation', 'PGP key linkage optional'],
      es: ['Despliegue de security.txt', 'Documento de política CVD', 'Firma criptográfica PGP']
    },
    indicativePriceEur: 195,
    estimatedHours: '1-2 uur'
  },
  {
    id: 'aux-fnd-01',
    code: 'AUX-FND-01',
    title: {
      nl: 'Digitale Voetafdruk & Aanvalsoppervlak Inventarisatie',
      en: 'Digital Footprint & Attack Surface Discovery',
      es: 'Descubrimiento de Huella Digital y Superficie de Ataque'
    },
    description: {
      nl: 'Volledige passieve mapping van publieke subdomeinen, mailservers, clouddiensten en verouderde systemen behorend bij uw organisatie.',
      en: 'Comprehensive passive mapping of public subdomains, mail infrastructure, and cloud assets.',
      es: 'Mapeo pasivo integral de subdominios, infraestructura de correo y activos expuestos en la nube.'
    },
    deliverables: {
      nl: ['Inventarisatierapport publieke activa', 'Identificatie van schaduw-IT', 'Risicoprioritering'],
      en: ['Public asset inventory report', 'Shadow IT identification', 'Risk prioritization'],
      es: ['Inventario de activos públicos', 'Detección de Shadow IT', 'Priorización de riesgo']
    },
    indicativePriceEur: 695,
    estimatedHours: '4-6 uur'
  },
  {
    id: 'aux-aud-01',
    code: 'AUX-AUD-01',
    title: {
      nl: 'Volledige Beveiligings- & Compliance Audit (NIS2 / BIO / internet.nl)',
      en: 'Full-Surface Security & Compliance Audit (NIS2 / BIO / internet.nl)',
      es: 'Auditoría Integral de Seguridad y Cumplimiento (NIS2 / BIO)'
    },
    description: {
      nl: 'Diepgaande technische en organisatorische nulmeting volgens Nederlandse standaarden (BIO, internet.nl en NIS2 toeleveranciersverplichtingen) met direct uitvoerbaar stappenplan.',
      en: 'In-depth technical posture assessment aligned with Dutch standards (BIO, internet.nl, NIS2 supply chain duties) with turnkey remediation roadmap.',
      es: 'Evaluación técnica profunda alineada con estándares holandeses y directiva NIS2 con hoja de ruta de remediación ejecutable.'
    },
    deliverables: {
      nl: ['Directierapportage (in begrijpelijk Nederlands)', 'Technisch engineeringsdossier', 'Prioriteitenmatrix met vaste prijzen', '1 uur adviesgesprek'],
      en: ['Executive business report', 'Technical engineering dossier', 'Fixed-price priority matrix', '1h advisory session'],
      es: ['Informe ejecutivo de negocio', 'Dossier técnico de ingeniería', 'Matriz de precios fijos', 'Sesión de asesoría de 1h']
    },
    indicativePriceEur: 1195,
    estimatedHours: '8-12 uur'
  },
  {
    id: 'aux-ret-01',
    code: 'AUX-RET-01',
    title: {
      nl: 'Remediatieverificatie & Cryptografisch Bewijscertificaat',
      en: 'Remediation Retest & Cryptographic Proof Certificate',
      es: 'Certificado Criptográfico de Prueba de Remediación'
    },
    description: {
      nl: 'Onafhankelijke herbeoordeling na doorgevoerde verbeteringen met wiskundig bewijs (SHA-256 voor/na hashes) voor toezichthouders, accountants of opdrachtgevers.',
      en: 'Independent verification retest following fixes, emitting mathematical proof (SHA-256 before/after hashes) for regulators and clients.',
      es: 'Retest independiente con verificación matemática antes/después para aseguradoras, clientes corporativos y auditores.'
    },
    deliverables: {
      nl: ['ARGUS Proof Certificaat (JSON + PDF)', 'Cryptografische SHA-256 audit trail', 'Toelichting voor NIS2 ketenverantwoording'],
      en: ['ARGUS Proof Certificate', 'SHA-256 cryptographic audit trail', 'NIS2 supply chain justification'],
      es: ['Certificado de Prueba ARGUS', 'Trazabilidad criptográfica SHA-256', 'Documento de justificación NIS2']
    },
    indicativePriceEur: 295,
    estimatedHours: '2 uur'
  },
  {
    id: 'aux-mnt-01',
    code: 'AUX-MNT-01',
    title: {
      nl: 'Continue Bewaking & Kwartaal-Validatie (Quarterly Retainer)',
      en: 'Continuous Control Plane Monitoring (Quarterly Retainer)',
      es: 'Monitoreo Continuo y Validación Trimestral (Retainer)'
    },
    description: {
      nl: 'Viermaal per jaar automatische controle van DNS, TLS, headers en configuraties. Vroegtijdige signalering van verloop of configuratiefouten.',
      en: 'Automated quarterly posture validation for DNS, TLS, headers and hygiene drift. Early warning of certificate expirations or misconfigurations.',
      es: 'Validación trimestral automatizada de postura para prevenir degradaciones en DNS, TLS o expiraciones de certificados.'
    },
    deliverables: {
      nl: ['Kwartaalrapportage met trendanalyse', 'Directe alert bij regressie', 'Inclusief 1 herstel-uur per kwartaal'],
      en: ['Quarterly trend report', 'Immediate regression alerts', 'Includes 1 engineering hour/quarter'],
      es: ['Reporte trimestral de tendencias', 'Alertas de regresión inmediatas', 'Incluye 1 hora de soporte']
    },
    indicativePriceEur: 295,
    estimatedHours: 'Doorlopend',
    recurring: true
  },
  {
    id: 'aux-mnt-02',
    code: 'AUX-MNT-02',
    title: {
      nl: 'Maandelijkse Postuur Monitoring & Alarmering',
      en: 'Monthly Control Plane Monitoring & Alerting',
      es: 'Monitoreo Mensual de Postura y Alertas'
    },
    description: {
      nl: 'Maandelijkse controle van publieke oppervlakte en automatische bewaking van e-mailveiligheid en webverharding.',
      en: 'Monthly automated posture checks and regression alerts.',
      es: 'Chequeos mensuales automatizados y alertas inmediatas ante desconfiguraciones.'
    },
    deliverables: {
      nl: ['Maandelijkse statusmail', 'Automatische regressiedetectie', 'Historische bewijsopslag'],
      en: ['Monthly status email', 'Automated regression detection', 'Historical proof ledger'],
      es: ['Email mensual de estado', 'Detección automática de regresiones', 'Historial criptográfico']
    },
    indicativePriceEur: 95,
    estimatedHours: 'Doorlopend',
    recurring: true
  }
];

// 7 Deterministic Findings for Baseline Target: example-business.nl
export const BASELINE_FINDINGS: FindingItem[] = [
  {
    id: 'fnd_1c6108a004d2',
    ruleId: 'rule-http-missing-hsts',
    title: 'Missing HTTP Strict Transport Security (HSTS)',
    severity: 'MEDIUM',
    category: 'HTTP',
    evidenceIds: ['ev_http_get_slash'],
    explanation: {
      observed: 'HTTP response headers do not include a Strict-Transport-Security header.',
      supports: 'ev_http_get_slash',
      whyItMatters: 'Browsers may attempt unencrypted HTTP connections on first visit, enabling SSL stripping or man-in-the-middle interception on public Wi-Fi networks.',
      limitations: 'Passive observation does not inspect internal redirects or HSTS preload list membership.'
    },
    clientCopy: {
      nl: {
        title: 'Geen automatische beveiligde verbinding (HSTS ontbreekt)',
        explanation: 'De website dwingt bezoekers niet automatisch af om altijd de versleutelde (HTTPS) verbinding te gebruiken. Hierdoor kunnen kwaadwillenden op openbare wifi-netwerken het verkeer onderscheppen.',
        action: 'Configureer de HSTS-header op de webserver zodat browsers altijd en uitsluitend versleuteld communiceren.'
      },
      en: {
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        explanation: 'The website does not mandate encrypted HTTPS connections. Attackers on public Wi-Fi could intercept traffic.',
        action: 'Deploy HSTS header with max-age=31536000 and includeSubDomains.'
      },
      es: {
        title: 'Falta cabecera HSTS (Strict Transport Security)',
        explanation: 'El sitio no obliga a los navegadores a usar siempre HTTPS, permitiendo posibles ataques de intercepción.',
        action: 'Implementar cabecera HSTS en el servidor web.'
      }
    },
    auxServiceId: 'aux-tls-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_b5c8825776b7',
    ruleId: 'rule-http-missing-csp',
    title: 'Missing Content Security Policy (CSP)',
    severity: 'MEDIUM',
    category: 'HTTP',
    evidenceIds: ['ev_http_get_slash'],
    explanation: {
      observed: 'HTTP response headers do not contain a Content-Security-Policy header.',
      supports: 'ev_http_get_slash',
      whyItMatters: 'Without a Content Security Policy, browsers will execute any script injected through third-party widgets, vulnerabilities, or tag managers, increasing cross-site scripting (XSS) impact.',
      limitations: 'Passive inspection detects absence of header; it cannot determine whether inline scripts or third-party tags are present in the DOM.'
    },
    clientCopy: {
      nl: {
        title: 'Ontbrekend Content Security Policy (CSP)',
        explanation: 'Er is geen digitaal reglement dat de browser vertelt welke externe scripts en bronnen veilig geladen mogen worden. Dit vergroot het risico op datadiefstal en kwaadaardige scripts.',
        action: 'Implementeer een restrictief Content-Security-Policy beleid afgestemd op de gebruikte modules.'
      },
      en: {
        title: 'Missing Content Security Policy (CSP)',
        explanation: 'No policy restricts which third-party scripts and resources can load, amplifying cross-site scripting risks.',
        action: 'Deploy tailored Content-Security-Policy header.'
      },
      es: {
        title: 'Falta Content Security Policy (CSP)',
        explanation: 'El navegador no tiene restricciones sobre scripts de terceros, aumentando el riesgo de XSS y robo de datos.',
        action: 'Configurar cabecera Content-Security-Policy.'
      }
    },
    auxServiceId: 'aux-sec-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_3a1dcf526400',
    ruleId: 'rule-dns-weak-spf',
    title: 'Weak SPF Record (~all SoftFail)',
    severity: 'LOW',
    category: 'EMAIL',
    evidenceIds: ['ev_dns_txt'],
    explanation: {
      observed: 'DNS TXT record for SPF specifies ~all (SoftFail) instead of -all (HardFail).',
      supports: 'ev_dns_txt',
      whyItMatters: 'A softfail directive allows unauthorized mail servers to send email purporting to come from this domain with lower rejection likelihood at recipient gateways, aiding spoofing and phishing.',
      limitations: 'Passive DNS lookup does not verify email gateway reputation or DKIM selector configurations.'
    },
    clientCopy: {
      nl: {
        title: 'Verzacht SPF-beleid (~all i.p.v. -all)',
        explanation: 'Het e-mailbeveiligingsbeleid (SPF) staat ingesteld op "SoftFail". Hierdoor worden e-mails die door onbevoegden namens uw domein worden verzonden vaak toch afgeleverd in plaats van direct geblokkeerd.',
        action: 'Pas het SPF-record in het DNS aan naar strikte handhaving (-all).'
      },
      en: {
        title: 'Weak SPF Record (~all SoftFail)',
        explanation: 'Email SPF policy is set to softfail, allowing unauthorized senders higher chances of delivery.',
        action: 'Update SPF record to strict enforcement (-all).'
      },
      es: {
        title: 'Registro SPF Débil (~all SoftFail)',
        explanation: 'La política SPF permite que remitentes no autorizados tengan mayor probabilidad de entrega.',
        action: 'Ajustar SPF a rechazo estricto (-all).'
      }
    },
    auxServiceId: 'aux-dns-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_37379885907a',
    ruleId: 'rule-dns-dmarc-p-none',
    title: 'DMARC Policy Set to None (p=none)',
    severity: 'LOW',
    category: 'EMAIL',
    evidenceIds: ['ev_dns_dmarc'],
    explanation: {
      observed: 'DMARC TXT record specifies p=none (monitoring only).',
      supports: 'ev_dns_dmarc',
      whyItMatters: 'A policy of p=none monitors spoofing attempts but does not instruct recipient mail systems to reject or quarantine fraudulent emails sent using your brand name.',
      limitations: 'Does not inspect DMARC aggregate report delivery endpoints (rua/ruf).'
    },
    clientCopy: {
      nl: {
        title: 'DMARC staat op Alleen Monitoren (p=none)',
        explanation: 'Uw domein controleert wel op e-mailfraude, maar vraagt ontvangende mailservers nog niet om valse e-mails daadwerkelijk te weigeren. Factuurfraudeurs kunnen hier misbruik van maken.',
        action: 'Migreer DMARC naar actief blokkeringsbeleid (p=quarantine of p=reject).'
      },
      en: {
        title: 'DMARC Policy Set to None (p=none)',
        explanation: 'Domain monitors spoofing but does not instruct mail servers to reject fraudulent emails.',
        action: 'Upgrade DMARC policy to p=reject.'
      },
      es: {
        title: 'Política DMARC en Modo Monitor (p=none)',
        explanation: 'No se instruye a los receptores a rechazar correos fraudulentos.',
        action: 'Migrar política DMARC a p=reject.'
      }
    },
    auxServiceId: 'aux-dns-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_217071cd9069',
    ruleId: 'rule-http-missing-x-content-type-options',
    title: 'Missing X-Content-Type-Options Header',
    severity: 'LOW',
    category: 'HTTP',
    evidenceIds: ['ev_http_get_slash'],
    explanation: {
      observed: 'HTTP response headers omit X-Content-Type-Options: nosniff.',
      supports: 'ev_http_get_slash',
      whyItMatters: 'Without nosniff, older or vulnerable browsers may MIME-sniff response content, executing non-executable files as HTML or JavaScript.',
      limitations: 'Modern browsers have partial built-in sniffing protections; legacy client exposure remains.'
    },
    clientCopy: {
      nl: {
        title: 'Ontbrekende MIME-type bescherming (nosniff)',
        explanation: 'De browser wordt niet expliciet verteld om het aangegeven bestandstype strict te respecteren, wat kan leiden tot onbedoelde scriptuitvoering.',
        action: 'Voeg X-Content-Type-Options: nosniff toe aan de serverconfiguratie.'
      },
      en: {
        title: 'Missing X-Content-Type-Options Header',
        explanation: 'Prevents MIME-sniffing vulnerabilities across browsers.',
        action: 'Add X-Content-Type-Options: nosniff.'
      },
      es: {
        title: 'Falta cabecera X-Content-Type-Options',
        explanation: 'Evita ataques de MIME sniffing en navegadores.',
        action: 'Añadir X-Content-Type-Options: nosniff.'
      }
    },
    auxServiceId: 'aux-sec-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_106240e1a287',
    ruleId: 'rule-http-missing-referrer-policy',
    title: 'Missing Referrer-Policy Header',
    severity: 'LOW',
    category: 'HTTP',
    evidenceIds: ['ev_http_get_slash'],
    explanation: {
      observed: 'HTTP response headers do not include a Referrer-Policy header.',
      supports: 'ev_http_get_slash',
      whyItMatters: 'Full URLs containing internal paths, tokens, or query parameters may be leaked to third-party external services when visitors click outbound links.',
      limitations: 'Default browser referrer behavior applies; explicit header ensures consistent privacy posture.'
    },
    clientCopy: {
      nl: {
        title: 'Ontbrekend Verwijzingsbeleid (Referrer-Policy)',
        explanation: 'Er is niet vastgelegd welke informatie over bezochte pagina\'s mag worden meegestuurd naar externe websites wanneer een bezoeker op een link klikt.',
        action: 'Stel Referrer-Policy in op strict-origin-when-cross-origin.'
      },
      en: {
        title: 'Missing Referrer-Policy Header',
        explanation: 'Sensitive URL parameters could leak to external third parties.',
        action: 'Set Referrer-Policy: strict-origin-when-cross-origin.'
      },
      es: {
        title: 'Falta cabecera Referrer-Policy',
        explanation: 'Parámetros sensibles de URL pueden filtrarse a terceros.',
        action: 'Configurar Referrer-Policy: strict-origin-when-cross-origin.'
      }
    },
    auxServiceId: 'aux-sec-01',
    status: 'ACTIVE'
  },
  {
    id: 'fnd_3f1972f1e384',
    ruleId: 'rule-http-missing-frame-protection',
    title: 'Missing Frame Protection (Anti-Clickjacking)',
    severity: 'LOW',
    category: 'HTTP',
    evidenceIds: ['ev_http_get_slash'],
    explanation: {
      observed: 'HTTP headers lack X-Frame-Options or frame-ancestors CSP directive.',
      supports: 'ev_http_get_slash',
      whyItMatters: 'Malicious websites can embed this site in an invisible iframe to trick authenticated users into unauthorized clicks (clickjacking).',
      limitations: 'If website intentionally supports framing (e.g. embeddable widgets), policy must be configured accordingly.'
    },
    clientCopy: {
      nl: {
        title: 'Ontbrekende Frame-bescherming (Anti-Clickjacking)',
        explanation: 'De website kan door kwaadwillenden onzichtbaar worden ingebed in een andere website om bezoekers te misleiden tot het uitvoeren van onbedoelde acties.',
        action: 'Voeg X-Frame-Options: SAMEORIGIN of CSP frame-ancestors \'self\' toe.'
      },
      en: {
        title: 'Missing Frame Protection (Clickjacking)',
        explanation: 'Site can be embedded in malicious iframes to trick users.',
        action: 'Set X-Frame-Options: SAMEORIGIN or CSP frame-ancestors.'
      },
      es: {
        title: 'Falta Protección de Framing (Clickjacking)',
        explanation: 'El sitio puede ser incrustado en iframes maliciosos.',
        action: 'Configurar X-Frame-Options: SAMEORIGIN.'
      }
    },
    auxServiceId: 'aux-sec-01',
    status: 'ACTIVE'
  }
];

// Cryptographic Proofs Generated upon Retest Verification
export const RETEST_PROOFS: ProofRecord[] = [
  {
    id: 'prf_01_hsts',
    findingId: 'fnd_1c6108a004d2',
    ruleId: 'rule-http-missing-hsts',
    status: 'RESOLVED',
    rationale: 'Retest observed Strict-Transport-Security: max-age=31536000; includeSubDomains. Rule rule-http-missing-hsts no longer flags.',
    baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retestEvidenceSha: '84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391'
  },
  {
    id: 'prf_02_csp',
    findingId: 'fnd_b5c8825776b7',
    ruleId: 'rule-http-missing-csp',
    status: 'RESOLVED',
    rationale: 'Retest observed Content-Security-Policy: default-src \'self\'; frame-ancestors \'self\'. Rule rule-http-missing-csp no longer flags.',
    baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retestEvidenceSha: '9a77c3df95a6b0c45ef1394142fa9056d68f773415efb624fcf85cfb114d59bc'
  },
  {
    id: 'prf_03_spf',
    findingId: 'fnd_3a1dcf526400',
    ruleId: 'rule-dns-weak-spf',
    status: 'RESOLVED',
    rationale: 'Retest observed TXT "v=spf1 include:_spf.google.com -all". Strict hardfail enforced.',
    baselineEvidenceSha: 'f3911b306b998a4d4681643cb462ba94a5002a4bf7eeef043bbad6dc34a9b5f4',
    retestEvidenceSha: '11e4bf5b74681428389658faee685744cb9426ba8b056158223668352613d965'
  },
  {
    id: 'prf_04_dmarc',
    findingId: 'fnd_37379885907a',
    ruleId: 'rule-dns-dmarc-p-none',
    status: 'RESOLVED',
    rationale: 'Retest observed TXT "v=DMARC1; p=reject; rua=mailto:dmarc@auxdesign.nl". Full enforcement verified.',
    baselineEvidenceSha: 'c8077c570b74100b12bc1a80ad22be881b29a008c23fbf7e8ebaa22227d85348',
    retestEvidenceSha: '5684a0d9b4b045e0f7f329ea152bcfd4d8a57962451006509f6e148e6ef9be32'
  },
  {
    id: 'prf_05_nosniff',
    findingId: 'fnd_217071cd9069',
    ruleId: 'rule-http-missing-x-content-type-options',
    status: 'RESOLVED',
    rationale: 'Retest observed X-Content-Type-Options: nosniff header present.',
    baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retestEvidenceSha: '84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391'
  },
  {
    id: 'prf_06_referrer',
    findingId: 'fnd_106240e1a287',
    ruleId: 'rule-http-missing-referrer-policy',
    status: 'RESOLVED',
    rationale: 'Retest observed Referrer-Policy: strict-origin-when-cross-origin header present.',
    baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retestEvidenceSha: '84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391'
  },
  {
    id: 'prf_07_frame',
    findingId: 'fnd_3f1972f1e384',
    ruleId: 'rule-http-missing-frame-protection',
    status: 'RESOLVED',
    rationale: 'Retest observed frame-ancestors \'self\' in CSP and X-Frame-Options: SAMEORIGIN.',
    baselineEvidenceSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    retestEvidenceSha: '9a77c3df95a6b0c45ef1394142fa9056d68f773415efb624fcf85cfb114d59bc'
  }
];

// Evidence Vault Records
export const EVIDENCE_VAULT: EvidenceRecord[] = [
  {
    id: 'ev_dns_soa',
    collector: 'collector-dns',
    type: 'dns_records',
    target: 'example-business.nl',
    sha256: '928e4693bf7c7a2bb34460f1ad9226cbcf74c8646b997e068e5ff41b44b92b67',
    timestamp: '2026-09-20T17:35:00.000Z',
    immutable: true,
    rawSnippet: 'SOA ns1.transip.nl hostmaster.transip.nl (2026092001 86400 7200 2419200 300)'
  },
  {
    id: 'ev_dns_txt',
    collector: 'collector-dns',
    type: 'dns_records',
    target: 'example-business.nl',
    sha256: 'f3911b306b998a4d4681643cb462ba94a5002a4bf7eeef043bbad6dc34a9b5f4',
    timestamp: '2026-09-20T17:35:00.000Z',
    immutable: true,
    rawSnippet: 'TXT "v=spf1 include:_spf.google.com ~all"'
  },
  {
    id: 'ev_dns_dmarc',
    collector: 'collector-dns',
    type: 'dns_records',
    target: '_dmarc.example-business.nl',
    sha256: 'c8077c570b74100b12bc1a80ad22be881b29a008c23fbf7e8ebaa22227d85348',
    timestamp: '2026-09-20T17:35:00.000Z',
    immutable: true,
    rawSnippet: 'TXT "v=DMARC1; p=none; sp=none;"'
  },
  {
    id: 'ev_tls_cert',
    collector: 'collector-tls',
    type: 'tls_handshake',
    target: 'example-business.nl:443',
    sha256: '725ba94e75d4a96b30f80a424268e27c1a84f5533118cf23ad1ba75f7956a814',
    timestamp: '2026-09-20T17:35:01.000Z',
    immutable: true,
    rawSnippet: 'TLSv1.3 | TLS_AES_256_GCM_SHA384 | Valid until 2026-12-19 | Let\'s Encrypt'
  },
  {
    id: 'ev_http_get_slash',
    collector: 'collector-http',
    type: 'http_response',
    target: 'https://example-business.nl/',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2026-09-20T17:35:02.000Z',
    immutable: true,
    rawSnippet: 'HTTP/2 200 OK\nServer: nginx\nContent-Type: text/html; charset=UTF-8\n(Missing HSTS, CSP, nosniff, Referrer-Policy)'
  },
  {
    id: 'ev_sec_txt',
    collector: 'collector-security-txt',
    type: 'security_txt',
    target: 'https://example-business.nl/.well-known/security.txt',
    sha256: 'a1278b7a66c4335c02ef497cf879e6129cf8fa7270adff3b6807851e39b7bf37',
    timestamp: '2026-09-20T17:35:03.000Z',
    immutable: true,
    rawSnippet: 'Contact: security@auxdesign.nl\nExpires: 2027-01-01T00:00:00.000Z\nPreferred-Languages: nl, en\nCanonical: https://example-business.nl/.well-known/security.txt'
  }
];

// The "Método XYZ" Investor Engine Model
export const METODO_XYZ = {
  formula: {
    X: {
      title: 'El Resultado Comercial (The Business Goal)',
      short: 'Convertir escaneos pasivos en órdenes de remediación comercial llave en mano para PYMEs holandesas (€495 - €1,195 por ticket).',
      detail: 'Las PYMEs ignoran los reportes de 150 páginas de Qualys o Nessus porque generan pánico sin ofrecer una solución ejecutable. ARGUS entrega resúmenes ejecutivos en positivo ("Wat er al goed is") vinculados a servicios cerrados de AUX Design, logrando tasas de conversión del 35-45% frente al <5% de los escáneres tradicionales.'
    },
    Y: {
      title: 'La Métrica y Prueba Criptográfica (The Grounded Metric)',
      short: '100% de verificación criptográfica de remediación (SHA-256 antes/después), 0 llamadas de red no autorizadas (fail-closed) y 0 costo de nube.',
      detail: 'Proof-as-a-Service: cada remediación genera un certificado inmutable con hashes SHA-256 de las evidencias antes y después de la intervención. Además, la arquitectura 100% offline-first garantiza cero costos de servidores en la nube y cumplimiento absoluto con AVG/GDPR.'
    },
    Z: {
      title: 'El Control Plane Propietario (The Proprietary Engine)',
      short: 'El pipeline determinista OBSERVE → PROVE → DECIDE → FIX → VERIFY + el brazo de ejecución de AUX Design.',
      detail: 'ARGUS no es otro escáner genérico. Es un plano de control de evidencia e higiene que une la rigurosidad forense con una fuerza de venta y ejecución técnica localizada en los Países Bajos (auxdesign.nl).'
    }
  },
  marketTailwinds: [
    {
      title: 'Directiva Europea NIS2 (2024–2026)',
      impact: 'Exige a medianas y grandes empresas verificar la seguridad de su cadena de suministro. Las PYMEs proveedoras necesitan certificar su higiene digital rápidamente para no perder contratos corporativos.'
    },
    {
      title: 'Norma BIO y Estándares internet.nl',
      impact: 'En los Países Bajos, las contrataciones públicas y entidades gubernamentales exigen cumplimiento estricto con SPF (-all), DMARC, CAA y TLS moderno medido por internet.nl.'
    },
    {
      title: 'AVG / GDPR Artículo 32',
      impact: 'Obligación legal de contar con medidas técnicas y organizativas apropiadas. Un certificado de remediación ARGUS demuestra debida diligencia ante la Autoriteit Persoonsgegevens (AP).'
    }
  ],
  unitEconomicsDefaults: {
    monthlyAudits: 60,
    conversionRate: 38, // 38%
    avgTicketEur: 695,
    retainerQuarterlyEur: 295,
    retentionQuarters: 6,
    grossMarginPercent: 78
  },
  antiFearMoat: [
    {
      feature: 'Tono y Enfoque',
      traditional: 'Alarmismo, CVSS inflados, amenazas de multas millonarias (genera rechazo)',
      argus: 'Constructivo, Dutch-first, destaca primero "Wat er al goed is" (genera confianza y acción)'
    },
    {
      feature: 'Entregable al Cliente',
      traditional: 'PDF de 100+ páginas ininteligible para un dueño de PYME',
      argus: '1 página ejecutiva con catálogo cerrado de AUX Design pre-cotizado (€195-€1,195)'
    },
    {
      feature: 'Cierre del Ciclo',
      traditional: 'Te dice qué está mal, pero no lo arregla ni lo certifica',
      argus: 'Ciclo completo: Detección → Remediación (AUX) → Retest → Certificado Criptográfico'
    },
    {
      feature: 'Infraestructura',
      traditional: 'Nubes centralizadas costosas, riesgo de fuga de datos',
      argus: 'OFFLINE FIRST FOR SURE, zero-data-leakage, reproducible localmente'
    }
  ]
};
