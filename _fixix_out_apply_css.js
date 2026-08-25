const fs = require('fs');

const outPath = 'e:/workspace/spd-ui/src/views/outWarehouse/apply/index.vue';
const inPath = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';
let out = fs.readFileSync(outPath, 'utf8');
const inn = fs.readFileSync(inPath, 'utf8');

function sliceBetween(src, startMark, endMark) {
  const a = src.indexOf(startMark);
  const b = src.indexOf(endMark, a + 1);
  if (a < 0 || b < 0) throw new Error('slice fail: ' + startMark + ' / ' + endMark);
  return { a, b, text: src.slice(a, b) };
}

// 1) Replace old modal field/detail CSS with inbound apply-modal CSS (page-agnostic part)
const outOld = sliceBetween(
  out,
  '/* 弹窗内顶部字段区：与到货验收一致 */',
  '/* 表格样式优化（与到货验收一致） */'
);

const inBlock = sliceBetween(
  inn,
  '/* 弹窗内三块区域：与标题栏同宽铺满（标题栏灰条为整行宽） */',
  '/* 仅弹窗内按钮行，勿影响主列表 list-toolbar 与搜索区之间的留白 */'
).text;

// Keep outbound-specific hint styles, drop inbound-only delivery/scan bits later if needed
let css = inBlock
  // keep as-is; delivery/scan rules harmless if unused
  + `
.wh-apply-outbound-hint {
  margin: 4px 0 0;
  flex-shrink: 0;
}
.table-header-with-tip {
  cursor: help;
}
.table-header-with-tip .el-icon-question {
  margin-left: 2px;
  font-size: 12px;
  color: #909399;
}
`;

out = out.slice(0, outOld.a) + css + out.slice(outOld.b);

// 2) Fix form padding if old value remains
out = out.replace(
  /\.local-modal-content \.el-form \{\r?\n  flex: 1;\r?\n  overflow: visible;\r?\n  padding: 6px 20px 12px;/,
  `.local-modal-content .el-form {\n  flex: 1;\n  overflow: visible;\n  padding: 8px 0 8px;`
);

// 3) Ensure thead/footer use #f1f5f9 (already may be patched)
out = out.replace(/background-color: #EBEEF5 !important;/g, 'background-color: #f1f5f9 !important;');

// 4) Non-scoped page styles: inject before .json-viewer-pre if missing apply-modal-root
if (!out.includes('.app-container.outWarehouse-apply-page .local-modal-content.apply-modal-root-content')) {
  const marker = '.json-viewer-pre {';
  const at = out.lastIndexOf(marker);
  if (at < 0) throw new Error('json-viewer marker missing');
  const nonScoped = `
.app-container.outWarehouse-apply-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}
.app-container.outWarehouse-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}
.app-container.outWarehouse-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .cell {
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 4px 6px;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.35;
  max-height: calc(1.35em * 2 + 2px);
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-weight: 600 !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  margin-top: 8px !important;
}

`;
  out = out.slice(0, at) + nonScoped + out.slice(at);
}

// 5) Align detailTableHeight with inbound
out = out.replace(
  /return 'max\\(240px, calc\\(100vh - 384px\\)\\)';/,
  "return 'max(240px, calc(100vh - 384px))';"
);
// check inbound value
const inH = (inn.match(/detailTableHeight\(\)\s*\{[\s\S]*?return '([^']+)'/) || [])[1];
const outH = (out.match(/detailTableHeight\(\)\s*\{[\s\S]*?return '([^']+)'/) || [])[1];
console.log('heights in/out', inH, outH);
if (inH && outH !== inH) {
  out = out.replace(
    new RegExp("detailTableHeight\\(\\)\\s*\\{[\\s\\S]*?return '" + outH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'"),
    `detailTableHeight() {\n      return '${inH}'`
  );
}

fs.writeFileSync(outPath, out);

// verify
const v = fs.readFileSync(outPath, 'utf8');
console.log('verify query-panel css', v.includes('.local-modal-content .apply-modal-query-panel {'));
console.log('verify toolbar css', v.includes('.local-modal-content .apply-modal-toolbar {'));
console.log('verify table-panel css', v.includes('.local-modal-content .apply-modal-table-panel {'));
console.log('verify no -20px', !v.includes('margin-left: -20px'));
console.log('verify form pad 8px 0', v.includes('padding: 8px 0 8px'));
console.log('verify root content', v.includes('outWarehouse-apply-page .local-modal-content.apply-modal-root-content'));
console.log('verify required label', v.includes('outWarehouse-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required'));
