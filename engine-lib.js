// engine-lib.js v2 — 人類圖天文計算核心
// 新增：顏色(color)/音調(tone) 計算（供四箭頭變數使用）、時區轉換工具
const A = require('astronomy-engine');

const GATE_ORDER = [
  41,19,13,49,30,55,37,63, 22,36,25,17,21,51,42,3,
  27,24,2,23,8,20,16,35,   45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,   47,6,46,18,48,57,32,50,
  28,44,1,43,14,34,9,5,    26,11,10,58,38,54,61,60
];
const WHEEL_START = 302.0;
const GATE_DEG = 360 / 64;        // 5.625°
const LINE_DEG = GATE_DEG / 6;    // 0.9375°
const COLOR_DEG = LINE_DEG / 6;
const TONE_DEG = COLOR_DEG / 6;

function lonToGateLine(lon) {
  const off = ((lon - WHEEL_START) % 360 + 360) % 360;
  const gate = GATE_ORDER[Math.floor(off / GATE_DEG)];
  const inGate = off % GATE_DEG;
  const line = Math.floor(inGate / LINE_DEG) + 1;
  const inLine = inGate % LINE_DEG;
  const color = Math.floor(inLine / COLOR_DEG) + 1;
  const tone = Math.floor((inLine % COLOR_DEG) / TONE_DEG) + 1;
  return { gate, line, color, tone, lon };
}

function sunLon(t)  { return A.SunPosition(t).elon; }
function moonLon(t) { return A.EclipticGeoMoon(t).lon; }
function planetLon(body, t) { return A.Ecliptic(A.GeoVector(body, t, true)).elon; }

function trueNodeLon(t) {
  const dt = 1 / 1440;
  const e1 = A.Ecliptic(A.GeoVector(A.Body.Moon, t, true)).vec;
  const e2 = A.Ecliptic(A.GeoVector(A.Body.Moon, t.AddDays(dt), true)).vec;
  const v = { x: e2.x - e1.x, y: e2.y - e1.y, z: e2.z - e1.z };
  const h = { x: e1.y*v.z - e1.z*v.y, y: e1.z*v.x - e1.x*v.z, z: e1.x*v.y - e1.y*v.x };
  const lon = Math.atan2(h.x, -h.y) * 180 / Math.PI;
  return (lon % 360 + 360) % 360;
}

function allActivations(t) {
  const sun = sunLon(t), node = trueNodeLon(t);
  const bodies = {
    '太陽': sun, '地球': (sun + 180) % 360, '月亮': moonLon(t),
    '北交點': node, '南交點': (node + 180) % 360,
    '水星': planetLon(A.Body.Mercury, t), '金星': planetLon(A.Body.Venus, t),
    '火星': planetLon(A.Body.Mars, t), '木星': planetLon(A.Body.Jupiter, t),
    '土星': planetLon(A.Body.Saturn, t), '天王星': planetLon(A.Body.Uranus, t),
    '海王星': planetLon(A.Body.Neptune, t), '冥王星': planetLon(A.Body.Pluto, t),
  };
  const out = {};
  for (const [k, lon] of Object.entries(bodies)) out[k] = lonToGateLine(lon);
  return out;
}

function designTime(birth) {
  const target = ((sunLon(birth) - 88) % 360 + 360) % 360;
  let lo = birth.AddDays(-100), hi = birth.AddDays(-80);
  for (let i = 0; i < 60; i++) {
    const mid = lo.AddDays((hi.ut - lo.ut) / 2);
    let d = sunLon(mid) - target;
    d = ((d + 180) % 360 + 360) % 360 - 180;
    if (d > 0) hi = mid; else lo = mid;
  }
  return hi;
}

// 當地時間 → UTC（IANA 時區，含歷史夏令時間）
function tzOffsetMinutes(utcDate, zone) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour12: false,
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  const p = Object.fromEntries(dtf.formatToParts(utcDate).map(x => [x.type, x.value]));
  return (Date.UTC(p.year, p.month-1, p.day, p.hour%24, p.minute, p.second) - utcDate.getTime()) / 60000;
}
function localToUTC(y, mo, d, h, mi, zone) {
  let guess = Date.UTC(y, mo-1, d, h, mi, 0);
  for (let i = 0; i < 3; i++) guess = Date.UTC(y, mo-1, d, h, mi, 0) - tzOffsetMinutes(new Date(guess), zone) * 60000;
  return new Date(guess);
}

module.exports = { allActivations, designTime, lonToGateLine, localToUTC, GATE_ORDER };
