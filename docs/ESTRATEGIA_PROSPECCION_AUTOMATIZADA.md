# 🎯 ESTRATEGIA PROSPECCIÓN AUTOMATIZADA - ARGUS

**Fecha:** 2026-09-08  
**Autor:** Abraham Haddioui  
**Objetivo:** Eliminar prospección manual y priorizar leads por vulnerabilidades reales

---

## 🔥 PROBLEMA ACTUAL

### Lo que NO funciona
> **"No sé a quién ir, pero tampoco queremos ir y depender de la fe que valore la empresa sus canales digitales, que no siempre es el caso."**

**Problemas:**
1. **Prospección ciega** → Perder tiempo con empresas sin problemas
2. **Pitch genérico** → "¿Quiere una auditoría?" → Baja conversión
3. **No cualificación previa** → No sabemos quién NECESITA el servicio
4. **Puerta fría tedioso** → Hablar con 50 empresas para cerrar 2 ventas

### La Solución Ideal
> "Lanzar búsqueda en un radio determinado por zonas (Madrid, Arnhem, Gelderland), que la herramienta escanee y entregue listado de leads con **vulnerabilidades encontradas**, **reportes con colores** indicando cuántos problemas, **índice de gravedad**, y así hacer **mejor score de la lista** para empezar con aquellos lugares que tienen un **índice de riesgo brutal**."

---

## 🚀 SOLUCIÓN: ZONE SCANNER + LEAD SCORING

### Flujo Completo

```
INPUT: Zona geográfica (Madrid Centro, Arnhem, etc.)
  ↓
PASO 1: Buscar negocios en zona
  → Google Places API / Bing Local
  → Filtrar: solo empresas con website
  → Output: 100 empresas con URL
  ↓
PASO 2: Escaneo automático (paralelo)
  → Ejecutar ARGUS en cada dominio
  → Timeout 30s por dominio
  → Guardar resultados
  ↓
PASO 3: Scoring de gravedad
  → CRITICAL: +40 puntos
  → HIGH: +20 puntos
  → MEDIUM: +10 puntos
  → LOW: +5 puntos
  → Score total: 0-100
  ↓
PASO 4: Priorización visual
  → 🔴 ROJO (60-100): Contactar HOY
  → 🟡 AMARILLO (30-59): Contactar esta semana
  → 🟢 VERDE (0-29): Contactar después
  ↓
OUTPUT: CSV + PDF con lista priorizada
```

---

## 💻 COMANDOS CLI

### 1. Escanear por Zona

```bash
cd C:\Users\2fabr\ARGUS
node apps/console/dist/index.js scan-zone madrid-centro --limit 100
```

**Output:**
```
🔍 Buscando negocios en 'madrid-centro'...
✅ Encontrados: 100 negocios con website

🚀 Escaneando vulnerabilidades...
[████████████████████] 100/100 (50min)

📊 RESULTADOS:
🔴 Alto riesgo (60-100): 23 empresas
🟡 Medio riesgo (30-59): 45 empresas
🟢 Bajo riesgo (0-29): 32 empresas

💾 Guardado en: leads_madrid_centro_2026_09_08.csv
📄 Reporte PDF: leads_madrid_centro_2026_09_08.pdf
```

### 2. Escanear por Radio GPS

```bash
node apps/console/dist/index.js scan-radius \
  --lat=40.4168 \
  --lon=-3.7038 \
  --km=5 \
  --limit=100
```

**Casos de uso:**
- Escanear alrededor de un evento
- Zona comercial específica
- Polígono industrial

### 3. Escanear por Sector

```bash
node apps/console/dist/index.js scan-zone madrid-centro \
  --sector=restaurants \
  --limit=50
```

**Sectores disponibles:**
- `restaurants` - Restaurantes
- `hotels` - Hoteles
- `retail` - Tiendas
- `healthcare` - Clínicas/consultas
- `legal` - Despachos abogados
- `finance` - Asesorías/gestorías

