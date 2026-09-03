'use client';
import { useEffect, useState } from 'react';

export default function ContentManager({ adminKey }) {
  const [c, setC] = useState(null);
  const [msg, setMsg] = useState('');
  const [sec, setSec] = useState('site');

  useEffect(() => {
    fetch(`/api/content?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' })
      .then((r) => r.json()).then((d) => {
        const x = d.content || {};
        // 補齊欄位，避免舊資料缺少新區塊時當掉
        setC({
          site: { logoUrl:'', logoHeight:46, ambienceUrl:'', ambienceQuote:'',
                  showAmbience:true, portraitUrl:'', portraitShape:'circle',
                  portraitSize:240, name:'', intro:'', tagline:'', ...(x.site||{}) },
          about: { heading:'關於我', body:[], credentials:[], chartCaption:'', chartNotes:[], ...(x.about||{}) },
          services: { heading:'服務項目', lede:'', items:[], faq:[], ...(x.services||{}) },
          testimonials: { heading:'聽聽他們怎麼說', lede:'', show:true, items:[], ...(x.testimonials||{}) },
          cases: { heading:'個案分享', lede:'', show:true, items:[], ...(x.cases||{}) },
          booking: { heading:'預約', lede:'', embedUrl:'', note:'', ...(x.booking||{}) },
          homepage: { order:['ambience','services','chart','testimonials','cases','posts'], ...(x.homepage||{}) },
          postsSection: { heading:'最近的文字', show:true, ...(x.postsSection||{}) },
          chartReport: { enabled:true, price:99, heading:'', intro:'', bullets:[],
                         ctaText:'', ctaUrl:'', sampleEnabled:true, sampleLabel:'',
                         sampleShowBirth:false, sampleBirthLine:'', sampleText:'', ...(x.chartReport||{}) },
          contact: { email:'', line:'', social:[], ...(x.contact||{}) },
        });
      });
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
    ['brand', '品牌形象'],
    ['voices', '顧客回饋'],
    ['cases', '個案分享'],
    ['about', '關於我'],
    ['services', '服務項目'],
    ['layout', '首頁排版'],
    ['report', '解圖報告'],
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

      {sec === 'brand' && (
        <div className="pane">
          <ImageSlot label="網站 Logo（建議 PNG 去背）" slot="logo" adminKey={adminKey}
            current={c.site.logoUrl} onDone={(u) => up(['site','logoUrl'], u)} />
          <L t={`Logo 顯示高度：${c.site.logoHeight || 46} px（導覽列高度，建議 40–90）`}>
            <input type="range" min="30" max="120" step="2"
              value={c.site.logoHeight || 46}
              onChange={(e) => up(['site','logoHeight'], Number(e.target.value))} />
          </L>

          <hr />

          <ImageSlot label="首頁品牌氛圍圖（建議橫式）" slot="ambience" adminKey={adminKey}
            current={c.site.ambienceUrl} onDone={(u) => up(['site','ambienceUrl'], u)} />
          <L t="氛圍圖上的文字">
            <input value={c.site.ambienceQuote || ''}
              onChange={(e) => up(['site','ambienceQuote'], e.target.value)} />
          </L>
          <L t="是否顯示氛圍圖">
            <select value={c.site.showAmbience ? '1' : '0'}
              onChange={(e) => up(['site','showAmbience'], e.target.value === '1')}>
              <option value="1">顯示</option>
              <option value="0">隱藏</option>
            </select>
          </L>

          <hr />

          <ImageSlot label="個人形象照" slot="portrait" adminKey={adminKey}
            current={c.site.portraitUrl} onDone={(u) => up(['site','portraitUrl'], u)} />
          <L t="形象照形狀">
            <select value={c.site.portraitShape || 'circle'}
              onChange={(e) => up(['site','portraitShape'], e.target.value)}>
              <option value="circle">圓形</option>
              <option value="square">方形（圓角）</option>
              <option value="original">原始比例</option>
            </select>
          </L>
          <L t={`形象照大小：${c.site.portraitSize || 240} px`}>
            <input type="range" min="140" max="420" step="10"
              value={c.site.portraitSize || 240}
              onChange={(e) => up(['site','portraitSize'], Number(e.target.value))} />
          </L>
          <div className="preview">
            <img src={c.site.portraitUrl || '/images/joyce.jpg'} alt="預覽"
              style={{
                width: (c.site.portraitSize || 240) + 'px',
                aspectRatio: c.site.portraitShape === 'original' ? 'auto' : '1 / 1',
                objectFit: c.site.portraitShape === 'original' ? 'contain' : 'cover',
                borderRadius: c.site.portraitShape === 'circle' ? '50%' : '16px',
              }} />
          </div>
        </div>
      )}

      {sec === 'voices' && (
        <div className="pane">
          <L t="區塊標題"><input value={c.testimonials.heading}
            onChange={(e) => up(['testimonials','heading'], e.target.value)} /></L>
          <L t="區塊說明"><input value={c.testimonials.lede}
            onChange={(e) => up(['testimonials','lede'], e.target.value)} /></L>
          <L t="是否顯示於首頁">
            <select value={c.testimonials.show ? '1' : '0'}
              onChange={(e) => up(['testimonials','show'], e.target.value === '1')}>
              <option value="1">顯示</option>
              <option value="0">隱藏</option>
            </select>
          </L>
          {(c.testimonials.items || []).map((t, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>回饋 {i + 1}</b>
                <button className="del" onClick={() =>
                  up(['testimonials','items'], (c.testimonials.items || []).filter((_, k) => k !== i))}>刪除</button>
              </div>
              <div className="two">
                <input placeholder="稱呼（例如：小敏、Y 女士）" value={t.name}
                  onChange={(e) => { const a=[...(c.testimonials.items || [])]; a[i]={...t,name:e.target.value}; up(['testimonials','items'],a); }} />
                <input placeholder="服務項目" value={t.title}
                  onChange={(e) => { const a=[...(c.testimonials.items || [])]; a[i]={...t,title:e.target.value}; up(['testimonials','items'],a); }} />
              </div>
              <textarea rows={3} placeholder="回饋內容" value={t.text}
                onChange={(e) => { const a=[...(c.testimonials.items || [])]; a[i]={...t,text:e.target.value}; up(['testimonials','items'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['testimonials','items'],
            [...(c.testimonials.items || []), { name:'', title:'', text:'' }])}>+ 新增回饋</button>
        </div>
      )}

      {sec === 'cases' && (
        <div className="pane">
          <L t="區塊標題"><input value={c.cases.heading}
            onChange={(e) => up(['cases','heading'], e.target.value)} /></L>
          <L t="警語（顯示於區塊下方）"><input value={c.cases.lede}
            onChange={(e) => up(['cases','lede'], e.target.value)} /></L>
          <L t="是否顯示於首頁">
            <select value={c.cases.show ? '1' : '0'}
              onChange={(e) => up(['cases','show'], e.target.value === '1')}>
              <option value="1">顯示</option><option value="0">隱藏</option>
            </select>
          </L>
          {(c.cases.items || []).map((k, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>個案 {i + 1}</b>
                <button className="del" onClick={() =>
                  up(['cases','items'], (c.cases.items || []).filter((_, n) => n !== i))}>刪除</button>
              </div>
              <input placeholder="標題" value={k.title}
                onChange={(e) => { const a=[...(c.cases.items||[])]; a[i]={...k,title:e.target.value}; up(['cases','items'],a); }} />
              <input placeholder="背景（例如：30多歲・投射者・行銷企劃）" value={k.who}
                onChange={(e) => { const a=[...(c.cases.items||[])]; a[i]={...k,who:e.target.value}; up(['cases','items'],a); }} />
              <textarea rows={5} placeholder="故事內容" value={k.story}
                onChange={(e) => { const a=[...(c.cases.items||[])]; a[i]={...k,story:e.target.value}; up(['cases','items'],a); }} />
              <ImageSlot label="配圖（選填，可用於左右對照解圖）" slot={`case-${k.id || i}`} adminKey={adminKey}
                current={k.image} onDone={(u) => { const a=[...(c.cases.items||[])]; a[i]={...k,image:u}; up(['cases','items'],a); }} />
              <L t="是否顯示這張圖片">
                <select value={k.showImage !== false ? '1' : '0'}
                  onChange={(e) => { const a=[...(c.cases.items||[])]; a[i]={...k,showImage:e.target.value==='1'}; up(['cases','items'],a); }}>
                  <option value="1">顯示</option><option value="0">隱藏（保留圖片，僅不顯示）</option>
                </select>
              </L>
            </div>
          ))}
          <button className="add" onClick={() => up(['cases','items'],
            [...(c.cases.items||[]), { id:'c'+Date.now(), title:'', who:'', story:'', image:'', showImage:true }])}>+ 新增個案</button>
        </div>
      )}

      {sec === 'about' && (
        <div className="pane">
          <L t="頁面標題"><input value={c.about.heading} onChange={(e) => up(['about','heading'], e.target.value)} /></L>
          <L t="是否顯示（隱藏後導覽列不出現「關於我」連結）">
            <select value={c.about.show !== false ? '1' : '0'}
              onChange={(e) => up(['about','show'], e.target.value === '1')}>
              <option value="1">顯示</option><option value="0">隱藏</option>
            </select>
          </L>
          <L t="內文（一段一行）">
            <textarea rows={14} value={(c.about.body || []).join('\n')}
              onChange={(e) => up(['about','body'], e.target.value.split('\n').map(s=>s.trim()).filter(Boolean))} />
          </L>
          <L t="學習與認證（一項一行）">
            <textarea rows={4} value={(c.about.credentials || []).join('\n')}
              onChange={(e) => up(['about','credentials'], e.target.value.split('\n').map(s=>s.trim()).filter(Boolean))} />
          </L>
          <L t="人類圖說明文字"><input value={c.about.chartCaption} onChange={(e) => up(['about','chartCaption'], e.target.value)} /></L>
          <hr />
          <p className="sub">我圖上的關鍵特色</p>
          {(c.about.chartNotes || []).map((n, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>特色 {i + 1}</b>
                <button className="del" onClick={() =>
                  up(['about','chartNotes'], (c.about.chartNotes || []).filter((_, k) => k !== i))}>刪除</button>
              </div>
              <input placeholder="標題（例如：4/6 人生角色）" value={n.t}
                onChange={(e) => { const a=[...(c.about.chartNotes||[])]; a[i]={...n,t:e.target.value}; up(['about','chartNotes'],a); }} />
              <textarea rows={3} placeholder="說明" value={n.d}
                onChange={(e) => { const a=[...(c.about.chartNotes||[])]; a[i]={...n,d:e.target.value}; up(['about','chartNotes'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['about','chartNotes'],
            [...(c.about.chartNotes||[]), { t:'', d:'' }])}>+ 新增特色</button>
        </div>
      )}

      {sec === 'services' && (
        <div className="pane">
          <L t="頁面標題"><input value={c.services.heading} onChange={(e) => up(['services','heading'], e.target.value)} /></L>
          <L t="頁面說明"><input value={c.services.lede} onChange={(e) => up(['services','lede'], e.target.value)} /></L>
          <L t="是否顯示於首頁（服務項目頁本身不受此影響）">
            <select value={c.services.show !== false ? '1' : '0'}
              onChange={(e) => up(['services','show'], e.target.value === '1')}>
              <option value="1">顯示</option><option value="0">隱藏</option>
            </select>
          </L>
          {(c.services.items || []).map((s, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>項目 {i + 1}</b>
                <button className="del" onClick={() => {
                  if (confirm(`刪除「${s.name}」？`)) up(['services','items'], (c.services.items || []).filter((_, k) => k !== i));
                }}>刪除</button>
              </div>
              <input placeholder="服務名稱" value={s.name}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,name:e.target.value}; up(['services','items'],a); }} />
              <div className="two">
                <L t="此項目是否顯示（列表/首頁/詳細頁）">
                  <select value={s.show !== false ? '1' : '0'}
                    onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,show:e.target.value==='1'}; up(['services','items'],a); }}>
                    <option value="1">顯示</option><option value="0">隱藏</option>
                  </select>
                </L>
                <L t="預約狀態">
                  <select value={s.available !== false ? '1' : '0'}
                    onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,available:e.target.value==='1'}; up(['services','items'],a); }}>
                    <option value="1">開放預約</option><option value="0">不開放（改顯示 Email／LINE 聯繫）</option>
                  </select>
                </L>
              </div>
              <div className="two">
                <input placeholder="時長" value={s.duration}
                  onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,duration:e.target.value}; up(['services','items'],a); }} />
                <input placeholder="價格" value={s.price}
                  onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,price:e.target.value}; up(['services','items'],a); }} />
              </div>
              <textarea rows={2} placeholder="簡短說明（列表顯示）" value={s.desc}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,desc:e.target.value}; up(['services','items'],a); }} />
              <input placeholder="網址代號（英文，例如 basic）" value={s.slug || ''}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,slug:e.target.value}; up(['services','items'],a); }} />
              <textarea rows={5} placeholder="詳細介紹（一段一行）" value={(s.intro||[]).join('\n')}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,intro:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}; up(['services','items'],a); }} />
              <textarea rows={4} placeholder="你會帶走什麼（一項一行）" value={(s.gains||[]).join('\n')}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,gains:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}; up(['services','items'],a); }} />
              <textarea rows={3} placeholder="適合這樣的你（一項一行）" value={(s.forWho||[]).join('\n')}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,forWho:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}; up(['services','items'],a); }} />
              <textarea rows={3} placeholder="進行方式（一項一行）" value={(s.flow||[]).join('\n')}
                onChange={(e) => { const a=[...(c.services.items || [])]; a[i]={...s,flow:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)}; up(['services','items'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['services','items'],
            [...(c.services.items || []), { name:'新服務', duration:'', price:'請洽詢', desc:'' }])}>+ 新增服務項目</button>
        </div>
      )}

      {sec === 'layout' && (
        <div className="pane">
          <p className="sub">調整首頁各區塊的呈現順序（品牌開場與免費排盤固定在最上方，不列入排序）。若某區塊沒有內容或被設為「隱藏」，即使排在前面也不會顯示。</p>
          {(c.homepage.order || []).map((key, i) => {
            const LABELS = { ambience:'品牌氛圍圖', services:'服務簡介', chart:'免費排盤', testimonials:'顧客回饋', cases:'個案分享', posts:'文章精選' };
            const order = c.homepage.order || [];
            return (
              <div key={key} className="ordrow">
                <span className="oname">{LABELS[key] || key}</span>
                <div className="ops">
                  <button onClick={() => {
                    if (i === 0) return;
                    const a = [...order]; [a[i-1], a[i]] = [a[i], a[i-1]]; up(['homepage','order'], a);
                  }} disabled={i === 0}>↑</button>
                  <button onClick={() => {
                    if (i === order.length - 1) return;
                    const a = [...order]; [a[i], a[i+1]] = [a[i+1], a[i]]; up(['homepage','order'], a);
                  }} disabled={i === order.length - 1}>↓</button>
                </div>
              </div>
            );
          })}
          <hr />
          <L t="文章精選 — 區塊標題（首頁）"><input value={c.postsSection.heading}
            onChange={(e) => up(['postsSection','heading'], e.target.value)} /></L>
          <L t="是否顯示於首頁（文章列表頁 /articles 不受此影響）">
            <select value={c.postsSection.show !== false ? '1' : '0'}
              onChange={(e) => up(['postsSection','show'], e.target.value === '1')}>
              <option value="1">顯示</option><option value="0">隱藏</option>
            </select>
          </L>
        </div>
      )}

      {sec === 'report' && (
        <div className="pane">
          <p className="sub">付費解圖報告（PDF）。金流（綠界 ECPay）與 AI（Anthropic）金鑰須在 Vercel 環境變數設定，這裡只負責文案與價格。</p>
          <L t="是否開放購買">
            <select value={c.chartReport.enabled !== false ? '1' : '0'}
              onChange={(e) => up(['chartReport','enabled'], e.target.value === '1')}>
              <option value="1">開放</option><option value="0">暫停（隱藏購買按鈕）</option>
            </select>
          </L>
          <L t="價格（新台幣，可隨時調整）">
            <input type="number" min="1" value={c.chartReport.price}
              onChange={(e) => up(['chartReport','price'], Number(e.target.value) || 0)} />
          </L>
          <L t="區塊標題"><input value={c.chartReport.heading}
            onChange={(e) => up(['chartReport','heading'], e.target.value)} /></L>
          <L t="說明文字"><textarea rows={2} value={c.chartReport.intro}
            onChange={(e) => up(['chartReport','intro'], e.target.value)} /></L>

          <p className="fieldlabel">重點列表（每行一項）</p>
          <textarea rows={4} value={(c.chartReport.bullets || []).join('\n')}
            onChange={(e) => up(['chartReport','bullets'], e.target.value.split('\n').filter(Boolean))} />

          <div className="two">
            <L t="預約 CTA 文字"><input value={c.chartReport.ctaText}
              onChange={(e) => up(['chartReport','ctaText'], e.target.value)} /></L>
            <L t="預約 CTA 連結"><input value={c.chartReport.ctaUrl}
              onChange={(e) => up(['chartReport','ctaUrl'], e.target.value)} /></L>
          </div>

          <hr />
          <p className="fieldlabel">範例報告（給訪客預覽用，非即時生成，可隨時修改文字）</p>
          <L t="是否顯示「查看範例」">
            <select value={c.chartReport.sampleEnabled !== false ? '1' : '0'}
              onChange={(e) => up(['chartReport','sampleEnabled'], e.target.value === '1')}>
              <option value="1">顯示</option><option value="0">隱藏</option>
            </select>
          </L>
          <L t="範例標示文字（例如：以 Joyce 本人的人類圖為例）">
            <input value={c.chartReport.sampleLabel}
              onChange={(e) => up(['chartReport','sampleLabel'], e.target.value)} />
          </L>
          <div className="two">
            <L t="範例 PDF 是否顯示出生資料">
              <select value={c.chartReport.sampleShowBirth ? '1' : '0'}
                onChange={(e) => up(['chartReport','sampleShowBirth'], e.target.value === '1')}>
                <option value="0">不顯示</option><option value="1">顯示</option>
              </select>
            </L>
            <input placeholder="若顯示，填入想公開的出生資訊文字" value={c.chartReport.sampleBirthLine}
              onChange={(e) => up(['chartReport','sampleBirthLine'], e.target.value)} />
          </div>
          <p className="fieldlabel">範例報告全文（格式須為「行星｜代表意義」換行接內文，段落間空一行）</p>
          <textarea rows={18} value={c.chartReport.sampleText}
            onChange={(e) => up(['chartReport','sampleText'], e.target.value)} />
          <p className="sub">
            <a href="/api/report/sample-pdf" target="_blank" rel="noopener">預覽目前的範例 PDF →</a>
          </p>
        </div>
      )}

      {sec === 'faq' && (
        <div className="pane">
          {(c.services.faq || []).map((f, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>問題 {i + 1}</b>
                <button className="del" onClick={() => up(['services','faq'], (c.services.faq || []).filter((_, k) => k !== i))}>刪除</button>
              </div>
              <input placeholder="問題" value={f.q}
                onChange={(e) => { const a=[...(c.services.faq || [])]; a[i]={...f,q:e.target.value}; up(['services','faq'],a); }} />
              <textarea rows={3} placeholder="回答" value={f.a}
                onChange={(e) => { const a=[...(c.services.faq || [])]; a[i]={...f,a:e.target.value}; up(['services','faq'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['services','faq'], [...(c.services.faq || []), { q:'', a:'' }])}>+ 新增問題</button>
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
          <L t="接收來信的 Email（不會顯示在網站上）"><input value={c.contact.email} onChange={(e) => up(['contact','email'], e.target.value)} /></L>
          <L t="LINE ID（僅供備忘，不會顯示在網站上）"><input value={c.contact.line} onChange={(e) => up(['contact','line'], e.target.value)} /></L>
          {(c.contact.social || []).map((s, i) => (
            <div key={i} className="row">
              <div className="rowhead">
                <b>社群 {i + 1}</b>
                <button className="del" onClick={() => up(['contact','social'], (c.contact.social || []).filter((_, k) => k !== i))}>刪除</button>
              </div>
              <div className="two">
                <input placeholder="名稱" value={s.name}
                  onChange={(e) => { const a=[...(c.contact.social || [])]; a[i]={...s,name:e.target.value}; up(['contact','social'],a); }} />
                <select value={s.icon || ''}
                  onChange={(e) => { const a=[...(c.contact.social || [])]; a[i]={...s,icon:e.target.value}; up(['contact','social'],a); }}>
                  <option value="">平台圖示…</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="threads">Threads</option>
                  <option value="youtube">YouTube</option>
                  <option value="podcast">Podcast</option>
                  <option value="line">LINE</option>
                </select>
              </div>
              <input placeholder="網址" value={s.url}
                onChange={(e) => { const a=[...(c.contact.social || [])]; a[i]={...s,url:e.target.value}; up(['contact','social'],a); }} />
            </div>
          ))}
          <button className="add" onClick={() => up(['contact','social'], [...(c.contact.social || []), { name:'', url:'' }])}>+ 新增社群連結</button>
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
        .ordrow {
          display: flex; align-items: center; justify-content: space-between;
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
        }
        .ordrow .oname { font-size: 15px; font-weight: 700; }
        .ordrow .ops { display: flex; gap: 6px; }
        .ordrow .ops button {
          font-size: 13px; padding: 6px 12px; border-radius: 7px; cursor: pointer;
          border: 1px solid var(--line); background: #fff; color: var(--ink);
        }
        .ordrow .ops button:disabled { opacity: .35; cursor: default; }
        .del { font-size: 12px; color: var(--red); background: none;
               border: 1px solid #E8C9C4; border-radius: 6px; padding: 4px 12px; cursor: pointer; }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .add {
          width: 100%; padding: 12px; margin-top: 4px; cursor: pointer;
          background: transparent; border: 1px dashed var(--line);
          border-radius: 10px; font-size: 14px; color: var(--coffee);
        }
        .add:hover { border-color: var(--coffee); background: #fff; }
        hr { border: none; border-top: 1px solid var(--line); margin: 24px 0; }
        .sub { font-size: 13px; color: var(--faint); letter-spacing: 2px; margin: 0 0 14px; }
        .preview {
          display: flex; justify-content: center; padding: 20px;
          background: #fff; border: 1px solid var(--line); border-radius: 10px;
        }
        .preview img { box-shadow: 0 6px 20px rgba(68,58,49,.12); }
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

function ImageSlot({ label, slot, adminKey, current, onDone }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setNote('圖片超過 2MB，請先壓縮'); return; }
    setBusy(true); setNote('上傳中…');
    const reader = new FileReader();
    reader.onload = async () => {
      const r = await fetch(`/api/upload?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, dataUrl: reader.result }),
      });
      const d = await r.json();
      if (r.ok) { onDone(d.url); setNote('✓ 已上傳，記得按「儲存全部」'); }
      else setNote('✗ ' + (d.error || '失敗'));
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="slot">
      <span className="lb">{label}</span>
      {current && <img className="thumb" src={current} alt="" />}
      <div className="row2">
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} disabled={busy} />
        {note && <em>{note}</em>}
      </div>
      <style jsx>{`
        .slot { margin-bottom: 20px; }
        .lb { display: block; font-size: 13px; color: var(--faint); letter-spacing: 1px; margin-bottom: 8px; }
        .thumb {
          max-width: 220px; max-height: 120px; display: block; margin-bottom: 10px;
          border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 6px;
        }
        .row2 { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        em { font-style: normal; font-size: 12px; color: var(--coffee); }
      `}</style>
    </div>
  );
}
