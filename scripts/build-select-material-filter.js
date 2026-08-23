const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const gitContent = execSync(
  'git -C e:/workspace/spd-ui show 8804cb7:src/components/SelectModel/SelectMaterialFilter.vue',
  { encoding: 'utf8' }
);

const scriptMatch = gitContent.match(/<script>[\s\S]*<\/script>/);
const scopedMatch = gitContent.match(/<style scoped>[\s\S]*<\/style>/);
if (!scriptMatch || !scopedMatch) {
  console.error('Failed to extract script or scoped styles from git');
  process.exit(1);
}

let script = scriptMatch[0];

// --- props: nested, modalTitle ---
if (!script.includes('nested:')) {
  script = script.replace(
    /hideStockDetailColumns:\s*\{[\s\S]*?default:\s*false\s*\}\s*\}/,
    `hideStockDetailColumns: {
      type: Boolean,
      default: false
    },
    /** 嵌套在父级弹窗内展示 */
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: '添加明细'
    }
  }`
  );
}

// --- data: detailSelectedRowMap, filterTableHeight ---
script = script.replace(
  /selectedRowMap:\s*\{\},/,
  `selectedRowMap: {},
      detailSelectedRowMap: {},
      filterTableHeight: 400,`
);

// --- beforeDestroy ---
if (!script.includes('beforeDestroy')) {
  script = script.replace(
    /mounted\(\)\s*\{/,
    `beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize);
    }
  },
  mounted() {`
  );
}

// --- patch mounted ---
script = script.replace(
  /this\.getList\(\);\s*\n\s*\},/,
  `this.getList();
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize);
      this.$nextTick(() => this.updateFilterTableHeight());
    }
  },`
);

// --- patch DialogComponentShow watch ---
script = script.replace(
  /if \(newVal\) \{\s*\n\s*this\.selectedRowMap = \{\};/,
  `if (newVal) {
        this.selectedRowMap = {};
        this.detailSelectedRowMap = {};`
);

script = script.replace(
  /this\.getList\(\);\s*\n\s*\}\s*\n\s*\},\s*\n\s*warehouseValue/,
  `this.getList();
        this.$nextTick(() => this.updateFilterTableHeight());
      }
    },
    warehouseValue`
);

// --- patch handleSelectionChange ---
script = script.replace(
  /handleSelectionChange\(val\) \{\s*[\s\S]*?this\.selectRow = Object\.values\(this\.selectedRowMap\);\s*\},/,
  `handleSelectionChange(val) {
      const pageKeys = (this.materialList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean);
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (val || []).forEach(row => {
        const key = this.getRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      this.selectRow = Object.values(this.selectedRowMap);
      const pageIndices = (this.materialList || []).map((row, idx) => idx);
      pageIndices.forEach((idx) => {
        if (this.detailSelectedRowMap[idx]) {
          this.$delete(this.detailSelectedRowMap, idx);
        }
      });
      (val || []).forEach((row) => {
        const idx = this.materialList.indexOf(row);
        if (idx >= 0) {
          this.$set(this.detailSelectedRowMap, idx, true);
        }
      });
    },`
);

// --- patch handleClose ---
script = script.replace(
  /handleClose\(\) \{\s*\n\s*\/\/关闭弹窗\s*\n\s*this\.show = false\s*\n\s*this\.selectedRowMap = \{\};/,
  `handleClose() {
      //关闭弹窗
      this.show = false
      this.selectedRowMap = {};
      this.detailSelectedRowMap = {};`
);

script = script.replace(
  /this\.\$nextTick\(\(\) => this\.restorePageSelection\(\)\);/g,
  `this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });`
);

script = script.replace(
  /excludeMaterialIds: \{\s*deep: true,\s*handler\(\) \{\s*if \(this\.show\) \{\s*this\.queryParams\.pageNum = 1;\s*this\.getList\(\);\s*\}\s*\}\s*\}\s*\n\s*\},/,
  `excludeMaterialIds: {
      deep: true,
      handler() {
        if (this.show) {
          this.queryParams.pageNum = 1;
          this.getList();
        }
      }
    },
    total() {
      if (this.nested && this.show) {
        this.$nextTick(() => this.updateFilterTableHeight());
      }
    }
  },`
);

// --- add new methods before formatDate ---
const newMethods = `
    onFilterWindowResize() {
      this.updateFilterTableHeight();
    },
    updateFilterTableHeight() {
      if (!this.nested || !this.show) return;
      const PAGINATION_RESERVE = 54;
      const run = () => {
        const panel = this.$refs.filterTablePanel;
        const wrap = this.$refs.filterTableWrapper;
        if (!panel) return;
        const pagWrap = panel.querySelector('.material-filter-pagination-wrap');
        const pagMeasured = (pagWrap && pagWrap.offsetHeight) || 0;
        const pagH = pagMeasured > 0 ? pagMeasured : PAGINATION_RESERVE;
        let height = 0;
        if (wrap) {
          const wrapH = wrap.clientHeight || (wrap.getBoundingClientRect && wrap.getBoundingClientRect().height) || 0;
          if (wrapH > 0) {
            height = Math.floor(wrapH);
          }
        }
        if (!height) {
          const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
          if (!panelH) return;
          height = Math.floor(panelH - pagH);
        }
        height = Math.max(200, height);
        if (Math.abs(this.filterTableHeight - height) >= 2) {
          this.filterTableHeight = height;
          const table = this.$refs.singleTable;
          if (table && typeof table.doLayout === 'function') {
            this.$nextTick(() => table.doLayout());
          }
        }
      };
      this.$nextTick(run);
      requestAnimationFrame(run);
      [50, 150, 300].forEach((ms) => setTimeout(run, ms));
    },
    materialFilterDetailRowClassName({ rowIndex }) {
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** 嵌套字段排序：按 path 如 'material.name' 取值后比较 */
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
`;

