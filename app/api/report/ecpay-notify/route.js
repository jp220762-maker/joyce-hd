import { NextResponse } from 'next/server';
import { getReportOrder, updateReportOrder, getContent } from '../../../../lib/store.js';
import { buildReportMessages } from '../../../../lib/reportPrompt.js';
import { DEFAULT_TRANSIT_LINES } from '../../../../lib/transitLines.js';
import { issueInvoice, invoiceConfigured } from '../../../../lib/ecpayInvoice.js';
import { genCheckMacValue } from '../../../../lib/ecpayCheckout.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function verifyMac(paramsObj, hashKey, hashIv) {
  const clone = { ...paramsObj };
  const mac = clone.CheckMacValue;
  delete clone.CheckMacValue;
  const computed = genCheckMacValue(clone, hashKey, hashIv);
  return computed === mac;
}

async function generateReportText({ P, D, summary, birth }) {
  const gatesData = DEFAULT_TRANSIT_LINES.gates;
  const { system, user } = buildReportMessages({
    P, D,
    info: summary,
    gatesData,
    name: birth.name,
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('AI 生成失敗：' + t.slice(0, 300));
  }
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('\n');
  return text;
}

async function sendReportEmail({ to, subject, resultUrl, name, siteName, failed = false }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return; // 寄信服務未設定時安靜略過，不影響報告本身已經產生完成

  const html = failed
    ? `<div style="font-family:sans-serif;line-height:1.9;color:#443A31">
        <p>${name ? name + '，您好' : '您好'}：</p>
        <p>感謝您購買${siteName}的解圖報告，付款已確認成功，但系統在自動生成報告時遇到問題，需要人工協助處理。</p>
        <p>請保留這封信，並回覆告知您的訂單網址，我們會盡快為您手動完成：</p>
        <p><a href="${resultUrl}">${resultUrl}</a></p>
      </div>`
    : `<div style="font-family:sans-serif;line-height:1.9;color:#443A31">
        <p>${name ? name + '，您好' : '您好'}：</p>
        <p>感謝您購買${siteName}的專屬解圖報告，AI 已經為您完成 13 個行星的逐一解讀。</p>
        <p>點下方連結即可查看並下載您的 PDF 報告：</p>
        <p><a href="${resultUrl}" style="display:inline-block;padding:12px 28px;background:#C1704F;color:#fff;border-radius:8px;text-decoration:none;">查看我的解圖報告</a></p>
        <p style="font-size:13px;color:#A2937F">若按鈕無法點擊，請複製以下網址至瀏覽器開啟：<br>${resultUrl}</p>
      </div>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${siteName} <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error('報告通知信寄送失敗', e);
  }
}

export async function POST(req) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));

  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIv) {
    return new NextResponse('0|CONFIG', { status: 200 });
  }

  if (!verifyMac(params, hashKey, hashIv)) {
    console.error('ECPay CheckMacValue 驗證失敗', params);
    return new NextResponse('0|CheckMacValue Error', { status: 200 });
  }

  const orderId = params.MerchantTradeNo;
  const order = await getReportOrder(orderId);
  if (!order) {
    console.error('找不到對應訂單', orderId);
    return new NextResponse('1|OK', { status: 200 });
  }

  // 已處理過（ECPay 可能重送通知），直接回覆成功避免重複扣款/重複生成
  if (order.status !== 'pending') {
    return new NextResponse('1|OK', { status: 200 });
  }

  if (params.RtnCode !== '1') {
    await updateReportOrder(orderId, { status: 'failed', paidAt: null, rtnMsg: params.RtnMsg || '' });
    return new NextResponse('1|OK', { status: 200 });
  }

  await updateReportOrder(orderId, { status: 'generating', paidAt: new Date().toISOString() });

  // 開立電子發票（與報告生成互相獨立：發票失敗不影響報告，報告失敗不影響已開立的發票）
  if (invoiceConfigured()) {
    try {
      const c0 = await getContent();
      const inv = await issueInvoice({
        relateNumber: orderId,
        amount: order.price,
        itemName: `${c0.chartReport?.heading || '人類圖解圖報告'}`,
        buyerEmail: order.email,
      });
      await updateReportOrder(orderId, {
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
      });
    } catch (e) {
      console.error('電子發票開立失敗', e);
      await updateReportOrder(orderId, { invoiceError: String(e.message || e) });
    }
  }

  try {
    const text = await generateReportText({ P: order.P, D: order.D, summary: order.summary, birth: order.birth });

    // 注意：PDF 不會在這裡先產生、也不會存進資料庫（檔案太大會超過資料庫單筆大小限制）。
    // 這裡只存文字內容；使用者按下載時，/api/report/[orderId]/pdf 會現場用這段文字重新排版成 PDF。
    await updateReportOrder(orderId, {
      status: 'ready',
      reportText: text,
      readyAt: new Date().toISOString(),
    });

    const c = await getContent();
    const origin = new URL(req.url).origin;
    await sendReportEmail({
      to: order.email,
      subject: `【${c.site?.name || 'J頁有光'}】你的專屬解圖報告已完成`,
      resultUrl: `${origin}/report/${orderId}`,
      name: order.birth?.name || '',
      siteName: c.site?.name || 'J頁有光',
    });
  } catch (e) {
    console.error('報告生成失敗', e);
    await updateReportOrder(orderId, { status: 'gen_failed', error: String(e.message || e) });

    try {
      const origin = new URL(req.url).origin;
      const c2 = await getContent();
      await sendReportEmail({
        to: order.email,
        subject: `【${c2.site?.name || 'J頁有光'}】你的訂單需要協助處理`,
        resultUrl: `${origin}/report/${orderId}`,
        name: order.birth?.name || '',
        siteName: c2.site?.name || 'J頁有光',
        failed: true,
      });
    } catch (e2) {
      console.error('失敗通知信也寄送失敗', e2);
    }
  }

  return new NextResponse('1|OK', { status: 200 });
}