---

## 📊 OUTPUT: CSV EXPORTADO

### Formato del CSV

```csv
Empresa,Website,Score,Critical,High,Medium,Low,Categoría,Dirección,Teléfono,Email
Restaurante La Montaña,lamontana.es,85,2,3,4,1,ROJO,Calle Mayor 12,+34600123456,info@lamontana.es
Hotel Castilla,hotelcastilla.com,72,1,4,3,2,ROJO,Gran Vía 45,+34600234567,reservas@hotelcastilla.com
Clínica Dental Sonrisa,clinicasonrisa.es,55,0,3,5,3,AMARILLO,Calle Alcalá 88,+34600345678,contacto@clinicasonrisa.es
Despacho Martínez Abogados,martinezyasociados.com,48,1,1,4,4,AMARILLO,Paseo Castellana 101,+34600456789,info@martinezabogados.com
Tienda Moda Urbana,modaurbana.shop,28,0,1,2,6,VERDE,Calle Fuencarral 33,+34600567890,ventas@modaurbana.shop
```

### Campos del CSV

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Empresa** | Nombre del negocio | Restaurante La Montaña |
| **Website** | Dominio principal | lamontana.es |
| **Score** | Puntuación gravedad (0-100) | 85 |
| **Critical** | Problemas CRÍTICOS | 2 |
| **High** | Problemas ALTOS | 3 |
| **Medium** | Problemas MEDIOS | 4 |
| **Low** | Problemas BAJOS | 1 |
| **Categoría** | Color prioridad | ROJO |
| **Dirección** | Ubicación física | Calle Mayor 12 |
| **Teléfono** | Contacto | +34600123456 |
| **Email** | Email contacto | info@lamontana.es |

---

## 🎨 REPORTE PDF

### Estructura del PDF

**PÁGINA 1: Resumen Ejecutivo**
```
ESCANEO DE VULNERABILIDADES - MADRID CENTRO
Fecha: 08/09/2026
Empresas escaneadas: 100

DISTRIBUCIÓN DE RIESGO:
🔴 Alto (60-100):     23 empresas (23%)  [Barra roja]
🟡 Medio (30-59):     45 empresas (45%)  [Barra amarilla]
🟢 Bajo (0-29):       32 empresas (32%)  [Barra verde]

VULNERABILIDADES DETECTADAS:
- Missing HSTS:       67 empresas
- Missing CSP:        82 empresas
- Missing SPF:        45 empresas
- Missing DMARC:      71 empresas
- Problemas SSL:      12 empresas
```

**PÁGINA 2-N: Lista Priorizada**

Para cada empresa:
```
┌─────────────────────────────────────────────┐
│ 🔴 RESTAURANTE LA MONTAÑA                   │
│ Score: 85/100 | Prioridad: ALTA             │
├─────────────────────────────────────────────┤
│ Website: https://lamontana.es               │
│ Teléfono: +34 600 123 456                   │
│ Email: info@lamontana.es                    │
│ Dirección: Calle Mayor 12, Madrid           │
├─────────────────────────────────────────────┤
│ VULNERABILIDADES ENCONTRADAS:               │
│ ❌ 2 CRÍTICAS                               │
│    • Missing HSTS                           │
│    • Certificado SSL expirado               │
│                                             │
│ ⚠️  3 ALTAS                                 │
│    • Missing Content-Security-Policy       │
│    • Missing Frame Protection               │
│    • Cookies sin Secure flag                │
│                                             │
│ ⚡ 4 MEDIAS                                 │
│    • Missing SPF record                     │
│    • Missing DMARC                          │
│    • Missing Referrer-Policy               │
│    • X-Content-Type-Options                 │
│                                             │
│ ℹ️  1 BAJA                                  │
│    • Missing CAA record                     │
├─────────────────────────────────────────────┤
│ 💡 PITCH SUGERIDO:                          │
│ "Hemos detectado 2 problemas críticos en   │
│ su sitio web que pueden hacer que Chrome   │
│ lo marque como 'No seguro'. Uno de ellos   │
│ es su certificado SSL que está EXPIRADO.   │
│ ¿Le gustaría que se lo arreglemos en 48h?" │
└─────────────────────────────────────────────┘
```

