import { natalChart } from '../../../lib/chart.js';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const u = new URL(req.url);
    const q = (k, d = '') => u.searchParams.get(k) ?? d;
    const year = +q('y'), month = +q('m'), day = +q('d');
    const hour = +q('h'), minute = +q('mi');
    const tz = q('tz', 'Asia/Taipei');
    const name = String(q('name', '')).slice(0, 24);
    const asFile = q('dl') === '1';   // dl=1 才觸發下載，否則直接顯示

    const valid =
      year >= 1900 && year <= 2030 && month >= 1 && month <= 12 &&
      day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
    if (!valid) return new Response('bad params', { status: 400 });

    const { svgFull } = natalChart({ year, month, day, hour, minute, tz, name });

    const { Resvg } = await import('@resvg/resvg-js');
    const fontDir = path.join(process.cwd(), 'public', 'fonts');
    const png = new Resvg(svgFull, {
      fitTo: { mode: 'width', value: 1800 },
      font: {
        fontFiles: [
          path.join(fontDir, 'NotoSansTC-Regular.otf'),
          path.join(fontDir, 'NotoSansTC-Bold.otf'),
          path.join(fontDir, 'DejaVuSans.ttf'),
        ],
        fontDirs: [fontDir],
        loadSystemFonts: false,          // 只用打包字型，避免環境差異
        defaultFontFamily: 'Noto Sans TC',
      },
    }).render().asPng();

    const filename = encodeURIComponent(`${name || '我的'}-人類圖.png`);
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition':
          `${asFile ? 'attachment' : 'inline'}; filename*=UTF-8''${filename}`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return new Response('render failed: ' + e.message, { status: 500 });
  }
}
