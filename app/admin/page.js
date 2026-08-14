import { readUsage } from '../../lib/usage.js';

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

  const { rows, total, natal, transit, uvTotal, uvDaily, persistent } = await readUsage(300);

  // 依日期彙總（人次）
  const hitsByDay = {};
  rows.forEach((r) => {
    const d = r.at.slice(0, 10);
    hitsByDay[d] = (hitsByDay[d] || 0) + 1;
  });
  // 合併「人次」與「不重複使用者」，由舊到新排列
  const dailyMerged = (uvDaily || []).slice().reverse().map(({ day, uv }) => ({
    day, uv, hits: hitsByDay[day] || 0,
  }));

  // 類型分布
  const byType = {};
  rows.filter((r) => r.type).forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });

  return (
    <main>
      <h1>後台統計</h1>
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
        <h2>近 14 天每日使用</h2>
        <div className="legend">
          <span><i className="sw a" />使用人次</span>
          <span><i className="sw b" />不重複使用者</span>
        </div>
        <div className="bars">
          {dailyMerged.map(({ day, hits, uv }) => {
            const max = Math.max(1, ...dailyMerged.map((x) => x.hits));
            return (
              <div key={day} className="bar">
                <div className="pair">
                  <div className="fill a" style={{ height: `${Math.round((hits / max) * 110)}px` }} />
                  <div className="fill b" style={{ height: `${Math.round((uv / max) * 110)}px` }} />
                </div>
                <span className="n">{hits}<i>/{uv}</i></span>
                <span className="d">{day.slice(5)}</span>
              </div>
            );
          })}
        </div>
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

      <style>{`
        main { max-width: 1100px; margin: 0 auto; padding: 40px 20px 80px; }
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
        .bars { display: flex; align-items: flex-end; gap: 8px; min-height: 150px; }
        .bar { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .pair { display: flex; align-items: flex-end; gap: 3px; height: 110px; }
        .fill { width: 15px; border-radius: 3px 3px 0 0; min-height: 3px; }
        .fill.a { background: var(--terracotta); }
        .fill.b { background: var(--sage); }
        .n { font-size: 12px; font-weight: 700; }
        .n i { font-style: normal; color: var(--sage); font-weight: 700; }
        .d { font-size: 11px; color: var(--faint); }
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
