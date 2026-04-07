/**
 * 出/退库汇总(科室)、出/退库汇总(供应商)、出/退库明细/汇总、入/退货明细/汇总 等导出为带格式的 xlsx（合并标题、边框、合计行红色数字）
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
 * @param {string[]} options.warehouseCategoryNames 动态分类列标题（出/退库汇总(科室)固定为 [高值耗材, 低值耗材]，按耗材 isGz 分列）
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

  // 合计行上方空一行（全格细边框，与出/退库汇总(供应商)导出一致）
  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
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

/**
 * 出/退库汇总(供应商)：版式与 {@link exportDepartmentSummaryStyledXlsx} 一致（宋体、标题合并、表头加粗、合计行红色数字）
 * @param {Object} options
 * @param {Object[]} options.rows buildSupplierAgg 后的行（含 outQty、outAmt、retQty、retAmt、netQty、netAmt）
 * @param {string} [options.beginDate] yyyy-MM-dd
 * @param {string} [options.endDate] yyyy-MM-dd
 * @param {string} options.fileName
 */
export async function exportSupplierSummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;

  if (!rows.length) {
    return;
  }

  const colCount = 8;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('出退库汇总供应商', {
    views: [{ showGridLines: false }],
  });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '出/退库汇总(供应商)表' },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  const headers = [
    '序号',
    '供应商',
    '出库数量',
    '出库金额',
    '退库数量',
    '退库金额',
    '净出库数量',
    '净出库金额',
  ];
  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const lineNo = ri + 1;
    const supplier = row.supplierName || (row.supplier && row.supplier.name) || '未维护供应商';

    const c1 = ws.getCell(r, 1);
    c1.value = lineNo;
    c1.font = FONT_BODY;
    c1.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(c1);

    const c2 = ws.getCell(r, 2);
    c2.value = supplier;
    c2.font = FONT_BODY;
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(c2);

    const nums = [
      Number(row.outQty || 0),
      Number(row.outAmt || 0),
      Number(row.retQty || 0),
      Number(row.retAmt || 0),
      Number(row.netQty || 0),
      Number(row.netAmt || 0),
    ];
    nums.forEach((v, i) => {
      const cell = ws.getCell(r, 3 + i);
      cell.value = v;
      cell.numFmt = '#,##0.00';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      setCellBorder(cell);
    });
  });

  // 合计行上方空一行（全格细边框，与表体一致）
  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const t1 = ws.getCell(totalRow, 1);
  t1.value = '合计';
  t1.font = { ...FONT_BODY, bold: true };
  t1.alignment = { vertical: 'middle', horizontal: 'center' };
  setCellBorder(t1);

  const t2 = ws.getCell(totalRow, 2);
  t2.value = '';
  t2.font = FONT_BODY;
  setCellBorder(t2);

  const totalOutQty = rows.reduce((s, row) => s + Number(row.outQty || 0), 0);
  const totalOutAmt = rows.reduce((s, row) => s + Number(row.outAmt || 0), 0);
  const totalRetQty = rows.reduce((s, row) => s + Number(row.retQty || 0), 0);
  const totalRetAmt = rows.reduce((s, row) => s + Number(row.retAmt || 0), 0);
  const totalNetQty = rows.reduce((s, row) => s + Number(row.netQty || 0), 0);
  const totalNetAmt = rows.reduce((s, row) => s + Number(row.netAmt || 0), 0);
  const totals = [totalOutQty, totalOutAmt, totalRetQty, totalRetAmt, totalNetQty, totalNetAmt];
  totals.forEach((v, i) => {
    const cell = ws.getCell(totalRow, 3 + i);
    cell.value = v;
    cell.numFmt = '#,##0.00';
    cell.font = RED_NUM;
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    setCellBorder(cell);
  });

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 28;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 16;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 16;
  ws.getColumn(7).width = 14;
  ws.getColumn(8).width = 16;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `出退库汇总(供应商)${Date.now()}.xlsx`);
}

