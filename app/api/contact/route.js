import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 簡易頻率限制：同一 IP 每 10 分鐘最多 3 封
const RECENT = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (RECENT.get(ip) || []).filter((t) => now - t < 600000);
  list.push(now);
  RECENT.set(ip, list);
  if (RECENT.size > 500) RECENT.clear();
  return list.length > 3;
}

export async function POST(req) {
  try {
    const b = await req.json();
    const name = String(b.name || '').trim().slice(0, 40);
    const email = String(b.email || '').trim().slice(0, 80);
    const topic = String(b.topic || '').trim().slice(0, 40);
    const message = String(b.message || '').trim().slice(0, 3000);
    const hp = String(b.website || '');          // 蜜罐欄位，機器人才會填

    if (hp) return NextResponse.json({ ok: true });   // 靜默忽略機器人
    if (!name || !email || !message) {
      return NextResponse.json({ error: '請填寫姓名、Email 與訊息內容。' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email 格式看起來不正確，請再確認一次。' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (tooMany(ip)) {
      return NextResponse.json({ error: '訊息傳送太頻繁，請稍後再試。' }, { status: 429 });
    }

    const key = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_EMAIL;
    if (!key || !to) {
      return NextResponse.json(
        { error: '聯絡表單尚未啟用，請透過社群訊息與我聯繫。' }, { status: 503 });
    }

    const esc = (s) => s.replace(/[<>&]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]));
    const html = `
      <div style="font-family:sans-serif;line-height:1.8;color:#443A31">
        <h2 style="color:#5C4A3A;border-bottom:2px solid #D9CDBA;padding-bottom:8px">
          網站來信
        </h2>
        <p><b>姓名：</b>${esc(name)}</p>
        <p><b>Email：</b><a href="mailto:${esc(email)}">${esc(email)}</a></p>
        ${topic ? `<p><b>諮詢項目：</b>${esc(topic)}</p>` : ''}
        <p><b>訊息：</b></p>
        <div style="background:#FBF8F1;border:1px solid #D9CDBA;border-radius:8px;padding:16px;white-space:pre-wrap">${esc(message)}</div>
        <p style="font-size:12px;color:#A2937F;margin-top:20px">
          直接回覆這封信即可聯絡對方。
        </p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'J頁有光 <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `【網站來信】${name}${topic ? '・' + topic : ''}`,
        html,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: '訊息傳送失敗，請稍後再試或透過社群聯繫。' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '訊息傳送失敗，請稍後再試。' }, { status: 500 });
  }
}
