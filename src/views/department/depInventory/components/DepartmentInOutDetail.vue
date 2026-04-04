<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectMaterial v-model="queryParams.materialId" />
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" />
              </div>
            </el-form-item>
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="请选择单据类型" clearable class="query-select-bill-type">
                <el-option label="全部" :value="null" />
                <el-option label="入库" :value="101" />
                <el-option label="出库" :value="102" />
                <el-option label="调拨" :value="103" />
                <el-option label="盘点" :value="104" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="开始日期" prop="beginDate" class="query-item-inline">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="开始日期"
                clearable
                class="query-date-start"
              />
            </el-form-item>
            <el-form-item label="结束日期" prop="endDate" class="query-item-inline">
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="结束日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="inOutList"
        show-summary
        :summary-method="getTotalSummaries"
        height="60vh"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="单据编号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">
              <span>{{ scope.row.billNo }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="单据类型" align="center" prop="billType" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="center" prop="billDate" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="specification" width="80" show-overflow-tooltip resizable/>
        <el-table-column label="型号" align="center" prop="model" width="80" show-overflow-tooltip resizable/>
        <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span :style="{ color: Number(scope.row.billType) === 101 ? '#67C23A' : '#F56C6C' }">
              {{ Number(scope.row.billType) === 101 ? '+' : '-' }}{{ scope.row.qty }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency}}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="操作人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable />
        <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="11"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog :title="title" :visible.sync="open" width="80%" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="单据编号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据类型" prop="billType">
              <el-select v-model="form.billType" :disabled="true" clearable>
                <el-option v-for="dict in dict.type.bill_type"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据状态" prop="billStatus">
              <el-select v-model="form.billStatus" :disabled="true" clearable>
                <el-option v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="制单日期" prop="billDate">
              <el-date-picker v-model="form.billDate" type="date" :disabled="true" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartmentInOutDetail, getInWarehouse } from "@/api/department/depInventory";
import { exportDepartmentInOutDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "DepartmentInOutDetail",
  dicts: ["biz_status", "bill_type"],
  components: { SelectMaterial, SelectDepartment, SelectWarehouse, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      inOutList: [],
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      title: "",
      open: false,
      form: {},
      rules: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        departmentId: null,
        warehouseId: null,
        billType: null,
        billStatus: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.inOutList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.inOutList || []).reduce((s, r) => s + Number(r.amount || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listDepartmentInOutDetail(this.queryParams).then(response => {
        this.inOutList = response.rows || [];
        this.total = response.total != null ? response.total : 0;
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
        this.loading = false;
      }).catch(() => {
        this.inOutList = [];
        this.total = 0;
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listDepartmentInOutDetail(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const billOpts = this.dict.type.bill_type || [];
        const resolveBillType = (v) => {
          if (v == null || v === "") return "";
          const hit = billOpts.find((d) => String(d.value) === String(v));
          return hit ? hit.label : String(v);
        };
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDepartmentInOutDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室进销存明细查询表${dateStr}.xlsx`,
          resolveBillType,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    handleView(row) {
      const id = row.id;
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "查看单据";
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        billNo: null,
        billType: null,
        billStatus: null,
        billDate: null,
        departmentId: null,
        warehouseId: null,
        createBy: null,
        totalAmount: null
      };
      this.resetForm("form");
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill("");
      let totalQty = 0;
      let totalAmt = 0;
      for (let i = 0; i < (data || []).length; i++) {
        const item = data[i] || {};
        totalQty += Number(item.qty || 0);
        totalAmt += Number(item.amount || 0);
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      columns.forEach((column, index) => {
        if (column.property === "qty") {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === "amount") {
          sums[index] = fmt ? fmt(totalAmt) : totalAmt.toFixed(2);
        }
      });
      sums[0] = "合计";
      return sums;
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    }
  }
};
</script>

<style scoped>
.app-container {
  margin-top: -10px;
}

.query-row-left {
  margin-bottom: 2px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
}

.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-select-bill-type {
  width: 180px;
}

.query-date-start,
.query-date-end {
  width: 150px;
}

.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #EBEEF5;
}

.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 32px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}
.table-container ::v-deep .el-table__footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  background: #fff;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  background: #fff;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell {
  white-space: nowrap;
  line-height: 23px;
}

.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell > .cell,
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell > .cell {
  white-space: nowrap;
  word-break: normal;
  overflow: visible;
  line-height: 23px;
}
</style>

<style>
.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}
</style>
