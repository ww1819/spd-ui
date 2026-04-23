/**
 * 财务结算汇总表 xlsx（与「财务汇总表」版式一致：标题合并、分类列纵向合并、△合计、底部制表栏）
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
const FONT_TITLE = { name: '宋体', size: 12, bold: true };

/**
 * @param {Object} options
 * @param {string} [options.beginDate] yyyy-MM-dd
 * @param {string} [options.endDate] yyyy-MM-dd
 * @param {{ supplierName: string, wholesaleAmt: number }[]} options.materialSuppliers
 * @param {number|string} options.materialWholesaleTotal
 * @param {{ supplierName: string, wholesaleAmt: number }[]} options.reagentSuppliers
 * @param {number|string} options.reagentWholesaleTotal
 * @param {{ supplierName: string, wholesaleAmt: number }[]} [options.unrecognizedSuppliers]
 * @param {number|string} [options.unrecognizedWholesaleTotal]
 * @param {string} options.fileName
 */
export async function exportFinanceSettlementSummaryXlsx(options) {
  const {
    beginDate = '',
    endDate = '',
    materialSuppliers = [],
    materialWholesaleTotal = 0,
    reagentSuppliers = [],
    reagentWholesaleTotal = 0,
    unrecognizedSuppliers = [],
    unrecognizedWholesaleTotal = 0,
    fileName,
  } = options;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('财务结算汇总', {
    views: [{ showGridLines: false }],
  });

  const datePart =
    beginDate && endDate ? `（${beginDate} 至 ${endDate}）` : beginDate ? `（${beginDate} 起）` : '';

  ws.mergeCells('A1:F1');
  const t1 = ws.getCell(1, 1);
  t1.value = { richText: [{ font: FONT_TITLE, text: '财务结算表汇总' }, { font: { ...FONT_TITLE, bold: false }, text: datePart ? ` ${datePart}` : '' }] };
  t1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  setCellBorder(t1);
  ws.getRow(1).height = 26;

  const headers = ['分类', '供货单位', '批发金额', '零售金额', '出库单数', '备注'];
  headers.forEach((text, c) => {
    const cell = ws.getCell(2, c + 1);
    cell.value = text;
    cell.font = { ...FONT_BODY, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(cell);
  });

  let r = 3;

  const writeSection = (categoryLabel, rows, totalAmt) => {
    if (!rows || rows.length === 0) {
      return;
    }
    const startRow = r;
    const n = rows.length;

    for (let i = 0; i < n; i++) {
      const row = ws.getRow(r);
      const b = ws.getCell(r, 2);
      b.value = rows[i].supplierName || '';
      b.font = FONT_BODY;
      b.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      setCellBorder(b);

      const c = ws.getCell(r, 3);
      c.value = rows[i].wholesaleAmt != null ? Number(rows[i].wholesaleAmt) : null;
      c.numFmt = '#,##0.00';
      c.font = FONT_BODY;
      c.alignment = { vertical: 'middle', horizontal: 'right' };
      setCellBorder(c);

      ;[4, 5, 6].forEach((ci) => {
        const cell = ws.getCell(r, ci);
        cell.value = '';
        cell.font = FONT_BODY;
        setCellBorder(cell);
      });
      row.height = 18;
      r++;
    }

    const bTot = ws.getCell(r, 2);
    bTot.value = '△合计';
    bTot.font = { ...FONT_BODY, bold: true };
    bTot.alignment = { vertical: 'middle', horizontal: 'center' };
    setCellBorder(bTot);

    const cTot = ws.getCell(r, 3);
    cTot.value = totalAmt != null ? Number(totalAmt) : 0;
    cTot.numFmt = '#,##0.00';
    cTot.font = { ...FONT_BODY, bold: true };
    cTot.alignment = { vertical: 'middle', horizontal: 'right' };
    setCellBorder(cTot);
    ;[4, 5, 6].forEach((ci) => {
      const cell = ws.getCell(r, ci);
      cell.value = '';
      setCellBorder(cell);
    });
    ws.getRow(r).height = 18;
    r++;

    ws.mergeCells(`A${startRow}:A${r - 1}`);
    const aCell = ws.getCell(startRow, 1);
    aCell.value = categoryLabel;
    aCell.font = { ...FONT_BODY, bold: true };
    aCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    setCellBorder(aCell);
  };

  writeSection('材料', materialSuppliers, materialWholesaleTotal);
  writeSection('试剂', reagentSuppliers, reagentWholesaleTotal);
  writeSection('未识别分类', unrecognizedSuppliers, unrecognizedWholesaleTotal);

  if (r === 3) {
    ws.mergeCells('A3:F3');
    const emptyCell = ws.getCell(3, 1);
    emptyCell.value = '当前条件下暂无统计数据（已审核出退库按供货单位汇总）';
    emptyCell.font = FONT_BODY;
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    setCellBorder(emptyCell);
    r = 4;
  }

  ws.mergeCells(`A${r}:F${r}`);
  const foot = ws.getCell(r, 1);
  foot.value = 'SPD制表员：             ；审核员：';
  foot.font = FONT_BODY;
  foot.alignment = { vertical: 'middle', horizontal: 'left' };
  setCellBorder(foot);
  ws.getRow(r).height = 22;

  ws.columns = [
    { width: 10 },
    { width: 42 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
  ];

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName || `财务结算汇总_${Date.now()}.xlsx`);
}