function fmtYmd(val) {
  if (val == null || val === '') return '';
  const s = String(val);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function mat(row) {
  return row.material || {};
}

/**
 * 出/退库明细表：版式与出/退库汇总(供应商)一致；合计仅汇总数量、金额列
 * @param {Object[]} options.rows listCTKWarehouse 返回行
 * @param {string} [options.beginDate]
 * @param {string} [options.endDate]
 * @param {string} options.fileName
 * @param {function(*): string} [options.resolveWay] 储存方式字典转文案
 */
export async function exportCTKWarehouseDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveWay } = options;
  if (!rows.length) return;

  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '仓库',
    '科室',
    '业务单号',
    '制单日期',
    '制单人',
    '审核日期',
    '审核人',
    '型号',
    '规格',
    '单位',
    '价格',
    '数量',
    '金额',
    '批次',
    '批号',
    '生产日期',
    '有效期',
    '注册证号',
    '包装规格',
    '库房分类',
    '财务分类',
    '生产厂家',
    '储存方式',
    '供应商',
    '备注',
  ];
  const colCount = headers.length;
  /** 1-based 列号：价格、数量、金额 */
  const priceCol = 14;
  const qtyCol = 15;
  const amtCol = 16;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('出退库明细', { views: [{ showGridLines: false }] });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '出/退库明细表' },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const m = mat(row);
    const wc = m.fdWarehouseCategory && m.fdWarehouseCategory.warehouseCategoryName;
    const fc = m.fdFinanceCategory && m.fdFinanceCategory.financeCategoryName;
    const cells = [
      ri + 1,
      row.materialCode || '',
      row.materialName || '',
      row.warehouseName || '',
      row.departmentName || '',
      row.billNo || '',
      fmtYmd(row.createTime),
      row.createrNickName || row.createrUserName || '',
      fmtYmd(row.auditDate),
      row.auditNickName || row.auditUserName || '',
      row.materialModel || '',
      row.materialSpeci || '',
      row.unitName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.materialQty || 0),
      Number(row.materialAmt || 0),
      row.batchNo || '',
      row.batchNumber || '',
      fmtYmd(row.beginDate),
      fmtYmd(row.endDate),
      m.registerNo || '',
      m.packageSpeci || '',
      wc || '',
      fc || '',
      row.factoryName || '',
      resolveWay ? resolveWay(m.isWay) : m.isWay != null && m.isWay !== '' ? String(m.isWay) : '',
      row.supplierName || (row.supplier && row.supplier.name) || '',
      row.remark || m.remark || '',
    ];

    cells.forEach((v, ci) => {
      const cell = ws.getCell(r, ci + 1);
      const col = ci + 1;
      if (col === priceCol || col === qtyCol || col === amtCol) {
        if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
          cell.value = '';
        } else {
          cell.value = Number(v);
          cell.numFmt = '#,##0.00';
        }
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v === null || v === undefined ? '' : v;
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      setCellBorder(cell);
    });
  });

  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const totalQty = rows.reduce((s, row) => s + Number(row.materialQty || 0), 0);
  const totalAmt = rows.reduce((s, row) => s + Number(row.materialAmt || 0), 0);

  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(totalRow, c);
    setCellBorder(cell);
    if (c === 1) {
      cell.value = '合计';
      cell.font = { ...FONT_BODY, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (c === qtyCol) {
      cell.value = totalQty;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (c === amtCol) {
      cell.value = totalAmt;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 16;
  for (let c = 7; c <= colCount; c++) {
    ws.getColumn(c).width = c >= priceCol && c <= amtCol ? 14 : 12;
  }
  ws.getColumn(17).width = 24;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `出退库明细表${Date.now()}.xlsx`);
}

/**
 * 出/退库汇总表（列表汇总）：版式与供应商导出一致；合计仅汇总数量、金额列
 */
export async function exportCTKWarehouseSummaryListStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveWay } = options;
  if (!rows.length) return;

  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '仓库',
    '科室',
    '型号',
    '规格',
    '单位',
    '生产厂家',
    '供应商',
    '价格',
    '数量',
    '金额',
    '注册证号',
    '包装规格',
    '库房分类',
    '财务分类',
    '储存方式',
  ];
  const colCount = headers.length;
  const priceCol = 11;
  const qtyCol = 12;
  const amtCol = 13;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('出退库汇总', { views: [{ showGridLines: false }] });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '出/退库汇总表' },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const m = mat(row);
    const wc = m.fdWarehouseCategory && m.fdWarehouseCategory.warehouseCategoryName;
    const fc = m.fdFinanceCategory && m.fdFinanceCategory.financeCategoryName;
    const cells = [
      ri + 1,
      row.materialCode || '',
      row.materialName || '',
      row.warehouseName || '',
      row.departmentName || '',
      row.materialModel || '',
      row.materialSpeci || '',
      row.unitName || '',
      row.factoryName || '',
      row.supplierName || (row.supplier && row.supplier.name) || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.materialQty || 0),
      Number(row.materialAmt || 0),
      m.registerNo || '',
      m.packageSpeci || '',
      wc || '',
      fc || '',
      resolveWay ? resolveWay(m.isWay) : m.isWay != null && m.isWay !== '' ? String(m.isWay) : '',
    ];

    cells.forEach((v, ci) => {
      const cell = ws.getCell(r, ci + 1);
      const col = ci + 1;
      if (col === priceCol || col === qtyCol || col === amtCol) {
        if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
          cell.value = '';
        } else {
          cell.value = Number(v);
          cell.numFmt = '#,##0.00';
        }
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v === null || v === undefined ? '' : v;
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      setCellBorder(cell);
    });
  });

  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const totalQty = rows.reduce((s, row) => s + Number(row.materialQty || 0), 0);
  const totalAmt = rows.reduce((s, row) => s + Number(row.materialAmt || 0), 0);

  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(totalRow, c);
    setCellBorder(cell);
    if (c === 1) {
      cell.value = '合计';
      cell.font = { ...FONT_BODY, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (c === qtyCol) {
      cell.value = totalQty;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (c === amtCol) {
      cell.value = totalAmt;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 12;
  ws.getColumn(5).width = 14;
  ws.getColumn(10).width = 20;
  for (let c = 6; c <= colCount; c++) {
    if (c === priceCol || c === qtyCol || c === amtCol) ws.getColumn(c).width = 14;
    else ws.getColumn(c).width = 12;
  }
  ws.getColumn(13).width = 16;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `出退库汇总表${Date.now()}.xlsx`);
}

function rthBillingLabel(row) {
  const m = row.material;
  if (!m) return '';
  const v = m.isBilling;
  if (v === '1' || v === 1) return '是';
  if (v === '0' || v === 0 || v === '2') return '否';
  return '';
}

/**
 * 入/退货明细表：版式与出/退库汇总(供应商)一致（列顺序与页面 columns 配置一致）
 */
export async function exportRTHWarehouseDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveWay } = options;
  if (!rows.length) return;

  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '仓库',
    '供应商',
    '业务单号',
    '业务日期',
    '型号',
    '规格',
    '单位',
    '生产厂家',
    '价格',
    '数量',
    '金额',
    '批次',
    '批号',
    '生产日期',
    '有效期',
    '注册证号',
    '包装规格',
    '库房分类',
    '财务分类',
    '储存方式',
    '计费',
    '备注',
  ];
  const colCount = headers.length;
  const priceCol = 12;
  const qtyCol = 13;
  const amtCol = 14;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('入退货明细', { views: [{ showGridLines: false }] });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '入/退货明细表' },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const m = mat(row);
    const wc = m.fdWarehouseCategory && m.fdWarehouseCategory.warehouseCategoryName;
    const fc = m.fdFinanceCategory && m.fdFinanceCategory.financeCategoryName;
    const cells = [
      ri + 1,
      row.materialCode || '',
      row.materialName || '',
      row.warehouseName || '',
      row.supplierName || (row.supplier && row.supplier.name) || '',
      row.billNo || '',
      fmtYmd(row.billDate),
      row.materialModel || '',
      row.materialSpeci || '',
      row.unitName || '',
      row.factoryName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.materialQty || 0),
      Number(row.materialAmt || 0),
      row.batchNo || '',
      row.batchNumber || '',
      fmtYmd(row.beginDate),
      fmtYmd(row.endDate),
      m.registerNo || '',
      m.packageSpeci || '',
      wc || '',
      fc || '',
      resolveWay ? resolveWay(m.isWay) : m.isWay != null && m.isWay !== '' ? String(m.isWay) : '',
      rthBillingLabel(row),
      row.remark || m.remark || '',
    ];

    cells.forEach((v, ci) => {
      const cell = ws.getCell(r, ci + 1);
      const col = ci + 1;
      if (col === priceCol || col === qtyCol || col === amtCol) {
        if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
          cell.value = '';
        } else {
          cell.value = Number(v);
          cell.numFmt = '#,##0.00';
        }
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v === null || v === undefined ? '' : v;
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      setCellBorder(cell);
    });
  });

  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const totalQty = rows.reduce((s, row) => s + Number(row.materialQty || 0), 0);
  const totalAmt = rows.reduce((s, row) => s + Number(row.materialAmt || 0), 0);

  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(totalRow, c);
    setCellBorder(cell);
    if (c === 1) {
      cell.value = '合计';
      cell.font = { ...FONT_BODY, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (c === qtyCol) {
      cell.value = totalQty;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (c === amtCol) {
      cell.value = totalAmt;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  ws.getColumn(1).width = 8;
  for (let c = 2; c <= colCount; c++) {
    if (c === priceCol || c === qtyCol || c === amtCol) ws.getColumn(c).width = 14;
    else if (c === 3) ws.getColumn(c).width = 18;
    else if (c === 5 || c === 10) ws.getColumn(c).width = 16;
    else if (c === 14) ws.getColumn(c).width = 22;
    else ws.getColumn(c).width = 12;
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `入退货明细表${Date.now()}.xlsx`);
}

/**
 * 入/退货汇总表：版式与出/退库汇总(供应商)一致
 */
export async function exportRTHSummaryListStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveWay } = options;
  if (!rows.length) return;

  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '仓库',
    '供应商',
    '型号',
    '规格',
    '单位',
    '生产厂家',
    '单价',
    '数量',
    '金额',
    '注册证号',
    '包装规格',
    '库房分类',
    '财务分类',
    '储存方式',
  ];
  const colCount = headers.length;
  const priceCol = 10;
  const qtyCol = 11;
  const amtCol = 12;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('入退货汇总', { views: [{ showGridLines: false }] });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: '入/退货汇总表' },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const m = mat(row);
    const wc = m.fdWarehouseCategory && m.fdWarehouseCategory.warehouseCategoryName;
    const fc = m.fdFinanceCategory && m.fdFinanceCategory.financeCategoryName;
    const cells = [
      ri + 1,
      row.materialCode || '',
      row.materialName || '',
      row.warehouseName || '',
      row.supplierName || (row.supplier && row.supplier.name) || '',
      row.materialModel || '',
      row.materialSpeci || '',
      row.unitName || '',
      row.factoryName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.materialQty || 0),
      Number(row.materialAmt || 0),
      m.registerNo || '',
      m.packageSpeci || '',
      wc || '',
      fc || '',
      resolveWay ? resolveWay(m.isWay) : m.isWay != null && m.isWay !== '' ? String(m.isWay) : '',
    ];

    cells.forEach((v, ci) => {
      const cell = ws.getCell(r, ci + 1);
      const col = ci + 1;
      if (col === priceCol || col === qtyCol || col === amtCol) {
        if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
          cell.value = '';
        } else {
          cell.value = Number(v);
          cell.numFmt = '#,##0.00';
        }
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v === null || v === undefined ? '' : v;
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      setCellBorder(cell);
    });
  });

  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const totalQty = rows.reduce((s, row) => s + Number(row.materialQty || 0), 0);
  const totalAmt = rows.reduce((s, row) => s + Number(row.materialAmt || 0), 0);

  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(totalRow, c);
    setCellBorder(cell);
    if (c === 1) {
      cell.value = '合计';
      cell.font = { ...FONT_BODY, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (c === qtyCol) {
      cell.value = totalQty;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (c === amtCol) {
      cell.value = totalAmt;
      cell.numFmt = '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 18;
  ws.getColumn(5).width = 18;
  for (let c = 4; c <= colCount; c++) {
    if (c === priceCol || c === qtyCol || c === amtCol) ws.getColumn(c).width = 14;
    else if (c !== 5) ws.getColumn(c).width = 12;
  }
  ws.getColumn(12).width = 16;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `入退货汇总表${Date.now()}.xlsx`);
}

// ---------- 库存查询（明细/汇总/进销存/预警）：版式与出/退库汇总(供应商)、出退库明细表一致 ----------

function inventoryBillingLabel(mat) {
  if (!mat) return '--';
  const v = mat.isBilling;
  if (v === '1' || v === 1 || v === true || v === 'true') return '是';
  if (v === '0' || v === 0 || v === '2' || v === false || v === 'false') return '否';
  return '--';
}

function inventoryCreaterName(row) {
  if (row.createrName) return row.createrName;
  if (row.creater && row.creater.nickName) return row.creater.nickName;
  if (row.creater && row.creater.userName) return row.creater.userName;
  if (row.createBy) return row.createBy;
  return '--';
}

function inventoryAuditName(row) {
  if (row.auditPersonName) return row.auditPersonName;
  if (row.auditPerson && row.auditPerson.nickName) return row.auditPerson.nickName;
  if (row.auditPerson && row.auditPerson.userName) return row.auditPerson.userName;
  if (row.auditBy) return row.auditBy;
  return '--';
}

function psiRowUnitPrice(row) {
  if (row.price != null && row.price !== '' && Number(row.price) !== 0) return Number(row.price);
  if (row.unitPrice != null && row.unitPrice !== '' && Number(row.unitPrice) !== 0) return Number(row.unitPrice);
  if (row.materialAmt != null && row.materialQty != null && Number(row.materialQty) !== 0) {
    return Number(row.materialAmt) / Number(row.materialQty);
  }
  return null;
}

/**
 * 库存类查询表通用导出：合并标题、宋体、表头加粗、细边框、数据与合计间空一行、合计指定列为红色数字
 * @param {Object} options
 * @param {string} options.sheetName
 * @param {string} options.titleBoldText 标题中加粗部分（如「库存明细查询表」）
 * @param {string} [options.beginDate]
 * @param {string} [options.endDate]
 * @param {string[]} options.headers
 * @param {Object[]} options.rows
 * @param {function(*, number): any[]} options.buildCells
 * @param {number[]} options.numericCols1Based
 * @param {Object<number, function(*): number>} options.sumExtractors 列号(1-based) -> 从行取可汇总数值
 * @param {Object<number, string>} [options.numericNumFmt] 可选，未指定列默认 #,##0.00
 * @param {number[]|null} [options.columnWidths] 与列数相同；不传则按列序给默认宽度
 * @param {string} options.fileName
 */
export async function exportInventoryQueryStyledXlsx(options) {
  const {
    sheetName = 'Sheet1',
    titleBoldText,
    beginDate = '',
    endDate = '',
    headers,
    rows = [],
    buildCells,
    numericCols1Based = [],
    sumExtractors = {},
    numericNumFmt = {},
    columnWidths = null,
    fileName,
  } = options;

  if (!rows.length || !headers || !headers.length || typeof buildCells !== 'function') {
    return;
  }

  const colCount = headers.length;
  const numericSet = new Set(numericCols1Based);
  const sumCols = Object.keys(sumExtractors).map(k => Number(k));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName, { views: [{ showGridLines: false }] });

  const d1 = formatCnDate(beginDate);
  const d2 = formatCnDate(endDate || beginDate);
  const datePart = d1 && d2 ? `（${d1}至${d2}）` : '';

  ws.mergeCells(`A1:${colToLetter(colCount)}1`);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = {
    richText: [
      { font: { ...FONT_TITLE, bold: true }, text: titleBoldText },
      { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' },
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

  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  rows.forEach((row, ri) => {
    const r = 3 + ri;
    const cells = buildCells(row, ri);
    if (!cells || cells.length !== colCount) {
      throw new Error(`exportInventoryQueryStyledXlsx: buildCells 应返回长度 ${colCount} 的数组`);
    }
    cells[0] = ri + 1;

    cells.forEach((v, ci) => {
      const col = ci + 1;
      const cell = ws.getCell(r, col);
      if (numericSet.has(col)) {
        if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
          cell.value = '';
        } else {
          cell.value = Number(v);
          cell.numFmt = numericNumFmt[col] || '#,##0.00';
        }
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.value = v == null || v === undefined ? '' : v;
        cell.font = FONT_BODY;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
      setCellBorder(cell);
    });
  });

  const blankRow = 3 + rows.length;
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(blankRow, c);
    cell.value = '';
    cell.font = FONT_BODY;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  }

  const totalRow = blankRow + 1;
  const sums = {};
  sumCols.forEach((col) => {
    const fn = sumExtractors[col];
    if (typeof fn === 'function') {
      sums[col] = rows.reduce((s, row) => s + Number(fn(row) || 0), 0);
    }
  });

  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(totalRow, c);
    setCellBorder(cell);
    if (c === 1) {
      cell.value = '合计';
      cell.font = { ...FONT_BODY, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (sums[c] != null) {
      cell.value = sums[c];
      cell.numFmt = numericNumFmt[c] || '#,##0.00';
      cell.font = RED_NUM;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else {
      cell.value = '';
      cell.font = FONT_BODY;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  if (Array.isArray(columnWidths) && columnWidths.length === colCount) {
    for (let c = 1; c <= colCount; c++) {
      ws.getColumn(c).width = columnWidths[c - 1];
    }
  } else {
    for (let c = 1; c <= colCount; c++) {
      if (c === 1) ws.getColumn(c).width = 8;
      else if (c === 2) ws.getColumn(c).width = 14;
      else if (c === 3) ws.getColumn(c).width = 18;
      else if (numericSet.has(c)) ws.getColumn(c).width = 14;
      else ws.getColumn(c).width = 12;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName || `${titleBoldText}${Date.now()}.xlsx`);
}

/** 库存明细查询 */
export async function exportWarehouseInventoryDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '生产厂家',
    '仓库',
    '供应商',
    '单价',
    '单位',
    '库存数量',
    '金额',
    '入库批次号',
    '生产批号',
    '耗材批次号',
    '主条码',
    '辅条码',
    '生产日期',
    '有效期',
    '注册证号',
    '注册证有效期',
    '计费',
    '入库单号',
    '制单日期',
    '制单人',
    '审核日期',
    '审核人',
  ];
  const numericCols = [9, 11, 12];
  return exportInventoryQueryStyledXlsx({
    sheetName: '库存明细查询',
    titleBoldText: '库存明细查询表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      11: (row) => Number(row.qty || 0),
      12: (row) => Number(row.amt || 0),
    },
    buildCells: (row) => {
      const m = row.material || {};
      const unitName =
        (m.fdUnit && m.fdUnit.unitName) ||
        (m.unit && (m.unit.unitName || m.unit.name)) ||
        m.unitName ||
        '';
      return [
        0,
        m.code || '',
        m.name || '',
        m.speci || '',
        m.model || '',
        (m.fdFactory && m.fdFactory.factoryName) || '',
        (row.warehouse && row.warehouse.name) || '',
        (row.supplier && row.supplier.name) || '',
        row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
        unitName || '',
        Number(row.qty || 0),
        Number(row.amt || 0),
        row.batchNo || '',
        row.batchNumber || '',
        row.materialNo || '',
        row.mainBarcode || '',
        row.subBarcode || '',
        fmtYmd(row.beginTime),
        fmtYmd(row.endTime),
        m.registerNo || '',
        m.periodDate ? fmtYmd(m.periodDate) : '',
        inventoryBillingLabel(m),
        row.receiptOrderNo || '',
        fmtYmd(row.createTime || row.materialDate),
        inventoryCreaterName(row),
        fmtYmd(row.auditDate || row.warehouseDate),
        inventoryAuditName(row),
      ];
    },
    fileName,
  });
}

/** 库存汇总查询 */
export async function exportWarehouseInventorySummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '单价',
    '数量',
    '金额',
    '计费',
    '注册证号',
    '注册证有效期',
    '仓库',
    '厂家',
    '供应商',
  ];
  const numericCols = [7, 8, 9];
  return exportInventoryQueryStyledXlsx({
    sheetName: '库存汇总查询',
    titleBoldText: '库存汇总查询表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      8: (row) => Number(row.materialQty || 0),
      9: (row) => Number(row.materialAmt || 0),
    },
    buildCells: (row) => {
      let billing = '--';
      const ib = row.isBilling;
      if (ib === '1' || ib === 1 || ib === 'true') billing = '是';
      else if (ib === '0' || ib === 0 || ib === '2' || ib === 'false') billing = '否';
      return [
        0,
        row.materialCode || '',
        row.materialName || '',
        row.materialSpeci || '',
        row.materialModel || '',
        row.unitName || '',
        row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
        Number(row.materialQty || 0),
        Number(row.materialAmt || 0),
        billing,
        row.registerNo || '',
        row.periodDate ? fmtYmd(row.periodDate) : '',
        row.warehouseName || '',
        row.factoryName || '',
        row.supplierName || '',
      ];
    },
    fileName,
  });
}

/** 进销存明细表 */
export async function exportWarehousePsiDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveBillType } = options;
  const resType = typeof resolveBillType === 'function' ? resolveBillType : () => '';
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '仓库',
    '类型',
    '业务单号',
    '业务日期',
    '规格',
    '型号',
    '单位',
    '单价',
    '数量',
    '金额',
    '厂家',
    '供应商',
    '科室',
  ];
  const numericCols = [11, 12, 13];
  return exportInventoryQueryStyledXlsx({
    sheetName: '进销存明细',
    titleBoldText: '进销存明细表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      12: (row) => Number(row.materialQty || 0),
      13: (row) => Number(row.materialAmt || 0),
    },
    buildCells: (row) => {
      const p = psiRowUnitPrice(row);
      return [
        0,
        row.materialCode || '',
        row.materialName || '',
        row.warehouseName || '',
        resType(row.billType),
        row.billNo || '',
        fmtYmd(row.billDate),
        row.materialSpeci || '',
        row.materialModel || '',
        row.unitName || '',
        p,
        Number(row.materialQty || 0),
        Number(row.materialAmt || 0),
        row.factoryName || '',
        row.supplierName || '',
        row.departmentName || '',
      ];
    },
    fileName,
  });
}

