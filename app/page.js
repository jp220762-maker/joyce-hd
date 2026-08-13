'use client';
import { useState } from 'react';
import { CITIES, CITY_GROUPS } from '../lib/cities';

const YEARS = Array.from({ length: 116 }, (_, i) => 2026 - i);
const pad = (n) => String(n).padStart(2, '0');

export default function Home() {
  const [form, setForm] = useState({
    name: '', year: 1990, month: 1, day: 1, hour: 12, minute: 0, tz: 'Asia/Taipei',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const daysInMonth = new Date(form.year, form.month, 0).getDate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, day: Math.min(form.day, daysInMonth) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || '排盤失敗，請確認出生資料後再試一次。');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">人類圖 Human Design</p>
        <h1>你的人類圖</h1>
        <p className="lede">
          輸入出生日期、時間與地點，生成專屬人體圖。<br />
          出生時間越精確，人生角色與輪迴交叉的判定越準確。
        </p>
      </header>

      <section className="panel">
        <div className="grid">
          <label className="field span2">
            <span>姓名（選填，會顯示在圖上）</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="例如：Joyce" />
          </label>

          <label className="field">
            <span>出生年</span>
            <select value={form.year} onChange={(e) => set('year', +e.target.value)}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>

          <label className="field">
            <span>月</span>
            <select value={form.month} onChange={(e) => set('month', +e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="field">
            <span>日</span>
            <select value={Math.min(form.day, daysInMonth)} onChange={(e) => set('day', +e.target.value)}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <label className="field">
            <span>時（24小時制）</span>
            <select value={form.hour} onChange={(e) => set('hour', +e.target.value)}>
              {Array.from({ length: 24 }, (_, i) => i).map((h) => <option key={h} value={h}>{pad(h)}</option>)}
            </select>
          </label>

          <label className="field">
            <span>分</span>
            <select value={form.minute} onChange={(e) => set('minute', +e.target.value)}>
              {Array.from({ length: 60 }, (_, i) => i).map((m) => <option key={m} value={m}>{pad(m)}</option>)}
            </select>
          </label>

          <label className="field span2">
            <span>出生地</span>
            <select value={form.tz + '|' + (form.city || '台北市')} onChange={(e) => {
              const [tz, city] = e.target.value.split('|');
              setForm((f) => ({ ...f, tz, city }));
            }}>
              {CITY_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {CITIES.filter((c) => c.group === g).map((c) => (
                    <option key={c.name} value={c.tz + '|' + c.name}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <button className="cta" onClick={submit} disabled={loading}>
          {loading ? '計算中…' : '生成人類圖'}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="note">
          出生地決定時區換算，系統已涵蓋各地歷史夏令時間規則。不確定出生時間的話，可先用中午 12:00 生成，類型與內在權威通常不受影響。
        </p>
      </section>

      {result && <ChartResult result={result} />}

      <footer className="foot">
        <a href="/transit">查看今日流日 →</a>
      </footer>

      <style jsx>{`
        main { max-width: 980px; margin: 0 auto; padding: 48px 20px 80px; }
        .hero { text-align: center; margin-bottom: 40px; }
        .eyebrow {
          font-size: 12px; letter-spacing: 4px; color: var(--faint);
          text-transform: uppercase; margin: 0 0 12px;
        }
        h1 { font-size: 40px; font-weight: 700; margin: 0 0 16px; letter-spacing: 2px; }
        .lede { color: var(--faint); line-height: 1.9; margin: 0; font-size: 15px; }
        .panel {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 16px; padding: 28px;
        }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .span2 { grid-column: span 2; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field span { font-size: 12px; color: var(--faint); letter-spacing: 1px; }
        .field input, .field select {
          padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px;
          background: #fff; color: var(--ink); font-size: 15px;
        }
        .cta {
          margin-top: 24px; width: 100%; padding: 14px;
          background: var(--coffee); color: var(--bg); border: none;
          border-radius: 10px; font-size: 16px; font-weight: 700;
          letter-spacing: 2px; cursor: pointer;
        }
        .cta:hover { background: var(--ink); }
        .cta:disabled { opacity: .6; cursor: default; }
        .error { color: var(--red); font-size: 14px; margin: 12px 0 0; }
        .note { font-size: 12px; color: var(--faint); line-height: 1.8; margin: 16px 0 0; }
        .foot { text-align: center; margin-top: 40px; }
        .foot a { font-size: 14px; text-decoration: none; }
        .foot a:hover { text-decoration: underline; }
        @media (max-width: 720px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
          h1 { font-size: 30px; }
        }
      `}</style>
    </main>
  );
}

function ChartResult({ result }) {
  const { svg, summary, design, personality } = result;
  return (
    <section className="result">
      <div className="chart" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="side">
        <div className="card">
          <h2>基本資訊</h2>
          <dl>
            <div><dt>類型</dt><dd>{summary.type}</dd></div>
            <div><dt>人生角色</dt><dd>{summary.profile}</dd></div>
            <div><dt>定義</dt><dd>{summary.definition}</dd></div>
            <div><dt>內在權威</dt><dd>{summary.authority}</dd></div>
            <div><dt>策略</dt><dd>{summary.strategy}</dd></div>
            <div><dt>非自己主題</dt><dd>{summary.notSelf}</dd></div>
          </dl>
          <p className="cross">{summary.cross}</p>
        </div>
        <div className="card">
          <h2>通道與定義中心</h2>
          <p className="chips">{summary.channels.map((c) => <span key={c}>{c}</span>)}</p>
          <p className="chips">{summary.centers.map((c) => <span key={c} className="ctr">{c}</span>)}</p>
        </div>
      </div>
      <style jsx>{`
        .result {
          margin-top: 40px; display: grid; grid-template-columns: 1.15fr .85fr;
          gap: 24px; align-items: start;
        }
        .chart :global(svg) { width: 100%; height: auto; display: block; }
        .side { display: flex; flex-direction: column; gap: 16px; }
        .card {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 20px;
        }
        h2 { font-size: 13px; letter-spacing: 3px; color: var(--faint);
             margin: 0 0 14px; font-weight: 700; }
        dl { margin: 0; display: grid; gap: 10px; }
        dl div { display: flex; justify-content: space-between;
                 border-bottom: 1px solid var(--line); padding-bottom: 8px; }
        dt { font-size: 13px; color: var(--faint); }
        dd { margin: 0; font-weight: 700; font-size: 15px; }
        .cross { margin: 14px 0 0; font-size: 14px; line-height: 1.7; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
        .chips span {
          font-size: 12px; padding: 4px 9px; border-radius: 20px;
          background: #fff; border: 1px solid var(--line);
        }
        .chips .ctr { background: var(--gold); border-color: var(--gold); color: #fff; }
        @media (max-width: 860px) {
          .result { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
