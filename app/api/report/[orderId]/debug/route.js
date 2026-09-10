import { NextResponse } from 'next/server';
import { getReportOrder, getReportOrdersByEmail } from '../../../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authed(req) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  return (new URL(req.url).searchParams.get('key') || '') === key;
}

// 管理者專用：暫時的除錯端點，用來確認某筆訂單實際存了什麼 email（不會回傳完整 email，只顯示遮罩過的版本）
export async function GET(req, { params }) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const orderId = params.orderId;
  const order = await getReportOrder(orderId);
  if (!order) return NextResponse.json({ error: '找不到訂單' }, { status: 404 });

  const rawEmail = order.email || '';
  const masked = rawEmail
    ? rawEmail.replace(/^(.{2}).*(@.*)$/, (m, a, b) => `${a}***${b}`)
    : '(空)';

  // 直接用同一支查詢函式，實際測試用這個 email 查不查得回這筆訂單
  let lookupResult = null;
  try {
    const found = await getReportOrdersByEmail(rawEmail);
    lookupResult = {
      count: found.length,
      containsThisOrder: found.some((o) => o.orderId === orderId),
      foundOrderIds: found.map((o) => o.orderId),
    };
  } catch (e) {
    lookupResult = { error: String(e.message || e) };
  }

  return NextResponse.json({
    orderId,
    status: order.status,
    emailMasked: masked,
    emailLength: rawEmail.length,
    emailNormalized: rawEmail.trim().toLowerCase().replace(/^(.{2}).*(@.*)$/, (m, a, b) => `${a}***${b}`),
    hasCharsOutsideAscii: /[^\x00-\x7F]/.test(rawEmail),
    createdAt: order.createdAt,
    lookupTestUsingThisEmail: lookupResult,
    hasKVConfigured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
  });
}
