<template>
  <div v-show="show" class="local-modal-mask dept-apply-stock-select-modal">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">可用库存（按耗材+仓库汇总）</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
        <!-- 与到货验收「添加明细」SelectMaterialFilter 一致 -->
        <div class="material-filter-query-card">
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

        <div class="material-filter-between-actions">
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
            @selection-change="handleSelectionChange"
            height="calc(55vh)"
            border
            :cell-style="{ padding: '8px 4px' }"
          >
            <el-table-column type="selection" fixed="left" width="50" align="center" />
            <el-table-column label="序号" fixed="left" align="center" width="60" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouseName" min-width="120" show-overflow-tooltip resizable />
            <el-table-column label="编码" align="center" prop="materialCode" width="130" min-width="130" show-overflow-tooltip resizable />
            <el-table-column label="名称" align="center" min-width="180" resizable>
              <template slot-scope="scope">
                <div class="name-with-spec-cell">
                  <div class="name-with-spec-primary">{{ scope.row.materialName || '--' }}</div>
                  <div class="name-with-spec-secondary">{{ scope.row.materialSpeci || '--' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="materialModel" min-width="100" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable />
            <el-table-column label="本仓可用数量" align="center" prop="availableQty" width="120" min-width="110" show-overflow-tooltip resizable />
            <el-table-column label="参考单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable />
            <el-table-column label="生产厂家" align="center" prop="factoryName" min-width="120" show-overflow-tooltip resizable />
          </el-table>

          <pagination
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="handlePagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listDeptApplyAvailableStock } from "@/api/warehouse/inventory";

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
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null
      }
    };
  },
  mounted() {
    this.show = this.DialogComponentShow || false;
    if (this.show) {
      this.getList();
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.queryParams.pageNum = 1;
        this.getList();
        this.$nextTick(() => this.markSelectedItems());
      }
    },
    selectedDetails: {
      handler() {
        if (this.show && this.rowList && this.rowList.length) {
          this.$nextTick(() => this.markSelectedItems());
        }
      },
      deep: true
    }
  },
  methods: {
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    getList() {
      this.loading = true;
      listDeptApplyAvailableStock(this.queryParams)
        .then(response => {
          const rows = response.rows || [];
          if (this.selectedDetails && this.selectedDetails.length) {
            const existed = new Set(
              this.selectedDetails
                .filter(d => d && d.materialId != null)
                .map(d => {
                  const wid = d.stockWarehouseId != null && d.stockWarehouseId !== "" ? d.stockWarehouseId : "x";
                  return `${d.materialId}__${wid}`;
                })
            );
            this.rowList = rows.filter(it => {
              if (!it || it.materialId == null || it.warehouseId == null) return true;
              return !existed.has(`${it.materialId}__${it.warehouseId}`);
            });
          } else {
            this.rowList = rows;
          }
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => this.markSelectedItems());
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
        pageSize: 10,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null
      };
      this.getList();
    },
    handleSelectionChange(val) {
      this.selectRow = val;
    },
    handleClose() {
      this.show = false;
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
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
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
  height: 100vh;
  max-height: 100vh;
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
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
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
  overflow-y: auto;
  overflow-x: auto;
  padding: 6px 20px 16px;
  background: #fff;
}

.material-filter-table-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
}

.material-filter-detail-table {
  width: 100% !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

::v-deep .material-filter-detail-table .el-table__body-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}

::v-deep .material-filter-detail-table th {
  background-color: #ebeef5 !important;
  color: #606266;
  font-weight: 600;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

::v-deep .material-filter-detail-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

::v-deep .material-filter-detail-table tr:hover > td {
  background-color: #f5f7fa !important;
  transition: all 0.3s;
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

.dept-apply-stock-select-modal ::v-deep .material-filter-table-section .pagination-container {
  padding: 8px 16px 12px;
}

/* 名称列内：规格单独占第二行 */
.name-with-spec-cell {
  line-height: 1.35;
  text-align: center;
  padding: 2px 0;
}

.name-with-spec-primary {
  color: #303133;
  word-break: break-all;
}

.name-with-spec-secondary {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  word-break: break-all;
}
</style>
