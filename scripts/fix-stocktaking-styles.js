const fs = require('fs');

const path = 'e:/workspace/spd-ui/src/views/department/stocktaking/index.vue';
const bcPath = 'e:/workspace/spd-ui/src/views/department/batchConsume/index.vue';
const st = fs.readFileSync(path, 'utf8');
const bc = fs.readFileSync(bcPath, 'utf8');

const tableOptMarker = '/* 表格样式优化 */';
const profitMarker = '/* 新增盘盈明细弹窗';

const styleScopedStart = st.indexOf('<style scoped>');
const prefix = st.substring(0, styleScopedStart);

const stModalScoped = st.substring(
  styleScopedStart + '<style scoped>'.length,
  st.indexOf(tableOptMarker)
);

const profitStyleStart = st.indexOf('<style>', st.indexOf(profitMarker));
const profitBlock = st.substring(profitStyleStart, st.lastIndexOf('</style>') + 8);

const bcScopedStart = bc.indexOf('<style scoped>');
const bcScopedEnd = bc.indexOf('</style>', bcScopedStart);
const bcScopedShared = bc.substring(bc.indexOf(tableOptMarker), bcScopedEnd);

const bcNonScoped = bc.match(/<style>\r?\n\/\* 本页主容器[\s\S]*?<\/style>/)[0];
let nonScoped = bcNonScoped.replace(/batch-consume-page/g, 'stocktaking-apply-page');

const stocktakingExtras = `
/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-apply-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-apply-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

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
`;

nonScoped = nonScoped.replace('</style>', `${stocktakingExtras}\n</style>`);

const out = [
  prefix,
  '<style scoped>',
  stModalScoped.trimEnd(),
  '',
  bcScopedShared.trimEnd(),
  '</style>',
  '',
  nonScoped.trimEnd(),
  '',
  profitBlock.trimEnd(),
  ''
].join('\n');

fs.writeFileSync(path, out, 'utf8');

const blocks = [...out.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map((m, i) => ({
  i: i + 1,
  attrs: m[1].trim(),
  len: m[2].length
}));
console.log('written, lines:', out.split(/\r?\n/).length);
console.log('style blocks:', blocks);
