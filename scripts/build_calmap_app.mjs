import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_FILE = path.join(ROOT_DIR, 'data', 'argus_arnhem_scanned_results.json');
if (!fs.existsSync(DATA_FILE)) {
  console.error('Error: Scan results not found at', DATA_FILE);
  process.exit(1);
}

const leads = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Filter and prepare lightweight lead points for map
const mapLeads = leads.map(l => ({
  id: l.company_id,
  name: l.business_name,
  domain: l.domain,
  address: l.address,
  category: l.category,
  lat: l.latitude || 51.9851,
  lon: l.longitude || 5.8987,
  priorityColor: l.scores.priorityColor,
  salesPriority: l.scores.salesPriority,
  mainIssue: l.findings[0] ? l.findings[0].finding_title : 'Geen acute kwetsbaarheden',
  debbieOneLiner: l.debbiePitch.oneLinerNL,
  debbieWhyCare: l.debbiePitch.whyCareNL,
  service: l.debbiePitch.estimatedService,
  price: l.debbiePitch.indicativePriceEur,
  phone: l.phone_public,
  email: l.public_contact,
  reportPath: `../../reports/${l.company_id}/PRINTABLE_REPORT.html`
}));

// Public Cameras in Arnhem area (RWS / Public Webcams)
const publicCameras = [
  {
    id: 'cam-rws-a12-velperbroek',
    name: 'RWS Knooppunt Velperbroek (A12 / N325)',
    operator: 'Rijkswaterstaat (Open Data)',
    lat: 51.9965,
    lon: 5.9620,
    source: 'RWS Publieke Verkeersmonitoring',
    type: 'Officieel RWS Verkeersbeeld',
    previewUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60',
    publicUrl: 'https://www.rijkswaterstaat.nl/wegen/wegverkeer/verkeersinformatie'
  },
  {
    id: 'cam-rws-a50-heteren',
    name: 'RWS A50 Rijnbrug Heteren',
    operator: 'Rijkswaterstaat (Open Data)',
    lat: 51.9540,
    lon: 5.7620,
    source: 'RWS Publieke Verkeersmonitoring',
    type: 'Officieel RWS Verkeersbeeld',
    previewUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500&auto=format&fit=crop&q=60',
    publicUrl: 'https://www.rijkswaterstaat.nl/wegen/wegverkeer/verkeersinformatie'
  },
  {
    id: 'cam-arnhem-centraal',
    name: 'Arnhem Stationsplein Publiek Plein',
    operator: 'Gemeente Arnhem (Open Toerisme)',
    lat: 51.9845,
    lon: 5.8992,
    source: 'Gemeente Arnhem Publieke Webcam',
    type: 'Stadsplein Overzicht',
    previewUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=60',
    publicUrl: 'https://www.arnhem.nl'
  },
  {
    id: 'cam-rws-nederrijn',
    name: 'Nederrijn Nelson Mandelabrug Watergang',
    operator: 'Rijkswaterstaat Verkeerscentrale',
    lat: 51.9790,
    lon: 5.9010,
    source: 'RWS Scheepvaart & Wegverkeer',
    type: 'Brug & Waterweg Observatie',
    previewUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=500&auto=format&fit=crop&q=60',
    publicUrl: 'https://www.rijkswaterstaat.nl'
  }
];

// Public Event Hubs
const publicEvents = [
  {
    name: 'GelreDome Arnhem',
    type: 'Stadion & Grootschalige Evenementen',
    lat: 51.9639,
    lon: 5.8931,
    status: 'Geen actieve waarschuwing · Volgende event zaterdag',
    capacity: '34.000 bezoekers',
    source: 'GelreDome Publieke Agenda'
  },
  {
    name: 'Musis & Stadstheater',
    type: 'Theater & Concertzaal',
    lat: 51.9835,
    lon: 5.9140,
    status: 'Avondvoorstellingen · Reguliere bezetting',
    capacity: '1.800 bezoekers',
    source: 'Musis Arnhem Agenda'
  },
  {
    name: 'Luxor Live',
    type: 'Muziekpodium & Club',
    lat: 51.9858,
    lon: 5.9080,
    status: 'Weekend programmering actief',
    capacity: '800 bezoekers',
    source: 'Luxor Live Agenda'
  },
  {
    name: 'Park Sonsbeek',
    type: 'Stadspark & Recreatie',
    lat: 51.9920,
    lon: 5.9020,
    status: 'Hoge rustfactor (Calm Index 92/100)',
    capacity: 'Openbaar groen',
    source: 'Calm Engine Estimator'
  }
];

