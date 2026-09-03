import { NextResponse } from 'next/server';
import { getReportOrder, updateReportOrder, getContent, getLogoBytes } from '../../../../lib/store.js';
import { buildReportMessages } from '../../../../lib/reportPrompt.js';
import { buildReportPdf } from '../../../../lib/pdfReport.js';
import { splitIntoSections } from '../../../../lib/reportSections.js';
import { DEFAULT_TRANSIT_LINES } from '../../../../lib/transitLines.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function verifyMac(paramsObj, ecpay) {
  const clone = { ...paramsObj };
  const mac = clone.CheckMacValue;
  delete clone.CheckMacValue;
  const computed = ecpay.payment_client.helper.gen_chk_mac_value(clone);
  return computed === mac;
}

async function generateReportText({ P, D, summary, birth }) {
  const gatesData = DEFAULT_TRANSIT_LINES.gates;
  const { system, user } = buildReportMessages({
    P: Object.fromEntries(P.map((x) => [x.planet, x])),
    D: Object.fromEntries(D.map((x) => [x.planet, x])),
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

export async function POST(req) {
  const raw = await req.text();
  const params = Object.fromEntries(new URLSearchParams(raw));

  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIv) {
    return new NextResponse('0|CONFIG', { status: 200 });
  }

  const ECPayPayment = (await import('ecpay_aio_nodejs')).default;
  const ecpay = new ECPayPayment({
    OperationMode: process.env.ECPAY_MODE === 'production' ? 'Production' : 'Test',
    MercProfile: { MerchantID: merchantId, HashKey: hashKey, HashIV: hashIv },
    IgnorePayment: [],
    IsProjectContractor: false,
  });

  if (!verifyMac(params, ecpay)) {
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

  try {
    const text = await generateReportText({ P: order.P, D: order.D, summary: order.summary, birth: order.birth });
    const sections = splitIntoSections(text);

    const c = await getContent();
    const logoBytes = await getLogoBytes(c.site?.logoUrl);

    const pad = (n) => String(n).padStart(2, '0');
    const b = order.birth;
    const birthLine = `${b.year}/${pad(b.month)}/${pad(b.day)} ${pad(b.hour)}:${pad(b.minute)}　${b.city || ''}`;

    const pdfBuffer = await buildReportPdf({
      title: `${b.name || '你'}的專屬解圖報告`,
      subtitle: `${c.site?.name || 'J頁有光'}｜行星代表意義解圖法`,
      birthLine,
      sections,
      logoBytes,
      footerNote: `© ${new Date().getFullYear()} ${c.site?.name || 'J頁有光'}`,
    });

    await updateReportOrder(orderId, {
      status: 'ready',
      reportText: text,
      pdfBase64: pdfBuffer.toString('base64'),
      readyAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('報告生成失敗', e);
    await updateReportOrder(orderId, { status: 'gen_failed', error: String(e.message || e) });
  }

  return new NextResponse('1|OK', { status: 200 });
}
