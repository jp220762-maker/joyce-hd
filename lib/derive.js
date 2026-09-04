// derive.js v2 — 判讀層：通道/中心/類型/權威/角色/定義 + 策略/非自己主題/輪迴交叉/四箭頭
const { GATE_ORDER } = require('./engine-lib.js');
const { CROSS_TABLE } = require('./cross-table.js');

const CHANNELS = [
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],
  [10,57],[11,56],[12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],
  [20,57],[21,45],[23,43],[24,61],[25,51],[26,44],[27,50],[28,38],[29,46],
  [30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]
];
const GATE_CENTER = {
  64:'頭',61:'頭',63:'頭', 47:'腦',24:'腦',4:'腦',17:'腦',43:'腦',11:'腦',
  62:'喉',23:'喉',56:'喉',35:'喉',12:'喉',45:'喉',33:'喉',8:'喉',31:'喉',20:'喉',16:'喉',
  1:'G',13:'G',25:'G',46:'G',2:'G',15:'G',10:'G',7:'G',
  21:'心',40:'心',26:'心',51:'心',
  6:'情緒',37:'情緒',22:'情緒',36:'情緒',30:'情緒',55:'情緒',49:'情緒',
  48:'直覺',57:'直覺',44:'直覺',50:'直覺',32:'直覺',28:'直覺',18:'直覺',
  5:'薦骨',14:'薦骨',29:'薦骨',59:'薦骨',9:'薦骨',3:'薦骨',42:'薦骨',27:'薦骨',34:'薦骨',
  53:'根',60:'根',52:'根',19:'根',39:'根',41:'根',58:'根',38:'根',54:'根'
};
const MOTORS = ['薦骨','心','情緒','根'];

const STRATEGY = { '生產者':'等待回應','顯示生產者':'等待回應','投射者':'等待被邀請','顯示者':'告知','反映者':'等待月循環' };
const NOT_SELF = { '生產者':'挫敗感','顯示生產者':'挫敗感','投射者':'苦澀感','顯示者':'憤怒','反映者':'失望' };

// 右角度交叉 16 組名稱（依個性太陽閘門查詢）
const RAC_NAME = {};
[
  ['人面獅身', [1,2,7,13]],   ['愛之船', [10,15,25,46]],
  ['律法',     [3,50,56,60]], ['解釋',   [4,49,23,43]],
  ['意識',     [5,35,63,64]], ['伊甸園', [6,36,11,12]],
  ['感染',     [8,14,29,30]], ['計劃',   [9,16,37,40]],
  ['統治',     [22,47,26,45]],['馬雅',   [32,42,61,62]],
  ['沉睡鳳凰', [20,34,55,59]],['張力',   [21,48,38,39]],
  ['滲透',     [51,57,53,54]],['服務',   [17,18,52,58]],
  ['四方之路', [19,33,24,44]],['意外',   [27,28,31,41]],
].forEach(([nm, gs]) => gs.forEach(g => RAC_NAME[g] = nm));

const RIGHT_ANGLE = ['1/3','1/4','2/4','2/5','3/5','3/6','4/6'];
const LEFT_ANGLE  = ['5/1','5/2','6/2','6/3'];

function crossInfo(P, D, profile) {
  const pS = P['太陽'].gate, pE = P['地球'].gate, dS = D['太陽'].gate, dE = D['地球'].gate;
  const gates = `(${pS}/${pE}｜${dS}/${dE})`;
  // 角度類型:右角度 / 並列(4/1) / 左角度
  const ang = RIGHT_ANGLE.includes(profile) ? 'R' : (profile === '4/1' ? 'J' : 'L');
  const hit = CROSS_TABLE[`${ang}:${pS}/${pE}|${dS}/${dE}`];
  if (hit) return `${hit.zh} ${gates}`;
  // 查無資料時的保底顯示
  const label = ang === 'R' ? '右角度交叉' : ang === 'J' ? '並列交叉' : '左角度交叉';
  return `${label} ${gates}`;
}

