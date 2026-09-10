import { getReportOrder, getContent, getLogoBytes } from '../../../../../lib/store.js';
import { buildReportPdf } from '../../../../../lib/pdfReport.js';
import { splitIntoSections } from '../../../../../lib/reportSections.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 提供已完成訂單的 PDF 報告下載（成功頁「下載 PDF 報告」按鈕連結到這裡）
// 注意：PDF 不會預先存在資料庫裡（檔案太大，會超過資料庫單筆資料的大小限制），
// 而是每次有人下載時，就用當初存好的報告文字＋出生資料，現場重新排版產生一份。
export async function GET(req, { params }) {
  const orderId = params.orderId;
  const order = await getReportOrder(orderId);

  if (!order) {
    return new Response('找不到這筆訂單', { status: 404 });
  }
  if (order.status !== 'ready' || !order.reportText) {
    return new Response('報告尚未準備好，請稍候再試', { status: 404 });
  }

  try {
    const sections = splitIntoSections(order.reportText);
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
      birthLine,
      sections,
      logoBytes,
      chartImageBytes,
      footerNote: `© ${new Date().getFullYear()} ${c.site?.name || 'J頁有光'}`,
    });

    const name = b?.name ? `${b.name}的解圖報告` : '解圖報告';

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('PDF 產生失敗', e);
    return new Response('報告產生時發生問題，請稍後再試或聯繫客服', { status: 500 });
  }
}
