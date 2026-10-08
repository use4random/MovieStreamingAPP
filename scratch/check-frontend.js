const targetDomain = 'https://binge-streaming-three.vercel.app';

async function inspectFrontend() {
  console.log('=== INSPECTING LIVE FRONTEND BUNDLES & API ===');
  console.log('Fetching:', targetDomain);
  
  const res = await fetch(targetDomain);
  console.log('Index HTML status:', res.status);
  const html = await res.text();
  console.log('Index HTML length:', html.length);

  // Extract scripts
  const scriptRegex = /src=["']([^"']+)["']/g;
  let match;
  const scripts = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  console.log('Scripts in HTML:', scripts);

  for (const s of scripts) {
    const fullUrl = new URL(s, targetDomain).href;
    const sRes = await fetch(fullUrl);
    console.log(`Script ${fullUrl} -> HTTP ${sRes.status} (${sRes.headers.get('content-type')})`);
  }

  // Test client API calls that frontend react-query makes on load:
  console.log('\n--- Checking Frontend API endpoints ---');
  
  const endpoints = [
    '/api/trending',
    '/api/platform/trending_day',
    '/api/collections',
    '/api/genres?type=movie',
    '/api/auth/me',
    '/api/servers?type=movie&id=550',
    '/api/media/movie/550'
  ];

  for (const ep of endpoints) {
    const epUrl = `${targetDomain}${ep}`;
    const epRes = await fetch(epUrl);
    console.log(`Endpoint ${ep} -> HTTP ${epRes.status}`);
    if (!epRes.ok) {
      console.error(`❌ ERROR on ${ep}: Status ${epRes.status}`);
    } else {
      const data = await epRes.json();
      const keys = Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data).slice(0, 5).join(', ');
      console.log(`  ✓ OK (${keys})`);
    }
  }
}

inspectFrontend();
