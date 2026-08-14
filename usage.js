// lib/usage.js — 使用紀錄（優先寫入 Vercel KV，未設定時退回記憶體暫存）
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
  };
  try {
    if (hasKV()) {
      await kv(['LPUSH', 'hd:usage', JSON.stringify(row)]);
      await kv(['LTRIM', 'hd:usage', '0', '4999']);   // 最多保留 5000 筆
      await kv(['INCR', 'hd:count:' + row.kind]);
      await kv(['INCR', 'hd:count:total']);
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
      return { rows, total, natal, transit, persistent: true };
    }
  } catch {
    /* 落到記憶體版本 */
  }
  const rows = MEM.rows.slice(0, limit);
  return {
    rows,
    total: MEM.rows.length,
    natal: MEM.rows.filter((r) => r.kind === 'natal').length,
    transit: MEM.rows.filter((r) => r.kind === 'transit').length,
    persistent: false,
  };
}
