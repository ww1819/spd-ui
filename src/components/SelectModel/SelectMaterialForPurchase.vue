<template>
  <div v-show="show" class="local-modal-mask material-for-purchase-select-modal">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">选择耗材产品</div>
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
                <el-form-item label="耗材编码" prop="code" label-width="100px">
                  <el-input
                    v-model="queryParams.code"
                    placeholder="耗材编码"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplierId" label-width="100px">
                  <SelectSupplier v-model="queryParams.supplierId" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="品牌" prop="brand" label-width="100px">
                  <el-input
                    v-model="queryParams.brand"
                    placeholder="品牌"
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
                <el-form-item label="耗材名称" prop="name" label-width="100px">
                  <el-input
                    v-model="queryParams.name"
                    placeholder="耗材名称"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="规格" prop="speci" label-width="100px">
                  <el-input
                    v-model="queryParams.speci"
                    placeholder="规格"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12" />
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
            :data="materialList"
            :row-class-name="rowMaterialIndex"
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
                <span v-if="scope.row.price || scope.row.prince">¥{{ parseFloat(scope.row.price || scope.row.prince).toFixed(2) }}</span>
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
import { listMaterialDeptSafe } from "@/api/foundation/material";
import { listFixedNumberForPurchase } from "@/api/monitoring/fixedNumber";
/** 科室场景用低敏供应商接口 listDeptSafe，避免依赖 foundation:supplier:list */
import SelectSupplier from "@/components/SelectModel/SelectSupplierDept";

export default {
  name: "SelectMaterialForPurchase",
  components: { SelectSupplier },
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String]
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      materialList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        speci: null,
        supplierId: null,
        brand: null,
        isGz: "2"
      },
      form: {},
      fixedNumberMaterialIds: [],
      allFilteredMaterials: []
    };
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.queryParams.pageNum = 1;
        if (this.warehouseValue) {
          this.loadFixedNumberMaterials(this.warehouseValue);
        }
        this.getList();
      }
    },
    warehouseValue(newVal) {
      if (newVal) {
        this.loadFixedNumberMaterials(newVal);
        this.getList();
      } else {
        this.fixedNumberMaterialIds = [];
        this.getList();
      }
    }
  },
  mounted() {
    this.show = this.DialogComponentShow;
    if (this.warehouseValue) {
      this.loadFixedNumberMaterials(this.warehouseValue);
    }
    this.getList();
  },
  created() {},
  methods: {
    loadFixedNumberMaterials(warehouseId) {
      if (!warehouseId) {
        this.fixedNumberMaterialIds = [];
        return;
      }
      try {
        const storageKey = `fixedNumber_1_${warehouseId}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const fixedNumberList = JSON.parse(savedData);
          this.fixedNumberMaterialIds = fixedNumberList
            .filter(item => item.material && item.material.id)
            .map(item => item.material.id)
            .filter(id => id);
        } else {
          this.fixedNumberMaterialIds = [];
        }
      } catch (error) {
        console.error("加载定数监测数据失败:", error);
        this.fixedNumberMaterialIds = [];
      }
    },
    buildPurchaseQueryParams() {
      const q = {
        warehouseId: this.warehouseValue,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        materialName: this.queryParams.name || this.queryParams.code || undefined
      };
      if (this.queryParams.speci) {
        q["material.speci"] = this.queryParams.speci;
      }
      return q;
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    getList() {
      this.loading = true;
      if (this.warehouseValue) {
        listFixedNumberForPurchase(this.buildPurchaseQueryParams())
          .then(response => {
            const rows = response.rows || [];
            this.total = response.total != null ? Number(response.total) : rows.length;
            this.allFilteredMaterials = rows;
            this.materialList = rows.slice();
            this.loading = false;
          })
          .catch(() => {
            this.loading = false;
          });
        return;
      }
      listMaterialDeptSafe()
        .then(response => {
          let materialList = Array.isArray(response) ? response : [];
          const code = (this.queryParams.code || "").toLowerCase();
          const name = (this.queryParams.name || "").toLowerCase();
          const speci = (this.queryParams.speci || "").toLowerCase();
          const brand = (this.queryParams.brand || "").toLowerCase();
          const supplierId = this.queryParams.supplierId;
          materialList = materialList.filter(item => {
            const okCode = !code || (item.code || "").toLowerCase().includes(code);
            const okName = !name || (item.name || "").toLowerCase().includes(name);
            const okSpec = !speci || (item.speci || "").toLowerCase().includes(speci);
            const okBrand = !brand || (item.brand || "").toLowerCase().includes(brand);
            const okSupplier = !supplierId || String(item.supplierId) === String(supplierId);
            return okCode && okName && okSpec && okBrand && okSupplier;
          });
          this.allFilteredMaterials = materialList;
          this.total = materialList.length;
          const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
          const end = start + this.queryParams.pageSize;
          this.materialList = materialList.slice(start, end);
          this.loading = false;
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
      this.queryParams.isGz = "2";
      this.handleQuery();
    },
    handleSelectionChange(val) {
      this.selectRow = val;
    },
    handleClose() {
      this.show = false;
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
    handleDeleteRow(index) {
      this.materialList.splice(index, 1);
      this.total = this.materialList.length;
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

.material-for-purchase-select-modal ::v-deep .material-filter-table-section .pagination-container {
  padding: 8px 16px 12px;
}
</style>
