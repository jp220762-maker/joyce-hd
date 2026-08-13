import { transitChart, taipeiNowString, activationList } from '../../lib/chart.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '今日流日 — 人類圖' };

export default function TransitPage() {
  const now = new Date();
  const { P, D, info, svg } = transitChart(now, '今日流日');
  const stamp = taipeiNowString(now);
  const personality = activationList(P);
  const design = activationList(D);

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Transit</p>
        <h1>今日流日</h1>
        <p className="stamp">台北時間 {stamp}</p>
        <p className="lede">
          此刻天體所啟動的閘門與爻。流日每天變動，反映當下集體的能量場，
          與你的本命圖疊合時會產生暫時的通道。
        </p>
      </header>

      <div className="chart" dangerouslySetInnerHTML={{ __html: svg }} />

      <section className="cols">
        <div className="card">
          <h2>此刻啟動（個性 · 黑）</h2>
          <ul>{personality.map((a) => (
            <li key={a.planet}><span>{a.planet}</span><b>{a.gate}.{a.line}</b></li>
          ))}</ul>
        </div>
        <div className="card">
          <h2>設計端（紅）</h2>
          <ul>{design.map((a) => (
            <li key={a.planet}><span>{a.planet}</span><b>{a.gate}.{a.line}</b></li>
          ))}</ul>
        </div>
      </section>

      <p className="note">
        流日以台北時間（UTC+8）計算，每次重新整理都會取得最新的行星位置。
      </p>

      <footer className="foot"><a href="/">← 回到本命排盤</a></footer>

      <style>{`
        main { max-width: 980px; margin: 0 auto; padding: 48px 20px 80px; }
        .hero { text-align: center; margin-bottom: 32px; }
        .eyebrow { font-size: 12px; letter-spacing: 4px; color: var(--faint);
                   text-transform: uppercase; margin: 0 0 12px; }
        h1 { font-size: 40px; font-weight: 700; margin: 0 0 10px; letter-spacing: 2px; }
        .stamp { font-size: 14px; color: var(--coffee); margin: 0 0 16px; letter-spacing: 1px; }
        .lede { color: var(--faint); line-height: 1.9; margin: 0; font-size: 15px; }
        .chart svg { width: 100%; height: auto; display: block; }
        .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .card { background: var(--paper); border: 1px solid var(--line);
                border-radius: 14px; padding: 20px; }
        h2 { font-size: 13px; letter-spacing: 2px; color: var(--faint);
             margin: 0 0 14px; font-weight: 700; }
        ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        li { display: flex; justify-content: space-between;
             border-bottom: 1px solid var(--line); padding-bottom: 6px; font-size: 14px; }
        li span { color: var(--faint); }
        .note { font-size: 12px; color: var(--faint); text-align: center; margin-top: 24px; }
        .foot { text-align: center; margin-top: 32px; }
        .foot a { font-size: 14px; text-decoration: none; }
        @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } h1 { font-size: 30px; } }
      `}</style>
    </main>
  );
}
