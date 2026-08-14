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
  if ((searchParams?.key || '') !== key) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>後台統計</h1>
        <p style={{ color: 'var(--faint)', fontSize: 14, lineHeight: 1.9 }}>
          請在網址後面加上管理密碼，例如：<br />
          <code style={{ fontSize: 13 }}>/admin?key=你的密碼</code>
        </p>
      </main>
    );
  }

  const { rows, total, natal, transit, persistent } = await readUsage(300);

  // 依日期彙總
  const byDay = {};
  rows.forEach((r) => {
    const d = fmt(r.at).split(' ')[0];
    byDay[d] = (byDay[d] || 0) + 1;
  });
  const days = Object.entries(byDay).slice(0, 14);

  // 類型分布
  const byType = {};
  rows.filter((r) => r.type).forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });

  return (
    <main>
      <h1>後台統計</h1>
      {!persistent && (
        <p className="warn">
          目前使用暫存模式，伺服器重啟後紀錄會消失。若要永久保存，請在 Vercel 開啟 KV 資料庫
          （Storage → Create Database → KV），系統會自動偵測並改用。
        </p>
      )}

      <section className="cards">
        <div className="card"><span>總使用次數</span><b>{total}</b></div>
        <div className="card"><span>本命排盤</span><b>{natal || rows.filter(r => r.kind === 'natal').length}</b></div>
        <div className="card"><span>流日查詢</span><b>{transit || rows.filter(r => r.kind === 'transit').length}</b></div>
      </section>

      {days.length > 0 && (
        <section className="block">
          <h2>近期每日使用</h2>
          <div className="bars">
            {days.map(([d, n]) => (
              <div key={d} className="bar">
                <div className="fill" style={{ height: `${Math.min(100, n * 12)}px` }} />
                <span className="n">{n}</span>
                <span className="d">{d}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0 32px; }
        .card {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 12px; padding: 20px; text-align: center;
        }
        .card span { display: block; font-size: 13px; color: var(--faint); margin-bottom: 8px; }
        .card b { font-size: 34px; }
        .block { margin-bottom: 36px; }
        .bars { display: flex; align-items: flex-end; gap: 10px; min-height: 130px; }
        .bar { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .fill { width: 34px; background: var(--terracotta); border-radius: 4px 4px 0 0; min-height: 4px; }
        .n { font-size: 12px; font-weight: 700; }
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
