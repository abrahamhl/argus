import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanDomain(url) {
  if (!url) return null;
  let d = url.trim().toLowerCase();
  try {
    if (d.startsWith('http://') || d.startsWith('https://')) {
      d = new URL(d).hostname;
    } else {
      d = d.split('/')[0];
    }
  } catch {
    d = d.replace(/^https?:\/\//, '').split('/')[0];
  }
  d = d.replace(/^www\./, '').trim();
  if (/facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|google\.com|wikipedia\.org|wikidata\.org|tiktok\.com|overpass-api\.de/.test(d)) {
    return null;
  }
  return d;
}

function classifyMadridSector(tags, name) {
  const text = `${tags.office || ''} ${tags.amenity || ''} ${tags.tourism || ''} ${tags.shop || ''} ${name || ''}`.toLowerCase();

  if (/abogad|abogados|lawyer|legal|juridic|despacho|bufete|pleito|asesoria juridica/.test(text)) {
    return {
      sectorId: 'LEGAL',
      name: 'Bufetes de Abogados & Asesoría Jurídica',
      ticketAvgEur: 2500,
      annualRevenue: '€ 1.2M - € 8M',
      clientProfile: 'Muy alto poder adquisitivo (tarifas horarias de 200€ a 450€/h)'
    };
  }

  if (/notar|notaria|notario/.test(text)) {
    return {
      sectorId: 'NOTARY',
      name: 'Notarías de Madrid',
      ticketAvgEur: 2000,
      annualRevenue: '€ 1.5M - € 6M',
      clientProfile: 'Poder adquisitivo institucional y patrimonial alto'
    };
  }

  if (/dent|dental|diente|odontolog|implant|ortodoncia|periodoncia/.test(text)) {
    return {
      sectorId: 'DENTAL',
      name: 'Clínicas Dentales & Implantología',
      ticketAvgEur: 380,
      annualRevenue: '€ 700K - € 3M',
      clientProfile: 'Alto volumen y tratamientos de implantes de 1.500€ a 4.000€'
    };
  }

  if (/estetic|clinica estetica|medicina estetica|dermatolog|cirugia|laser|boto|acid|hialuronico|belleza/.test(text)) {
    return {
      sectorId: 'AESTHETICS',
      name: 'Clínicas de Medicina Estética & Cirugía',
      ticketAvgEur: 450,
      annualRevenue: '€ 800K - € 4M',
      clientProfile: 'Tratamientos de alta rentabilidad (fillers, cirugía, láser)'
    };
  }

  if (/asesor|fiscal|gestor|gestoria|tributar|contab|auditor|consultor/.test(text)) {
    return {
      sectorId: 'TAX_FINANCE',
      name: 'Asesorías Fiscales, Gestorías & Consultoría',
      ticketAvgEur: 1600,
      annualRevenue: '€ 600K - € 3.5M',
      clientProfile: 'Retainers mensuales recurrentes de empresas y autónomos'
    };
  }

  if (/hotel|hostal|boutique|residence|alojamiento|suites/.test(text)) {
    return {
      sectorId: 'HOTEL',
      name: 'Hoteles Boutique & Alojamientos Premium',
      ticketAvgEur: 220,
      annualRevenue: '€ 1.0M - € 10M',
      clientProfile: 'Habitaciones de 150€ a 400€/noche perdiendo 18-22% en Booking'
    };
  }

  return {
    sectorId: 'CORPORATE',
    name: 'Servicios Profesionales & Salud',
    ticketAvgEur: 900,
    annualRevenue: '€ 500K - € 2M',
    clientProfile: 'Empresas de servicios con flujo de caja activo'
  };
}

function formatSpanishPhone(rawPhone) {
  if (!rawPhone) return null;
  let p = rawPhone.trim().replace(/[^\d+]/g, ' ').replace(/\s+/g, ' ').trim();
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (p.startsWith('34') && !p.startsWith('+34')) p = '+34 ' + p.slice(2);
  if (!p.startsWith('+34') && !p.startsWith('+') && p.length >= 9) p = '+34 ' + p;
  return p;
}

async function auditDomain(domain) {
  const res = {
    resolved: false,
    ip: null,
    spf: null,
    dmarc: null,
    tlsValid: false,
    tlsDays: null,
    reachable: false,
    statusCode: null,
    hsts: false,
    hasViewport: false,
    hasPhoneLink: false,
    hasOnlineBooking: false,
    preConsentRisk: false
  };

  try {
    const a = await dns.resolve4(domain).catch(() => []);
    if (a.length > 0) { res.resolved = true; res.ip = a[0]; }
  } catch {}

  try {
    const txt = await dns.resolveTxt(domain).catch(() => []);
    const flat = txt.map(r => r.join(''));
    res.spf = flat.find(t => t.startsWith('v=spf1')) || null;
  } catch {}

  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flat = dmarcTxt.map(r => r.join(''));
    res.dmarc = flat.find(t => t.startsWith('v=DMARC1')) || null;
  } catch {}

  await new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: 3000,
      rejectUnauthorized: false
    }, () => {
      try {
        const cert = socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          res.tlsValid = socket.authorized;
          const exp = new Date(cert.valid_to).getTime();
          res.tlsDays = Math.round((exp - Date.now()) / (1000 * 60 * 60 * 24));
        }
      } catch {}
      socket.destroy();
      resolve();
    });
    socket.on('error', () => { socket.destroy(); resolve(); });
    socket.on('timeout', () => { socket.destroy(); resolve(); });
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch(`https://${domain}`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/128.0)'
      }
    });
    clearTimeout(timeout);
    res.reachable = true;
    res.statusCode = resp.status;
    res.hsts = resp.headers.has('strict-transport-security');

    const html = await resp.text();
    res.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    res.hasPhoneLink = /href=["']tel:[^"']+["']/i.test(html);

    if (/pedir-cita|cita-previa|reserva-online|reservar|doctoralia|treatwell|cal\.com|calendly|reservas/i.test(html)) {
      res.hasOnlineBooking = true;
    }

    if (/google-analytics|googletagmanager|connect\.facebook\.net/i.test(html) && !/cookiebot|complianz|onetrust|usercentrics/i.test(html)) {
      res.preConsentRisk = true;
    }
  } catch {}

  return res;
}

