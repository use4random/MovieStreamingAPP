const extraNodes = [
  { id: 'vidsrc_icu', name: 'VidSrc ICU Multi-Audio', movie: 'https://vidsrc.icu/embed/movie/550', tv: 'https://vidsrc.icu/embed/tv/1399/1/1' },
  { id: 'vidsrc_in', name: 'VidSrc IN Multi-Lang', movie: 'https://vidsrc.in/embed/movie/550', tv: 'https://vidsrc.in/embed/tv/1399/1/1' },
  { id: 'vidsrc_net', name: 'VidSrc NET Multi-Lang', movie: 'https://vidsrc.net/embed/movie/550', tv: 'https://vidsrc.net/embed/tv/1399/1/1' },
  { id: 'vidsrc_top', name: 'VidSrc TOP Multi-Lang', movie: 'https://vidsrc.top/embed/movie/550', tv: 'https://vidsrc.top/embed/tv/1399/1/1' },
  { id: 'vidsrc_stream', name: 'VidSrc Stream Multi-Lang', movie: 'https://vidsrc.stream/embed/movie/550', tv: 'https://vidsrc.stream/embed/tv/1399/1/1' },
  { id: 'nonton', name: 'Nonton CC Multi-Sub', movie: 'https://www.nonton.cc/embed/movie/550', tv: 'https://www.nonton.cc/embed/tv/1399/1/1' }
];

async function runExtraTest() {
  console.log('Testing Extra Multi-Language Nodes...\n');
  for (const n of extraNodes) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(n.movie, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      const duration = Date.now() - start;
      const text = await res.text().catch(() => '');
      const valid = text.length > 500 && res.status === 200;
      console.log(`[${n.id}] ${n.name}: HTTP ${res.status} (${duration}ms) | Length: ${text.length} | Valid: ${valid}`);
    } catch(e) {
      const duration = Date.now() - start;
      console.log(`[${n.id}] ${n.name}: FAILED - ${e.message} (${duration}ms)`);
    }
  }
}

runExtraTest();
