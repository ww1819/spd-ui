<template>
  <div v-show="show" class="local-modal-mask select-material-filter-mask">
    <div class="local-modal-content select-material-filter-content">
      <div class="modal-header">
        <div class="modal-title">可用库存（按耗材+仓库汇总）</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body" ref="modalBody">
        <div class="material-filter-query-card" ref="queryCard">
          <el-form
            :model="queryParams"
            ref="queryForm"
            :inline="true"
            label-width="0"
            size="small"
            class="query-form query-form-compact-fields"
          >
            <el-row :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="产品名称" prop="materialName" label-width="100px">
                  <el-input
                    v-model="queryParams.materialName"
                    placeholder="名称/编码/简码"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="型号" prop="materialModel" label-width="100px">
                  <el-input
                    v-model="queryParams.materialModel"
                    placeholder="型号"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouseName" label-width="100px">
                  <el-input
                    v-model="queryParams.warehouseName"
                    placeholder="仓库名称"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6" />
            </el-row>
            <el-row :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="规格" prop="materialSpeci" label-width="100px">
                  <el-input
                    v-model="queryParams.materialSpeci"
                    placeholder="规格"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="18" />
            </el-row>
          </el-form>
        </div>

        <div class="material-filter-between-actions" ref="actionBar">
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          <el-button size="small" @click="handleClose" style="margin-left: 12px;">取 消</el-button>
          <el-button type="primary" size="small" @click="checkBtn">确 定</el-button>
        </div>

        <div class="material-filter-table-section">
          <el-table
            ref="singleTable"
            v-loading="loading"
            class="material-filter-detail-table"
            :data="rowList"
            :row-class-name="rowIndex"
            :height="tableHeight"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
            border
            :cell-style="{ padding: '8px 4px' }"
          >
            <!-- 不用 fixed，避免 ElementUI 底部白色 patch 挡住翻页 -->
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="序号" align="center" width="60" show-overflow-tooltip resizable>
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
      </div>
      <!-- 翻页独立贴在弹窗最底部，不参与表格高度争夺，避免被裁切 -->
      <div class="stock-pagination-wrap" ref="paginationWrap">
        <pagination
          v-show="total > 0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="handlePagination"
        />
      </div>
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
    selectedDetails: Array
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      total: 0,
      rowList: [],
      tableHeight: 360,
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
    window.addEventListener("resize", this.layoutModal);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.layoutModal);
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
          // 再延迟一帧，等父页 is-select-filter-open 高度生效后再算一次
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
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  methods: {
    lockPageScroll() {
      this._prevBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // 供全局样式抬高「每页条数」下拉 z-index（弹窗为 3000，默认下拉约 2000 会被挡住）
      document.body.classList.add("dept-apply-stock-select-open");
    },
    unlockPageScroll() {
      document.body.classList.remove("dept-apply-stock-select-open");
      if (this._prevBodyOverflow !== undefined) {
        document.body.style.overflow = this._prevBodyOverflow;
        this._prevBodyOverflow = undefined;
      }
    },
    /** 弹窗精确贴合主内容区可视矩形，底部翻页（含每页条数）不再被裁切 */
    syncMaskToAppMain() {
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
      this.syncMaskToAppMain();
      this.$nextTick(() => this.updateTableHeight());
    },
    /** 按「内容区高度 - 顶栏 - 查询 - 按钮 - 翻页栏」计算表格高度 */
    updateTableHeight() {
      if (!this.show) return;
      const content = this.$el && this.$el.querySelector(".select-material-filter-content");
      const header = this.$el && this.$el.querySelector(".modal-header");
      if (!content) return;
      const queryH = (this.$refs.queryCard && this.$refs.queryCard.offsetHeight) || 0;
      const actionH = (this.$refs.actionBar && this.$refs.actionBar.offsetHeight) || 0;
      const headerH = (header && header.offsetHeight) || 48;
      // 翻页栏（含「每页条数」下拉）固定预留，保证完整露出
      const pageH = Math.max(
        (this.$refs.paginationWrap && this.$refs.paginationWrap.offsetHeight) || 0,
        64
      );
      const next = Math.floor(content.clientHeight - headerH - queryH - actionH - pageH - 12);
      this.tableHeight = Math.max(160, next);
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
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
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
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
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

.modal-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 6px 20px 0;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.material-filter-query-card {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  padding: 8px 16px 8px;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #c0c4cc;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.material-filter-query-card .query-form-row + .query-form-row {
  margin-top: 10px;
}

.material-filter-between-actions {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  padding: 8px 16px;
  margin-top: 0;
  margin-bottom: 0;
  text-align: left;
  flex-shrink: 0;
}

.material-filter-table-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.material-filter-detail-table {
  width: 100% !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 0;
}

/* 翻页固定在弹窗内容最底部；预留高度保证「每页条数」完整可见 */
.stock-pagination-wrap {
  flex-shrink: 0;
  flex-grow: 0;
  background: #fff;
  min-height: 52px;
  padding: 10px 16px 14px;
  border-top: 1px solid #EBEEF5;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
  overflow: visible;
}

::v-deep .stock-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

::v-deep .stock-pagination-wrap .el-pagination {
  white-space: nowrap;
  padding: 0;
}

::v-deep .material-filter-detail-table .el-table__body-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}

::v-deep .material-filter-detail-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .material-filter-detail-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .material-filter-detail-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.query-form {
  background: transparent;
  padding: 0;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}

.query-form .el-form-item {
  margin-bottom: 0;
}

.query-form .el-form-item__label {
  line-height: 36px;
  padding-right: 8px;
}

.query-form-row {
  margin-bottom: 0 !important;
}

::v-deep .query-form-compact-fields .el-input,
::v-deep .query-form-compact-fields .el-select {
  width: 220px !important;
  max-width: 220px !important;
}

::v-deep .query-form-compact-fields .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 36px !important;
}

::v-deep .query-form-compact-fields .el-input__inner,
::v-deep .query-form-compact-fields .el-select .el-input__inner,
::v-deep .query-form-compact-fields .el-range-editor.el-input__inner {
  height: 36px !important;
  min-height: 36px !important;
  line-height: 36px !important;
  font-size: 13px !important;
  box-sizing: border-box;
}

::v-deep .query-form-compact-fields .el-input__icon {
  line-height: 36px !important;
}

::v-deep .query-form-compact-fields.el-form--inline .el-form-item {
  vertical-align: middle;
}
</style>

<!-- 非 scoped：每页条数下拉挂到 body，需高于库存弹窗 z-index:3000 -->
<style>
body.dept-apply-stock-select-open .el-select-dropdown {
  z-index: 4000 !important;
}
body.dept-apply-stock-select-open .el-popper {
  z-index: 4000 !important;
}
</style>