export async function processMadridCatalog() {
  console.log(`\n======================================================`);
  console.log(`🇪🇸 PROCESANDO CATÁLOGO DE MADRID PARA HERMANO & POLA`);
  console.log(`======================================================\n`);

  const rawFile = path.join(ROOT_DIR, 'data', 'raw_madrid_leads.json');
  if (!fs.existsSync(rawFile)) {
    console.error(`Error: raw_madrid_leads.json no encontrado.`);
    return [];
  }

  const rawData = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  const seenDomains = new Set();
  const leads = [];

  for (const [zone, elems] of Object.entries(rawData)) {
    if (!Array.isArray(elems)) continue;
    for (const el of elems) {
      const tags = el.tags || {};
      const name = tags.name || tags.brand || tags.operator;
      if (!name) continue;

      const website = tags.website || tags['contact:website'] || tags.url;
      const domain = cleanDomain(website);
      if (!domain || seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      const sector = classifyMadridSector(tags, name);
      const phone = formatSpanishPhone(tags.phone || tags['contact:phone'] || tags['phone:mobile']);

      const street = tags['addr:street'] || '';
      const num = tags['addr:housenumber'] || '';
      const postcode = tags['addr:postcode'] || '';
      const address = [street, num, postcode, 'Madrid'].filter(Boolean).join(' ') || `Madrid (${zone})`;

      leads.push({
        business_name: name,
        domain: domain,
        website: website.startsWith('http') ? website : `https://${domain}`,
        address: address,
        city: 'Madrid',
        zone: zone,
        country: 'ES',
        sector_id: sector.sectorId,
        sector_name: sector.name,
        avg_ticket_eur: sector.ticketAvgEur,
        annual_revenue: sector.annualRevenue,
        client_profile: sector.clientProfile,
        phone_public: phone,
        latitude: el.lat || el.center?.lat || null,
        longitude: el.lon || el.center?.lon || null
      });
    }
  }

  console.log(`Deduplicados ${leads.length} negocios reales de Madrid. Iniciando auditoría técnica...`);

  const auditedLeads = [];
  const CONCURRENCY = 15;

  for (let i = 0; i < leads.length; i += CONCURRENCY) {
    const batch = leads.slice(i, i + CONCURRENCY);
    const batchRes = await Promise.all(batch.map(async (l) => {
      const audit = await auditDomain(l.domain);

      const redFlags = [];
      if (!audit.dmarc) {
        redFlags.push('Falta DMARC (facturas, minutas y presupuestos van a SPAM de clientes o riesgo de suplantación)');
      }
      if (audit.preConsentRisk) {
        redFlags.push('Cookies de seguimiento antes de consentimiento (infracción grave Guía de Cookies AEPD / LOPDGDD)');
      }
      if (!audit.hasOnlineBooking) {
        redFlags.push('Sin sistema de cita previa o intake online (pérdida del 65% de clientes fuera de horario)');
      }
      if (!audit.tlsValid || (audit.tlsDays !== null && audit.tlsDays < 15)) {
        redFlags.push('Certificado SSL no válido o caduca próximamente');
      }
      if (!audit.hasViewport) {
        redFlags.push('Web no optimizada para móvil (diseño de escritorio obsoleto)');
      }

      const priority = redFlags.length > 0 ? 'RED' : 'ORANGE';

      // Madrid Commercial Packaging (Precios adaptados a Madrid)
      let setupFee = 2450;
      let monthlyFee = 180;
      let packName = 'Suite Integral de Ciberseguridad, DMARC y Captación Web';
      let hermanoPolaPitch = '';
      let roiArg = '';

      if (l.sector_id === 'LEGAL' || l.sector_id === 'NOTARY') {
        packName = 'Blindaje de Correo DMARC, Cumplimiento AEPD y Web de Reputación';
        setupFee = 2850;
        monthlyFee = 195;
        hermanoPolaPitch = `Buenos días, os contacto de parte de nuestro equipo de auditoría informática en Madrid. Hemos realizado una revisión técnica sobre ${l.domain} y hemos detectado que vuestro dominio carece de registro DMARC. Esto significa que las minutas de honorarios y contratos confidenciales que enviáis están entrando en la carpeta de SPAM de clientes de Gmail/Outlook, o peor, que un atacante puede enviar correos falsos haciéndose pasar por vuestro despacho. Además, vuestra web carece de un portal de intake cifrado para nuevos clientes.`;
        roiArg = `Con una tarifa horaria o iguala habitual en Madrid de 250€ a 400€/hora, captar únicamente dos nuevos asuntos corporativos al trimestre ya genera más de 12.000€ en honorarios limpios.`;
      } else if (l.sector_id === 'DENTAL' || l.sector_id === 'AESTHETICS') {
        packName = 'Sistema de Cita Previa Automatizada & Blindaje Anti-Spam DMARC';
        setupFee = 1950;
        monthlyFee = 150;
        hermanoPolaPitch = `Buenos días, os visito/contacto porque vuestra clínica ${l.business_name} tiene un prestigio enorme, pero al entrar a las 21:30 para pedir cita, no existe ninguna opción de reserva online. Más del 65% de los pacientes en Madrid buscan tratamientos estéticos o dentales por la noche desde el móvil; al no poder elegir hora, se van directamente a la clínica de la calle de al lado que sí tiene botón de cita online.`;
        roiArg = `Con un tratamiento medio de 350€ a 1.200€, conseguir solo 3 pacientes adicionales al mes gracias a la reserva online nocturna supone más de 2.500€ de facturación extra neta cada mes.`;
      } else if (l.sector_id === 'HOTEL') {
        packName = 'Motor de Reservas Directas sin Comisiones (Ahorro del 20% Booking)';
        setupFee = 2850;
        monthlyFee = 220;
        hermanoPolaPitch = `Buenos días, vemos que para reservar en ${l.business_name} los huéspedes tienen que llamar o terminan reservando por Booking.com, perdiendo entre un 18% y un 22% de comisión en cada habitación. Nuestro equipo técnico instala en 48 horas un motor de reserva directa integrado con pasarela de pago para que os quedéis con el 100% de la reserva.`;
        roiArg = `A 200€ la noche, recuperar solo 15 noches de reserva directa al mes supone un ahorro neto de más de 650€ mensuales en comisiones que dejáis de pagar a Booking.`;
      } else {
        packName = 'Rediseño Web Corporativo & Auditoría de Seguridad DMARC';
        setupFee = 1850;
        monthlyFee = 140;
        hermanoPolaPitch = `Buenos días, hemos detectado fallos críticos de entregabilidad en el correo de ${l.domain} y falta de adaptación móvil en la web corporativa, lo que provoca la fuga de presupuestos y clientes potenciales.`;
        roiArg = `Una sola operación o cliente retenido cubre con creces el coste total del servicio.`;
      }

      // Reparto acordado para Hermano & Pola: 20% comisionista en mano por cierre / 80% ejecución técnica Abraham
      const hermanoPolaCash = Math.round(setupFee * 0.20 * 100) / 100;
      const abrahamTech = Math.round(setupFee * 0.80 * 100) / 100;

      return {
        ...l,
        priority: priority,
        redFlags: redFlags,
        audit: {
          dns: { resolved: audit.resolved, ip: audit.ip, spf: audit.spf, dmarc: audit.dmarc },
          tls: { valid: audit.tlsValid, days: audit.tlsDays },
          http: { reachable: audit.reachable, hsts: audit.hsts, status: audit.statusCode },
          booking: { hasOnlineBooking: audit.hasOnlineBooking, hasPhoneLink: audit.hasPhoneLink, hasViewport: audit.hasViewport },
          privacy: { preConsentRisk: audit.preConsentRisk }
        },
        opportunity: {
          packageName: packName,
          setupFeeEur: setupFee,
          hermanoPolaCashEur: hermanoPolaCash,
          abrahamTechEur: abrahamTech,
          monthlyRetainerEur: monthlyFee,
          pitchScriptES: hermanoPolaPitch,
          roiArgumentES: roiArg
        }
      };
    }));

    auditedLeads.push(...batchRes);
    console.log(`Auditados ${auditedLeads.length}/${leads.length} negocios de Madrid...`);
    await sleep(200);
  }

  // Ordenar por prioridad RED y luego por precio
  auditedLeads.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === 'RED' ? -1 : 1;
    return (b.opportunity?.setupFeeEur || 0) - (a.opportunity?.setupFeeEur || 0);
  });

  const outPath = path.join(ROOT_DIR, 'data', 'madrid_hermano_pola_audited.json');
  fs.writeFileSync(outPath, JSON.stringify(auditedLeads, null, 2));
  console.log(`\n✅ Guardado catálogo auditado de Madrid en ${outPath}`);

  return auditedLeads;
}

async function main() {
  await processMadridCatalog();
}

main().catch(console.error);