// 輪迴交叉對應星座與固定說明（僅供顯示用的額外資訊，不影響原本的 cross 字串顯示）
function crossExtra(P, D, profile) {
  const pS = P['太陽'].gate, pE = P['地球'].gate, dS = D['太陽'].gate, dE = D['地球'].gate;
  const ang = RIGHT_ANGLE.includes(profile) ? 'R' : (profile === '4/1' ? 'J' : 'L');
  const hit = CROSS_TABLE[`${ang}:${pS}/${pE}|${dS}/${dE}`];
  return { sign: hit?.sign || '', desc: hit?.desc || '' };
}

// 四箭頭（變數）：音調 1–3 = 左(←)、4–6 = 右(→)
function arrows(P, D) {
  const dir = t => (t <= 3 ? '←' : '→');
  return {
    topLeft:     dir(D['太陽'].tone),   // 消化（設計太陽）
    bottomLeft:  dir(D['北交點'].tone), // 環境（設計北交點）
    topRight:    dir(P['太陽'].tone),   // 動機（個性太陽）
    bottomRight: dir(P['北交點'].tone), // 觀點（個性北交點）
  };
}

function derive(pAct, dAct) {
  const gates = new Set([...Object.values(pAct), ...Object.values(dAct)].map(a => a.gate));
  const channels = CHANNELS.filter(([a,b]) => gates.has(a) && gates.has(b));
  const centers = new Set();
  channels.forEach(([a,b]) => { centers.add(GATE_CENTER[a]); centers.add(GATE_CENTER[b]); });

  const adj = {};
  channels.forEach(([a,b]) => {
    const ca = GATE_CENTER[a], cb = GATE_CENTER[b];
    (adj[ca] ??= new Set()).add(cb);
    (adj[cb] ??= new Set()).add(ca);
  });
  const seen = new Set(); let comps = 0;
  for (const c of centers) {
    if (seen.has(c)) continue;
    comps++;
    const st = [c];
    while (st.length) {
      const x = st.pop();
      if (seen.has(x)) continue;
      seen.add(x);
      (adj[x] ?? []).forEach(y => st.push(y));
    }
  }
  const DEF_NAME = {0:'無定義',1:'一分人',2:'二分人',3:'三分人',4:'四分人'};

  const throatToMotor = (() => {
    if (!centers.has('喉')) return false;
    const s2 = new Set(); const st = ['喉'];
    while (st.length) {
      const x = st.pop();
      if (s2.has(x)) continue;
      s2.add(x);
      if (MOTORS.includes(x)) return true;
      (adj[x] ?? []).forEach(y => st.push(y));
    }
    return false;
  })();

  let type;
  if (centers.size === 0) type = '反映者';
  else if (centers.has('薦骨')) type = throatToMotor ? '顯示生產者' : '生產者';
  else if (throatToMotor) type = '顯示者';
  else type = '投射者';

  let authority;
  if (centers.has('情緒')) authority = '情緒型權威';
  else if (centers.has('薦骨')) authority = '薦骨型權威';
  else if (centers.has('直覺')) authority = '直覺型權威';
  else if (centers.has('心')) authority = '意志力型權威';
  else if (centers.has('G')) authority = '自我投射型權威';
  else if (centers.size > 0) authority = '環境權威';
  else authority = '月循環權威';

  const profile = `${pAct['太陽'].line}/${dAct['太陽'].line}`;

  return {
    channels, centers: [...centers],
    definition: DEF_NAME[comps] ?? `${comps}分`,
    type, authority, profile,
    strategy: STRATEGY[type], notSelf: NOT_SELF[type],
    cross: crossInfo(pAct, dAct, profile),
    crossExtra: crossExtra(pAct, dAct, profile),
    arrows: arrows(pAct, dAct),
  };
}

module.exports = { derive };
