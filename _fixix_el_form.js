const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/outWarehouse/apply/index.vue';
let o = fs.readFileSync(p, 'utf8');

console.log('before has el-form', o.includes('.local-modal-content .el-form {'));

const rule = [
  '',
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
  console.log('injected el-form at', at);
}

o = o.replace(
  '<el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>',
  '<el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable sortable>'
);

o = o.replace(
  "{{ (scope.row.material && scope.row.material.code) || '—' }}",
  "{{ (scope.row.material && scope.row.material.code) || '--' }}"
);

fs.writeFileSync(p, o);
o = fs.readFileSync(p, 'utf8');
console.log({
  elForm: o.includes('.local-modal-content .el-form {'),
  pad: o.includes('padding: 8px 0 8px'),
  query: o.includes('.local-modal-content .apply-modal-query-panel {'),
  toolbar: o.includes('.local-modal-content .apply-modal-toolbar {'),
  tablePanel: o.includes('.local-modal-content .apply-modal-table-panel {'),
  noNeg: !o.includes('margin-left: -20px'),
  root: o.includes('outWarehouse-apply-page .local-modal-content.apply-modal-root-content'),
  codeSort: o.includes('耗材编码" align="center" width="120" show-overflow-tooltip resizable sortable')
});
