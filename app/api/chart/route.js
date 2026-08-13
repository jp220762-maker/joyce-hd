import { NextResponse } from 'next/server';
import { natalChart, activationList } from '../../../lib/chart.js';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const b = await req.json();
    const year = +b.year, month = +b.month, day = +b.day;
    const hour = +b.hour, minute = +b.minute;
    const tz = String(b.tz || 'Asia/Taipei');
    const name = String(b.name || '').slice(0, 24);

    if (!(year >= 1900 && year <= 2030)) {
      return NextResponse.json({ error: '出生年份需介於 1900 到 2030 之間。' }, { status: 400 });
    }
    if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31) ||
        !(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) {
      return NextResponse.json({ error: '出生日期或時間格式有誤，請重新選擇。' }, { status: 400 });
    }

    const { P, D, info, svg, svgFull } = natalChart({ year, month, day, hour, minute, tz, name });

    return NextResponse.json({
      svg,
      svgFull,
      summary: {
        type: info.type, authority: info.authority, profile: info.profile,
        definition: info.definition, strategy: info.strategy, notSelf: info.notSelf,
        cross: info.cross,
        channels: info.channels.map((c) => c.join('-')),
        centers: info.centers,
        arrows: info.arrows,
      },
      design: activationList(D),
      personality: activationList(P),
    });
  } catch (e) {
    return NextResponse.json({ error: '排盤計算發生問題，請稍後再試。' }, { status: 500 });
  }
}
