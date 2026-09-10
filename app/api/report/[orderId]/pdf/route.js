import { getReportOrder } from '../../../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 提供已完成訂單的 PDF 報告下載（成功頁「下載 PDF 報告」按鈕連結到這裡）
export async function GET(req, { params }) {
  const orderId = params.orderId;
  const order = await getReportOrder(orderId);

  if (!order) {
    return new Response('找不到這筆訂單', { status: 404 });
  }
  if (order.status !== 'ready' || !order.pdfBase64) {
    return new Response('報告尚未準備好，請稍候再試', { status: 404 });
  }

  const pdfBuffer = Buffer.from(order.pdfBase64, 'base64');
  const name = order.birth?.name ? `${order.birth.name}的解圖報告` : '解圖報告';

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
