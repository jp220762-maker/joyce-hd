// lib/chartImage.js — 將人類圖 SVG 轉為 PNG（供 PDF 報告嵌入使用；沿用 /api/png 的字型設定）
import path from 'path';

export async function renderChartPng(svgFull, widthPx = 1400) {
  const { Resvg } = await import('@resvg/resvg-js');
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const png = new Resvg(svgFull, {
    fitTo: { mode: 'width', value: widthPx },
    font: {
      fontFiles: [
        path.join(fontDir, 'NotoSansTC-Regular.otf'),
        path.join(fontDir, 'NotoSansTC-Bold.otf'),
        path.join(fontDir, 'DejaVuSans.ttf'),
      ],
      fontDirs: [fontDir],
      loadSystemFonts: false,
      defaultFontFamily: 'Noto Sans TC',
    },
  }).render().asPng();
  return png;
}
