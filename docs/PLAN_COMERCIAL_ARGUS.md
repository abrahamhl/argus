# 💰 PLAN COMERCIAL ARGUS - MONETIZACIÓN INMEDIATA

**Fecha:** 2026-09-08  
**Equipo:** Abraham (Operaciones), Pola (Ventas España), Violeta (Ventas España)  
**Objetivo:** Generar primeros 3.000€ en 30 días

---

## 🎯 MODELO DE NEGOCIO

**SERVICIO:** Auditoría de Seguridad Web + Remediación

**CLIENTE IDEAL:**
- PYMEs españolas con sitio web (restaurantes, hoteles, tiendas online, despachos, clínicas)
- 10-50 empleados
- Presupuesto 500-2.000€/mes en servicios externos
- Preocupados por: imagen profesional, cumplimiento legal, seguridad clientes

**PROPUESTA DE VALOR:**
> "Descubrimos problemas de seguridad en su sitio web que ahuyentan clientes y pueden causarle multas. Los arreglamos en 48h."

---

## 💶 PRECIOS (Mercado Español)

### Paquete 1: AUDITORÍA INICIAL (Lead Generation)
**Precio:** GRATIS  
**Duración:** 24h  
**Entregable:** Reporte PDF de 2 páginas con problemas encontrados  
**Objetivo:** Generar confianza y descubrir necesidades

### Paquete 2: REPORTE COMPLETO
**Precio:** 150€  
**Duración:** 48h  
**Entregable:** Reporte PDF profesional de 8-10 páginas  
**Incluye:**
- Análisis de seguridad HTTP completo
- Análisis de email (SPF, DMARC, CAA)
- Priorización de problemas
- Recomendaciones específicas

### Paquete 3: REMEDIACIÓN BÁSICA
**Precio:** 300€ por problema  
**Duración:** 3-5 días laborables  
**Entregable:** Problema resuelto + Reporte de Prueba (PROOF)  
**Ejemplos:**
- Instalar HSTS: 250€
- Configurar SPF/DMARC: 350€
- Implementar Content-Security-Policy: 400€

### Paquete 4: PROTECCIÓN COMPLETA (BESTSELLER)
**Precio:** 890€  
**Duración:** 7 días laborables  
**Incluye:**
- Auditoría completa
- Corrección de TODOS los problemas detectados
- Reporte Before/After con prueba criptográfica
- Garantía: si vuelve a fallar en 30 días, lo arreglamos gratis

**PRECIO REAL AL CLIENTE:** 890€  
**COMISIÓN POLA/VIOLETA:** 180€ (20%)  
**COSTO OPERACIÓN:** 50€ (hosting/herramientas)  
**BENEFICIO ABRAHAM:** 660€

---

## 🎬 WORKFLOW OPERACIONAL

### PASO 1: Pola/Violeta hacen prospección (España)

**Dónde:**
- Polígonos industriales (visita en frío)
- Eventos de networking / Ferias comerciales
- LinkedIn (mensaje directo a dueños de PYME)
- Referidos (cliente satisfecho → 3 contactos)

**Pitch de 60 segundos:**
> "Hola, soy [Pola/Violeta]. Ayudamos a empresas como la suya a proteger su sitio web. Hemos detectado que muchas webs en [ciudad] tienen problemas de seguridad que Google penaliza y que pueden costarles multas de hasta 20.000€.
>
> ¿Le gustaría que revisáramos su web GRATIS? Le entregamos un informe en 24h mostrándole exactamente qué está fallando. Sin compromiso.
>
> Solo necesito el nombre de su web."

**Si dice SÍ:**
1. Apuntar: Nombre contacto, teléfono, email, URL del sitio
2. Enviar a Abraham vía WhatsApp: "NUEVA AUDITORÍA: empresa.com - Contacto: Juan (tel) - Prometí entrega mañana"
3. Abraham confirma: "OK, en 24h tienes el informe"

**Si dice NO:**
- "Entiendo. ¿Conoce algún colega que sí estaría interesado? Le doy una tarjeta por si acaso."
- Dejar tarjeta y seguir. NO insistir.

**Meta diaria:** 10 conversaciones → 2 auditorías gratuitas

---

### PASO 2: Abraham ejecuta auditoría

**Cuando recibe:** "NUEVA AUDITORÍA: empresa.com"