---

## 🧮 SISTEMA DE SCORING

### Fórmula de Puntuación

```javascript
score = (critical × 40) + (high × 20) + (medium × 10) + (low × 5)
```

### Ejemplos

| Empresa | Critical | High | Medium | Low | Score | Categoría |
|---------|----------|------|--------|-----|-------|-----------|
| La Montaña | 2 | 3 | 4 | 1 | **145** → 100 (cap) | 🔴 ROJO |
| Hotel Castilla | 1 | 4 | 3 | 2 | **140** → 100 | 🔴 ROJO |
| Clínica Sonrisa | 0 | 3 | 5 | 3 | **125** → 100 | 🔴 ROJO |
| Despacho Martínez | 1 | 1 | 4 | 4 | **100** → 100 | 🔴 ROJO |
| Tienda Urbana | 0 | 1 | 2 | 6 | **70** → 70 | 🟡 AMARILLO |
| Café Central | 0 | 0 | 3 | 5 | **55** → 55 | 🟡 AMARILLO |
| Panadería Sol | 0 | 0 | 2 | 4 | **40** → 40 | 🟡 AMARILLO |
| Librería Luna | 0 | 0 | 1 | 3 | **25** → 25 | 🟢 VERDE |
| Peluquería Bella | 0 | 0 | 0 | 4 | **20** → 20 | 🟢 VERDE |

**Cap:** Score máximo = 100 (aunque la suma dé más)

### Categorización

```
🔴 ROJO (60-100):
- Contactar HOY
- Problemas graves
- Alto riesgo legal/reputacional
- Pitch: "Problemas CRÍTICOS detectados"

🟡 AMARILLO (30-59):
- Contactar esta semana
- Problemas moderados
- Oportunidad de mejora
- Pitch: "Varios problemas de seguridad"

🟢 VERDE (0-29):
- Contactar después
- Problemas menores
- Mantenimiento preventivo
- Pitch: "Optimización y buenas prácticas"
```

---

## 🎯 WORKFLOW COMERCIAL

### ANTES (Manual)
1. Pola/Violeta visitan 10 empresas/día
2. Pitch genérico: "¿Quiere auditoría gratis?"
3. 20% aceptan → 2 auditorías/día
4. Abraham ejecuta auditorías → 30 min
5. 30% compran → 0.6 ventas/día

**Resultado:** 3 ventas/semana, 12 ventas/mes

### DESPUÉS (Automatizado)

**Lunes (Abraham):**
1. Ejecutar scan-zone madrid-centro --limit 100
2. Esperar 50 minutos (automático)
3. Recibir CSV + PDF con 100 leads priorizados
4. Enviar a Pola/Violeta

**Martes-Viernes (Pola/Violeta):**
1. Abrir CSV ordenado por Score (mayor primero)
2. Llamar a empresa con Score 85:
   - "Hola, soy Pola de ARGUS Seguridad."
   - "Hemos escaneado su web lamontana.es y detectado **2 problemas críticos** que pueden hacer que Google lo penalice."
   - "Uno de ellos es su **certificado SSL EXPIRADO**. Los navegadores ya están mostrando 'No seguro' a sus clientes."
   - "¿Le envío el informe completo por email? Son solo 2 páginas."
   
3. Cliente dice SÍ (80% dicen sí con este pitch)
4. Enviar informe pre-generado
5. Llamar al día siguiente: "¿Ha visto el informe? ¿Quiere que lo arreglemos?"
6. 50% compran (vs 30% antes)

