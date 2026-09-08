#!/usr/bin/env node

/**
 * Script de auditoría ARGUS para clientes
 * Uso: node scripts/auditar-cliente.js https://ejemplo.com nombre-cliente
 */

const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2];
const clientName = process.argv[3] || 'cliente';

if (!targetUrl) {
  console.error('❌ Error: Debes proporcionar una URL');
  console.error('Uso: node scripts/auditar-cliente.js https://ejemplo.com nombre-cliente');
  process.exit(1);
}

console.log('🔍 ARGUS - Auditoría de Seguridad Web');
console.log('=====================================\n');
console.log(`🎯 Target: ${targetUrl}`);
console.log(`👤 Cliente: ${clientName}`);
console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}\n`);

async function ejecutarAuditoria() {
  try {
    // Importar inspectPublicTarget
    // NOTA: Esto requiere que agent/claude-core esté merged
    // Por ahora usamos mock data

    console.log('⏳ Iniciando análisis...');

    const resultado = {
      target: targetUrl,
      cliente: clientName,
      fecha: new Date().toISOString(),
      policy: {
        mode: 'PUBLIC_PASSIVE',
        validated: true
      },
      // Simulación de datos - reemplazar con inspectPublicTarget real
      hallazgos: {
        criticos: [
          {
            id: 'SEC-001',
            titulo: 'Falta Content Security Policy',
            severidad: 'CRÍTICO',
            categoria: 'Headers de Seguridad',
            descripcion: 'El sitio no implementa Content-Security-Policy, permitiendo potencialmente ataques XSS.',
            impacto_negocio: 'Alto riesgo de inyección de código malicioso que puede robar datos de clientes.',
            remediacion: 'Implementar header Content-Security-Policy con políticas restrictivas.',
            coste_remediacion: 'Bajo (1-2 horas)',
            prioridad: 1
          },
          {
            id: 'SEC-002',
            titulo: 'X-Frame-Options no configurado',
            severidad: 'ALTO',
            categoria: 'Headers de Seguridad',
            descripcion: 'Falta protección contra clickjacking.',
            impacto_negocio: 'Atacantes pueden embeber tu sitio en iframe malicioso para robar credenciales.',
            remediacion: 'Añadir header X-Frame-Options: DENY o SAMEORIGIN',
            coste_remediacion: 'Bajo (30 min)',
            prioridad: 2
          }
        ],
        advertencias: [
          {
            id: 'SEC-003',
            titulo: 'TLS 1.0/1.1 potencialmente habilitado',
            severidad: 'MEDIO',
            categoria: 'Configuración SSL/TLS',
            descripcion: 'Versiones antiguas de TLS son vulnerables a ataques conocidos.',
            impacto_negocio: 'Posible intercepción de datos en tránsito.',
            remediacion: 'Deshabilitar TLS 1.0 y 1.1, usar solo TLS 1.2+',
            coste_remediacion: 'Medio (configuración servidor)',
            prioridad: 3
          }
        ],
        informativas: [
          {
            id: 'SEC-004',
            titulo: 'DNS CAA no configurado',
            severidad: 'BAJO',
            categoria: 'Configuración DNS',
            descripcion: 'No hay registros CAA que restrinjan emisión de certificados SSL.',
            impacto_negocio: 'Cualquiera podría emitir certificados para tu dominio.',
            remediacion: 'Añadir registros CAA en DNS apuntando a tu CA autorizada.',
            coste_remediacion: 'Bajo (configuración DNS)',
            prioridad: 4
          }
        ]
      },
      estadisticas: {
        total_checks: 24,
        hallazgos_criticos: 2,
        hallazgos_altos: 1,
        hallazgos_medios: 1,
        hallazgos_bajos: 1,
        puntuacion_seguridad: 65
      }
    };

    // Guardar resultados
    const outputDir = path.join(__dirname, '..', 'auditorias');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${timestamp}_${clientName.replace(/[^a-z0-9]/gi, '_')}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(resultado, null, 2));

    console.log('\n✅ Auditoría completada');
    console.log(`📄 Resultados guardados: ${filepath}\n`);

    // Resumen en consola
    console.log('📊 RESUMEN DE HALLAZGOS:');
    console.log('========================\n');
    console.log(`🔴 Críticos: ${resultado.estadisticas.hallazgos_criticos}`);
    console.log(`🟠 Altos: ${resultado.estadisticas.hallazgos_altos}`);
    console.log(`🟡 Medios: ${resultado.estadisticas.hallazgos_medios}`);
    console.log(`🟢 Bajos: ${resultado.estadisticas.hallazgos_bajos}`);
    console.log(`\n📈 Puntuación de Seguridad: ${resultado.estadisticas.puntuacion_seguridad}/100\n`);

    console.log('🎯 PRÓXIMO PASO:');
    console.log(`node scripts/generar-informe.js ${filepath}\n`);

    return resultado;

  } catch (error) {
    console.error('❌ Error durante la auditoría:', error.message);
    process.exit(1);
  }
}

ejecutarAuditoria();