script = script.replace(
  /\/\*\* 格式化日期 \*\//,
  `${newMethods}    /** 格式化日期 */`
);

const sortableCol = (label, prop, width, extra = '') =>
  `          <el-table-column label="${label}" align="center" prop="${prop}" width="${width}" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'${prop}')"${extra}/>`;

const template = `<template>
  <div v-show="show" class="local-modal-mask material-filter-mask" :class="{ 'material-filter-mask--nested': nested }">
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        v-show="showSearch"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="库房分类" prop="storeroomId">
                <SelectWarehouseCategory v-model="queryParams.storeroomId"/>
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="生产厂家" prop="factoryId">
                <SelectFactory v-model="queryParams.factoryId"/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard apply-modal-field--material-keyword">
              <el-form-item label="耗材" prop="materialKeyword">
                <el-input
                  v-model="queryParams.materialKeyword"
                  placeholder="耗材编码、名称或首字母"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                  @input="handleMaterialKeywordInput"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="按供应商过滤" prop="filterBySupplier" label-width="96px" class="material-filter-radio-item">
                <el-radio-group v-model="queryParams.filterBySupplier">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">耗材明细信息</span>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-search"
              @click="handleQuery"
            >搜索</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-refresh"
              @click="resetQuery"
            >重置</el-button>
            <el-button size="small" @click="handleClose">取 消</el-button>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-check"
              @click="checkMaterialBtn"
            >确 定</el-button>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel material-filter-table-panel" ref="filterTablePanel">
          <div class="table-wrapper" ref="filterTableWrapper">
            <el-table
              ref="singleTable"
              class="apply-detail-table material-filter-detail-table"
              :data="materialList"
              :row-class-name="materialFilterDetailRowClassName"
              @selection-change="handleSelectionChange"
              :height="nested ? filterTableHeight : 'calc(55vh)'"
              border
            >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
${sortableCol('耗材编码', 'material.code', '130')}
${sortableCol('耗材名称', 'material.name', '150')}
          <el-table-column label="规格" align="center" prop="material.speci" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="material.model" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" prop="material.isBilling" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.materialDate">{{ formatDate(scope.row.materialDate) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ formatDate(scope.row.endTime) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="供应商" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">
                {{ formatDate(scope.row.material.periodDate) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="存储方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
          </div>

          <div class="apply-pagination-wrap material-filter-pagination-wrap">
            <pagination
              v-show="total>0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="handlePagination"
            />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>
`;

let scopedStyles = scopedMatch[0];
scopedStyles = scopedStyles.replace(
  /padding: 12px 20px;[\s\S]*?background: #F5F7FA;[\s\S]*?min-height: 48px;/,
  `padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px`
);
// Add nested modal scoped overrides
scopedStyles += `
.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.material-filter-form.modal-form-compact {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-filter-table-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.material-filter-table-panel .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--material-keyword .el-input {
  width: 110px !important;
  max-width: 110px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
`;

const unscopedStyles = `<style lang="scss">
/* 嵌套弹窗：查询区 / 工具栏 / 表格区边框（对齐修改入库 apply/index） */
.material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 0 !important;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1;
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--material-keyword .el-input {
  width: 110px !important;
  max-width: 110px !important;
}

.material-filter-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  box-sizing: border-box;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-left: none;
  border-right: none;
  border-top: none;
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
}

.material-filter-mask.material-filter-mask--nested .material-filter-table-panel.apply-modal-table-panel {
  overflow: hidden;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
  flex: 1;
  min-height: 0;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table tbody td.el-table__cell {
  padding: 4px 0 !important;
  height: auto !important;
  min-height: 36px;
  vertical-align: middle;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px;
  min-height: 28px;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table thead th.el-table__cell {
  height: auto !important;
  min-height: 0 !important;
  padding: 6px 0 !important;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.material-filter-mask .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 12px;
  line-height: 32px;
}

.material-filter-mask .apply-pagination-wrap {
  flex-shrink: 0;
  padding: 8px 0;
}

.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap {
  flex-shrink: 0;
  padding: 8px 14px 4px;
  margin-bottom: 0;
  background: #fff;
  border-top: 1px solid #eef2f7;
  box-sizing: border-box;
}

.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 44px;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}
</style>
`;

const outPath = path.join(__dirname, '../src/components/SelectModel/SelectMaterialFilter.vue');
const full = template + '\n\n' + script + '\n\n' + scopedStyles + '\n\n' + unscopedStyles + '\n';
fs.writeFileSync(outPath, full, 'utf8');

const lines = full.split('\n').length;
console.log('Written', outPath);
console.log('Lines:', lines);
console.log('Has export default:', full.includes('export default'));
console.log('Has </script>:', full.includes('</script>'));
console.log('Has scoped style:', full.includes('<style scoped>'));
console.log('Has unscoped style:', full.includes('<style lang="scss">'));

if (lines <= 1000) {
  console.warn('WARNING: line count', lines, 'is not > 1000');
  process.exit(1);
}
