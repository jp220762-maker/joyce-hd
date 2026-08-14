// lib/usage.js — 使用紀錄（優先寫入 Vercel KV，未設定時退回記憶體暫存）
import crypto from 'crypto';

// 由 IP + User-Agent 產生匿名識別碼（單向雜湊，無法還原）
export function visitorId(headers) {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || headers.get('x-real-ip') || 'unknown';
  const ua = headers.get('user-agent') || '';
  return crypto.createHash('sha256').update(ip + '|' + ua).digest('hex').slice(0, 16);
}

// 以台北時間計算日期（YYYY-MM-DD）
function taipeiDay(iso) {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t) => p.find((x) => x.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
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

// 依範圍組出圖表資料；範圍大時自動按月或年彙總，避免長條過多
function buildSeries(hitsMap, uvMap, days) {
  const allDays = new Set([...Object.keys(hitsMap), ...Object.keys(uvMap)]);
  if (days === 0) {                       // 全部
    const sorted = [...allDays].sort();
    if (sorted.length === 0) return [];
    const span = (new Date(sorted[sorted.length - 1]) - new Date(sorted[0])) / 86400000;
    if (span > 730) return groupBy(hitsMap, uvMap, allDays, 4);   // 依年
    if (span > 90) return groupBy(hitsMap, uvMap, allDays, 7);    // 依月
    return listDays(hitsMap, uvMap, sorted);
  }
  if (days > 730) return groupBy(hitsMap, uvMap, recentDays(days), 4);
  if (days > 90) return groupBy(hitsMap, uvMap, recentDays(days), 7);
  return listDays(hitsMap, uvMap, [...recentDays(days)].sort());
}
function recentDays(days) {
  const set = new Set();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    set.add(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d));
  }
  return set;
}
function listDays(hitsMap, uvMap, days) {
  return days.map((d) => ({ label: d, hits: hitsMap[d] || 0, uv: uvMap[d] || 0 }));
}
function groupBy(hitsMap, uvMap, dayset, sliceLen) {
  const acc = {};
  [...dayset].forEach((d) => {
    const key = d.slice(0, sliceLen);
    acc[key] ??= { label: key, hits: 0, uv: 0 };
    acc[key].hits += hitsMap[d] || 0;
    acc[key].uv += uvMap[d] || 0;   // 跨日相加為「活躍人次」近似值
  });
  return Object.values(acc).sort((a, b) => a.label.localeCompare(b.label));
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
      const day = taipeiDay(row.at);
      await kv(['HINCRBY', 'hd:daily:hits', day, '1']);   // 每日人次（永久保留）
      if (row.uid) {
        await kv(['SADD', 'hd:uv:all', row.uid]);         // 不重複訪客總集合
        const added = await kv(['SADD', 'hd:uv:' + day, row.uid]);
        await kv(['EXPIRE', 'hd:uv:' + day, '31536000']); // 當日明細保留一年
        if (added === 1) await kv(['HINCRBY', 'hd:daily:uv', day, '1']); // 每日不重複數（永久）
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
export async function readUsage(limit = 200, days = 14) {
  try {
    if (hasKV()) {
      const raw = await kv(['LRANGE', 'hd:usage', '0', String(limit - 1)]);
      const rows = (raw || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
      const total = Number(await kv(['GET', 'hd:count:total'])) || rows.length;
      const natal = Number(await kv(['GET', 'hd:count:natal'])) || 0;
      const transit = Number(await kv(['GET', 'hd:count:transit'])) || 0;
      const uvTotal = Number(await kv(['SCARD', 'hd:uv:all'])) || 0;

      // 由彙總表一次取回所有日期（HGETALL 回傳 [k1,v1,k2,v2,...] 或物件）
      const toMap = (raw) => {
        const m = {};
        if (!raw) return m;
        if (Array.isArray(raw)) {
          for (let i = 0; i < raw.length; i += 2) m[raw[i]] = Number(raw[i + 1]) || 0;
        } else if (typeof raw === 'object') {
          Object.entries(raw).forEach(([k, v]) => { m[k] = Number(v) || 0; });
        }
        return m;
      };
      const hitsMap = toMap(await kv(['HGETALL', 'hd:daily:hits']));
      const uvMap = toMap(await kv(['HGETALL', 'hd:daily:uv']));
      const daily = buildSeries(hitsMap, uvMap, days);
      return { rows, total, natal, transit, uvTotal, daily, persistent: true };
    }
  } catch {
    /* 落到記憶體版本 */
  }
  const rows = MEM.rows.slice(0, limit);
  const uvTotal = new Set(MEM.rows.map((r) => r.uid).filter(Boolean)).size;
  const hitsMap = {}, uvSets = {};
  MEM.rows.forEach((r) => {
    const d = taipeiDay(r.at);
    hitsMap[d] = (hitsMap[d] || 0) + 1;
    if (r.uid) (uvSets[d] ??= new Set()).add(r.uid);
  });
  const uvMap = {};
  Object.entries(uvSets).forEach(([d, s2]) => { uvMap[d] = s2.size; });
  return {
    rows,
    total: MEM.rows.length,
    natal: MEM.rows.filter((r) => r.kind === 'natal').length,
    transit: MEM.rows.filter((r) => r.kind === 'transit').length,
    uvTotal,
    daily: buildSeries(hitsMap, uvMap, days),
    persistent: false,
  };
}
