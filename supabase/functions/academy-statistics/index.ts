const ALLOWED_ORIGIN = 'https://enjoji-road.github.io';
const MAX_BODY = 4096;

function cors(origin: string | null) {
  return { 'Access-Control-Allow-Origin': origin || ALLOWED_ORIGIN, 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
}
function allowedOrigin(origin: string | null) {
  if (origin === ALLOWED_ORIGIN) return true;
  try { const u = new URL(origin || ''); return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') && (u.protocol === 'http:' || u.protocol === 'https:'); } catch { return false; }
}
function response(origin: string | null, body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' } });
}
function secretKey() {
  try { const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); if (keys.default) return String(keys.default); } catch { /* legacy fallback below */ }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
  return [...bytes].map(v => v.toString(16).padStart(2, '0')).join('');
}
function clientIp(req: Request) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}
async function rpc(name: string, payload: unknown, key: string) {
  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/${name}`, { method: 'POST', headers: { 'apikey': key, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`RPC ${name} failed: ${res.status}`);
  return await res.json();
}

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  if (!allowedOrigin(origin)) return response(origin, { ok: false }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  const key = secretKey(); if (!key) return response(origin, { ok: false }, 503);
  try {
    const ip = clientIp(req), ipHash = ip ? await hmac(key, `ip:${ip}`) : null;
    if (req.method === 'GET' && new URL(req.url).searchParams.get('action') === 'summary') {
      const data = await rpc('academy_stats_summary', { p_ip_hash: ipHash }, key);
      return data?.ok ? response(origin, data, 200, 'public, max-age=60, s-maxage=120') : response(origin, { ok: false }, data?.reason === 'rate_limited' ? 429 : 400);
    }
    if (req.method !== 'POST') return response(origin, { ok: false }, 405);
    if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return response(origin, { ok: false }, 413);
    const raw = await req.text(); if (raw.length > MAX_BODY) return response(origin, { ok: false }, 413);
    const body = JSON.parse(raw);
    if (body?.action !== 'record' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.browser_id || '') || !Array.isArray(body.events)) return response(origin, { ok: false }, 400);
    const visitorHash = await hmac(key, `visitor:${body.browser_id.toLowerCase()}`);
    const data = await rpc('academy_stats_record', { p_visitor_hash: visitorHash, p_ip_hash: ipHash, p_events: body.events }, key);
    return data?.ok ? response(origin, { ok: true }) : response(origin, { ok: false }, data?.reason === 'rate_limited' ? 429 : 400);
  } catch { return response(origin, { ok: false }, 503); }
});
