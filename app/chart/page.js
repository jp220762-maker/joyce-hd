import { natalChart } from '../../lib/chart.js';
import ChartView from './ChartView';
import { headers } from 'next/headers';
import { logUsage, visitorId } from '../../lib/usage.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '你的人類圖 — 排盤結果' };

export default function ChartPage({ searchParams }) {
  const p = searchParams || {};
  const year = +p.y, month = +p.m, day = +p.d, hour = +p.h, minute = +p.mi;
  const tz = String(p.tz || 'Asia/Taipei');
  const city = String(p.city || '');
  const name = String(p.name || '').slice(0, 24);

  const valid =
    year >= 1900 && year <= 2030 && month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;

  if (!valid) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>出生資料不完整</h1>
        <p style={{ color: 'var(--faint)', marginBottom: 24 }}>請回到首頁重新輸入出生日期、時間與地點。</p>
        <a href="/" style={{ fontSize: 15 }}>← 回到排盤首頁</a>
      </main>
    );
  }

  const { info, svg, svgFull } = natalChart({ year, month, day, hour, minute, tz, name });

  logUsage({
    kind: 'natal', name, city, uid: visitorId(headers()),
    birth: `${year}/${month}/${day} ${hour}:${String(minute).padStart(2, '0')}`,
    type: info.type, profile: info.profile,
  });
  const pad = (n) => String(n).padStart(2, '0');
  const birthLine = `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}　${city}`;

  return (
    <ChartView
      svg={svg}
      svgFull={svgFull}
      summary={{
        type: info.type, profile: info.profile, definition: info.definition,
        authority: info.authority, strategy: info.strategy,
        notSelf: info.notSelf, cross: info.cross,
      }}
      label={name || '我的人類圖'}
      birthLine={birthLine}
      pngHref={`/api/png?y=${year}&m=${month}&d=${day}&h=${hour}&mi=${minute}&tz=${encodeURIComponent(tz)}&name=${encodeURIComponent(name)}`}
    />
  );
}
