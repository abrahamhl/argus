#!/usr/bin/env node

/**
 * Generador de informe de auditoría en Markdown
 * Uso: node scripts/generar-informe.js auditorias/2026-09-08_cliente.json
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];

if (!inputFile || !fs.existsSync(inputFile)) {
  console.error('❌ Error: Archivo de auditoría no encontrado');
  console.error('Uso: node scripts/generar-informe.js auditorias/FECHA_cliente.json');
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

const informe = `
# INFORME DE AUDITORÍA DE SEGURIDAD WEB

---

## INFORMACIÓN DEL CLIENTE

**Cliente**: ${datos.cliente}
**Sitio Web**: ${datos.target}
**Fecha de Auditoría**: ${new Date(datos.fecha).toLocaleString('es-ES')}
**Auditor**: ARGUS Security Assessment
**Modo de Análisis**: ${datos.policy.mode} (100% Pasivo)

---

## RESUMEN EJECUTIVO

Se ha realizado una auditoría de seguridad web pasiva sobre **${datos.target}**,
analizando configuraciones de seguridad HTTP, headers, DNS y políticas de red.

### Puntuación de Seguridad: ${datos.estadisticas.puntuacion_seguridad}/100

${datos.estadisticas.puntuacion_seguridad >= 80 ? '✅ **BUENA** - El sitio tiene una configuración de seguridad sólida.' :
  datos.estadisticas.puntuacion_seguridad >= 60 ? '⚠️ **MEJORABLE** - Se han identificado vulnerabilidades que requieren atención.' :
  '🔴 **CRÍTICA** - Se requiere acción inmediata para proteger el sitio.'}

### Hallazgos por Severidad

| Severidad | Cantidad | Prioridad |
|-----------|----------|-----------|
| 🔴 Crítico | ${datos.estadisticas.hallazgos_criticos} | Remediación inmediata |
| 🟠 Alto | ${datos.estadisticas.hallazgos_altos} | Remediación en 7 días |
| 🟡 Medio | ${datos.estadisticas.hallazgos_medios} | Remediación en 30 días |
| 🟢 Bajo | ${datos.estadisticas.hallazgos_bajos} | Considerar para futuro |

---

## HALLAZGOS CRÍTICOS

${datos.hallazgos.criticos.map((h, i) => `
### ${i + 1}. ${h.titulo}

**ID**: ${h.id}
**Severidad**: ${h.severidad}
**Categoría**: ${h.categoria}

#### Descripción Técnica
${h.descripcion}

#### Impacto en el Negocio
${h.impacto_negocio}

#### Remediación Recomendada
${h.remediacion}

**Coste de Remediación**: ${h.coste_remediacion}
**Prioridad**: ${h.prioridad}

---
`).join('\n')}

${datos.hallazgos.advertencias.length > 0 ? `
## HALLAZGOS DE ALTA PRIORIDAD

${datos.hallazgos.advertencias.map((h, i) => `
### ${i + 1}. ${h.titulo}

**ID**: ${h.id}
**Severidad**: ${h.severidad}
**Categoría**: ${h.categoria}

#### Descripción
${h.descripcion}

#### Impacto
${h.impacto_negocio}

#### Remediación
${h.remediacion}

---
`).join('\n')}
` : ''}

${datos.hallazgos.informativas.length > 0 ? `
## HALLAZGOS INFORMATIVOS

${datos.hallazgos.informativas.map((h, i) => `
### ${i + 1}. ${h.titulo}

**ID**: ${h.id} | **Categoría**: ${h.categoria}

${h.descripcion}

**Remediación**: ${h.remediacion}

---
`).join('\n')}
` : ''}

## PLAN DE ACCIÓN RECOMENDADO

### Fase 1: URGENTE (Esta Semana)
${datos.hallazgos.criticos.map((h, i) => `${i + 1}. ${h.titulo} - ${h.coste_remediacion}`).join('\n')}

### Fase 2: PRIORITARIO (Este Mes)
${datos.hallazgos.advertencias.map((h, i) => `${i + 1}. ${h.titulo} - ${h.coste_remediacion}`).join('\n')}

### Fase 3: MEJORAS (Próximos 3 Meses)
${datos.hallazgos.informativas.map((h, i) => `${i + 1}. ${h.titulo} - ${h.coste_remediacion}`).join('\n')}

---

## SERVICIOS DE REMEDIACIÓN

**ARGUS** ofrece servicios de remediación e implementación de todas las recomendaciones:

- **Remediación Crítica**: 500€ - Solución de todos los hallazgos críticos en 48h
- **Remediación Completa**: 800€ - Solución de críticos + altos en 1 semana
- **Remediación Premium**: 1200€ - Solución completa + re-test + certificado

**Monitoreo Continuo**: 150€/mes - Auditorías mensuales + alertas automáticas

---

## METODOLOGÍA

Esta auditoría se realizó utilizando técnicas 100% pasivas:

✓ **Análisis HTTP**: Inspección de headers, configuración del servidor, SSL/TLS
✓ **Análisis DNS**: Registros A, AAAA, MX, TXT, SPF, DMARC, CAA
✓ **Validación de Políticas**: Verificación contra estándares OWASP y mejores prácticas
✓ **Sin acceso al servidor**: Ningún cambio realizado en el sitio objetivo
✓ **Cumplimiento legal**: Análisis autorizado y ético

---

## LIMITACIONES

Esta auditoría es **pasiva** y **externa**. No incluye:

- Análisis de código fuente
- Penetration testing activo
- Análisis de aplicaciones internas
- Auditoría de infraestructura de servidor
- Análisis de base de datos

Para una auditoría completa con testing activo, contacte para presupuesto personalizado.

---

## PRÓXIMOS PASOS

1. **Revisar** este informe con su equipo técnico
2. **Priorizar** remediaciones según plan de acción
3. **Contactar** para servicios de implementación
4. **Re-test** después de implementar correcciones

---

## CONTACTO

**Email**: [tu-email]
**Teléfono**: [tu-teléfono]
**Web**: [tu-sitio-web]

---

*Este informe es confidencial y está destinado exclusivamente para ${datos.cliente}.
La distribución no autorizada está prohibida.*

**ARGUS Security Assessment** - Protegiendo tu presencia digital
*Generado: ${new Date().toLocaleString('es-ES')}*
`;

// Guardar informe
const outputFilename = inputFile.replace('.json', '_INFORME.md');
fs.writeFileSync(outputFilename, informe);

console.log('\n📄 INFORME GENERADO');
console.log('==================\n');
console.log(`✅ Archivo: ${outputFilename}`);
console.log(`📊 Páginas: ~${Math.ceil(informe.length / 3000)}`);
console.log(`🔍 Hallazgos: ${datos.estadisticas.total_checks} checks realizados\n`);

console.log('🎯 SIGUIENTE PASO:');
console.log('1. Abrir el archivo .md en un editor');
console.log('2. Exportar a PDF (usar pandoc, markdown-pdf, o copiar a Google Docs)');
console.log('3. Personalizar con tu contacto en la sección CONTACTO');
console.log('4. Enviar al cliente\n');

console.log('💡 CONVERSIÓN A PDF RÁPIDA:');
console.log(`   - Online: https://www.markdowntopdf.com/`);
console.log(`   - Comando: pandoc ${path.basename(outputFilename)} -o informe.pdf\n`);
