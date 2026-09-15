# 🤖 PROMPT PARA AGY - SCRAPING 100 NEGOCIOS

**Fecha:** 2026-09-08  
**Para:** ChatGPT (modo agente Agy)  
**Objetivo:** Generar lista de 100 negocios con website en zona específica

---

## 📋 PROMPT COMPLETO (COPIAR Y PEGAR EN AGY)

```
Necesito que hagas scraping de negocios en Madrid Centro (España) con las siguientes características:

OBJETIVO:
Generar lista de 100 empresas/negocios que tengan sitio web, priorizando aquellos que más se beneficiarían de una auditoría de seguridad web.

CRITERIOS DE BÚSQUEDA:
1. Ubicación: Madrid Centro (distritos: Centro, Salamanca, Chamberí, Retiro)
2. Sectores prioritarios:
   - Restaurantes y cafeterías
   - Hoteles y alojamientos
   - Tiendas retail (moda, electrónica, joyería)
   - Clínicas dentales y centros médicos
   - Despachos de abogados
   - Asesorías y gestorías
   - Gimnasios y centros deportivos
   - Peluquerías y centros estéticos

3. Características empresa:
   - 5-50 empleados
   - Presencia física (local/oficina)
   - OBLIGATORIO: Tener sitio web (no solo redes sociales)
   - Preferible: Email y teléfono de contacto

FUENTES A UTILIZAR:
1. Google Maps / Google My Business
2. Páginas Amarillas España
3. Yelp España
4. LinkedIn (perfiles empresa)
5. Directorios locales Madrid

FORMATO DE SALIDA (CSV):
El archivo debe tener las siguientes columnas:

Empresa,Website,Sector,Direccion,Telefono,Email,Empleados_Est,Google_Rating,Notas

CAMPOS:
- Empresa: Nombre del negocio
- Website: URL completa (https://...) - OBLIGATORIO
- Sector: Categoría (restaurante, hotel, clínica, etc.)
- Direccion: Calle y número completo
- Telefono: Con prefijo +34
- Email: Si está disponible públicamente
- Empleados_Est: Estimación del tamaño (5, 10, 20, 50)
- Google_Rating: Valoración de 1-5 estrellas
- Notas: Cualquier info relevante (WordPress visible, dominio antiguo, etc.)

EJEMPLO FILA:
Restaurante La Montaña,https://lamontana.es,Restaurante,Calle Mayor 12 Madrid,+34600123456,info@lamontana.es,15,4.2,WordPress detectado

PRIORIZACIÓN:
Prioriza empresas que:
1. Tengan valoraciones 4+ estrellas (serio y profesional)
2. Dominio .es o .com (no subdominios gratuitos)
3. Sector donde seguridad importa (restaurantes facturación online, clínicas con datos médicos, etc.)

VALIDACIÓN:
- Verificar que el website existe (HTTP 200)
- Verificar que NO es solo página Facebook/Instagram
- Verificar que NO es marketplace (Amazon, Booking, etc.)

ENTREGA:
- Archivo CSV: leads_madrid_centro_100.csv
- Ordenar por: Google_Rating descendente
- Incluir solo empresas con TODOS los campos obligatorios (Empresa, Website, Sector, Direccion)

TIEMPO ESTIMADO: 30-60 minutos

¿Empiezo con el scraping?
```

---

## 🔄 VARIANTES DEL PROMPT

### Para Arnhem (Holanda)

```
[Mismo prompt base, cambiar:]

Ubicación: Arnhem Centro (Gelderland, Países Bajos)
Sectores prioritarios: [mismos]
Características empresa: [mismas]

Fuentes adicionales:
- KvK (Kamer van Koophandel) - Registro Mercantil NL
- Google Maps Netherlands
- Marktplaats zakelijk

Teléfono: Con prefijo +31
Idioma: Detectar si sitio está en NL/EN/multi

EJEMPLO FILA:
Restaurant De Berg,https://restaurantdeberg.nl,Restaurant,Koningstraat 45 Arnhem,+31261234567,info@deberg.nl,12,4.5,WordPress NL
```

### Para Sector Específico

```
[Mismo prompt base, cambiar:]

Sectores prioritarios: SOLO Restaurantes

Características adicionales:
- Facturación online (reservas/pedidos)
- Presencia en plataformas (TheFork, JustEat)
- Tipo cocina (italiano, japonés, mediterráneo)

CAMPOS EXTRA:
- Tipo_Cocina: Categoría gastronómica
- Pedido_Online: Sí/No
- Plataforma: TheFork, JustEat, propia, ninguna

PRIORIZACIÓN:
1. Tienen pedido online (más vulnerable)
2. No usan HTTPS (crítico para pagos)
3. WordPress visible (más fácil auditar)
```

---

## 🎯 QUÉ HACER CON EL OUTPUT

### Paso 1: Abraham Valida

```bash
cd C:\Users\2fabr\ARGUS
# Abrir CSV en Excel
# Verificar calidad datos (websites válidos, info completa)
```

**Checklist:**
- [ ] 100 filas completas
- [ ] Todos los websites responden (HTTP 200)
- [ ] No hay duplicados
- [ ] Sectores diversos (no 100 restaurantes)
- [ ] Teléfonos con formato correcto

### Paso 2: Escaneo Automático