/** 库存预警 */
export async function exportInventoryAlertStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '仓库',
    '当前库存',
    '安全库存',
    '预警状态',
    '生产厂家',
  ];
  const numericCols = [8, 9];
  return exportInventoryQueryStyledXlsx({
    sheetName: '库存预警',
    titleBoldText: '库存预警表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      8: (row) => Number(row.currentQty || 0),
    },
    buildCells: (row) => {
      const st = row.alertStatus === 1 || row.alertStatus === '1' ? '预警' : '正常';
      return [
        0,
        row.materialCode || '',
        row.materialName || '',
        row.materialSpeci || '',
        row.materialModel || '',
        row.unitName || '',
        row.warehouseName || '',
        Number(row.currentQty || 0),
        Number(row.safetyStock || 0),
        st,
        row.factoryName || '',
      ];
    },
    fileName,
  });
}

/** 有效期预警表 */
export async function exportExpiryAlertStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '单价',
    '仓库',
    '批号',
    '生产日期',
    '有效期',
    '剩余天数',
    '库存数量',
    '生产厂家',
    '供应商',
  ];
  const numericCols = [7, 12, 13];
  return exportInventoryQueryStyledXlsx({
    sheetName: '有效期预警',
    titleBoldText: '有效期预警表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    numericNumFmt: {
      12: '0',
    },
    sumExtractors: {
      13: (row) => Number(row.qty || 0),
    },
    buildCells: (row) => [
      0,
      row.materialCode || '',
      row.materialName || '',
      row.materialSpeci || '',
      row.materialModel || '',
      row.unitName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      row.warehouseName || '',
      row.batchNo || '',
      fmtYmd(row.produceDate),
      fmtYmd(row.expiryDate),
      row.daysRemaining != null && row.daysRemaining !== '' ? Number(row.daysRemaining) : null,
      Number(row.qty || 0),
      row.factoryName || '',
      row.supplierName || '',
    ],
    fileName,
  });
}

