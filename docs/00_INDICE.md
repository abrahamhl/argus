# 📁 ÍNDICE GENERAL - ARGUS

**Fecha actualización:** 2026-09-08  
**Ruta base:** `C:\Users\2fabr\ARGUS`

---

## 📂 ESTRUCTURA DEL PROYECTO

### `/apps/` - Aplicaciones
- **`/apps/console/`** - CLI ejecutable de ARGUS
  - Ejecutar: `node apps/console/dist/index.js live`
  - Modo demo: `pnpm demo`
  
- **`/apps/web/`** - PWA Web (interfaz gráfica)
  - Puerto: 5173 (desarrollo)
  - Build: `pnpm build`

### `/packages/` - Paquetes Core
- **`/packages/core/`** - Motor principal
  - Inspector: `src/inspector.ts`
  - Reglas: `src/rules.ts` (10 reglas activas)
  - Assessment: `src/assessment.ts`
  
- **`/packages/collectors/`** - Colectores de datos
  - DNS: `src/dns.ts`
  - HTTP: `src/http.ts`
  
- **`/packages/schema/`** - Schemas TypeScript
  - Tipos: Evidence, Finding, Opportunity

### `/docs/` - Documentación
- **`PLAN_COMERCIAL_ARGUS.md`** - Estrategia comercial (€890 paquete)
- **`ESTRATEGIA_PROSPECCION_AUTOMATIZADA.md`** - Prospección con scoring
- **`INTEGRACION_AUXDESIGN.md`** - Servicios aux design
- **`ARQUITECTURA_ROI.md`** - ROI técnico + comercial
- **`AUDIT_2026_09_ARGUS.md`** - Quality scorecard
- **`ROADMAP.md`** - Planificación fases
- **`integration/ARGUS_V01_FINAL_CONTRACT.md`** - Contrato APIs

### `/fixtures/` - Datos de prueba
- **`demo/missing-hsts-before.json`** - Ejemplo vulnerabilidad
- **`demo/hsts-after.json`** - Ejemplo arreglado

---

## 🚀 COMANDOS RÁPIDOS

### Desarrollo
```bash
# Instalar dependencias
pnpm install

# Build completo
pnpm build

# Ejecutar demo
pnpm demo

# Tests
pnpm test
```

### Producción
```bash
# Escanear dominio LIVE
cd C:\Users\2fabr\ARGUS
node apps/console/dist/index.js live
# Introduce: https://ejemplo.com
```

---

## 💼 OPERACIONES COMERCIALES

### Workflow Ventas (Pola/Violeta)
1. **Prospectar** → 10 contactos/día
2. **WhatsApp a Abraham** → "NUEVA AUDITORÍA: empresa.com"
3. **Abraham ejecuta** → 10 min
4. **Presentar informe** → Cerrar venta €890
5. **Comisión 20%** → €180 por venta

### Workflow Técnico (Abraham)
1. **Recibir solicitud** → WhatsApp
2. **Ejecutar ARGUS** → `node apps/console/dist/index.js live`
3. **Generar PDF** → Chrome Ctrl+P
4. **Enviar a ventas** → 15 min total
5. **Remediación** → 7 días

### Precios
- Auditoría gratis → Lead gen
- Reporte completo → €150
- Remediación básica → €300/problema
- **Paquete completo → €890** (BESTSELLER)

---

## 🔧 ARQUITECTURA TÉCNICA

### Flujo de Datos
```
TARGET URL
  ↓
VALIDATION (authorization.ts)
  ↓
DNS COLLECTION (collectors/dns.ts)
  ↓
HTTP COLLECTION (collectors/http.ts)
  ↓
EVIDENCE GENERATION (engine.ts)
  ↓
RULE EVALUATION (rules.ts) [10 reglas]
  ↓
OPPORTUNITY MAPPING (rules.ts)
  ↓
CLIENT ASSESSMENT (assessment.ts)
```

### Stack Tecnológico
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.5
- **Package Manager:** pnpm 9.1
- **Monorepo:** pnpm workspaces
- **Testing:** Fixtures deterministas

---

## 📊 PROSPECCIÓN AUTOMATIZADA

**Ver:** `docs/ESTRATEGIA_PROSPECCION_AUTOMATIZADA.md`

### Funcionalidad Nueva
- Buscar negocios por zona geográfica
- Escanear vulnerabilidades automáticamente
- Generar scoring de gravedad (0-100)
- Listar leads priorizados por riesgo
- Reportes con colores (verde/amarillo/rojo)

### Comandos
```bash
# Escanear Madrid Centro (100 empresas)
node apps/console/dist/index.js scan-zone madrid-centro --limit 100

# Escanear por radio
node apps/console/dist/index.js scan-radius --lat=40.4168 --lon=-3.7038 --km=5
```

---

## 🌐 INTEGRACIÓN AUX DESIGN

**Ver:** `docs/INTEGRACION_AUXDESIGN.md`

### Servicios Combinados
1. **Web Development** (auxdesign.nl) + Auditoría ARGUS
2. **Brand Identity** + Security Hardening
3. **Digital Strategy** + Vulnerability Assessment

### Paquetes Integrados
- Sitio nuevo + Auditoría inicial → €2.500
- Rediseño + Remediación completa → €3.800
- Mantenimiento mensual + Monitoreo → €250/mes

---

## 📈 ROI Y MÉTRICAS

**Ver:** `docs/ARQUITECTURA_ROI.md`

### Proyección Mes 1
- 6 ventas × €890 = **€5.340**
- Comisiones ventas: €1.080
- **Beneficio Abraham: €3.300**
- Tiempo/venta: 7 días

### Métricas Clave
- **Conversión contacto → auditoría:** 20%
- **Conversión auditoría → venta:** 30%
- **Ticket medio:** €890
- **Margen neto:** 62%

---

## 👥 EQUIPO

### Abraham (Operaciones + Técnico)
- Desarrollo ARGUS
- Ejecución auditorías
- Remediación técnica
- Support técnico a ventas

### Pola (Ventas España)
- Prospección presencial
- Presentación informes
- Cierre ventas
- Follow-up clientes

### Violeta (Ventas España)
- Prospección presencial
- Presentación informes
- Cierre ventas
- Follow-up clientes

---

## 📞 CONTACTOS

**Grupo WhatsApp:** ARGUS Equipo  
**Email soporte:** [pendiente]  
**Docs técnicas:** C:\Users\2fabr\ARGUS\docs\

---

## ⚠️ NOTAS IMPORTANTES

### Trabajo Pendiente DeepSeek
- Motor de reglas: **COMPLETO** (10 reglas activas)
- Contrato de integración: **DOCUMENTADO**
- FindingEvaluator: **IMPLEMENTADO**
- OpportunityMapper: **IMPLEMENTADO**

### Estado del Proyecto
- **Quality Score:** 9/10 (after sprint)
- **Reproducibilidad:** 10/10
- **Security Model:** 10/10
- **Commercial Clarity:** 9/10

### Próximos Pasos
1. ✅ Documentación completa
2. 🔄 Prospección automatizada (en desarrollo)
3. ⏳ Integración auxdesign.nl
4. ⏳ Landing page comercial
5. ⏳ Video demo 3 minutos

---

**ÚLTIMA ACTUALIZACIÓN:** 2026-09-08 por Abraham Haddioui  
**VERSIÓN DOCS:** 2.0
