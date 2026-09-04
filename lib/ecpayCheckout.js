// lib/ecpayCheckout.js — ECPay AIO 結帳表單產生器
// 說明：官方 ecpay_aio_nodejs 套件的 gen_chk_mac_value 函式本身有 bug
// （用 JSON.stringify + 正規表達式硬拼字串，多個開發者回報會產生錯誤的
// CheckMacValue，導致「CheckMacValue Error」），因此這裡改用已驗證正確的
// 演算法自行實作，不依賴該套件的檢查碼計算部分。
import crypto from 'crypto';

// 依綠界官方規格：排序參數 → 組成 key=value&... → 前後加 HashKey/HashIV →
// URL encode（.NET 風格，小寫、空白轉+、額外處理 - _ . ! * ( ) 這幾個
// JS 預設不編碼但 .NET 會編碼的符號）→ SHA256 → 轉大寫
export function genCheckMacValue(params, hashKey, hashIv) {
  const sorted = Object.keys(params).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const query = sorted.map((k) => `${k}=${params[k]}`).join('&');
  const raw = `HashKey=${hashKey}&${query}&HashIV=${hashIv}`;
  let encoded = encodeURIComponent(raw).toLowerCase();
  encoded = encoded
    .replace(/%20/g, '+')
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 產生完整的自動送出付款表單 HTML
export function buildCheckoutForm({ params, hashKey, hashIv, actionUrl }) {
  const full = {
    ...params,
    MerchantID: params.MerchantID,
    ChoosePayment: params.ChoosePayment || 'ALL',
    EncryptType: 1,
    PaymentType: 'aio',
  };
  const checkMacValue = genCheckMacValue(full, hashKey, hashIv);
  const all = { ...full, CheckMacValue: checkMacValue };

  const inputs = Object.keys(all)
    .map((k) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(all[k])}" />`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>前往付款...</title></head>
<body>
<form id="ecpay_form" action="${actionUrl}" method="post">${inputs}</form>
<script>document.getElementById('ecpay_form').submit();</script>
</body></html>`;
}
