<template>
  <div v-show="show" class="local-modal-mask inventory-select-full-modal">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">库存明细</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
        <!-- 与到货验收「添加明细」SelectMaterialFilter：顶栏查询卡片 + 中间按钮 + 明细表同宽 -->
        <div class="material-filter-query-card">
          <el-form
            :model="queryParams"
            ref="queryForm"
            :inline="true"
            v-show="showSearch"
            label-width="0"
            size="small"
            class="query-form query-form-compact-fields"
          >
            <el-row :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                  <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow" />
                </el-form-item>
              </el-col>
              <el-col v-if="!hideSupplierQuery" :span="6">
                <el-form-item label="供应商" prop="supplierId" label-width="100px">
                  <SelectSupplier v-model="queryParams.supplierId" :value2="false" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="入库批次号" prop="batchNo" label-width="100px">
                  <el-input
                    v-model="queryParams.batchNo"
                    placeholder="入库批次号"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col v-if="hideSupplierQuery" :span="12" />
            </el-row>
            <el-row :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="产品名称" prop="materialName" label-width="100px">
                  <el-input
                    v-model="queryParams.materialName"
                    placeholder="可输入部分品名、拼音简码或耗材编码"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="规格" prop="materialSpeci" label-width="100px">
                  <el-input
                    v-model="queryParams.materialSpeci"
                    placeholder="请输入规格，支持模糊搜索"
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
                    placeholder="请输入型号，支持模糊搜索"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6" />
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
            :data="inventoryList"
            :row-class-name="inventoryIndex"
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
            <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable />
            <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable />
            <el-table-column label="型号" align="center" prop="material.model" width="180" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="100" show-overflow-tooltip resizable />
            <el-table-column label="库存数量" align="center" prop="qty" min-width="100" width="100" show-overflow-tooltip resizable />
            <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable />
            <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable />
            <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
            <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable />
            <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable />
            <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable />
            <el-table-column label="有效期" align="center" prop="endTime" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginTime" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable />
            <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
            <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable />
            <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable />
            <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable />
            <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable />
            <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                <span v-else>--</span>
              </template>
            </el-table-column>
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
import { listInventory } from "@/api/warehouse/inventory";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
/** 下拉用 listDeptSafe，避免依赖 foundation:supplier:list（科室审核/库存选择等场景） */
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";

export default {
  name: "SelectInventory",
  dicts: ['way_status'],
  components: { SelectWarehouse, SelectSupplier },
  props: {
    DialogComponentShow: [Boolean],
    warehouseValue: [String, Number],
    supplierValue: [String, Number],
    selectedDetails: Array,
    /** 为 true 时不展示供应商条件，查询固定使用 supplierValue（如采购退货申请） */
    hideSupplierQuery: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      unitOptions: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialId: null,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        supplierId: null,
        batchNo: null
      },
      form: {},
      selectedRowMap: {}
    };
  },
  mounted() {
    this.show = this.DialogComponentShow || false;
    this.queryParams.warehouseId = this.warehouseValue;
    this.applyHeaderSupplierFilter();
    if (this.show) {
      this.getList();
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        this.applyHeaderSupplierFilter();
        this.getList();
        this.$nextTick(() => {
          if (this.inventoryList && this.inventoryList.length > 0) {
            this.markSelectedItems();
          }
        });
      }
    },
    selectedDetails: {
      handler() {
        if (this.show && this.inventoryList && this.inventoryList.length > 0) {
          this.$nextTick(() => {
            this.markSelectedItems();
          });
        }
      },
      deep: true
    }
  },
  created() {},
  methods: {
    getRowKey(row) {
      if (!row) return null;
      if (row.id != null) return String(row.id);
      if (row.materialId != null && row.batchNo) return `${row.materialId}__${row.batchNo}`;
      return null;
    },
    applyHeaderSupplierFilter() {
      if (this.hideSupplierQuery) {
        this.queryParams.supplierId = this.supplierValue;
        this.queryParams.warehouseId = this.warehouseValue;
      }
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    getList() {
      this.applyHeaderSupplierFilter();
      this.loading = true;
      listInventory(this.queryParams)
        .then(response => {
          const rows = response.rows || [];
          if (this.selectedDetails && this.selectedDetails.length) {
            const existedKeySet = new Set(
              this.selectedDetails
                .filter(d => d && d.materialId != null && d.batchNo)
                .map(d => `${d.materialId}__${d.batchNo}`)
            );
            const existedInvIds = new Set(
              this.selectedDetails
                .map((d) => (d && d.kcNo != null && d.kcNo !== "" ? String(d.kcNo) : ""))
                .filter((s) => s)
            );
            this.inventoryList = rows.filter((it) => {
              if (!it) {
                return true;
              }
              if (it.id != null && existedInvIds.has(String(it.id))) {
                return false;
              }
              const key = it.materialId != null && it.batchNo ? `${it.materialId}__${it.batchNo}` : null;
              return !key || !existedKeySet.has(key);
            });
          } else {
            this.inventoryList = rows;
          }
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => {
            this.markSelectedItems();
          });
        })
        .catch(() => {
          this.loading = false;
        });
    },
    markSelectedItems() {
      if (!this.inventoryList || !this.inventoryList.length || !this.$refs.singleTable) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      const selectedRows = [];
      this.inventoryList.forEach(inventoryItem => {
        const key = this.getRowKey(inventoryItem);
        if (key && this.selectedRowMap[key]) {
          selectedRows.push(inventoryItem);
        }
      });
      this.inventoryList.forEach(inventoryItem => {
        const isSelected = this.selectedDetails.some(detail => {
          return detail.materialId === inventoryItem.materialId && detail.batchNo === inventoryItem.batchNo;
        });
        if (isSelected) {
          selectedRows.push(inventoryItem);
        }
      });
      if (selectedRows.length > 0 && this.$refs.singleTable) {
        selectedRows.forEach(row => {
          this.$refs.singleTable.toggleRowSelection(row, true);
        });
      }
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.applyHeaderSupplierFilter();
      this.handleQuery();
    },
    handleSelectionChange(val) {
      const pageKeys = (this.inventoryList || [])
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
        this.$message({ message: "请先选择数据", type: "warning" });
        return;
      }
      this.$emit("selectData", this.selectRow);
      this.handleClose();
    },
    inventoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
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

/* 分页始终占位展示，压缩默认大内边距 */
.inventory-select-full-modal ::v-deep .material-filter-table-section .pagination-container {
  padding: 8px 16px 12px;
}
</style>
