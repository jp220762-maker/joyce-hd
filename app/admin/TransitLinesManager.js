'use client';
import { useEffect, useState } from 'react';

export default function TransitLinesManager({ adminKey }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null);    // 目前展開的閘門編號
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch(`/api/transit-lines?key=${encodeURIComponent(adminKey)}`, { cache: 'no-store' })
      .then((r) => r.json()).then((d) => setData(d.data));
  }, []);

  async function save() {
    setMsg('儲存中…');
    const r = await fetch(`/api/transit-lines?key=${encodeURIComponent(adminKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    setMsg(r.ok ? '✓ 已儲存，重新整理前台即可看到' : '✗ ' + (d.error || '失敗'));
    setTimeout(() => setMsg(''), 3500);
  }

  if (!data) return <p className="loading">載入中…</p>;

  const upGate = (g, field, val) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.gates[g][field] = val;
      return next;
    });
  };
  const upLine = (g, l, field, val) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.gates[g].lines[l][field] = val;
      return next;
    });
  };
  const upOverview = (i, field, val) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.overview[i][field] = val;
      return next;
    });
  };

  const gateNums = Object.keys(data.gates).sort((a, b) => Number(a) - Number(b));
  const filtered = q.trim()
    ? gateNums.filter((g) => g === q.trim() || data.gates[g].name.includes(q.trim()))
    : gateNums;

  return (
    <div className="tlm">
      <div className="head">
        <h2>流日 384 爻辭</h2>
        <div className="acts">
          {msg && <span className="msg">{msg}</span>}
          <button className="primary" onClick={save}>儲存全部</button>
        </div>
      </div>

      <div className="ovpane">
        <p className="sub">1～6 爻總覽（首頁與流日頁的基本力學說明）</p>
        {data.overview.map((o, i) => (
          <div key={i} className="ovrow">
            <b>{o.line} 爻</b>
            <input placeholder="主題（例如：變色龍與研究地基日 (Chameleon & Foundation)）"
              value={o.theme} onChange={(e) => upOverview(i, 'theme', e.target.value)} />
            <input placeholder="社會大眾心理氛圍"
              value={o.mood} onChange={(e) => upOverview(i, 'mood', e.target.value)} />
            <input placeholder="最佳生活對應策略"
              value={o.action} onChange={(e) => upOverview(i, 'action', e.target.value)} />
          </div>
        ))}
      </div>

      <div className="search">
        <input placeholder="搜尋閘門編號或名稱…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="cnt">共 {gateNums.length} 個閘門・384 條爻辭</span>
      </div>

      <div className="glist">
        {filtered.map((g) => {
          const gate = data.gates[g];
          const isOpen = open === g;
          return (
            <div key={g} className="gate">
              <button className="gatehead" onClick={() => setOpen(isOpen ? null : g)}>
                <span className="gn">第 {g} 號</span>
                <span className="gname">{gate.name}</span>
                <span className="gtoggle">{isOpen ? '收合 ▲' : '展開 ▼'}</span>
              </button>
              {isOpen && (
                <div className="gatebody">
                  <div className="two">
                    <input placeholder="閘門名稱" value={gate.name}
                      onChange={(e) => upGate(g, 'name', e.target.value)} />
                    <input placeholder="卦象（例如：乾為天 (The Creative)）" value={gate.hexagram}
                      onChange={(e) => upGate(g, 'hexagram', e.target.value)} />
                  </div>
                  <div className="two">
                    <input placeholder="所屬能量中心" value={gate.center}
                      onChange={(e) => upGate(g, 'center', e.target.value)} />
                    <input placeholder="所屬迴路群" value={gate.circuit}
                      onChange={(e) => upGate(g, 'circuit', e.target.value)} />
                  </div>
                  <input placeholder="閘門核心本質" value={gate.essence}
                    onChange={(e) => upGate(g, 'essence', e.target.value)} />

                  <hr />
                  {['1','2','3','4','5','6'].map((l) => (
                    <div key={l} className="linerow">
                      <b>【流日 {g}.{l}】</b>
                      <input placeholder="爻辭主題（例如：創造 (Creation)）"
                        value={gate.lines[l].theme}
                        onChange={(e) => upLine(g, l, 'theme', e.target.value)} />
                      <textarea rows={2} placeholder="當日力學機制"
                        value={gate.lines[l].mechanism}
                        onChange={(e) => upLine(g, l, 'mechanism', e.target.value)} />
                      <textarea rows={2} placeholder="當日生活指引"
                        value={gate.lines[l].guidance}
                        onChange={(e) => upLine(g, l, 'guidance', e.target.value)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .tlm { margin-top: 8px; }
        .loading { color: var(--faint); padding: 40px; text-align: center; }
        .head { display: flex; align-items: center; justify-content: space-between;
                flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .head h2 { margin: 0; font-size: 20px; letter-spacing: 2px; }
        .acts { display: flex; align-items: center; gap: 10px; }
        .msg { font-size: 13px; color: var(--coffee); }
        .primary {
          background: var(--terracotta); color: #fff; font-weight: 700;
          border: none; padding: 10px 22px; border-radius: 8px; font-size: 14px; cursor: pointer;
        }
        .sub { font-size: 13px; color: var(--faint); margin: 0 0 12px; }
        .ovpane {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 18px; margin-bottom: 20px;
        }
        .ovrow { display: grid; grid-template-columns: 40px 1.3fr 1fr 1.3fr; gap: 8px; margin-bottom: 8px; align-items: center; }
        .ovrow b { font-size: 13px; color: var(--gold); }
        .search { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .search input {
          flex: 1; max-width: 320px; padding: 10px 12px; font-size: 14px;
          border: 1px solid var(--line); border-radius: 8px; background: #fff;
        }
        .search .cnt { font-size: 12px; color: var(--faint); white-space: nowrap; }
        .glist { display: grid; gap: 8px; }
        .gate { background: var(--paper); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
        .gatehead {
          width: 100%; display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; background: none; border: none; cursor: pointer;
          font-family: inherit; text-align: left;
        }
        .gn { font-size: 12px; color: var(--gold); font-weight: 700; white-space: nowrap; }
        .gname { font-size: 15px; font-weight: 700; flex: 1; }
        .gtoggle { font-size: 12px; color: var(--faint); white-space: nowrap; }
        .gatebody { padding: 6px 16px 18px; border-top: 1px solid var(--line); }
        .two { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
        input, textarea {
          width: 100%; margin-top: 10px; padding: 9px 10px; font-size: 13px; box-sizing: border-box;
          border: 1px solid var(--line); border-radius: 7px; background: #fff; color: var(--ink);
          font-family: inherit;
        }
        textarea { line-height: 1.7; resize: vertical; }
        hr { border: none; border-top: 1px solid var(--line); margin: 16px 0; }
        .linerow { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed var(--line); }
        .linerow:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .linerow b { font-size: 12px; color: var(--terracotta); }
        @media (max-width: 720px) {
          .ovrow { grid-template-columns: 1fr; }
          .two { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
