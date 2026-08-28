import { readUsage } from '../../lib/usage.js';
import PostManager from './PostManager';
import ContentManager from './ContentManager';
import TransitLinesManager from './TransitLinesManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: '後台統計', robots: { index: false, follow: false } };

function fmt(iso) {
  try {
    return new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch { return iso; }
}

export default async function AdminPage({ searchParams }) {
  const key = process.env.ADMIN_KEY || 'hd2026';
  const tried = searchParams?.key;
  if ((tried || '') !== key) {
    return (
      <main className="gate">
        <form method="GET" action="/admin">
          <h1>後台統計</h1>
          <p className="hint">請輸入管理密碼</p>
          <input
            type="password"
            name="key"
            placeholder="管理密碼"
            autoFocus
            autoComplete="current-password"
          />
          <button type="submit">登入</button>
          {tried !== undefined && <p className="err">密碼不正確，請再試一次</p>}
        </form>

        <style>{`
          .gate {
            min-height: 70vh; display: flex; align-items: center; justify-content: center;
            padding: 40px 24px;
          }
          .gate form {
            width: 100%; max-width: 360px; text-align: center;
            background: var(--paper); border: 1px solid var(--line);
            border-radius: 16px; padding: 36px 28px;
          }
          .gate h1 { font-size: 24px; letter-spacing: 3px; margin: 0 0 8px; }
          .hint { color: var(--faint); font-size: 14px; margin: 0 0 22px; }
          .gate input {
            width: 100%; padding: 13px 14px; font-size: 16px;
            border: 1px solid var(--line); border-radius: 9px;
            background: #fff; color: var(--ink); box-sizing: border-box;
          }
          .gate button {
            width: 100%; margin-top: 14px; padding: 14px;
            background: var(--coffee); color: var(--bg);
            border: none; border-radius: 9px;
            font-size: 16px; font-weight: 700; letter-spacing: 3px; cursor: pointer;
          }
          .gate button:hover { background: var(--ink); }
          .err { color: var(--red); font-size: 13px; margin: 16px 0 0; }
        `}</style>
      </main>
    );
  }

  const RANGES = [
    { key: '14d', label: '近 14 天', days: 14 },
    { key: '1m',  label: '近一個月', days: 30 },
    { key: '1y',  label: '近一年',   days: 365 },
    { key: '3y',  label: '近三年',   days: 1095 },
    { key: 'all', label: '全部',     days: 0 },
  ];
  const range = RANGES.find((r) => r.key === (searchParams?.range || '14d')) || RANGES[0];
  const v = searchParams?.view;
  const view = v === 'posts' ? 'posts' : v === 'content' ? 'content' : v === 'transit' ? 'transit' : 'stats';
  const { rows, total, natal, transit, uvTotal, daily, persistent } = await readUsage(300, range.days);



  // 類型分布
  const byType = {};
  rows.filter((r) => r.type).forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });

  return (
    <main>
      <div className="nav-top">
        <h1>{view === 'posts' ? '文章管理' : view === 'content' ? '網站內容' : view === 'transit' ? '流日爻辭' : '後台統計'}</h1>
        <div className="vtabs">
          <a href={`/admin?key=${encodeURIComponent(searchParams.key)}`}
             className={view === 'stats' ? 'on' : ''}>使用統計</a>
          <a href={`/admin?key=${encodeURIComponent(searchParams.key)}&view=posts`}
             className={view === 'posts' ? 'on' : ''}>文章管理</a>
          <a href={`/admin?key=${encodeURIComponent(searchParams.key)}&view=content`}
             className={view === 'content' ? 'on' : ''}>網站內容</a>
          <a href={`/admin?key=${encodeURIComponent(searchParams.key)}&view=transit`}
             className={view === 'transit' ? 'on' : ''}>流日爻辭</a>
        </div>
      </div>

      {view === 'posts' && <PostManager adminKey={searchParams.key} />}
      {view === 'content' && <ContentManager adminKey={searchParams.key} />}
      {view === 'transit' && <TransitLinesManager adminKey={searchParams.key} />}
      {view === 'stats' && (<>
      {!persistent && (
        <p className="warn">
          目前使用暫存模式，伺服器重啟後紀錄會消失。若要永久保存，請在 Vercel Marketplace 安裝 Upstash Redis 並連結此專案，系統會自動偵測並改用。
        </p>
      )}

      <section className="cards">
        <div className="card"><span>總使用人次</span><b>{total}</b></div>
        <div className="card hl"><span>不重複使用者</span><b>{uvTotal}</b></div>
        <div className="card"><span>本命排盤</span><b>{natal || rows.filter(r => r.kind === 'natal').length}</b></div>
        <div className="card"><span>流日查詢</span><b>{transit || rows.filter(r => r.kind === 'transit').length}</b></div>
      </section>

      <section className="block">
        <div className="bar-head">
          <h2>使用趨勢</h2>
          <div className="tabs">
            {RANGES.map((r) => (
              <a key={r.key}
                 href={`/admin?key=${encodeURIComponent(searchParams.key)}&range=${r.key}`}
                 className={r.key === range.key ? 'tab on' : 'tab'}>{r.label}</a>
            ))}
          </div>
        </div>
        <div className="legend">
          <span><i className="sw a" />使用人次</span>
          <span><i className="sw b" />不重複使用者</span>
        </div>
        {daily.length === 0 ? (
          <p className="none">此範圍內尚無資料</p>
        ) : (
          <div className="bars" data-dense={daily.length > 40 ? '1' : '0'}>
            {(() => {
              const max = Math.max(1, ...daily.map((x) => x.hits), ...daily.map((x) => x.uv));
              return daily.map(({ label, hits, uv }) => (
                <div key={label} className="bar">
                  <div className="pair">
                    <div className="col">
                      <span className="v a">{hits || ''}</span>
                      <div className="fill a" style={{ height: `${Math.round((hits / max) * 100)}px` }} />
                    </div>
                    <div className="col">
                      <span className="v b">{uv || ''}</span>
                      <div className="fill b" style={{ height: `${Math.round((uv / max) * 100)}px` }} />
                    </div>
                  </div>
                  <span className="d">{label.length === 4 ? label : label.slice(5)}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </section>

      {Object.keys(byType).length > 0 && (
        <section className="block">
          <h2>類型分布</h2>
          <div className="chips">
            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
              <span key={t}>{t} <b>{n}</b></span>
            ))}
          </div>
        </section>
      )}

      <section className="block">
        <h2>使用紀錄（最新 {rows.length} 筆）</h2>
        <table>
          <thead>
            <tr><th>時間</th><th>項目</th><th>姓名</th><th>出生資料</th><th>出生地</th><th>類型</th><th>角色</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{fmt(r.at)}</td>
                <td>{r.kind === 'transit' ? '流日' : '本命'}</td>
                <td>{r.name || '—'}</td>
                <td>{r.birth || '—'}</td>
                <td>{r.city || '—'}</td>
                <td>{r.type || '—'}</td>
                <td>{r.profile || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="empty">尚無使用紀錄</td></tr>
            )}
          </tbody>
        </table>
      </section>

      </>)}

      <style>{`
        main { max-width: 1100px; margin: 0 auto; padding: 40px 20px 80px; }
        .nav-top { display: flex; align-items: center; justify-content: space-between;
                   flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .nav-top h1 { margin: 0; }
        .vtabs { display: flex; gap: 6px; }
        .vtabs a {
          font-size: 14px; padding: 8px 18px; border-radius: 20px; text-decoration: none;
          border: 1px solid var(--line); background: var(--paper); color: var(--ink);
        }
        .vtabs a.on { background: var(--coffee); color: var(--bg); border-color: var(--coffee); }
        h1 { font-size: 30px; letter-spacing: 3px; margin: 0 0 20px; }
        h2 { font-size: 14px; letter-spacing: 2px; color: var(--faint); margin: 0 0 14px; }
        .warn {
          background: #FBF3E4; border: 1px solid var(--line); border-radius: 10px;
          padding: 14px 16px; font-size: 13px; line-height: 1.9; color: var(--ink);
        }
        .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 20px 0 32px; }
        .card {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px; text-align: center;
        }
        .card span { display: block; font-size: 13px; color: var(--faint); margin-bottom: 8px; }
        .card b { font-size: 34px; }
        .block { margin-bottom: 36px; }
        .card.hl { border-color: var(--terracotta); }
        .card.hl b { color: var(--terracotta); }
        .legend { display: flex; gap: 18px; margin-bottom: 12px; font-size: 12px; color: var(--faint); }
        .legend span { display: flex; align-items: center; gap: 6px; }
        .sw { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
        .sw.a { background: var(--terracotta); }
        .sw.b { background: var(--sage); }
        .bar-head { display: flex; align-items: center; justify-content: space-between;
                    flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
        .bar-head h2 { margin: 0; }
        .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .tab {
          font-size: 13px; padding: 6px 14px; border-radius: 20px;
          border: 1px solid var(--line); background: var(--paper);
          color: var(--ink); text-decoration: none;
        }
        .tab:hover { border-color: var(--coffee); }
        .tab.on { background: var(--coffee); color: var(--bg); border-color: var(--coffee); }
        .bars {
          display: flex; align-items: flex-end; gap: 8px; min-height: 160px;
          overflow-x: auto; padding-bottom: 6px;
        }
        .bars[data-dense='1'] { gap: 3px; }
        .bar { display: flex; flex-direction: column; align-items: center; gap: 5px; flex: 1; min-width: 26px; }
        .bars[data-dense='1'] .bar { min-width: 14px; }
        .pair { display: flex; align-items: flex-end; gap: 3px; }
        .col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .v { font-size: 11px; font-weight: 700; line-height: 1; min-height: 12px; }
        .v.a { color: var(--terracotta); }
        .v.b { color: var(--sage); }
        .bars[data-dense='1'] .v { display: none; }
        .fill { width: 15px; border-radius: 3px 3px 0 0; min-height: 3px; }
        .bars[data-dense='1'] .fill { width: 7px; }
        .fill.a { background: var(--terracotta); }
        .fill.b { background: var(--sage); }
        .d { font-size: 11px; color: var(--faint); white-space: nowrap; }
        .bars[data-dense='1'] .d { font-size: 9px; transform: rotate(-60deg); transform-origin: center; }
        .none { color: var(--faint); font-size: 14px; padding: 30px 0; text-align: center; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chips span {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 20px; padding: 6px 14px; font-size: 13px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th {
          background: var(--coffee); color: var(--bg); padding: 10px 8px;
          text-align: left; font-weight: 700; letter-spacing: 1px;
        }
        td { border-bottom: 1px solid var(--line); padding: 9px 8px; }
        tr:nth-child(even) td { background: var(--paper); }
        .empty { text-align: center; color: var(--faint); padding: 30px; }
        @media (max-width: 720px) {
          .cards { grid-template-columns: 1fr; }
          table { font-size: 12px; }
        }
      `}</style>
    </main>
  );
}
