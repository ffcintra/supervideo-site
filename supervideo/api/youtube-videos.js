// api/youtube-videos.js
// Vercel Serverless Function — busca RSS do YouTube server-side (sem CORS)
// Deploy: coloque este arquivo em /api/youtube-videos.js no seu repositório

export default async function handler(req, res) {
  // Permite chamadas do próprio site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // cache 1h na CDN

  // Tenta primeiro com handle, depois com channel_id
  const urls = [
    'https://www.youtube.com/feeds/videos.xml?user=supervideovarejo',
    'https://www.youtube.com/feeds/videos.xml?channel_id=UCHuWz6K-JEbJzEfmHVbhFEg',
  ];

  let xml = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' }
      });
      if (r.ok) {
        const text = await r.text();
        if (text.includes('<entry>')) { xml = text; break; }
      }
    } catch (_) {}
  }

  if (!xml) {
    return res.status(502).json({ error: 'Não foi possível buscar o RSS do YouTube' });
  }

  // Parse simples do XML sem dependências externas
  const videos = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null && videos.length < 4) {
    const entry = match[1];
    const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    if (videoIdMatch) {
      videos.push({
        id: videoIdMatch[1].trim(),
        title: titleMatch ? titleMatch[1].trim() : 'Vídeo Solar',
      });
    }
  }

  res.status(200).json({ videos });
}
