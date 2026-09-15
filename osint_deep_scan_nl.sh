#!/bin/bash
# ARGUS OSINT Deep Scanner
# Escaneo profesional con anti-fingerprint y detección de incumplimientos legales

set -euo pipefail

CSV_INPUT="leads_madrid_centro_100.csv"
CSV_OUTPUT="leads_madrid_centro_OSINT_DEEP.csv"
RESULTS_DIR="./osint_results"
TEMP_DIR="./osint_temp"

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# User agents para rotar (anti-fingerprint)
declare -a USER_AGENTS=(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0"
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36"
    "Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0"
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0"
)

# Crear directorios
mkdir -p "$RESULTS_DIR" "$TEMP_DIR"

# Función para obtener UA aleatorio
get_random_ua() {
    echo "${USER_AGENTS[$RANDOM % ${#USER_AGENTS[@]}]}"
}

# Función para verificar actividad online
check_online_activity() {
    local url=$1
    local domain=$(echo "$url" | sed -e 's|^https\?://||' -e 's|/.*||')

    # 1. Check si tiene e-commerce
    local has_ecommerce=false
    if curl -sL -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null | \
       grep -qiE 'cart|checkout|add.to.cart|buy.now|comprar|carrito|woocommerce|shopify'; then
        has_ecommerce=true
    fi

    # 2. Check formularios (contacto, reservas, etc.)
    local has_forms=false
    if curl -sL -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null | \
       grep -qiE '<form|formspree|typeform|jotform|reserva|contacto'; then
        has_forms=true
    fi

    # 3. Check analytics (señal de seguimiento activo)
    local has_analytics=false
    if curl -sL -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null | \
       grep -qiE 'google-analytics|gtag|ga\(|_ga|facebook-pixel|fbq\('; then
        has_analytics=true
    fi

    # Score actividad
    local activity_score=0
    $has_ecommerce && activity_score=$((activity_score + 3))
    $has_forms && activity_score=$((activity_score + 2))
    $has_analytics && activity_score=$((activity_score + 1))

    echo "$activity_score"
}