**Acción (10 minutos):**
```bash
# En Windows (tu PC principal)
cd C:\Users\2fabr\ARGUS
node apps/console/dist/index.js live

# Cuando pregunte TARGET, escribir:
https://empresa.com

# Esperar 30 segundos → Se genera reporte
```

**Generar HTML del reporte:**
```bash
# Crear archivo reporte.html con los resultados
# (Instrucciones técnicas detalladas en sección OPERACIONES)
```

**Guardar como PDF:**
1. Abrir `reporte.html` en Chrome
2. Ctrl+P (Imprimir)
3. "Guardar como PDF"
4. Nombrar: `Informe_Seguridad_[EMPRESA]_[FECHA].pdf`

**Enviar a Pola/Violeta:**
WhatsApp: "Aquí tienes el informe de EMPRESA. Encontré [X] problemas. El más grave es [PROBLEMA]. Precio para arreglarlo todo: 890€. Preséntalo mañana."

**Tiempo total:** 10-15 minutos

---

### PASO 3: Pola/Violeta presentan informe

**Cómo presentar (presencial o Zoom):**

1. **Mostrar el PDF en tablet/portátil**

2. **Introducción (30 seg):**
> "Aquí está su informe. Hemos analizado [URL] y encontrado [X] problemas de seguridad."

3. **Mostrar los problemas (2 min):**
> "Este es el más grave: [PROBLEMA]. Esto significa que [CONSECUENCIA CLIENTE]:
> - Puede hacer que Google baje su posición en búsquedas
> - Los navegadores pueden marcar su web como 'No segura'
> - Puede recibir multas de protección de datos"

4. **Mostrar la solución (1 min):**
> "La buena noticia es que tiene solución. Podemos arreglarlo todo en 7 días por 890€. Incluye garantía de 30 días."

5. **Cierre (30 seg):**
> "¿Quiere que lo arreglemos? Necesito una señal de 250€ para empezar hoy. El resto cuando esté terminado."

**Si dice SÍ:**
- WhatsApp a Abraham: "VENTA: EMPRESA - Paquete Completo 890€ - Señal recibida 250€ - Cliente quiere empezar YA"
- Recoger datos de facturación
- Dar recibo de la señal

**Si dice "Déjame pensarlo":**
- "Perfecto. Le dejo el informe. ¿Cuándo quiere que vuelva a hablar con usted? ¿El viernes?"
- Agendar follow-up

**Si dice "Es muy caro":**
- "Entiendo. Podemos empezar solo con lo más grave: [PROBLEMA] por 300€. ¿Le parece bien?"

**Meta semanal:** 10 presentaciones → 3 ventas (conversión 30%)

---

### PASO 4: Abraham ejecuta remediación

**Cuando recibe:** "VENTA: EMPRESA - Paquete Completo"

**Días 1-2: Análisis profundo**
- Ejecutar auditoría completa
- Identificar TODOS los problemas
- Crear plan de remediación
- Contactar con hosting/webmaster del cliente si es necesario

**Días 3-5: Implementación**
- Configurar headers de seguridad (HSTS, CSP, etc.)
- Configurar DNS (SPF, DMARC, CAA)
- Verificar que todo funciona

**Día 6: Retest**
- Volver a ejecutar ARGUS
- Generar PROOF (Before/After)
- Crear reporte final

**Día 7: Entrega**
- Enviar a Pola/Violeta:
  - Reporte Final PDF (con PROOF)
  - Email para el cliente explicando qué se hizo
- WhatsApp: "Trabajo terminado. Empresa ya está protegida. Puedes cobrar los 640€ restantes."

---

## 📱 HERRAMIENTAS NECESARIAS

### Para Pola y Violeta:
- **Smartphone** (WhatsApp, llamadas, email)
- **Tablet o portátil** (mostrar informes PDF)
- **Tarjetas de visita** (100 unidades = 20€)
- **Carpeta con informes de ejemplo** (impresos)

### Para Abraham:
- **PC Windows** (ya lo tienes)
- **Chromebook** (como backup)
- **ARGUS instalado** (ya está)
- **Chrome** (para generar PDFs)

---

## 💳 COBROS Y PAGOS

### Método de cobro (Pola/Violeta):
1. **Señal (250€):** Bizum, transferencia o efectivo
2. **Resto (640€):** Al entregar trabajo, mismo método

### Reparto:
**PAQUETE COMPLETO (890€):**
- Pola/Violeta: 180€ (20% comisión)
- Abraham: 660€ (operaciones + desarrollo)
- Gastos: 50€ (hosting, herramientas)

