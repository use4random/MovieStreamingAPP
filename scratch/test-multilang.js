const multiLangNodes = [
  {
    id: 'vidsrc_cc',
    name: 'VidSrc CC Multi-Lang',
    quality: '4K Multi-Audio & Sub',
    movie: 'https://vidsrc.cc/v2/embed/movie/550',
    tv: 'https://vidsrc.cc/v2/embed/tv/1399/1/1'
  },
  {
    id: 'embed_su',
    name: 'Embed.su Multi-Audio',
    quality: '4K Multi-Lang',
    movie: 'https://embed.su/embed/movie/550',
    tv: 'https://embed.su/embed/tv/1399/1/1'
  },
  {
    id: 'vidsrc_su',
    name: 'VidSrc SU Multi-Lang',
    quality: '4K Global Multi-Audio',
    movie: 'https://vidsrc.su/embed/movie/550',
    tv: 'https://vidsrc.su/embed/tv/1399/1/1'
  },
  {
    id: 'vidbinge',
    name: 'VidBinge Multi-Sub',
    quality: '1080p Multi-Sub',
    movie: 'https://vidbinge.dev/embed/movie/550',
    tv: 'https://vidbinge.dev/embed/tv/1399/1/1'
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed Global',
    quality: '1080p Multi-Audio',
    movie: 'https://multiembed.mov/?video_id=550&tmdb=1',
    tv: 'https://multiembed.mov/?video_id=1399&tmdb=1&s=1&e=1'
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed Multi-Server',
    quality: '1080p Multi-Sub',
    movie: 'https://autoembed.co/movie/tmdb/550',
    tv: 'https://autoembed.co/tv/tmdb/1399-1-1'
  },
  {
    id: 'smashystream',
    name: 'SmashyStream Multi-Lang',
    quality: '1080p Multi-Audio',
    movie: 'https://player.smashy.stream/movie/550',
    tv: 'https://player.smashy.stream/tv/1399?s=1&e=1'
  },
  {
    id: 'vidsrc_vip',
    name: 'VidSrc VIP Multi-Lang',
    quality: '1080p HD Multi-Lang',
    movie: 'https://vidsrc.vip/embed/movie/550',
    tv: 'https://vidsrc.vip/embed/tv/1399/1/1'
  },
  {
    id: 'vidlink',
    name: 'VidLink HD',
    quality: '4K Ultra HDR',
    movie: 'https://vidlink.pro/movie/550',
    tv: 'https://vidlink.pro/tv/1399/1/1'
  },
  {
    id: 'vidsrc_me',
    name: 'VidSrc Classic',
    quality: '1080p Ultra',
    movie: 'https://vidsrc.me/embed/movie?tmdb=550',
    tv: 'https://vidsrc.me/embed/tv?tmdb=1399&season=1&episode=1'
  }
];

async function runTest() {
  console.log('Testing Multi-Language Streaming Nodes Availability & Response Time...\n');
  for (const n of multiLangNodes) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(n.movie, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      const duration = Date.now() - start;
      const text = await res.text().catch(() => '');
      const hasContent = text.length > 500 && !text.includes('Error 404');
      console.log(`[${n.id}] ${n.name}: HTTP ${res.status} (${duration}ms) | Content Length: ${text.length} | Valid: ${hasContent}`);
    } catch(e) {
      const duration = Date.now() - start;
      console.log(`[${n.id}] ${n.name}: FAILED - ${e.message} (${duration}ms)`);
    }
  }
}

runTest();
