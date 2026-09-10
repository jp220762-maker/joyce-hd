import { NextResponse } from 'next/server';
import { getReportOrder, updateReportOrder, getContent, getLogoBytes } from '../../../../../lib/store.js';
import { buildReportMessages } from '../../../../../lib/reportPrompt.js';
import { buildReportPdf } from '../../../../../lib/pdfReport.js';
import { splitIntoSections } from '../../../../../lib/reportSections.js';
import { DEFAULT_TRANSIT_LINES } from '../../../../../lib/transitLines.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authed(req) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  return (new URL(req.url).searchParams.get('key') || '') === key;
}

async function generateReportText({ P, D, summary, birth }) {
  const gatesData = DEFAULT_TRANSIT_LINES.gates;
  const { system, user } = buildReportMessages({ P, D, info: summary, gatesData, name: birth.name });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 4000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error('AI 生成失敗：' + (await res.text()).slice(0, 300));
  const data = await res.json();
  return (data.content || []).map((c) => c.text || '').join('\n');
}

// 管理者專用：對已付款成功、但生成失敗的訂單重新嘗試生成報告
// 網址加上 &force=1 可以強制重新產生，即使這筆訂單狀態已經是 ready（用於重新產生已完成但有問題的報告）
export async function GET(req, { params }) {
  if (!authed(req)) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const orderId = params.orderId;
  const order = await getReportOrder(orderId);
  if (!order) return NextResponse.json({ error: '找不到訂單' }, { status: 404 });

  const force = new URL(req.url).searchParams.get('force') === '1';
  if (order.status === 'ready' && !force) {
    return NextResponse.json({ ok: true, message: '此訂單已經生成完成，無需重試（如要強制重新產生，網址加上 &force=1）' });
  }
  if (!order.paidAt) return NextResponse.json({ error: '此訂單尚未確認付款，不可重試' }, { status: 400 });

  await updateReportOrder(orderId, { status: 'generating', error: null });

  try {
    const text = await generateReportText({ P: order.P, D: order.D, summary: order.summary, birth: order.birth });
    const sections = splitIntoSections(text);

    const c = await getContent();
    const logoBytes = await getLogoBytes(c.site?.logoUrl);
    const pad = (n) => String(n).padStart(2, '0');
    const b = order.birth;
    const birthLine = `${b.year}/${pad(b.month)}/${pad(b.day)} ${pad(b.hour)}:${pad(b.minute)}　${b.city || ''}`;

    let chartImageBytes = null;
    try {
      const { natalChart } = await import('../../../../../lib/chart.js');
      const { renderChartPng } = await import('../../../../../lib/chartImage.js');
      const { svgFull } = natalChart({ ...b });
      chartImageBytes = await renderChartPng(svgFull);
    } catch (e) {
      console.error('人體圖產生失敗，PDF 將不含圖表', e);
    }

    const pdfBuffer = await buildReportPdf({
      title: `${b.name || '你'}的專屬解圖報告`,
      subtitle: `${c.site?.name || 'J頁有光'}｜行星代表意義解圖法`,
      birthLine, sections, logoBytes, chartImageBytes,
      footerNote: `© ${new Date().getFullYear()} ${c.site?.name || 'J頁有光'}`,
    });

    await updateReportOrder(orderId, {
      status: 'ready',
      reportText: text,
      pdfBase64: pdfBuffer.toString('base64'),
      readyAt: new Date().toISOString(),
    });

    // 補寄通知信
    try {
      const key = process.env.RESEND_API_KEY;
      if (key && order.email) {
        const origin = new URL(req.url).origin;
        const resultUrl = `${origin}/report/${orderId}`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${c.site?.name || 'J頁有光'} <onboarding@resend.dev>`,
            to: [order.email],
            subject: `【${c.site?.name || 'J頁有光'}】你的專屬解圖報告已完成`,
            html: `<p>您的報告已經準備好了：<a href="${resultUrl}">${resultUrl}</a></p>`,
          }),
        });
      }
    } catch (e) {
      console.error('補寄通知信失敗', e);
    }

    return NextResponse.json({ ok: true, message: '重新生成成功', resultUrl: `/report/${orderId}` });
  } catch (e) {
    await updateReportOrder(orderId, { status: 'gen_failed', error: String(e.message || e) });
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
