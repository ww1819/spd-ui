const fs = require('fs');
const p = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let s = fs.readFileSync(p, 'utf8');

const modalMarker = '<!-- 添加或修改高值入库对话框 -->';
const tableEndMatch = s.match(/\s*<\/el-table>\s*\n/);
const modalIdx = s.indexOf(modalMarker);
if (!tableEndMatch || modalIdx === -1) throw new Error('markers not found');

const tableEnd = tableEndMatch.index + tableEndMatch[0].length;

const replacement = `    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
    </div>
    </div>

    ${modalMarker}`;

s = s.slice(0, tableEnd) + replacement + s.slice(modalIdx + modalMarker.length);

fs.writeFileSync(p, s);
console.log(JSON.stringify({
  hasPagWrap: s.includes('apply-pagination-wrap'),
  noVShow: !s.includes('v-show="total>0"'),
  extraDivsBeforeModal: (s.match(/@pagination="getList"\s*\/>\s*(\n\s*<\/div>)+/) || [''])[0].split('</div>').length - 1,
}, null, 2));
