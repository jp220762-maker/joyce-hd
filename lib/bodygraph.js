// bodygraph.js v3 — 人體圖 SVG 繪製元件
// v3 修正:①行星欄擢升/衰落符號 ②啟動只畫接通的通道(懸掛閘門除外) ③左右長通道重新佈線
//          ④所有閘門改用「圓片」樣式(啟動/未啟動皆清楚) ⑤摘要改表格式+咖啡色標題列
const { FIXING } = require('./fixing.js');

const C = {
  bg:        '#F6F1E7',
  paper:     '#FBF8F1',
  line:      '#D9CDBA',
  ink:       '#443A31',
  faint:     '#A2937F',
  black:     '#2B2622',
  red:       '#B33A2B',
  terracotta:'#C1704F',
  sage:      '#9BAA8D',
  sand:      '#CFC0A0',
  clay:      '#A98467',
  gold:      '#D9A95F',
  coffee:    '#5C4A3A',   // 摘要標題列
};

// 圓角多邊形路徑:每個角落用二次貝茲曲線削去一小段,產生圓潤角
function roundedPolygonPath(pts, r = 14) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
    const v1 = [cur[0] - prev[0], cur[1] - prev[1]], v2 = [next[0] - cur[0], next[1] - cur[1]];
    const len1 = Math.hypot(...v1), len2 = Math.hypot(...v2);
    const rr = Math.min(r, len1 / 2, len2 / 2);
    const p1 = [cur[0] - v1[0] / len1 * rr, cur[1] - v1[1] / len1 * rr];
    const p2 = [cur[0] + v2[0] / len2 * rr, cur[1] + v2[1] / len2 * rr];
    d += (i === 0 ? `M ${p1[0]},${p1[1]}` : ` L ${p1[0]},${p1[1]}`) + ` Q ${cur[0]},${cur[1]} ${p2[0]},${p2[1]}`;
  }
  return d + ' Z';
}

const CENTERS = {
  '頭': { fill: C.sand, shape: 'poly', pts: [[450.0, 45.0], [380.7, 128.5], [519.3, 128.5]] },
  '腦': { fill: C.sage, shape: 'poly', pts: [[450.0, 232.6], [380.7, 144.6], [519.3, 144.6]] },
  '喉': { fill: C.clay, shape: 'rect', x: 385.0, y: 254.0, w: 130.0, h: 118.0 },
  'G': { fill: C.gold, shape: 'poly', pts: [[450.0, 393.6], [532.5, 468.8], [450.0, 543.9], [367.5, 468.8]] },
  '心': { fill: C.terracotta, shape: 'poly', pts: [[574.3, 491.0], [521.7, 559.8], [626.8, 559.8]] },
  '直覺': { fill: C.sage, shape: 'poly', pts: [[300.5, 633.4], [170.5, 551.4], [170.5, 715.4]] },
  '情緒': { fill: C.terracotta, shape: 'poly', pts: [[599.5, 633.4], [729.5, 551.4], [729.5, 715.4]] },
  '薦骨': { fill: C.terracotta, shape: 'rect', x: 385.0, y: 601.6, w: 130.0, h: 118.0 },
  '根': { fill: C.terracotta, shape: 'rect', x: 385.0, y: 747.0, w: 130.0, h: 118.0 },
};