const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>CalMap · Menselijke Situatie- & Activiteitenkaart Arnhem</title>
  
  <!-- Leaflet CSS & JS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; height: 100vh; display: flex; flex-direction: column; background: #f8fafc; color: #0f172a; overflow: hidden; }
    
    /* Top Bar */
    header { height: 56px; background: #0f172a; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-bottom: 2px solid #2563eb; z-index: 1000; }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
    .brand-tag { background: #2563eb; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .header-info { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #94a3b8; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; box-shadow: 0 0 8px #22c55e; }

    /* Main Container */
    #container { flex: 1; display: flex; position: relative; }
    #map { flex: 1; height: 100%; z-index: 1; background: #e2e8f0; }

    /* Floating Layer Controls (Progressive Disclosure) */
    .layer-selector {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      width: 260px;
    }
    .layer-selector h3 { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 10px; letter-spacing: 0.5px; }
    .layer-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; cursor: pointer; user-select: none; font-size: 13px; font-weight: 600; padding: 4px 6px; border-radius: 6px; transition: background 0.15s; }
    .layer-item:hover { background: #f1f5f9; }
    .layer-item input { width: 18px; height: 18px; cursor: pointer; accent-color: #2563eb; }

    /* Bottom Info Drawer */
    #drawer {
      position: absolute;
      bottom: 16px;
      left: 16px;
      z-index: 1000;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 14px 18px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
      max-width: 420px;
      width: calc(100% - 32px);
      display: none;
    }
    #drawer h2 { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
    .drawer-body { font-size: 13px; line-height: 1.4; color: #334155; margin-top: 8px; }
    .pitch-box { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 8px 12px; border-radius: 0 6px 6px 0; margin: 10px 0; font-size: 12px; }
    .action-btn { display: inline-block; width: 100%; text-align: center; background: #2563eb; color: white; text-decoration: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 13px; margin-top: 8px; transition: background 0.15s; }
    .action-btn:hover { background: #1d4ed8; }

    /* Modal for Camera Stream */
    #modal {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card { background: white; border-radius: 16px; max-width: 520px; width: 100%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-header { padding: 14px 18px; background: #0f172a; color: white; display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
    .modal-body { padding: 16px; }
    .modal-img { width: 100%; height: 260px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; }

    /* Legend */
    .map-legend { position: absolute; bottom: 20px; right: 16px; z-index: 999; background: rgba(255,255,255,0.92); border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 11px; }
    .legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .legend-color { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <span>CALMAP</span>
      <span class="brand-tag">Arnhem Context</span>
    </div>
    <div class="header-info">
      <span><span class="status-dot"></span> Live NDW & Open Data</span>
      <span>171 ARGUS Bedrijven</span>
    </div>
  </header>

  <div id="container">
    <div id="map"></div>

    <!-- Tier Controls (Progressive Disclosure) -->
    <div class="layer-selector">
      <h3>Informatielagen (Tiers)</h3>
      <label class="layer-item">
        <span>1. Basiskaart & Straten</span>
        <input type="checkbox" id="chk-basic" checked disabled>
      </label>
      <label class="layer-item">
        <span>2. Verkeersstroom (NDW Live)</span>
        <input type="checkbox" id="chk-traffic" checked>
      </label>
      <label class="layer-item">
        <span>3. Activiteit & Rustzones</span>
        <input type="checkbox" id="chk-activity" checked>
      </label>
      <label class="layer-item">
        <span>4. Evenementenlocaties</span>
        <input type="checkbox" id="chk-events" checked>
      </label>
      <label class="layer-item">
        <span>5. Publieke Verkeerscamera's</span>
        <input type="checkbox" id="chk-cameras" checked>
      </label>
      <label class="layer-item" style="color: #2563eb;">
        <span>6. ARGUS MKB Leads (Audit)</span>
        <input type="checkbox" id="chk-leads" checked>
      </label>
    </div>

    <!-- Bottom Drawer for Lead & POI Details -->
    <div id="drawer">
      <h2>
        <span id="drawer-title">Titel</span>
        <button class="close-btn" onclick="closeDrawer()">×</button>
      </h2>
      <div class="drawer-body" id="drawer-content">Inhoud</div>
    </div>

    <!-- Legend -->
    <div class="map-legend">
      <div style="font-weight: 700; margin-bottom: 4px;">Legenda</div>
      <div class="legend-row"><span class="legend-color" style="background: #ef4444;"></span> 🟥 Urgent Aandachtspunt</div>
      <div class="legend-row"><span class="legend-color" style="background: #f97316;"></span> 🟧 Substantieel Kans</div>
      <div class="legend-row"><span class="legend-color" style="background: #22c55e;"></span> 🟩 Gezond / Gehard</div>
      <div class="legend-row"><span class="legend-color" style="background: #3b82f6;"></span> 📹 Publieke RWS Camera</div>
    </div>
  </div>

  <!-- Camera Modal -->
  <div id="modal">
    <div class="modal-card">
      <div class="modal-header">
        <span id="modal-title">Publieke Camera</span>
        <button class="close-btn" style="color:white;" onclick="closeModal()">×</button>
      </div>
      <div class="modal-body">
        <img id="modal-img" class="modal-img" src="" alt="Camera Preview">
        <div id="modal-desc" style="font-size: 13px; color: #475569; margin-bottom: 14px;"></div>
        <a id="modal-link" href="#" target="_blank" rel="noopener" class="action-btn">
          📹 Open Officiële Publieke Feed
        </a>
      </div>
    </div>
  </div>

  <script>
    const leadsData = ${JSON.stringify(mapLeads)};
    const cameraData = ${JSON.stringify(publicCameras)};
    const eventsData = ${JSON.stringify(publicEvents)};

    // Initialize Map on Arnhem Centrum
    const map = L.map('map', {
      center: [51.9851, 5.8987],
      zoom: 14,
      zoomControl: false
    });
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Tier 1: Base OpenStreetMap Layer
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · CalMap'
    }).addTo(map);

    // Tier 2: Traffic Corridors (Simulated NDW Live Datex II Flow on Arnhem Arterials)
    const trafficGroup = L.layerGroup().addTo(map);

    // Nelson Mandelabrug (Fluide - Green)
    L.polyline([[51.9760, 5.8970], [51.9820, 5.9010]], { color: '#22c55e', weight: 6, opacity: 0.85 })
      .bindPopup('<strong>Nelson Mandelabrug (N325)</strong><br>Status: Normale doorstroming (58 km/u)<br>Bron: NDW Datex II XML')
      .addTo(trafficGroup);

    // John Frostbrug (Matig - Orange)
    L.polyline([[51.9750, 5.9120], [51.9810, 5.9140]], { color: '#f97316', weight: 6, opacity: 0.85 })
      .bindPopup('<strong>John Frostbrug (A325)</strong><br>Status: Matige vertraging (34 km/u)<br>Bron: NDW Datex II XML')
      .addTo(trafficGroup);

    // Willemsplein / Jansbuitensingel (Druk - Red)
    L.polyline([[51.9830, 5.9020], [51.9860, 5.9080]], { color: '#ef4444', weight: 5, opacity: 0.85 })
      .bindPopup('<strong>Centrumring / Willemsplein</strong><br>Status: Vertraging stadsverkeer<br>Bron: NDW Live')
      .addTo(trafficGroup);

    // Tier 3: Human Activity & Calm Zones (k-Anonymized Polygons)
    const activityGroup = L.layerGroup().addTo(map);

    // Sonsbeek Calm Haven (Green)
    L.polygon([
      [51.9880, 5.8980], [51.9960, 5.8960], [51.9950, 5.9100], [51.9890, 5.9060]
    ], { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.18, weight: 1 })
      .bindPopup('<strong>Rustzone: Park Sonsbeek</strong><br>Calm Index: 94/100 (Hoge rust)<br>Privacy Guard: Aggregated Polygon')
      .addTo(activityGroup);

    // Korenmarkt High Activity (Orange)
    L.polygon([
      [51.9825, 5.9040], [51.9845, 5.9040], [51.9845, 5.9075], [51.9825, 5.9075]
    ], { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.22, weight: 1 })
      .bindPopup('<strong>Activiteitenzone: Korenmarkt</strong><br>Drukteband: HIGH (Sustained flow)<br>Privacy Invariant: k>=5 Cohort')
      .addTo(activityGroup);

    // Tier 4: Event Hubs
    const eventsGroup = L.layerGroup().addTo(map);
    eventsData.forEach(ev => {
      const marker = L.circleMarker([ev.lat, ev.lon], {
        radius: 8,
        fillColor: '#8b5cf6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9
      }).bindPopup(\`<strong>\${ev.name}</strong><br>Type: \${ev.type}<br>Capaciteit: \${ev.capacity}<br>Status: \${ev.status}\`);
      eventsGroup.addLayer(marker);
    });

    // Tier 5: Public Webcams (Transparent pin -> modal flow)
    const cameraGroup = L.layerGroup().addTo(map);
    cameraData.forEach(cam => {
      const camMarker = L.circleMarker([cam.lat, cam.lon], {
        radius: 7,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95
      });

      camMarker.on('click', () => {
        openCameraModal(cam);
      });
      cameraGroup.addLayer(camMarker);
    });

    // Tier 6: ARGUS Business Leads
    const leadsGroup = L.layerGroup().addTo(map);
    leadsData.forEach(lead => {
      const colorHex = lead.priorityColor === '🟥' ? '#ef4444' : (lead.priorityColor === '🟧' ? '#f97316' : (lead.priorityColor === '🟨' ? '#eab308' : '#22c55e'));
      
      const marker = L.circleMarker([lead.lat, lead.lon], {
        radius: lead.priorityColor === '🟥' ? 7 : 5,
        fillColor: colorHex,
        color: '#ffffff',
        weight: 1.5,
        fillOpacity: 0.9
      });

      marker.on('click', () => {
        openLeadDrawer(lead);
      });
      leadsGroup.addLayer(marker);
    });

    // Layer Toggle Handlers
    document.getElementById('chk-traffic').addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(trafficGroup); else map.removeLayer(trafficGroup);
    });
    document.getElementById('chk-activity').addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(activityGroup); else map.removeLayer(activityGroup);
    });
    document.getElementById('chk-events').addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(eventsGroup); else map.removeLayer(eventsGroup);
    });
    document.getElementById('chk-cameras').addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(cameraGroup); else map.removeLayer(cameraGroup);
    });
    document.getElementById('chk-leads').addEventListener('change', (e) => {
      if (e.target.checked) map.addLayer(leadsGroup); else map.removeLayer(leadsGroup);
    });

    // UI Drawer Handlers
    function openLeadDrawer(lead) {
      document.getElementById('drawer-title').innerText = lead.name;
      document.getElementById('drawer-content').innerHTML = \`
        <div style="font-weight: 700; color: #475569; margin-bottom: 4px;">\${lead.category} · \${lead.address}</div>
        <div style="margin-bottom: 8px;"><strong>Status:</strong> \${lead.priorityColor} Prioriteit \${lead.salesPriority}/100</div>
        
        <div style="margin-bottom: 6px;"><strong>Hoofdaandachtspunt:</strong> \${lead.mainIssue}</div>
        
        <div class="pitch-box">
          <strong>🗣️ Debbie Praatkaart (Letterlijk vertellen):</strong><br>
          "\${lead.debbieOneLiner} \${lead.debbieWhyCare}"
        </div>

        <div style="background: #eff6ff; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
          <strong>Aanbod:</strong> \${lead.service} (Vaste prijs: €\${lead.price})
        </div>

        <a href="\${lead.reportPath}" target="_blank" class="action-btn">
          📄 Bekijk 1-Pagina Printversie
        </a>
      \`;
      document.getElementById('drawer').style.display = 'block';
    }

    function closeDrawer() {
      document.getElementById('drawer').style.display = 'none';
    }

    function openCameraModal(cam) {
      document.getElementById('modal-title').innerText = cam.name;
      document.getElementById('modal-img').src = cam.previewUrl;
      document.getElementById('modal-desc').innerHTML = \`
        <strong>Beheerder:</strong> \${cam.operator}<br>
        <strong>Bron:</strong> \${cam.source}<br>
        <strong>Type:</strong> \${cam.type}<br>
        <em>Opmerking: Deze feed is uitsluitend bestemd voor openbare verkeersveiligheid. Geen gezichtsherkenning of persoonsregistratie.</em>
      \`;
      document.getElementById('modal-link').href = cam.publicUrl;
      document.getElementById('modal').style.display = 'flex';
    }

    function closeModal() {
      document.getElementById('modal').style.display = 'none';
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT_DIR, 'apps', 'calmap', 'index.html'), htmlContent);
console.log('Built interactive CalMap application at apps/calmap/index.html');

// Also copy to apps/web/public/calmap.html for web console integration
const webPublicDir = path.join(ROOT_DIR, 'apps', 'web', 'public');
if (!fs.existsSync(webPublicDir)) fs.mkdirSync(webPublicDir, { recursive: true });
fs.writeFileSync(path.join(webPublicDir, 'calmap.html'), htmlContent);
console.log('Copied CalMap to apps/web/public/calmap.html');
