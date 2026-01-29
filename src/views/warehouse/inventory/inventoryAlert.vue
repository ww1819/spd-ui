<template>
  <div class="app-container inventory-alert-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialName" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
            <el-form-item label="预警状态" prop="alertStatus" class="query-item-inline">
              <el-select v-model="queryParams.alertStatus" placeholder="请选择" clearable style="width: 150px">
                <el-option label="全部" value=""/>
                <el-option label="预警" value="1"/>
                <el-option label="正常" value="0"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory">
      <el-col :span="1.5">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
      <el-table v-loading="loading" :data="list"
                @selection-change="handleSelectionChange"
                height="57vh"
                border>
        <el-table-column type="selection" width="48" align="center" fixed="left"/>
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable fixed="left">
          <template slot-scope="scope">{{ scope.$index + 1 + (queryParams.pageNum - 1) * queryParams.pageSize }}</template>
        </el-table-column>
        <el-table-column label="耗材编码" align="center" prop="materialCode" width="100" min-width="100" show-overflow-tooltip resizable/>
        <el-table-column label="耗材名称" align="center" prop="materialName" width="160" min-width="120" show-overflow-tooltip resizable/>
        <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="90" show-overflow-tooltip resizable/>
        <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable/>
        <el-table-column label="单位" align="center" prop="unitName" width="80" min-width="70" show-overflow-tooltip resizable/>
        <el-table-column label="仓库" align="center" prop="warehouseName" width="120" min-width="90" show-overflow-tooltip resizable/>
        <el-table-column label="当前库存" align="center" prop="currentQty" width="100" min-width="90" show-overflow-tooltip resizable/>
        <el-table-column label="安全库存" align="center" prop="safetyStock" width="100" min-width="90" show-overflow-tooltip resizable/>
        <el-table-column label="预警状态" align="center" prop="alertStatus" width="100" min-width="90" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.alertStatus === 1 || scope.row.alertStatus === '1'" style="color: #E6A23C;">预警</span>
            <span v-else>正常</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" min-width="100" show-overflow-tooltip resizable/>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>共 {{ total }} 条，当前页 {{ list.length }} 条
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import { listInventoryAlert } from '@/api/warehouse/inventory'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import MaterialAutocomplete from '@/components/SelectModel/MaterialAutocomplete'
import RightToolbar from '@/components/RightToolbar'

export default {
  name: 'InventoryAlert',
  components: { SelectWarehouse, MaterialAutocomplete, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      list: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialName: null,
        alertStatus: null
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listInventoryAlert(this.queryParams).then(response => {
        this.list = response.rows || []
        this.total = response.total != null ? response.total : 0
        this.loading = false
      }).catch(() => {
        this.list = []
        this.total = 0
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.materialName = null
      this.queryParams.warehouseId = null
      this.queryParams.alertStatus = null
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleExport() {
      this.download('warehouse/inventory/exportInventoryAlert', {
        ...this.queryParams
      }, `inventory_alert_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style>
.app-container.inventory-alert-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.inventory-alert-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: -12px !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.inventory-alert-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
}
.inventory-alert-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.inventory-alert-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.inventory-alert-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}
</style>

<style scoped>
.app-container { margin-top: -10px; }
.query-row-left { margin-bottom: 2px; }
.query-item-inline { display: inline-block; margin-right: 16px; margin-bottom: 2px; }
.query-item-inline .el-form-item__label { width: 80px !important; }
.query-item-inline .el-form-item { margin-bottom: 0; }
.query-select-wrapper { width: 180px; }
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
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar { height: 6px; transition: height 0.2s ease; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover { height: 12px; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track { background: #e8e8e8; border-radius: 3px; margin: 0 2px; cursor: pointer; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb { background: #a0a0a0; border-radius: 3px; cursor: grab; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover { background: #808080; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active { background: #606060; cursor: grabbing; }
.table-container ::v-deep .el-table th.el-table__cell { padding: 10px 12px !important; }
.table-container ::v-deep .el-table th.el-table__cell .cell { white-space: nowrap; }
.table-container ::v-deep .el-table td.el-table__cell { padding: 10px 12px !important; }
.table-container ::v-deep .el-table .cell { padding: 0 4px; }
</style>
