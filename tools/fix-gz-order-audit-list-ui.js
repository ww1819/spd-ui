const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/audit/index.vue';
let s = fs.readFileSync(p, 'utf8');

// 1. Fix broken computed/watch (sync script corruption)
const brokenComputedWatch = /hasDialogUnsavedChanges\(\) \{[\s\S]*?return this\.buildDialogSnapshot\(\) !== this\.dialogSavedSnapshot;,\s*watch: \{[\s\S]*?'\$store\.state\.app\.sidebarNavTick'\(nav\) \{[\s\S]*?\}\s*\}\s*\},\s*created\(\)/;
const fixedComputedWatch = `hasDialogUnsavedChanges() {
      if (!this.open || !this.action) {
        return false;
      }
      if (!this.dialogSavedSnapshot) {
        return true;
      }
      return this.buildDialogSnapshot() !== this.dialogSavedSnapshot;
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    }
  },
  created()`;

if (!brokenComputedWatch.test(s)) {
  console.error('broken computed/watch block not found');
  process.exit(1);
}
s = s.replace(brokenComputedWatch, fixedComputedWatch);

// 2. Fix pagination: always visible + apply-pagination-wrap
s = s.replace(
  /<pagination\s+v-show="total>0"\s+:total="total"/,
  '<div class="apply-pagination-wrap" ref="paginationWrap">\n    <pagination\n      :total="total"'
);
if (!s.includes('class="apply-pagination-wrap"')) {
  s = s.replace(
    /<pagination\s+:total="total"/,
    '<div class="apply-pagination-wrap" ref="paginationWrap">\n    <pagination\n      :total="total"'
  );
}
s = s.replace(
  /(@pagination="getList"\s*\/>)\s*<\/div>\s*<\/div>/,
  '$1\n    </div>\n    </div>'
);

// 3. Remove duplicate closing div if template has 3 closes after pagination
s = s.replace(
  /(@pagination="getList"\s*\/>)\s*<\/div>\s*<\/div>\s*<\/div>/,
  '$1\n    </div>\n    </div>'
);

fs.writeFileSync(p, s, 'utf8');

const tpl = s.match(/<template>([\s\S]*)<\/template>/)[1];
const opens = (tpl.match(/<div/g) || []).length;
const closes = (tpl.match(/<\/div>/g) || []).length;
const js = s.match(/<script>([\s\S]*)<\/script>/)[1];
let depth = 0;
const start = js.indexOf('export default {');
for (let i = start; i < js.length; i++) {
  if (js[i] === '{') depth++;
  if (js[i] === '}') depth--;
}
console.log({
  divBalance: opens === closes ? 'ok' : `${opens} vs ${closes}`,
  hasPaginationWrap: s.includes('apply-pagination-wrap'),
  noVShowPagination: !s.includes('v-show="total>0"'),
  braceDepth: depth,
  nestedWatch: /computed:\s*\{\s*watch:/.test(s),
});
