import { transitChart, taipeiNowString } from '../../lib/chart.js';
import { headers } from 'next/headers';
import { logUsage, visitorId } from '../../lib/usage.js';
import { getTransitLines } from '../../lib/store.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: '今日流日 — 人類圖' };

export default async function TransitPage() {
  const now = new Date();
  const { svg, P, info } = transitChart(now, '今日流日');
  const sun = P['太陽'];
  const stamp = taipeiNowString(now);
  logUsage({ kind: 'transit', uid: visitorId(headers()) });

  const tl = await getTransitLines();
  const gateData = tl.gates?.[String(sun.gate)];
  const lineData = gateData?.lines?.[String(sun.line)];

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
        <div className="how">
          <h3>怎麼用流日？</h3>
          <p>流日不是預測，是背景音樂。它描述的是「今天的天空長什麼樣子」，而不是「你今天會發生什麼事」。</p>
          <p>真正實用的方式是：把你的本命圖和流日對照，看看今天有哪些閘門被點亮。如果流日補上了你原本空白的那半條通道，你可能會感覺到平常沒有的能量——那不是你變了，是今天的天空借你用一下。</p>
          <p>特別留意流日在你空白中心的位置。那些地方最容易被放大，也最容易讓你誤以為「這是我的感覺」。</p>
        </div>

        {gateData && lineData && (
          <div className="lineread">
            <h3>今日爻辭 【流日 {sun.gate}.{sun.line}】</h3>
            <p className="gatemeta">
              第 {sun.gate} 號閘門・{gateData.name}（{gateData.hexagram}）
              {gateData.center && <span> · {gateData.center}</span>}
              {gateData.circuit && <span> · {gateData.circuit}</span>}
              {gateData.quadrant && <span> · {gateData.quadrant}</span>}
            </p>
            <p className="theme">爻辭：{lineData.theme}</p>

            <div className="lgrid">
              <div className="lcard exalt">
                <span>上升{lineData.exaltPlanet}</span>
                <p>{lineData.exaltText}</p>
              </div>
              <div className="lcard detriment">
                <span>下降{lineData.detrimentPlanet}</span>
                <p>{lineData.detrimentText}</p>
              </div>
            </div>
            <p className="srcnote">資料來源:《區分的科學》中文版</p>

            <hr className="div" />

            <div className="lgrid">
              <div className="lcard">
                <span>流日氣象解碼</span>
                <p>{lineData.weather}</p>
              </div>
              <div className="lcard">
                <span>生活實踐指南</span>
                <p>{lineData.practice}</p>
              </div>
            </div>

            {(gateData.channels?.length || 0) > 0 && (
              <>
                <hr className="div" />
                <p className="subheading">接通的能量中心</p>
                <div className="centerspill">
                  {[...new Set(gateData.channels.flatMap((ch) => ch.centers))].map((c) => (
                    <span key={c} className="pill">{c}</span>
                  ))}
                </div>

                <p className="subheading chspace">通道分析</p>
                <div className="chlist">
                  {gateData.channels.map((ch, i) => (
                    <div key={i} className="chcard">
                      <p className="chname">
                        {sun.gate}—{ch.partner}｜{ch.name}
                      </p>
                      <p className="chcenters">{ch.centers[0]} ↔ {ch.centers[1]}</p>
                      <p className="chdesc">{ch.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="channote">此為第 {sun.gate} 號閘門固定所屬的通道與中心，若你的本命圖恰好擁有搭配的另一閘門，今天便可能暫時體驗到這條通道接通的感受。</p>
              </>
            )}
          </div>
        )}
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
        .lineread {
          margin-top: 24px; padding: 28px 26px;
          background: var(--paper); border: 1px solid var(--terracotta); border-radius: 14px;
        }
        .lineread h3 { font-size: 17px; margin: 0 0 10px; letter-spacing: 1px; color: var(--terracotta); }
        .gatemeta { font-size: 13px; color: var(--faint); margin: 0 0 4px; }
        .theme { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 18px; }
        .lgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lcard {
          background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 18px;
        }
        .lcard span { display: block; font-size: 12px; letter-spacing: 2px; color: var(--gold); margin-bottom: 8px; font-weight: 700; }
        .lcard p { margin: 0; font-size: 14px; line-height: 1.95; color: var(--ink); white-space: pre-line; }
        .lcard.exalt span { color: var(--sage); }
        .lcard.detriment span { color: var(--terracotta); }
        .srcnote { font-size: 11px; color: var(--faint); margin: 10px 0 0; text-align: right; }
        .div { border: none; border-top: 1px dashed var(--line); margin: 24px 0; }
        .lgrid.single { grid-template-columns: 1fr; }
        .subheading { font-size: 13px; color: var(--coffee); font-weight: 700; letter-spacing: 1px; margin: 0 0 14px; }
        .subheading.chspace { margin-top: 22px; }
        .centerspill { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          font-size: 13px; padding: 6px 16px; border-radius: 20px;
          background: var(--sage); color: #fff; font-weight: 700;
        }
        .chlist { display: grid; gap: 12px; }
        .chcard {
          background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 16px 18px;
        }
        .chname { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: var(--ink); }
        .chcenters { margin: 0 0 8px; font-size: 12px; color: var(--gold); letter-spacing: 1px; }
        .chdesc { margin: 0; font-size: 13.5px; line-height: 1.9; color: var(--ink); }
        .channote { font-size: 12px; color: var(--faint); margin: 14px 0 0; line-height: 1.9; }
        @media (max-width: 720px) { .lgrid { grid-template-columns: 1fr; } }
        .note { font-size: 13px; color: var(--faint); text-align: center; margin-top: 24px; }
        @media (max-width: 720px) { .cards { grid-template-columns: 1fr; } }
        .foot { text-align: center; margin-top: 32px; }
        .foot a { font-size: 15px; text-decoration: none; }
        @media (max-width: 720px) { h1 { font-size: 32px; } }
      `}</style>
    </main>
  );
}