```bash
# Extraer solo columna Website
awk -F',' '{print $2}' leads_madrid_centro_100.csv > urls.txt

# Escanear todos (cuando implementemos scan-zone)
node apps/console/dist/index.js scan-batch urls.txt
```

**Output esperado:**
- `leads_madrid_centro_100_SCANNED.csv` (con scores)
- Tiempo: ~50 minutos (30s por dominio)

### Paso 3: Pola/Violeta Prospectan

**Ordenar por Score (mayor primero):**
- 🔴 Rojo (60-100): Contactar HOY
- 🟡 Amarillo (30-59): Esta semana
- 🟢 Verde (0-29): Próxima semana

**Pitch personalizado:**
> "Hola [Empresa], hemos escaneado [Website] y detectado [X] problemas de seguridad, incluido [PROBLEMA CRÍTICO]..."

---

## 🔧 TROUBLESHOOTING AGY

### Problema: Agy No Encuentra Websites

**Solución:**
```
Agy, muchas empresas en Google Maps no muestran su website directamente. Por favor:

1. Para cada empresa SIN website visible:
   - Buscar en Google: "[nombre empresa] madrid"
   - Revisar primer resultado orgánico
   - Verificar dominio propio (no Facebook)

2. Si después de esto NO tiene web:
   - Saltar a siguiente empresa
   - No incluir en CSV final

Necesito 100 con website, no 100 totales.
```

### Problema: Websites Inválidos

**Solución:**
```
Agy, antes de añadir cada website al CSV:

1. Hacer HTTP HEAD request
2. Verificar status code 200 o 301/302
3. Si 404, 500, timeout → Saltar empresa

Validación antes de incluir, no después.
```

### Problema: Datos Incompletos

**Solución:**
```
Agy, si una empresa tiene website pero falta teléfono/email:

1. Buscar en LinkedIn
2. Buscar en Páginas Amarillas
3. Visitar el website → sección Contacto

Si después de esto NO encuentras contacto:
- Poner "N/D" en Telefono/Email
- Incluir en CSV (website es obligatorio, contacto no)
```

---

## 📊 CALIDAD ESPERADA DEL SCRAPING

### Aceptable (✅)
- 100 empresas
- 95+ con website válido
- 80+ con teléfono
- 50+ con email
- 100% con dirección
- Diversidad sectores (20% por sector)

### Inaceptable (❌)
- < 90 empresas con website
- Duplicados
- Websites que no responden
- 50+ del mismo sector
- Direcciones incompletas
- Teléfonos sin +34

---

## 🚀 PRÓXIMA ITERACIÓN (Cuando Automaticemos)

### Futuro: Sin Agy

```bash
# Comando directo ARGUS
node apps/console/dist/index.js scan-zone madrid-centro \
  --sector=restaurants \
  --limit=100 \
  --output=leads.csv
```

**Esto hará:**
1. Buscar en Google Places API
2. Filtrar solo con website
3. Escanear ARGUS automático
4. Generar CSV con scores
5. Generar PDF con priorización

**Todo en 1 comando, 50 minutos.**

**Pero por ahora:** Agy hace scraping, Abraham escanea manual.

---

## 💡 TIPS PARA ABRAHAM

### Mejorar Calidad Scraping

**Pedir a Agy:**
```
Agy, además de los datos básicos, detecta:

1. Plataforma web (WordPress, Wix, Shopify, custom)
2. Certificado SSL (HTTPS sí/no)
3. Edad dominio aproximada (Whois lookup)
4. Presencia redes sociales activas

Añade columnas:
- Plataforma: WordPress/Wix/Shopify/Custom/Desconocido
- HTTPS: Sí/No
- Dominio_Años: Estimación antigüedad (1/3/5/10+)
- RRSS_Activas: Facebook,Instagram,LinkedIn (las que tenga)
```

**Por qué esto importa:**
- WordPress → Más fácil auditar (headers accesibles)
- Sin HTTPS → CRÍTICO (pitch más fuerte)
- Dominio viejo → Empresa establecida (más presupuesto)
- RRSS activas → Empresa seria (no fantasma)

---

## 📋 CHECKLIST USO PROMPT

- [ ] Copiar prompt completo a ChatGPT/Agy
- [ ] Especificar zona (Madrid Centro, Arnhem, etc.)
- [ ] Confirmar sectores prioritarios
- [ ] Esperar 30-60 min (Agy trabaja)
- [ ] Descargar CSV generado
- [ ] Validar calidad (Abraham)
- [ ] Escanear con ARGUS (manual hasta automatizar)
- [ ] Entregar a ventas con priorización

---

## 🎯 OBJETIVO FINAL

**Entrada:** Zona geográfica  
**Salida:** 100 leads priorizados listos para contactar  
**Tiempo:** 60 min Agy + 50 min ARGUS = **110 min total**  
**Resultado:** Lista para semana completa de ventas

**Sin esto:** 4h/día prospección manual × 5 días = 20h  
**Con esto:** 110 min = 1.8h  

**Ahorro tiempo:** 18.2h (11× más eficiente)

---

**PRÓXIMA ACCIÓN:** Copiar prompt y probar con Madrid Centro (test).

**PREPARADO POR:** Abraham Haddioui  
**PARA:** Uso con ChatGPT/Agy en modo agente  
**VERSIÓN:** 1.0
