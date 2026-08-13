// chart.js — 排盤主流程：本命 / 流日 / 流日疊本命
const A = require('astronomy-engine');
const eng = require('./engine-lib.js');
const { derive } = require('./derive.js');
const { renderBodygraph } = require('./bodygraph.js');

// 本命盤：出生當地時間 + IANA 時區
function natalChart({ year, month, day, hour, minute, tz, name = '', showTable = false }) {
  const utc = eng.localToUTC(year, month, day, hour, minute, tz);
  const birth = A.MakeTime(utc);
  const P = eng.allActivations(birth);
  const D = eng.allActivations(eng.designTime(birth));
  const info = derive(P, D);
  return {
    P, D, info, utc,
    svg: renderBodygraph(P, D, info, name, { showTable }),          // 網頁用:預設不含摘要表
    svgFull: renderBodygraph(P, D, info, name, { showTable: true }), // 下載用:含摘要表
  };
}

// 流日盤：指定時刻（預設此刻），台北時區
function transitChart(at = new Date(), name = '今日流日', showTable = false) {
  const t = A.MakeTime(at);
  const P = eng.allActivations(t);
  const D = eng.allActivations(eng.designTime(t));
  const info = derive(P, D);
  return {
    P, D, info, utc: at,
    svg: renderBodygraph(P, D, info, name, { showTable }),
    svgFull: renderBodygraph(P, D, info, name, { showTable: true }),
  };
}

// 流日疊本命：合併兩組啟動後重新判定通道與中心
function transitOverNatal(natalInput, at = new Date(), name = '流日 × 本命') {
  const natal = natalChart(natalInput);
  const t = A.MakeTime(at);
  const tP = eng.allActivations(t);
  const tD = eng.allActivations(eng.designTime(t));
  // 合併：本命 Personality/Design + 流日 Personality/Design
  const mergedP = { ...natal.P };
  const mergedD = { ...natal.D };
  Object.entries(tP).forEach(([k, v]) => { mergedP['流日' + k] = v; });
  Object.entries(tD).forEach(([k, v]) => { mergedD['流日' + k] = v; });
  const info = derive(mergedP, mergedD);
  // 圖仍以本命 13 天體顯示欄位，但通道/中心採合併結果
  return { P: natal.P, D: natal.D, transitP: tP, transitD: tD, info,
           svg: renderBodygraph(natal.P, natal.D, info, name) };
}

// 台北當地時間字串（給頁面顯示用）
function taipeiNowString(d = new Date()) {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

const PLANET_ORDER = ['太陽','地球','月亮','北交點','南交點','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];

function activationList(acts) {
  return PLANET_ORDER.map(p => ({ planet: p, gate: acts[p].gate, line: acts[p].line }));
}

module.exports = { natalChart, transitChart, transitOverNatal, taipeiNowString, activationList, PLANET_ORDER };
