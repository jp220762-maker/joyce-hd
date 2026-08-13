'use client';
import { useState } from 'react';

export default function ChartView({ svg, svgFull, summary, label, birthLine }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const img = new Image();
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFull);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const scale = 2;
      const cv = document.createElement('canvas');
      cv.width = 900 * scale; cv.height = 1180 * scale;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#F6F1E7';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const a = document.createElement('a');
      a.download = `${label}-人類圖.png`;
      a.href = cv.toDataURL('image/png');
      a.click();
    } catch {
      alert('下載失敗，可以改用長按或右鍵儲存圖片。');
    } finally {
      setBusy(false);
    }
  }

  const rows = [
    [['類型', summary.type], ['人生角色', summary.profile], ['定義', summary.definition]],
    [['內在權威', summary.authority], ['策略', summary.strategy], ['非自己主題', summary.notSelf]],
  ];

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

          <button className="dl" onClick={download} disabled={busy}>
            {busy ? '準備中…' : '下載人類圖'}
          </button>
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

        /* 電腦版：左右等分，上下同高對齊 */
        .split {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 28px; align-items: stretch;
        }
        .chart { display: flex; }
        .chart :global(svg) { width: 100%; height: auto; align-self: flex-start; }

        .info { display: flex; flex-direction: column; gap: 14px; }
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
          margin-top: auto; padding: 16px; width: 100%;
          background: var(--terracotta); color: #fff; border: none;
          border-radius: 10px; font-size: 17px; font-weight: 700;
          letter-spacing: 3px; cursor: pointer;
        }
        .dl:hover { background: #a85c3f; }
        .dl:disabled { opacity: .6; cursor: default; }

        /* 手機版：摘要移到圖下方 */
        @media (max-width: 900px) {
          main { padding: 24px 16px 56px; }
          .split { grid-template-columns: 1fr; gap: 20px; }
          .top { flex-wrap: wrap; justify-content: center; }
          .who { order: -1; width: 100%; }
          h1 { font-size: 24px; }
          th { font-size: 13px; letter-spacing: 2px; padding: 10px 4px; }
          td { font-size: 18px; padding: 16px 4px; }
          td.cross { font-size: 15px; }
          .dl { margin-top: 6px; }
        }
      `}</style>
    </main>
  );
}
