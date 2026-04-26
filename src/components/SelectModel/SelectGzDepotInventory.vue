<template>
  <div v-show="show" class="local-modal-mask gz-depot-inventory-select-modal">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">高值备货库存明细</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
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
              <el-col :span="6">
                <el-form-item label="院内码" prop="inHospitalCode" label-width="100px">
                  <el-input
                    v-model="queryParams.inHospitalCode"
                    placeholder="院内码（支持模糊搜索）"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplierId" label-width="100px">
                  <SelectSupplier v-model="queryParams.supplierId" :value2="isShow" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="耗材" prop="materialId" label-width="100px">
                  <SelectMaterial v-model="queryParams.materialId" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12" class="query-form-row">
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
            :data="depotInventoryList"
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
            <el-table-column label="耗材" align="center" prop="material.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库存数量" align="center" prop="qty" width="90" min-width="90" show-overflow-tooltip resizable />
            <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable />
            <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable />
            <el-table-column label="生产日期" align="center" prop="materialDate" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="有效期" align="center" prop="endTime" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable />
            <el-table-column label="院内码" align="center" prop="inHospitalCode" width="180" show-overflow-tooltip resizable />
            <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable />
            <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
            <el-table-column label="耗材日期" align="center" prop="materialDate" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="入库日期" align="center" prop="warehouseDate" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
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
import { listDepotInventory } from "@/api/gz/depotInventory";
import { parseTime } from "@/utils/ruoyi";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";

export default {
  name: "SelectGzDepotInventory",
  components: { SelectMaterial, SelectWarehouse, SelectSupplier },
  props: ["DialogComponentShow", "warehouseValue", "supplierValue"],
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
      depotInventoryList: [],
      unitOptions: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialId: null,
        supplierId: null,
        batchNo: null,
        inHospitalCode: null
      },
      form: {},
      selectedRowMap: {}
    };
  },
  mounted() {
    this.show = this.DialogComponentShow;
    this.queryParams.warehouseId = this.warehouseValue;
    this.queryParams.supplierId = this.supplierValue;
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
        this.queryParams.warehouseId = this.warehouseValue;
        this.queryParams.supplierId = this.supplierValue;
        this.getList();
      }
    }
  },
  created() {},
  methods: {
    parseTime,
    getRowKey(row) {
      if (!row) return null;
      if (row.id != null) return String(row.id);
      if (row.materialId != null && row.batchNo) return `${row.materialId}__${row.batchNo}`;
      return null;
    },
    restorePageSelection() {
      if (!this.$refs.singleTable || !this.depotInventoryList || this.depotInventoryList.length === 0) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      this.depotInventoryList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    getList() {
      this.loading = true;
      listDepotInventory(this.queryParams)
        .then(response => {
          this.depotInventoryList = response.rows || [];
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => this.restorePageSelection());
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
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.supplierId = this.supplierValue;
      this.handleQuery();
    },
    handleSelectionChange(val) {
      const pageKeys = (this.depotInventoryList || [])
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
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
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

.gz-depot-inventory-select-modal ::v-deep .material-filter-table-section .pagination-container {
  padding: 8px 16px 12px;
}
</style>
