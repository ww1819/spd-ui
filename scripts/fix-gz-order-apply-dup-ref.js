const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/\s*ref="orderTable"\s*/g, '\n              ');
s = s.replace(
  /if \(this\.\$refs\.orderTable\) \{\s*this\.\$refs\.orderTable\.doLayout\(\);\s*\}/g,
  'this.restoreMainPageSelection();\n          this.scheduleApplyLayoutRefresh();'
);
fs.writeFileSync(p, s);
console.log({
  hasDupRef: /ref="orderTable"/.test(s),
  hasApplyMain: s.includes('ref="applyMainTable"'),
});
