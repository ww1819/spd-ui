const fs = require('fs');

function ns(f, cls) {
  const t = fs.readFileSync(f, 'utf8');
  const m = t.match(/<style>\s*\n\/\* 本页主容器[\s\S]*?<\/style>/);
  return m ? m[0].replace(new RegExp(cls, 'g'), 'PAGE') : '';
}

const st = ns('e:/workspace/spd-ui/src/views/department/stocktaking/index.vue', 'stocktaking-apply-page');
const bc = ns('e:/workspace/spd-ui/src/views/department/batchConsume/index.vue', 'batch-consume-page');
const iw = fs.readFileSync('e:/workspace/spd-ui/src/views/inWarehouse/apply/index.vue', 'utf8');
const iwM = iw.match(/<style>\s*\n\/\* 弹窗表头[\s\S]*?<\/style>/);
const iwNs = iwM ? iwM[0].replace(/inWarehouse-apply-page/g, 'PAGE') : '';

const stM = fs.readFileSync('e:/workspace/spd-ui/src/views/department/stocktaking/index.vue', 'utf8')
  .match(/<style>\s*\n\/\* 本页主容器[\s\S]*?<\/style>/);
const stFromMain = stM ? stM[0].replace(/stocktaking-apply-page/g, 'PAGE') : '';

console.log('st(本页主容器) vs bc', st === bc, st.length, bc.length);
console.log('st(本页主容器) vs iw(弹窗表头块)', stFromMain === iwNs, stFromMain.length, iwNs.length);

const la = stFromMain.split('\n');
const lb = iwNs.split('\n');
for (let i = 0; i < Math.max(la.length, lb.length); i++) {
  if (la[i] !== lb[i]) {
    console.log('diff at', i + 1);
    console.log('st:', la[i]);
    console.log('iw:', lb[i]);
    break;
  }
}
