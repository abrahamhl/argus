/**
 * AUX Design Commercial Service Catalog
 *
 * Grounded in actual services delivered by AUX Design (auxdesign.nl) for Dutch SMEs.
 * Pricing is manually configurable and never invented by AI.
 */

import { OpportunityCategory, EstimatedComplexity } from '@argus/schema';

export interface ServiceOffering {
  serviceId: string;
  category: OpportunityCategory;
  title: {
    nl: string;
    en: string;
    es: string;
  };
  description: {
    nl: string;
    en: string;
    es: string;
  };
  clientBenefit: {
    nl: string;
    en: string;
    es: string;
  };
  deliverables: {
    nl: string[];
    en: string[];
    es: string[];
  };
  estimatedComplexity: EstimatedComplexity;
  estimatedHours: {
    min: number;
    max: number;
  };
  indicativePriceEur: number;
  retestSupported: boolean;
  needsClientAccess: boolean;
  matchingRuleIds: string[];
}

export const AUX_SERVICE_CATALOG: ServiceOffering[] = [
  {
    serviceId: 'AUX-SEC-WEB-HARDENING',
    category: 'SECURITY_HARDENING',
    title: {
      nl: 'Website Beveiligingsverharding (HTTP & Headers)',
      en: 'Website Security Hardening (HTTP & Headers)',
      es: 'Endurecimiento de Seguridad Web (HTTP y Cabeceras)'
    },
    description: {
      nl: 'Implementatie en configuratie van moderne HTTP-beveiligingsheaders (HSTS, CSP, X-Content-Type-Options, Referrer-Policy) op de webserver of reverse proxy.',
      en: 'Configuration and deployment of modern HTTP security headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy) on webserver or reverse proxy.',
      es: 'Configuración y despliegue de cabeceras modernas de seguridad HTTP (HSTS, CSP, X-Content-Type-Options, Referrer-Policy) en servidor web o proxy.'
    },
    clientBenefit: {
      nl: 'Beschermt bezoekers tegen meelezen (Man-in-the-Middle) en voorkomt dat verouderde browsers onbeveiligde HTTP-verbindingen forceren.',
      en: 'Protects visitors from eavesdropping (Man-in-the-Middle) and prevents browsers from downgrading to unencrypted HTTP.',
      es: 'Protege a los visitantes contra interceptaciones de tráfico y evita conexiones HTTP no cifradas.'
    },
    deliverables: {
      nl: [
        'Configuratie van HTTP Strict Transport Security (HSTS) met preload-ondersteuning',
        'Inrichting van Content Security Policy (CSP) en Clickjacking-protectie (X-Frame-Options)',
        'Verwijdering van serverbanners (Server, X-Powered-By)',
        'Argus verificatie retest met voor/na bewijs'
      ],
      en: [
        'Configuration of HTTP Strict Transport Security (HSTS) with preload support',
        'Setup of Content Security Policy (CSP) and clickjacking protection (X-Frame-Options)',
        'Removal of sensitive server disclosure headers (Server, X-Powered-By)',
        'Argus verification retest with before/after cryptographic proof'
      ],
      es: [
        'Configuración de HSTS con soporte preload',
        'Implementación de Content Security Policy (CSP) y protección contra clickjacking',
        'Eliminación de cabeceras con versión del servidor (Server, X-Powered-By)',
        'Retest de verificación ARGUS con prueba criptográfica antes/después'
      ]
    },
    estimatedComplexity: 'LOW',
    estimatedHours: { min: 2, max: 4 },
    indicativePriceEur: 350,
    retestSupported: true,
    needsClientAccess: true,
    matchingRuleIds: [
      'rule-http-missing-hsts',
      'rule-http-missing-csp',
      'rule-http-missing-x-content-type-options',
      'rule-http-missing-referrer-policy'
    ]
  },
  {
    serviceId: 'AUX-SEC-EMAIL-TRUST',
    category: 'EMAIL_TRUST',
    title: {
      nl: 'E-mail Authenticatie & Domeinreputatie (SPF, DKIM, DMARC)',
      en: 'Email Authentication & Domain Reputation (SPF, DKIM, DMARC)',
      es: 'Autenticación de Email y Reputación de Dominio (SPF, DKIM, DMARC)'
    },
    description: {
      nl: 'Inrichting van strikte SPF-mechanismen en DMARC handhavingsbeleid (p=reject of p=quarantine) ter voorkoming van e-mail spoofing en factuurfraude namens uw domein.',
      en: 'Deployment of strict SPF records and DMARC enforcement policies (p=reject / p=quarantine) to stop email spoofing and CEO/invoice fraud.',
      es: 'Configuración de registros SPF estrictos y políticas DMARC (p=reject / p=quarantine) para evitar suplantación de identidad y fraude de facturas.'
    },
    clientBenefit: {
      nl: 'Voorkomt dat cybercriminelen e-mails kunnen sturen uit naam van uw bedrijf naar klanten of banken, en verhoogt uw e-mailafleverbaarheid.',
      en: 'Prevents attackers from impersonating your domain in emails to clients or suppliers, improving deliverability.',
      es: 'Evita que terceros envíen emails haciéndose pasar por su empresa a clientes o proveedores, mejorando la entregabilidad.'
    },
    deliverables: {
      nl: [
        'Audit van alle geautoriseerde verzendservers en softwarepakketten',
        'Strikte SPF-configuratie (overgang van ~all naar -all)',
        'DMARC-record met geautomatiseerde rapportage-inbox',
        'Retest en Before/After bewijsrapport'
      ],
      en: [
        'Audit of legitimate sending services and SaaS platforms',
        'Strict SPF configuration (transition from ~all to -all)',
        'DMARC policy rollout with automated aggregate reporting',
        'Retest and Before/After verification proof'
      ],
      es: [
        'Auditoría de servidores autorizados y plataformas de correo',
        'Configuración estricta de SPF (-all)',
        'Despliegue de política DMARC con buzón de informes',
        'Retest y prueba de verificación antes/después'
      ]
    },
    estimatedComplexity: 'MEDIUM',
    estimatedHours: { min: 3, max: 6 },
    indicativePriceEur: 495,
    retestSupported: true,
    needsClientAccess: true,
    matchingRuleIds: [
      'rule-dns-missing-spf',
      'rule-dns-weak-spf',
      'rule-dns-missing-dmarc',
      'rule-dns-weak-dmarc'
    ]
  },
  {
    serviceId: 'AUX-SEC-DNS-GOVERNANCE',
    category: 'DNS_CONFIGURATION',
    title: {
      nl: 'DNS Beveiliging & CAA Certificaatautorisatie',
      en: 'DNS Security & CAA Certificate Authorization',
      es: 'Seguridad DNS y Autorización de Certificados CAA'
    },
    description: {
      nl: 'Configuratie van DNS Certification Authority Authorization (CAA) records om frauduleuze uitgifte van SSL/TLS-certificaten te blokkeren.',
      en: 'Configuration of DNS Certification Authority Authorization (CAA) records to restrict which CAs can issue certificates.',
      es: 'Configuración de registros DNS CAA para restringir qué autoridades certificadoras pueden emitir certificados.'
    },
    clientBenefit: {
      nl: 'Sluit uit dat kwaadwillenden via een willekeurige certificaatverstrekker een geldig certificaat voor uw domein kunnen aanvragen.',
      en: 'Ensures rogue or compromised Certificate Authorities cannot issue unauthorized certificates for your domain.',
      es: 'Impide que una autoridad certificadora no autorizada emita certificados falsos para su dominio.'
    },
    deliverables: {
      nl: [
        'Inventarisatie van huidige certificaatuitgevers (Let’s Encrypt, Cloudflare, DigiCert)',
        'Aanmaken en testen van CAA-records in DNS-beheer',
        'DNS-propagatiecontrole en Argus retest'
      ],
      en: [
        'Inventory of authorized Certificate Authorities',
        'Creation and validation of CAA DNS records',
        'DNS propagation audit and Argus retest'
      ],
      es: [
        'Inventario de entidades emisoras autorizadas',
        'Creación y validación de registros DNS CAA',
        'Auditoría de propagación y retest ARGUS'
      ]
    },
    estimatedComplexity: 'LOW',
    estimatedHours: { min: 1, max: 2 },
    indicativePriceEur: 195,
    retestSupported: true,
    needsClientAccess: true,
    matchingRuleIds: ['rule-dns-missing-caa']
  },
  {
    serviceId: 'AUX-SEC-SECURITY-TXT',
    category: 'SECURITY_HARDENING',
    title: {
      nl: 'Beveiligingscontact & Coordinated Vulnerability Disclosure (security.txt)',
      en: 'Security Contact & Responsible Disclosure (security.txt)',
      es: 'Contacto de Seguridad y Divulgación Coordinada (security.txt)'
    },
    description: {
      nl: 'Publicatie van een gestandaardiseerd security.txt bestand (RFC 9116) om ethische hackers en onderzoekers een direct contactkanaal te bieden.',
      en: 'Publishing a standardized security.txt file (RFC 9116) providing ethical researchers with an authorized contact channel.',
      es: 'Publicación de un archivo estandarizado security.txt (RFC 9116) para ofrecer un canal directo de contacto a investigadores.'
    },
    clientBenefit: {
      nl: 'Vergemakkelijkt snelle, vertrouwelijke meldingen van beveiligingslekken voordat deze misbruikt worden of op straat belanden.',
      en: 'Facilitates fast, confidential vulnerability reporting before weaknesses are exploited or disclosed publicly.',
      es: 'Facilita la notificación rápida y confidencial de fallos de seguridad antes de que sean explotados.'
    },
    deliverables: {
      nl: [
        'Opstellen RFC 9116 compliant security.txt met Contact en geldig Expires veld',
        'Publicatie op /.well-known/security.txt en /security.txt',
        'Argus verificatie retest'
      ],
      en: [
        'Authoring RFC 9116 compliant security.txt with valid Contact and Expires directives',
        'Deployment to /.well-known/security.txt and /security.txt',
        'Argus verification retest'
      ],
      es: [
        'Redacción de security.txt compatible con RFC 9116',
        'Publicación en /.well-known/security.txt y /security.txt',
        'Retest de verificación ARGUS'
      ]
    },
    estimatedComplexity: 'TRIVIAL',
    estimatedHours: { min: 1, max: 1 },
    indicativePriceEur: 150,
    retestSupported: true,
    needsClientAccess: true,
    matchingRuleIds: ['rule-security-txt-missing']
  },
  {
    serviceId: 'AUX-SEC-TLS-MODERNIZATION',
    category: 'MODERNIZATION',
    title: {
      nl: 'TLS / SSL Certificaat- & Cipher-Modernisering',
      en: 'TLS / SSL Certificate & Cipher Modernization',
      es: 'Modernización de Certificados y Cifrados TLS / SSL'
    },
    description: {
      nl: 'Vervanging van verouderde TLS 1.0/1.1 protocollen en zwakke ciphers door moderne TLS 1.3 standaarden en geautomatiseerde certificaatverlenging.',
      en: 'Upgrade of legacy TLS 1.0/1.1 protocols and weak ciphers to modern TLS 1.3 standards with automated certificate renewal.',
      es: 'Actualización de protocolos TLS antiguos y suites de cifrado débiles a estándares TLS 1.3 con renovación automática.'
    },
    clientBenefit: {
      nl: 'Garandeert optimale browsercompatibiliteit, voorkomt beveiligingswaarschuwingen en waarborgt hoge encryptiestandaarden.',
      en: 'Guarantees browser compatibility, avoids security warnings, and enforces high cryptographic standards.',
      es: 'Garantiza compatibilidad con navegadores modernos, evita alertas de seguridad y asegura un cifrado robusto.'
    },
    deliverables: {
      nl: [
        'Configuratie van moderne TLS 1.2 / TLS 1.3 cipher suites',
        'Inschakelen van automatische certificaatverlenging (ACME / Let’s Encrypt)',
        'Retest met controle van vervaldatum en SANs'
      ],
      en: [
        'Configuration of modern TLS 1.2 / TLS 1.3 cipher suites',
        'Automated renewal setup via ACME / Let’s Encrypt',
        'Retest verifying expiration dates and SANs'
      ],
      es: [
        'Configuración de suites modernas TLS 1.2 / 1.3',
        'Configuración de renovación automática vía ACME',
        'Retest verificando fechas de caducidad y nombres SAN'
      ]
    },
    estimatedComplexity: 'LOW',
    estimatedHours: { min: 2, max: 3 },
    indicativePriceEur: 275,
    retestSupported: true,
    needsClientAccess: true,
    matchingRuleIds: ['rule-tls-expiring', 'rule-tls-insecure']
  }
];

export function getServiceCatalog(): ServiceOffering[] {
  return [...AUX_SERVICE_CATALOG];
}

export function lookupServiceForFinding(ruleId: string): ServiceOffering | undefined {
  return AUX_SERVICE_CATALOG.find(service => service.matchingRuleIds.includes(ruleId));
}

/**
 * Allows the operator to manually configure pricing without AI interference.
 */
export function updateServicePrice(serviceId: string, newPriceEur: number): boolean {
  const service = AUX_SERVICE_CATALOG.find(s => s.serviceId === serviceId);
  if (service && newPriceEur >= 0) {
    service.indicativePriceEur = newPriceEur;
    return true;
  }
  return false;
}
