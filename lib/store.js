// lib/store.js — 文章與分類的儲存層（Upstash Redis，未設定時退回種子資料）
import { POSTS as SEED_POSTS, CATEGORIES as SEED_CATS } from './posts.js';
import { DEFAULT_CONTENT } from './content.js';
import { DEFAULT_TRANSIT_LINES } from './transitLines.js';

const K_POSTS = 'hd:posts';
const K_CATS = 'hd:cats';
const K_CONTENT = 'hd:content';
const K_TRANSIT = 'hd:transitlines';

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
  if (!res.ok) throw new Error('kv ' + res.status);
  return (await res.json()).result;
}

function estimate(body) {
  const chars = body.reduce((n, p) => n + p.length, 0);
  return { chars, minutes: Math.max(1, Math.round(chars / 400)) };
}

// 讀取全部文章（第一次讀取時自動把種子資料寫入資料庫）
export async function getAllPosts() {
  if (!hasKV()) return SEED_POSTS;
  try {
    const raw = await kv(['GET', K_POSTS]);
    if (raw) {
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(arr) && arr.length) return arr;
    }
    await kv(['SET', K_POSTS, JSON.stringify(SEED_POSTS)]);
    return SEED_POSTS;
  } catch {
    return SEED_POSTS;
  }
}

export async function getCategories() {
  if (!hasKV()) return SEED_CATS;
  try {
    const raw = await kv(['GET', K_CATS]);
    if (raw) {
      const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(arr) && arr.length) return arr;
    }
    await kv(['SET', K_CATS, JSON.stringify(SEED_CATS)]);
    return SEED_CATS;
  } catch {
    return SEED_CATS;
  }
}

export async function savePosts(posts) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法儲存');
  await kv(['SET', K_POSTS, JSON.stringify(posts)]);
}

export async function saveCategories(cats) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法儲存');
  await kv(['SET', K_CATS, JSON.stringify(cats)]);
}

export async function getPostById(id) {
  const posts = await getAllPosts();
  return posts.find((p) => p.id === id) || null;
}

// 新增
export async function createPost({ title, category, excerpt, body, image, showImage }) {
  const posts = await getAllPosts();
  const maxId = posts.reduce((m, p) => Math.max(m, parseInt(p.id, 10) || 0), 0);
  const id = String(maxId + 1).padStart(2, '0');
  const post = { id, title, category, excerpt, body, image: image || '', showImage: showImage !== false, ...estimate(body) };
  await savePosts([...posts, post]);
  return post;
}

// 更新
export async function updatePost(id, { title, category, excerpt, body, image, showImage }) {
  const posts = await getAllPosts();
  const i = posts.findIndex((p) => p.id === id);
  if (i < 0) throw new Error('找不到文章');
  posts[i] = { ...posts[i], title, category, excerpt, body, image: image || '', showImage: showImage !== false, ...estimate(body) };
  await savePosts(posts);
  return posts[i];
}

export async function deletePost(id) {
  const posts = await getAllPosts();
  await savePosts(posts.filter((p) => p.id !== id));
}

// 上移／下移
export async function movePost(id, dir) {
  const posts = await getAllPosts();
  const i = posts.findIndex((p) => p.id === id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= posts.length) return;
  [posts[i], posts[j]] = [posts[j], posts[i]];
  await savePosts(posts);
}

// 分類改名（同步更新所有文章的分類欄位）
export async function renameCategory(oldName, newName) {
  const cats = await getCategories();
  const idx = cats.indexOf(oldName);
  if (idx < 0) throw new Error('找不到分類');
  cats[idx] = newName;
  await saveCategories(cats);
  const posts = await getAllPosts();
  posts.forEach((p) => { if (p.category === oldName) p.category = newName; });
  await savePosts(posts);
}

export async function addCategory(name) {
  const cats = await getCategories();
  if (cats.includes(name)) throw new Error('分類已存在');
  await saveCategories([...cats, name]);
}

export async function deleteCategory(name) {
  const posts = await getAllPosts();
  if (posts.some((p) => p.category === name)) {
    throw new Error('此分類仍有文章，請先移動或刪除文章');
  }
  const cats = await getCategories();
  await saveCategories(cats.filter((c) => c !== name));
}

export async function moveCategory(name, dir) {
  const cats = await getCategories();
  const i = cats.indexOf(name);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= cats.length) return;
  [cats[i], cats[j]] = [cats[j], cats[i]];
  await saveCategories(cats);
}

