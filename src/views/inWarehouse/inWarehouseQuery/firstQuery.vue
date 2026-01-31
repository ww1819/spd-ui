<template>
  <div class="app-container first-query-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="业务单号" prop="billNo" class="query-item-inline">
              <el-input v-model="queryParams.billNo"
                        placeholder="请输入业务单号"
                        clearable
                        style="width: 180px"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectMaterial v-model="queryParams.materialId" />
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
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
              <el-select v-model="queryParams.billType" placeholder="全部"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.in_warehouse_bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费"
                         clearable style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory">
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <!-- 保留原来的表单组件 -->

    <div class="table-container">
      <!-- 最基础的Element UI表格配置，仅启用汇总功能 -->
      <el-table v-loading="loading" :data="displayData"
                show-summary
                :summary-method="getSummaries"
                height="57vh"
                border
                style="width: 100%">
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable v-if="columns[0].visible"/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable v-if="columns[1].visible"/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable v-if="columns[2].visible"/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable v-if="columns[3].visible"/>
      <el-table-column label="业务单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable v-if="columns[4].visible" />
      <el-table-column label="业务日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable v-if="columns[5].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>

      <el-table-column label="型号" align="center" prop="materialModel" width="80" show-overflow-tooltip resizable v-if="columns[6].visible"/>

      <el-table-column label="规格" align="center" prop="materialSpeci" width="80" show-overflow-tooltip resizable v-if="columns[7].visible"/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable v-if="columns[8].visible"/>
      <el-table-column label="价格" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable v-if="columns[10].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="80" show-overflow-tooltip resizable v-if="columns[11].visible">
        <template slot-scope="scope">
          {{ scope.row.materialQty }}
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable v-if="columns[12].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" prop="batchNumber" width="80" show-overflow-tooltip resizable v-if="columns[14].visible"/>
      <el-table-column label="生产日期" align="center" prop="beginDate" width="180" show-overflow-tooltip resizable v-if="columns[15].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endDate" width="180" show-overflow-tooltip resizable v-if="columns[16].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable v-if="columns[9].visible"/>
      <el-table-column label="批次" align="center" prop="batchNo" width="220" show-overflow-tooltip resizable v-if="columns[13].visible"/>

      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable v-if="columns[17].visible"/>
      <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable v-if="columns[18].visible"/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[19].visible"/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[20].visible"/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable v-if="columns[21].visible">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable v-if="columns[22].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="180" show-overflow-tooltip resizable v-if="columns[23].visible">
        <template slot-scope="scope">
          <span>{{ scope.row.remark || (scope.row.material && scope.row.material.remark) || '--' }}</span>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listRTHWarehouse} from "@/api/warehouse/warehouse";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

export default {
  name: "firstQuery",
  dicts: ['biz_status','bill_type','in_warehouse_bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser},
  data() {
      return {
        // 遮罩层
        loading: true,
        DialogComponentShow: false,
        isShow: true,
        // 选中数组
        ids: [],
        // 子表选中数据
        checkedStkIoBillEntry: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 显示搜索条件
        showSearch: true,
        // 总条数
        total: 0,
        // 入/退货表格数据
        warehouseList: [],
        // 表格数据 - 包含明确数值类型的测试数据
        displayData: [
          { materialQty: 10, unitPrice: 20.5, materialAmt: 205.0 },
          { materialQty: 5, unitPrice: 30.0, materialAmt: 150.0 },
          { materialQty: 8, unitPrice: 15.5, materialAmt: 124.0 }
        ], // 初始化显示数据
        // 测试汇总功能的专用数据
        testData: [
          { name: '商品1', quantity: 100, price: 50.5, amount: 5050 },
          { name: '商品2', quantity: 200, price: 30.0, amount: 6000 },
          { name: '商品3', quantity: 150, price: 20.8, amount: 3120 }
        ],
      stkMaterialList: [],
      // 入/退货明细表格数据
      stkIoBillEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        isBilling: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商ID不能为空", trigger: "blur" }
        ],
        billDate: [
          { required: true, message: "入/退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "入/退货类型不能为空", trigger: "change" }
        ],
      },
      // 列显隐配置
      columns: [
        { key: 0, label: `耗材编码`, visible: true },
        { key: 1, label: `耗材名称`, visible: true },
        { key: 2, label: `仓库`, visible: true },
        { key: 3, label: `供应商`, visible: true },
        { key: 4, label: `业务单号`, visible: true },
        { key: 5, label: `业务日期`, visible: true },
        { key: 6, label: `型号`, visible: true },
        { key: 7, label: `规格`, visible: true },
        { key: 8, label: `单位`, visible: true },
        { key: 9, label: `生产厂家`, visible: true },
        { key: 10, label: `价格`, visible: true },
        { key: 11, label: `数量`, visible: true },
        { key: 12, label: `金额`, visible: true },
        { key: 13, label: `批次`, visible: true },
        { key: 14, label: `批号`, visible: true },
        { key: 15, label: `生产日期`, visible: true },
        { key: 16, label: `有效期`, visible: true },
        { key: 17, label: `注册证号`, visible: true },
        { key: 18, label: `包装规格`, visible: true },
        { key: 19, label: `库房分类`, visible: true },
        { key: 20, label: `财务分类`, visible: true },
        { key: 21, label: `储存方式`, visible: true },
        { key: 22, label: `计费`, visible: true },
        { key: 23, label: `备注`, visible: true }
      ]
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 自定义汇总方法 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        // 第一列显示汇总文本
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        
        // 只对数量和金额列进行汇总
        if (column.property === 'materialQty' || column.property === 'materialAmt') {
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
            sums[index] = column.property === 'materialAmt' ? 
              this.$options.filters.formatCurrency(sum) : 
              sum;
          } else {
            sums[index] = '--';
          }
        } else {
          // 其他列不显示汇总
          sums[index] = '';
        }
      });
      return sums;
    },
    
    /** 查询入/退货列表 */
    getList() {
      this.loading = true;
      // 处理截止日期，确保包含当天的所有数据（23:59:59）
      const queryParams = {
        ...this.queryParams
      };
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        // 如果 endDate 只有日期部分（yyyy-MM-dd），添加时间部分为 23:59:59
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      listRTHWarehouse(queryParams).then(response => {
        console.log('API响应数据:', response);
        this.warehouseList = response.rows || [];
        this.total = response.total || 0;

        // 确保数据格式正确，直接使用实际数据
        this.displayData = this.warehouseList.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice) || 0,
          materialQty: Number(item.materialQty) || 0,
          materialAmt: Number(item.materialAmt) || 0
        }));

        console.log('显示数据:', this.displayData);
        this.loading = false;
      }).catch(error => {
        console.error('获取数据失败:', error);
        this.warehouseList = [];
        this.displayData = [];
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
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
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
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style>
/* 与库存明细查询一致：内层不叠加左右 padding */
.app-container.first-query-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
</style>

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

/* 与库存明细查询一致：由外层统一左右 8px，此处占满内容区 */
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

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 6px;
  transition: height 0.2s ease;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover {
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
.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}
</style>
