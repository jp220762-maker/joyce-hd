'use client';
import { useState, useEffect } from 'react';

export default function ChartView({ svg, svgFull, summary, label, birthLine, pngHref }) {
  const [isMobile, setIsMobile] = useState(false);

  // 判斷是否為手機／平板（含 iPadOS 偽裝成 Mac 的情況）
  useEffect(() => {
    const touch = navigator.maxTouchPoints > 1;
    const ua = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    setIsMobile(ua || (touch && narrow) || narrow);
  }, []);

  const rows = [
    [['類型', summary.type], ['人生角色', summary.profile], ['定義', summary.definition]],
    [['內在權威', summary.authority], ['策略', summary.strategy], ['非自己主題', summary.notSelf]],
  ];

  // ── 手機版：整張 PNG，長按即可儲存
  if (isMobile) {
    return (
      <main className="m">
        <header>
          <h1>{label}</h1>
          <p className="sub">{birthLine}</p>
        </header>

        <img className="shot" src={pngHref} alt={`${label} 的人類圖`} />

        <p className="tip">長按上方圖片 → 選擇「加入照片」或「儲存影像」即可存進相簿</p>

        <a className="dl" href={pngHref} target="_blank" rel="noopener">
          在新分頁開啟圖片
        </a>

        <nav className="nav">
          <a href="/">← 重新排盤</a>
          <a href="/transit">今日流日 →</a>
        </nav>

        <style jsx>{`
          .m { padding: 16px 12px 40px; max-width: 640px; margin: 0 auto; }
          header { text-align: center; margin-bottom: 14px; }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; letter-spacing: 2px; }
          .sub { margin: 0; font-size: 12px; color: var(--faint); letter-spacing: 1px; }
          .shot, .svgbox :global(svg) {
            width: 100%; height: auto; display: block; border-radius: 8px;
          }
          .tip {
            margin: 12px 0 0; font-size: 13px; color: var(--faint);
            text-align: center; line-height: 1.7;
          }
          .dl {
            display: block; text-align: center; text-decoration: none;
            margin-top: 14px; width: 100%; padding: 15px;
            background: var(--terracotta); color: #fff; border: none;
            border-radius: 10px; font-size: 16px; font-weight: 700;
            letter-spacing: 2px;
          }
          .dl:disabled { opacity: .6; }
          .nav { display: flex; justify-content: space-between; margin-top: 24px; }
          .nav a { font-size: 14px; text-decoration: none; }
        `}</style>
      </main>
    );
  }

  // ── 桌機版：左右等分
  return (
    <main>
      <header className="top">
        <a className="back" href="/">← 重新排盤</a>
        <div className="who">
          <h1>{label}</h1>
          <p>{birthLine}</p>
        </div>
        <a className="link" href="/transit">今日流日 →</a>
      </header>

      <section className="split">
        <div className="chart" dangerouslySetInnerHTML={{ __html: svg }} />

        <div className="info">
          <div className="tables">
            {rows.map((row, i) => (
              <table key={i}>
                <thead><tr>{row.map(([k]) => <th key={k}>{k}</th>)}</tr></thead>
                <tbody><tr>{row.map(([k, v]) => <td key={k}>{v}</td>)}</tr></tbody>
              </table>
            ))}
            <table>
              <thead><tr><th>輪迴交叉</th></tr></thead>
              <tbody><tr><td className="cross">{summary.cross}</td></tr></tbody>
            </table>
          </div>

          <a className="dl" href={pngHref} download>下載人類圖</a>
        </div>
      </section>

      <style jsx>{`
        main { max-width: 1360px; margin: 0 auto; padding: 32px 24px 72px; }
        .top {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 28px;
        }
        .back, .link { font-size: 14px; text-decoration: none; white-space: nowrap; }
        .back:hover, .link:hover { text-decoration: underline; }
        .who { text-align: center; }
        h1 { font-size: 30px; font-weight: 700; margin: 0 0 6px; letter-spacing: 2px; }
        .who p { margin: 0; font-size: 13px; color: var(--faint); letter-spacing: 1px; }
        .split { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; align-items: stretch; }
        .chart :global(svg) { width: 100%; height: auto; display: block; }
        .info { display: flex; flex-direction: column; gap: 14px; justify-content: center; }
        .tables { display: flex; flex-direction: column; gap: 14px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th {
          background: var(--coffee); color: var(--bg);
          font-size: 15px; font-weight: 700; letter-spacing: 3px;
          padding: 12px 6px; border-right: 1px solid rgba(246,241,231,.45);
        }
        th:last-child { border-right: none; }
        td {
          background: var(--paper); border: 1px solid var(--line);
          font-size: 21px; font-weight: 700; text-align: center; padding: 20px 6px;
        }
        td.cross { font-size: 18px; line-height: 1.6; }
        .dl {
          display: block; text-align: center; text-decoration: none; box-sizing: border-box;
          margin-top: 10px; padding: 16px; width: 100%;
          background: var(--terracotta); color: #fff; border: none;
          border-radius: 10px; font-size: 17px; font-weight: 700;
          letter-spacing: 3px; cursor: pointer;
        }
        .dl:hover { background: #a85c3f; }
        .dl:disabled { opacity: .6; cursor: default; }
      `}</style>
    </main>
  );
}