// ── 網站文案（關於我／服務／預約／聯絡）
export async function getContent() {
  if (!hasKV()) return DEFAULT_CONTENT;
  try {
    const raw = await kv(['GET', K_CONTENT]);
    if (raw) {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // 與預設值合併，確保新增欄位時舊資料仍可運作
      return {
        site: { ...DEFAULT_CONTENT.site, ...(obj.site || {}) },
        about: { ...DEFAULT_CONTENT.about, ...(obj.about || {}) },
        services: { ...DEFAULT_CONTENT.services, ...(obj.services || {}) },
        testimonials: { ...DEFAULT_CONTENT.testimonials, ...(obj.testimonials || {}) },
        cases: { ...DEFAULT_CONTENT.cases, ...(obj.cases || {}) },
        booking: { ...DEFAULT_CONTENT.booking, ...(obj.booking || {}) },
        homepage: { ...DEFAULT_CONTENT.homepage, ...(obj.homepage || {}) },
        postsSection: { ...DEFAULT_CONTENT.postsSection, ...(obj.postsSection || {}) },
        chartReport: { ...DEFAULT_CONTENT.chartReport, ...(obj.chartReport || {}) },
        contact: { ...DEFAULT_CONTENT.contact, ...(obj.contact || {}) },
      };
    }
    await kv(['SET', K_CONTENT, JSON.stringify(DEFAULT_CONTENT)]);
    return DEFAULT_CONTENT;
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function saveContent(content) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法儲存');
  await kv(['SET', K_CONTENT, JSON.stringify(content)]);
}

// ── 流日 384 爻辭（可於後台「流日爻辭」編輯覆蓋，單一閘門/爻線層級合併）
export async function getTransitLines() {
  if (!hasKV()) return DEFAULT_TRANSIT_LINES;
  try {
    const raw = await kv(['GET', K_TRANSIT]);
    if (raw) {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // 版本落後（例如原始資料來源更新）：捨棄舊的自動種子資料，直接改用最新預設值
      if ((obj.version || 0) < (DEFAULT_TRANSIT_LINES.version || 0)) {
        await kv(['SET', K_TRANSIT, JSON.stringify(DEFAULT_TRANSIT_LINES)]);
        return DEFAULT_TRANSIT_LINES;
      }
      const gates = {};
      for (const g of Object.keys(DEFAULT_TRANSIT_LINES.gates)) {
        const dGate = DEFAULT_TRANSIT_LINES.gates[g];
        const oGate = (obj.gates && obj.gates[g]) || {};
        const lines = {};
        for (const l of Object.keys(dGate.lines)) {
          lines[l] = { ...dGate.lines[l], ...((oGate.lines && oGate.lines[l]) || {}) };
        }
        gates[g] = { ...dGate, ...oGate, lines };
      }
      return { version: DEFAULT_TRANSIT_LINES.version, overview: obj.overview?.length ? obj.overview : DEFAULT_TRANSIT_LINES.overview, gates };
    }
    await kv(['SET', K_TRANSIT, JSON.stringify(DEFAULT_TRANSIT_LINES)]);
    return DEFAULT_TRANSIT_LINES;
  } catch {
    return DEFAULT_TRANSIT_LINES;
  }
}

export async function saveTransitLines(data) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法儲存');
  await kv(['SET', K_TRANSIT, JSON.stringify(data)]);
}

// ── 付費解圖報告訂單（每筆保留 30 天，key 帶到期時間）
function orderKey(id) { return `hd:reportorder:${id}`; }

export async function createReportOrder(order) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法建立訂單');
  await kv(['SET', orderKey(order.orderId), JSON.stringify(order), 'EX', 60 * 60 * 24 * 30]);
  return order;
}

export async function getReportOrder(orderId) {
  if (!hasKV()) return null;
  const raw = await kv(['GET', orderKey(orderId)]);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function updateReportOrder(orderId, patch) {
  if (!hasKV()) throw new Error('資料庫尚未設定，無法更新訂單');
  const cur = await getReportOrder(orderId);
  if (!cur) throw new Error('找不到訂單');
  const next = { ...cur, ...patch };
  await kv(['SET', orderKey(orderId), JSON.stringify(next), 'EX', 60 * 60 * 24 * 30]);
  return next;
}

// ── 依網站 Logo 網址取得原始圖片 bytes（供 PDF 產生使用）
// logoUrl 可能是：data URL／public 靜態檔（/images/xxx）／後台上傳圖片（/api/upload?slot=xxx）
export async function getLogoBytes(logoUrl) {
  if (!logoUrl) return null;
  try {
    if (logoUrl.startsWith('data:')) {
      const m = /^data:image\/[a-z]+;base64,(.+)$/.exec(logoUrl);
      return m ? Buffer.from(m[1], 'base64') : null;
    }
    if (logoUrl.startsWith('/api/upload')) {
      const slot = new URL(logoUrl, 'http://x').searchParams.get('slot');
      if (!slot || !hasKV()) return null;
      const dataUrl = await kv(['HGET', 'hd:images', slot]);
      if (!dataUrl) return null;
      const m = /^data:image\/[a-z]+;base64,(.+)$/.exec(dataUrl);
      return m ? Buffer.from(m[1], 'base64') : null;
    }
    if (logoUrl.startsWith('/')) {
      const fs = await import('fs');
      const path = await import('path');
      const p = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''));
      return fs.existsSync(p) ? fs.readFileSync(p) : null;
    }
    return null;
  } catch {
    return null;
  }
}
