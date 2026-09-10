'use client';
import { useState } from 'react';

export default function ReportLookupPage() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function search(e) {
    e.preventDefault();
    setErr(''); setOrders(null); setBusy(true);
    try {
      const res = await fetch('/api/report/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || '查詢失敗'); return; }
      setOrders(d.orders || []);
    } catch {
      setErr('連線發生問題，請稍後再試。');
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = {
    pending: '等待付款確認中',
    generating: '報告生成中',
    ready: '已完成，可下載',
    gen_failed: '生成失敗，請聯繫客服',
    failed: '付款未成功',
  };

  return (
    <main className="wrap">
      <p className="eyebrow">REPORT</p>
      <h1>查詢我的解圖報告</h1>
      <p className="lede">忘記下載連結了嗎？輸入購買時填寫的 Email，就能找回你的訂單。</p>

      <form onSubmit={search} className="form">
        <input
          type="email" required placeholder="輸入購買時的 Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={busy}>{busy ? '查詢中…' : '查詢'}</button>
      </form>

      {err && <p className="err">{err}</p>}

      {orders && orders.length === 0 && (
        <p className="empty">沒有找到用這個信箱建立的訂單，請確認信箱是否輸入正確。</p>
      )}

      {orders && orders.length > 0 && (
        <div className="list">
          {orders.map((o) => (
            <a key={o.orderId} href={`/report/${o.orderId}`} className="item">
              <div>
                <p className="name">{o.name || '解圖報告'}</p>
                <p className="date">{o.createdAt ? new Date(o.createdAt).toLocaleString('zh-TW') : ''}</p>
              </div>
              <span className={`status s-${o.status}`}>{statusLabel[o.status] || o.status}</span>
            </a>
          ))}
        </div>
      )}

      <style jsx>{`
        .wrap { max-width: 560px; margin: 0 auto; padding: 70px 20px 60px; }
        .eyebrow { text-align: center; letter-spacing: 4px; font-size: 12px; color: var(--faint); margin: 0; }
        h1 { text-align: center; font-size: 28px; margin: 10px 0 14px; color: var(--ink); }
        .lede { text-align: center; color: var(--faint); font-size: 14.5px; margin-bottom: 32px; line-height: 1.8; }
        .form { display: flex; gap: 10px; margin-bottom: 16px; }
        .form input {
          flex: 1; padding: 12px 14px; border: 1px solid var(--line); border-radius: 9px;
          font-size: 15px; font-family: inherit;
        }
        .form button {
          padding: 12px 22px; border: none; border-radius: 9px; background: var(--terracotta);
          color: #fff; font-weight: 700; cursor: pointer; white-space: nowrap;
        }
        .form button:disabled { opacity: .6; cursor: default; }
        .err { color: var(--terracotta); font-size: 14px; text-align: center; }
        .empty { color: var(--faint); font-size: 14px; text-align: center; margin-top: 20px; }
        .list { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
        .item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 16px; border: 1px solid var(--line); border-radius: 10px;
          background: var(--paper); text-decoration: none;
        }
        .item:hover { border-color: var(--terracotta); }
        .name { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 4px; }
        .date { font-size: 12.5px; color: var(--faint); margin: 0; }
        .status { font-size: 12.5px; padding: 5px 10px; border-radius: 999px; white-space: nowrap; }
        .s-ready { background: #E8F0E3; color: #5B7A4B; }
        .s-generating, .s-pending { background: #F3ECD9; color: #9C7A2E; }
        .s-gen_failed, .s-failed { background: #F3E0DA; color: var(--terracotta); }
      `}</style>
    </main>
  );
}
