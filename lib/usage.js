// lib/usage.js — 使用紀錄（優先寫入 Vercel KV，未設定時退回記憶體暫存）
import crypto from 'crypto';

// 由 IP + User-Agent 產生匿名識別碼（單向雜湊，無法還原）
export function visitorId(headers) {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip') || 'unknown';
  const ua = headers.get('user-agent') || '';
  return crypto.createHash('sha256').update(ip + '|' + ua).digest('hex').slice(0, 16);
}

const MEM = { rows: [] };
const MAX_MEM = 500;

function hasKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kv(command) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('kv error ' + res.status);
  const json = await res.json();
  return json.result;
}

// 記錄一次排盤
export async function logUsage(entry) {
  const row = {
    at: new Date().toISOString(),
    kind: entry.kind || 'natal',      // natal | transit
    name: (entry.name || '').slice(0, 24),
    birth: entry.birth || '',
    city: entry.city || '',
    type: entry.type || '',
    profile: entry.profile || '',
    uid: entry.uid || '',             // 匿名訪客識別（IP+UA 雜湊，不含個資）
  };
  try {
    if (hasKV()) {
      await kv(['LPUSH', 'hd:usage', JSON.stringify(row)]);
      await kv(['LTRIM', 'hd:usage', '0', '4999']);   // 最多保留 5000 筆
      await kv(['INCR', 'hd:count:' + row.kind]);
      await kv(['INCR', 'hd:count:total']);
      if (row.uid) {
        const day = row.at.slice(0, 10);              // YYYY-MM-DD（UTC）
        await kv(['SADD', 'hd:uv:all', row.uid]);     // 不重複訪客總集合
        await kv(['SADD', 'hd:uv:' + day, row.uid]);  // 當日不重複訪客
        await kv(['EXPIRE', 'hd:uv:' + day, '7776000']); // 保留 90 天
      }
    } else {
      MEM.rows.unshift(row);
      if (MEM.rows.length > MAX_MEM) MEM.rows.length = MAX_MEM;
    }
  } catch {
    // 記錄失敗不影響排盤功能
  }
}

// 讀取統計
export async function readUsage(limit = 200) {
  try {
    if (hasKV()) {
      const raw = await kv(['LRANGE', 'hd:usage', '0', String(limit - 1)]);
      const rows = (raw || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      const total = Number(await kv(['GET', 'hd:count:total'])) || rows.length;
      const natal = Number(await kv(['GET', 'hd:count:natal'])) || 0;
      const transit = Number(await kv(['GET', 'hd:count:transit'])) || 0;
      const uvTotal = Number(await kv(['SCARD', 'hd:uv:all'])) || 0;

      // 近 14 天每日不重複訪客
      const uvDaily = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        const n = Number(await kv(['SCARD', 'hd:uv:' + d])) || 0;
        uvDaily.push({ day: d, uv: n });
      }
      return { rows, total, natal, transit, uvTotal, uvDaily, persistent: true };
    }
  } catch {
    /* 落到記憶體版本 */
  }
  const rows = MEM.rows.slice(0, limit);
  const uvTotal = new Set(MEM.rows.map((r) => r.uid).filter(Boolean)).size;
  const uvDaily = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const set = new Set(MEM.rows.filter((r) => r.at.slice(0, 10) === d && r.uid).map((r) => r.uid));
    uvDaily.push({ day: d, uv: set.size });
  }
  return {
    rows,
    total: MEM.rows.length,
    natal: MEM.rows.filter((r) => r.kind === 'natal').length,
    transit: MEM.rows.filter((r) => r.kind === 'transit').length,
    uvTotal, uvDaily,
    persistent: false,
  };
}
