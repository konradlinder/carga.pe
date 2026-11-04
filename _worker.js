// Cloudflare Pages (subida directa, modo avanzado _worker.js): sirve carga.pe/nombre-agencia con datos reales (estado 200) o 404 si no existe.
// Cualquier otra ruta (/, /index.html, /robots.txt, /hero.jpg…) pasa directo a los archivos del sitio.

const SUPABASE_URL = 'https://wrpovcjoenhgkatocclk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycG92Y2pvZW5oZ2thdG9jY2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjI5OTEsImV4cCI6MjEwOTEzODk5MX0.qkQNP9SwpqFZ3jA0HZKuc7CwL0mN58Bfk-Yhj4x8b94';
const INDEXAR = false; // cámbialo a true cuando quieras que Google pueda indexar las páginas de agencias
const SLUG = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = String.fromCharCode(8232), PS = String.fromCharCode(8233);
const jsonSeguro = o => JSON.stringify(o).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');

async function plantilla(env, url) {
  let r = await env.ASSETS.fetch(new Request(new URL('/agencia', url)));
  for (let i = 0; i < 2 && r.status >= 300 && r.status < 400 && r.headers.get('Location'); i++)
    r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('Location'), url)));
  return r.text();
}

async function manejar(request, env) {
  const next = () => env.ASSETS.fetch(request);
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const url = new URL(request.url);
  const m = decodeURIComponent(url.pathname).toLowerCase().match(SLUG);
  if (!m) return next();
  const slug = m[1];

  let ag, fallo = false;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/agencia_publica', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: slug }),
    });
    if (!r.ok) throw new Error('supabase ' + r.status);
    ag = await r.json(); // objeto o null
  } catch (e) { fallo = true; }

  let html = await plantilla(env, url);
  const encontrada = !fallo && ag;
  const indexable = INDEXAR && encontrada;
  const canon = 'https://carga.pe/' + slug;
  const titulo = encontrada ? `${esc(ag.nombre)} · Agencia de carga · carga.pe` : 'Página no encontrada · carga.pe';
  const desc = encontrada ? esc((ag.bajada || 'Envíos de carga por tierra a todo el Perú.') + ' Rastrea tu envío con carga.pe.') : '';

  let head = '';
  if (encontrada) {
    head += `<link rel="canonical" href="${canon}">
<meta name="description" content="${desc}">
<meta property="og:type" content="website"><meta property="og:title" content="${titulo}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${canon}"><meta property="og:image" content="https://carga.pe/og-image.jpg">
<script type="application/ld+json">${jsonSeguro({
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: ag.nombre, url: canon,
      ...(ag.telefono ? { telephone: ag.telefono } : {}), ...(ag.email ? { email: ag.email } : {}),
      ...(ag.direccion ? { address: ag.direccion } : {}), ...(ag.horario ? { openingHours: ag.horario } : {}),
    })}</script>`;
  }
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo}</title>`)
    .replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${indexable ? 'index,follow' : 'noindex,nofollow'}">`)
    .replace('<!--AG_HEAD-->', head)
    .replace('<!--AG_DATA-->', fallo ? '' : `<script>window.__AG=${jsonSeguro(ag)};</script>`);

  return new Response(request.method === 'HEAD' ? null : html, {
    status: fallo || ag ? 200 : 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      ...(indexable ? {} : { 'X-Robots-Tag': 'noindex, nofollow' }),
    },
  });
}

export default { fetch: (request, env) => manejar(request, env) };