/** 盈亏明细表 */
export async function exportProfitLossEntryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '盈亏单号',
    '盘点单号',
    '仓库',
    '耗材编码',
    '耗材名称',
    '规格',
    '单位',
    '批次号',
    '当前库存',
    '盘点库存',
    '盈亏数量',
    '单价',
    '盈亏金额',
    '制单日期',
    '制单人',
    '审核日期',
    '审核人',
  ];
  const numericCols = [10, 11, 12, 13, 14];
  return exportInventoryQueryStyledXlsx({
    sheetName: '盈亏明细',
    titleBoldText: '盈亏明细表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      12: (row) => Number(row.profitQty || 0),
      14: (row) => Number(row.profitAmount || 0),
    },
    buildCells: (row) => [
      0,
      row.billNo || '',
      row.stocktakingNo || '',
      row.warehouseName || '',
      row.materialCode || '',
      row.materialName || '',
      row.materialSpeci || '',
      row.unitName || '',
      row.batchNo || '',
      Number(row.bookQty || 0),
      Number(row.stockQty || 0),
      Number(row.profitQty || 0),
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.profitAmount || 0),
      fmtYmd(row.createTime),
      row.createrName || row.createBy || '',
      fmtYmd(row.auditDate),
      row.auditBy || '',
    ],
    fileName,
  });
}

