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
            <el-form-item label="库房分类" prop="warehouseCategoryId" class="query-item-inline">
              <div class="query-select-wrapper query-select-wrapper-small" style="width: 100px !important;">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" style="width: 100%"/>
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
    <el-table v-loading="loading" :data="inventoryList"
              show-summary :summary-method="getTotalSummaries" height="55vh" border>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="仓库ID" v-if="false" align="center" prop="warehouse_id" width="150" show-overflow-tooltip resizable />
      <el-table-column label="仓库编码" align="center" prop="warehouse_code" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库名称" align="center" prop="warehouse_name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类ID" v-if="false" align="center" prop="storeroom_id" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类编码" align="center" prop="warehouse_category_code" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类" align="center" prop="warehouse_category_name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="期初数量" align="center" prop="qc_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.qc_qty">{{ scope.row.qc_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="期初金额" align="center" prop="qc_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.qc_amt">{{ scope.row.qc_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="入库数量" align="center" prop="rk_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.rk_qty">{{ scope.row.rk_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="入库金额" align="center" prop="rk_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.rk_amt">{{ scope.row.rk_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="出库数量" align="center" prop="ck_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.ck_qty">{{ scope.row.ck_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="出库金额" align="center" prop="ck_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.ck_amt">{{ scope.row.ck_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="调入数量" align="center" prop="dbr_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.dbr_qty">{{ scope.row.dbr_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="调入金额" align="center" prop="dbr_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.dbr_amt">{{ scope.row.dbr_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="调出数量" align="center" prop="dbc_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.dbc_qty">{{ scope.row.dbc_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="调出金额" align="center" prop="dbc_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.dbc_amt">{{ scope.row.dbc_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点数量" align="center" prop="pd_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.pd_qty">{{ scope.row.pd_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点金额" align="center" prop="pd_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.pd_amt">{{ scope.row.pd_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
        </template>
      </el-table-column>
      <el-table-column label="结存数量" align="center" prop="jc_qty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.jc_qty">{{ scope.row.jc_qty | formatCurrency}}</span>
          <span v-else>0.0</span>
        </template>
      </el-table-column>
      <el-table-column label="结存金额" align="center" prop="jc_amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.jc_amt">{{ scope.row.jc_amt | formatCurrency}}</span>
          <span v-else>0.00</span>
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
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import Pagination from "@/components/Pagination";
import { parseTime } from "@/utils/ruoyi";
import { listWarehouse } from "@/api/foundation/warehouse";
import {selectWarehousePsiReport} from "@/api/warehouse/warehousePsiReport";
import formatCurrency from "../../../../utils/format-currency";

export default {
  name: "PurInventoryTable",
  computed: {
    formatCurrency() {
      return formatCurrency
    }
  },
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete,RightToolbar,Pagination,SelectWarehouseCategory},
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
      // 合计信息
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        billType: null,
        warehouseCategoryId: null
      }
    };
  },
  created() {
    this.getList();
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
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
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    /** 查询进销存明细列表 */
    getList() {
      this.loading = true;
      // 处理 billType 参数：如果是数组，转换为逗号分隔的字符串，使用 billTypeStr 参数名
      const queryParams = {
        ...this.queryParams
      };
      // 移除 billType，使用 billTypeStr 传递
      let billTypeStr = null;
      if (Array.isArray(queryParams.billType) && queryParams.billType.length > 0) {
        // 将数组转换为逗号分隔的字符串
        billTypeStr = queryParams.billType.join(',');
      }
      // 删除 billType，添加 billTypeStr
      delete queryParams.billType;
      if (billTypeStr) {
        queryParams.billTypeStr = billTypeStr;
      }
      // 处理日期参数：如果 endDate 只有日期部分（yyyy-MM-dd），添加时间部分为 23:59:59
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      // 如果日期为空字符串，设置为 null
      if (queryParams.beginDate === '') {
        queryParams.beginDate = null;
      }
      if (queryParams.endDate === '') {
        queryParams.endDate = null;
      }
      selectWarehousePsiReport(queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total || 0;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
      }).catch(error => {
        console.error('查询进销存明细列表失败:', error);
        this.inventoryList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    getStatDate(){
      // 当前日期往前推5天
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year + "-" + month + "-" + day;
      return statDate;
    },
    getEndDate(){
      // 当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year + "-" + month + "-" + day;
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
      this.queryParams.warehouseId = null;
      this.queryParams.materialName = null;
      this.queryParams.billType = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.handleQuery();
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/purInventory/export', {
        ...this.queryParams
      }, `pur_inventory_${new Date().getTime()}.xlsx`)
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
