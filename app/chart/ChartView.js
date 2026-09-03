'use client';
import { useState, useEffect } from 'react';

export default function ChartView({ svg, svgFull, summary, label, birthLine, pngHref, birth, reportConfig }) {
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

  const reportCard = reportConfig?.enabled !== false && birth ? (
    <ReportCTA reportConfig={reportConfig} birth={birth} />
  ) : null;

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
          放大檢視圖片（可長按儲存）
        </a>
        <a className="dl2" href={`${pngHref}&dl=1`}>下載到檔案</a>

        {reportCard}

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
          .dl2 {
            display: block; text-align: center; text-decoration: none;
            margin-top: 10px; width: 100%; padding: 13px;
            background: transparent; color: var(--coffee);
            border: 1px solid var(--line); border-radius: 10px;
            font-size: 15px; font-weight: 700; letter-spacing: 2px;
            box-sizing: border-box;
          }
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

          <a className="dl" href={`${pngHref}&dl=1`} download>下載人類圖</a>

          {reportCard}
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

function ReportCTA({ reportConfig, birth }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function buy() {
    setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr('請輸入正確的 Email，報告會用這個信箱記錄訂單。');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/report/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...birth, email }),
      });
      if (res.headers.get('content-type')?.includes('text/html')) {
        const html = await res.text();
        const w = document.open('', '_self');
        w.document.write(html);
        w.document.close();
        return;
      }
      const d = await res.json();
      setErr(d.error || '建立訂單失敗，請稍後再試。');
      setBusy(false);
    } catch {
      setErr('連線發生問題，請稍後再試。');
      setBusy(false);
    }
  }

  return (
    <div className="report-cta">
      <p className="rc-h">{reportConfig.heading || '你的專屬解圖報告'}</p>
      <p className="rc-p">{reportConfig.intro}</p>
      {(reportConfig.bullets || []).length > 0 && (
        <ul className="rc-list">
          {reportConfig.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      )}
      <div className="rc-row">
        <span className="rc-price">NT$ {reportConfig.price || 99}</span>
        {reportConfig.sampleEnabled !== false && (
          <a className="rc-sample" href="/api/report/sample-pdf" target="_blank" rel="noopener">
            查看範例 PDF →
          </a>
        )}
      </div>

      {!showForm ? (
        <button className="rc-buy" onClick={() => setShowForm(true)}>解鎖我的專屬報告</button>
      ) : (
        <div className="rc-form">
          <input
            type="email" placeholder="輸入 Email 接收報告"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button className="rc-buy" onClick={buy} disabled={busy}>
            {busy ? '前往付款中…' : `付款 NT$${reportConfig.price || 99} 並生成`}
          </button>
        </div>
      )}
      {err && <p className="rc-err">{err}</p>}

      <style jsx>{`
        .report-cta {
          margin-top: 18px; padding: 20px; border-radius: 12px;
          background: var(--paper); border: 1px solid var(--terracotta);
          text-align: left;
        }
        .rc-h { font-size: 16px; font-weight: 700; color: var(--terracotta); margin: 0 0 8px; }
        .rc-p { font-size: 13.5px; color: var(--ink); line-height: 1.8; margin: 0 0 10px; }
        .rc-list { margin: 0 0 14px; padding-left: 18px; }
        .rc-list li { font-size: 13px; color: var(--faint); line-height: 1.8; }
        .rc-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .rc-price { font-size: 20px; font-weight: 700; color: var(--coffee); }
        .rc-sample { font-size: 12.5px; text-decoration: none; }
        .rc-buy {
          width: 100%; padding: 13px; border: none; border-radius: 9px;
          background: var(--terracotta); color: #fff; font-weight: 700;
          font-size: 15px; cursor: pointer; letter-spacing: 1px;
        }
        .rc-buy:disabled { opacity: .6; cursor: default; }
        .rc-form input {
          width: 100%; box-sizing: border-box; padding: 11px 12px; margin-bottom: 8px;
          border: 1px solid var(--line); border-radius: 8px; font-size: 14px;
        }
        .rc-err { font-size: 12.5px; color: var(--red); margin: 8px 0 0; }
      `}</style>
    </div>
  );
}
