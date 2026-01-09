<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="billNo" class="query-item-inline">
              <el-input v-model="queryParams.billNo"
                        placeholder="请输入单号"
                        clearable
                        style="width: 180px"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
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
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="请选择单据类型"
                         multiple collapse-tags clearable style="width: 300px">
                <el-option label="入库单" value="101"/>
                <el-option label="出库单" value="201"/>
                <el-option label="退库单" value="401"/>
                <el-option label="退货单" value="301"/>
                <el-option label="调拨单" value="501"/>
              </el-select>
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
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="80" show-overflow-tooltip resizable/>
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
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined && scope.row.price !== '' && Number(scope.row.price) !== 0">{{ Number(scope.row.price) | formatCurrency}}</span>
          <span v-else-if="scope.row.unitPrice != null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== '' && Number(scope.row.unitPrice) !== 0">{{ Number(scope.row.unitPrice) | formatCurrency}}</span>
          <span v-else-if="scope.row.materialAmt != null && scope.row.materialQty != null && Number(scope.row.materialQty) !== 0">
            {{ (Number(scope.row.materialAmt) / Number(scope.row.materialQty)) | formatCurrency}}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="80" show-overflow-tooltip resizable/>
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
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "thirdInventory",
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      activeName: 'first',
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
      // 库存明细表格数据
      inventoryList: [],
      // 合计信息
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
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
        billType: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
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
    getTotalSummaries(param) {
      const { columns, data } = param;
      // 在现有合计数据后追加新的一行用于展示总计金额和数量
      const subTotalRow = [];
      const totalRow = [];
      subTotalRow[0] = '合计';
      totalRow[0] = '总计';
      for (let i = 1; i < columns.length; i++) {
        if (i === 11) { // 金额列
          subTotalRow[i] = (this.totalInfo && this.totalInfo.subTotalAmt) ? this.totalInfo.subTotalAmt.toFixed(2) : '0.00';
          totalRow[i] = (this.totalInfo && this.totalInfo.totalAmt) ? this.totalInfo.totalAmt.toFixed(2) : '0.00';
        } else if (i === 10) { // 数量列
          subTotalRow[i] = (this.totalInfo && this.totalInfo.subTotalQty) ? this.totalInfo.subTotalQty.toFixed(2) : '0.00';
          totalRow[i] = (this.totalInfo && this.totalInfo.totalQty) ? this.totalInfo.totalQty.toFixed(2) : '0.00';
        } else {
          subTotalRow[i] = ''; // 其他列为空
          totalRow[i] = ''; // 其他列为空
        }
      }
      return [subTotalRow, totalRow];
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
    /** 查询库存明细列表 */
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
      listPurInventory(queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
        // 调试：检查第一条数据的price字段
        if (this.inventoryList && this.inventoryList.length > 0) {
          console.log('第一条数据:', this.inventoryList[0]);
          console.log('price字段:', this.inventoryList[0].price);
          console.log('unitPrice字段:', this.inventoryList[0].unitPrice);
        }
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
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        qty: null,
        materialId: null,
        warehouseId: null,
        unitPrice: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
      };
      this.resetForm("form");
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
      this.download('warehouse/inventory/export', {
        ...this.queryParams
      }, `inventory_${new Date().getTime()}.xlsx`)
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
