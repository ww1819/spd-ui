<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask material-for-purchase-agg-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'material-for-purchase-agg-select-full-modal': !nested
    }"
  >
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
        class="modal-form-compact material-filter-form material-for-purchase-agg-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材编码" prop="code" label-width="84px">
                <el-input
                  v-model="queryParams.code"
                  placeholder="耗材编码"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材名称" prop="name" label-width="84px">
                <el-input
                  v-model="queryParams.name"
                  placeholder="耗材名称"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="规格" prop="speci">
                <el-input
                  v-model="queryParams.speci"
                  placeholder="规格"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">仓库定数耗材信息</span>
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
              @click="checkBtn"
            >确 定</el-button>
          </div>
        </el-row>

        <div
          v-if="nested"
          class="apply-table-panel"
          ref="filterTablePanel"
        >
          <el-table
            ref="singleTable"
            v-loading="loading"
            class="table-compact apply-main-table"
            :data="materialList"
            :row-class-name="rowMaterialIndex"
            @selection-change="handleSelectionChange"
            :height="filterTableHeight"
            border
            stripe
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByStr(a,b,'warehouseName')" />
            <el-table-column label="耗材编码" align="center" prop="code" width="130" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByStr(a,b,'code')" />
            <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByStr(a,b,'name')" />
            <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByStr(a,b,'speci')" />
            <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || (scope.row.unit && scope.row.unit.unitName) || (scope.row.unit && scope.row.unit.name) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.price || scope.row.prince">¥{{ formatPrice(scope.row.price || scope.row.prince) }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
            <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.registerNo || scope.row.register_no || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="计费" align="center" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.isBilling == '1' || scope.row.isBilling == 1 ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable />
            <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.remark || '--' }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="apply-pagination-wrap" ref="filterPaginationWrap">
            <pagination
              class="modal-entry-pagination"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              :hide-on-single-page="false"
              @pagination="handlePagination"
            />
          </div>
        </div>

        <div v-else class="modal-detail-section apply-modal-table-panel">
          <div class="table-wrapper">
            <el-table
              ref="singleTable"
              v-loading="loading"
              class="apply-detail-table material-filter-detail-table"
              :data="materialList"
              :row-class-name="rowMaterialIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
              <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable />
              <el-table-column label="耗材编码" align="center" prop="code" width="130" show-overflow-tooltip resizable />
              <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable />
              <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable />
              <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable />
              <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || (scope.row.unit && scope.row.unit.unitName) || (scope.row.unit && scope.row.unit.name) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单价" align="center" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.price || scope.row.prince">¥{{ formatPrice(scope.row.price || scope.row.prince) }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
              <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.registerNo || scope.row.register_no || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="计费" align="center" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.isBilling == '1' || scope.row.isBilling == 1 ? '是' : '否' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable />
              <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.remark || '--' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="apply-pagination-wrap">
            <pagination
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

<script>
import { listFixedNumberForPurchaseAgg } from "@/api/monitoring/fixedNumber";
import { normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  name: "SelectMaterialForPurchaseAgg",
  props: {
    DialogComponentShow: Boolean,
    /** 已选 materialId_warehouseId */
    excludePickKeys: {
      type: Array,
      default: () => []
    },
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: "选择耗材（仓库定数）"
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      showSearch: true,
      total: 0,
      materialList: [],
      filterTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        code: null,
        name: null,
        speci: null,
        supplierId: null,
        brand: null
      },
      selectedRowMap: {}
    };
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        this.getList();
        if (this.nested) {
          this.$nextTick(() => this.updateFilterTableHeight());
        }
      }
    },
    excludePickKeys() {
      if (this.show) this.getList();
    }
  },
  mounted() {
    this.show = this.DialogComponentShow;
    if (this.show) this.getList();
    if (this.nested) {
      window.addEventListener("resize", this.onFilterWindowResize);
    }
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener("resize", this.onFilterWindowResize);
    }
  },
  methods: {
    formatPrice(val) {
      if (val == null || val === "") return "";
      const n = Number(val);
      if (Number.isNaN(n)) return String(val);
      return n.toFixed(2);
    },
    getRowKey(row) {
      if (!row) return null;
      if (row.pickKey) return String(row.pickKey);
      if (row.materialId != null && row.warehouseId != null) {
        return `${row.materialId}_${row.warehouseId}`;
      }
      return row.id != null ? String(row.id) : null;
    },
    restorePageSelection() {
      if (!this.$refs.singleTable || !this.materialList || this.materialList.length === 0) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      this.materialList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
    },
    buildPurchaseQueryParams() {
      const q = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      };
      const name = normalizeMaterialSearchKeyword(this.queryParams.name);
      const code = normalizeMaterialSearchKeyword(this.queryParams.code);
      const speci = normalizeMaterialSearchKeyword(this.queryParams.speci);
      if (name) {
        q.materialName = name;
      } else if (code) {
        q.materialName = code;
      }
      if (code && name) {
        q.materialCode = code;
      }
      if (speci) {
        q.materialSpeci = speci;
      }
      return q;
    },
    filterExcludedRows(rows) {
      const excludes = new Set((this.excludePickKeys || []).map(k => String(k)));
      if (!excludes.size) return rows;
      return (rows || []).filter(row => {
        const key = this.getRowKey(row);
        return !key || !excludes.has(key);
      });
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    getList() {
      this.loading = true;
      listFixedNumberForPurchaseAgg(this.buildPurchaseQueryParams())
        .then(response => {
          let rows = response.rows || [];
          rows = this.filterExcludedRows(rows);
          const filteredCount = (response.rows || []).length - rows.length;
          const serverTotal = response.total != null ? Number(response.total) : rows.length;
          this.total = filteredCount > 0 ? Math.max(0, serverTotal - filteredCount) : serverTotal;
          this.materialList = rows.slice();
          this.loading = false;
          this.$nextTick(() => {
            this.restorePageSelection();
            if (this.nested) this.updateFilterTableHeight();
          });
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(val) {
      const pageKeys = (this.materialList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean);
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          delete this.selectedRowMap[key];
        }
      });
      (val || []).forEach(row => {
        const key = this.getRowKey(row);
        if (key) {
          this.selectedRowMap[key] = row;
        }
      });
      this.selectRow = Object.values(this.selectedRowMap);
    },
    handleClose() {
      this.show = false;
      this.selectedRowMap = {};
      this.selectRow = [];
      this.$emit("closeDialog");
    },
    checkBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: "请先选择耗材产品", type: "warning" });
        return;
      }
      this.$emit("selectData", this.selectRow);
      this.handleClose();
    },
    rowMaterialIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    sortByStr(a, b, field) {
      const va = (a && a[field] != null) ? String(a[field]) : "";
      const vb = (b && b[field] != null) ? String(b[field]) : "";
      return va.localeCompare(vb, "zh-CN");
    },
    onFilterWindowResize() {
      this.updateFilterTableHeight();
    },
    updateFilterTableHeight() {
      if (!this.nested || !this.show) return;
      const run = () => {
        const panel = this.$refs.filterTablePanel;
        const pagWrap = this.$refs.filterPaginationWrap;
        if (!panel || !panel.getBoundingClientRect) return;
        const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
        if (!panelH) return;
        const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
        const next = Math.floor(panelH - pagH);
        const height = Math.max(200, next);
        if (Math.abs(this.filterTableHeight - height) >= 2) {
          this.filterTableHeight = height;
        }
        this.$nextTick(() => {
          const table = this.$refs.singleTable;
          if (table && table.doLayout) table.doLayout();
        });
      };
      this.$nextTick(run);
      requestAnimationFrame(run);
      ;[50, 120, 300].forEach((ms) => setTimeout(run, ms));
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.material-for-purchase-agg-select-full-modal.local-modal-mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.material-for-purchase-agg-select-full-modal .local-modal-content {
  height: 100vh;
  max-height: 100vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

<style lang="scss">
.material-for-purchase-agg-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.material-for-purchase-agg-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-query-panel {
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

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.material-for-purchase-agg-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.material-for-purchase-agg-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.material-for-purchase-agg-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>
