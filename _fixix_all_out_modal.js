const fs = require('fs');
const outPath = 'e:/workspace/spd-ui/src/views/outWarehouse/apply/index.vue';
const inPath = 'e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue';
let out = fs.readFileSync(outPath, 'utf8');
const inn = fs.readFileSync(inPath, 'utf8');

function mustFind(src, mark) {
  const i = src.indexOf(mark);
  if (i < 0) throw new Error('missing: ' + mark);
  return i;
}

// ========== 1) Kill global compact 140 that caps table inputs ==========
const compactRe = /\.local-modal-content \.modal-form-compact \.el-input,\r?\n\.local-modal-content \.modal-form-compact \.el-select,\r?\n\.local-modal-content \.modal-form-compact \.el-date-picker \{\r?\n  width: 140px;\r?\n  max-width: 140px;\r?\n\}/g;

const compactFixed = [
  '/* 仅约束弹窗表头字段；明细表输入框禁止 140 上限 */',
  '.local-modal-content .modal-form-compact .apply-modal-query-panel .el-input,',
  '.local-modal-content .modal-form-compact .apply-modal-query-panel .el-select,',
  '.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-picker,',
  '.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-editor {',
  '  width: 140px;',
  '  max-width: 140px;',
  '}',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-input,',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-select,',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-date-picker,',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor,',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-input.el-input--small,',
  '.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor.el-input {',
  '  width: 100% !important;',
  '  max-width: none !important;',
  '  min-width: 0 !important;',
  '}'
].join('\n');

const n1 = (out.match(compactRe) || []).length;
out = out.replace(compactRe, compactFixed);
console.log('compact140 replaced', n1);

// ========== 2) Restore apply-modal layout CSS if missing ==========
if (!out.includes('.local-modal-content .apply-modal-query-panel {')) {
  const inStart = mustFind(inn, '/* 弹窗内三块区域：与标题栏同宽铺满（标题栏灰条为整行宽） */');
  const inEnd = mustFind(inn, '/* 仅弹窗内按钮行，勿影响主列表 list-toolbar 与搜索区之间的留白 */');
  let block = inn.slice(inStart, inEnd);

  const elForm = [
    '.local-modal-content .el-form {',
    '  flex: 1;',
    '  overflow: visible;',
    '  padding: 8px 0 8px;',
    '  background: #fff;',
    '  box-shadow: none;',
    '  margin-bottom: 0;',
    '  display: flex;',
    '  flex-direction: column;',
    '  justify-content: flex-start;',
    '  align-content: flex-start;',
    '  box-sizing: border-box;',
    '}',
    '',
    ''
  ].join('\n');

  const extra = [
    '.wh-apply-outbound-hint { margin: 4px 0 0; flex-shrink: 0; }',
    '.table-header-with-tip { cursor: help; }',
    '.table-header-with-tip .el-icon-question { margin-left: 2px; font-size: 12px; color: #909399; }',
    ''
  ].join('\n');

  const insertAtCandidates = [
    '/* 弹窗内顶部字段区：与到货验收一致 */',
    '/* 表格样式优化（与到货验收一致） */',
    '/* 表格样式优化 */'
  ];
  let insertAt = -1;
  let replaceEnd = -1;
  for (const m of insertAtCandidates) {
    const i = out.indexOf(m);
    if (i >= 0) {
      insertAt = i;
      break;
    }
  }
  if (insertAt < 0) {
    // after modal-header close-btn block
    insertAt = out.indexOf('.close-btn:hover');
    if (insertAt >= 0) insertAt = out.indexOf('}', insertAt) + 1;
  }
  const tableMark = out.indexOf('/* 表格样式优化');
  if (out.includes('/* 弹窗内顶部字段区') && tableMark > 0) {
    const startOld = out.indexOf('/* 弹窗内顶部字段区');
    out = out.slice(0, startOld) + elForm + block + extra + out.slice(tableMark);
    console.log('replaced old top-field css with apply-modal block');
  } else if (insertAt >= 0) {
    out = out.slice(0, insertAt) + '\n' + elForm + block + extra + out.slice(insertAt);
    console.log('inserted apply-modal block at', insertAt);
  } else {
    throw new Error('cannot find insert point for apply-modal css');
  }
} else {
  console.log('apply-modal-query-panel css already present');
}

