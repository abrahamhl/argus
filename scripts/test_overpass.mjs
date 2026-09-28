async function test() {
  const query = `[out:json][timeout:25];
area["name"="Wageningen"]->.searchArea;
(
  node["website"](area.searchArea);
  way["website"](area.searchArea);
);
out center 50;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ArgusLeadIntel/1.0 (argus@audit.local)'
      },
      body: 'data=' + encodeURIComponent(query)
    });
    const text = await res.text();
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
    try {
      const json = JSON.parse(text);
      console.log('Got Wageningen elements:', json.elements?.length);
      if (json.elements && json.elements.length > 0) {
        console.log('Sample:', JSON.stringify(json.elements[0], null, 2));
      }
    } catch {
      console.log('Body prefix:', text.substring(0, 300));
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

test();
