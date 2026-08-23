const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/department/stocktaking/index.vue';
let s = fs.readFileSync(p, 'utf8');
const block = `/* 表格样式优化（与到货验收 apply 列表一致） */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

`;
const marker = '/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担，内层 el-form 不再重复包一层 */';
if (!s.includes('/* 表格样式优化（与到货验收 apply 列表一致） */')) {
  if (!s.includes(marker)) throw new Error('marker missing');
  s = s.replace(marker, block + marker);
  fs.writeFileSync(p, s);
  console.log('added table scoped styles');
} else {
  console.log('already present');
}