/** 盈亏明细汇总表 */
export async function exportProfitLossEntrySummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '单价',
    '盈亏数量',
    '盈亏金额',
    '仓库',
  ];
  const numericCols = [7, 8, 9];
  return exportInventoryQueryStyledXlsx({
    sheetName: '盈亏明细汇总',
    titleBoldText: '盈亏明细汇总表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      8: (row) => Number(row.profitQty || 0),
      9: (row) => Number(row.profitAmount || 0),
    },
    buildCells: (row) => [
      0,
      row.materialCode || '',
      row.materialName || '',
      row.materialSpeci || '',
      row.materialModel || '',
      row.unitName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.profitQty || 0),
      Number(row.profitAmount || 0),
      row.warehouseName || '',
    ],
    fileName,
  });
}

function dictLabel(value, resolve) {
  if (typeof resolve === 'function') return resolve(value);
  return value != null && value !== '' ? String(value) : '';
}

/** 采购计划明细表（行结构同报表 processPlanData） */
export async function exportPurchasePlanDetailReportStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolvePlanStatus } = options;
  const headers = [
    '序号',
    '计划单号',
    '耗材编码',
    '耗材名称',
    '规格',
    '单位',
    '供应商',
    '仓库',
    '数量',
    '单价',
    '金额',
    '制单日期',
    '制单人',
    '计划状态',
  ];
  const numericCols = [9, 10, 11];
  return exportInventoryQueryStyledXlsx({
    sheetName: '采购计划明细',
    titleBoldText: '采购计划明细表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.qty || 0),
      11: (row) => Number(row.amt || 0),
    },
    buildCells: (row) => [
      0,
      row.planNo || '',
      row.materialCode || '',
      row.materialName || '',
      row.materialSpec || '',
      row.materialUnit || '',
      row.supplierName || '',
      row.warehouseName || '',
      Number(row.qty || 0),
      row.price != null && row.price !== '' ? Number(row.price) : null,
      Number(row.amt || 0),
      fmtYmd(row.createTime),
      row.createBy || '',
      dictLabel(row.planStatus, resolvePlanStatus),
    ],
    fileName,
  });
}

