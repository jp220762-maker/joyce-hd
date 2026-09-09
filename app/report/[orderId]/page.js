import { getReportOrder } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '你的解圖報告' };

export default async function ReportResultPage({ params }) {
  const order = await getReportOrder(params.orderId);

  let body;
  if (!order) {
    body = (
      <>
        <h1>找不到這筆訂單</h1>
        <p className="sub">請確認網址是否正確，或聯繫網站管理者協助查詢。</p>
      </>
    );
  } else if (order.status === 'pending') {
    body = (
      <>
        <h1>等待付款確認中…</h1>
        <p className="sub">如果你剛完成付款，請稍候片刻並重新整理這一頁。</p>
      </>
    );
  } else if (order.status === 'generating') {
    body = (
      <>
        <h1>報告生成中，請稍候…</h1>
        <p className="sub">AI 正在為你逐一解讀 13 個行星，通常在幾分鐘內完成。這個頁面每 8 秒會自動重新整理一次。</p>
        <meta httpEquiv="refresh" content="8" />
      </>
    );
  } else if (order.status === 'ready') {
    body = (
      <>
        <h1>你的專屬解圖報告已完成</h1>
        <p className="sub">
          {order.birth?.name ? `${order.birth.name}，` : ''}
          感謝你的購買，報告已經準備好了。
        </p>
        <a className="dl" href={`/api/report/${params.orderId}/pdf`}>下載 PDF 報告</a>
        {order.invoiceNo && (
          <p className="inv">電子收據號碼：{order.invoiceNo}（{order.invoiceDate}）</p>
        )}
        <p className="note">這個下載連結會持續有效，建議收到後盡快下載保存。</p>
      </>
    );
  } else if (order.status === 'gen_failed') {
    body = (
      <>
        <h1>報告生成時發生問題</h1>
        <p className="sub">
          你的付款已經確認成功，但生成報告時遇到技術問題。請透過網站上的聯絡方式與 Joyce 聯繫，
          提供訂單編號 <b>{params.orderId}</b>，會盡快為你手動處理。
        </p>
        <p className="sub" style={{ color: '#C1704F', fontSize: 12, wordBreak: 'break-all' }}>
          （除錯用）錯誤內容：{order.error || '(無記錄)'}
        </p>
      </>
    );
  } else if (order.status === 'failed') {
    body = (
      <>
        <h1>付款未成功</h1>
        <p className="sub">{order.rtnMsg || '交易未能完成，若已被扣款請聯繫客服協助處理。'}</p>
      </>
    );
  } else {
    body = <h1>訂單狀態：{order.status}</h1>;
  }

  return (
    <main className="wrap">
      {body}
      <a className="back" href="/">← 回到首頁</a>
      <style>{`
        .wrap {
          max-width: 560px; margin: 0 auto; padding: 90px 20px 60px; text-align: center;
          font-family: var(--font), serif;
        }
        h1 { font-size: 24px; color: #443A31; margin-bottom: 14px; }
        .sub { color: #A2937F; line-height: 1.9; font-size: 15px; margin-bottom: 24px; }
        .dl {
          display: inline-block; padding: 15px 36px; background: #C1704F; color: #fff;
          border-radius: 10px; text-decoration: none; font-weight: 700; letter-spacing: 1px;
          margin-bottom: 18px;
        }
        .dl:hover { background: #a85c3f; }
        .inv { font-size: 13px; color: #A2937F; margin-bottom: 8px; }
        .note { font-size: 12.5px; color: #A2937F; }
        .back { display: inline-block; margin-top: 30px; font-size: 14px; color: #5C4A3A; }
      `}</style>
    </main>
  );
}
