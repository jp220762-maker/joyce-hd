import { NextResponse } from 'next/server';
import { getTransitLines, saveTransitLines } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authed(req) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  return (new URL(req.url).searchParams.get('key') || '') === key;
}

export async function GET(req) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const data = await getTransitLines();
  return NextResponse.json({ data });
}

export async function POST(req) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json();
    await saveTransitLines(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || '儲存失敗' }, { status: 500 });
  }
}