**REMEDIACIÓN INDIVIDUAL (300€):**
- Pola/Violeta: 60€ (20%)
- Abraham: 220€
- Gastos: 20€

**Pago a Pola/Violeta:** Al final de cada semana, Abraham transfiere comisiones acumuladas.

---

## 📊 PROYECCIÓN DE INGRESOS (30 DÍAS)

### Escenario Conservador:
- **Semana 1:** 2 ventas × 890€ = 1.780€
- **Semana 2:** 3 ventas × 890€ = 2.670€
- **Semana 3:** 4 ventas × 890€ = 3.560€
- **Semana 4:** 3 ventas × 890€ = 2.670€

**TOTAL MES 1:** 10.680€ de facturación

**Reparto:**
- **Pola comisiones:** 1.070€ (10% total)
- **Violeta comisiones:** 1.070€ (10% total)
- **Abraham neto:** 6.600€ (62%)
- **Gastos operación:** 500€
- **Reinversión:** 1.440€

### Escenario Realista (más conservador):
- **Mes 1:** 6 ventas × 890€ = 5.340€
  - Pola/Violeta: 540€ cada una
  - Abraham: 3.300€
  
**Suficiente para vivir y crecer.**

---

## 🎓 FORMACIÓN PARA POLA Y VIOLETA (2 HORAS)

### Sesión 1: ¿Qué es ARGUS? (30 min)
**Abraham explica:**
- "ARGUS analiza sitios web buscando problemas de seguridad"
- "Como un inspector de edificios, pero para webs"
- "Encontramos problemas que Google penaliza y que pueden costar multas"
- **Mostrar demo:** Ejecutar ARGUS en vivo, generar informe

### Sesión 2: Cómo vender (60 min)
**Roleplay:**
- Abraham hace de cliente difícil
- Pola/Violeta practican el pitch
- Repetir 10 veces hasta que salga natural

**Objeciones comunes:**
1. "No tengo presupuesto" → "Entiendo. ¿Y si empezamos solo con lo más urgente por 300€?"
2. "Mi webmaster ya se encarga" → "Perfecto. Dele este informe para que él lo arregle. Gratis."
3. "No me interesa" → "Sin problema. ¿Conoce a alguien que sí pueda estar interesado?"

### Sesión 3: Herramientas y procesos (30 min)
- Cómo pedir auditoría a Abraham (WhatsApp)
- Cómo presentar el PDF
- Cómo cobrar la señal
- Cómo hacer follow-up

**Material a entregar:**
- Script del pitch (en papel)
- Tarjetas de visita
- 3 informes de ejemplo (impresos)
- Lista de objeciones y respuestas

---

## 🚀 PLAN DE LANZAMIENTO (SEMANA 1)

### Lunes:
- **Abraham:** Generar 5 informes de ejemplo (webs de empresas reales españolas)
- **Abraham:** Imprimir tarjetas de visita (100 ud online express)
- **Abraham:** Sesión de formación con Pola y Violeta (2h vía Zoom)

### Martes:
- **Pola:** Visitar polígono industrial → 10 contactos
- **Violeta:** Visitar centro comercial → 10 contactos
- **Meta:** 2 auditorías gratuitas conseguidas

### Miércoles:
- **Abraham:** Ejecutar las 2 auditorías de ayer
- **Pola/Violeta:** Presentar informes a los 2 clientes
- **Meta:** 1 venta cerrada

### Jueves:
- **Abraham:** Si hay venta, empezar remediación
- **Pola/Violeta:** Más prospección → 10 contactos nuevos

### Viernes:
- **Reunión de equipo (30 min):**
  - ¿Cuántos contactos?
  - ¿Cuántas auditorías?
  - ¿Cuántas ventas?
  - ¿Qué funcionó? ¿Qué no?

### Objetivo Semana 1:
- 40 contactos
- 8 auditorías gratuitas
- 2 ventas cerradas (1.780€)

---

## 💡 CONSEJOS PARA POLA Y VIOLETA

### DO (Hacer):
✅ Sonreír y ser amables  
✅ Escuchar más que hablar  
✅ Hacer preguntas: "¿Cuántos clientes le llegan por la web?"  
✅ Hablar de CONSECUENCIAS (multas, pérdida clientes, Google)  
✅ Ofrecer auditoría gratis sin presión  
✅ Seguimiento a los 3 días si no contestan  
✅ Pedir referidos siempre  

