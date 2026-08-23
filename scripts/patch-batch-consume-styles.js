const fs = require('fs');
const srcPath = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';
const tgtPath = 'e:/workspace/spd-ui/src/views/department/batchConsume/index.vue';
const src = fs.readFileSync(srcPath, 'utf8');
let tgt = fs.readFileSync(tgtPath, 'utf8');
const pageClass = 'batch-consume-page';

const scopedStart = src.indexOf('/* 表格样式优化 */');
const scopedEnd = src.indexOf('/* 弹窗内三块区域：与标题栏同宽铺满');
const scopedList = src.slice(scopedStart, scopedEnd);

const nonScopedStart = src.indexOf('/* 本页主容器：顶部与标签栏留 8px 细缝');
const nonScopedEnd = src.indexOf('/*\n * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏');
const nonScopedList = src.slice(nonScopedStart, nonScopedEnd).replace(/inWarehouse-apply-page/g, pageClass);

const modalStart = tgt.indexOf('/* 弹窗明细：名称/规格/型号/生产厂家最多两行');
let modalRules = '';
if (modalStart >= 0) {
  modalRules = '\n' + tgt.slice(modalStart, tgt.lastIndexOf('</style>'));
}

const tgtScopedMarker = tgt.indexOf('/* 搜索区域：卡片样式由外层');
if (tgtScopedMarker < 0) {
  throw new Error('scoped marker not found in target');
}
const tgtScopedEnd = tgt.indexOf('</style>', tgt.indexOf('<style scoped>'));
const tgtBeforeScoped = tgt.slice(0, tgtScopedMarker);
const localTail = `
.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

.reverse-action-btn {
  color: #e6a23c;
}

`;
tgt = tgtBeforeScoped + scopedList + localTail + '</style>' + tgt.slice(tgtScopedEnd + 8);

const secondStyleIdx = tgt.indexOf('<style>', tgt.indexOf('</style>') + 1);
const isModalRule = `
.app-container.${pageClass}.is-modal-open .apply-table-panel {
  visibility: hidden;
}
`;
const newNonScoped = '<style>\n' + nonScopedList + isModalRule + modalRules + '\n</style>';
tgt = tgt.slice(0, secondStyleIdx) + newNonScoped;

fs.writeFileSync(tgtPath, tgt, 'utf8');

const out = fs.readFileSync(tgtPath, 'utf8');
console.log(JSON.stringify({
  lines: out.split('\n').length,
  hasFlex: out.includes('display: flex'),
  hasScrollbarThumb: out.includes('el-scrollbar__thumb'),
  noHeight50: !out.includes('height: 50px'),
  hasInlineTable: out.includes('ref="applyMainTable"'),
  hasRowSelected: out.includes('apply-row-selected'),
}, null, 2));
