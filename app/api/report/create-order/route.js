import { NextResponse } from 'next/server';
import { natalChart } from '../../../../lib/chart.js';
import { getContent, createReportOrder } from '../../../../lib/store.js';
import { buildCheckoutForm } from '../../../../lib/ecpayCheckout.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function genOrderId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return ('R' + t + r).slice(0, 20).toUpperCase();
}

function pad(n) { return String(n).padStart(2, '0'); }

function errorPage(message, status) {
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<title>無法建立訂單</title></head>
<body style="font-family:'Noto Serif TC',serif;max-width:520px;margin:80px auto;padding:0 20px;color:#443A31;text-align:center;">
<h1 style="font-size:22px;">無法建立訂單</h1>
<p style="color:#C1704F;font-size:15px;line-height:1.9;">${message}</p>
<p><a href="javascript:history.back()" style="color:#5C4A3A;">← 返回上一頁</a></p>
</body></html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const b = Object.fromEntries(form.entries());
    const year = +b.year, month = +b.month, day = +b.day;
    const hour = +b.hour, minute = +b.minute;
    const tz = String(b.tz || 'Asia/Taipei');
    const city = String(b.city || '').slice(0, 40);
    const name = String(b.name || '').slice(0, 24);
    const email = String(b.email || '').trim().slice(0, 120);

    if (!(year >= 1900 && year <= 2030) ||
        !(month >= 1 && month <= 12) || !(day >= 1 && day <= 31) ||
        !(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) {
      return errorPage('出生資料不完整或格式有誤，請回到排盤頁重新產生。', 400);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return errorPage('請輸入正確的 Email，報告會寄送到這個信箱並可在這裡下載。', 400);
    }

    const c = await getContent();
    const cfg = c.chartReport || {};
    if (cfg.enabled === false) {
      return errorPage('解圖報告目前暫停提供。', 403);
    }
    const price = Math.max(1, Math.round(Number(cfg.price) || 99));

    const merchantId = process.env.ECPAY_MERCHANT_ID;
    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIv = process.env.ECPAY_HASH_IV;
    if (!merchantId || !hashKey || !hashIv) {
      return errorPage('金流尚未設定完成，請稍後再試或聯繫網站管理者。', 503);
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

    const base_param = {
      MerchantTradeNo: orderId,
      MerchantTradeDate: merchantTradeDate,
      TotalAmount: String(price),
      TradeDesc: '人類圖專屬解圖報告',
      ItemName: `人類圖解圖報告(${name || '個人'})`,
      ReturnURL: `${origin}/api/report/ecpay-notify`,
      ClientBackURL: `${origin}/report/${orderId}`,
      MerchantID: merchantId,
    };

    const actionUrl = process.env.ECPAY_MODE === 'production'
      ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
      : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

    const html = buildCheckoutForm({ params: base_param, hashKey, hashIv, actionUrl });
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.error(e);
    return errorPage('建立訂單時發生問題：' + String(e?.message || e), 500);
  }
}
