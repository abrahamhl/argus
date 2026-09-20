(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function r(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(a){if(a.ep)return;a.ep=!0;const s=r(a);fetch(a.href,s)}})();const E=[{id:"aux-dns-01",code:"AUX-DNS-01",title:{nl:"E-mail Authenticatie & Domeinbescherming (SPF / DMARC / CAA)",en:"Email Authentication & Domain Protection (SPF / DMARC / CAA)",es:"Autenticación de Email y Protección de Dominio (SPF / DMARC / CAA)"},description:{nl:"Volledige inrichting van strikte SPF-records (-all), DMARC-handhavingsbeleid (p=reject of p=quarantine) en CAA-records om e-mail spoofing en factuurfraude namens uw domein tegen te gaan.",en:"Complete configuration of strict SPF records (-all), DMARC enforcement (p=reject or quarantine), and CAA records to prevent email spoofing and invoice fraud on behalf of your domain.",es:"Configuración integral de registros SPF estrictos (-all), política DMARC (p=reject) y CAA para erradicar suplantación de identidad y fraude de facturación."},deliverables:{nl:["Strikt SPF DNS-record","DMARC beleid met rapportage","CAA records voor geautoriseerde CAs","Verificatietest na 48 uur"],en:["Strict SPF DNS record","DMARC policy with reporting","CAA records for authorized CAs","Verification test after 48h"],es:["Registro SPF estricto","Política DMARC con reportes","Registros CAA autorizados","Test de verificación tras 48h"]},indicativePriceEur:495,estimatedHours:"3-5 uur"},{id:"aux-tls-01",code:"AUX-TLS-01",title:{nl:"Transportbeveiliging & HSTS Verharding",en:"Modern Transport Security & HSTS Hardening",es:"Seguridad en Transporte y Endurecimiento HSTS"},description:{nl:"Uitschakelen van verouderde TLS-protocollen (TLS 1.0/1.1), veilige cipher suites en implementatie van HTTP Strict Transport Security (HSTS) met long max-age en includeSubDomains.",en:"Deprecation of outdated TLS versions (TLS 1.0/1.1), modern cipher configuration, and HTTP Strict Transport Security (HSTS) implementation with includeSubDomains.",es:"Desactivación de TLS obsoletos, configuración de ciphers modernos e implementación de HSTS para forzar conexiones cifradas seguras."},deliverables:{nl:["Webserver TLS configuratie","HSTS header implementatie","A+ score op SSL Labs / internet.nl","Retest verificatierapport"],en:["Web server TLS configuration","HSTS header deployment","A+ score verification","Retest verification report"],es:["Configuración TLS de servidor","Implementación de cabecera HSTS","Calificación A+ verificada","Reporte criptográfico de retest"]},indicativePriceEur:395,estimatedHours:"2-4 uur"},{id:"aux-sec-01",code:"AUX-SEC-01",title:{nl:"Beveiligingsheaders & Browserverharding (CSP / Anti-Clickjacking)",en:"Security Headers & Browser Hardening (CSP / Anti-Clickjacking)",es:"Cabeceras de Seguridad y Protección de Navegador (CSP)"},description:{nl:"Inrichting van Content-Security-Policy (CSP), X-Content-Type-Options: nosniff, Referrer-Policy en frame protection om cross-site scripting (XSS), clickjacking en data-exfiltratie tegen te gaan.",en:"Configuration of Content-Security-Policy (CSP), X-Content-Type-Options: nosniff, Referrer-Policy, and frame protection to prevent XSS and clickjacking.",es:"Configuración de CSP, X-Content-Type-Options, Referrer-Policy y protección contra clickjacking para mitigar XSS e inyección."},deliverables:{nl:["Maatwerk CSP header","X-Content-Type-Options: nosniff","Referrer-Policy & Frame-Options","Compatibiliteitstest met website scripts"],en:["Tailored CSP header","X-Content-Type-Options nosniff","Referrer & Frame policies","Script compatibility test"],es:["Cabecera CSP a medida","Protección nosniff","Políticas de Frame y Referrer","Test de compatibilidad"]},indicativePriceEur:495,estimatedHours:"3-6 uur"},{id:"aux-txt-01",code:"AUX-TXT-01",title:{nl:"Coordinated Vulnerability Disclosure (RFC 9116 security.txt)",en:"Coordinated Vulnerability Disclosure & security.txt (RFC 9116)",es:"Divulgación Coordinada de Vulnerabilidades (RFC 9116 security.txt)"},description:{nl:"Opstellen en publiceren van een formeel CVD-beleid en conform RFC 9116 beveiligingsbestand (/.well-known/security.txt) voor verantwoorde melding van beveiligingslekken.",en:"Creation and deployment of formal CVD policy and RFC 9116 security.txt file for responsible vulnerability reporting.",es:"Elaboración y publicación de archivo security.txt estandarizado bajo RFC 9116 y política formal de divulgación coordinada."},deliverables:{nl:["security.txt bestand","CVD beleidsdocument","OpenPGP sleutelkoppeling optioneel"],en:["security.txt file deployment","CVD policy documentation","PGP key linkage optional"],es:["Despliegue de security.txt","Documento de política CVD","Firma criptográfica PGP"]},indicativePriceEur:195,estimatedHours:"1-2 uur"},{id:"aux-fnd-01",code:"AUX-FND-01",title:{nl:"Digitale Voetafdruk & Aanvalsoppervlak Inventarisatie",en:"Digital Footprint & Attack Surface Discovery",es:"Descubrimiento de Huella Digital y Superficie de Ataque"},description:{nl:"Volledige passieve mapping van publieke subdomeinen, mailservers, clouddiensten en verouderde systemen behorend bij uw organisatie.",en:"Comprehensive passive mapping of public subdomains, mail infrastructure, and cloud assets.",es:"Mapeo pasivo integral de subdominios, infraestructura de correo y activos expuestos en la nube."},deliverables:{nl:["Inventarisatierapport publieke activa","Identificatie van schaduw-IT","Risicoprioritering"],en:["Public asset inventory report","Shadow IT identification","Risk prioritization"],es:["Inventario de activos públicos","Detección de Shadow IT","Priorización de riesgo"]},indicativePriceEur:695,estimatedHours:"4-6 uur"},{id:"aux-aud-01",code:"AUX-AUD-01",title:{nl:"Volledige Beveiligings- & Compliance Audit (NIS2 / BIO / internet.nl)",en:"Full-Surface Security & Compliance Audit (NIS2 / BIO / internet.nl)",es:"Auditoría Integral de Seguridad y Cumplimiento (NIS2 / BIO)"},description:{nl:"Diepgaande technische en organisatorische nulmeting volgens Nederlandse standaarden (BIO, internet.nl en NIS2 toeleveranciersverplichtingen) met direct uitvoerbaar stappenplan.",en:"In-depth technical posture assessment aligned with Dutch standards (BIO, internet.nl, NIS2 supply chain duties) with turnkey remediation roadmap.",es:"Evaluación técnica profunda alineada con estándares holandeses y directiva NIS2 con hoja de ruta de remediación ejecutable."},deliverables:{nl:["Directierapportage (in begrijpelijk Nederlands)","Technisch engineeringsdossier","Prioriteitenmatrix met vaste prijzen","1 uur adviesgesprek"],en:["Executive business report","Technical engineering dossier","Fixed-price priority matrix","1h advisory session"],es:["Informe ejecutivo de negocio","Dossier técnico de ingeniería","Matriz de precios fijos","Sesión de asesoría de 1h"]},indicativePriceEur:1195,estimatedHours:"8-12 uur"},{id:"aux-ret-01",code:"AUX-RET-01",title:{nl:"Remediatieverificatie & Cryptografisch Bewijscertificaat",en:"Remediation Retest & Cryptographic Proof Certificate",es:"Certificado Criptográfico de Prueba de Remediación"},description:{nl:"Onafhankelijke herbeoordeling na doorgevoerde verbeteringen met wiskundig bewijs (SHA-256 voor/na hashes) voor toezichthouders, accountants of opdrachtgevers.",en:"Independent verification retest following fixes, emitting mathematical proof (SHA-256 before/after hashes) for regulators and clients.",es:"Retest independiente con verificación matemática antes/después para aseguradoras, clientes corporativos y auditores."},deliverables:{nl:["ARGUS Proof Certificaat (JSON + PDF)","Cryptografische SHA-256 audit trail","Toelichting voor NIS2 ketenverantwoording"],en:["ARGUS Proof Certificate","SHA-256 cryptographic audit trail","NIS2 supply chain justification"],es:["Certificado de Prueba ARGUS","Trazabilidad criptográfica SHA-256","Documento de justificación NIS2"]},indicativePriceEur:295,estimatedHours:"2 uur"},{id:"aux-mnt-01",code:"AUX-MNT-01",title:{nl:"Continue Bewaking & Kwartaal-Validatie (Quarterly Retainer)",en:"Continuous Control Plane Monitoring (Quarterly Retainer)",es:"Monitoreo Continuo y Validación Trimestral (Retainer)"},description:{nl:"Viermaal per jaar automatische controle van DNS, TLS, headers en configuraties. Vroegtijdige signalering van verloop of configuratiefouten.",en:"Automated quarterly posture validation for DNS, TLS, headers and hygiene drift. Early warning of certificate expirations or misconfigurations.",es:"Validación trimestral automatizada de postura para prevenir degradaciones en DNS, TLS o expiraciones de certificados."},deliverables:{nl:["Kwartaalrapportage met trendanalyse","Directe alert bij regressie","Inclusief 1 herstel-uur per kwartaal"],en:["Quarterly trend report","Immediate regression alerts","Includes 1 engineering hour/quarter"],es:["Reporte trimestral de tendencias","Alertas de regresión inmediatas","Incluye 1 hora de soporte"]},indicativePriceEur:295,estimatedHours:"Doorlopend",recurring:!0},{id:"aux-mnt-02",code:"AUX-MNT-02",title:{nl:"Maandelijkse Postuur Monitoring & Alarmering",en:"Monthly Control Plane Monitoring & Alerting",es:"Monitoreo Mensual de Postura y Alertas"},description:{nl:"Maandelijkse controle van publieke oppervlakte en automatische bewaking van e-mailveiligheid en webverharding.",en:"Monthly automated posture checks and regression alerts.",es:"Chequeos mensuales automatizados y alertas inmediatas ante desconfiguraciones."},deliverables:{nl:["Maandelijkse statusmail","Automatische regressiedetectie","Historische bewijsopslag"],en:["Monthly status email","Automated regression detection","Historical proof ledger"],es:["Email mensual de estado","Detección automática de regresiones","Historial criptográfico"]},indicativePriceEur:95,estimatedHours:"Doorlopend",recurring:!0}],f=[{id:"fnd_1c6108a004d2",ruleId:"rule-http-missing-hsts",title:"Missing HTTP Strict Transport Security (HSTS)",severity:"MEDIUM",category:"HTTP",evidenceIds:["ev_http_get_slash"],explanation:{observed:"HTTP response headers do not include a Strict-Transport-Security header.",supports:"ev_http_get_slash",whyItMatters:"Browsers may attempt unencrypted HTTP connections on first visit, enabling SSL stripping or man-in-the-middle interception on public Wi-Fi networks.",limitations:"Passive observation does not inspect internal redirects or HSTS preload list membership."},clientCopy:{nl:{title:"Geen automatische beveiligde verbinding (HSTS ontbreekt)",explanation:"De website dwingt bezoekers niet automatisch af om altijd de versleutelde (HTTPS) verbinding te gebruiken. Hierdoor kunnen kwaadwillenden op openbare wifi-netwerken het verkeer onderscheppen.",action:"Configureer de HSTS-header op de webserver zodat browsers altijd en uitsluitend versleuteld communiceren."},en:{title:"Missing HTTP Strict Transport Security (HSTS)",explanation:"The website does not mandate encrypted HTTPS connections. Attackers on public Wi-Fi could intercept traffic.",action:"Deploy HSTS header with max-age=31536000 and includeSubDomains."},es:{title:"Falta cabecera HSTS (Strict Transport Security)",explanation:"El sitio no obliga a los navegadores a usar siempre HTTPS, permitiendo posibles ataques de intercepción.",action:"Implementar cabecera HSTS en el servidor web."}},auxServiceId:"aux-tls-01",status:"ACTIVE"},{id:"fnd_b5c8825776b7",ruleId:"rule-http-missing-csp",title:"Missing Content Security Policy (CSP)",severity:"MEDIUM",category:"HTTP",evidenceIds:["ev_http_get_slash"],explanation:{observed:"HTTP response headers do not contain a Content-Security-Policy header.",supports:"ev_http_get_slash",whyItMatters:"Without a Content Security Policy, browsers will execute any script injected through third-party widgets, vulnerabilities, or tag managers, increasing cross-site scripting (XSS) impact.",limitations:"Passive inspection detects absence of header; it cannot determine whether inline scripts or third-party tags are present in the DOM."},clientCopy:{nl:{title:"Ontbrekend Content Security Policy (CSP)",explanation:"Er is geen digitaal reglement dat de browser vertelt welke externe scripts en bronnen veilig geladen mogen worden. Dit vergroot het risico op datadiefstal en kwaadaardige scripts.",action:"Implementeer een restrictief Content-Security-Policy beleid afgestemd op de gebruikte modules."},en:{title:"Missing Content Security Policy (CSP)",explanation:"No policy restricts which third-party scripts and resources can load, amplifying cross-site scripting risks.",action:"Deploy tailored Content-Security-Policy header."},es:{title:"Falta Content Security Policy (CSP)",explanation:"El navegador no tiene restricciones sobre scripts de terceros, aumentando el riesgo de XSS y robo de datos.",action:"Configurar cabecera Content-Security-Policy."}},auxServiceId:"aux-sec-01",status:"ACTIVE"},{id:"fnd_3a1dcf526400",ruleId:"rule-dns-weak-spf",title:"Weak SPF Record (~all SoftFail)",severity:"LOW",category:"EMAIL",evidenceIds:["ev_dns_txt"],explanation:{observed:"DNS TXT record for SPF specifies ~all (SoftFail) instead of -all (HardFail).",supports:"ev_dns_txt",whyItMatters:"A softfail directive allows unauthorized mail servers to send email purporting to come from this domain with lower rejection likelihood at recipient gateways, aiding spoofing and phishing.",limitations:"Passive DNS lookup does not verify email gateway reputation or DKIM selector configurations."},clientCopy:{nl:{title:"Verzacht SPF-beleid (~all i.p.v. -all)",explanation:'Het e-mailbeveiligingsbeleid (SPF) staat ingesteld op "SoftFail". Hierdoor worden e-mails die door onbevoegden namens uw domein worden verzonden vaak toch afgeleverd in plaats van direct geblokkeerd.',action:"Pas het SPF-record in het DNS aan naar strikte handhaving (-all)."},en:{title:"Weak SPF Record (~all SoftFail)",explanation:"Email SPF policy is set to softfail, allowing unauthorized senders higher chances of delivery.",action:"Update SPF record to strict enforcement (-all)."},es:{title:"Registro SPF Débil (~all SoftFail)",explanation:"La política SPF permite que remitentes no autorizados tengan mayor probabilidad de entrega.",action:"Ajustar SPF a rechazo estricto (-all)."}},auxServiceId:"aux-dns-01",status:"ACTIVE"},{id:"fnd_37379885907a",ruleId:"rule-dns-dmarc-p-none",title:"DMARC Policy Set to None (p=none)",severity:"LOW",category:"EMAIL",evidenceIds:["ev_dns_dmarc"],explanation:{observed:"DMARC TXT record specifies p=none (monitoring only).",supports:"ev_dns_dmarc",whyItMatters:"A policy of p=none monitors spoofing attempts but does not instruct recipient mail systems to reject or quarantine fraudulent emails sent using your brand name.",limitations:"Does not inspect DMARC aggregate report delivery endpoints (rua/ruf)."},clientCopy:{nl:{title:"DMARC staat op Alleen Monitoren (p=none)",explanation:"Uw domein controleert wel op e-mailfraude, maar vraagt ontvangende mailservers nog niet om valse e-mails daadwerkelijk te weigeren. Factuurfraudeurs kunnen hier misbruik van maken.",action:"Migreer DMARC naar actief blokkeringsbeleid (p=quarantine of p=reject)."},en:{title:"DMARC Policy Set to None (p=none)",explanation:"Domain monitors spoofing but does not instruct mail servers to reject fraudulent emails.",action:"Upgrade DMARC policy to p=reject."},es:{title:"Política DMARC en Modo Monitor (p=none)",explanation:"No se instruye a los receptores a rechazar correos fraudulentos.",action:"Migrar política DMARC a p=reject."}},auxServiceId:"aux-dns-01",status:"ACTIVE"},{id:"fnd_217071cd9069",ruleId:"rule-http-missing-x-content-type-options",title:"Missing X-Content-Type-Options Header",severity:"LOW",category:"HTTP",evidenceIds:["ev_http_get_slash"],explanation:{observed:"HTTP response headers omit X-Content-Type-Options: nosniff.",supports:"ev_http_get_slash",whyItMatters:"Without nosniff, older or vulnerable browsers may MIME-sniff response content, executing non-executable files as HTML or JavaScript.",limitations:"Modern browsers have partial built-in sniffing protections; legacy client exposure remains."},clientCopy:{nl:{title:"Ontbrekende MIME-type bescherming (nosniff)",explanation:"De browser wordt niet expliciet verteld om het aangegeven bestandstype strict te respecteren, wat kan leiden tot onbedoelde scriptuitvoering.",action:"Voeg X-Content-Type-Options: nosniff toe aan de serverconfiguratie."},en:{title:"Missing X-Content-Type-Options Header",explanation:"Prevents MIME-sniffing vulnerabilities across browsers.",action:"Add X-Content-Type-Options: nosniff."},es:{title:"Falta cabecera X-Content-Type-Options",explanation:"Evita ataques de MIME sniffing en navegadores.",action:"Añadir X-Content-Type-Options: nosniff."}},auxServiceId:"aux-sec-01",status:"ACTIVE"},{id:"fnd_106240e1a287",ruleId:"rule-http-missing-referrer-policy",title:"Missing Referrer-Policy Header",severity:"LOW",category:"HTTP",evidenceIds:["ev_http_get_slash"],explanation:{observed:"HTTP response headers do not include a Referrer-Policy header.",supports:"ev_http_get_slash",whyItMatters:"Full URLs containing internal paths, tokens, or query parameters may be leaked to third-party external services when visitors click outbound links.",limitations:"Default browser referrer behavior applies; explicit header ensures consistent privacy posture."},clientCopy:{nl:{title:"Ontbrekend Verwijzingsbeleid (Referrer-Policy)",explanation:"Er is niet vastgelegd welke informatie over bezochte pagina's mag worden meegestuurd naar externe websites wanneer een bezoeker op een link klikt.",action:"Stel Referrer-Policy in op strict-origin-when-cross-origin."},en:{title:"Missing Referrer-Policy Header",explanation:"Sensitive URL parameters could leak to external third parties.",action:"Set Referrer-Policy: strict-origin-when-cross-origin."},es:{title:"Falta cabecera Referrer-Policy",explanation:"Parámetros sensibles de URL pueden filtrarse a terceros.",action:"Configurar Referrer-Policy: strict-origin-when-cross-origin."}},auxServiceId:"aux-sec-01",status:"ACTIVE"},{id:"fnd_3f1972f1e384",ruleId:"rule-http-missing-frame-protection",title:"Missing Frame Protection (Anti-Clickjacking)",severity:"LOW",category:"HTTP",evidenceIds:["ev_http_get_slash"],explanation:{observed:"HTTP headers lack X-Frame-Options or frame-ancestors CSP directive.",supports:"ev_http_get_slash",whyItMatters:"Malicious websites can embed this site in an invisible iframe to trick authenticated users into unauthorized clicks (clickjacking).",limitations:"If website intentionally supports framing (e.g. embeddable widgets), policy must be configured accordingly."},clientCopy:{nl:{title:"Ontbrekende Frame-bescherming (Anti-Clickjacking)",explanation:"De website kan door kwaadwillenden onzichtbaar worden ingebed in een andere website om bezoekers te misleiden tot het uitvoeren van onbedoelde acties.",action:"Voeg X-Frame-Options: SAMEORIGIN of CSP frame-ancestors 'self' toe."},en:{title:"Missing Frame Protection (Clickjacking)",explanation:"Site can be embedded in malicious iframes to trick users.",action:"Set X-Frame-Options: SAMEORIGIN or CSP frame-ancestors."},es:{title:"Falta Protección de Framing (Clickjacking)",explanation:"El sitio puede ser incrustado en iframes maliciosos.",action:"Configurar X-Frame-Options: SAMEORIGIN."}},auxServiceId:"aux-sec-01",status:"ACTIVE"}],S=[{id:"prf_01_hsts",findingId:"fnd_1c6108a004d2",ruleId:"rule-http-missing-hsts",status:"RESOLVED",rationale:"Retest observed Strict-Transport-Security: max-age=31536000; includeSubDomains. Rule rule-http-missing-hsts no longer flags.",baselineEvidenceSha:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",retestEvidenceSha:"84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391"},{id:"prf_02_csp",findingId:"fnd_b5c8825776b7",ruleId:"rule-http-missing-csp",status:"RESOLVED",rationale:"Retest observed Content-Security-Policy: default-src 'self'; frame-ancestors 'self'. Rule rule-http-missing-csp no longer flags.",baselineEvidenceSha:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",retestEvidenceSha:"9a77c3df95a6b0c45ef1394142fa9056d68f773415efb624fcf85cfb114d59bc"},{id:"prf_03_spf",findingId:"fnd_3a1dcf526400",ruleId:"rule-dns-weak-spf",status:"RESOLVED",rationale:'Retest observed TXT "v=spf1 include:_spf.google.com -all". Strict hardfail enforced.',baselineEvidenceSha:"f3911b306b998a4d4681643cb462ba94a5002a4bf7eeef043bbad6dc34a9b5f4",retestEvidenceSha:"11e4bf5b74681428389658faee685744cb9426ba8b056158223668352613d965"},{id:"prf_04_dmarc",findingId:"fnd_37379885907a",ruleId:"rule-dns-dmarc-p-none",status:"RESOLVED",rationale:'Retest observed TXT "v=DMARC1; p=reject; rua=mailto:dmarc@auxdesign.nl". Full enforcement verified.',baselineEvidenceSha:"c8077c570b74100b12bc1a80ad22be881b29a008c23fbf7e8ebaa22227d85348",retestEvidenceSha:"5684a0d9b4b045e0f7f329ea152bcfd4d8a57962451006509f6e148e6ef9be32"},{id:"prf_05_nosniff",findingId:"fnd_217071cd9069",ruleId:"rule-http-missing-x-content-type-options",status:"RESOLVED",rationale:"Retest observed X-Content-Type-Options: nosniff header present.",baselineEvidenceSha:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",retestEvidenceSha:"84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391"},{id:"prf_06_referrer",findingId:"fnd_106240e1a287",ruleId:"rule-http-missing-referrer-policy",status:"RESOLVED",rationale:"Retest observed Referrer-Policy: strict-origin-when-cross-origin header present.",baselineEvidenceSha:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",retestEvidenceSha:"84b2c89f537914f6b2bc194a08168bbd2fbe8e4b7b20464c8d37a2c074697391"},{id:"prf_07_frame",findingId:"fnd_3f1972f1e384",ruleId:"rule-http-missing-frame-protection",status:"RESOLVED",rationale:"Retest observed frame-ancestors 'self' in CSP and X-Frame-Options: SAMEORIGIN.",baselineEvidenceSha:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",retestEvidenceSha:"9a77c3df95a6b0c45ef1394142fa9056d68f773415efb624fcf85cfb114d59bc"}],y=[{id:"ev_dns_soa",collector:"collector-dns",type:"dns_records",target:"example-business.nl",sha256:"928e4693bf7c7a2bb34460f1ad9226cbcf74c8646b997e068e5ff41b44b92b67",timestamp:"2026-09-20T17:35:00.000Z",immutable:!0,rawSnippet:"SOA ns1.transip.nl hostmaster.transip.nl (2026092001 86400 7200 2419200 300)"},{id:"ev_dns_txt",collector:"collector-dns",type:"dns_records",target:"example-business.nl",sha256:"f3911b306b998a4d4681643cb462ba94a5002a4bf7eeef043bbad6dc34a9b5f4",timestamp:"2026-09-20T17:35:00.000Z",immutable:!0,rawSnippet:'TXT "v=spf1 include:_spf.google.com ~all"'},{id:"ev_dns_dmarc",collector:"collector-dns",type:"dns_records",target:"_dmarc.example-business.nl",sha256:"c8077c570b74100b12bc1a80ad22be881b29a008c23fbf7e8ebaa22227d85348",timestamp:"2026-09-20T17:35:00.000Z",immutable:!0,rawSnippet:'TXT "v=DMARC1; p=none; sp=none;"'},{id:"ev_tls_cert",collector:"collector-tls",type:"tls_handshake",target:"example-business.nl:443",sha256:"725ba94e75d4a96b30f80a424268e27c1a84f5533118cf23ad1ba75f7956a814",timestamp:"2026-09-20T17:35:01.000Z",immutable:!0,rawSnippet:"TLSv1.3 | TLS_AES_256_GCM_SHA384 | Valid until 2026-12-19 | Let's Encrypt"},{id:"ev_http_get_slash",collector:"collector-http",type:"http_response",target:"https://example-business.nl/",sha256:"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",timestamp:"2026-09-20T17:35:02.000Z",immutable:!0,rawSnippet:`HTTP/2 200 OK
Server: nginx
Content-Type: text/html; charset=UTF-8
(Missing HSTS, CSP, nosniff, Referrer-Policy)`},{id:"ev_sec_txt",collector:"collector-security-txt",type:"security_txt",target:"https://example-business.nl/.well-known/security.txt",sha256:"a1278b7a66c4335c02ef497cf879e6129cf8fa7270adff3b6807851e39b7bf37",timestamp:"2026-09-20T17:35:03.000Z",immutable:!0,rawSnippet:`Contact: security@auxdesign.nl
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: nl, en
Canonical: https://example-business.nl/.well-known/security.txt`}],h={formula:{X:{short:"Convertir escaneos pasivos en órdenes de remediación comercial llave en mano para PYMEs holandesas (€495 - €1,195 por ticket).",detail:'Las PYMEs ignoran los reportes de 150 páginas de Qualys o Nessus porque generan pánico sin ofrecer una solución ejecutable. ARGUS entrega resúmenes ejecutivos en positivo ("Wat er al goed is") vinculados a servicios cerrados de AUX Design, logrando tasas de conversión del 35-45% frente al <5% de los escáneres tradicionales.'},Y:{short:"100% de verificación criptográfica de remediación (SHA-256 antes/después), 0 llamadas de red no autorizadas (fail-closed) y 0 costo de nube.",detail:"Proof-as-a-Service: cada remediación genera un certificado inmutable con hashes SHA-256 de las evidencias antes y después de la intervención. Además, la arquitectura 100% offline-first garantiza cero costos de servidores en la nube y cumplimiento absoluto con AVG/GDPR."},Z:{short:"El pipeline determinista OBSERVE → PROVE → DECIDE → FIX → VERIFY + el brazo de ejecución de AUX Design.",detail:"ARGUS no es otro escáner genérico. Es un plano de control de evidencia e higiene que une la rigurosidad forense con una fuerza de venta y ejecución técnica localizada en los Países Bajos (auxdesign.nl)."}},marketTailwinds:[{title:"Directiva Europea NIS2 (2024–2026)",impact:"Exige a medianas y grandes empresas verificar la seguridad de su cadena de suministro. Las PYMEs proveedoras necesitan certificar su higiene digital rápidamente para no perder contratos corporativos."},{title:"Norma BIO y Estándares internet.nl",impact:"En los Países Bajos, las contrataciones públicas y entidades gubernamentales exigen cumplimiento estricto con SPF (-all), DMARC, CAA y TLS moderno medido por internet.nl."},{title:"AVG / GDPR Artículo 32",impact:"Obligación legal de contar con medidas técnicas y organizativas apropiadas. Un certificado de remediación ARGUS demuestra debida diligencia ante la Autoriteit Persoonsgegevens (AP)."}],antiFearMoat:[{feature:"Tono y Enfoque",traditional:"Alarmismo, CVSS inflados, amenazas de multas millonarias (genera rechazo)",argus:'Constructivo, Dutch-first, destaca primero "Wat er al goed is" (genera confianza y acción)'},{feature:"Entregable al Cliente",traditional:"PDF de 100+ páginas ininteligible para un dueño de PYME",argus:"1 página ejecutiva con catálogo cerrado de AUX Design pre-cotizado (€195-€1,195)"},{feature:"Cierre del Ciclo",traditional:"Te dice qué está mal, pero no lo arregla ni lo certifica",argus:"Ciclo completo: Detección → Remediación (AUX) → Retest → Certificado Criptográfico"},{feature:"Infraestructura",traditional:"Nubes centralizadas costosas, riesgo de fuga de datos",argus:"OFFLINE FIRST FOR SURE, zero-data-leakage, reproducible localmente"}]},e={target:"example-business.nl",category:"Dutch SME / E-Commerce",activeStage:1,simulationStep:"baseline",findings:JSON.parse(JSON.stringify(f)),proofs:[],activeLanguage:"nl",reportMode:"client",findingsViewMode:"client"},A=document.getElementById("app");function d(){A.innerHTML=`
    <!-- Top Terminal Header -->
    <header class="terminal-header">
      <div class="brand-container">
        <div class="brand">
          <span class="pulse-led"></span>
          ARGUS
        </div>
        <div class="motto-tag">OBSERVE → PROVE → DECIDE → FIX → VERIFY</div>
      </div>
      <div class="header-actions">
        <button class="mode-badge investor-nav-badge" id="btn-nav-investor">
          ★ EL MÉTODO XYZ (INVESTOR MVP)
        </button>
        <select id="select-lang" class="select-input" style="width: auto; margin-bottom: 0; padding: 0.35rem 0.6rem; font-size: 0.75rem;">
          <option value="nl" ${e.activeLanguage==="nl"?"selected":""}>NL (Nederlands)</option>
          <option value="en" ${e.activeLanguage==="en"?"selected":""}>EN (English)</option>
          <option value="es" ${e.activeLanguage==="es"?"selected":""}>ES (Español)</option>
        </select>
        <div class="mode-badge">
          OFFLINE FIRST FOR SURE
        </div>
      </div>
    </header>

    <!-- Main Navigation Tabs -->
    <nav class="main-nav">
      <div class="nav-item ${e.activeStage===0?"active":""}" data-screen="investor">
        ⚡ MÉTODO XYZ
      </div>
      <div class="nav-item ${e.activeStage>=1&&e.activeStage<=6?"active":""}" data-screen="simulator">
        01 SIMULADOR CONTROL PLANE
      </div>
      <div class="nav-item" data-screen="reports">
        02 REPORTES (CLIENT / FORENSIC)
      </div>
      <div class="nav-item" data-screen="casestudy">
        03 CASO DE ESTUDIO ROI
      </div>
      <div class="nav-item" data-screen="aigate">
        04 AI POLICY GATE
      </div>
      <div class="nav-item" data-screen="architecture">
        05 ARQUITECTURA
      </div>
    </nav>

    <!-- Main Content Container -->
    <main class="container">
      <!-- SCREEN: INVESTOR MÉTODO XYZ -->
      <section id="screen-investor" class="screen ${e.activeStage===0?"active":""}">
        ${I()}
      </section>

      <!-- SCREEN: SIMULATOR WORKFLOW -->
      <section id="screen-simulator" class="screen ${e.activeStage>=1&&e.activeStage<=6?"active":""}">
        ${C()}
      </section>

      <!-- SCREEN: REPORTS -->
      <section id="screen-reports" class="screen">
        ${x()}
      </section>

      <!-- SCREEN: CASE STUDY -->
      <section id="screen-casestudy" class="screen">
        ${O()}
      </section>

      <!-- SCREEN: AI POLICY GATE -->
      <section id="screen-aigate" class="screen">
        ${P()}
      </section>

      <!-- SCREEN: ARCHITECTURE -->
      <section id="screen-architecture" class="screen">
        ${D()}
      </section>
    </main>
  `,L()}function I(){const i=h;return`
    <div class="panel panel-investor mb-2">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="status-badge status-warning mb-1">ARGUS MVP THESIS • INVESTOR MEMO</span>
          <h1 style="font-size: 2rem; color: #fff; margin-bottom: 0.5rem;">EL MÉTODO XYZ PARA EL MVP</h1>
          <p class="text-muted" style="max-width: 800px; font-size: 1.05rem;">
            Cómo ARGUS transforma la ciberseguridad para PYMEs: de escaneos que causan parálisis a órdenes de trabajo comerciales y contratos de remediación ejecutables con <strong>AUX Design</strong> (<a href="https://auxdesign.nl" target="_blank" style="color: var(--accent-cyan);">auxdesign.nl</a>).
          </p>
        </div>
        <button class="btn primary" id="btn-start-simulator-from-investor">
          PROBAR SIMULADOR INTERACTIVO →
        </button>
      </div>
    </div>

    <!-- The XYZ Equation Cards -->
    <div class="xyz-hero">
      <div class="xyz-card" style="border-top: 3px solid #f43f5e;">
        <div class="xyz-letter letter-x">X</div>
        <h3 class="mb-1" style="color: #f43f5e;">EL RESULTADO COMERCIAL</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[QUÉ LOGRA EL PRODUCTO]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${i.formula.X.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${i.formula.X.detail}
        </div>
      </div>

      <div class="xyz-card" style="border-top: 3px solid #00e5ff;">
        <div class="xyz-letter letter-y">Y</div>
        <h3 class="mb-1 text-cyan">LA MÉTRICA Y PRUEBA</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[CÓMO SE MIDE Y PRUEBA]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${i.formula.Y.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${i.formula.Y.detail}
        </div>
      </div>

      <div class="xyz-card" style="border-top: 3px solid #10b981;">
        <div class="xyz-letter letter-z">Z</div>
        <h3 class="mb-1 text-emerald">EL CONTROL PLANE PROPIETARIO</h3>
        <p class="font-mono text-muted mb-1" style="font-size: 0.85rem;">[MÉTODO Y EJECUCIÓN ÚNICA]</p>
        <p style="font-size: 0.95rem; line-height: 1.6;">
          ${i.formula.Z.short}
        </p>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-dim); font-size: 0.85rem; color: var(--text-muted);">
          ${i.formula.Z.detail}
        </div>
      </div>
    </div>

    <!-- Unit Economics Calculator for Investors -->
    <div class="panel mb-2">
      <h3 class="text-amber mb-1">SIMULADOR DE UNIT ECONOMICS & MODELO DE INGRESOS</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Calcula el potencial de facturación y margen para el mercado de PYMEs holandesas (MKB).
      </p>

      <div class="grid">
        <div>
          <div class="form-group">
            <label>Auditorías Pasivas Mensuales: <strong id="val-audits" class="text-cyan">60</strong></label>
            <input type="range" id="slider-audits" min="10" max="250" step="5" value="60" />
          </div>
          <div class="form-group">
            <label>Tasa de Conversión Comercial (MKB): <strong id="val-conv" class="text-cyan">38%</strong></label>
            <input type="range" id="slider-conv" min="10" max="60" step="1" value="38" />
          </div>
          <div class="form-group">
            <label>Ticket Promedio Inicial de Remediación (€): <strong id="val-ticket" class="text-cyan">€ 695</strong></label>
            <input type="range" id="slider-ticket" min="350" max="1500" step="25" value="695" />
          </div>
          <div class="form-group">
            <label>Retainer Trimestral de Monitoreo (€/trimestre): <strong id="val-retainer" class="text-cyan">€ 295</strong></label>
            <input type="range" id="slider-retainer" min="150" max="600" step="25" value="295" />
          </div>
        </div>

        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 6px; border: 1px solid var(--border-dim);">
          <div class="telemetry-row" style="grid-template-columns: 1fr 1fr; margin-bottom: 1rem;">
            <div class="telemetry-card">
              <div class="telemetry-label">Clientes Nuevos / Mes</div>
              <div class="telemetry-val text-amber" id="calc-clients">23</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">Ingresos Iniciales / Mes</div>
              <div class="telemetry-val text-emerald" id="calc-initial-rev">€ 15.985</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">Retainers Trimestrales Activos</div>
              <div class="telemetry-val text-cyan" id="calc-retainers">138</div>
            </div>
            <div class="telemetry-card">
              <div class="telemetry-label">ARR Proyectado (Año 1)</div>
              <div class="telemetry-val text-emerald" id="calc-arr">€ 232.540</div>
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Margen Bruto Estimado: 78%</strong><br>
            • Costo de infraestructura de nube por escaneo: <strong>€ 0.00</strong> (Offline-First en laptop de analista)<br>
            • Costo de adquisición de cliente (CAC): Mínimo gracias a prospección pasiva no invasiva<br>
            • LTV / CAC Ratio estimado: <strong>4.8x</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- The Anti-Fear Moat Table -->
    <div class="panel mb-2">
      <h3 class="text-cyan mb-1">EL FOSO DEFENSIVO: ANTI-QUALYS / ANTI-FEAR THESIS</h3>
      <p class="text-muted mb-1 font-mono" style="font-size: 0.85rem;">
        Por qué los escáneres tradicionales fallan comercialmente en el mercado de PYMEs y cómo ARGUS gana.
      </p>

      <table class="comp-table">
        <thead>
          <tr>
            <th style="width: 20%;">Eje de Comparación</th>
            <th style="width: 40%; color: var(--danger);">Escáneres Tradicionales (Qualys, Nessus, Pentesting)</th>
            <th style="width: 40%; color: var(--accent-cyan);">ARGUS + AUX Design Control Plane</th>
          </tr>
        </thead>
        <tbody>
          ${i.antiFearMoat.map(t=>`
            <tr>
              <td><strong>${t.feature}</strong></td>
              <td style="color: #fda4af;">${t.traditional}</td>
              <td style="color: #a7f3d0; font-weight: 500;">${t.argus}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Regulatory Tailwinds -->
    <div class="panel">
      <h3 class="text-emerald mb-1">VIENTOS DE COLA REGULATORIOS EN LA UNIÓN EUROPEA & HOLANDA</h3>
      <div class="grid mt-1">
        ${i.marketTailwinds.map(t=>`
          <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
            <h4 class="text-cyan mb-1" style="font-size: 0.95rem;">${t.title}</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${t.impact}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `}function C(){const i=e.findings.filter(t=>t.status==="ACTIVE").length;return e.findings.filter(t=>t.status==="RESOLVED").length,`
    <!-- Top Progress HUD -->
    <div class="workflow-hud">
      <div class="hud-step ${e.activeStage===1?"active":e.activeStage>1?"completed":""}" data-step="1">
        <span class="hud-step-num">1</span>
        <span>01 SCOPE GATE</span>
      </div>
      <div class="hud-step ${e.activeStage===2?"active":e.activeStage>2?"completed":""}" data-step="2">
        <span class="hud-step-num">2</span>
        <span>02 OBSERVE</span>
      </div>
      <div class="hud-step ${e.activeStage===3?"active":e.activeStage>3?"completed":""}" data-step="3">
        <span class="hud-step-num">3</span>
        <span>03 PROVE (EVIDENCE)</span>
      </div>
      <div class="hud-step ${e.activeStage===4?"active":e.activeStage>4?"completed":""}" data-step="4">
        <span class="hud-step-num">4</span>
        <span>04 DECIDE (RULES)</span>
      </div>
      <div class="hud-step ${e.activeStage===5?"active":e.activeStage>5?"completed":""}" data-step="5">
        <span class="hud-step-num">5</span>
        <span>05 OPPORTUNITIES</span>
      </div>
      <div class="hud-step ${e.activeStage===6?"active":e.activeStage>6?"completed":""}" data-step="6">
        <span class="hud-step-num">6</span>
        <span>06 RETEST & PROOF</span>
      </div>
    </div>

    <!-- Live Telemetry Status Bar -->
    <div class="telemetry-row">
      <div class="telemetry-card">
        <div class="telemetry-label">Objetivo de Misión</div>
        <div class="telemetry-val text-cyan" style="font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis;">
          ${e.target}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Scope Policy</div>
        <div class="telemetry-val text-emerald" style="font-size: 1.1rem;">
          PUBLIC_PASSIVE (VERIFIED)
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Hallazgos Activos</div>
        <div class="telemetry-val ${i>0?"text-amber":"text-emerald"}">
          ${i}
        </div>
      </div>
      <div class="telemetry-card">
        <div class="telemetry-label">Pruebas Criptográficas (Proof)</div>
        <div class="telemetry-val text-emerald">
          ${e.proofs.length}
        </div>
      </div>
    </div>

    <!-- Simulation Control Actions Panel -->
    <div class="panel panel-cyber mb-2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 class="text-cyan mb-1">CONSOLA DE CONTROL DE SIMULACIÓN</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Ejecuta el ciclo de vida completo: Detección basal → Remediación simulada → Retest criptográfico.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn primary" id="btn-run-baseline" ${e.simulationStep!=="baseline"?"disabled":""}>
            ▶ 1. EJECUTAR RECOPILACIÓN BASAL
          </button>
          <button class="btn accent-amber" id="btn-apply-fix" ${e.simulationStep!=="baseline"||i===0?"disabled":""}>
            🔧 2. APLICAR REMEDIACIÓN AUX
          </button>
          <button class="btn accent-emerald" id="btn-run-retest" ${e.simulationStep!=="remediating"?"disabled":""}>
            ✓ 3. VERIFICAR RETEST & PROOF
          </button>
          <button class="btn" id="btn-reset-sim">
            ↺ REINICIAR
          </button>
        </div>
      </div>
    </div>

    <!-- STAGE 1: SCOPE GATE -->
    <div class="panel ${e.activeStage===1?"":"hide-collapse"}" id="panel-stage-1">
      <h3 class="text-cyan mb-1">ETAPA 1: FAIL-CLOSED SCOPE GATE (AUTORIZACIÓN)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        ARGUS nunca realiza escaneos activos no autorizados. ScopeGate previene ataques contra infraestructura interna o ajena.
      </p>

      <div class="grid">
        <div>
          <div class="form-group">
            <label>Dominio Objetivo</label>
            <input type="text" id="sim-input-domain" value="${e.target}" />
          </div>
          <div class="form-group">
            <label>Categoría Organizacional</label>
            <select id="sim-input-cat" class="select-input">
              <option value="ecommerce" ${e.category.includes("E-Commerce")?"selected":""}>Comercio Electrónico / Tienda Online</option>
              <option value="corporate">Empresa B2B / Corporativo</option>
              <option value="saas">SaaS / Proveedor Tecnológico</option>
            </select>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1.5rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <div style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.75rem;">
            <span class="text-muted">RESTRICCIÓN DE POLÍTICA:</span> <strong class="text-emerald">PUBLIC_PASSIVE_ONLY</strong>
          </div>
          <ul style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.7; margin-left: 1.25rem;">
            <li>Sin envío de paquetes intrusivos, inyecciones SQL ni fuzzing.</li>
            <li>Protección automática contra direcciones RFC1918 (10.0.0.0/8, 192.168.0.0/16).</li>
            <li>Invariante de Fallo Cerrado (Fail-Closed): si no está explícitamente en regla, se aborta.</li>
          </ul>
          <div class="mt-1" style="display: flex; gap: 0.5rem;">
            <span class="status-badge status-good">FAIL-CLOSED CHECK: PASS</span>
            <span class="status-badge status-info">SHA-256 SCOPE HASH: VERIFIED</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 2: OBSERVE & COLLECTORS -->
    <div class="panel ${e.activeStage===2?"":"hide-collapse"}" id="panel-stage-2">
      <h3 class="text-cyan mb-1">ETAPA 2: COLECTORES Y TELEMETRÍA DE OBSERVACIÓN</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Recopilación acotada y tolerante a fallos. 4 colectores pasivos independientes.
      </p>

      <div class="grid">
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR DNS</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Consulta SOA, MX, TXT (SPF), _dmarc, CAA<br>
            • Enfoque de consulta individual con timeout estricto (3.000ms)<br>
            • Estado: <span class="text-emerald">9 REGISTROS PROCESADOS</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR TLS</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Negociación pasiva de protocolo (TLS 1.2 / 1.3)<br>
            • Auditoría de suites de cifrado seguras y vigencia del certificado<br>
            • Estado: <span class="text-emerald">TLS 1.3 ACTIVO / VÁLIDO</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR HTTP</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Análisis de cabeceras de seguridad (HSTS, CSP, nosniff, Referrer)<br>
            • Límite estricto de cuerpo (64KB cap) para evitar agotamiento de memoria<br>
            • Estado: <span class="text-amber">CABECERAS CRÍTICAS AUSENTES</span>
          </div>
        </div>
        <div style="background: var(--bg-surface); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim);">
          <h4 class="text-cyan mb-1">COLECTOR SECURITY.TXT (RFC 9116)</h4>
          <div class="font-mono text-muted" style="font-size: 0.8rem;">
            • Inspección de /.well-known/security.txt y /security.txt<br>
            • Verificación de campos obligatorios: Contact, Expires, Canonical<br>
            • Estado: <span class="text-emerald">PRESENTE Y VÁLIDO</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STAGE 3: PROVE (EVIDENCE VAULT) -->
    <div class="panel ${e.activeStage===3?"":"hide-collapse"}" id="panel-stage-3">
      <h3 class="text-cyan mb-1">ETAPA 3: BÓVEDA DE EVIDENCIAS Y TRAZABILIDAD CRIPTOGRÁFICA</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Invariante de inmutabilidad: Toda evidencia es canonicalizada en JSON, hasheada con SHA-256 y congelada con Object.freeze.
      </p>

      <div>
        ${y.map(t=>`
          <div class="evidence-card">
            <div class="evidence-header">
              <div>
                <strong class="text-cyan">${t.id}</strong>
                <span class="status-badge status-info" style="margin-left: 0.5rem;">${t.collector}</span>
                <span class="status-badge status-good" style="margin-left: 0.25rem;">IMMUTABLE (FREEZE)</span>
              </div>
              <div class="sha-badge font-mono">SHA-256: ${t.sha256.substring(0,16)}...</div>
            </div>
            <pre style="color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 3px; overflow-x: auto; font-size: 0.78rem;">${t.rawSnippet}</pre>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- STAGE 4: DECIDE (RULES & FINDINGS) -->
    <div class="panel ${e.activeStage===4?"":"hide-collapse"}" id="panel-stage-4">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 class="text-cyan">ETAPA 4: MOTOR DETERMINISTA DE REGLAS Y HALLAZGOS</h3>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            11 reglas deterministas sin alucinaciones. Estructura de 4 campos: Observado, Soporte, Relevancia y Limitaciones.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn ${e.findingsViewMode==="client"?"primary":""}" id="btn-toggle-client-findings">
            VISTA CLIENTE (COMPRENSIBLE)
          </button>
          <button class="btn ${e.findingsViewMode==="engineer"?"primary":""}" id="btn-toggle-engineer-findings">
            VISTA FORENSE (INGENIERO)
          </button>
        </div>
      </div>

      <div>
        ${e.findings.map(t=>{const r=e.activeLanguage,n=t.clientCopy[r],a=t.status==="RESOLVED";return`
            <div class="finding-card severity-${t.severity.toLowerCase()} ${a?"resolved":""}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <span class="status-badge status-${t.severity==="MEDIUM"?"warning":"info"}">${t.severity}</span>
                  <span class="status-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted); margin-left: 0.25rem;">${t.category}</span>
                  <strong style="margin-left: 0.5rem; font-size: 1.05rem; color: #fff;">
                    ${e.findingsViewMode==="client"?n.title:t.title}
                  </strong>
                </div>
                <div>
                  ${a?'<span class="status-badge status-good">✓ RESUELTO Y VERIFICADO</span>':'<span class="status-badge status-warning">ACTIVO EN OBJETIVO</span>'}
                </div>
              </div>

              ${e.findingsViewMode==="client"?`
                <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.75rem;">
                  ${n.explanation}
                </p>
                <div style="font-size: 0.85rem; color: var(--accent-cyan); font-family: var(--font-mono); background: var(--bg-surface); padding: 0.5rem 0.75rem; border-radius: 4px;">
                  💡 <strong>Acción Recomendada:</strong> ${n.action}
                </div>
              `:`
                <div style="font-family: var(--font-mono); font-size: 0.8rem; line-height: 1.6; color: var(--text-muted);">
                  <div><strong>Rule ID:</strong> ${t.ruleId}</div>
                  <div><strong>Evidence Reference:</strong> ${t.explanation.supports}</div>
                  <div><strong>Observed:</strong> ${t.explanation.observed}</div>
                  <div><strong>Why It Matters:</strong> ${t.explanation.whyItMatters}</div>
                  <div><strong>Limitations:</strong> ${t.explanation.limitations}</div>
                </div>
              `}
            </div>
          `}).join("")}
      </div>
    </div>

    <!-- STAGE 5: COMMERCIAL OPPORTUNITIES (AUX CATALOG) -->
    <div class="panel ${e.activeStage===5?"":"hide-collapse"}" id="panel-stage-5">
      <h3 class="text-cyan mb-1">ETAPA 5: CATÁLOGO COMERCIAL AUX DESIGN (CONVERSIÓN A INGRESOS)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Cada hallazgo se traduce inmediatamente a un servicio de remediación con precio en euros, horas estimadas y entregables claros.
      </p>

      <div class="grid">
        ${E.map(t=>{const r=e.activeLanguage,n=t.title[r],a=t.description[r],s=t.deliverables[r];return`
            <div class="aux-opportunity-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <span class="status-badge status-info">${t.code}</span>
                  <h4 style="color: #fff; margin-top: 0.35rem; font-size: 1rem;">${n}</h4>
                </div>
                <div class="price-tag">
                  € ${t.indicativePriceEur},-
                  <div style="font-size: 0.7rem; color: var(--text-dim); text-align: right;">${t.recurring?"per kwartaal":"vast tarief"}</div>
                </div>
              </div>

              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5;">
                ${a}
              </p>

              <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--accent-cyan); margin-bottom: 0.5rem;">
                ⏱ Tiempo estimado: ${t.estimatedHours}
              </div>

              <div style="border-top: 1px solid var(--border-dim); padding-top: 0.5rem;">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Entregables Clave:</div>
                <ul style="font-size: 0.8rem; color: var(--text-main); margin-left: 1.25rem;">
                  ${s.map(o=>`<li>${o}</li>`).join("")}
                </ul>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>

    <!-- STAGE 6: RETEST & CRYPTOGRAPHIC PROOF -->
    <div class="panel ${e.activeStage===6?"":"hide-collapse"}" id="panel-stage-6">
      <h3 class="text-emerald mb-1">ETAPA 6: RETEST & CERTIFICADO DE PRUEBA (PROOF OF REMEDIATION)</h3>
      <p class="text-muted mb-2 font-mono" style="font-size: 0.85rem;">
        Demostración matemática antes y después: vinculación de hashes SHA-256 basales vs. de retest con estado RESOLVED.
      </p>

      ${e.proofs.length===0?`
        <div style="text-align: center; padding: 2rem; background: var(--bg-surface); border-radius: 4px; border: 1px dashed var(--border-dim);">
          <div class="text-amber mb-1" style="font-size: 1.25rem; font-weight: 700;">AÚN NO SE HA EJECUTADO LA REMEDIACIÓN</div>
          <p class="text-muted font-mono" style="font-size: 0.85rem; margin-bottom: 1.5rem;">
            Presiona el botón "2. APLICAR REMEDIACIÓN AUX" y luego "3. VERIFICAR RETEST & PROOF" arriba para simular la intervención y generar los certificados de prueba.
          </p>
        </div>
      `:`
        <div class="mb-2">
          <div class="telemetry-card mb-2" style="background: rgba(16, 185, 129, 0.1); border-color: var(--accent-emerald);">
            <div class="telemetry-label">ESTADO GENERAL DE VERIFICACIÓN</div>
            <div class="telemetry-val text-emerald" style="font-size: 1.35rem;">
              7 / 7 HALLAZGOS RESUELTOS MATEMÁTICAMENTE (100% PROVEN)
            </div>
          </div>

          ${e.proofs.map(t=>`
            <div class="proof-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <div>
                  <span class="status-badge status-good">PROOF ID: ${t.id}</span>
                  <strong style="margin-left: 0.5rem; color: #fff;">${t.ruleId}</strong>
                </div>
                <span class="status-badge status-good">STATUS: ${t.status}</span>
              </div>
              <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.75rem;">
                ${t.rationale}
              </p>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 3px;">
                <div><strong>Hash Evidencia Basal:</strong> ${t.baselineEvidenceSha}</div>
                <div><strong>Hash Evidencia Retest:</strong> ${t.retestEvidenceSha}</div>
              </div>
            </div>
          `).join("")}
        </div>
      `}
    </div>
  `}function x(){return`
    <div class="panel mb-2">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 class="text-cyan mb-1">GENERADOR DE REPORTES OFICIALES</h2>
          <p class="text-muted font-mono" style="font-size: 0.85rem;">
            Documentos listos para entrega comercial al cliente (en holandés amigable) o auditoría forense interna.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn ${e.reportMode==="client"?"primary":""}" id="btn-view-client-report">
            REPORTE CLIENTE (DUTCH-FIRST)
          </button>
          <button class="btn ${e.reportMode==="engineer"?"primary":""}" id="btn-view-engineer-report">
            REPORTE TÉCNICO FORENSE
          </button>
          <button class="btn accent-amber" onclick="window.print()">
            🖨 IMPRIMIR / PDF
          </button>
        </div>
      </div>
    </div>

    ${e.reportMode==="client"?R():T()}
  `}function R(){return`
    <div class="panel" style="background: #0b1222; border: 1px solid rgba(0, 229, 255, 0.2);">
      <div style="border-bottom: 2px solid var(--accent-cyan); padding-bottom: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">AUX DESIGN • BEVEILIGINGS- & HYGIËNE OVERZICHT</div>
          <h1 style="font-size: 1.75rem; color: #fff; margin-top: 0.25rem;">Beveiligingsrapport: ${e.target}</h1>
          <div class="text-muted" style="font-size: 0.85rem;">Gegenereerd door ARGUS Control Plane op ${new Date().toLocaleDateString("nl-NL")}</div>
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-good" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
            PASSIVE ASSESSMENT (AVG CONFORM)
          </span>
        </div>
      </div>

      <!-- Positive Checks Box -->
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent-emerald); border-radius: 6px; padding: 1.25rem; margin-bottom: 1.5rem;">
        <h3 class="text-emerald mb-1">Wat er al goed is ingericht</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.5rem;">
          Uw organisatie heeft al een aantal belangrijke basismaatregelen getroffen:
        </p>
        <ul style="font-size: 0.88rem; color: #a7f3d0; margin-left: 1.5rem; line-height: 1.7;">
          <li><strong>Moderne transportbeveiliging:</strong> Uw website maakt gebruik van TLS 1.3 met een geldig SSL-certificaat.</li>
          <li><strong>Verantwoorde melding:</strong> Er is een RFC 9116 beveiligingsbestand (security.txt) aanwezig voor ethische hackers.</li>
          <li><strong>DNS infrastructuur:</strong> Betrouwbare domeinnaamservers zonder openbare zonevervuiling.</li>
        </ul>
      </div>

      <!-- Improvement Opportunities -->
      <div class="mb-2">
        <h3 class="text-cyan mb-1">Aanbevolen Verbeteringen voor Optimale Bescherming</h3>
        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">
          De volgende acties versterken uw domein tegen e-mailspoofing, data-onderschepping en browseraanvallen:
        </p>

        <table class="comp-table">
          <thead>
            <tr>
              <th>Onderwerp</th>
              <th>Huidige Situatie</th>
              <th>Geadviseerde Oplossing (AUX Design)</th>
              <th>Vaste Prijs</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>E-mailbeveiliging (DMARC / SPF)</strong></td>
              <td>DMARC staat op monitoren (p=none) en SPF op SoftFail</td>
              <td>Inrichten van DMARC handhaving (p=reject) en strikte SPF (-all)</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
            <tr>
              <td><strong>Webbrowser Verharding (HSTS / CSP)</strong></td>
              <td>HSTS en Content Security Policy ontbreken nog</td>
              <td>Configuratie van HSTS (max-age=1 jaar) en modulaire CSP-regels</td>
              <td class="text-emerald" style="font-weight: 700;">€ 495,-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid var(--border-dim); padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Vragen of direct inplannen? Neem contact op via <strong>contact@auxdesign.nl</strong>
        </div>
        <div class="text-cyan font-mono" style="font-size: 0.85rem;">
          auxdesign.nl • Amsterdam
        </div>
      </div>
    </div>
  `}function T(){return`
    <div class="panel" style="background: #050811; border: 1px solid var(--border-dim);">
      <div style="border-bottom: 1px solid var(--border-dim); padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <div class="font-mono text-cyan" style="font-size: 0.8rem;">ARGUS FORENSIC AUDIT TRAIL • ENGINEERING RUN DOSSIER</div>
        <h2 style="color: #fff; margin-top: 0.25rem;">Cryptographic Provenance for ${e.target}</h2>
        <div class="font-mono text-muted" style="font-size: 0.8rem;">Run ID: run_${Date.now().toString(36)} | Offline Deterministic Mode</div>
      </div>

      <h4 class="text-cyan mb-1">Evidence Records & SHA-256 Signatures</h4>
      <table class="comp-table mb-2">
        <thead>
          <tr>
            <th>Evidence ID</th>
            <th>Collector</th>
            <th>Type</th>
            <th>SHA-256 Digest</th>
            <th>Frozen</th>
          </tr>
        </thead>
        <tbody>
          ${y.map(i=>`
            <tr>
              <td class="font-mono text-cyan">${i.id}</td>
              <td class="font-mono">${i.collector}</td>
              <td class="font-mono">${i.type}</td>
              <td class="font-mono" style="font-size: 0.75rem;">${i.sha256}</td>
              <td><span class="status-badge status-good">TRUE</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <h4 class="text-cyan mb-1">CLI Reproduction Commands</h4>
      <pre style="background: #020408; padding: 1rem; border-radius: 4px; border: 1px solid var(--border-dim); color: #a5b4fc; font-family: var(--font-mono); font-size: 0.85rem; overflow-x: auto;">
# Reproduce deterministic inspection offline
pnpm demo

# Inspect target provenance
argus inspect --target ${e.target} --offline

# Verify cryptographic proofs
argus verify --run run_latest
      </pre>
    </div>
  `}function O(){return`
    <div class="panel mb-2">
      <span class="status-badge status-info mb-1">CASE STUDY • AUX DESIGN COMMERCIAL EXECUTION</span>
      <h2 class="text-cyan mb-1">CASO DE ÉXITO MKB: EXAMPLE-BUSINESS.NL</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Cómo una empresa de comercio electrónico en Países Bajos blindó su reputación y cumplió con la cadena de suministro NIS2 en 48 horas.
      </p>
    </div>

    <div class="grid mb-2">
      <div class="panel">
        <h3 class="text-amber mb-1">EL DESAFÍO INICIAL (BASELINE)</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
          Example Business B.V. operaba una tienda online con €2.4M de facturación anual. Aunque contaban con un certificado SSL válido, su postura pública presentaba dos riesgos críticos:
        </p>
        <ul style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; margin-left: 1.25rem;">
          <li><strong>Vulnerabilidad de Facturación:</strong> DMARC configurado en <code>p=none</code> y SPF con <code>~all</code> permitían a atacantes emitir facturas falsas suplantando el dominio oficial.</li>
          <li><strong>Exposición Web:</strong> Falta de HSTS y CSP exponía las sesiones de los clientes a intercepción en redes Wi-Fi abiertas.</li>
          <li><strong>Bloqueo Comercial:</strong> Un cliente corporativo exigió cumplimiento estricto con la directiva NIS2 para renovar un contrato de suministro.</li>
        </ul>
      </div>

      <div class="panel panel-success">
        <h3 class="text-emerald mb-1">LA INTERVENCIÓN DE AUX DESIGN</h3>
        <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 1rem; line-height: 1.6;">
          A través del catálogo cerrado de ARGUS, AUX Design ejecutó la remediación sin interrumpir la operación:
        </p>
        <ul style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; margin-left: 1.25rem;">
          <li><strong>AUX-DNS-01 (€ 495,-):</strong> Migración a SPF <code>-all</code> y DMARC <code>p=reject</code> con enrutamiento de reportes agregados.</li>
          <li><strong>AUX-TLS-01 (€ 395,-):</strong> Despliegue de cabeceras HSTS con <code>includeSubDomains</code> y pre-carga.</li>
          <li><strong>AUX-RET-01 (€ 295,-):</strong> Certificado de prueba criptográfico con trazabilidad SHA-256 entregado a la junta directiva.</li>
        </ul>
      </div>
    </div>

    <div class="panel">
      <h3 class="text-cyan mb-1">EL RESULTADO VERIFICADO (PROOF OF VALUE)</h3>
      <div class="telemetry-row">
        <div class="telemetry-card">
          <div class="telemetry-label">Tiempo Total de Intervención</div>
          <div class="telemetry-val text-cyan">7 Horas</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Costo Total de Remediación</div>
          <div class="telemetry-val text-amber">€ 1.185,-</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Hallazgos Resueltos</div>
          <div class="telemetry-val text-emerald">100%</div>
        </div>
        <div class="telemetry-card">
          <div class="telemetry-label">Contrato B2B Asegurado</div>
          <div class="telemetry-val text-emerald">€ 180.000 / año</div>
        </div>
      </div>
    </div>
  `}function P(){return`
    <div class="panel mb-2">
      <span class="status-badge status-warning mb-1">AI SAFETY BOUNDARY • INVARIANT ENFORCEMENT</span>
      <h2 class="text-cyan mb-1">SIMULADOR DE AI POLICY GATE & GROUNDING</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Prueba cómo ARGUS neutraliza las alucinaciones de modelos de lenguaje: cualquier afirmación sin referencia estricta a un ID de evidencia es rechazada y descartada.
      </p>
    </div>

    <div class="grid">
      <div class="panel">
        <h4 class="text-cyan mb-1">PROBAR AFIRMACIÓN DE IA</h4>
        <div class="form-group">
          <label>Seleccionar Escenario de IA:</label>
          <select id="select-ai-scenario" class="select-input">
            <option value="grounded">1. Afirmación con Respaldo de Evidencia (Grounded Claim)</option>
            <option value="hallucination">2. Alucinación de IA sin Evidencia (Ungrounded Claim)</option>
            <option value="elevation">3. Intento de elevar confianza a 'VERIFIED'</option>
            <option value="disallowed_tool">4. Intento de ejecutar herramienta prohibida</option>
          </select>
        </div>
        <button class="btn primary" id="btn-eval-ai-gate">
          EVALUAR ANTE POLICY GATE →
        </button>
      </div>

      <div class="panel" style="background: var(--bg-surface);">
        <h4 class="text-cyan mb-1">RESULTADO DE LA POLÍTICA</h4>
        <div id="ai-gate-result" style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.7; color: var(--text-muted);">
          Selecciona un escenario y presiona "EVALUAR ANTE POLICY GATE" para observar el comportamiento en tiempo real.
        </div>
      </div>
    </div>
  `}function D(){return`
    <div class="panel mb-2">
      <span class="status-badge status-good mb-1">ARCHITECTURE & GOVERNANCE</span>
      <h2 class="text-cyan mb-1">LOS 8 INVARIANTES SAGRADOS DE ARGUS</h2>
      <p class="text-muted font-mono" style="font-size: 0.85rem;">
        Garantías del sistema verificadas por la suite de 178 tests automatizados.
      </p>
    </div>

    <div class="grid">
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">1. OFFLINE FIRST FOR SURE</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Con <code>ARGUS_OFFLINE_MODE=true</code> no se abre ningún socket de red. Todas las operaciones se ejecutan con fixtures locales deterministas.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">2. INMUTABILIDAD DE EVIDENCIA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Cada objeto de evidencia se congela con <code>Object.freeze</code> y se sella con un hash SHA-256 canonicalizado.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">3. REGLAS DETERMINISTAS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Entradas idénticas generan hallazgos con IDs estables e idénticos, sin depender de temperatura ni aleatoriedad.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">4. LÍMITE DE CONFIANZA DE IA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          La IA está acotada a <code>INFERRED</code> y jamás puede emitir o elevar una evidencia al nivel <code>VERIFIED</code>.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">5. CERO MIEDO / ZERO-FEAR POLICY</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Prohibido vender seguridad con amenazas de multas de AVG/GDPR inventadas o puntuaciones de CVSS infladas.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">6. RETEST CON CRIPTOGRAFÍA</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          La remediación solo se marca <code>RESOLVED</code> si existe una evidencia de retest válida con hash verificable.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">7. REDACCIÓN PROFUNDA DE SECRETOS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Encabezados y tokens (cookies, authorization, api-keys) se sanitizan recursivamente a cualquier nivel de anidamiento.
        </p>
      </div>
      <div style="background: var(--bg-surface); padding: 1.25rem; border-radius: 4px; border: 1px solid var(--border-dim);">
        <h4 class="text-cyan mb-1">8. INMUNIDAD XSS</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Todos los reportes HTML escapan completamente entradas externas para prevenir inyecciones de código.
        </p>
      </div>
    </div>
  `}function L(){var i,t,r,n,a,s,o,m,p,c,u;document.querySelectorAll(".nav-item").forEach(l=>{l.addEventListener("click",v=>{const g=v.currentTarget.dataset.screen;g&&b(g)})}),(i=document.getElementById("btn-nav-investor"))==null||i.addEventListener("click",()=>{b("investor")}),(t=document.getElementById("btn-start-simulator-from-investor"))==null||t.addEventListener("click",()=>{b("simulator")}),(r=document.getElementById("select-lang"))==null||r.addEventListener("change",l=>{e.activeLanguage=l.target.value,d()}),document.querySelectorAll(".hud-step").forEach(l=>{l.addEventListener("click",v=>{const g=parseInt(v.currentTarget.dataset.step||"1",10);e.activeStage=g,d()})}),(n=document.getElementById("btn-run-baseline"))==null||n.addEventListener("click",()=>{e.activeStage=4,d()}),(a=document.getElementById("btn-apply-fix"))==null||a.addEventListener("click",()=>{e.simulationStep="remediating",e.findings.forEach(l=>{l.status="RESOLVED"}),e.activeStage=5,d()}),(s=document.getElementById("btn-run-retest"))==null||s.addEventListener("click",()=>{e.simulationStep="retested",e.proofs=S,e.activeStage=6,d()}),(o=document.getElementById("btn-reset-sim"))==null||o.addEventListener("click",()=>{e.simulationStep="baseline",e.activeStage=1,e.findings=JSON.parse(JSON.stringify(f)),e.proofs=[],d()}),(m=document.getElementById("btn-toggle-client-findings"))==null||m.addEventListener("click",()=>{e.findingsViewMode="client",d()}),(p=document.getElementById("btn-toggle-engineer-findings"))==null||p.addEventListener("click",()=>{e.findingsViewMode="engineer",d()}),(c=document.getElementById("btn-view-client-report"))==null||c.addEventListener("click",()=>{e.reportMode="client",d()}),(u=document.getElementById("btn-view-engineer-report"))==null||u.addEventListener("click",()=>{e.reportMode="engineer",d()}),M(),N()}function b(i){document.querySelectorAll(".screen").forEach(n=>n.classList.remove("active")),document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));const t=document.getElementById(`screen-${i}`);t&&t.classList.add("active");const r=document.querySelector(`.nav-item[data-screen="${i}"]`);r&&r.classList.add("active"),i==="investor"?e.activeStage=0:i==="simulator"&&e.activeStage===0&&(e.activeStage=1)}function M(){const i=document.getElementById("slider-audits"),t=document.getElementById("slider-conv"),r=document.getElementById("slider-ticket"),n=document.getElementById("slider-retainer");if(!i||!t||!r||!n)return;const a=()=>{const s=parseInt(i.value,10),o=parseInt(t.value,10),m=parseInt(r.value,10),p=parseInt(n.value,10);document.getElementById("val-audits").textContent=s.toString(),document.getElementById("val-conv").textContent=`${o}%`,document.getElementById("val-ticket").textContent=`€ ${m}`,document.getElementById("val-retainer").textContent=`€ ${p}`;const c=Math.round(s*(o/100)),u=c*m,l=Math.round(c*6),v=u*12+l*p*4*.25;document.getElementById("calc-clients").textContent=c.toString(),document.getElementById("calc-initial-rev").textContent=`€ ${u.toLocaleString("nl-NL")}`,document.getElementById("calc-retainers").textContent=l.toString(),document.getElementById("calc-arr").textContent=`€ ${v.toLocaleString("nl-NL")}`};i.addEventListener("input",a),t.addEventListener("input",a),r.addEventListener("input",a),n.addEventListener("input",a)}function N(){const i=document.getElementById("btn-eval-ai-gate"),t=document.getElementById("select-ai-scenario"),r=document.getElementById("ai-gate-result");i==null||i.addEventListener("click",()=>{if(!t||!r)return;const n=t.value;n==="grounded"?r.innerHTML=`
        <div class="status-badge status-good mb-1">POLICY GATE: PASS (GROUNDED)</div>
        <div style="color: #a7f3d0; margin-bottom: 0.5rem;">
          ✓ Afirmación: "HSTS header is absent in HTTP response"
        </div>
        <div>
          • Referencia a evidencia válida: <code>ev_http_get_slash</code> (PRESENTE)<br>
          • Nivel de confianza asignado: <strong class="text-cyan">INFERRED</strong> (AI Clamped)<br>
          • Resultado: <strong>Afirmación preservada en el informe de análisis.</strong>
        </div>
      `:n==="hallucination"?r.innerHTML=`
        <div class="status-badge status-critical mb-1">POLICY GATE: BLOCKED (HALLUCINATION DROPPED)</div>
        <div style="color: #fda4af; margin-bottom: 0.5rem;">
          ✗ Afirmación alucinada: "El servidor tiene una vulnerabilidad crítica Log4j en el puerto 8080"
        </div>
        <div>
          • Referencia a evidencia: <code>null</code> (Sin registro en la bóveda)<br>
          • Acción de seguridad: <strong class="text-rose">DROPPED_BY_POLICY_GATE</strong><br>
          • Resultado: <strong>Afirmación descartada automáticamente antes de llegar al reporte.</strong>
        </div>
      `:n==="elevation"?r.innerHTML=`
        <div class="status-badge status-warning mb-1">POLICY GATE: CLAMPED (PRIVILEGE DEFENSE)</div>
        <div style="color: #fef08a; margin-bottom: 0.5rem;">
          ! Intento de la IA: Asignar confianza 'VERIFIED' a deducción de software
        </div>
        <div>
          • Regla de Invariante: <em>"AI cannot elevate findings to VERIFIED"</em><br>
          • Acción de seguridad: <strong>Re-etiquetado forzado a INFERRED</strong><br>
          • Solo los colectores criptográficos deterministas pueden emitir estado VERIFIED.
        </div>
      `:n==="disallowed_tool"&&(r.innerHTML=`
        <div class="status-badge status-critical mb-1">POLICY GATE: REJECTED (TOOL CALL BLOCKED)</div>
        <div style="color: #fda4af; margin-bottom: 0.5rem;">
          ✗ Intento de llamada a herramienta: <code>nmap_port_scan()</code>
        </div>
        <div>
          • Lista blanca autorizada: <code>[inspect_evidence, query_rule_catalog]</code><br>
          • Violación de ScopeGate: <strong>Llamada a herramienta activa no autorizada</strong><br>
          • Acción de seguridad: <strong>Ejecución abortada inmediatamente con código de error.</strong>
        </div>
      `)})}d();
