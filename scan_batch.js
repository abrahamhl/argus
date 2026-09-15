#!/usr/bin/env node
/**
 * ARGUS Batch Scanner
 * Escanea múltiples dominios y genera CSV con scores reales
 */

const fs = require('fs');
const { inspectPublicTargetV1 } = require('./packages/core/dist/api.js');
const { runRules } = require('./packages/core/dist/rules.js');

// Leer CSV original
const csvContent = fs.readFileSync('leads_madrid_centro_100.csv', 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());
const header = lines[0];
const rows = lines.slice(1);

// Parsear empresas
const empresas = rows.map(row => {
  const cols = row.split(',');
  return {
    nombre: cols[0],
    website: cols[1],
    sector: cols[2],
    direccion: cols[3],
    telefono: cols[4],
    email: cols[5],
    empleados: cols[6],
    rating: cols[7],
    notas: cols[8] || ''
  };
});

console.log(`📊 Escaneando ${empresas.length} empresas con ARGUS...`);
console.log(`⏱️  Tiempo estimado: ${Math.round(empresas.length * 30 / 60)} minutos\n`);

// Función para calcular score
function calculateScore(findings) {
  let score = 0;
  findings.forEach(f => {
    if (f.severity === 'CRITICAL') score += 40;
    else if (f.severity === 'HIGH') score += 20;
    else if (f.severity === 'MEDIUM') score += 10;
    else if (f.severity === 'LOW') score += 5;
  });
  return Math.min(score, 100);
}

// Función para categorizar
function categorize(score) {
  if (score >= 60) return '🔴 ROJO';
  if (score >= 30) return '🟡 AMARILLO';
  return '🟢 VERDE';
}

// Función para generar pitch
function generatePitch(empresa, findings, score) {
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');

  if (critical.length > 0) {
    const issue = critical[0].title;
    return `CRÍTICO: ${issue}. ${empresa.nombre} tiene ${critical.length} problemas críticos que exponen datos de clientes. Sanción GDPR: hasta €20.000.`;
  }

  if (high.length > 0) {
    return `${high.length} problemas de seguridad alta detectados. Navegadores marcarán su web como "No segura". Google penalizará su posicionamiento.`;
  }

  if (score > 0) {
    return `${findings.length} problemas detectados. Recomendamos auditoría completa para cumplir estándares modernos.`;
  }

  return `Web segura. Mantenimiento preventivo recomendado.`;
}

// Escanear todas
async function scanAll() {
  const results = [];

  for (let i = 0; i < empresas.length; i++) {
    const empresa = empresas[i];
    const progress = `[${i + 1}/${empresas.length}]`;

    try {
      console.log(`${progress} Escaneando ${empresa.website}...`);

      // Ejecutar ARGUS
      const target = empresa.website.replace(/^https?:\/\//, '');
      const result = await inspectPublicTargetV1(target, {
        policy Acknowledged: true,
        organisationLabel: empresa.nombre
      });

      // Evaluar reglas
      const findings = runRules(result.evidence || []);

      // Calcular métricas
      const score = calculateScore(findings);
      const critical = findings.filter(f => f.severity === 'CRITICAL').length;
      const high = findings.filter(f => f.severity === 'HIGH').length;
      const medium = findings.filter(f => f.severity === 'MEDIUM').length;
      const low = findings.filter(f => f.severity === 'LOW').length;
      const categoria = categorize(score);
      const pitch = generatePitch(empresa, findings, score);

      // SSL status
      const sslOk = result.evidence?.some(e =>
        e.type === 'HTTP_RESPONSE' && e.source?.startsWith('https://')
      );

      // Email security
      const hasSPF = findings.some(f => !f.ruleId.includes('missing-spf'));
      const hasDMARC = findings.some(f => !f.ruleId.includes('missing-dmarc'));

      results.push({
        ...empresa,
        score,
        categoria,
        critical,
        high,
        medium,
        low,
        ssl: sslOk ? 'OK' : 'MISSING',
        spf: hasSPF ? 'OK' : 'MISSING',
        dmarc: hasDMARC ? 'OK' : 'MISSING',
        gdpr_risk: (critical + high) > 3 ? 'ALTO' : (critical + high) > 0 ? 'MEDIO' : 'BAJO',
        pitch
      });

      console.log(`   ✅ Score: ${score} | ${categoria} | Critical: ${critical} | High: ${high}`);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        ...empresa,
        score: 0,
        categoria: '⚪ ERROR',
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        ssl: 'ERROR',
        spf: 'ERROR',
        dmarc: 'ERROR',
        gdpr_risk: 'DESCONOCIDO',
        pitch: `Error al escanear: ${error.message}`
      });
    }

    // Pequeña pausa entre escaneos
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}

// Generar CSV final
function generateCSV(results) {
  const header = 'Empresa,Website,Score,Categoria,Critical,High,Medium,Low,SSL,SPF,DMARC,GDPR_Risk,Sector,Direccion,Telefono,Email,Pitch\n';

  const rows = results
    .sort((a, b) => b.score - a.score) // Ordenar por score descendente
    .map(r => {
      return [
        r.nombre,
        r.website,
        r.score,
        r.categoria,
        r.critical,
        r.high,
        r.medium,
        r.low,
        r.ssl,
        r.spf,
        r.dmarc,
        r.gdpr_risk,
        r.sector,
        r.direccion,
        r.telefono,
        r.email,
        `"${r.pitch}"`
      ].join(',');
    })
    .join('\n');

  return header + rows;
}

// Ejecutar
(async () => {
  try {
    const startTime = Date.now();

    const results = await scanAll();
    const csv = generateCSV(results);

    fs.writeFileSync('leads_madrid_centro_100_SCANNED.csv', csv);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.log(`\n✅ COMPLETADO en ${minutes}m ${seconds}s`);
    console.log(`📄 Archivo generado: leads_madrid_centro_100_SCANNED.csv`);

    // Estadísticas
    const rojos = results.filter(r => r.categoria.includes('ROJO')).length;
    const amarillos = results.filter(r => r.categoria.includes('AMARILLO')).length;
    const verdes = results.filter(r => r.categoria.includes('VERDE')).length;

    console.log(`\n📊 DISTRIBUCIÓN:`);
    console.log(`🔴 ROJO (60-100):     ${rojos} empresas (${Math.round(rojos/results.length*100)}%)`);
    console.log(`🟡 AMARILLO (30-59):  ${amarillos} empresas (${Math.round(amarillos/results.length*100)}%)`);
    console.log(`🟢 VERDE (0-29):      ${verdes} empresas (${Math.round(verdes/results.length*100)}%)`);

    const totalCritical = results.reduce((sum, r) => sum + r.critical, 0);
    const totalHigh = results.reduce((sum, r) => sum + r.high, 0);

    console.log(`\n🚨 VULNERABILIDADES TOTALES:`);
    console.log(`   Critical: ${totalCritical}`);
    console.log(`   High: ${totalHigh}`);
    console.log(`   Promedio score: ${Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
})();
