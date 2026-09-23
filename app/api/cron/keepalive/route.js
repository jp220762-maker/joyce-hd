// app/api/cron/keepalive/route.js
// 由 Vercel Cron 每天呼叫一次，對 Upstash Redis 做一次無害的讀取，
// 避免免費方案「30 天無存取即封存」的機制被觸發。
import { getContent } from '../../../../lib/store.js';

export const maxDuration = 10;

export async function GET(req) {
  // 若有設定 CRON_SECRET 環境變數，驗證呼叫來源；未設定則略過驗證（仍可運作）
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  try {
    await getContent(); // 對 KV 做一次 GET，足以讓資料庫維持在「有存取」狀態
    return Response.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
