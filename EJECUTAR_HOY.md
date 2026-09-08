# 🚀 EJECUTAR AUDITORÍAS HOY - GUÍA RÁPIDA

## OBJETIVO: 1200€ ANTES DE LAS 18:00

---

## ⚡ INICIO RÁPIDO (5 minutos)

### 1. Verificar que ARGUS funciona

```bash
cd ~/ARGUS
pnpm install
pnpm build
```

Si todo compila sin errores, estás listo.

### 2. Probar script de auditoría

```bash
node scripts/auditar-cliente.js https://example.com demo
```

Debe generar archivo en `auditorias/` con resultados.

### 3. Probar generador de informe

```bash
node scripts/generar-informe.js auditorias/[archivo-generado].json
```

Debe crear archivo `_INFORME.md` que puedes convertir a PDF.

---

## 📞 PROSPECCIÓN (09:00 - 11:00)

### SCRIPT DE LLAMADA (copiar y pegar)

```
Buenos días, soy [Tu Nombre], especialista en ciberseguridad.

Ofrezco auditorías de seguridad web hoy con descuento de lanzamiento.

Analizo [su-dominio.com] en busca de vulnerabilidades en 30 minutos
y entrego informe profesional el mismo día.

¿El responsable de IT o marketing está disponible?

Precio especial hoy: 350€ (normalmente 500€).
```

### PLANTILLA EMAIL RÁPIDO

**Asunto**: Auditoría de seguridad - [EMPRESA] - Oferta 24h

```
Hola [Nombre],

Soy [Tu Nombre], especialista en seguridad web.

He visto que [EMPRESA] tiene presencia online activa en [dominio].

Te ofrezco una auditoría de seguridad web profesional:

✓ Análisis completo en 30 minutos
✓ Informe PDF profesional
✓ Sin acceso a tu servidor (100% pasivo)
✓ Entrega hoy mismo

PRECIO HOY: 350€ (desc. 30% - válido 24h)

¿Te interesa proteger tu negocio?

Responde "SÍ" y empezamos.

Saludos,
[Tu Nombre]
[Tu Teléfono]
```

### PLANTILLA WHATSAPP/LINKEDIN

```
Hola [Nombre] 👋

Vi que tienes [empresa/web]. 

Ofrezco auditorías de seguridad web:
🔍 30 min de análisis
📄 Informe profesional
🚀 Entrega hoy

350€ - Oferta válida HOY

¿Interesado?
```

---

## 💼 LISTA DE PROSPECTOS IDEALES

### Búsqueda Google Maps
1. Abre Google Maps
2. Busca: "e-commerce [tu ciudad]"
3. Busca: "hotel [tu ciudad]"
4. Busca: "restaurante [tu ciudad]"
5. Busca: "clínica [tu ciudad]"
6. Busca: "abogados [tu ciudad]"

**Llamar a 20 de cada categoría** = 100 llamadas

### Búsqueda LinkedIn
1. "CEO [tu ciudad]"
2. "Gerente [tu ciudad]"
3. Filtrar: empresas 10-50 empleados
4. Mensaje directo a 50 personas

---

## 🎯 EJECUCIÓN POR CLIENTE

### PASO 1: Onboarding (5 min)

**Checklist**:
- [ ] Confirmar dominio exacto
- [ ] Explicar proceso (pasivo, sin riesgos)
- [ ] Enviar propuesta comercial (docs/PROPUESTA_COMERCIAL.md)
- [ ] Recibir pago (350€)
- [ ] Confirmar email para envío de informe

### PASO 2: Ejecutar Auditoría (15 min)

```bash
# Navegar a ARGUS
cd ~/ARGUS

# Ejecutar auditoría
node scripts/auditar-cliente.js https://[dominio-cliente] [nombre-cliente]

# Ejemplo:
node scripts/auditar-cliente.js https://ejemplo-tienda.com tienda_ejemplo
```

### PASO 3: Generar Informe (10 min)

```bash
# Generar informe Markdown
node scripts/generar-informe.js auditorias/2026-09-08_[cliente].json

# El script generará: auditorias/2026-09-08_[cliente]_INFORME.md
```

### PASO 4: Convertir a PDF (5 min)

**Opción A: Online (más rápido)**
1. Abrir https://www.markdowntopdf.com/
2. Pegar contenido del .md
3. Descargar PDF

**Opción B: Google Docs**
1. Abrir Google Docs
2. Copiar/pegar contenido del .md
3. File → Download → PDF

**Opción C: Pandoc (si lo tienes instalado)**
```bash
pandoc auditorias/2026-09-08_[cliente]_INFORME.md -o informe_[cliente].pdf
```

### PASO 5: Personalizar Informe (5 min)

Antes de enviar, editar el informe:
1. Añadir tu contacto en sección CONTACTO
2. Revisar que tenga sentido para el cliente específico
3. Opcional: Añadir logo en header (si tienes)

### PASO 6: Entregar (5 min)

**Email de entrega**:

```
Asunto: Informe de Auditoría - [EMPRESA] - CONFIDENCIAL

Hola [Nombre],

Adjunto el informe de auditoría de seguridad para [dominio].

📊 RESUMEN:
- Puntuación: [X]/100
- Hallazgos críticos: [X]
- Hallazgos totales: [X]

🔴 URGENTE: [Mencionar 1-2 hallazgos más críticos]

El informe completo incluye:
✓ Descripción detallada de cada vulnerabilidad
✓ Impacto de negocio
✓ Recomendaciones de remediación
✓ Plan de acción priorizado

¿Tienes 15 minutos para una llamada rápida donde te explico 
los hallazgos más críticos?

Saludos,
[Tu Nombre]
[Tu Teléfono]
```

