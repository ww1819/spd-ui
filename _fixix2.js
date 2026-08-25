const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/outWarehouse/apply/index.vue';
let o = fs.readFileSync(p, 'utf8');

console.log('before has el-form', o.includes('.local-modal-content .el-form {'));

const rule = `
.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  box-sizing: border-box;
}

`;

if (!o.includes('.local-modal-content .el-form {')) {
  const marks = [
    '/* 表格样式优化（与到货验收一致） */',
    '/* 表格样式优化 */'
  ];
  let at = -1;
  for (const m of marks) {
    at = o.indexOf(m);
    if (at >= 0) break;
  }
  if (at < 0) throw new Error('table style mark missing');
  o = o.slice(0, at) + rule + o.slice(at);
  fs.writeFileSync(p, o);
  console.log('injected');
}

o = fs.readFileSync(p, 'utf8');

// Align delete button with inbound (plain danger, no spd-btn--danger) — optional cosmetic
// Keep spd-btn--danger as it's fine visually

// Make 耗材编码 sortable like inbound
o = o.replace(
  '<el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>',
  '<el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable sortable>'
);

// Align empty code placeholder with inbound '--'
o = o.replace(
  "{{ (scope.row.material && scope.row.material.code) || '—' }}",
  "{{ (scope.row.material && scope.row.material.code) || '--' }}"
);

fs.writeFileSync(p, o);

// final verify
o = fs.readFileSync(p, 'utf8');
const checks = {
  'el-form padding': o.includes('padding: 8px 0 8px'),
  'query-panel css': o.includes('.local-modal-content .apply-modal-query-panel {'),
  'toolbar css': o.includes('.local-modal-content .apply-modal-toolbar {'),
  'table-panel css': o.includes('.local-modal-content .apply-modal-table-panel {'),
  'no -20px': !o.includes('margin-left: -20px'),
  'root content page': o.includes('outWarehouse-apply-page .local-modal-content.apply-modal-root-content'),
  'required label css': o.includes('apply-modal-label-required .el-form-item__label'),
  'mask widen': o.includes('outWarehouse-apply-page .local-modal-mask'),
  'code sortable': o.includes('label="耗材编码" align="center" width="120" show-overflow-tooltip resizable sortable'),
  'padding-bottom 8': /\.local-modal-content \{[\s\S]*?padding-bottom: 8px/.test(o),
  'header pad 6px 8px': /\.modal-header \{[\s\S]*?padding: 6px 8px/.test(o)
};
console.log(checks);