const GATE_POS = {
  64:[412.6,117.3], 61:[450.0,117.3], 63:[487.4,117.3], 47:[412.6,155.8], 24:[450.0,155.8], 4:[487.4,155.8], 17:[424.5,183.3], 11:[475.5,183.3],
  43:[450.0,210.0], 62:[424.5,265.6], 23:[450.0,265.6], 56:[475.5,265.6], 16:[397.0,290.8], 20:[397.0,333.3], 35:[503.0,290.8], 12:[503.0,333.3],
  45:[499.5,360.4], 31:[420.2,360.4], 8:[450.0,360.4], 33:[479.8,360.4], 1:[450.0,416.0], 7:[420.2,436.6], 13:[479.8,436.6], 10:[387.0,471.1],
  25:[513.0,471.1], 15:[418.3,498.4], 46:[481.7,498.4], 2:[450.0,521.0], 21:[575.8,511.6], 40:[593.4,548.7], 51:[558.9,529.7], 26:[549.6,548.8],
  48:[185.6,574.3], 57:[216.6,594.3], 44:[249.2,614.9], 50:[273.6,636.9], 32:[212.4,641.0], 28:[212.4,675.2], 18:[212.4,709.4], 36:[714.4,574.3],
  22:[683.4,594.3], 37:[650.8,614.9], 6:[626.4,636.9], 49:[687.6,641.0], 55:[687.6,675.2], 30:[687.6,709.4], 5:[418.3,613.2], 14:[450.0,613.2],
  29:[481.7,613.2], 34:[397.0,638.6], 27:[397.1,669.7], 59:[502.9,669.7], 42:[415.6,708.0], 3:[450.0,708.0], 9:[484.4,708.0], 53:[415.6,758.6],
  60:[450.0,758.6], 52:[484.4,758.6], 54:[397.0,784.8], 38:[397.0,819.0], 58:[397.0,853.2], 19:[503.0,784.8], 39:[503.0,819.0], 41:[503.0,853.2],
};

// 通道:直線 / q=二次曲線控制點 / c=三次曲線兩控制點
const CHANNEL_PATHS = [
  { g:[27,50] },
  { g:[13,33] },
  { g:[20,57] },
  { g:[35,36] },
  { g:[12,22] },
  { g:[21,45] },
  { g:[2,14] },
  { g:[5,15] },
  { g:[29,46] },
  { g:[26,44] },
  { g:[37,40] },
  { g:[6,59] },
  { g:[3,60] },
  { g:[9,52] },
  { g:[19,49] },
  { g:[39,55] },
  { g:[30,41] },
  { g:[18,58] },
  { g:[17,62] },
  { g:[23,43] },
  { g:[11,56] },
  { g:[1,8] },
  { g:[7,31] },
  { g:[47,64] },
  { g:[24,61] },
  { g:[4,63] },
  { g:[25,51] },
  { g:[42,53] },
  { g:[10,20], pts:[[304.3,468.8]] },
  { g:[34,57], pts:[[248.5,551.5]] },
  { g:[10,34], pts:[[304.3,468.8],[248.5,551.5]] },
  { g:[20,34], pts:[[248.5,551.5]] },
  { g:[10,57], pts:[[304.3,468.8]] },
  { g:[16,48] },
  { g:[28,38] },
  { g:[32,54] },
];

