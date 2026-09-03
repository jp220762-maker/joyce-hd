import { NextResponse } from 'next/server';
import { natalChart } from '../../../../lib/chart.js';
import { getContent, createReportOrder } from '../../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function genOrderId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return ('R' + t + r).slice(0, 20).toUpperCase();
}

function pad(n) { return String(n).padStart(2, '0'); }

export async function POST(req) {
  try {
    const b = await req.json();
    const year = +b.year, month = +b.month, day = +b.day;
    const hour = +b.hour, minute = +b.minute;
    const tz = String(b.tz || 'Asia/Taipei');
    const city = String(b.city || '').slice(0, 40);
    const name = String(b.name || '').slice(0, 24);
    const email = String(b.email || '').trim().slice(0, 120);

    if (!(year >= 1900 && year <= 2030) ||
        !(month >= 1 && month <= 12) || !(day >= 1 && day <= 31) ||
        !(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) {
      return NextResponse.json({ error: '出生資料不完整或格式有誤，請回到排盤頁重新產生。' }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: '請輸入正確的 Email，報告會寄送到這個信箱並可在這裡下載。' }, { status: 400 });
    }

    const c = await getContent();
    const cfg = c.chartReport || {};
    if (cfg.enabled === false) {
      return NextResponse.json({ error: '解圖報告目前暫停提供。' }, { status: 403 });
    }
    const price = Math.max(1, Math.round(Number(cfg.price) || 99));

    const merchantId = process.env.ECPAY_MERCHANT_ID;
    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIv = process.env.ECPAY_HASH_IV;
    if (!merchantId || !hashKey || !hashIv) {
      return NextResponse.json({ error: '金流尚未設定完成，請稍後再試或聯繫網站管理者。' }, { status: 503 });
    }

    // 伺服器端重新計算命盤，不信任前端傳來的排盤結果
    const { P, D, info } = natalChart({ year, month, day, hour, minute, tz, name });

    const orderId = genOrderId();
    const now = new Date();
    const merchantTradeDate =
      `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const origin = new URL(req.url).origin;

    await createReportOrder({
      orderId,
      status: 'pending',
      createdAt: now.toISOString(),
      price,
      email,
      birth: { year, month, day, hour, minute, tz, city, name },
      P, D,
      summary: {
        type: info.type, authority: info.authority, strategy: info.strategy,
        profile: info.profile, definition: info.definition,
        notSelf: info.notSelf, cross: info.cross,
      },
    });

    const ECPayPayment = (await import('ecpay_aio_nodejs')).default;
    const options = {
      OperationMode: process.env.ECPAY_MODE === 'production' ? 'Production' : 'Test',
      MercProfile: { MerchantID: merchantId, HashKey: hashKey, HashIV: hashIv },
      IgnorePayment: [],
      IsProjectContractor: false,
    };
    const ecpay = new ECPayPayment(options);

    const base_param = {
      MerchantTradeNo: orderId,
      MerchantTradeDate: merchantTradeDate,
      TotalAmount: String(price),
      TradeDesc: '人類圖專屬解圖報告',
      ItemName: `人類圖解圖報告（${name || '個人'}）`,
      ReturnURL: `${origin}/api/report/ecpay-notify`,
      ClientBackURL: `${origin}/report/${orderId}`,
    };

    const html = ecpay.payment_client.aio_check_out_all(base_param, {});
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '建立訂單時發生問題，請稍後再試。' }, { status: 500 });
  }
}
