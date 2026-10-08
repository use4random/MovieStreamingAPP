const testNodes = [
  { id: 'vidsrc_me', name: 'VidSrc Classic', url: 'https://vidsrc.me/embed/movie?tmdb=550' },
  { id: 'rive', name: 'RiveStream HD', url: 'https://rive.stream/embed?type=movie&id=550' },
  { id: 'embed_su', name: 'Embed.su 4K', url: 'https://embed.su/embed/movie/550' },
  { id: 'vidlink', name: 'VidLink Fast', url: 'https://vidlink.pro/movie/550' },
  { id: 'vidsrc_pm', name: 'VidSrc PM', url: 'https://vidsrc.pm/embed/movie/550' },
  { id: 'vidsrc_su', name: 'VidSrc SU', url: 'https://vidsrc.su/embed/movie/550' },
  { id: 'vidsrc_cc', name: 'VidSrc CC', url: 'https://vidsrc.cc/v2/embed/movie/550' },
  { id: 'autoembed', name: 'AutoEmbed Club', url: 'https://autoembed.co/movie/tmdb/550' },
  { id: 'frembed', name: 'FrEmbed Pro', url: 'https://frembed.pro/api/film.php?id=550' }
];

async function measureSpeed() {
  console.log('Testing Ultra-Fast 2026 Streaming Node Speeds...\n');
  for (const n of testNodes) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(n.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timer);
      const time = Date.now() - start;
      console.log(`[${n.id}] ${n.name}: HTTP ${res.status} (${time}ms)`);
    } catch(e) {
      const time = Date.now() - start;
      console.log(`[${n.id}] ${n.name}: FAILED (${e.message}) (${time}ms)`);
    }
  }
}

measureSpeed();
