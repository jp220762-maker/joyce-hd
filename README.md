# 人類圖網站 hd-website

Next.js 排盤網站，含本命排盤與每日流日。

## 目錄結構
```
app/
  layout.js          全站樣式與大地色系設計token
  page.js            首頁：出生資料表單 + 排盤結果
  transit/page.js    今日流日（台北時區，顯示到爻）
  api/chart/route.js 排盤API（Node runtime）
lib/
  engine-lib.js      天文計算：黃經→閘門/爻/色/調、設計端回推88°、時區轉換
  derive.js          判讀層：通道/中心/類型/權威/角色/定義/策略/非自己/輪迴交叉/四箭頭
  bodygraph.js       SVG人體圖繪製（大地色系）
  fixing.js          384條爻的擢升/衰落資料
  cross-table.js     192個輪迴交叉中英對照（《區分的科學》譯名）
  cities.js          城市與IANA時區對照（台灣22縣市+世界主要城市）
  chart.js           排盤主流程：本命/流日/流日疊本命
```

## 本機開發
```bash
npm install
npm run dev     # http://localhost:3000
```

## 部署到 Vercel
1. 推送到 GitHub
2. Vercel → New Project → 選這個 repo → Deploy（設定全部用預設值即可）

## 驗證紀錄
引擎已用四筆真實資料交叉比對其他排盤軟體，全數命中：
- Joyce 1973-07-22 17:23 台北 → 生產者/薦骨/4-6/二分人/右角度交叉之律法2
- Misha 1937-05-12 09:55 布魯塞爾 → 顯示者/意志力/3-5/一分人（驗證歷史夏令時間）
- Angie 1992-08-03 09:00 台北 → 投射者/自我投射/4-6/一分人
- Don 2000-07-17 13:50 台北 → 生產者/薦骨/5-1/二分人/左角度交叉之朦朧

擢升/衰落符號規則：行星比對 + 官方調和閘門傳導，11/11 已知符號全數正確。
