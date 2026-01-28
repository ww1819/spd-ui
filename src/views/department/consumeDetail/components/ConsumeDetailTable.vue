<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="出库单号" prop="billNo" class="query-item-inline">
              <el-input
                v-model="queryParams.billNo"
                placeholder="请输入出库单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="耗材" prop="materialName" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
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
            <el-form-item label="批号" prop="batchNo" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNo"
                placeholder="请输入批号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
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
    <el-table v-loading="loading" :data="consumeDetailList"
              :row-class-name="consumeDetailListIndex"
              show-summary :summary-method="getTotalSummaries"
              height="55vh"
              border>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="出库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable/>
      <!-- 已移除出库日期列，改为制单日期并移到制单人后面 -->
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="100" show-overflow-tooltip resizable/>
      <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
          <span v-else-if="scope.row.createrNickName">{{ scope.row.createrNickName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditPersonName">{{ scope.row.auditPersonName }}</span>
          <span v-else-if="scope.row.auditNickName">{{ scope.row.auditNickName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>

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
import { listConsumeDetail } from "@/api/department/consumeDetail";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "ConsumeDetailTable",
  components: {SelectWarehouse, SelectDepartment, MaterialAutocomplete, RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 领用明细表格数据
      consumeDetailList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialName: null,
        warehouseId: null,
        departmentId: null,
        beginDate: null,
        endDate: null,
        batchNo: null
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill('');
      sums[0] = '合计';
      
      let totalQty = 0;
      let totalAmt = 0;
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        totalQty += Number(item.qty || 0);
        totalAmt += Number(item.amt || 0);
      }
      
      columns.forEach((column, index) => {
        if (column.property === 'qty') {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === 'amt') {
          sums[index] = '￥' + totalAmt.toFixed(2);
        }
      });
      
      return sums;
    },
    /** 查询领用明细列表 */
    getList() {
      this.loading = true;
      listConsumeDetail(this.queryParams).then(response => {
        this.consumeDetailList = response.rows || [];
        this.total = response.total;
        this.loading = false;
      }).catch(() => {
        this.consumeDetailList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    consumeDetailListIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.batchNo = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/consumeDetail/export', {
        ...this.queryParams
      }, `consumeDetail_${new Date().getTime()}.xlsx`)
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

.query-row-second .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
  margin-left: 16px;
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
  padding: 0 4px;
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
