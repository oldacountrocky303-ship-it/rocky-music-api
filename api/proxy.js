const axios = require('axios');

/**
 * @author Rocky
 * @description Proxy — streams video through server to bypass CORS
 */

module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required', author: 'Rocky' });

  let decoded;
  try { decoded = decodeURIComponent(url); } catch { decoded = url; }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range, Accept-Ranges');
  res.setHeader('X-Author', 'Rocky');

  try {
    const upstream = await axios({
      method: 'GET',
      url: decoded,
      responseType: 'stream',
      timeout: 120000,
      maxContentLength: 250 * 1024 * 1024,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.tiktok.com/',
        'Range': req.headers['range'] || 'bytes=0-'
      }
    });

    const ct = upstream.headers['content-type'] || 'video/mp4';
    const cl = upstream.headers['content-length'];
    const cr = upstream.headers['content-range'];
    const ar = upstream.headers['accept-ranges'];

    res.setHeader('Content-Type', ct);
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);
    if (ar) res.setHeader('Accept-Ranges', ar);

    res.status(upstream.status === 206 ? 206 : 200);
    upstream.data.pipe(res);

  } catch (e) {
    console.error('[Rocky Proxy]', e.message);
    if (!res.headersSent) res.status(502).json({ error: 'Proxy error', author: 'Rocky' });
  }
};
