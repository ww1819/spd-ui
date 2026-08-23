/**
 * 同步盘点申请行高/明细表样式与到货验收 inWarehouse/apply 一致
 */
const fs = require('fs');

const STOCK = 'e:/workspace/spd-ui/src/views/department/stocktaking/index.vue';
const IW = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let stock = fs.readFileSync(STOCK, 'utf8');
const iw = fs.readFileSync(IW, 'utf8');

// --- template ---
if (!stock.includes('class="apply-detail-table"')) {
  stock = stock.replace(
    '<div class="modal-detail-section">',
    '<div class="modal-detail-section apply-modal-table-panel">'
  );
  stock = stock.replace(
    /<el-table :data="filteredStkIoStocktakingEntryList"/,
    '<el-table :data="filteredStkIoStocktakingEntryList" class="apply-detail-table"'
  );
}

const extractBetween = (text, startMarker, endMarker) => {
  const start = text.indexOf(startMarker);
  if (start < 0) return '';
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (end < 0) return text.substring(start);
  return text.substring(start, end);
};

const iwScoped = iw.match(/<style scoped>([\s\S]*?)<\/style>/)[1];

const newModalScoped = [
  extractBetween(iwScoped, '/* 明细表紧凑行高：单元格与输入框 */', '/* 批号 / 有效期等可编辑列外层容器 */').trim(),
  extractBetween(iwScoped, '/* 明细框表头：与耗材产品维护主表一致（冷静灰蓝） */', '/* 表体横向滚动条与合计行错开（非明细表保留底部内边距） */').trim(),
  extractBetween(iwScoped, '/* 表体横向滚动条与合计行错开（非明细表保留底部内边距） */', '/* 合计行：主表区 + 左侧固定列底部同步，避免被滚动条或固定层盖住 */').trim(),
  extractBetween(iwScoped, '/* 合计行：主表区 + 左侧固定列底部同步，避免被滚动条或固定层盖住 */', '/* 弹窗内非明细表滚动条：细 */').trim()
].filter(Boolean).join('\n\n');

const oldStart = stock.indexOf('/* 明细框表头：与到货验收一致 */');
const oldEnd = stock.indexOf('::v-deep .local-modal-content {', oldStart);
if (oldStart < 0 || oldEnd < 0) {
  console.error('old modal scoped block markers not found', oldStart, oldEnd);
  process.exit(1);
}
stock = stock.substring(0, oldStart) + newModalScoped + '\n\n' + stock.substring(oldEnd);

// --- non-scoped: full inWarehouse block ---
const iwNonScoped = iw.match(/<style>\s*\n\/\* 弹窗表头[\s\S]*?<\/style>/)[0]
  .replace(/inWarehouse-apply-page/g, 'stocktaking-apply-page')
  .replace(/inWarehouse-audit-page/g, 'stocktaking-apply-page');

const stockExtras = `
/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-apply-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-apply-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}
`;

const profitBlock = stock.match(/<style>\s*\n\/\* 新增盘盈明细弹窗[\s\S]*?<\/style>/)[0];
const styleStart = stock.indexOf('<style scoped>');
const prefix = stock.substring(0, styleStart);
const scopedBlock = stock.match(/<style scoped>[\s\S]*?<\/style>/)[0];
const iwNonScopedFinal = iwNonScoped.replace('</style>', `${stockExtras}\n</style>`);

stock = prefix + scopedBlock + '\n\n' + iwNonScopedFinal + '\n\n' + profitBlock + '\n';

fs.writeFileSync(STOCK, stock, 'utf8');

console.log('OK lines:', stock.split(/\n/).length);
console.log('apply-detail-table:', stock.includes('class="apply-detail-table"'));
console.log('compact row:', stock.includes('明细表紧凑行高'));
console.log('non-scoped len:', iwNonScopedFinal.length);