# Función para detectar INCUMPLIMIENTOS LEGALES
detect_legal_violations() {
    local url=$1
    local domain=$(echo "$url" | sed -e 's|^https\?://||' -e 's|/.*||')
    local violations=()

    echo -e "${YELLOW}[LEGAL]${NC} Detectando incumplimientos en $domain..." >&2

    # 1. GDPR Cookie Consent (OBLIGATORIO en EU)
    local cookie_html=$(curl -sL -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null)
    if echo "$cookie_html" | grep -qiE 'google-analytics|facebook-pixel|_ga|fbq'; then
        if ! echo "$cookie_html" | grep -qiE 'cookie.consent|cookie.banner|cookiebot|onetrust|cookie.notice'; then
            violations+=("GDPR_NO_COOKIE_CONSENT:CRÍTICO - Usa cookies analíticas sin banner consentimiento")
        fi
    fi

    # 2. Privacy Policy (OBLIGATORIO GDPR)
    local has_privacy=false
    for path in "/privacy" "/privacy-policy" "/politica-privacidad" "/privacidad" "/legal"; do
        if curl -sL -A "$(get_random_ua)" -m 5 "${url}${path}" 2>/dev/null | grep -qiE 'privacy|privacidad|datos.personales|rgpd|gdpr'; then
            has_privacy=true
            break
        fi
    done

    if ! $has_privacy; then
        violations+=("GDPR_NO_PRIVACY_POLICY:CRÍTICO - Sin política de privacidad (Art. 13 GDPR)")
    fi

    # 3. HTTPS Obligatorio (GDPR Art. 32)
    if [[ ! "$url" =~ ^https:// ]]; then
        violations+=("GDPR_NO_HTTPS:CRÍTICO - HTTP sin cifrar (Art. 32 GDPR - medidas técnicas)")
    fi

    # 4. Formularios sin HTTPS
    if [[ "$url" =~ ^http:// ]]; then
        if echo "$cookie_html" | grep -qiE '<form|<input.*password|<input.*email'; then
            violations+=("GDPR_FORM_NO_HTTPS:CRÍTICO - Formulario sin cifrado expone datos personales")
        fi
    fi

    # 5. HSTS Missing (Required for HTTPS sites)
    if [[ "$url" =~ ^https:// ]]; then
        if ! curl -sI -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null | grep -qi "strict-transport-security"; then
            violations+=("SECURITY_NO_HSTS:ALTO - Sin HSTS, vulnerable a downgrade attacks")
        fi
    fi

    # 6. Email sin SPF/DMARC (DSGVO email security)
    local spf_exists=false
    local dmarc_exists=false

    if command -v dig >/dev/null 2>&1; then
        if dig +short TXT "$domain" 2>/dev/null | grep -qi "v=spf1"; then
            spf_exists=true
        fi
        if dig +short TXT "_dmarc.$domain" 2>/dev/null | grep -qi "v=DMARC1"; then
            dmarc_exists=true
        fi
    fi

    if ! $spf_exists; then
        violations+=("EMAIL_NO_SPF:ALTO - Sin SPF, emails fácilmente falsificables (phishing)")
    fi

    if ! $dmarc_exists; then
        violations+=("EMAIL_NO_DMARC:MEDIO - Sin DMARC, sin protección email spoofing")
    fi

    # 7. Tecnologías obsoletas (vulnerabilidades conocidas)
    local tech_info=$(curl -sL -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null)

    # WordPress < 6.0 (múltiples CVEs)
    if echo "$tech_info" | grep -qiE 'wp-content.*ver=([0-5]\.|6\.0)'; then
        violations+=("VULN_WORDPRESS_OLD:CRÍTICO - WordPress obsoleto con CVEs conocidos")
    fi

    # jQuery < 3.5 (XSS vulnerabilities)
    if echo "$tech_info" | grep -qiE 'jquery.*[12]\.[0-9]|jquery.*3\.[0-4]'; then
        violations+=("VULN_JQUERY_XSS:ALTO - jQuery vulnerable a XSS (CVE-2020-11022)")
    fi

    # 8. SSL Certificate (check expiration)
    if [[ "$url" =~ ^https:// ]]; then
        local ssl_check=$(echo | timeout 5 openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")

        if [[ -n "$ssl_check" ]]; then
            local expiry_date=$(echo "$ssl_check" | grep "notAfter" | cut -d= -f2)
            local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo 0)
            local now_epoch=$(date +%s)
            local days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

            if [[ $days_left -lt 0 ]]; then
                violations+=("SSL_EXPIRED:CRÍTICO - Certificado SSL EXPIRADO - Navegadores bloquean")
            elif [[ $days_left -lt 30 ]]; then
                violations+=("SSL_EXPIRING:ALTO - Certificado expira en $days_left días")
            fi
        fi
    fi

    # 9. Detección de IA sin declaración (EU AI Act)
    if echo "$tech_info" | grep -qiE 'intercom|drift|crisp|zendesk.*chat|tawk\.to|chatbot'; then
        # Buscar declaración AI en legal
        local has_ai_disclosure=false
        for path in "/ai-disclosure" "/legal" "/privacy-policy"; do
            if curl -sL -A "$(get_random_ua)" -m 5 "${url}${path}" 2>/dev/null | \
               grep -qiE 'artificial.intelligence|inteligencia.artificial|automated.decision|machine.learning|AI.system'; then
                has_ai_disclosure=true
                break
            fi
        done

        if ! $has_ai_disclosure; then
            violations+=("AI_ACT_NO_DISCLOSURE:CRÍTICO - Usa IA (chatbot) sin declarar (EU AI Act 2024)")
        fi
    fi

    # 10. Missing Security Headers (OWASP)
    local headers=$(curl -sI -A "$(get_random_ua)" -m 10 "$url" 2>/dev/null)

    if ! echo "$headers" | grep -qi "x-frame-options"; then
        violations+=("SECURITY_NO_FRAME_PROTECTION:MEDIO - Vulnerable a clickjacking")
    fi

    if ! echo "$headers" | grep -qi "x-content-type-options"; then
        violations+=("SECURITY_NO_CONTENT_TYPE:BAJO - Vulnerable a MIME sniffing")
    fi

    if ! echo "$headers" | grep -qi "content-security-policy"; then
        violations+=("SECURITY_NO_CSP:MEDIO - Sin CSP, vulnerable a XSS")
    fi

    # Retornar violaciones separadas por "|"
    printf '%s\n' "${violations[@]}" | paste -sd'|' -
}

# Función para calcular score y urgencia
calculate_urgency() {
    local violations=$1
    local critical_count=$(echo "$violations" | grep -o "CRÍTICO" | wc -l)
    local high_count=$(echo "$violations" | grep -o "ALTO" | wc -l)
    local medium_count=$(echo "$violations" | grep -o "MEDIO" | wc -l)

    local score=$(( (critical_count * 40) + (high_count * 20) + (medium_count * 10) ))

    if [[ $score -ge 60 ]]; then
        echo "URGENTE|$score|$critical_count|$high_count|$medium_count"
    elif [[ $score -ge 30 ]]; then
        echo "ALTA|$score|$critical_count|$high_count|$medium_count"
    else
        echo "MEDIA|$score|$critical_count|$high_count|$medium_count"
    fi
}

# Generar pitch legal específico
generate_legal_pitch() {
    local violations=$1
    local empresa=$2

    # Extraer primera violación crítica
    local first_critical=$(echo "$violations" | grep -o "[^|]*CRÍTICO[^|]*" | head -1)

    if [[ -n "$first_critical" ]]; then
        local violation_type=$(echo "$first_critical" | cut -d: -f1)
        local violation_desc=$(echo "$first_critical" | cut -d: -f2-)

        case "$violation_type" in
            GDPR_NO_COOKIE_CONSENT)
                echo "INCUMPLIMIENTO GDPR Art. 7: $empresa usa cookies analíticas SIN banner de consentimiento. Sanción AEPD: €20.000-€300.000. Obligatorio desde 2019."
                ;;
            GDPR_NO_PRIVACY_POLICY)
                echo "INCUMPLIMIENTO GDPR Art. 13: Sin política de privacidad visible. Sanción: €10.000 mínimo. Debe tenerla ANTES de recoger datos."
                ;;
            GDPR_FORM_NO_HTTPS)
                echo "INCUMPLIMIENTO CRÍTICO GDPR Art. 32: Formulario expone datos personales sin cifrado. Filtración datos = notificación AEPD 72h + sanción €200.000+."
                ;;
            SSL_EXPIRED)
                echo "CERTIFICADO SSL EXPIRADO: Navegadores bloquean web. Pérdida clientes 100%. Hosting puede suspender sitio. Arreglo: 2 horas."
                ;;
            AI_ACT_NO_DISCLOSURE)
                echo "INCUMPLIMIENTO EU AI ACT (2024): Usa chatbot IA sin declaración legal. Multa: €15M o 3% facturación. Obligatorio desde Agosto 2024."
                ;;
            VULN_WORDPRESS_OLD)
                echo "VULNERABILIDAD CRÍTICA: WordPress obsoleto con CVEs públicos. Hackeo inminente. 70% webs hackeadas usan WP sin actualizar."
                ;;
            *)
                echo "$violation_desc Requiere corrección inmediata para evitar sanciones."
                ;;
        esac
    else
        echo "Varios problemas detectados. Auditoría completa recomendada."
    fi
}

# Header CSV
echo "Empresa,Website,Actividad_Online,Score_Urgencia,Urgencia,Critical,High,Medium,Incumplimientos_Legales,Pitch_Legal,Sector,Telefono,Email" > "$CSV_OUTPUT"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ARGUS OSINT Deep Scanner${NC}"
echo -e "${GREEN}  Anti-Fingerprint + Legal Violations${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Procesar cada empresa
total_lines=$(tail -n +2 "$CSV_INPUT" | wc -l)
current=0

tail -n +2 "$CSV_INPUT" | while IFS=',' read -r empresa website sector direccion telefono email resto; do
    current=$((current + 1))

    # Limpiar valores
    empresa=$(echo "$empresa" | tr -d '"')
    website=$(echo "$website" | tr -d '"')
    sector=$(echo "$sector" | tr -d '"')
    telefono=$(echo "$telefono" | tr -d '"')
    email=$(echo "$email" | tr -d '"')

    echo -e "\n${YELLOW}[$current/$total_lines]${NC} Escaneando: $empresa"
    echo -e "  URL: $website"

    # Anti-fingerprint: delay aleatorio 2-5s
    sleep $((2 + RANDOM % 4))

    # 1. Check actividad online
    echo -e "  ${YELLOW}→${NC} Verificando actividad online..."
    activity_score=$(check_online_activity "$website")

    if [[ $activity_score -lt 2 ]]; then
        echo -e "  ${RED}✗${NC} Actividad baja ($activity_score/6) - SKIP"
        continue
    fi

    echo -e "  ${GREEN}✓${NC} Actividad confirmada ($activity_score/6)"

    # 2. Detectar violaciones legales
    echo -e "  ${YELLOW}→${NC} Analizando cumplimiento legal..."
    violations=$(detect_legal_violations "$website")

    if [[ -z "$violations" ]]; then
        echo -e "  ${GREEN}✓${NC} Sin incumplimientos críticos"
        continue
    fi

    # 3. Calcular urgencia
    urgency_data=$(calculate_urgency "$violations")
    IFS='|' read -r urgency score critical high medium <<< "$urgency_data"

    echo -e "  ${RED}⚠${NC}  Score: $score | Urgencia: $urgency"
    echo -e "  ${RED}⚠${NC}  Critical: $critical | High: $high | Medium: $medium"

    # 4. Generar pitch legal
    pitch=$(generate_legal_pitch "$violations" "$empresa")

    # 5. Guardar resultado
    echo "\"$empresa\",\"$website\",$activity_score,$score,\"$urgency\",$critical,$high,$medium,\"$violations\",\"$pitch\",\"$sector\",\"$telefono\",\"$email\"" >> "$CSV_OUTPUT"

    echo -e "  ${GREEN}✓${NC} Guardado\n"

    # Anti-fingerprint: delay entre empresas
    sleep $((3 + RANDOM % 5))
done

# Estadísticas finales
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ESCANEO COMPLETADO${NC}"
echo -e "${GREEN}========================================${NC}\n"

total_scanned=$(tail -n +2 "$CSV_OUTPUT" | wc -l)
urgentes=$(grep -c "URGENTE" "$CSV_OUTPUT" || echo 0)
altas=$(grep -c "ALTA" "$CSV_OUTPUT" || echo 0)

echo "📊 Empresas escaneadas: $total_scanned"
echo "🔴 Urgencia URGENTE: $urgentes"
echo "🟡 Urgencia ALTA: $altas"
echo ""
echo "📄 Archivo: $CSV_OUTPUT"
echo ""

# Top 5 más urgentes
echo -e "${RED}🚨 TOP 5 MÁS URGENTES:${NC}\n"
tail -n +2 "$CSV_OUTPUT" | sort -t',' -k4 -rn | head -5 | while IFS=',' read -r empresa rest; do
    echo "  • $(echo $empresa | tr -d '"')"
done

echo -e "\n${GREEN}✅ Listo para ventas${NC}"