/** 采购计划汇总表 */
export async function exportPurchasePlanSummaryReportStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '单位',
    '供应商',
    '仓库',
    '单价',
    '数量',
    '金额',
  ];
  const numericCols = [8, 9, 10];
  return exportInventoryQueryStyledXlsx({
    sheetName: '采购计划汇总',
    titleBoldText: '采购计划汇总表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.totalQty || 0),
      10: (row) => Number(row.totalAmt || 0),
    },
    buildCells: (row) => [
      0,
      row.materialCode || '',
      row.materialName || '',
      row.materialSpec || '',
      row.materialUnit || '',
      row.supplierName || '',
      row.warehouseName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.totalQty || 0),
      Number(row.totalAmt || 0),
    ],
    fileName,
  });
}

/** 采购订单明细表 */
export async function exportPurchaseOrderDetailReportStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveOrderStatus } = options;
  const headers = [
    '序号',
    '订单单号',
    '计划单号',
    '耗材编码',
    '耗材名称',
    '规格',
    '单位',
    '供应商',
    '仓库',
    '数量',
    '单价',
    '金额',
    '订单日期',
    '订单状态',
  ];
  const numericCols = [10, 11, 12];
  return exportInventoryQueryStyledXlsx({
    sheetName: '采购订单明细',
    titleBoldText: '采购订单明细表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      10: (row) => Number(row.orderQty || 0),
      12: (row) => Number(row.totalAmount || 0),
    },
    buildCells: (row) => [
      0,
      row.orderNo || '',
      row.planNo || '',
      row.materialCode || '',
      row.materialName || '',
      row.materialSpec || '',
      row.materialUnit || '',
      row.supplierName || '',
      row.warehouseName || '',
      Number(row.orderQty || 0),
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.totalAmount || 0),
      fmtYmd(row.orderDate),
      dictLabel(row.orderStatus, resolveOrderStatus),
    ],
    fileName,
  });
}

/** 采购订单汇总表 */
export async function exportPurchaseOrderSummaryReportStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '单位',
    '供应商',
    '仓库',
    '单价',
    '数量',
    '金额',
  ];
  const numericCols = [8, 9, 10];
  return exportInventoryQueryStyledXlsx({
    sheetName: '采购订单汇总',
    titleBoldText: '采购订单汇总表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.totalQty || 0),
      10: (row) => Number(row.totalAmt || 0),
    },
    buildCells: (row) => [
      0,
      row.materialCode || '',
      row.materialName || '',
      row.materialSpec || '',
      row.materialUnit || '',
      row.supplierName || '',
      row.warehouseName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.totalQty || 0),
      Number(row.totalAmt || 0),
    ],
    fileName,
  });
}

