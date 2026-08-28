<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask dept-apply-stock-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'dept-apply-stock-select-full-modal': !nested,
      'select-material-filter-mask': !nested
    }"
  >
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested,
        'select-material-filter-content': !nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form dept-apply-stock-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel" ref="queryCard">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="产品名称" prop="materialName" label-width="84px">
                <el-input
                  v-model="queryParams.materialName"
                  placeholder="名称/编码/简码"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="型号" prop="materialModel">
                <el-input
                  v-model="queryParams.materialModel"
                  placeholder="型号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="仓库" prop="warehouseName">
                <el-input
                  v-model="queryParams.warehouseName"
                  placeholder="仓库名称"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="规格" prop="materialSpeci">
                <el-input
                  v-model="queryParams.materialSpeci"
                  placeholder="规格"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar" ref="actionBar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">可用库存明细信息</span>
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
            :data="rowList"
            :row-class-name="rowIndex"
            :height="filterTableHeight"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
            border
            stripe
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="编码" align="center" prop="materialCode" width="130" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable />
            <el-table-column label="型号" align="center" prop="materialModel" width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="本仓可用数量" align="center" prop="availableQty" width="120" show-overflow-tooltip resizable />
            <el-table-column label="参考单价" align="center" prop="unitPrice" width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="生产厂家" align="center" prop="factoryName" width="160" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
            <el-table-column label="注册证号" align="center" prop="registerNo" width="160" show-overflow-tooltip resizable />
            <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable />
            <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable />
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

        <div v-else class="modal-detail-section apply-modal-table-panel material-filter-table-section">
          <div class="table-wrapper">
            <el-table
              ref="singleTable"
              v-loading="loading"
              class="apply-detail-table material-filter-detail-table"
              :data="rowList"
              :row-class-name="rowIndex"
              :height="tableHeight"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
              border
            >
              <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
              <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="编码" align="center" prop="materialCode" width="130" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable />
              <el-table-column label="型号" align="center" prop="materialModel" width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="本仓可用数量" align="center" prop="availableQty" width="120" show-overflow-tooltip resizable />
              <el-table-column label="参考单价" align="center" prop="unitPrice" width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="生产厂家" align="center" prop="factoryName" width="160" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" />
              <el-table-column label="注册证号" align="center" prop="registerNo" width="160" show-overflow-tooltip resizable />
              <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable />
              <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable />
            </el-table>
          </div>
          <div class="apply-pagination-wrap stock-pagination-wrap" ref="paginationWrap">
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
import { listDeptApplyAvailableStock } from "@/api/warehouse/inventory";
import { normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  name: "SelectDepartmentApplyAvailableStock",
  props: {
    DialogComponentShow: [Boolean],
    selectedDetails: Array,
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: "可用库存（按耗材+仓库汇总）"
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      total: 0,
      rowList: [],
      tableHeight: 360,
      filterTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null,
        excludeMaterialWarehousePairs: null,
        orderByColumn: null,
        isAsc: null
      },
      selectedRowMap: {}
    };
  },
  mounted() {
    this.show = this.DialogComponentShow || false;
    if (this.show) {
      this.lockPageScroll();
      this.getList();
      this.$nextTick(() => this.layoutModal());
    }
    window.addEventListener("resize", this.onWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
    this.unlockPageScroll();
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        this.lockPageScroll();
        this.getList();
        this.$nextTick(() => {
          this.layoutModal();
          this.markSelectedItems();
          setTimeout(() => this.layoutModal(), 50);
        });
      } else {
        this.unlockPageScroll();
        this.clearMaskPosition();
      }
    },
    selectedDetails: {
      handler() {
        if (this.show && this.rowList && this.rowList.length) {
          this.$nextTick(() => this.markSelectedItems());
        }
      },
      deep: true
    },
    total() {
      this.$nextTick(() => this.layoutModal());
    }
  },
  methods: {
    onWindowResize() {
      this.layoutModal();
    },
    lockPageScroll() {
      this._prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.classList.add("dept-apply-stock-select-open");
    },
    unlockPageScroll() {
      document.body.classList.remove("dept-apply-stock-select-open");
      if (this._prevBodyOverflow !== undefined) {
        document.body.style.overflow = this._prevBodyOverflow;
        this._prevBodyOverflow = undefined;
      }
    },
    syncMaskToAppMain() {
      if (this.nested) return;
      const mask = this.$el;
      const main = document.querySelector(".app-main");
      if (!mask || !main) return;
      const rect = main.getBoundingClientRect();
      mask.style.position = "fixed";
      mask.style.top = `${Math.max(0, rect.top)}px`;
      mask.style.left = `${Math.max(0, rect.left)}px`;
      mask.style.width = `${rect.width}px`;
      mask.style.height = `${rect.height}px`;
      mask.style.right = "auto";
      mask.style.bottom = "auto";
      mask.style.zIndex = "3000";
    },
    clearMaskPosition() {
      if (this.nested) return;
      const mask = this.$el;
      if (!mask || !mask.style) return;
      mask.style.position = "";
      mask.style.top = "";
      mask.style.left = "";
      mask.style.width = "";
      mask.style.height = "";
      mask.style.right = "";
      mask.style.bottom = "";
      mask.style.zIndex = "";
    },
    layoutModal() {
      if (!this.show) return;
      if (this.nested) {
        this.updateFilterTableHeight();
        return;
      }
      this.syncMaskToAppMain();
      this.$nextTick(() => this.updateTableHeight());
    },
    updateTableHeight() {
      if (!this.show || this.nested) return;
      const content = this.$el && this.$el.querySelector(".select-material-filter-content");
      const header = this.$el && this.$el.querySelector(".modal-header");
      if (!content) return;
      const queryH = (this.$refs.queryCard && this.$refs.queryCard.offsetHeight) || 0;
      const actionH = (this.$refs.actionBar && this.$refs.actionBar.offsetHeight) || 0;
      const headerH = (header && header.offsetHeight) || 48;
      const pageH = Math.max(
        (this.$refs.paginationWrap && this.$refs.paginationWrap.offsetHeight) || 0,
        64
      );
      const next = Math.floor(content.clientHeight - headerH - queryH - actionH - pageH - 12);
      this.tableHeight = Math.max(160, next);
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
    },
    getRowKey(row) {
      if (!row || row.materialId == null || row.warehouseId == null) return null;
      return `${row.materialId}__${row.warehouseId}`;
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        warehouseName: "warehouseName",
        materialCode: "materialCode",
        materialName: "materialName",
        materialModel: "materialModel",
        unitName: "unitName",
        unitPrice: "unitPrice",
        factoryName: "factoryName"
      };
      if (!order) {
        this.queryParams.orderByColumn = null;
        this.queryParams.isAsc = null;
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    buildListQueryParams() {
      const q = { ...this.queryParams };
      q.materialName = normalizeMaterialSearchKeyword(q.materialName) || null;
      q.materialSpeci = normalizeMaterialSearchKeyword(q.materialSpeci) || null;
      q.materialModel = normalizeMaterialSearchKeyword(q.materialModel) || null;
      q.warehouseName = normalizeMaterialSearchKeyword(q.warehouseName) || null;
      if (!q.orderByColumn) {
        delete q.orderByColumn;
        delete q.isAsc;
      }
      return q;
    },
    getList() {
      this.loading = true;
      const q = this.buildListQueryParams();
      q.excludeMaterialWarehousePairs = this.buildExcludePairsParam();
      listDeptApplyAvailableStock(q)
        .then(response => {
          this.rowList = response.rows || [];
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => {
            this.layoutModal();
            this.markSelectedItems();
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
      this.queryParams = {
        pageNum: 1,
        pageSize: this.queryParams.pageSize || 20,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null,
        excludeMaterialWarehousePairs: null,
        orderByColumn: null,
        isAsc: null
      };
      if (this.$refs.singleTable) {
        this.$refs.singleTable.clearSort();
      }
      this.getList();
    },
    buildExcludePairsParam() {
      const details = Array.isArray(this.selectedDetails) ? this.selectedDetails : [];
      if (!details.length) {
        return null;
      }
      const normalizeId = (v) => {
        if (v == null) return null;
        const s = String(v).trim();
        return s === "" ? null : s;
      };
      const keys = details
        .filter(d => d && d.materialId != null)
        .map(d => {
          const wid = normalizeId(
            d.stockWarehouseId != null
              ? d.stockWarehouseId
              : (d.stockWarehouse && d.stockWarehouse.id != null
                ? d.stockWarehouse.id
                : (d.warehouseId != null ? d.warehouseId : null))
          );
          if (wid == null) return null;
          const mid = normalizeId(d.materialId);
          if (mid == null) return null;
          return `${mid}__${wid}`;
        })
        .filter(Boolean);
      if (!keys.length) {
        return null;
      }
      return Array.from(new Set(keys)).join(",");
    },
    handleSelectionChange(val) {
      const pageKeys = (this.rowList || [])
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
      this.unlockPageScroll();
      this.clearMaskPosition();
      this.$emit("closeDialog");
    },
    checkBtn() {
      if (!this.selectRow || !this.selectRow.length) {
        this.$message({ message: "请先选择数据", type: "warning" });
        return;
      }
      this.$emit("selectData", this.selectRow);
      this.handleClose();
    },
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      return "";
    },
    markSelectedItems() {
      if (!this.$refs.singleTable || !this.rowList || !this.rowList.length) return;
      this.$refs.singleTable.clearSelection();
      this.rowList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
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
  overflow: hidden;
}

.dept-apply-stock-select-full-modal.local-modal-mask {
  position: fixed;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
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
.dept-apply-stock-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.dept-apply-stock-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dept-apply-stock-select-mask .local-modal-content .apply-modal-query-panel {
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

.dept-apply-stock-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.dept-apply-stock-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.dept-apply-stock-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.dept-apply-stock-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.dept-apply-stock-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dept-apply-stock-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.dept-apply-stock-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>

<style>
body.dept-apply-stock-select-open .el-select-dropdown {
  z-index: 4000 !important;
}
body.dept-apply-stock-select-open .el-popper {
  z-index: 4000 !important;
}
</style>
