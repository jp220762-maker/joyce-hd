'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES, CITY_GROUPS } from '../lib/cities';

const YEARS = Array.from({ length: 116 }, (_, i) => 2026 - i);
const pad = (n) => String(n).padStart(2, '0');

export default function Home() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', year: 1990, month: 1, day: 1, hour: 12, minute: 0,
    tz: 'Asia/Taipei', city: '台北市',
  });
  const [going, setGoing] = useState(false);

  const daysInMonth = new Date(form.year, form.month, 0).getDate();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    setGoing(true);
    const q = new URLSearchParams({
      name: form.name,
      y: form.year, m: form.month, d: Math.min(form.day, daysInMonth),
      h: form.hour, mi: form.minute, tz: form.tz, city: form.city,
    });
    router.push(`/chart?${q.toString()}`);
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">HUMAN DESIGN</p>
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
            <select
              value={form.tz + '|' + form.city}
              onChange={(e) => {
                const [tz, city] = e.target.value.split('|');
                setForm((f) => ({ ...f, tz, city }));
              }}
            >
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

        <button className="cta" onClick={submit} disabled={going}>
          {going ? '計算中…' : '生成人類圖'}
        </button>
        <p className="note">
          出生地決定時區換算，系統已涵蓋各地歷史夏令時間規則。不確定出生時間的話，
          可先用中午 12:00 生成，類型與內在權威通常不受影響。
        </p>
      </section>

      <footer className="foot">
        <a href="/articles">閱讀文章</a>
        <span className="sep">·</span>
        <a href="/transit">查看今日流日 →</a>
        <a className="admin" href="/admin">管理</a>
      </footer>

      <style jsx>{`
        main { max-width: 900px; margin: 0 auto; padding: 64px 20px 80px; }
        .hero { text-align: center; margin-bottom: 40px; }
        .eyebrow { font-size: 12px; letter-spacing: 4px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 42px; font-weight: 700; margin: 0 0 16px; letter-spacing: 3px; }
        .lede { color: var(--faint); line-height: 2; margin: 0; font-size: 16px; }
        .panel {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 16px; padding: 28px;
        }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .span2 { grid-column: span 2; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field span { font-size: 13px; color: var(--faint); letter-spacing: 1px; }
        .field input, .field select {
          padding: 11px 12px; border: 1px solid var(--line); border-radius: 8px;
          background: #fff; color: var(--ink); font-size: 16px;
        }
        .cta {
          margin-top: 24px; width: 100%; padding: 15px;
          background: var(--coffee); color: var(--bg); border: none;
          border-radius: 10px; font-size: 17px; font-weight: 700;
          letter-spacing: 3px; cursor: pointer;
        }
        .cta:hover { background: var(--ink); }
        .cta:disabled { opacity: .6; cursor: default; }
        .note { font-size: 13px; color: var(--faint); line-height: 1.9; margin: 16px 0 0; }
        .foot { text-align: center; margin-top: 48px; }
        .foot a { font-size: 15px; text-decoration: none; }
        .foot .sep { color: var(--line); margin: 0 12px; }
        .foot a:hover { text-decoration: underline; }
        .foot .admin {
          display: block; margin-top: 20px;
          font-size: 12px; color: var(--line); letter-spacing: 2px;
        }
        .foot .admin:hover { color: var(--faint); }
        @media (max-width: 720px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
          h1 { font-size: 32px; }
          main { padding: 40px 16px 60px; }
        }
      `}</style>
    </main>
  );
}
