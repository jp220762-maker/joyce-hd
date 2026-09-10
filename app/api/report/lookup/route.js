import { NextResponse } from 'next/server';
import { getReportOrdersByEmail } from '../../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: '請輸入正確的 Email。' }, { status: 400 });
    }
    const orders = await getReportOrdersByEmail(email);
    const list = orders.map((o) => ({
      orderId: o.orderId,
      status: o.status,
      name: o.birth?.name || '',
      createdAt: o.createdAt,
      price: o.price,
    }));
    return NextResponse.json({ orders: list });
  } catch (e) {
    return NextResponse.json({ error: '查詢時發生問題，請稍後再試。' }, { status: 500 });
  }
}
