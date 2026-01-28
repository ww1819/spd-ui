<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" clearable/>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24">
            <el-form-item label="业务日期" style="display: flex; align-items: center;">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 180px; margin-right: 8px;"
              />
              <span style="margin: 0 4px;">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 180px; margin-left: 8px;"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 2px; margin-top: -8px">
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="consumeRankingList"
              height="55vh"
              border>
      <el-table-column label="排名" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总数量" align="center" prop="totalQty" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="总金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="占比" align="center" prop="percentage" width="100" min-width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.percentage">{{ scope.row.percentage }}%</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家/供应商" align="center" width="200" min-width="200" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.factoryName || scope.row.supplierName">
            {{ scope.row.factoryName || '--' }}/{{ scope.row.supplierName || '--' }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>

    </el-table>
    </div>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listConsumeRanking } from "@/api/department/consumeDetail";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "ConsumeRankingTable",
  components: {SelectWarehouse, SelectDepartment, RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 领用排名表格数据
      consumeRankingList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        departmentId: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询领用排名列表 */
    getList() {
      this.loading = true;
      listConsumeRanking(this.queryParams).then(response => {
        this.consumeRankingList = response.rows || [];
        this.total = response.total;
        this.loading = false;
      }).catch(() => {
        this.consumeRankingList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/consumeDetail/exportRanking', {
        ...this.queryParams
      }, `consumeRanking_${new Date().getTime()}.xlsx`)
    },
  }
};
</script>

<style scoped>
.app-container {
  margin-top: -10px;
}

/* 查询条件样式 */
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

.query-row-second .el-form-item {
  white-space: nowrap;
  margin-bottom: 0;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 6px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  margin-top: -20px;
  margin-left: -20px;
  margin-right: -20px;
  border: 1px solid #EBEEF5;
}

.table-container {
  margin-top: 5px;
  overflow: visible;
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  position: relative;
}

/* 表格水平滚动条增粗 */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 优化表格列间距 */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 8px;
}

/* 表头不换行 */
.table-container ::v-deep .el-table th .cell {
  white-space: nowrap !important;
}

/* 增加列间距 */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 16px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 16px !important;
}
</style>
