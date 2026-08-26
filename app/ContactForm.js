'use client';
import { useState } from 'react';

export default function ContactForm({ services = [] }) {
  const [f, setF] = useState({ name: '', email: '', topic: '', message: '', website: '' });
  const [state, setState] = useState('idle');   // idle | sending | done | error
  const [err, setErr] = useState('');

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setState('sending'); setErr('');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || '傳送失敗'); setState('error'); return; }
      setState('done');
      setF({ name: '', email: '', topic: '', message: '', website: '' });
    } catch {
      setErr('網路連線出了點狀況，請稍後再試。');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="done">
        <p className="big">訊息已送出</p>
        <p>謝謝你寫信給我，我會盡快回覆。</p>
        <button onClick={() => setState('idle')}>再寫一封</button>
        <style jsx>{`
          .done {
            text-align: center; padding: 44px 24px;
            background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
          }
          .big { font-size: 20px; font-weight: 700; color: var(--coffee); margin: 0 0 10px; letter-spacing: 2px; }
          p { margin: 0 0 20px; font-size: 15px; color: var(--faint); line-height: 1.9; }
          button {
            padding: 11px 26px; border-radius: 9px; cursor: pointer;
            background: transparent; border: 1px solid var(--line); color: var(--ink); font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="cf">
      <div className="two">
        <label>
          <span>你的稱呼 *</span>
          <input value={f.name} onChange={(e) => set('name', e.target.value)}
                 placeholder="怎麼稱呼你？" required />
        </label>
        <label>
          <span>Email *</span>
          <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)}
                 placeholder="我會回信到這個信箱" required />
        </label>
      </div>

      <label>
        <span>想聊的主題</span>
        <select value={f.topic} onChange={(e) => set('topic', e.target.value)}>
          <option value="">（選填）</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="其他">其他</option>
        </select>
      </label>

      <label>
        <span>想說的話 *</span>
        <textarea rows={6} value={f.message} onChange={(e) => set('message', e.target.value)}
                  placeholder="不用寫得很完整，想到什麼就寫什麼。" required />
      </label>

      {/* 蜜罐欄位：機器人才會填，一般使用者看不到 */}
      <input className="hp" tabIndex={-1} autoComplete="off"
             value={f.website} onChange={(e) => set('website', e.target.value)} />

      {err && <p className="err">{err}</p>}

      <button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? '傳送中…' : '送出訊息'}
      </button>
      <p className="note">你的信箱只會用來回覆這封訊息，不會用於其他用途。</p>

      <style jsx>{`
        .cf { text-align: left; }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { display: block; margin-bottom: 16px; }
        label > span {
          display: block; font-size: 13px; color: var(--faint);
          letter-spacing: 1px; margin-bottom: 6px;
        }
        input, select, textarea {
          display: block; width: 100%; box-sizing: border-box;
          padding: 12px; font-size: 15px; font-family: inherit;
          border: 1px solid var(--line); border-radius: 9px;
          background: #fff; color: var(--ink); line-height: 1.8;
        }
        textarea { resize: vertical; }
        .hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
        .err { color: var(--red); font-size: 14px; margin: 0 0 14px; }
        button[type='submit'] {
          width: 100%; padding: 15px; border: none; border-radius: 10px;
          background: var(--coffee); color: var(--bg);
          font-size: 16px; font-weight: 700; letter-spacing: 3px; cursor: pointer;
        }
        button[type='submit']:hover { background: var(--ink); }
        button[type='submit']:disabled { opacity: .6; cursor: default; }
        .note { font-size: 12px; color: var(--faint); text-align: center; margin: 14px 0 0; }
        @media (max-width: 620px) { .two { grid-template-columns: 1fr; } }
      `}</style>
    </form>
  );
}
