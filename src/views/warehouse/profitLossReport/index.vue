<template>
  <div class="app-container profit-loss-report-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="query-form-compact">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="盈亏单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo" placeholder="请输入盈亏单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="盘点单号" prop="stocktakingNo" class="query-item-inline">
            <el-input v-model="queryParams.stocktakingNo" placeholder="请输入盘点单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <SelectWarehouse v-model="queryParams.warehouseId" />
          </el-form-item>
          <el-form-item label="单据状态" prop="billStatus" class="query-item-inline">
            <el-select v-model="queryParams.billStatus" placeholder="请选择" clearable style="width: 120px">
              <el-option label="待审核" :value="1" />
              <el-option label="已审核" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" class="table-compact" :row-class-name="tableRowIndex" height="calc(100vh - 340px)" border>
      <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip />
      <el-table-column label="盈亏单号" align="center" prop="billNo" min-width="160" show-overflow-tooltip />
      <el-table-column label="盘点单号" align="center" prop="stocktakingNo" min-width="140" show-overflow-tooltip />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip />
      <el-table-column label="单据状态" align="center" prop="billStatus" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="100" show-overflow-tooltip />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <div class="report-summary">
      共 {{ total }} 条
    </div>
  </div>
</template>

<script>
import { listProfitLoss } from '@/api/warehouse/profitLoss'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'ProfitLossReport',
  dicts: ['biz_status'],
  components: { SelectWarehouse },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      dataList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        stocktakingNo: null,
        warehouseId: null,
        billStatus: 2
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    tableRowIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10))
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10))
      row.index = (pageNum - 1) * pageSize + rowIndex + 1
    },
    getList() {
      this.loading = true
      listProfitLoss(this.queryParams).then(response => {
        this.dataList = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.billStatus = 2
      this.handleQuery()
    }
  }
}
</script>

<style lang="scss" scoped>
.profit-loss-report-page {
  padding-left: 8px;
  padding-right: 8px;
}
.report-summary {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}
</style>

<style>
.app-container.profit-loss-report-page > .el-form.query-form-compact {
  margin-top: -8px;
}
.app-container.profit-loss-report-page > .el-row.button-row-compact {
  margin-top: -8px;
  padding-top: 0;
  margin-bottom: 8px;
}
.app-container.profit-loss-report-page > .el-table.table-compact {
  margin-top: 0;
}
.app-container.profit-loss-report-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 14px;
  height: 48px;
}
</style>
