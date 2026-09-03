// lib/pdfReport.js — 將 AI 產生的解圖報告文字排版成 PDF（含品牌 Logo）
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

const FONT_PATH = path.join(process.cwd(), 'lib', 'fonts', 'NotoSerifTC-Regular.otf');

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0x44 / 255, 0x3a / 255, 0x31 / 255);
const COFFEE = rgb(0x5c / 255, 0x4a / 255, 0x3a / 255);
const TERRACOTTA = rgb(0xc1 / 255, 0x70 / 255, 0x4f / 255);
const FAINT = rgb(0xa2 / 255, 0x93 / 255, 0x7f / 255);
const LINE = rgb(0xd9 / 255, 0xcd / 255, 0xba / 255);

// 依 CJK 字寬粗估斷行（中文字視為全形寬度，英數字視為半形）
function wrapText(text, font, size, maxWidth) {
  const paragraphs = String(text || '').split('\n');
  const lines = [];
  for (const para of paragraphs) {
    if (!para.trim()) { lines.push(''); continue; }
    let cur = '';
    for (const ch of para) {
      const test = cur + ch;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && cur) {
        lines.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
  }
  return lines;
}

export async function buildReportPdf({ title, subtitle, birthLine, sections, logoBytes, footerNote }) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(FONT_PATH);
  const font = await doc.embedFont(fontBytes, { subset: true });

  let logoImg = null;
  let logoDims = null;
  if (logoBytes) {
    try {
      logoImg = await doc.embedPng(logoBytes);
    } catch {
      try { logoImg = await doc.embedJpg(logoBytes); } catch { logoImg = null; }
    }
    if (logoImg) {
      const maxLogoW = 90;
      const scale = Math.min(1, maxLogoW / logoImg.width);
      logoDims = { width: logoImg.width * scale, height: logoImg.height * scale };
    }
  }

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  let pageNum = 1;

  function newPage() {
    drawFooter(page, pageNum);
    page = doc.addPage([PAGE_W, PAGE_H]);
    pageNum += 1;
    y = PAGE_H - MARGIN;
  }

  function drawFooter(pg, num) {
    pg.drawText(footerNote || '', {
      x: MARGIN, y: 28, size: 8, font, color: FAINT,
    });
    pg.drawText(String(num), {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(String(num), 8), y: 28,
      size: 8, font, color: FAINT,
    });
  }

  function ensureSpace(h) {
    if (y - h < MARGIN + 30) newPage();
  }

  function drawParagraph(text, { size = 11, color = INK, lineGap = 6, indent = 0 } = {}) {
    const lines = wrapText(text, font, size, CONTENT_W - indent);
    for (const ln of lines) {
      ensureSpace(size + lineGap);
      page.drawText(ln, { x: MARGIN + indent, y: y - size, size, font, color });
      y -= size + lineGap;
    }
  }

  // ── 頁首：Logo + 標題
  if (logoImg && logoDims) {
    page.drawImage(logoImg, {
      x: MARGIN, y: y - logoDims.height, width: logoDims.width, height: logoDims.height,
    });
    y -= logoDims.height + 18;
  }

  drawParagraph(title, { size: 22, color: COFFEE, lineGap: 8 });
  y -= 2;
  if (subtitle) drawParagraph(subtitle, { size: 12, color: FAINT, lineGap: 4 });
  if (birthLine) drawParagraph(birthLine, { size: 10, color: FAINT, lineGap: 4 });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
    thickness: 1, color: LINE,
  });
  y -= 26;

  // ── 內文段落
  for (const sec of sections) {
    ensureSpace(40);
    if (sec.heading) {
      drawParagraph(sec.heading, { size: 14, color: TERRACOTTA, lineGap: 6 });
      y -= 4;
    }
    drawParagraph(sec.body, { size: 11.5, color: INK, lineGap: 7 });
    y -= 16;
  }

  drawFooter(page, pageNum);

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
