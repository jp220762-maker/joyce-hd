import { NextResponse } from 'next/server';
import { getReportOrder, updateReportOrder } from '../../../../../lib/store.js';
import { buildReportMessages } from '../../../../../lib/reportPrompt.js';
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
    body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 16000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) throw new Error('AI 生成失敗：' + (await res.text()).slice(0, 300));
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('\n');
  if (!text || !text.trim()) {
    const blockTypes = (data.content || []).map((c) => c.type).join(',') || '(無內容區塊)';
    throw new Error(
      `AI 回傳內容是空的。stop_reason=${data.stop_reason || '?'}，內容區塊類型=[${blockTypes}]，` +
      `usage=${JSON.stringify(data.usage || {})}`
    );
  }
  return text;
}

// 管理者專用：對已付款成功、但生成失敗的訂單重新嘗試生成報告
// 網址加上 &force=1 可以強制重新產生，即使這筆訂單狀態已經是 ready（用於重新產生已完成但有問題的報告）
// 注意：這裡只會重新生成並儲存「報告文字」，不會產生/儲存 PDF 本身——
// PDF 是使用者按下載時，由 /api/report/[orderId]/pdf 現場用文字重新排版產生的。
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

    await updateReportOrder(orderId, {
      status: 'ready',
      reportText: text,
      readyAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: '重新生成成功', resultUrl: `/report/${orderId}` });
  } catch (e) {
    await updateReportOrder(orderId, { status: 'gen_failed', error: String(e.message || e) });
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
