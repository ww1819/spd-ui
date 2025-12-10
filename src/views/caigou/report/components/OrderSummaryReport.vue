<template>
  <div class="report-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
          </el-form-item>
          <el-form-item label="耗材" prop="materialId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectMaterial v-model="queryParams.materialId" />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="订单日期" style="display: flex; align-items: center;">
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

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="reportList"
              show-summary
              :summary-method="getSummaries"
              height="51vh"
              border>
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpec" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="materialUnit" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="totalQty" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalQty">{{ scope.row.totalQty }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency}}</span>
          <span v-else>--</span>
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
</template>

<script>
import { listDingdan } from "@/api/caigou/dingdan";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';

export default {
  name: "OrderSummaryReport",
  components: {SelectSupplier,SelectMaterial,SelectWarehouse},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 报表数据
      reportList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        supplierId: null,
        warehouseId: null,
        materialId: null,
        beginDate: null,
        endDate: null,
      }
    };
  },
  created() {
    this.queryParams.beginDate = this.getStatDate();
    this.queryParams.endDate = this.getEndDate();
    this.getList();
  },
  methods: {
    /** 查询报表列表 */
    getList() {
      this.loading = true;
      listDingdan(this.queryParams).then(response => {
        console.log('订单汇总报表数据响应:', response);
        // 处理数据，按耗材汇总
        const summaryList = this.processSummaryData(response.rows || []);
        this.reportList = summaryList;
        this.total = summaryList.length;
        this.loading = false;
      }).catch(error => {
        console.error('获取订单汇总报表数据失败:', error);
        this.reportList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 处理订单数据，按耗材汇总 */
    processSummaryData(orderList) {
      const summaryMap = new Map();
      if (orderList && orderList.length > 0) {
        orderList.forEach(order => {
          const entryList = order.purchaseOrderEntryList || order.entryList || [];
          if (entryList && entryList.length > 0) {
            entryList.forEach(entry => {
              const key = `${entry.materialId || ''}_${order.warehouseId || ''}`;
              if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                  materialCode: entry.materialCode || (entry.material && entry.material.code) || '',
                  materialName: entry.materialName || (entry.material && entry.material.name) || '',
                  materialSpec: entry.materialSpec || (entry.material && entry.material.speci) || '',
                  materialUnit: entry.materialUnit || (entry.material && entry.material.fdUnit && entry.material.fdUnit.unitName) || '',
                  supplierName: order.supplierName || (order.supplier && order.supplier.name) || '',
                  warehouseName: order.warehouseName || (order.warehouse && order.warehouse.name) || '',
                  unitPrice: entry.unitPrice || 0,
                  totalQty: 0,
                  totalAmt: 0
                });
              }
              const item = summaryMap.get(key);
              item.totalQty += Number(entry.orderQty || 0);
              item.totalAmt += Number(entry.totalAmount || 0);
            });
          }
        });
      }
      return Array.from(summaryMap.values());
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01";
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate();
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd;
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
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.handleQuery();
    },
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'totalQty' || column.property === 'totalAmt') {
          const values = data.map(item => Number(item[column.property]) || 0);
          if (!values.every(value => isNaN(value))) {
            const sum = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = column.property === 'totalAmt' ? 
              this.$options.filters.formatCurrency(sum) : 
              sum.toFixed(2);
          } else {
            sums[index] = '--';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/dingdan/export', {
        ...this.queryParams
      }, `采购订单汇总表_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.report-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
}

.query-status-col {
  display: flex;
  align-items: center;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
}
</style>