### DON'T (No hacer):
❌ Hablar de "tecnología" o "código"  
❌ Prometer fechas imposibles  
❌ Bajar el precio sin consultar a Abraham  
❌ Ser insistentes o agresivos  
❌ Hablar mal de su webmaster actual  
❌ Dar detalles técnicos que no entienden  

**REGLA DE ORO:** Si no sabes qué responder, di: "Excelente pregunta. Déjame consultarlo con mi equipo técnico y te confirmo en 1 hora."

---

## 📞 CONTACTOS DE EMERGENCIA

**Abraham (Operaciones/Técnico):**
- WhatsApp: [TU NÚMERO]
- Email: [TU EMAIL]
- Horario: Lun-Vie 9h-20h, Sáb 10h-14h

**Pola (Ventas España):**
- WhatsApp: [NÚMERO POLA]

**Violeta (Ventas España):**
- WhatsApp: [NÚMERO VIOLETA]

**Grupo WhatsApp:** "ARGUS Equipo" (los 3)

---

## 🎯 MÉTRICAS A SEGUIR

**Semanales:**
- Contactos realizados
- Auditorías gratuitas entregadas
- Presentaciones hechas
- Ventas cerradas
- Ingresos generados

**Mensuales:**
- Tasa de conversión (contactos → ventas)
- Ticket medio
- Clientes recurrentes
- Referidos generados

**Excel compartido en Google Drive:** [CREAR]

---

## ❓ PREGUNTAS FRECUENTES

### "¿Necesito saber de programación?"
**NO.** Solo necesitas:
- Saber hablar con empresarios
- Saber presentar un PDF
- Enviar WhatsApp a Abraham
- Cobrar dinero

### "¿Qué pasa si el cliente pregunta algo técnico?"
"Excelente pregunta. Mi compañero técnico Abraham le puede explicar eso mejor que yo. ¿Le importa si le paso su contacto?"

### "¿Y si no consigo ventas?"
Primera semana sin ventas = NORMAL.  
Segunda semana sin ventas = revisamos el pitch.  
Tercer semana sin ventas = cambiamos estrategia.

**No hay presión.** Estamos aprendiendo juntos.

### "¿Cuánto puedo ganar?"
- **Mes 1 (aprendiendo):** 500-1.000€
- **Mes 2-3 (rodado):** 1.500-2.500€
- **Mes 4+ (máquina):** 3.000-5.000€

### "¿Tengo que hacer ventas todos los días?"
**NO.** Puedes trabajar a tu ritmo:
- Tiempo completo: 5 días/semana
- Media jornada: 3 días/semana
- Fines de semana: sábados eventos

Tú decides tu horario.

---

## 🎓 MATERIALES DE APOYO

**A CREAR ESTA SEMANA:**
- [x] Pitch script (1 página)
- [ ] Tarjetas de visita
- [x] Informes de ejemplo (3)
- [ ] Presentación para clientes (PDF, 10 slides)
- [ ] Plantilla de email de seguimiento
- [ ] Video explicativo (3 min) para enviar por WhatsApp

**A CREAR MES 2:**
- Landing page: www.argus-seguridad.es
- Vídeo testimonial de primer cliente
- Caso de estudio (Before/After)
- Presencia en redes sociales

---

## 🔥 SIGUIENTE ACCIÓN (AHORA MISMO)

### Abraham:
1. ✅ Generar este documento
2. [ ] Enviar a Pola y Violeta
3. [ ] Agendar Zoom de formación (2h)
4. [ ] Generar 5 informes de ejemplo de empresas españolas
5. [ ] Pedir tarjetas de visita online (entrega 48h)

### Pola y Violeta:
1. [ ] Leer este documento completo (30 min)
2. [ ] Zoom con Abraham (2h formación)
3. [ ] Practicar el pitch (con amigo/familiar)
4. [ ] Hacer lista de 20 empresas objetivo en tu ciudad
5. [ ] Martes: Salir a la calle

---

**PRIMERA VENTA = CELEBRACIÓN 🎉**

Cuando cierres la primera venta, Pola/Violeta tienen bonus extra de 50€.

---

**PREPARADO POR:** Abraham Haddioui  
**PARA:** Equipo Comercial ARGUS  
**FECHA:** 2026-09-08  
**VERSIÓN:** 1.0 - Plan de Lanzamiento  
**CONFIDENCIAL:** Solo equipo ARGUS

**PRÓXIMO PASO:** Zoom de formación con Pola y Violeta
