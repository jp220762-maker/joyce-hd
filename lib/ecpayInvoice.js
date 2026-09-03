// lib/ecpayInvoice.js — ECPay 電子收據 B2C 開立
// 說明：因未持有統一編號、無法開立正式統一發票，改用「電子收據」(/Receipt/Issue)，
// 沿用與 AIO 收款相同的介接資訊（ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV）。
import crypto from 'crypto';

function config() {
  const merchantId = process.env.ECPAY_MERCHANT_ID;
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIv = process.env.ECPAY_HASH_IV;
  const isProd = process.env.ECPAY_MODE === 'production';
  const base = isProd ? 'https://einvoice.ecpay.com.tw' : 'https://einvoice-stage.ecpay.com.tw';
  return { merchantId, hashKey, hashIv, base };
}

export function invoiceConfigured() {
  const { merchantId, hashKey, hashIv } = config();
  return !!(merchantId && hashKey && hashIv);
}

// AES-128-CBC 加密（發票/收據專用：僅做 URL encode，不轉小寫、不做 .NET 字元替換）
function aesEncrypt(obj, hashKey, hashIv) {
  const plain = encodeURIComponent(JSON.stringify(obj));
  const cipher = crypto.createCipheriv('aes-128-cbc', hashKey, hashIv);
  return Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]).toString('base64');
}

function aesDecrypt(b64, hashKey, hashIv) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', hashKey, hashIv);
  const plain = Buffer.concat([decipher.update(Buffer.from(b64, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(decodeURIComponent(plain));
}

async function callReceiptApi(path, dataObj) {
  const { merchantId, hashKey, hashIv, base } = config();
  if (!merchantId || !hashKey || !hashIv) {
    throw new Error('金流介接資訊尚未設定（ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV）');
  }
  const encrypted = aesEncrypt(dataObj, hashKey, hashIv);
  // 電子收據 RqHeader 只需要 Timestamp，不需要 Revision
  const body = {
    MerchantID: merchantId,
    RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
    Data: encrypted,
  };
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const outer = await res.json();
  if (Number(outer.TransCode) !== 1) {
    throw new Error('電子收據 API 傳輸失敗：' + (outer.TransMsg || JSON.stringify(outer)));
  }
  const inner = aesDecrypt(outer.Data, hashKey, hashIv);
  if (Number(inner.RtnCode) !== 1) {
    throw new Error('電子收據開立失敗：' + (inner.RtnMsg || JSON.stringify(inner)));
  }
  return inner;
}

// 開立一般電子收據（非統一發票；RetrievalMethod=2 電子寄送，Email 通知消費者）
export async function issueInvoice({ relateNumber, amount, itemName, buyerEmail }) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const receiptDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const data = {
    MerchantID: config().merchantId,
    Amount: amount,
    Name: buyerEmail,               // 個人消費者無抬頭資訊，以 Email 作為收據抬頭識別
    ReceiptType: 1,                 // 一般收據
    RetrievalMethod: 2,             // 電子寄送
    ReceiptDate: receiptDate,
    RelateNumber: relateNumber.slice(0, 30),
    Email: buyerEmail,
    Items: [
      { ItemSeq: 1, ItemName: itemName, ItemCount: 1, ItemPrice: amount, ItemAmount: amount },
    ],
  };
  const result = await callReceiptApi('/Receipt/Issue', data);
  return {
    invoiceNo: result.ReceiptNo,
    invoiceDate: result.ReceiptDate || receiptDate,
  };
}
