<template>
  <div v-show="show" class="select-ref-bill-root">
    <div class="local-modal-mask">
      <div class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">引用科室申购单</div>
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
                  <el-form-item label="科室申购单号" prop="purchaseBillNo" label-width="110px">
                    <el-input
                      v-model="queryParams.purchaseBillNo"
                      placeholder="单号"
                      clearable
                      @keyup.enter.native="handleQuery"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="汇总申购单号" prop="srcAggBillNo" label-width="110px">
                    <el-input
                      v-model="queryParams.srcAggBillNo"
                      placeholder="来源汇总单号"
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
            <el-button
              type="danger"
              plain
              icon="el-icon-close"
              size="small"
              :disabled="!voidWholeEnabled()"
              v-hasPermi="['department:purchase:voidWhole','department:purchase:edit','outWarehouse:apply:edit']"
              @click="handleVoidWhole"
            >作废</el-button>
            <el-button size="small" @click="handleClose" style="margin-left: 12px;">取 消</el-button>
            <el-button type="primary" size="small" @click="checkBtn">确 定</el-button>
          </div>

          <el-tabs v-model="queryParams.ckRefSheet" class="wh-apply-ck-tabs" @tab-click="onCkRefSheetTabClick">
            <el-tab-pane label="未引用" name="none" />
            <el-tab-pane label="部分引用" name="partial" />
            <el-tab-pane label="全部引用" name="full" />
            <el-tab-pane name="lineVoid">
              <span slot="label" title="已引用出库一部分后，对剩余未引用数量做明细作废">部分作废</span>
            </el-tab-pane>
            <el-tab-pane label="已作废" name="wholeVoid" />
          </el-tabs>

          <div class="material-filter-table-section">
            <el-table
              ref="depTable"
              class="material-filter-detail-table"
              v-loading="loading"
              :data="depApplyList"
              :row-class-name="depApplyIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
              <el-table-column label="科室申购单号" align="center" prop="purchaseBillNo" min-width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <el-button type="text" @click="handleViewDetail(scope.row)">
                    <span>{{ scope.row.purchaseBillNo }}</span>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="汇总申购单号" align="center" prop="srcAggBillNo" min-width="140" show-overflow-tooltip resizable />
              <el-table-column label="仓库" align="center" min-width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="科室" align="center" prop="department.name" min-width="100" show-overflow-tooltip resizable />
              <el-table-column label="已关联出库" align="center" prop="linkedCkTotal" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.linkedCkTotal != null ? Number(scope.row.linkedCkTotal).toFixed(2) : '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="待出库数量" align="center" prop="pendingOutboundTotal" width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.pendingOutboundTotal != null ? Number(scope.row.pendingOutboundTotal).toFixed(2) : '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废状态" align="center" min-width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidStatus(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废人" align="center" min-width="90" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidBy(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="作废时间" align="center" min-width="158" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ formatVoidTime(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
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

    <el-dialog :title="detailTitle" :visible.sync="openDetail" append-to-body width="88%" top="5vh" @close="openDetail = false">
      <el-table :data="entryPreviewList" border max-height="480" size="small">
        <el-table-column type="index" label="行" width="50" align="center" />
        <el-table-column label="耗材" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申购数量" prop="qty" width="90" align="right" />
        <el-table-column label="可出库" prop="pendingOutboundQty" width="90" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.pendingOutboundQty != null ? Number(scope.row.pendingOutboundQty).toFixed(2) : '—' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import { listDepPurchaseApplyForCk } from "@/api/warehouse/outWarehouse";
import { getPurchase, voidDepPurchaseApplyWhole } from "@/api/department/purchase";

export default {
  name: "SelectDepPurchaseApply",
  components: { SelectWarehouse, SelectDepartment },
  props: ["DialogComponentShow", "warehouseValue", "departmentValue"],
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      showSearch: true,
      total: 0,
      depApplyList: [],
      entryPreviewList: [],
      detailTitle: "",
      openDetail: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        purchaseBillNo: null,
        srcAggBillNo: null,
        warehouseId: null,
        departmentId: null,
        ckRefSheet: "none"
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
        this.queryParams.ckRefSheet = "none";
        this.queryParams.pageNum = 1;
        this.getList();
      }
    },
    getList() {
      this.loading = true;
      listDepPurchaseApplyForCk(this.queryParams)
        .then(response => {
          this.depApplyList = response.rows || [];
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
      this.queryParams.ckRefSheet = "none";
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.departmentId = this.departmentValue;
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
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: "请先选择科室申购单", type: "warning" });
        return;
      }
      if (this.selectRow.length > 1) {
        this.$message({ message: "科室申购单请单选", type: "warning" });
        return;
      }
      const row = this.selectRow[0];
      const pend = row.pendingOutboundTotal != null ? Number(row.pendingOutboundTotal) : 0;
      if (pend <= 0) {
        this.$message({ message: "该申购单当前无可出库数量，无法引用生成出库", type: "warning" });
        return;
      }
      if (row.voidWholeFlag === 1) {
        this.$message({ message: "该申购单已作废，无法引用", type: "warning" });
        return;
      }
      const linkedCk = row.linkedCkTotal != null ? Number(row.linkedCkTotal) : 0;
      const lineVoidLines = row.lineVoidedEntryCount != null ? Number(row.lineVoidedEntryCount) : 0;
      if (linkedCk > 0 && lineVoidLines > 0) {
        this.$message({
          message: "该申购单为部分作废状态（已出库引用且存在明细作废），不允许再次引用出库",
          type: "warning"
        });
        return;
      }
      this.$emit("selectDepPurchaseApplyData", row);
      this.handleClose();
    },
    depApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleViewDetail(row) {
      if (!row || !row.id) return;
      getPurchase(row.id).then(res => {
        const data = res.data || {};
        this.entryPreviewList = data.depPurchaseApplyEntryList || [];
        this.detailTitle = "科室申购单 " + (data.purchaseBillNo || row.purchaseBillNo || "");
        this.openDetail = true;
      });
    },
    onCkRefSheetTabClick() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    voidWholeEnabled() {
      const sheet = this.queryParams.ckRefSheet;
      if (sheet !== "none" && sheet !== "partial") {
        return false;
      }
      if (!this.selectRow || this.selectRow.length !== 1) {
        return false;
      }
      const row = this.selectRow[0];
      return row && row.voidWholeFlag !== 1;
    },
    formatVoidStatus(row) {
      if (!row) return "—";
      if (row.voidWholeFlag === 1) {
        return "已整单作废";
      }
      const linked = row.linkedCkTotal != null ? Number(row.linkedCkTotal) : 0;
      const lineVoidLines = row.lineVoidedEntryCount != null ? Number(row.lineVoidedEntryCount) : 0;
      if (linked > 0 && lineVoidLines > 0) {
        return "部分作废";
      }
      if (lineVoidLines > 0) {
        return "明细作废(未出库引用)";
      }
      return "正常";
    },
    formatVoidBy(row) {
      if (!row) return "—";
      if (row.voidWholeFlag === 1 && row.voidWholeBy) {
        return row.voidWholeBy;
      }
      if (row.lastLineVoidBy) {
        return row.lastLineVoidBy;
      }
      return "—";
    },
    formatVoidTime(row) {
      if (!row) return "—";
      const t = row.voidWholeFlag === 1 ? row.voidWholeTime : row.lastLineVoidTime;
      if (!t) return "—";
      return this.parseTime(t, "{y}-{m}-{d} {h}:{i}:{s}");
    },
    handleVoidWhole() {
      if (!this.voidWholeEnabled()) {
        return;
      }
      const row = this.selectRow[0];
      this.$prompt("请输入作废原因（可留空）", "整单作废确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPlaceholder: "原因",
        inputValue: ""
      })
        .then(({ value }) => {
          const reason = value != null ? String(value).trim() : "";
          return voidDepPurchaseApplyWhole({ id: row.id, reason });
        })
        .then(() => {
          this.$message.success("作废成功");
          this.getList();
        })
        .catch(() => {});
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

.wh-apply-ck-tabs {
  margin: 10px -20px 0;
  padding: 0 16px;
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
