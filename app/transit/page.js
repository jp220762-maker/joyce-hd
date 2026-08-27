import { transitChart, taipeiNowString } from '../../lib/chart.js';
import { headers } from 'next/headers';
import { logUsage, visitorId } from '../../lib/usage.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '今日流日 — 人類圖' };

export default function TransitPage() {
  const now = new Date();
  const { svg, P, info } = transitChart(now, '今日流日');
  const sun = P['太陽'];
  const stamp = taipeiNowString(now);
  logUsage({ kind: 'transit', uid: visitorId(headers()) });

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">TRANSIT</p>
        <h1>今日流日</h1>
        <p className="stamp">台北時間 {stamp}</p>
        <p className="lede">
          此刻天體所啟動的閘門與爻。流日每天變動，反映當下集體的能量場，
          與你的本命圖疊合時會產生暫時的通道。
        </p>
      </header>

      <div className="chart" dangerouslySetInnerHTML={{ __html: svg }} />

      <section className="read">
        <h2>今天的能量重點</h2>
        <div className="cards">
          <div className="c">
            <span>太陽所在</span>
            <b>{sun.gate}.{sun.line}</b>
            <p>今天集體意識的主題落在第 {sun.gate} 閘門第 {sun.line} 爻。太陽每約 5.6 天換一個閘門，是流日裡最主要的能量基調。</p>
          </div>
          <div className="c">
            <span>今日類型</span>
            <b>{info.type}</b>
            <p>如果把此刻的天空當成一個人，他會是{info.type}。這代表今天整體的行動節奏——{info.strategy}。</p>
          </div>
          <div className="c">
            <span>定義中心</span>
            <b>{(info.centers || []).length} 個</b>
            <p>{(info.centers || []).join('、') || '無'}。這些中心今天被啟動，相關的能量在集體中比較活躍。</p>
          </div>
        </div>

        <div className="how">
          <h3>怎麼用流日？</h3>
          <p>流日不是預測，是背景音樂。它描述的是「今天的天空長什麼樣子」，而不是「你今天會發生什麼事」。</p>
          <p>真正實用的方式是：把你的本命圖和流日對照，看看今天有哪些閘門被點亮。如果流日補上了你原本空白的那半條通道，你可能會感覺到平常沒有的能量——那不是你變了，是今天的天空借你用一下。</p>
          <p>特別留意流日在你空白中心的位置。那些地方最容易被放大，也最容易讓你誤以為「這是我的感覺」。</p>
        </div>
      </section>

      <p className="note">流日以台北時間（UTC+8）計算，重新整理即可取得最新的行星位置。</p>

      <footer className="foot"><a href="/">← 回到本命排盤</a></footer>

      <style>{`
        main { max-width: 1000px; margin: 0 auto; padding: 48px 20px 80px; }
        .hero { text-align: center; margin-bottom: 32px; }
        .eyebrow { font-size: 12px; letter-spacing: 4px; color: var(--faint); margin: 0 0 12px; }
        h1 { font-size: 42px; font-weight: 700; margin: 0 0 10px; letter-spacing: 3px; }
        .stamp { font-size: 15px; color: var(--coffee); margin: 0 0 16px; letter-spacing: 1px; }
        .lede { color: var(--faint); line-height: 2; margin: 0; font-size: 16px; }
        .chart svg { width: 100%; height: auto; display: block; }
        .read { margin-top: 44px; }
        .read h2 {
          font-size: 14px; letter-spacing: 4px; color: var(--coffee);
          margin: 0 0 20px; font-weight: 700; text-align: center;
        }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .c {
          background: var(--paper); border: 1px solid var(--line);
          border-radius: 14px; padding: 22px 20px; text-align: center;
        }
        .c span { display: block; font-size: 12px; color: var(--faint); letter-spacing: 2px; margin-bottom: 8px; }
        .c b { display: block; font-size: 26px; color: var(--coffee); margin-bottom: 12px; }
        .c p { margin: 0; font-size: 13px; line-height: 1.95; color: var(--faint); text-align: left; }
        .how {
          margin-top: 32px; padding: 28px 26px;
          background: var(--paper); border: 1px solid var(--line); border-radius: 14px;
        }
        .how h3 { font-size: 15px; margin: 0 0 14px; letter-spacing: 2px; }
        .how p { font-size: 15px; line-height: 2.1; margin: 0 0 14px; color: var(--ink); }
        .how p:last-child { margin-bottom: 0; }
        .note { font-size: 13px; color: var(--faint); text-align: center; margin-top: 24px; }
        @media (max-width: 720px) { .cards { grid-template-columns: 1fr; } }
        .foot { text-align: center; margin-top: 32px; }
        .foot a { font-size: 15px; text-decoration: none; }
        @media (max-width: 720px) { h1 { font-size: 32px; } }
      `}</style>
    </main>
  );
}