function depInventoryUnitPrice(row) {
  if (row.unitPrice !== null && row.unitPrice !== undefined && row.unitPrice !== '') {
    return Number(row.unitPrice);
  }
  if (row.amt != null && row.amt !== undefined && row.qty) {
    return Number(row.amt) / Number(row.qty);
  }
  return null;
}

function depInventoryFactoryName(row) {
  if (!row) return '--';
  if (row.fdFactory && row.fdFactory.factoryName) return row.fdFactory.factoryName;
  const m = row.material;
  if (m && m.fdFactory && m.fdFactory.factoryName) return m.fdFactory.factoryName;
  return '--';
}

function depInventoryReceiptStatus(v) {
  if (v === 1) return '已确认';
  if (v === 0) return '未确认';
  return '--';
}

/** 科室库存查询 — 库存明细 */
export async function exportDepInventoryDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材',
    '科室',
    '归属仓库',
    '规格',
    '型号',
    '单位',
    '单价',
    '数量',
    '金额',
    '生产批号',
    '耗材批次号',
    '生产日期',
    '有效期',
    '批次号',
    '库房分类',
    '财务分类',
    '计费',
    '注册证号',
    '生产厂家',
    '供应商',
    '主条码',
    '辅条码',
    '出库日期',
    '出库单号',
    '收货确认状态',
  ];
  const numericCols = [9, 10, 11];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室库存明细',
    titleBoldText: '科室库存明细查询表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      10: (row) => Number(row.qty || 0),
      11: (row) => Number(row.amt || 0),
    },
    buildCells: (row) => {
      const m = row.material || {};
      const wc = m.fdWarehouseCategory && m.fdWarehouseCategory.warehouseCategoryName;
      const fc = m.fdFinanceCategory && m.fdFinanceCategory.financeCategoryName;
      const sup =
        (row.supplier && row.supplier.name) || (m.supplier && m.supplier.name) || '';
      return [
        0,
        m.code || '',
        m.name || '',
        (row.department && row.department.name) || '',
        (row.warehouse && row.warehouse.name) || '',
        m.speci || '',
        m.model || '',
        (m.fdUnit && m.fdUnit.unitName) || '',
        depInventoryUnitPrice(row),
        Number(row.qty || 0),
        Number(row.amt || 0),
        row.batchNumber || '',
        row.materialNo || '',
        fmtYmd(row.beginDate),
        fmtYmd(row.endDate),
        row.batchNo || '',
        wc || '',
        fc || '',
        inventoryBillingLabel(m),
        m.registerNo || '',
        depInventoryFactoryName(row),
        sup,
        row.mainBarcode || '',
        row.subBarcode || '',
        fmtYmd(row.materialDate),
        row.outOrderNo || '',
        depInventoryReceiptStatus(row.receiptConfirmStatus),
      ];
    },
    fileName,
  });
}

/** 科室库存查询 — 库存汇总 */
export async function exportDepInventorySummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '科室',
    '单价',
    '库存数量',
    '库存金额',
    '生产厂家',
    '供应商',
    '计费',
    '注册证号',
    '注册证有效期',
  ];
  const numericCols = [8, 9, 10];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室库存汇总',
    titleBoldText: '科室库存汇总查询表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.totalQty || 0),
      10: (row) => Number(row.totalAmount || 0),
    },
    buildCells: (row) => {
      let billing = '--';
      const ib = row.isBilling;
      if (ib === '1' || ib === 1 || ib === 'true') billing = '是';
      else if (ib === '0' || ib === 0 || ib === '2' || ib === 'false') billing = '否';
      return [
        0,
        row.materialCode || '',
        row.materialName || '',
        row.specification || '',
        row.model || '',
        row.unit || '',
        row.departmentName || '',
        row.avgUnitPrice != null && row.avgUnitPrice !== '' ? Number(row.avgUnitPrice) : null,
        Number(row.totalQty || 0),
        Number(row.totalAmount || 0),
        row.factoryName || '',
        row.supplierName || '',
        billing,
        row.registerNo || '',
        row.periodDate ? fmtYmd(row.periodDate) : '',
      ];
    },
    fileName,
  });
}

/** 科室进销存明细查询 */
export async function exportDepartmentInOutDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName, resolveBillType } = options;
  const resBill = typeof resolveBillType === 'function' ? resolveBillType : () => '';
  const headers = [
    '序号',
    '单据编号',
    '单据类型',
    '制单日期',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '科室',
    '仓库',
    '单价',
    '数量',
    '金额',
    '批次号',
    '操作人',
    '备注',
  ];
  const numericCols = [11, 12, 13];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室进销存明细',
    titleBoldText: '科室进销存明细查询表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      12: (row) => Number(row.qty || 0),
      13: (row) => Number(row.amount || 0),
    },
    buildCells: (row) => [
      0,
      row.billNo || '',
      dictLabel(row.billType, resBill),
      fmtYmd(row.billDate),
      row.materialCode || '',
      row.materialName || '',
      row.specification || '',
      row.model || '',
      row.departmentName || '',
      row.warehouseName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.qty || 0),
      Number(row.amount || 0),
      row.batchNo || '',
      row.createBy || '',
      row.remark || '',
    ],
    fileName,
  });
}

