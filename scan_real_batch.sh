#!/bin/bash
# ARGUS Real Batch Scanner usando CLI
# Escanea dominios y genera CSV con scores reales

CSV_INPUT="leads_madrid_centro_100.csv"
CSV_OUTPUT="leads_madrid_centro_100_SCANNED_REAL.csv"
TEMP_DIR="./scan_results"

mkdir -p "$TEMP_DIR"

# Header del CSV output
echo "Empresa,Website,Score,Categoria,Critical,High,Medium,Low,Problemas_Encontrados,GDPR_Risk,Sector,Direccion,Telefono,Email,Pitch" > "$CSV_OUTPUT"

# Leer CSV y extraer info
tail -n +2 "$CSV_INPUT" | while IFS=',' read -r empresa website sector direccion telefono email empleados rating notas; do

  echo "[SCAN] $empresa - $website"

  # Limpiar URL
  domain=$(echo "$website" | sed 's/https\?:\/\///')

  # Crear archivo temporal para este dominio
  RESULT_FILE="$TEMP_DIR/$(echo $domain | tr '/:' '_').json"

  # Ejecutar ARGUS CLI (necesitamos implementar modo JSON output)
  # Por ahora simulamos con curl básico

  critical=0
  high=0
  medium=0
  low=0
  problems=""

  # Check HTTPS
  if curl -sSL -I -m 5 "$website" 2>/dev/null | grep -q "HTTP/2 200\|HTTP/1.1 200"; then

    # Check HSTS
    if ! curl -sSL -I -m 5 "$website" 2>/dev/null | grep -iq "strict-transport-security"; then
      medium=$((medium + 1))
      problems="${problems}Missing HSTS; "
    fi

    # Check CSP
    if ! curl -sSL -I -m 5 "$website" 2>/dev/null | grep -iq "content-security-policy"; then
      medium=$((medium + 1))
      problems="${problems}Missing CSP; "
    fi

    # Check X-Frame-Options
    if ! curl -sSL -I -m 5 "$website" 2>/dev/null | grep -iq "x-frame-options"; then
      medium=$((medium + 1))
      problems="${problems}Missing X-Frame-Options; "
    fi

    # Check SSL cert (basic)
    if ! echo | openssl s_client -connect "$(echo $domain | cut -d'/' -f1):443" -servername "$(echo $domain | cut -d'/' -f1)" 2>/dev/null | grep -q "Verify return code: 0"; then
      critical=$((critical + 1))
      problems="${problems}SSL Certificate Issue; "
    fi

  else
    critical=$((critical + 1))
    problems="${problems}Website Unreachable; "
  fi

  # Calcular score
  score=$(( (critical * 40) + (high * 20) + (medium * 10) + (low * 5) ))
  if [ $score -gt 100 ]; then score=100; fi

  # Categoría
  if [ $score -ge 60 ]; then
    categoria="🔴 ROJO"
    gdpr_risk="ALTO"
  elif [ $score -ge 30 ]; then
    categoria="🟡 AMARILLO"
    gdpr_risk="MEDIO"
  else
    categoria="🟢 VERDE"
    gdpr_risk="BAJO"
  fi

  # Pitch
  if [ $critical -gt 0 ]; then
    pitch="CRÍTICO: $critical problemas graves detectados. ${problems} Riesgo GDPR alto. Sanción hasta €20.000."
  elif [ $score -gt 0 ]; then
    pitch="$((critical + high + medium + low)) problemas detectados: ${problems} Recomendamos auditoría completa."
  else
    pitch="Web bien configurada. Mantenimiento preventivo recomendado."
  fi

  # Escribir fila
  echo "\"$empresa\",\"$website\",$score,\"$categoria\",$critical,$high,$medium,$low,\"$problems\",\"$gdpr_risk\",\"$sector\",\"$direccion\",\"$telefono\",\"$email\",\"$pitch\"" >> "$CSV_OUTPUT"

  # Pequeña pausa
  sleep 1

done

echo "✅ COMPLETADO: $CSV_OUTPUT"

# Stats
total=$(tail -n +2 "$CSV_OUTPUT" | wc -l)
rojos=$(grep "ROJO" "$CSV_OUTPUT" | wc -l)
amarillos=$(grep "AMARILLO" "$CSV_OUTPUT" | wc -l)
verdes=$(grep "VERDE" "$CSV_OUTPUT" | wc -l)

echo ""
echo "📊 DISTRIBUCIÓN:"
echo "🔴 ROJO: $rojos ($((rojos * 100 / total))%)"
echo "🟡 AMARILLO: $amarillos ($((amarillos * 100 / total))%)"
echo "🟢 VERDE: $verdes ($((verdes * 100 / total))%)"