**Resultado:** 8 ventas/semana, **32 ventas/mes** (2.7× más)

---

## 💡 VENTAJAS CLAVE

### 1. Prospección Cualificada
❌ **ANTES:** "¿Quiere una auditoría?" → ¿Por qué?  
✅ **AHORA:** "Tiene 2 problemas críticos" → ¡Cuéntame más!

### 2. Pitch Personalizado
❌ **ANTES:** Pitch genérico igual para todos  
✅ **AHORA:** "Su certificado SSL está EXPIRADO" (específico)

### 3. Urgencia Real
❌ **ANTES:** "Podría tener problemas" (futuro)  
✅ **AHORA:** "Chrome YA muestra 'No seguro'" (presente)

### 4. Mejor Conversión
❌ **ANTES:** 20% acepta auditoría → 30% compra = 6% final  
✅ **AHORA:** 80% acepta informe → 50% compra = **40% final**

### 5. Tiempo Optimizado
❌ **ANTES:** 4h prospección/día para 2 auditorías  
✅ **AHORA:** 50 min escaneo automático = 100 leads priorizados

---

## 📈 PROYECCIÓN DE IMPACTO

### Escenario Actual (Sin Automatización)
- Prospección: 10 contactos/día × 5 días = 50 contactos/semana
- Auditorías: 20% × 50 = 10 auditorías/semana
- Ventas: 30% × 10 = **3 ventas/semana**
- Ingresos: 3 × €890 = **€2.670/semana**
- **Mes 1:** €10.680

### Escenario Nuevo (Con Automatización)
- Escaneo: 100 leads priorizados/semana
- Contactos efectivos: Top 30 (Score > 50)
- Auditorías: 80% × 30 = 24 auditorías/semana
- Ventas: 50% × 24 = **12 ventas/semana**
- Ingresos: 12 × €890 = **€10.680/semana**
- **Mes 1:** €42.720

**Multiplicador:** 4× ingresos

### ROI del Desarrollo

**Inversión:**
- Desarrollo zone-scanner: 20h × €50/h = €1.000
- Google Places API: €50/mes
- **Total:** €1.050

**Retorno:**
- Ingresos adicionales mes 1: €42.720 - €10.680 = **€32.040**
- **ROI:** 3.050% en 30 días

**Break-even:** Primera semana

---

## 🛠️ ARQUITECTURA TÉCNICA

### Nuevos Módulos

```
packages/core/src/
  ├── zone-scanner.ts        # Lógica escaneo zona
  ├── lead-scorer.ts         # Scoring vulnerabilidades
  └── report-generator.ts    # PDF + CSV

packages/collectors/src/
  └── business-search.ts     # Google Places API

apps/console/src/commands/
  ├── scan-zone.ts           # CLI: scan-zone
  └── scan-radius.ts         # CLI: scan-radius
```

### Dependencias Nuevas

```json
{
  "dependencies": {
    "@googlemaps/google-maps-services-js": "^3.3.0",
    "csv-writer": "^1.6.0",
    "pdfkit": "^0.13.0",
    "chalk": "^5.0.0",
    "ora": "^6.0.0",
    "p-queue": "^7.0.0"
  }
}
```

### API Externas

#### Google Places API
```javascript
// Buscar negocios en zona
const client = new Client({});
const response = await client.placesNearby({
  params: {
    location: { lat: 40.4168, lng: -3.7038 },
    radius: 5000, // 5km
    type: 'restaurant',
    key: process.env.GOOGLE_PLACES_API_KEY
  }
});
```

**Coste:** $0.017 por búsqueda  
**100 búsquedas:** $1.70  
**Límite gratis:** 0 (siempre paga)

