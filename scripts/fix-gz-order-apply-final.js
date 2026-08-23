const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');

// fix pagination
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

// fix missing closing brace before </script>
s = s.replace(
  /(handleExport\(\) \{[\s\S]*?\}\s*\n\s*\}\s*)\n\};\n<\/script>/,
  '$1\n}\n};\n</script>'
);

// ensure template has apply-table-panel - if still old table, abort with message
if (!s.includes('apply-table-panel')) {
  console.error('Template not synced - run sync-gz-order-apply-list-ui.js first');
  process.exit(1);
}

fs.writeFileSync(p, s);

const lines = s.split('\n');
const start = lines.findIndex((l) => l.includes('export default {'));
const end = lines.findIndex((l, i) => i > start && l.trim() === '};' && lines[i + 1] && lines[i + 1].includes('</script>'));
let d = 0;
for (let i = start; i <= end; i++) {
  for (const c of lines[i]) {
    if (c === '{') d++;
    if (c === '}') d--;
  }
}

console.log(JSON.stringify({
  pagWrap: s.includes('apply-pagination-wrap'),
  noVShowTotal: !s.includes('v-show="total>0"'),
  braceDepth: d,
  hasPanel: s.includes('apply-table-panel'),
  hasMethods: s.includes('applyMainRowClassName({'),
}, null, 2));

if (d !== 0) process.exit(1);
