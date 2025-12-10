<template>
  <div class="app-container">
    <el-tabs v-model="activeName" type="card" @tab-click="handleTabClick">
      <el-tab-pane label="备货入/退货表" name="inbound"></el-tab-pane>
      <el-tab-pane label="备货出/退库表" name="outbound"></el-tab-pane>
      <el-tab-pane label="跟台表" name="follow"></el-tab-pane>
    </el-tabs>

    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId">
            <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" style="width: 100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="供应商" prop="supplierId">
            <SelectSupplier v-model="queryParams.supplierId" style="width: 100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="activeName === 'inbound' ? '单号' : activeName === 'outbound' ? '出库单号' : '单号'" prop="orderNo">
            <el-input
              v-model="queryParams.orderNo"
              :placeholder="activeName === 'inbound' ? '请输入单号' : activeName === 'outbound' ? '请输入出库单号' : '请输入单号'"
              clearable
              @keyup.enter.native="handleQuery"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId">
            <SelectMaterial v-model="queryParams.materialId" style="width: 100%"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="科室" prop="departmentId">
            <SelectDepartment v-model="queryParams.departmentId" style="width: 100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="activeName === 'inbound' ? '入库日期' : activeName === 'outbound' ? '出库日期' : '日期'" prop="dateRange">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px; color: #909399;">至</span>
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
        <el-col :span="6">
          <el-form-item label="单据状态" prop="orderStatus">
            <el-select v-model="queryParams.orderStatus" placeholder="全部" clearable style="width: 100%">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24" style="text-align: right;">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            <el-button
              type="warning"
              icon="el-icon-download"
              size="small"
              @click="handleExport"
              v-hasPermi="['gz:stockQuery:export']"
            >导出</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

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

/* 搜索表单样式优化 */
.query-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  
  .el-row {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .el-form-item {
    margin-bottom: 0;
    
    .el-form-item__label {
      color: #606266;
      font-weight: 500;
      padding-right: 12px;
    }
  }
  
  .el-input,
  .el-select {
    width: 100%;
  }
}

/* 按钮样式优化 */
.el-button {
  margin-left: 8px;
  
  &:first-child {
    margin-left: 0;
  }
}

/* 表格容器样式 */
::v-deep .table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 16px;
}
</style>

