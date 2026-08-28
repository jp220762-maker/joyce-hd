import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const K = 'hd:images';

function hasKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
async function kv(cmd) {
  const r = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd), cache: 'no-store',
  });
  if (!r.ok) throw new Error('kv ' + r.status);
  return (await r.json()).result;
}
function authed(req) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  return (new URL(req.url).searchParams.get('key') || '') === key;
}

// 上傳：接收 base64 圖片，存進 Redis，回傳可用網址
export async function POST(req) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const { slot, dataUrl } = await req.json();
    if (!/^[a-z0-9_-]{1,60}$/i.test(slot || '')) {
      return NextResponse.json({ error: '未知的圖片欄位' }, { status: 400 });
    }
    if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(dataUrl || '')) {
      return NextResponse.json({ error: '請上傳 PNG、JPG 或 WebP 圖片' }, { status: 400 });
    }
    // 限制 2MB（base64 後約 2.7MB）
    if (dataUrl.length > 2_800_000) {
      return NextResponse.json({ error: '圖片太大，請壓縮到 2MB 以內' }, { status: 400 });
    }
    if (!hasKV()) return NextResponse.json({ error: '資料庫尚未設定' }, { status: 503 });

    await kv(['HSET', K, slot, dataUrl]);
    return NextResponse.json({ ok: true, url: `/api/upload?slot=${slot}&v=${Date.now()}` });
  } catch (e) {
    return NextResponse.json({ error: e.message || '上傳失敗' }, { status: 500 });
  }
}

// 讀取：以圖片形式輸出（公開，不需授權）
export async function GET(req) {
  const slot = new URL(req.url).searchParams.get('slot');
  if (!slot) return new Response('missing slot', { status: 400 });
  try {
    if (!hasKV()) return new Response('not found', { status: 404 });
    const dataUrl = await kv(['HGET', K, slot]);
    if (!dataUrl) return new Response('not found', { status: 404 });
    const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return new Response('bad data', { status: 500 });
    return new Response(Buffer.from(m[2], 'base64'), {
      headers: { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    return new Response('error', { status: 500 });
  }
}