#### Alternativa: Bing Local Search (Más barato)
```javascript
const response = await fetch(
  `https://api.bing.microsoft.com/v7.0/localbusinesses/search?q=restaurants&mkt=es-ES&cc=ES`
);
```

**Coste:** $3.00 per 1000 calls  
**100 búsquedas:** $0.30  
**Límite gratis:** 1.000/mes

**Recomendación:** Empezar con Bing (más barato)

---

## 🚦 PLAN DE IMPLEMENTACIÓN

### Fase 1: MVP (Esta Semana)
- [ ] `business-search.ts` - Integración Bing API
- [ ] `zone-scanner.ts` - Escaneo paralelo
- [ ] `lead-scorer.ts` - Scoring básico
- [ ] `scan-zone` command - CLI funcional
- [ ] Exportar CSV

**Output:** CSV con 100 leads priorizados

**Test:** Escanear Madrid Centro (100 restaurantes)

### Fase 2: Reporting (Próxima Semana)
- [ ] `report-generator.ts` - PDF profesional
- [ ] Templates PDF con colores
- [ ] Pitch sugerido por lead
- [ ] Email automático con informe

**Output:** PDF listo para enviar

### Fase 3: Integración Web (Mes 2)
- [ ] Interface web para ejecutar escaneos
- [ ] Dashboard con resultados
- [ ] Filtros y búsqueda
- [ ] Exportar múltiples formatos

**Output:** App self-service

### Fase 4: Automatización Total (Mes 3)
- [ ] Escaneos programados (diarios/semanales)
- [ ] Notificaciones a ventas
- [ ] CRM integration
- [ ] Follow-up automático

**Output:** Pipeline automatizado

---

## 📞 USO PRÁCTICO

### Caso: Pola Prospectando en Madrid

**Lunes mañana (Abraham):**
```bash
cd C:\Users\2fabr\ARGUS
node apps/console/dist/index.js scan-zone madrid-centro --sector=restaurants --limit=50
```

**30 minutos después:**
- `leads_madrid_centro_restaurants_2026_09_08.csv`
- `leads_madrid_centro_restaurants_2026_09_08.pdf`

**Lunes tarde (Abraham → Pola):**
WhatsApp: "Pola, te envío 50 restaurantes de Madrid Centro. Los primeros 12 tienen problemas CRÍTICOS. Empieza por esos."

**Martes (Pola):**
1. Abrir CSV en Excel
2. Ordenar por Score (mayor primero)
3. Primera fila: Restaurante La Montaña (Score 85)
4. Llamar: +34 600 123 456
5. Pitch: "Hola, soy Pola. Hemos escaneado su web lamontana.es y detectado 2 problemas críticos..."
6. Cliente interesado → Enviar PDF pre-generado
7. Siguiente fila...

**Resultado:** 12 llamadas/día (solo alto riesgo) → 6 ventas/semana (50% conversión)

---

## 🎓 FORMACIÓN PARA VENTAS

### Script Nuevo (Con Escaneo)

**Apertura:**
> "Hola [Nombre], soy [Pola/Violeta] de ARGUS. Hemos escaneado sitios web en [Zona] y el suyo apareció con algunos problemas de seguridad. ¿Tiene un minuto?"

**Si dice SÍ:**
> "Perfecto. Encontramos [X] problemas en [website]. El más grave es [PROBLEMA CRÍTICO], que hace que [CONSECUENCIA ESPECÍFICA]. ¿Le envío el informe completo? Son solo 2 páginas y es gratis."

**Si dice "¿Cómo me encontraron?":**
> "Escaneamos [Zona] buscando empresas que puedan estar en riesgo. Su web apareció con una puntuación de [Score], por eso lo llamo directamente."

**Si dice "Ya tengo webmaster":**
> "Perfecto. Le envío el informe para que él lo arregle. Si no puede, nosotros lo hacemos en 48h por [Precio]."

### Objeciones Nuevas

**"¿Cómo saben que mi web tiene problemas?"**
→ "Lo escaneamos con nuestra herramienta ARGUS. Es la misma que usan consultoras de seguridad. Le puedo enviar el informe técnico completo ahora mismo."

**"¿Es legal escanear mi web sin permiso?"**
→ "Completamente legal. Solo analizamos información pública (como Google). No accedemos a nada privado. Es como visitar su web en Chrome."

**"¿Cuánto cuesta arreglarlo?"**
→ "Depende. Si son solo [X] problemas, €[Precio]. Le podemos dar presupuesto exacto después de ver su web en detalle."

---

## 🏆 VALOR DIFERENCIAL VS COMPETENCIA

### Kali Linux
- **Kali:** Manual, técnico, requiere expertise
- **ARGUS:** Automatizado, CSV listo, sin expertise necesario
- **Winner:** ARGUS (comercial, no técnico)

### Nessus / OpenVAS
- **Nessus:** €3.000/año, complejo, overkill para PYMEs
- **ARGUS:** Gratis (herramienta propia), enfocado web
- **Winner:** ARGUS (coste + simplicidad)

### Agencias Web Tradicionales
- **Agencias:** Auditorías manuales, caras (€500-2.000)
- **ARGUS:** Automatizado, rápido (30s), gratis lead-gen
- **Winner:** ARGUS (velocidad + escala)

### Consultoras Seguridad
- **Consultoras:** Pentesting completo, €5.000-20.000
- **ARGUS:** HTTP/DNS básico, €890 completo
- **Winner:** ARGUS (precio PYME)

---

## 💎 POR QUÉ ESTO IMPRESIONA A EUROPOL

### Características de Valor Alto

1. **Escalabilidad Real**
   - Kali: 1 auditoría/día
   - ARGUS: 1.000 auditorías/día (automatizado)
   
2. **Inteligencia Geoespacial**
   - Mapear vulnerabilidades por zona
   - Detectar patrones geográficos
   - "Madrid Centro tiene 67% sin HSTS"
   
3. **Threat Intelligence Pasiva**
   - Sin active exploitation
   - Cumple regulación europea
   - Escalable a nivel nacional
   
4. **Commercial Intelligence**
   - No solo técnico, también negocio
   - ROI medible
   - Pipeline cuantificado

### Pitch Europol

> "ARGUS puede escanear todas las PYMEs de Holanda en 3 días. Sin tocar nada, solo observación pasiva. Les entregamos un mapa de riesgo nacional: qué zonas tienen más vulnerabilidades, qué sectores están peor, y una lista priorizada de 10.000 empresas en riesgo crítico. Ustedes deciden si se lo notifican o esperan."

**Eso no lo hace Kali.** Eso es ARGUS.

---

## 📋 CHECKLIST IMPLEMENTACIÓN

### Esta Semana
- [ ] Setup Bing Local Search API (key gratuita)
- [ ] Implementar `business-search.ts`
- [ ] Implementar `zone-scanner.ts` (escaneo paralelo)
- [ ] Implementar `lead-scorer.ts` (scoring básico)
- [ ] Crear comando `scan-zone`
- [ ] Exportar CSV funcional
- [ ] **TEST:** Escanear 50 restaurantes Madrid Centro
- [ ] Validar resultados con 3 empresas reales

### Próxima Semana
- [ ] Implementar generación PDF
- [ ] Templates con colores y gráficos
- [ ] Pitch sugerido por lead
- [ ] Formación Pola/Violeta (nuevo script)
- [ ] **TEST:** Primera prospección con escaneo
- [ ] Medir conversión real

### Mes 2
- [ ] Interfaz web para escaneos
- [ ] Dashboard resultados
- [ ] Exportar múltiples formatos
- [ ] Escaneos programados
- [ ] 100 leads/semana automatizados

---

**PRÓXIMA ACCIÓN:** Implementar Fase 1 (MVP) esta semana.

**PREPARADO POR:** Abraham Haddioui  
**CONFIDENCIAL:** Solo equipo ARGUS  
**VERSIÓN:** 1.0
