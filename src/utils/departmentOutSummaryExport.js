/**
 * 出/退库汇总(科室) 导出为带格式的 xlsx（合并标题、边框、合计行红色数字）
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function formatCnDate(ymd) {
  if (!ymd) return '';
  const s = String(ymd).slice(0, 10);
  const parts = s.split('-');
  if (parts.length !== 3) return '';
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return '';
  return `${y}年${m}月${d}日`;
}

const BORDER_THIN = {
  style: 'thin',
  color: { argb: 'FF000000' },
};

function setCellBorder(cell) {
  cell.border = {
    top: BORDER_THIN,
    left: BORDER_THIN,
    bottom: BORDER_THIN,
    right: BORDER_THIN,
  };
}

const FONT_BODY = { name: '宋体', size: 11 };
const FONT_TITLE = { name: '宋体', size: 12 };
const RED_NUM = { name: '宋体', size: 11, color: { argb: 'FFFF0000' } };

function colToLetter(n) {
  let s = '';
  let num = n;
  while (num > 0) {
    const m = (num - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    num = Math.floor((num - 1) / 26);
  }
  return s;
}

/**
 * @param {Object} options
 * @param {string[]} options.warehouseCategoryNames
 * @param {Object[]} options.rows buildDepartmentAgg 后的行（含 catAmt_0、netQty、netAmt）
 * @param {string} [options.beginDate] yyyy-MM-dd
 * @param {string} [options.endDate] yyyy-MM-dd
 * @param {string} options.fileName
 */
export async function exportDepartmentSummaryStyledXlsx(options) {
  const {
    warehouseCategoryNames = [],
    rows = [],
    beginDate = '',
    endDate = '',
    fileName,
  } = options;

  if (!rows.length) {
    return;
  }

  const cats = warehouseCategoryNames;
  const colCount = 2 + cats.length + 2; // 序号、科室、分类…、净出库数量、净出库金额

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('出退库汇总科室', {
    views: [{ showGridLines: false }],
  });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  // 第 1 行：合并标题（富文本：表名加粗，日期不加粗；相对正文加大一号）
  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '出/退库汇总(科室)表' },
      { font: { ...FONT_TITLE, bold: false }, text: (datePart ? ` ${datePart}` : '') },
    ],
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  titleCell.border = {
    top: BORDER_THIN,
    left: BORDER_THIN,
    bottom: BORDER_THIN,
    right: BORDER_THIN,
  };
  ws.getRow(1).height = 26;

  // 第 2 行：表头
  const headers = ['序号', '科室', ...cats, '净出库数量', '净出库金额'];
  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  // 数据行
  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const lineNo = ri + 1;
    const dept = row.departmentName || (row.department && row.department.name) || '未维护科室';

    const c1 = ws.getCell(r, 1);
    c1.value = lineNo;
    c1.font = FONT_BODY;
    c1.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(c1);

    const c2 = ws.getCell(r, 2);
    c2.value = dept;
    c2.font = FONT_BODY;
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(c2);

    cats.forEach((_, ci) => {
      const v = Number(row[`catAmt_${ci}`] || 0);
      const cell = ws.getCell(r, 3 + ci);
      cell.value = v;
      cell.numFmt = '#,##0.00';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      setCellBorder(cell);
    });

    const netQtyCol = 3 + cats.length;
    const netAmtCol = 4 + cats.length;

    const nq = ws.getCell(r, netQtyCol);
    nq.value = Number(row.netQty || 0);
    nq.numFmt = '#,##0.00';
    nq.font = FONT_BODY;
    nq.alignment = { vertical: 'middle', horizontal: 'right' };
    setCellBorder(nq);

    const na = ws.getCell(r, netAmtCol);
    na.value = Number(row.netAmt || 0);
    na.numFmt = '#,##0.00';
    na.font = FONT_BODY;
    na.alignment = { vertical: 'middle', horizontal: 'right' };
    setCellBorder(na);
  });

  // 合计行
  const totalRow = 3 + rows.length;
  const t1 = ws.getCell(totalRow, 1);
  t1.value = '合计';
  t1.font = { ...FONT_BODY, bold: true };
  t1.alignment = { vertical: 'middle', horizontal: 'center' };
  setCellBorder(t1);

  const t2 = ws.getCell(totalRow, 2);
  t2.value = '';
  t2.font = FONT_BODY;
  setCellBorder(t2);

  cats.forEach((_, ci) => {
    const sum = rows.reduce((s, row) => s + Number(row[`catAmt_${ci}`] || 0), 0);
    const cell = ws.getCell(totalRow, 3 + ci);
    cell.value = sum;
    cell.numFmt = '#,##0.00';
    cell.font = RED_NUM;
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    setCellBorder(cell);
  });

  const netQtyCol = 3 + cats.length;
  const netAmtCol = 4 + cats.length;
  const totalNetQty = rows.reduce((s, row) => s + Number(row.netQty || 0), 0);
  const totalNetAmt = rows.reduce((s, row) => s + Number(row.netAmt || 0), 0);

  const tNq = ws.getCell(totalRow, netQtyCol);
  tNq.value = totalNetQty;
  tNq.numFmt = '#,##0.00';
  tNq.font = RED_NUM;
  tNq.alignment = { vertical: 'middle', horizontal: 'right' };
  setCellBorder(tNq);

  const tNa = ws.getCell(totalRow, netAmtCol);
  tNa.value = totalNetAmt;
  tNa.numFmt = '#,##0.00';
  tNa.font = RED_NUM;
  tNa.alignment = { vertical: 'middle', horizontal: 'right' };
  setCellBorder(tNa);

  // 列宽
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 28;
  for (let i = 0; i < cats.length; i++) {
    ws.getColumn(3 + i).width = 16;
  }
  ws.getColumn(netQtyCol).width = 14;
  ws.getColumn(netAmtCol).width = 16;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `出退库汇总(科室)${Date.now()}.xlsx`);
}
