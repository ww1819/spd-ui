const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('v-show="total>0"')) {
  s = s.replace(
    '<pagination\n      v-show="total>0"',
    '<div class="apply-pagination-wrap" ref="paginationWrap">\n    <pagination'
  );
}

if (!s.includes('class="apply-pagination-wrap"')) {
  s = s.replace(
    /(@pagination="getList"\s*\/>)(\s*\n\s*<\/div>\s*\n\s*<\/div>)/,
    '$1\n    </div>$2'
  );
}

s = s.replace(/\s*this\.applyMoreSearchToQueryParams\([^)]+\);\s*/g, '\n      ');

s = s.replace(
  /this\.\$nextTick\(\(\) => \{\s*if \(this\.\$refs\.orderTable\) \{\s*this\.\$refs\.orderTable\.doLayout\(\);\s*\}\s*\}\);/g,
  `this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });`
);

if (!s.includes('scheduleApplyLayoutRefresh();\n        this.$modal.msgError')) {
  s = s.replace(
    /this\.loading = false;\s*this\.\$modal\.msgError\('查询失败/,
    `this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败`
  );
}

// remove duplicate layout method block if script ran twice
const marker = 'onApplyWindowResize()';
const first = s.indexOf(marker);
const second = s.indexOf(marker, first + 1);
if (second !== -1) {
  const methodsStart = s.lastIndexOf('methods: {', second);
  const dupStart = s.lastIndexOf('\n    onApplyWindowResize()', second);
  const dupEnd = s.indexOf('\n    buildSnapshot()', dupStart);
  if (dupStart > methodsStart && dupEnd > dupStart) {
    s = s.slice(0, dupStart) + s.slice(dupEnd);
  }
}

fs.writeFileSync(p, s);
console.log(JSON.stringify({
  pagWrap: s.includes('apply-pagination-wrap'),
  noVShow: !s.includes('v-show="total>0"'),
  noApplyMore: !s.includes('applyMoreSearchToQueryParams'),
  methodCount: (s.match(/onApplyWindowResize/g) || []).length,
}, null, 2));
