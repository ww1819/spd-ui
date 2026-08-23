/**
 * 盘点申请（科室）列表页 UI 完全对齐到货验收 inWarehouse/apply
 */
const fs = require('fs');

const STOCK_PATH = 'e:/workspace/spd-ui/src/views/department/stocktaking/index.vue';
const REF_PATH = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';

let stock = fs.readFileSync(STOCK_PATH, 'utf8');
const ref = fs.readFileSync(REF_PATH, 'utf8');

// 移除隐藏列
stock = stock.replace(/\s*<el-table-column label="盘点类型"[\s\S]*?<\/el-table-column>\s*/, '\n');

// 参考 scoped：搜索区 + 主表卡片
const refScopedInner = ref.substring(
  ref.indexOf('<style scoped>') + '<style scoped>'.length,
  ref.indexOf('</style>', ref.indexOf('<style scoped>'))
);
const listQueryBlock = refScopedInner.match(
  /\/\* 搜索区域：卡片样式[\s\S]*?\.list-query-panel \.el-form \.query-row-second-inner \.query-date-range-form-item \.el-form-item__content \{[\s\S]*?\}\s*/
);
const applyTablePanelScoped = refScopedInner.match(
  /\.apply-table-panel > \.apply-main-table \{[\s\S]*?margin-bottom: 0;\s*\}/
);
if (!listQueryBlock || !applyTablePanelScoped) throw new Error('reference scoped blocks missing');

// 参考非 scoped：列表主容器到表尾
const refNsStart = ref.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const refNsEnd = ref.indexOf('.json-viewer-pre {', refNsStart);
if (refNsStart < 0 || refNsEnd < 0) throw new Error('reference non-scoped block missing');

let listPageNs = ref.substring(refNsStart, refNsEnd).replace(/inWarehouse-apply-page/g, 'stocktaking-apply-page');
listPageNs = listPageNs.replace(
  /\/\* 单据状态列表头不换行 \*\/\s*\.app-container\.stocktaking-apply-page \.apply-main-table thead th:nth-child\(9\) \.cell \{[\s\S]*?\}\s*/,
  `/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-apply-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-apply-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

`
);

const modalExtras = `
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
.app-container.stocktaking-apply-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}
.app-container.stocktaking-apply-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}
`;
listPageNs = listPageNs.trimEnd() + '\n\n' + modalExtras.trim() + '\n';

// 更新 scoped
const scopedStart = stock.indexOf('<style scoped>') + '<style scoped>'.length;
const scopedEnd = stock.indexOf('</style>', scopedStart);
let scoped = stock.substring(scopedStart, scopedEnd);

scoped = scoped.replace(/\/\* 仅列表主表滚动条样式[\s\S]*?background: #a8a8a8;\s*\}\s*/, '');
if (!scoped.includes('/* 搜索区域：卡片样式')) {
  scoped = scoped.trimEnd() + '\n\n' + listQueryBlock[0].trim() + '\n\n' + applyTablePanelScoped[0].trim() + '\n';
}

// 替换第一个非 scoped 块（profit 弹窗之前所有 style 块合并为一个）
const profitMarker = '/* 新增盘盈明细弹窗';
const profitIdx = stock.indexOf(profitMarker);
const profitStyleOpen = stock.lastIndexOf('<style>', profitIdx);
const firstNsOpen = stock.indexOf('<style>', scopedEnd);
if (firstNsOpen < 0 || profitIdx < 0) throw new Error('style markers not found');

stock = stock.substring(0, firstNsOpen) + '<style>\n' + listPageNs + '</style>\n' + stock.substring(profitStyleOpen);

// 写回 scoped
const ns2 = stock.indexOf('<style scoped>') + '<style scoped>'.length;
const ns2End = stock.indexOf('</style>', ns2);
stock = stock.substring(0, ns2) + scoped + stock.substring(ns2End);

if (!/_lastSidebarNavTick:\s*null/.test(stock)) {
  stock = stock.replace(/(rules:\s*\{[\s\S]*?\}\s*)\n(\s*\};)/, '$1,\n      _lastSidebarNavTick: null\n$2');
}

fs.writeFileSync(STOCK_PATH, stock, 'utf8');

const lines = stock.split('\n').length;
const ok = {
  lines,
  topBar: stock.includes('顶部与标签栏留 8px'),
  sortCaret: stock.includes('.sort-caret.ascending'),
  rowHl: stock.includes('apply-row-selected > td'),
  scrollbar12: stock.includes('height: 12px !important'),
  listQueryScoped: stock.includes('/* 搜索区域：卡片样式'),
  noBadMargin: !/\.list-query-panel\s*\{[^}]*margin-top:\s*-20px/.test(stock),
  noBadScrollbar: !stock.includes('stocktaking-apply-page > .el-table.table-compact'),
  noStockTypeCol: !stock.includes('label="盘点类型"'),
};
console.log(JSON.stringify(ok, null, 2));
if (!ok.topBar || !ok.sortCaret || !ok.noBadMargin) process.exit(1);
