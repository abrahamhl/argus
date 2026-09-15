/**
 * Generador de Reportes ARGUS
 * 
 * Uso:
 *   node generate-report.js https://ejemplo.com
 *   node generate-report.js https://ejemplo.com "Restaurante El Buen Comer" "Abraham Haddioui"
 */

import { inspectPublicTarget } from './packages/core/dist/index.js';
import { runRules, mapFindingsToOpportunities } from './packages/core/dist/assessment.js';
import { generateCommercialReport } from './packages/core/dist/report-generator.js';
import { writeFileSync } from 'fs';

const [,, targetUrl, companyName, assessorName] = process.argv;

if (!targetUrl) {
  console.error('Uso: node generate-report.js <URL> [Nombre Empresa] [Nombre Evaluador]');
  console.error('Ejemplo: node generate-report.js https://ejemplo.com "Hotel Sol" "Abraham Haddioui"');
  process.exit(1);
}

console.log('🔍 Ejecutando auditoría de', targetUrl);
console.log('⏱️  Esto tomará 30-60 segundos...\n');

try {
  const result = await inspectPublicTarget(targetUrl, {
    evaluateFindings: async (evidence) => runRules(evidence),
    mapOpportunities: async (findings) => mapFindingsToOpportunities(findings)
  });

  console.log('✅ Auditoría completada');
  console.log(`   Evidencia recolectada: ${result.evidence.length}`);
  console.log(`   Problemas encontrados: ${result.findings.length}`);
  console.log(`   Oportunidades: ${result.opportunities.length}\n`);

  // Generar HTML
  const html = generateCommercialReport(result, {
    language: 'es',
    companyName: companyName || undefined,
    assessorName: assessorName || 'ARGUS Security Team',
    includeTechnicalDetails: true
  });

  // Guardar archivo
  const hostname = new URL(targetUrl).hostname.replace(/\./g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Informe_Seguridad_${hostname}_${timestamp}.html`;
  
  writeFileSync(filename, html, 'utf-8');

  console.log('📄 Reporte generado:', filename);
  console.log('');
  console.log('SIGUIENTE PASO:');
  console.log('1. Abrir', filename, 'en Chrome');
  console.log('2. Ctrl+P (Imprimir)');
  console.log('3. Guardar como PDF');
  console.log('4. Enviar PDF al cliente');

  // Resumen para WhatsApp
  console.log('\n📱 MENSAJE PARA POLA/VIOLETA:');
  console.log('─'.repeat(50));
  const critical = result.findings.filter(f => f.severity === 'CRITICAL').length;
  const high = result.findings.filter(f => f.severity === 'HIGH').length;
  const medium = result.findings.filter(f => f.severity === 'MEDIUM').length;
  
  let message = `✅ Informe de ${companyName || hostname} listo\n\n`;
  message += `📊 Encontrados ${result.findings.length} problemas:\n`;
  if (critical > 0) message += `🔴 ${critical} CRÍTICOS\n`;
  if (high > 0) message += `🟠 ${high} ALTA prioridad\n`;
  if (medium > 0) message += `🟡 ${medium} MEDIA prioridad\n`;
  message += `\n💰 Precio recomendado:\n`;
  if (result.findings.length >= 5) {
    message += `PAQUETE COMPLETO: 890€`;
  } else if (result.findings.length >= 3) {
    message += `REMEDIACIÓN: ${result.findings.length * 300}€`;
  } else {
    message += `REMEDIACIÓN: 300€ por problema`;
  }
  
  console.log(message);
  console.log('─'.repeat(50));

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nPosibles causas:');
  console.error('- El sitio no responde');
  console.error('- URL incorrecta');
  console.error('- Sin conexión a internet');
  process.exit(1);
}