/** 科室领用 — 领用明细表 */
export async function exportConsumeDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '出库单号',
    '仓库',
    '科室',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '数量',
    '单价',
    '金额',
    '批次号',
    '批号',
    '生产日期',
    '有效期',
    '制单人',
    '制单日期',
    '审核人',
    '审核日期',
    '厂家',
    '供应商',
  ];
  const numericCols = [10, 11, 12];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室领用明细',
    titleBoldText: '科室领用明细表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      10: (row) => Number(row.qty || 0),
      12: (row) => Number(row.amt || 0),
    },
    buildCells: (row) => [
      0,
      row.billNo || '',
      row.warehouseName || '',
      row.departmentName || '',
      row.materialCode || '',
      row.materialName || '',
      row.materialSpeci || '',
      row.materialModel || '',
      row.unitName || '',
      Number(row.qty || 0),
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.amt || 0),
      row.batchNo || '',
      row.batchNumber || '',
      fmtYmd(row.beginTime),
      fmtYmd(row.endTime),
      row.createrName || row.createrNickName || '',
      fmtYmd(row.billDate),
      row.auditPersonName || row.auditNickName || '',
      fmtYmd(row.auditDate),
      row.factoryName || '',
      row.supplierName || '',
    ],
    fileName,
  });
}

/** 科室领用 — 领用汇总表 */
export async function exportConsumeSummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '科室',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '单价',
    '数量',
    '金额',
    '计费',
    '注册证号',
    '注册证有效期',
    '仓库',
    '厂家',
    '供应商',
  ];
  const numericCols = [8, 9, 10];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室领用汇总',
    titleBoldText: '科室领用汇总表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.totalQty || 0),
      10: (row) => Number(row.totalAmt || 0),
    },
    buildCells: (row) => {
      let billing = '--';
      const ib = row.isBilling;
      if (ib === '1' || ib === 1 || ib === 'true') billing = '是';
      else if (ib === '0' || ib === 0 || ib === '2' || ib === 'false') billing = '否';
      return [
        0,
        row.departmentName || '',
        row.materialCode || '',
        row.materialName || '',
        row.materialSpeci || '',
        row.materialModel || '',
        row.unitName || '',
        row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
        Number(row.totalQty || 0),
        Number(row.totalAmt || 0),
        billing,
        row.registerNo || '',
        row.periodDate ? fmtYmd(row.periodDate) : '',
        row.warehouseName || '',
        row.factoryName || '',
        row.supplierName || '',
      ];
    },
    fileName,
  });
}

/** 科室领用 — 领用排名 */
export async function exportConsumeRankingStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '排名',
    '耗材编码',
    '耗材名称',
    '规格',
    '型号',
    '单位',
    '单价',
    '总数量',
    '总金额',
    '占比',
    '生产厂家/供应商',
  ];
  const numericCols = [7, 8, 9];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室领用排名',
    titleBoldText: '科室领用排名表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      8: (row) => Number(row.totalQty || 0),
      9: (row) => Number(row.totalAmt || 0),
    },
    buildCells: (row) => [
      0,
      row.materialCode || '',
      row.materialName || '',
      row.materialSpeci || '',
      row.materialModel || '',
      row.unitName || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.totalQty || 0),
      Number(row.totalAmt || 0),
      row.percentage != null && row.percentage !== '' ? `${row.percentage}%` : '',
      row.factoryName || row.supplierName
        ? `${row.factoryName || '--'}/${row.supplierName || '--'}`
        : '',
    ],
    fileName,
  });
}

function formatConsumptionUsageRatePct(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return `${n.toFixed(2)}%`;
}

/** 科室消耗明细报表 */
export async function exportDepartmentConsumptionDetailStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '单号',
    '科室',
    '名称',
    '规格',
    '型号',
    '单价',
    '数量',
    '金额',
    '耗材分类',
    '财务分类',
    '注册证号',
    '医保编码',
    'HIS收费项目编码',
  ];
  const numericCols = [8, 9, 10];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室消耗明细',
    titleBoldText: '科室消耗明细报表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      9: (row) => Number(row.quantity || 0),
      10: (row) => Number(row.amount || 0),
    },
    buildCells: (row) => [
      0,
      row.billNo || '',
      row.departmentName || '',
      row.materialName || '',
      row.specification || '',
      row.model || '',
      row.unitPrice != null && row.unitPrice !== '' ? Number(row.unitPrice) : null,
      Number(row.quantity || 0),
      Number(row.amount || 0),
      row.category || '',
      row.financialCategory || '',
      row.registrationNumber || '',
      row.medicalInsuranceCode || '',
      row.hisChargeItemCode || '',
    ],
    fileName,
  });
}

/** 科室消耗汇总报表 */
export async function exportDepartmentConsumptionSummaryStyledXlsx(options) {
  const { rows = [], beginDate = '', endDate = '', fileName } = options;
  const headers = [
    '序号',
    '科室',
    '名称',
    '规格',
    '型号',
    '单位',
    '消耗数量',
    '消耗金额',
    '平均单价',
    '使用率(%)',
    '耗材分类',
  ];
  const numericCols = [7, 8, 9];
  return exportInventoryQueryStyledXlsx({
    sheetName: '科室消耗汇总',
    titleBoldText: '科室消耗汇总报表',
    beginDate,
    endDate,
    headers,
    rows,
    numericCols1Based: numericCols,
    sumExtractors: {
      7: (row) => Number(row.totalQuantity || 0),
      8: (row) => Number(row.totalAmount || 0),
    },
    buildCells: (row) => [
      0,
      row.departmentName || '',
      row.materialName || '',
      row.specification || '',
      row.model || '',
      row.unit || '',
      Number(row.totalQuantity || 0),
      Number(row.totalAmount || 0),
      row.averagePrice != null && row.averagePrice !== '' ? Number(row.averagePrice) : null,
      formatConsumptionUsageRatePct(row.usageRate),
      row.category || '',
    ],
    fileName,
  });
}
