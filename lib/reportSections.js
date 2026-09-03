// lib/reportSections.js — 將 AI／預先寫好的報告全文拆解為段落（供 PDF 排版共用）
const HEADING_PATTERN = /^(太陽|地球|月亮|月之南北交|水星|金星|火星|木星|土星|天王星|海王星|冥王星)｜.+$/;

export function splitIntoSections(text) {
  const blocks = String(text || '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sections = [];
  for (const block of blocks) {
    const nl = block.indexOf('\n');
    const firstLine = nl === -1 ? block : block.slice(0, nl);
    if (HEADING_PATTERN.test(firstLine.trim())) {
      sections.push({
        heading: firstLine.trim(),
        body: nl === -1 ? '' : block.slice(nl + 1).trim(),
      });
    } else {
      sections.push({ heading: '', body: block });
    }
  }
  return sections;
}
