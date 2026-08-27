import { getContent } from '../lib/store.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '人類圖排盤 — 免費線上生成你的人體圖',
  description: '輸入出生日期、時間與地點，取得你的人類圖：類型、內在權威、人生角色、定義、輪迴交叉。另提供每日流日查詢。',
};

export default async function RootLayout({ children }) {
  const c = await getContent();
  const logoH = Number(c.site?.logoHeight) || 46;
  const logoUrl = c.site?.logoUrl || '/images/logo.png';
  const siteName = c.site?.name || 'J頁有光';
  return (
    <html lang="zh-Hant">
      <body>
        <nav className="sitenav">
          <a className="logo" href="/">
            <img src={logoUrl} alt={siteName} style={{ height: `${logoH}px` }} />
          </a>
          <div className="links">
            <a href="/about">關於我</a>
            <a href="/services">服務項目</a>
            <a href="/articles">文章</a>
            <a href="/transit">今日流日</a>
          </div>
        </nav>
        {children}
        <footer className="sitefoot">
          <p>{siteName} · Joyce 人類圖</p>
          <a className="adm" href="/admin">管理</a>
        </footer>
        <style>{`
          :root {
            --bg:        #F6F1E7;
            --paper:     #FBF8F1;
            --line:      #D9CDBA;
            --ink:       #443A31;
            --faint:     #A2937F;
            --coffee:    #5C4A3A;
            --terracotta:#C1704F;
            --sage:      #9BAA8D;
            --gold:      #D9A95F;
            --red:       #C62828;
            --font: Arial, 'Microsoft JhengHei', '微軟正黑體', 'PingFang TC', 'Noto Sans TC', sans-serif;
          }
          * { box-sizing: border-box; }
          html, body {
            margin: 0; padding: 0;
            background: var(--bg); color: var(--ink);
            font-family: var(--font);
            -webkit-font-smoothing: antialiased;
          }
          a { color: var(--coffee); }
          button, input, select { font-family: var(--font); }
          :focus-visible { outline: 2px solid var(--coffee); outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; transition: none !important; }
          }
          .sitenav {
            display: flex; align-items: center; justify-content: space-between;
            gap: 16px; max-width: 1060px; margin: 0 auto;
            padding: 18px 20px; flex-wrap: wrap;
          }
          .sitenav .logo { display: flex; align-items: center; text-decoration: none; }
          .sitenav .logo img { width: auto; display: block; max-width: 100%; }
          .sitenav .links { display: flex; gap: 22px; flex-wrap: wrap; }
          .sitenav .links a {
            font-size: 14px; text-decoration: none; color: var(--ink);
            letter-spacing: 1px;
          }
          .sitenav .links a:hover { color: var(--coffee); }
          .sitefoot {
            max-width: 1060px; margin: 0 auto; padding: 32px 20px 40px;
            border-top: 1px solid var(--line);
            display: flex; align-items: center; justify-content: space-between;
          }
          .sitefoot p { margin: 0; font-size: 13px; color: var(--faint); letter-spacing: 2px; }
          .sitefoot .adm { font-size: 11px; color: var(--line); text-decoration: none; letter-spacing: 2px; }
          .sitefoot .adm:hover { color: var(--faint); }
          @media (max-width: 620px) {
            .sitenav { justify-content: center; gap: 10px; }
            .sitenav .logo img { max-height: 52px; }
            .sitenav .links { gap: 16px; justify-content: center; }
          }
        `}</style>
      </body>
    </html>
  );
}
