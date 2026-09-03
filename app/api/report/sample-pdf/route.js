import { getContent, getLogoBytes } from '../../../../lib/store.js';
import { splitIntoSections } from '../../../../lib/reportSections.js';
import { buildReportPdf } from '../../../../lib/pdfReport.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const c = await getContent();
  const cfg = c.chartReport || {};

  const sections = splitIntoSections(cfg.sampleText || '');
  const logoBytes = await getLogoBytes(c.site?.logoUrl);

  let chartImageBytes = null;
  if (cfg.sampleBirth) {
    try {
      const { natalChart } = await import('../../../../lib/chart.js');
      const { renderChartPng } = await import('../../../../lib/chartImage.js');
      const { svgFull } = natalChart({ ...cfg.sampleBirth });
      chartImageBytes = await renderChartPng(svgFull);
    } catch (e) {
      console.error('範例人體圖產生失敗', e);
    }
  }

  const pdfBuffer = await buildReportPdf({
    title: '解圖報告（範例）',
    subtitle: `${c.site?.name || 'J頁有光'}｜行星代表意義解圖法・${cfg.sampleLabel || ''}`,
    birthLine: cfg.sampleShowBirth ? (cfg.sampleBirthLine || '') : '',
    sections,
    logoBytes,
    chartImageBytes,
    footerNote: `© ${new Date().getFullYear()} ${c.site?.name || 'J頁有光'}・範例報告`,
  });

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="report-sample.pdf"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
