const fs = require('fs');
const path = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
const vue = fs.readFileSync(path, 'utf8');
const tpl = vue.match(/<template>([\s\S]*)<\/template>/)[1];
const script = vue.match(/<script>([\s\S]*)<\/script>/)[1];

const issues = [];
['moreSearch', 'orderListIndex', 'ref="orderTable"', 'applyMoreSearchToQueryParams', 'more-search-bar'].forEach((k) => {
  if (vue.includes(k)) issues.push('still has: ' + k);
});

const methodCalls = new Set();
const re = /(?:@|:)[\w-]+="([^"(]+)/g;
let m;
while ((m = re.exec(tpl))) {
  const expr = m[1].trim();
  if (/^[a-zA-Z_][\w]*$/.test(expr)) methodCalls.add(expr);
}
['applyMainRowClassName', 'sortByNested', 'sortByCreatorName', 'sortByOrderDate', 'sortByTotalAmt', 'sortByAuditorName', 'sortByAuditDate'].forEach((x) => methodCalls.add(x));

for (const fn of methodCalls) {
  if (!script.includes(fn + '(') && !script.includes(fn + ' (')) {
    issues.push('missing method: ' + fn);
  }
}

try {
  require('acorn').parse(script, { ecmaVersion: 2020, sourceType: 'module' });
} catch (e) {
  issues.push('script parse: ' + e.message);
}

const opens = (tpl.match(/<div/g) || []).length;
const closes = (tpl.match(/<\/div>/g) || []).length;
if (opens !== closes) issues.push(`template div mismatch ${opens} vs ${closes}`);

console.log({ lines: vue.split(/\r?\n/).length, issues });
if (issues.length) process.exit(1);