---

## 💰 UPSELL DESPUÉS DE ENTREGA

Una vez el cliente vea el informe (que tendrá hallazgos):

```
Hola [Nombre],

¿Revisaste el informe?

Como viste, hay [X] vulnerabilidades críticas.

Te ofrezco REMEDIACIÓN INMEDIATA:
✓ Soluciono todos los críticos en 48h
✓ Re-test completo
✓ Certificado de seguridad

Precio: 600€

Cuanto más esperes, más riesgo. ¿Empezamos hoy?
```

**Conversión esperada**: 1 de cada 4 clientes contrata remediación
**Ingresos adicionales**: +600€ por remediación

---

## 📊 TRACKING DEL DÍA

### Hoja de Excel simple:

| Hora | Prospecto | Contacto | Estado | Valor | Notas |
|------|-----------|----------|--------|-------|-------|
| 09:15 | Tienda X | email | pendiente | 350€ | seguir en 2h |
| 09:30 | Hotel Y | llamada | ✅ VENDIDO | 350€ | auditar 11:00 |
| 10:00 | Clínica Z | LinkedIn | rechazado | - | sin presupuesto |

**Meta mínima**: 3 ventas = 1050€
**Meta objetivo**: 4 ventas = 1400€

---

## ⏰ TIMELINE HOY

```
09:00 ┃ ☕ Café + Verificar que todo funciona
09:15 ┃ 📞 Primera ronda: 30 llamadas
10:30 ┃ ✅ Primera auditoría vendida → EJECUTAR
11:30 ┃ 📧 Enviar informe Cliente 1
12:00 ┃ 📞 Segunda ronda: 20 llamadas + follow-ups
13:00 ┃ ✅ Segunda auditoría vendida → EJECUTAR
14:00 ┃ 🍽️ COMIDA + cobrar pendientes
15:00 ┃ 📧 Enviar informe Cliente 2
15:30 ┃ 📞 Tercera ronda: 20 llamadas
16:00 ┃ ✅ Tercera auditoría vendida → EJECUTAR
17:00 ┃ 📧 Enviar informe Cliente 3
17:30 ┃ 💰 Cobrar + Follow-ups finales
18:00 ┃ 🎉 OBJETIVO CUMPLIDO: 1050-1400€
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### "El script no funciona"
```bash
# Reinstalar dependencias
cd ~/ARGUS
rm -rf node_modules
pnpm install
pnpm build
```

### "No tengo pandoc para PDF"
Usa conversión online: https://www.markdowntopdf.com/

### "El cliente quiere factura"
Prepara plantilla simple en Excel:
- Tu datos (nombre, NIF, dirección)
- Cliente (nombre, NIF, dirección)
- Concepto: "Auditoría de seguridad web"
- Importe: 350€
- IVA: 73.50€ (21%)
- Total: 423.50€

### "El cliente pide referencias"
```
"Esta es una operación nueva, por eso el precio de lanzamiento.

Puedo ofrecerte:
1. Auditoría demo GRATIS (10 min, 3 checks)
2. Pago después de entregar el informe (si te gusta)
3. Garantía 100% devolución si no encuentro nada útil

¿Cuál prefieres?"
```

---

## 🎯 OBJECIONES Y RESPUESTAS

### "Es caro"
"Es el 0.5% del coste promedio de una brecha de seguridad (60,000€). Piénsalo como un seguro de 350€."

### "No tenemos tiempo"
"Por eso es perfecto. Solo necesito tu dominio. Yo hago todo el trabajo. Tú solo lees el informe."

### "Ya tenemos seguridad"
"Perfecto. Esta auditoría te dará la tranquilidad de confirmarlo. El 70% de sitios tienen al menos 1 vulnerabilidad crítica."

### "Necesito pensarlo"
"Claro. Te hago una auditoría rápida GRATIS (5 min) y te muestro si hay algo urgente. Sin compromiso."

---

## ✅ CHECKLIST PRE-SALIDA

Antes de empezar a llamar, verifica que tienes:

- [ ] ARGUS instalado y funcionando
- [ ] Scripts de auditoría e informe listos
- [ ] Lista de 100 prospectos preparada
- [ ] Email/WhatsApp templates listos para copiar/pegar
- [ ] Método de pago configurado (Bizum/PayPal/Banco)
- [ ] Propuesta comercial personalizada con tu contacto
- [ ] Contrato simple con tus datos
- [ ] Forma de convertir MD a PDF
- [ ] Café ☕

---

## 💪 MENTALIDAD

**Recuerda**:
- Cada "NO" te acerca a un "SÍ"
- Solo necesitas 3-4 clientes de 100 contactos = 3-4% conversión (fácil)
- El valor que ofreces es real: proteges sus negocios
- Precio justo: 350€ es barato para lo que entregas
- Tú eres el experto: proyecta confianza

**Mantra del día**: 
*"Solo necesito 3 SÍes. Voy a hacer 100 intentos. Esto es matemáticas, no suerte."*

---

## 🚀 ¡EMPIEZA YA!

```bash
# 1. Café
# 2. Abrir terminal
cd ~/ARGUS

# 3. Verificar
pnpm build

# 4. Primera prueba
node scripts/auditar-cliente.js https://example.com demo

# 5. Abrir lista de prospectos
# 6. LLAMAR AL PRIMERO

¡VAMOS! 💪
```

---

**¿Dudas? ¿Bloqueado?**

Escribe aquí y te ayudo en tiempo real.

**¡SUERTE! 🍀**
