<template>
  <!-- 叠在出库申请页内「新增出库」遮罩上：absolute 铺满 .app-container，与 SelectDApply / 到货验收添加明细一致 -->
  <div v-show="show" class="select-ref-bill-root">
    <div class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">采购入库单</div>
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
                  <el-form-item label="采购入库号" prop="billNo" label-width="100px">
                    <el-input
                      v-model="queryParams.billNo"
                      placeholder="采购入库号"
                      clearable
                      @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="供应商" prop="supplierId" label-width="100px">
                    <SelectSupplier v-model="queryParams.supplierId" :value2="isShow" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <SelectDepartment v-model="queryParams.departmentId" :value2="isShow" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12" class="query-form-row">
                <el-col :span="6">
                  <el-form-item label="耗材" prop="materialId" label-width="100px">
                    <SelectMaterial v-model="queryParams.materialId" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="引用状态" label-width="100px">
                    <el-select v-model="queryParams.params.docRefStatus" clearable placeholder="全部" style="width: 100%">
                      <el-option v-for="o in docRefStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
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
              class="material-filter-detail-table"
              v-loading="loading"
              :data="warehouseList"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
              <el-table-column label="入库单编号" align="center" prop="billNo" width="180">
                <template slot-scope="scope">
                  <el-button type="text" @click="handleView(scope.row)">
                    <span>{{ scope.row.billNo }}</span>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable />
              <el-table-column label="订单日期" align="center" prop="orderDate" width="180">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
              <el-table-column label="金额" align="center" prop="totalAmount">
                <template slot-scope="scope">
                  <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="引用状态" align="center" prop="docRefStatus" width="100">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
                  <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
                  <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column label="订单状态" align="center" prop="orderStatus">
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus" />
                </template>
              </el-table-column>
              <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    icon="el-icon-view"
                    @click="handleView(scope.row)"
                    v-hasPermi="['department:dApply:view']"
                  >查看</el-button>
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

    <el-dialog :title="title" :visible.sync="open" append-to-body width="90%" top="4vh" @close="open = false">
      <el-table :data="stkIoBillEntryList" border max-height="520" size="small">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.name) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="qty" width="90" align="right" />
        <el-table-column label="已引用数量" prop="srcRefedQty" width="110" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可引用数量" prop="srcRefableQty" width="110" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" width="120" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import { listWarehouse, getInWarehouse } from "@/api/warehouse/warehouse";
import { DOC_REF_STATUS_OPTIONS } from "@/utils/docRefStatus";

export default {
  name: "SelectRkApply",
  dicts: ["biz_status"],
  components: { SelectMaterial, SelectWarehouse, SelectDepartment, SelectSupplier },
  props: ["DialogComponentShow", "warehouseValue", "departmentValue", "materialValue", "supplierValue"],
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      showSearch: true,
      total: 0,
      warehouseList: [],
      stkIoBillEntryList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        applyBillNo: null,
        warehouseId: null,
        departmentId: null,
        supplierId: null,
        materialId: null,
        params: {}
      },
      form: {}
    };
  },
  mounted() {
    this.syncOpenFromProp();
  },
  watch: {
    DialogComponentShow(val) {
      if (val) {
        this.syncOpenFromProp();
      } else {
        this.show = false;
      }
    }
  },
  methods: {
    syncOpenFromProp() {
      this.show = !!this.DialogComponentShow;
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.supplierId = this.supplierValue;
      this.queryParams.departmentId = this.departmentValue;
      this.queryParams.materialId = this.materialValue;
      if (this.show) {
        this.getList();
      }
    },
    getList() {
      this.queryParams.billType = "101";
      this.queryParams.billStatus = "2";
      this.loading = true;
      listWarehouse(this.queryParams)
        .then(response => {
          this.warehouseList = response.rows || [];
          this.total = response.total || 0;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 10;
      this.queryParams.params = this.queryParams.params || {};
      this.queryParams.params.docRefStatus = null;
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.supplierId = this.supplierValue;
      this.queryParams.departmentId = this.departmentValue;
      this.queryParams.materialId = this.materialValue;
      this.handleQuery();
    },
    handleSelectionChange(val) {
      this.selectRow = val || [];
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
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleView(row) {
      const id = row.id;
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;
        this.form.orderStatus = "0";
        this.form.orderType = "1";
        this.title = "查看入库单明细";
      });
    }
  }
};
</script>

<style scoped>
.select-ref-bill-root {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
  bottom: 0;
  z-index: 1100;
  box-sizing: border-box;
}

.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
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
  min-height: 0;
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
</style>
