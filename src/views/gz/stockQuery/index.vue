<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="备货入/退货表" name="inbound"></el-tab-pane>
      <el-tab-pane label="备货出/退库表" name="outbound"></el-tab-pane>
      <el-tab-pane label="跟台表" name="follow"></el-tab-pane>
    </el-tabs>

    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" />
                </div>
              </el-form-item>
              <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectSupplier v-model="queryParams.supplierId" />
                </div>
              </el-form-item>
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item :label="activeName === 'inbound' ? '单号' : activeName === 'outbound' ? '出库单号' : '单号'" prop="orderNo" class="query-item-inline">
                <el-input
                  v-model="queryParams.orderNo"
                  :placeholder="activeName === 'inbound' ? '请输入单号' : activeName === 'outbound' ? '请输入出库单号' : '请输入单号'"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </el-form-item>
              <el-form-item :label="activeName === 'inbound' ? '入库日期' : activeName === 'outbound' ? '出库日期' : '日期'" prop="dateRange" class="query-item-inline">
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
              <el-form-item label="单据状态" prop="orderStatus" class="query-item-inline">
                <el-select v-model="queryParams.orderStatus" placeholder="全部" clearable style="width: 150px">
                  <el-option v-for="dict in dict.type.biz_status"
                             :key="dict.value"
                             :label="dict.label"
                             :value="dict.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: -8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['gz:stockQuery:export']"
        >导出</el-button>
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </div>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
    </el-row>

    <InboundRefundTable 
      v-if="activeName === 'inbound'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
    <OutboundRefundTable 
      v-if="activeName === 'outbound'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
    <FollowTable 
      v-if="activeName === 'follow'" 
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import RightToolbar from "@/components/RightToolbar";
import InboundRefundTable from "./components/InboundRefundTable.vue";
import OutboundRefundTable from "./components/OutboundRefundTable.vue";
import FollowTable from "./components/FollowTable.vue";

export default {
  name: "StockQuery",
  dicts: ['biz_status'],
  components: {
    SelectWarehouse,
    SelectSupplier,
    SelectMaterial,
    SelectDepartment,
    RightToolbar,
    InboundRefundTable,
    OutboundRefundTable,
    FollowTable
  },
  data() {
    return {
      activeName: 'inbound',
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        warehouseId: null,
        supplierId: null,
        departmentId: null,
        orderNo: null,
        orderStatus: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  methods: {
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      // key 变化会自动触发子组件重新创建和加载数据
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.supplierId = null;
      this.queryParams.departmentId = null;
      this.queryParams.orderNo = null;
      this.queryParams.orderStatus = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.pageNum = 1;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 标签页切换 */
    handleTabClick(tab) {
      // 切换标签页时重置查询参数
      this.resetQuery();
    },
    /** 导出按钮操作 */
    handleExport() {
      const exportUrl = this.activeName === 'inbound' ? 'gzOrder/export' : 
                        this.activeName === 'outbound' ? 'gzShipment/export' : 
                        'gzFollow/export';
      this.download(exportUrl, {
        ...this.queryParams,
        orderType: this.activeName === 'inbound' ? 101 : this.activeName === 'outbound' ? 102 : null
      }, `备货查询_${this.activeName === 'inbound' ? '入退货表' : this.activeName === 'outbound' ? '出退库表' : '跟台表'}_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

/* 标签页样式优化 */
::v-deep .el-tabs {
  margin-bottom: 16px;
  
  .el-tabs__header {
    margin: 0 0 16px 0;
  }
  
  .el-tabs__item {
    padding: 0 20px;
    height: 40px;
    line-height: 40px;
    font-size: 14px;
  }
  
  .el-tabs__item.is-active {
    color: #409EFF;
    font-weight: 500;
  }
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 8px;
}

.query-row-left:first-child {
  margin-top: 4px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0px;
  margin-top: 0px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 6px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

/* 表格容器样式 */
::v-deep .table-container {
  margin-top: -8px;
  overflow: visible;
  width: 100%;
  position: relative;
}

/* 按钮行布局优化 */
.mb8 {
  width: 100%;
}

.mb8 > div:first-child {
  flex: 0 0 auto;
}

.mb8 .top-right-btn {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>

