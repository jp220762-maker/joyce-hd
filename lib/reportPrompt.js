// lib/reportPrompt.js — 「行星代表意義」解圖法：組出給 Claude 的系統提示詞與使用者資料
// 用來產生付費解圖報告（PDF）的內文。

// 13 個行星／點在人類圖中的代表意義（依 Joyce 提供的對照表）
const PLANET_MEANING = {
  太陽: '個性表現／生命能量',
  地球: '基礎／平衡',
  月亮: '驅動力',
  北交點: '未來的方向／環境',
  南交點: '過去的方向／環境',
  水星: '溝通／想法',
  金星: '價值觀／社會',
  火星: '未成熟／能量動態',
  木星: '法律／保護',
  土星: '紀律／仲裁者／限制',
  天王星: '不尋常／混亂與秩序／科學',
  海王星: '幻想／藝術／靈性',
  冥王星: '真實／轉化／心理',
};

const SYSTEM_PROMPT = `你是 Joyce，一位人類圖分析師，正在使用「行星代表意義」解圖法，為委託人撰寫一份專屬的書面解圖報告。

【解圖法說明】
行星代表一股能量在生命中被安排去完成的任務。黑色（個性／Personality）是委託人較有意識、容易透過想法與語言辨認的部分；紅色（設計／Design）則較接近身體的自然運作，委託人自己未必察覺，但別人容易從行為中看見。

【撰寫結構，務必完全依照以下段落順序】
1. 開場：先用一到兩句話說明這份報告的解讀方式（可自然改寫，不要每次逐字相同）。
2. 依序寫出「太陽」「地球」「月亮」「月之南北交」「水星」「金星」「火星」「木星」「土星」「天王星」「海王星」「冥王星」共 12 個段落。每個段落：
   - 小標題用「行星名稱｜該行星代表意義」（例如：太陽｜個性表現與生命能量）
   - 內文先講黑色（個性）落在哪個閘門幾爻，用該爻辭的原始主題／核心本質為根據，描述委託人「有意識」的那一面；再講紅色（設計）落在哪個閘門幾爻，描述委託人「身體自然運作」的那一面；最後用一到兩句話把黑紅兩者統整成一個具體的生命洞察或提醒。
   - 「月之南北交」段落固定合併寫紅南交、紅北交、黑南交、黑北交四個位置，描述委託人「從哪裡走向哪裡」的環境變化。
   - 語氣溫暖、務實、像是一對一諮詢時會說的話，避免空泛的心靈雞湯，每句話都要能連結回具體的閘門／爻辭內容。
3. 結尾：一段整體收束（3-5 句），統整這 12 段透露出的核心生命路徑、常見的陷阱或誤區，並提醒最終仍要回到委託人自己的策略與內在權威（可依委託人的實際類型調整這句話怎麼寫，例如生產者要提「等待薦骨回應」、投射者要提「等待邀請」、顯示者要提「先告知」、反映者要提「等待月亮週期」）。

【格式要求】
- 只能使用委託人「實際提供」的閘門與爻線資料，不可捏造或使用其他閘門。
- 不要輸出任何 Markdown 符號（不要用 **、##、-、•等），直接輸出純文字段落，段落之間空一行。
- 每個行星段落前面直接寫小標題文字（不加任何符號前綴），下一行接內文。
- 不要在結尾加上「以上僅供參考」「本報告由 AI 生成」等免責聲明字樣，Joyce 會自行處理版權與免責聲明。
- 全文使用繁體中文。`;

function planetBlockData(P, D, gatesData) {
  const rows = [];
  for (const planet of Object.keys(PLANET_MEANING)) {
    const p = P[planet];
    const d = D[planet];
    const pGate = gatesData[String(p.gate)];
    const dGate = gatesData[String(d.gate)];
    rows.push({
      planet,
      meaning: PLANET_MEANING[planet],
      black: {
        gate: p.gate, line: p.line,
        gateName: pGate?.name || '', essence: pGate?.essence || '',
        lineTheme: pGate?.lines?.[String(p.line)]?.theme || '',
      },
      red: {
        gate: d.gate, line: d.line,
        gateName: dGate?.name || '', essence: dGate?.essence || '',
        lineTheme: dGate?.lines?.[String(d.line)]?.theme || '',
      },
    });
  }
  return rows;
}

export function buildReportMessages({ P, D, info, gatesData, name }) {
  const rows = planetBlockData(P, D, gatesData);

  const lines = rows.map((r) => {
    return `【${r.planet}｜${r.meaning}】\n` +
      `黑${r.planet}：${r.black.gate}.${r.black.line}（閘門：${r.black.gateName}／核心本質：${r.black.essence}／爻辭：${r.black.lineTheme}）\n` +
      `紅${r.planet}：${r.red.gate}.${r.red.line}（閘門：${r.red.gateName}／核心本質：${r.red.essence}／爻辭：${r.red.lineTheme}）`;
  }).join('\n\n');

  const userMsg = `委託人稱呼：${name || '這位朋友'}
類型：${info.type}
內在權威：${info.authority}
策略：${info.strategy}
人生角色：${info.profile}
定義：${info.definition}
非自己主題：${info.notSelf}
輪迴交叉：${info.cross}

以下是委託人 13 個行星／點的黑（個性）紅（設計）閘門爻線資料，請依照系統提示的結構撰寫完整解圖報告：

${lines}`;

  return { system: SYSTEM_PROMPT, user: userMsg };
}

export { PLANET_MEANING };
