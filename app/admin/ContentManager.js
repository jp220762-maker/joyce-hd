'use client';
import { useEffect, useState } from 'react';

export default function ContentManager({ adminKey }) {
  const [c, setC] = useState(null);
  const [msg, setMsg] = useState('');
  const [sec, setSec] = useState('site');

  useEffect(() => {
    fetch(`/api/content?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' })
      .then((r) => r.json()).then((d) => setC(d.content));
  }, []);

  async function save() {
    setMsg('儲存中…');
    const r = await fetch(`/api/content?key=${encodeURIComponent(adminKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
    const d = await r.json();
    setMsg(r.ok ? '✓ 已儲存，重新整理前台即可看到' : '✗ ' + (d.error || '失敗'));
    setTimeout(() => setMsg(''), 3500);
  }

  if (!c) return <p className="loading">載入中…</p>;

  const up = (path, val) => {
    setC((prev) => {
      const next = structuredClone(prev);
      let o = next;
      for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
      o[path[path.length - 1]] = val;
      return next;
    });
  };

  const SECTIONS = [
    ['site', '網站標語'],
    ['about', '關於我'],
    ['services', '服務項目'],
    ['faq', '常見問題'],
    ['booking', '預約設定'],
    ['contact', '聯絡與社群'],
  ];

  return (
    <div className="cm">
      <div className="head">
        <div className="tabs">
          {SECTIONS.map(([k, label]) => (
            <button key={k} className={sec === k ? 'on' : ''} onClick={() => setSec(k)}>{label}</button>
          ))}
        </div>
        <div className="acts">
          {msg && <span className="msg">{msg}</span>}
          <button className="primary" onClick={save}>儲存全部</button>
        </div>
      </div>

      {sec === 'site' && (
        <div className="pane">
          <L t="網站名稱"><input value={c.site.name} onChange={(e) => up(['site','name'], e.target.value)} /></L>
          <L t="首頁主標"><input value={c.site.intro} onChange={(e) => up(['site','intro'], e.target.value)} /></L>
          <L t="標語（首頁副標）"><textarea rows={3} value={c.site.tagline} onChange={(e) => up(['site','tagline'], e.target.value)} /></L>
        </div>
      )}

      {sec === 'about' && (
        <div className="pane">
          <L t="頁面標題"><input value={c.about.heading} onChange={(e) => up(['about','heading'], e.target.value)} /></L>
          <L t="內文（一段一行）">
            <textarea rows={14} value={c.about.body.join('\n')}
              onChange={(e) => up(['about','body'], e.target.value.split('\n').map(s=>s.trim()).filter(Boolean))} />
          </L>
          <L t="學習與認證（一項一行）">
            <textarea rows={4} value={c.about.credentials.join('\n')}
              onChange={(e) => up(['about','credentials'], e.target.value.split('\n').map(s=>s.trim()).filter(Boolean))} />
          </L>
          <L t="人類圖說明文字"><input value={c.about.chartCaption} onChange={(e) => up(['about','chartCaption'], e.target.value)} /></L>
        </div>
      )}

      {sec === 'services' && (
        <div className="pane">
          <L t="頁面標題"><input value={c.services.heading} onChange={(e) => up(['services','heading'], e.target.value)} /></L>
          <L t="頁面說明"><input value={c.services.lede} onChange={(e) => up(['services','lede'], e.target.value)} /></L>
          {c.services.items.map((s, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>項目 {i + 1}</b>
                <button className="del" onClick={() => {
                  if (confirm(`刪除「${s.name}」？`)) up(['services','items'], c.services.items.filter((_, k) => k !== i));
                }}>刪除</button>
              </div>
              <input placeholder="服務名稱" value={s.name}
                onChange={(e) => { const a=[...c.services.items]; a[i]={...s,name:e.target.value}; up(['services','items'],a); }} />
              <div className="two">
                <input placeholder="時長" value={s.duration}
                  onChange={(e) => { const a=[...c.services.items]; a[i]={...s,duration:e.target.value}; up(['services','items'],a); }} />
                <input placeholder="價格" value={s.price}
                  onChange={(e) => { const a=[...c.services.items]; a[i]={...s,price:e.target.value}; up(['services','items'],a); }} />
              </div>
              <textarea rows={3} placeholder="服務說明" value={s.desc}
                onChange={(e) => { const a=[...c.services.items]; a[i]={...s,desc:e.target.value}; up(['services','items'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['services','items'],
            [...c.services.items, { name:'新服務', duration:'', price:'請洽詢', desc:'' }])}>+ 新增服務項目</button>
        </div>
      )}

      {sec === 'faq' && (
        <div className="pane">
          {c.services.faq.map((f, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>問題 {i + 1}</b>
                <button className="del" onClick={() => up(['services','faq'], c.services.faq.filter((_, k) => k !== i))}>刪除</button>
              </div>
              <input placeholder="問題" value={f.q}
                onChange={(e) => { const a=[...c.services.faq]; a[i]={...f,q:e.target.value}; up(['services','faq'],a); }} />
              <textarea rows={3} placeholder="回答" value={f.a}
                onChange={(e) => { const a=[...c.services.faq]; a[i]={...f,a:e.target.value}; up(['services','faq'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['services','faq'], [...c.services.faq, { q:'', a:'' }])}>+ 新增問題</button>
        </div>
      )}

      {sec === 'booking' && (
        <div className="pane">
          <L t="區塊標題"><input value={c.booking.heading} onChange={(e) => up(['booking','heading'], e.target.value)} /></L>
          <L t="說明文字"><input value={c.booking.lede} onChange={(e) => up(['booking','lede'], e.target.value)} /></L>
          <L t="預約系統嵌入網址（Google 日曆或 Calendly，留空則顯示下方備註）">
            <input placeholder="https://calendar.google.com/calendar/appointments/…" value={c.booking.embedUrl}
              onChange={(e) => up(['booking','embedUrl'], e.target.value)} />
          </L>
          <L t="未設定時顯示的備註"><textarea rows={3} value={c.booking.note} onChange={(e) => up(['booking','note'], e.target.value)} /></L>
        </div>
      )}

      {sec === 'contact' && (
        <div className="pane">
          <L t="Email"><input value={c.contact.email} onChange={(e) => up(['contact','email'], e.target.value)} /></L>
          <L t="LINE ID"><input value={c.contact.line} onChange={(e) => up(['contact','line'], e.target.value)} /></L>
          {c.contact.social.map((s, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>社群 {i + 1}</b>
                <button className="del" onClick={() => up(['contact','social'], c.contact.social.filter((_, k) => k !== i))}>刪除</button>
              </div>
              <div className="two">
                <input placeholder="名稱" value={s.name}
                  onChange={(e) => { const a=[...c.contact.social]; a[i]={...s,name:e.target.value}; up(['contact','social'],a); }} />
                <input placeholder="網址" value={s.url}
                  onChange={(e) => { const a=[...c.contact.social]; a[i]={...s,url:e.target.value}; up(['contact','social'],a); }} />
              </div>
            </div>
          ))}
          <button className="add" onClick={() => up(['contact','social'], [...c.contact.social, { name:'', url:'' }])}>+ 新增社群連結</button>
        </div>
      )}

      <style jsx>{`
        .cm { margin-top: 8px; }
        .loading { color: var(--faint); padding: 40px; text-align: center; }
        .head { display: flex; align-items: center; justify-content: space-between;
                flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .tabs button {
          font-size: 13px; padding: 7px 16px; border-radius: 18px; cursor: pointer;
          border: 1px solid var(--line); background: var(--paper); color: var(--ink);
        }
        .tabs button.on { background: var(--coffee); color: var(--bg); border-color: var(--coffee); }
        .acts { display: flex; align-items: center; gap: 10px; }
        .msg { font-size: 13px; color: var(--coffee); }
        .primary {
          background: var(--terracotta); color: #fff; border: none;
          padding: 9px 22px; border-radius: 8px; font-size: 14px;
          font-weight: 700; cursor: pointer;
        }
        .pane { background: var(--paper); border: 1px solid var(--line);
                border-radius: 14px; padding: 24px; }
        .row { border: 1px solid var(--line); border-radius: 10px;
               padding: 16px; margin-bottom: 12px; background: #fff; }
        .rowhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .rowhead b { font-size: 13px; color: var(--faint); letter-spacing: 1px; }
        .del { font-size: 12px; color: var(--red); background: none;
               border: 1px solid #E8C9C4; border-radius: 6px; padding: 4px 12px; cursor: pointer; }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .add {
          width: 100%; padding: 12px; margin-top: 4px; cursor: pointer;
          background: transparent; border: 1px dashed var(--line);
          border-radius: 10px; font-size: 14px; color: var(--coffee);
        }
        .add:hover { border-color: var(--coffee); background: #fff; }
      `}</style>
      <style jsx global>{`
        .cm input, .cm textarea {
          display: block; width: 100%; box-sizing: border-box;
          padding: 10px 12px; margin-bottom: 8px; font-size: 15px;
          border: 1px solid var(--line); border-radius: 8px;
          background: #fff; color: var(--ink); font-family: inherit; line-height: 1.8;
        }
        .cm label { display: block; margin-bottom: 18px; }
        .cm label > span {
          display: block; font-size: 13px; color: var(--faint);
          letter-spacing: 1px; margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}

function L({ t, children }) {
  return <label><span>{t}</span>{children}</label>;
}
