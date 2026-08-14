export const metadata = {
  title: '人類圖排盤 — 免費線上生成你的人體圖',
  description: '輸入出生日期、時間與地點，取得你的人類圖：類型、內在權威、人生角色、定義、輪迴交叉。另提供每日流日查詢。',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
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
        `}</style>
      </body>
    </html>
  );
}