// ========== 3) Shell padding align ==========
out = out.replace(
  /\.local-modal-content \{\r?\n  background: #fff;\r?\n  width: 100%;\r?\n  height: 100%;\r?\n  min-height: 95vh;\r?\n  overflow-x: hidden;\r?\n  overflow-y: auto;\r?\n  display: flex;\r?\n  flex-direction: column;\r?\n  padding-bottom: \d+px;/,
  [
    '.local-modal-content {',
    '  background: #fff;',
    '  width: 100%;',
    '  height: 100%;',
    '  min-height: 95vh;',
    '  overflow-x: hidden;',
    '  overflow-y: auto;',
    '  display: flex;',
    '  flex-direction: column;',
    '  padding-bottom: 8px;'
  ].join('\n')
);
out = out.replace(
  /\.modal-header \{\r?\n  display: flex;\r?\n  justify-content: space-between;\r?\n  align-items: center;\r?\n  padding: 6px \d+px;/,
  [
    '.modal-header {',
    '  display: flex;',
    '  justify-content: space-between;',
    '  align-items: center;',
    '  padding: 6px 8px;'
  ].join('\n')
);

// ========== 4) Strong non-scoped fluid (replace or insert) ==========
const fluidCss = `
/* OUT-FLUID-INPUTS: 明细输入随列宽，禁止被 140/max-width 卡住 */
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .cell {
  overflow: visible !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  text-align: left !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-edit-wrap,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-fluid-wrap,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-batch-wrap,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-begin-date-wrap {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
  padding: 0 !important;
  text-align: left !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-input,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-date-editor,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-fluid-input,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-batch-input,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  display: block !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-input__inner,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-date-editor .el-input__inner {
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin .el-input__prefix,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin .el-input__suffix,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry .el-input__prefix,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry .el-input__suffix {
  display: none !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin .el-input__inner,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry .el-input__inner {
  padding-left: 6px !important;
  padding-right: 6px !important;
}
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
  word-break: keep-all !important;
}
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

`;

if (out.includes('OUT-FLUID-INPUTS:')) {
  const a = out.indexOf('/* OUT-FLUID-INPUTS:');
  const b = out.indexOf('.json-viewer-pre {', a);
  out = out.slice(0, a) + fluidCss + out.slice(b);
  console.log('replaced OUT-FLUID block');
} else if (out.includes('出库申请弹窗明细：输入框随列宽拉伸')) {
  const a = out.indexOf('/* 出库申请弹窗明细：输入框随列宽拉伸');
  const b = out.indexOf('.json-viewer-pre {', a);
  out = out.slice(0, a) + fluidCss + out.slice(b);
  console.log('replaced old fluid comment block');
} else {
  const b = out.lastIndexOf('.json-viewer-pre {');
  out = out.slice(0, b) + fluidCss + out.slice(b);
  console.log('injected OUT-FLUID block');
}

// ========== 5) Put 备注 on row2 with 引用单号/领用人 (match denser inbound-like row) ==========
const oldRemarkRows = `        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="领用人" prop="recipientName">
              <el-input v-model="form.recipientName" :disabled="true" placeholder="领用人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" class="apply-modal-row-third">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
            </el-form-item>
          </el-col>
        </el-row>`;

const newRemarkRows = `        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="领用人" prop="recipientName">
              <el-input v-model="form.recipientName" :disabled="true" placeholder="领用人" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--grow" style="flex: 1 1 auto; min-width: 200px;">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" style="width: 100%; max-width: none;" />
            </el-form-item>
          </el-col>
        </el-row>`;

if (out.includes(oldRemarkRows.replace(/\n/g, '\r\n'))) {
  out = out.replace(oldRemarkRows.replace(/\n/g, '\r\n'), newRemarkRows.replace(/\n/g, '\r\n'));
  console.log('merged remark into row2 (crlf)');
} else if (out.includes(oldRemarkRows)) {
  out = out.replace(oldRemarkRows, newRemarkRows);
  console.log('merged remark into row2');
} else {
  console.log('remark layout already changed or mismatch — skip');
}

fs.writeFileSync(outPath, out);

const v = fs.readFileSync(outPath, 'utf8');
const report = {
  queryPanelCss: v.includes('.local-modal-content .apply-modal-query-panel {'),
  toolbarCss: v.includes('.local-modal-content .apply-modal-toolbar {'),
  compactScoped: v.includes('.modal-form-compact .apply-modal-query-panel .el-input'),
  tableMaxNone: v.includes('modal-detail-section .el-input') && v.includes('max-width: none !important'),
  fluidMarker: v.includes('OUT-FLUID-INPUTS:'),
  global140Gone: !/\.modal-form-compact \.el-input,\r?\n\.local-modal-content \.modal-form-compact \.el-select/.test(v),
  inline100: (v.match(/style="width: 100%"/g) || []).length,
  wrap: v.includes('detail-cell-fluid-wrap')
};
console.log(report);
if (!report.queryPanelCss || !report.tableMaxNone || !report.global140Gone) {
  process.exitCode = 2;
}
