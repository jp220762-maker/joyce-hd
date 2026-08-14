import { transitChart, taipeiNowString } from '../../lib/chart.js';
import { headers } from 'next/headers';
import { logUsage, visitorId } from '../../lib/usage.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '今日流日 — 人類圖' };

export default function TransitPage() {
  const now = new Date();
  const { svg } = transitChart(now, '今日流日');
  const stamp = taipeiNowString(now);
  logUsage({ kind: 'transit', uid: visitorId(headers()) });

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">TRANSIT</p>
        <h1>今日流日</h1>
        <p className="stamp">台北時間 {stamp}</p>
        <p className="lede">
          此刻天體所啟動的閘門與爻。流日每天變動，反映當下集體的能量場，
          與你的本命圖疊合時會產生暫時的通道。
        </p>
      </header>

      <div className="chart" dangerouslySetInnerHTML={{ __html: svg }} />

      <p className="note">流日以台北時間（UTC+8）計算，重新整理即可取得最新的行星位置。</p>

      <footer className="foot"><a href="/">← 回到本命排盤</a></footer>

      <style>{`
        main { max-width: 1000px; margin: 0 auto; padding: 48px 20px 80px; }
        .hero { text-align: center; margin-bottom: 32px; }
        .eyebrow { font-size: 12px; letter-spacing: 4px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 42px; font-weight: 700; margin: 0 0 10px; letter-spacing: 3px; }
        .stamp { font-size: 15px; color: var(--coffee); margin: 0 0 16px; letter-spacing: 1px; }
        .lede { color: var(--faint); line-height: 2; margin: 0; font-size: 16px; }
        .chart svg { width: 100%; height: auto; display: block; }
        .note { font-size: 13px; color: var(--faint); text-align: center; margin-top: 24px; }
        .foot { text-align: center; margin-top: 32px; }
        .foot a { font-size: 15px; text-decoration: none; }
        @media (max-width: 720px) { h1 { font-size: 32px; } }
      `}</style>
    </main>
  );
}