// 幾何:直線/二次/三次曲線的中點切割(de Casteljau)
const mid = (a, b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
function halfPaths(pA, pB, q, c, pts) {
  if (pts) {
    const chain = [pA, ...pts, pB];
    const segs = [];
    let total = 0;
    for (let i = 0; i < chain.length-1; i++) {
      const L = Math.hypot(chain[i+1][0]-chain[i][0], chain[i+1][1]-chain[i][1]);
      segs.push(L); total += L;
    }
    let half = total/2, i = 0;
    while (half > segs[i]) { half -= segs[i]; i++; }
    const t = half/segs[i];
    const M = [chain[i][0]+(chain[i+1][0]-chain[i][0])*t, chain[i][1]+(chain[i+1][1]-chain[i][1])*t];
    const aPts = chain.slice(0, i+1).concat([M]);
    const bPts = [M].concat(chain.slice(i+1)).reverse();
    const toPath = arr => 'M ' + arr.map(p => p.join(',')).join(' L ');
    // cap 版:懸掛時只畫到最近的接點,不溢入共用主幹
    const aCap = toPath([chain[0], chain[1]]);
    const bCap = toPath([chain[chain.length-1], chain[chain.length-2]]);
    return { a: toPath(aPts), b: toPath(bPts), aCap, bCap, full: toPath(chain) };
  }
  if (c) {
    const [c1, c2] = c;
    const m01 = mid(pA,c1), m12 = mid(c1,c2), m23 = mid(c2,pB);
    const m012 = mid(m01,m12), m123 = mid(m12,m23), m = mid(m012,m123);
    return { a: `M ${pA} C ${m01} ${m012} ${m}`, b: `M ${pB} C ${m23} ${m123} ${m}`, full: `M ${pA} C ${c1} ${c2} ${pB}` };
  }
  if (q) {
    const m1 = mid(pA,q), m2 = mid(q,pB), m = mid(m1,m2);
    return { a:`M ${pA} Q ${m1} ${m}`, b:`M ${pB} Q ${m2} ${m}`, full:`M ${pA} Q ${q} ${pB}` };
  }
  const m = mid(pA,pB);
  return { a:`M ${pA} L ${m}`, b:`M ${pB} L ${m}`, full:`M ${pA} L ${pB}` };
}

const PLANET_ORDER = ['太陽','地球','月亮','北交點','南交點','水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
const PLANET_GLYPH = { '太陽':'\u2609','地球':'\u2295','月亮':'\u263D','北交點':'\u260A','南交點':'\u260B','水星':'\u263F','金星':'\u2640','火星':'\u2642','木星':'\u2643','土星':'\u2644','天王星':'\u2645','海王星':'\u2646','冥王星':'\u2647' };

// 擢升/衰落符號:▲ 擢升、▼ 衰落、★ 兩者皆是(juxtaposition)
// 官方規則(Jovian Archive):行星的啟動除了本身閘門外,也能透過「調和閘門」(該閘門的通道夥伴)傳導判定
// 即:某線的指定擢升/衰落行星,只要真實出現在「同一閘門的任一線」或「通道對面閘門的任一線」,該線就被判定
const CHANNEL_PARTNERS = {};
for (const { g } of CHANNEL_PATHS) {
  const [a, b] = g;
  (CHANNEL_PARTNERS[a] ??= new Set()).add(b);
  (CHANNEL_PARTNERS[b] ??= new Set()).add(a);
}
function fixSymbol(planet, gate, line, allActs) {
  const f = FIXING[`${gate}.${line}`];
  if (!f) return '';
  const reachGates = new Set([gate, ...(CHANNEL_PARTNERS[gate] ?? [])]);
  const hasPlanetAt = (name) => allActs.some(([p, a]) => p === name && reachGates.has(a.gate));
  const ex = (f.ex ?? []).some(hasPlanetAt);
  const det = (f.det ?? []).some(hasPlanetAt);
  if (ex && det) return '\u2605';
  if (ex) return '\u25B2';
  if (det) return '\u25BC';
  return '';
}

// 通道端點裁切:讓線停在中心幾何邊緣,不進入內部
function centerEdgesOf(gate) {
  const name = GATE_CENTER_MAP[gate];
  const c = CENTERS[name];
  if (!c) return [];
  if (c.shape === 'rect') {
    const { x, y, w, h } = c;
    return [[[x,y],[x+w,y]], [[x+w,y],[x+w,y+h]], [[x+w,y+h],[x,y+h]], [[x,y+h],[x,y]]];
  }
  const p = c.pts, n = p.length;
  return p.map((_, i) => [p[i], p[(i+1) % n]]);
}
// 從閘門位置沿指定方向,推進到中心邊界上的交點
function edgePoint(gate, toward) {
  const from = GATE_POS[gate];
  const dx = toward[0] - from[0], dy = toward[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return from;
  const d = [dx/len, dy/len];
  let best = null;
  for (const [p1, p2] of centerEdgesOf(gate)) {
    const ex = p2[0]-p1[0], ey = p2[1]-p1[1];
    const den = d[0]*ey - d[1]*ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p1[0]-from[0])*ey - (p1[1]-from[1])*ex) / den;
    const u = ((p1[0]-from[0])*d[1] - (p1[1]-from[1])*d[0]) / den;
    if (t > 1e-6 && u >= -0.02 && u <= 1.02 && (best === null || t < best)) best = t;
  }
  if (best === null) return from;
  return [from[0] + d[0]*best, from[1] + d[1]*best];
}

const GATE_CENTER_MAP = {
  64:'頭',61:'頭',63:'頭', 47:'腦',24:'腦',4:'腦',17:'腦',11:'腦',43:'腦',
  62:'喉',23:'喉',56:'喉',35:'喉',12:'喉',45:'喉',33:'喉',8:'喉',31:'喉',20:'喉',16:'喉',
  1:'G',13:'G',25:'G',46:'G',2:'G',15:'G',10:'G',7:'G', 21:'心',40:'心',26:'心',51:'心',
  6:'情緒',37:'情緒',22:'情緒',36:'情緒',30:'情緒',55:'情緒',49:'情緒',
  48:'直覺',57:'直覺',44:'直覺',50:'直覺',32:'直覺',28:'直覺',18:'直覺',
  5:'薦骨',14:'薦骨',29:'薦骨',59:'薦骨',9:'薦骨',3:'薦骨',42:'薦骨',27:'薦骨',34:'薦骨',
  53:'根',60:'根',52:'根',19:'根',39:'根',41:'根',58:'根',38:'根',54:'根'
};

// 從中心邊界再往內縮回一段,讓線與閘門圓片重疊,消除接縫
function towardGate(gate, edgePt, overlap = 16) {
  const g = GATE_POS[gate];
  const dx = g[0] - edgePt[0], dy = g[1] - edgePt[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return edgePt;
  const step = Math.min(overlap, len);
  return [edgePt[0] + dx/len*step, edgePt[1] + dy/len*step];
}

function renderBodygraph(P, D, info, name = '', opts = {}) {
  const showTable = opts.showTable !== false;   // 預設顯示摘要表；合圖可關閉
  const personalityOnly = opts.personalityOnly === true;  // 流日：只顯示個性欄（黑）
  const pGates = new Set(Object.values(P).map(a => a.gate));
  // personalityOnly（流日）：不視為設計啟動，所有線一律純黑
  const dGates = personalityOnly ? new Set() : new Set(Object.values(D).map(a => a.gate));
  const defined = new Set(info.centers);

  // 已接通通道集合 + 各閘門是否屬於任一接通通道
  const compKey = new Set(info.channels.map(([a,b]) => `${Math.min(a,b)}-${Math.max(a,b)}`));
  const gateHasComplete = {};
  info.channels.forEach(([a,b]) => { gateHasComplete[a] = true; gateHasComplete[b] = true; });

  let ch = '', act = '';
  for (const { g, q, c, pts } of CHANNEL_PATHS) {
    const [gA, gB] = g;
    const firstA = pts && pts.length ? pts[0] : GATE_POS[gB];
    const firstB = pts && pts.length ? pts[pts.length-1] : GATE_POS[gA];
    const startA = towardGate(gA, edgePoint(gA, q || (c && c[0]) || firstA));
    const startB = towardGate(gB, edgePoint(gB, q || (c && c[1]) || firstB));
    const h = halfPaths(startA, startB, q, c, pts);
    ch += `<path d="${h.full}" class="base"/>`;
    const thisComplete = compKey.has(`${Math.min(gA,gB)}-${Math.max(gA,gB)}`);
    for (const [gate, d] of [[gA, h.a], [gB, h.b]]) {
      const inP = pGates.has(gate), inD = dGates.has(gate);
      if (!inP && !inD) continue;
      // 規則:閘門若有任何接通的通道,只在接通的通道上著色;完全懸掛的閘門才畫懸掛半段
      if (gateHasComplete[gate] && !thisComplete) continue;
      // 通道未接通(懸掛)時,折線半段止於接點
      let dd = d;
      if (!thisComplete) {
        if (gate === gA && h.aCap) dd = h.aCap;
        if (gate === gB && h.bCap) dd = h.bCap;
      }
      if (inP) act += `<path d="${dd}" stroke="${C.black}" class="act"/>`;
      if (inD) act += inP
        ? `<path d="${dd}" stroke="${C.red}" class="act" stroke-dasharray="5 5" style="stroke-linecap:butt"/>`
        : `<path d="${dd}" stroke="${C.red}" class="act"/>`;
    }
  }

  // ── SVG 遮罩:以「內縮版」中心形狀當遮蔽區,通道線進入中心後強制被剪斷
  // 內縮量(INSET)略小於閘門圓片半徑,讓線末端仍能藏在圓片下,不留接縫
  const INSET = 7;
  const insetPts = (pts) => {
    const cx = pts.reduce((s,p)=>s+p[0],0)/pts.length;
    const cy = pts.reduce((s,p)=>s+p[1],0)/pts.length;
    return pts.map(([x,y]) => {
      const d = Math.hypot(x-cx, y-cy) || 1;
      return [x - (x-cx)/d*INSET, y - (y-cy)/d*INSET];
    });
  };
  let maskShapes = '';
  for (const c of Object.values(CENTERS)) {
    maskShapes += c.shape === 'rect'
      ? `<rect x="${c.x+INSET}" y="${c.y+INSET}" width="${c.w-INSET*2}" height="${c.h-INSET*2}" rx="12" fill="black"/>`
      : `<path d="${roundedPolygonPath(insetPts(c.pts), 10)}" fill="black"/>`;
  }
  const maskDef = `<defs><mask id="centers-mask">` +
    `<rect x="0" y="0" width="900" height="1180" fill="white"/>${maskShapes}</mask></defs>`;

  let centers = '';
  for (const c of Object.values(CENTERS)) {
    const key = Object.keys(CENTERS).find(k => CENTERS[k] === c);
    const on = defined.has(key);
    const fill = on ? c.fill : C.paper;
    const stroke = on ? 'none' : C.line;
    centers += c.shape === 'rect'
      ? `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
      : `<path d="${roundedPolygonPath(c.pts, 14)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }

  // 閘門圓片:啟動=深棕底白字;未啟動=米白底棕字細框 → 任何底色上都清楚
  let gates = '';
  for (const [gate, [x, y]] of Object.entries(GATE_POS)) {
    const gn = Number(gate);
    const on = pGates.has(gn) || dGates.has(gn);
    gates += on
      ? `<circle cx="${x}" cy="${y}" r="8.5" fill="${C.ink}"/><text x="${x}" y="${y}" class="gt on">${gate}</text>`
      : `<circle cx="${x}" cy="${y}" r="7.5" fill="${C.paper}" stroke="${C.line}" stroke-width="1"/><text x="${x}" y="${y}" class="gt">${gate}</text>`;
  }

  // 完整26個啟動(Design+Personality合併),供擢升/衰落的通道調和判定使用
  const allActs = [...Object.entries(D), ...Object.entries(P)];

  // 行星欄(含擢升/衰落符號:Design 欄在數字後、Personality 欄在數字前)
  const col = (acts, x, title, color, isDesign) => {
    let t = `<text x="${x}" y="140" class="col-h" fill="${color}" text-anchor="${isDesign ? 'start' : 'end'}">${title}</text>`;
    const numX = isDesign ? x + 92 : x - 92;
    PLANET_ORDER.forEach((p, i) => {
      const a = acts[p], y = 178 + i * 56, v = `${a.gate}.${a.line}`;
      const s = fixSymbol(p, a.gate, a.line, allActs);
      t += isDesign
        ? `<text x="${x}" y="${y}" class="glyph" fill="${color}" text-anchor="start">${PLANET_GLYPH[p]}</text>` +
          `<text x="${numX}" y="${y}" class="col" fill="${color}" text-anchor="end">${v}</text>` +
          (s ? `<text x="${numX + 11}" y="${y}" class="col fx" fill="${color}" text-anchor="start">${s}</text>` : '')
        : `<text x="${x}" y="${y}" class="glyph" fill="${color}" text-anchor="end">${PLANET_GLYPH[p]}</text>` +
          `<text x="${numX}" y="${y}" class="col" fill="${color}" text-anchor="start">${v}</text>` +
          (s ? `<text x="${numX - 11}" y="${y}" class="col fx" fill="${color}" text-anchor="end">${s}</text>` : '');
    });
    return t;
  };

  // 四箭頭
  const arrowBox = (x, y, dir, color) => {
    const arr = dir === '\u2190'
      ? `<path d="M ${x+34} ${y+10} h -13 v -6 l -13 10 13 10 v -6 h 13 z" fill="${color}"/>`
      : `<path d="M ${x+10} ${y+10} h 13 v -6 l 13 10 -13 10 v -6 h -13 z" fill="${color}"/>`;
    return `<rect x="${x}" y="${y}" width="44" height="28" rx="7" fill="${C.paper}" stroke="${C.line}" stroke-width="1.2"/>` + arr;
  };
  const ar = info.arrows;
  const arrowsSvg = ar ? [
    personalityOnly ? '' : arrowBox(288, 52, ar.topLeft, C.red),
    personalityOnly ? '' : arrowBox(288, 90, ar.bottomLeft, C.red),
    arrowBox(552, 52, ar.topRight, C.black), arrowBox(552, 90, ar.bottomRight, C.black),
  ].join('') : '';

  // 摘要表格:標題列咖啡色色塊 + 內容列
  const TX = 110, TW = 680;
  const tableRow = (y, cells) => {
    const cw = TW / cells.length;
    let t = `<rect x="${TX}" y="${y}" width="${TW}" height="30" fill="${C.coffee}"/>`;
    cells.forEach(([k], i) => {
      t += `<text x="${TX + cw*i + cw/2}" y="${y+15}" class="th">${k}</text>`;
      if (i > 0) t += `<line x1="${TX + cw*i}" y1="${y+4}" x2="${TX + cw*i}" y2="${y+26}" stroke="${C.bg}" stroke-width="1" opacity=".45"/>`;
    });
    t += `<rect x="${TX}" y="${y+30}" width="${TW}" height="48" fill="${C.paper}" stroke="${C.line}" stroke-width="1"/>`;
    cells.forEach(([, v, en], i) => {
      const cx = TX + cw*i + cw/2;
      t += `<text x="${cx}" y="${y + (en ? 52 : 56)}" class="td">${v}</text>`;
      if (en) t += `<text x="${cx}" y="${y+70}" class="te">${en}</text>`;
      if (i > 0) t += `<line x1="${TX + cw*i}" y1="${y+34}" x2="${TX + cw*i}" y2="${y+74}" stroke="${C.line}" stroke-width="1"/>`;
    });
    return t;
  };
  const infoTable =
    tableRow(902, [['類型', info.type, ''], ['人生角色', info.profile, ''], ['定義', info.definition, '']]) +
    tableRow(992, [['內在權威', info.authority, ''], ['策略', info.strategy ?? '', ''], ['非自己主題', info.notSelf ?? '', '']]) +
    tableRow(1082, [['輪迴交叉', info.cross ?? '', '']]);

  const H = showTable ? 1180 : 900;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 ${H}" font-family="Arial,'Microsoft JhengHei','微軟正黑體','PingFang TC','Noto Sans TC',sans-serif">
  <style>
    .base { fill:none; stroke:${C.line}; stroke-width:8.25; stroke-linecap:butt; }
    .act  { fill:none; stroke-width:8.25; stroke-linecap:butt; }
    .gt   { font-size:9.5px; fill:${C.faint}; text-anchor:middle; dominant-baseline:central; }
    .gt.on{ fill:#FFF; font-weight:700; font-size:10px; }
    .col-h{ font-size:21px; font-weight:700; letter-spacing:1px; }
    .col  { font-size:25px; }
    .glyph{ font-size:24px; font-family:'DejaVu Sans','Segoe UI Symbol',Arial,'Microsoft JhengHei',sans-serif; }
    .fx   { font-size:17px; }
    .name { font-size:26px; fill:${C.ink}; font-weight:700; }
    .th   { font-size:14px; fill:${C.bg}; text-anchor:middle; dominant-baseline:central; letter-spacing:3px; font-weight:700; }
    .td   { font-size:19px; fill:${C.ink}; font-weight:700; text-anchor:middle; }
    .te   { font-size:11px; fill:${C.faint}; text-anchor:middle; }
  </style>
  <rect width="900" height="${H}" fill="${C.bg}"/>
  ${name ? `<text x="30" y="52" class="name" text-anchor="start">${name}</text>` : ''}
  ${personalityOnly ? '' : col(D, 8, 'Design', C.red, true)}
  ${col(P, 892, 'Personality', C.black, false)}
  ${arrowsSvg}
  <g id="channels-layer">${ch}${act}</g>
  <g id="centers-layer">${centers}</g>
  <g id="gate-badges-layer">${gates}</g>
  ${showTable ? infoTable : ''}
</svg>`;
}

module.exports = { renderBodygraph, CHANNEL_PATHS, GATE_POS, CENTERS, halfPaths };
