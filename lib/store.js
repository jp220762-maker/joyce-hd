// lib/store.js — 文章與分類的儲存層（Upstash Redis，未設定時退回種子資料）
import { POSTS as SEED_POSTS, CATEGORIES as SEED_CATS } from './posts.js';
import { DEFAULT_CONTENT } from './content.js';

const K_POSTS = 'hd:posts';
const K_CATS = 'hd:cats';
const K_CONTENT = 'hd:content';

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
export async function createPost({ title, category, excerpt, body }) {
  const posts = await getAllPosts();
  const maxId = posts.reduce((m, p) => Math.max(m, parseInt(p.id, 10) || 0), 0);
  const id = String(maxId + 1).padStart(2, '0');
  const post = { id, title, category, excerpt, body, ...estimate(body) };
  await savePosts([...posts, post]);
  return post;
}

// 更新
export async function updatePost(id, { title, category, excerpt, body }) {
  const posts = await getAllPosts();
  const i = posts.findIndex((p) => p.id === id);
  if (i < 0) throw new Error('找不到文章');
  posts[i] = { ...posts[i], title, category, excerpt, body, ...estimate(body) };
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
        booking: { ...DEFAULT_CONTENT.booking, ...(obj.booking || {}) },
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
