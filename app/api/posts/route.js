import { NextResponse } from 'next/server';
import {
  getAllPosts, getCategories, createPost, updatePost, deletePost, movePost,
  addCategory, renameCategory, deleteCategory, moveCategory,
} from '../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authed(req) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  const url = new URL(req.url);
  return (url.searchParams.get('key') || '') === key;
}

export async function GET(req) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const [posts, categories] = await Promise.all([getAllPosts(), getCategories()]);
  return NextResponse.json({ posts, categories });
}

export async function POST(req) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const b = await req.json();
    const act = b.action;

    if (act === 'create' || act === 'update') {
      const title = String(b.title || '').trim();
      const category = String(b.category || '').trim();
      const excerpt = String(b.excerpt || '').trim();
      const body = String(b.body || '')
        .split('\n').map((s) => s.trim()).filter(Boolean);
      if (!title) return NextResponse.json({ error: '請填寫標題' }, { status: 400 });
      if (!body.length) return NextResponse.json({ error: '請填寫內文' }, { status: 400 });
      const data = { title, category, excerpt: excerpt || body[0].slice(0, 58), body };
      const post = act === 'create'
        ? await createPost(data)
        : await updatePost(String(b.id), data);
      return NextResponse.json({ ok: true, post });
    }

    if (act === 'delete') { await deletePost(String(b.id)); return NextResponse.json({ ok: true }); }
    if (act === 'move') { await movePost(String(b.id), b.dir); return NextResponse.json({ ok: true }); }
    if (act === 'cat-add') { await addCategory(String(b.name).trim()); return NextResponse.json({ ok: true }); }
    if (act === 'cat-rename') { await renameCategory(b.oldName, String(b.newName).trim()); return NextResponse.json({ ok: true }); }
    if (act === 'cat-delete') { await deleteCategory(b.name); return NextResponse.json({ ok: true }); }
    if (act === 'cat-move') { await moveCategory(b.name, b.dir); return NextResponse.json({ ok: true }); }

    return NextResponse.json({ error: '未知的操作' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || '操作失敗' }, { status: 500 });
  }
}
