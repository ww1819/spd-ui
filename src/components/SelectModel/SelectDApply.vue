<template>
  <!-- 叠在出库申请页内「新增出库」遮罩上：用 absolute 铺满 .app-container，避免 fixed+100vw 相对视口跑出主弹窗区域 -->
  <div v-show="show" class="select-ref-bill-root">
    <div class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">引用仓库申请单</div>
          <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
        </div>
        <div class="modal-body">
          <!-- 与到货验收「添加明细」SelectMaterialFilter 顶栏查询卡片一致 -->
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
                  <el-form-item label="仓库申请单号" prop="applyBillNo" label-width="110px">
                    <el-input
                      v-model="queryParams.applyBillNo"
                      placeholder="单号"
                      clearable
                      @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="科室申领单号" prop="basApplyBillNo" label-width="110px">
                    <el-input
                      v-model="queryParams.basApplyBillNo"
                      placeholder="原申领单号"
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
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <SelectDepartment v-model="queryParams.departmentId" />
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
              ref="whTable"
              class="material-filter-detail-table"
              v-loading="loading"
              :data="whApplyList"
              :row-class-name="whApplyIndex"
              @selection-change="handleSelectionChangeWh"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
              <el-table-column label="仓库申请单号" align="center" prop="applyBillNo" min-width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <el-button type="text" @click="handleViewWh(scope.row)">
                    <span>{{ scope.row.applyBillNo }}</span>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="科室申领单号" align="center" prop="basApplyBillNo" min-width="140" show-overflow-tooltip resizable />
              <el-table-column label="仓库" align="center" min-width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="科室" align="center" prop="department.name" min-width="100" show-overflow-tooltip resizable />
              <el-table-column label="待出库数量" align="center" prop="pendingOutboundTotal" width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.pendingOutboundTotal != null ? Number(scope.row.pendingOutboundTotal).toFixed(2) : '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="源审核日期" align="center" prop="sourceAuditDate" width="160" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.sourceAuditDate">{{ parseTime(scope.row.sourceAuditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                  <span v-else>—</span>
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

    <el-dialog :title="detailTitle" :visible.sync="openWhDetail" append-to-body width="88%" top="5vh" @close="openWhDetail = false">
      <el-table :data="whEntryPreviewList" border max-height="480" size="small">
        <el-table-column type="index" label="行" width="50" align="center" />
        <el-table-column label="耗材" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.name) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请数量" prop="qty" width="90" align="right" />
        <el-table-column label="可出库" prop="pendingOutboundQty" width="90" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.pendingOutboundQty != null ? Number(scope.row.pendingOutboundQty).toFixed(2) : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" prop="batchNo" width="120" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import { listWhApplyForCk } from "@/api/warehouse/outWarehouse";
import { getWhWarehouseApply } from "@/api/department/whWarehouseApply";

export default {
  name: "SelectDApply",
  components: { SelectWarehouse, SelectDepartment },
  props: ["DialogComponentShow", "warehouseValue", "departmentValue", "materialValue"],
  data() {
    return {
      show: false,
      loading: false,
      selectRowWh: [],
      isShow: true,
      showSearch: true,
      total: 0,
      whApplyList: [],
      whEntryPreviewList: [],
      detailTitle: "",
      openWhDetail: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        basApplyBillNo: null,
        warehouseId: null,
        departmentId: null
      }
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
      this.queryParams.departmentId = this.departmentValue;
      if (this.show) {
        this.getList();
      }
    },
    getList() {
      this.loading = true;
      listWhApplyForCk(this.queryParams)
        .then(response => {
          this.whApplyList = response.rows || [];
          this.total = response.total || 0;
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    /** 分页回调：与 SelectMaterialFilter 一致，先同步页码再请求 */
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
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.departmentId = this.departmentValue;
      this.handleQuery();
    },
    handleSelectionChangeWh(val) {
      this.selectRowWh = val || [];
    },
    handleClose() {
      this.show = false;
      this.$emit("closeDialog");
    },
    checkBtn() {
      if (!this.selectRowWh || this.selectRowWh.length === 0) {
        this.$message({ message: "请先选择仓库申请单", type: "warning" });
        return;
      }
      if (this.selectRowWh.length > 1) {
        this.$message({ message: "仓库申请单请单选", type: "warning" });
        return;
      }
      this.$emit("selectWhApplyData", this.selectRowWh[0]);
      this.handleClose();
    },
    whApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleViewWh(row) {
      if (!row || !row.id) return;
      getWhWarehouseApply(row.id).then(res => {
        const data = res.data || {};
        this.whEntryPreviewList = data.entryList || [];
        this.detailTitle = "仓库申请单 " + (data.applyBillNo || row.applyBillNo || "");
        this.openWhDetail = true;
      });
    }
  }
};
</script>

<style scoped>
/* 根节点：与出库申请页 .app-container.outWarehouse-apply-page 内主弹窗 local-modal-mask 同范围（含左右 -8px 与主列表对齐） */
.select-ref-bill-root {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
  bottom: 0;
  z-index: 1100;
  box-sizing: border-box;
}

/* 与到货验收「添加明细」视觉一致；定位相对页容器，不再使用 fixed+100vw（避免嵌套在主弹窗内错位） */
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
