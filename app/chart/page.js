import { natalChart } from '../../lib/chart.js';
import { getContent } from '../../lib/store.js';
import { DEFAULT_TRANSIT_LINES } from '../../lib/transitLines.js';
import ChartView from './ChartView';
import { headers } from 'next/headers';
import { logUsage, visitorId } from '../../lib/usage.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '你的人類圖 — 排盤結果' };

export default async function ChartPage({ searchParams }) {
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

  const [{ info, svg, svgFull, P, D }, c] = await Promise.all([
    Promise.resolve(natalChart({ year, month, day, hour, minute, tz, name })),
    getContent(),
  ]);

  logUsage({
    kind: 'natal', name, city, uid: visitorId(headers()),
    birth: `${year}/${month}/${day} ${hour}:${String(minute).padStart(2, '0')}`,
    type: info.type, profile: info.profile,
  });
  const pad = (n) => String(n).padStart(2, '0');
  const birthLine = `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}　${city}`;

  // 輪迴交叉由 4 個閘門爻位組成：個性太陽/地球、設計太陽/地球，
  // 直接引用既有的 384 爻辭資料庫（來源：《區分的科學》），不另外生成新內容
  const crossPoints = [
    { label: '個性太陽', act: P['太陽'] },
    { label: '個性地球', act: P['地球'] },
    { label: '設計太陽', act: D['太陽'] },
    { label: '設計地球', act: D['地球'] },
  ].map(({ label, act }) => {
    const gateData = DEFAULT_TRANSIT_LINES.gates?.[String(act.gate)];
    const lineData = gateData?.lines?.[String(act.line)];
    return { label, gate: act.gate, line: act.line, theme: lineData?.theme || '' };
  });

  return (
    <ChartView
      svg={svg}
      svgFull={svgFull}
      summary={{
        type: info.type, profile: info.profile, definition: info.definition,
        authority: info.authority, strategy: info.strategy,
        notSelf: info.notSelf, cross: info.cross, crossPoints,
        centers: info.centers,
      }}
      label={name || '我的人類圖'}
      birthLine={birthLine}
      pngHref={`/api/png?y=${year}&m=${month}&d=${day}&h=${hour}&mi=${minute}&tz=${encodeURIComponent(tz)}&name=${encodeURIComponent(name)}`}
      birth={{ year, month, day, hour, minute, tz, city, name }}
      reportConfig={c.chartReport || {}}
    />
  );
}
