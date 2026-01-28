<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="billNo" class="query-item-inline">
              <el-input
                v-model="queryParams.billNo"
                placeholder="请输入单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
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

        <el-row :gutter="16" class="query-row-third">
          <el-col :span="24">
            <el-form-item label="批号" prop="materialNo" class="query-item-inline">
              <el-input
                v-model="queryParams.materialNo"
                placeholder="请输入批号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费"
                         clearable style="width: 150px">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item label="库房分类" prop="warehouseCategoryId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" />
              </div>
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
    <el-table v-loading="loading" :data="inventoryList"
              show-summary :summary-method="getTotalSummaries"
              height="55vh"
              border>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="类型" align="center" prop="billType" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
        </template>
      </el-table-column>
      <el-table-column label="业务单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable />
      <el-table-column label="业务日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="数量" align="center" prop="materialQty" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price">{{ scope.row.price | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="160" show-overflow-tooltip resizable/>
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
import { listPurInventory } from "@/api/warehouse/purInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import Pagination from "@/components/Pagination";
import { parseTime } from "@/utils/ruoyi";

export default {
  name: "MonthlyDetailTable",
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectSupplier,SelectWarehouseCategory,MaterialAutocomplete,RightToolbar,Pagination},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 库存明细表格数据
      inventoryList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        supplierId: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    parseTime,
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(column.property === 'materialQty' || column.property === 'materialAmt'){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            if(column.property === 'materialAmt') {
              sums[index] = '￥' + sums[index].toFixed(2);
            } else {
              sums[index] = sums[index].toFixed(2);
            }
          } else {
            sums[index] = '';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 查询月结存明细列表 */
    getList() {
      this.loading = true;
      listPurInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(error => {
        console.error('查询月结存明细列表失败:', error);
        this.inventoryList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
      return endDate;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.billNo = null;
      this.queryParams.materialName = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.warehouseCategoryId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.materialNo = null;
      this.queryParams.isBilling = null;
      this.handleQuery();
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/purInventory/export', {
        ...this.queryParams
      }, `monthly_detail_${new Date().getTime()}.xlsx`)
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

.query-row-third {
  margin-bottom: 2px;
}

.query-row-third .el-form-item {
  margin-bottom: 0;
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
</style>
