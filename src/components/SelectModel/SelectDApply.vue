<template>
  <div class="select-ref-bill-root">
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">引用仓库申请单</div>
        <el-button icon="el-icon-close" size="small" circle @click="handleClose" class="close-btn"></el-button>
      </div>
      <div class="modal-body">
            <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="0" class="query-form">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="仓库申请单号" prop="applyBillNo" label-width="110px">
                    <el-input v-model="queryParams.applyBillNo" placeholder="单号" clearable @keyup.enter.native="handleQuery" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="科室申领单号" prop="basApplyBillNo" label-width="110px">
                    <el-input v-model="queryParams.basApplyBillNo" placeholder="原申领单号" clearable @keyup.enter.native="handleQuery" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow"/>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <SelectDepartment v-model="queryParams.departmentId" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="6">
                  <el-form-item>
                    <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
                    <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <el-table ref="whTable" :data="whApplyList" :row-class-name="whApplyIndex" @selection-change="handleSelectionChangeWh" height="calc(42vh)" border>
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
              v-show="total>0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="getList"
            />
      </div>

      <div class="modal-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="checkBtn">确 定</el-button>
      </div>
        </div>
      </transition>
    </div>
  </transition>

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
  props: ['DialogComponentShow', 'warehouseValue', 'departmentValue', 'materialValue'],
  data() {
    return {
      show: false,
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
      },
    };
  },
  mounted() {
    this.syncOpenFromProp();
  },
  watch: {
    DialogComponentShow(val) {
      if (val) {
        this.syncOpenFromProp();
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
      listWhApplyForCk(this.queryParams).then(response => {
        this.whApplyList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => { this.loading = false; });
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
      this.$emit('closeDialog');
    },
    checkBtn() {
      if (!this.selectRowWh || this.selectRowWh.length === 0) {
        this.$message({ message: '请先选择仓库申请单', type: 'warning' });
        return;
      }
      if (this.selectRowWh.length > 1) {
        this.$message({ message: '仓库申请单请单选', type: 'warning' });
        return;
      }
      this.$emit('selectWhApplyData', this.selectRowWh[0]);
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
        this.detailTitle = '仓库申请单 ' + (data.applyBillNo || row.applyBillNo || '');
        this.openWhDetail = true;
      });
    },
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
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  padding: 20px 24px;
  background: #fff;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.el-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.el-form .el-form-item {
  margin-bottom: 15px;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
