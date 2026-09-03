// lib/ecpayInvoice.js — ECPay 電子發票 B2C 開立（獨立於 AIO 收款的另一組帳號/加密方式）
import crypto from 'crypto';

function config() {
  const merchantId = process.env.ECPAY_INVOICE_MERCHANT_ID;
  const hashKey = process.env.ECPAY_INVOICE_HASH_KEY;
  const hashIv = process.env.ECPAY_INVOICE_HASH_IV;
  const isProd = process.env.ECPAY_MODE === 'production';
  const base = isProd ? 'https://einvoice.ecpay.com.tw' : 'https://einvoice-stage.ecpay.com.tw';
  return { merchantId, hashKey, hashIv, base };
}

export function invoiceConfigured() {
  const { merchantId, hashKey, hashIv } = config();
  return !!(merchantId && hashKey && hashIv);
}

// AES-128-CBC 加密（發票專用：僅做 URL encode，不轉小寫、不做 .NET 字元替換）
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

async function callInvoiceApi(path, dataObj, revision) {
  const { merchantId, hashKey, hashIv, base } = config();
  if (!merchantId || !hashKey || !hashIv) {
    throw new Error('電子發票尚未設定介接資訊（ECPAY_INVOICE_MERCHANT_ID / HASH_KEY / HASH_IV）');
  }
  const encrypted = aesEncrypt(dataObj, hashKey, hashIv);
  const body = {
    MerchantID: merchantId,
    RqHeader: { Timestamp: Math.floor(Date.now() / 1000), Revision: revision || '3.0.0' },
    Data: encrypted,
  };
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const outer = await res.json();
  if (Number(outer.TransCode) !== 1) {
    throw new Error('發票 API 傳輸失敗：' + (outer.TransMsg || JSON.stringify(outer)));
  }
  const inner = aesDecrypt(outer.Data, hashKey, hashIv);
  if (Number(inner.RtnCode) !== 1) {
    throw new Error('發票開立失敗：' + (inner.RtnMsg || JSON.stringify(inner)));
  }
  return inner;
}

// 開立 B2C 電子發票（個人消費者，無統編、不印紙本、無載具，Email 通知）
export async function issueInvoice({ relateNumber, amount, itemName, buyerEmail }) {
  const { merchantId } = config();
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const receiptDate = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const data = {
    MerchantID: merchantId,
    RelateNumber: relateNumber.slice(0, 30),
    CustomerEmail: buyerEmail,
    Print: '0',
    Donation: '0',
    CarrierType: '',
    TaxType: '1',
    SalesAmount: amount,
    InvoiceRemark: '',
    InvType: '07',
    vat: '1',
    Items: [
      { ItemSeq: 1, ItemName: itemName, ItemCount: 1, ItemWord: '份', ItemPrice: amount, ItemTaxType: '1', ItemAmount: amount },
    ],
  };
  const result = await callInvoiceApi('/B2CInvoice/Issue', data, '3.0.0');
  return {
    invoiceNo: result.InvoiceNo,
    invoiceDate: result.InvoiceDate || receiptDate,
    randomNumber: result.RandomNumber,
  };
}
