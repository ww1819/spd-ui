<template>
  <div class="app-container inventory-alert-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
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
            <el-form-item label="产品档案" prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="启停用" clearable style="width: 150px">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <div class="inventory-alert-table-scroll">
        <el-table
          v-loading="loading"
          :data="list"
          class="inventory-alert-table-el"
          border
          height="60vh"
          style="min-width: 1860px"
          show-summary
          :summary-method="getTotalSummaries"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" fixed="left"/>
          <el-table-column type="index" label="序号" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">{{ scope.$index + 1 + (queryParams.pageNum - 1) * queryParams.pageSize }}</template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" prop="materialCode" width="100" min-width="100" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" align="center" prop="materialName" width="160" min-width="120" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="materialSpeci" width="100" min-width="90" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="unitName" width="72" min-width="70" show-overflow-tooltip resizable/>
          <el-table-column label="当前库存" align="center" prop="currentQty" width="100" min-width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="inventory-alert-qty-warn">{{ formatInventoryAlertInt(scope.row.currentQty) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="安全库存" align="center" prop="safetyStock" width="100" min-width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="inventory-alert-qty-warn">{{ formatInventoryAlertInt(scope.row.safetyStock) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="unitPrice" width="100" min-width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">{{ formatInventoryAlertMoney(scope.row.unitPrice) }}</span>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="totalAmt" width="110" min-width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.totalAmt != null && scope.row.totalAmt !== ''">{{ formatInventoryAlertMoney(scope.row.totalAmt) }}</span>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="produceDate" width="110" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.produceDate ? parseTime(scope.row.produceDate, '{y}-{m}-{d}') : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="expiryDate" width="110" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.expiryDate ? parseTime(scope.row.expiryDate, '{y}-{m}-{d}') : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="batchNumber" width="120" min-width="100" show-overflow-tooltip resizable/>
          <el-table-column label="批次" align="center" prop="batchNo" width="130" min-width="110" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" min-width="100" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="supplierName" width="150" min-width="100" show-overflow-tooltip resizable/>
          <el-table-column label="仓库" align="center" prop="warehouseName" width="120" min-width="90" show-overflow-tooltip resizable/>
          <el-table-column label="产品档案状态" align="center" prop="materialIsUse" width="118" min-width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ materialUseDictLabel(scope.row.materialIsUse) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="预警状态" align="center" prop="alertStatus" width="100" min-width="96" fixed="right" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.alertStatus === 1 || scope.row.alertStatus === '1'" style="color: #E6A23C;">预警</span>
              <span v-else>正常</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQtyInt }}，当前页金额: {{ pageTotalAmtFormatted }}
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
import { exportInventoryAlertStyledXlsx } from '@/utils/departmentOutSummaryExport'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import MaterialAutocomplete from '@/components/SelectModel/MaterialAutocomplete'
import RightToolbar from '@/components/RightToolbar'

export default {
  name: 'InventoryAlert',
  dicts: ['is_use_status'],
  components: { SelectWarehouse, SelectSupplier, MaterialAutocomplete, RightToolbar },
  data() {
    return {
      loading: true,
      showSearch: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      list: [],
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialName: null,
        alertStatus: null,
        supplierId: null,
        materialIsUse: null
      }
    }
  },
  computed: {
    pageTotalQty() {
      return (this.list || []).reduce((s, r) => s + Number(r.currentQty || 0), 0)
    },
    pageTotalQtyInt() {
      return Math.round(this.pageTotalQty)
    },
    pageTotalAmtFormatted() {
      const amt = (this.list || []).reduce((s, r) => s + Number(r.totalAmt || 0), 0)
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : Number(amt).toFixed(2)
    }
  },
  created() {
    this.mergeRouteQueryToSearch()
    this.getList()
  },
  watch: {
    $route() {
      this.mergeRouteQueryToSearch()
      this.handleQuery()
    }
  },
  methods: {
    /** 深链：库存查询页 ?materialName= / ?materialCode= / ?alertStatus= */
    mergeRouteQueryToSearch() {
      const q = (this.$route && this.$route.query) || {}
      let touched = false
      if (q.materialName != null && String(q.materialName).trim() !== '') {
        this.queryParams.materialName = String(q.materialName).trim()
        touched = true
      } else if (q.materialCode != null && String(q.materialCode).trim() !== '') {
        this.queryParams.materialName = String(q.materialCode).trim()
        touched = true
      }
      if (q.alertStatus != null && String(q.alertStatus).trim() !== '') {
        this.queryParams.alertStatus = String(q.alertStatus).trim()
        touched = true
      }
      if (touched) {
        this.queryParams.pageNum = 1
      }
    },
    materialUseDictLabel(isUse) {
      if (isUse === undefined || isUse === null || isUse === '') return '--';
      const v = this.selectDictLabel && this.dict && this.dict.type && this.dict.type.is_use_status
        ? this.selectDictLabel(this.dict.type.is_use_status, String(isUse))
        : '';
      return v || '--';
    },
    formatInventoryAlertInt(v) {
      if (v === null || v === undefined || v === '') return '—'
      const n = Math.round(Number(v))
      return Number.isFinite(n) ? String(n) : '—'
    },
    formatInventoryAlertMoney(v) {
      const n = parseFloat(v)
      if (!Number.isFinite(n)) return '0.00'
      return n.toFixed(2)
    },
    getTotalSummaries(param) {
      const { columns, data } = param
      const sums = Array(columns.length).fill('')
      let totalQty = 0
      let totalAmt = 0
      for (let i = 0; i < (data || []).length; i++) {
        const row = data[i] || {}
        totalQty += Number(row.currentQty || 0)
        totalAmt += Number(row.totalAmt || 0)
      }
      columns.forEach((column, index) => {
        if (column.property === 'currentQty') {
          sums[index] = String(Math.round(totalQty))
        }
        if (column.property === 'totalAmt') {
          sums[index] = totalAmt.toFixed(2)
        }
      })
      sums[0] = ''
      if (sums.length > 1) {
        sums[1] = '合计'
      }
      return sums
    },
    getList() {
      this.loading = true
      listInventoryAlert(this.queryParams).then(response => {
        this.list = response.rows || []
        this.total = response.total != null ? response.total : 0
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 }
        this.loading = false
      }).catch(() => {
        this.list = []
        this.total = 0
        this.totalInfo = { totalQty: 0, totalAmt: 0 }
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
      this.queryParams.supplierId = null
      this.queryParams.materialIsUse = null
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 }
      this.loading = true
      try {
        const response = await listInventoryAlert(requestParams)
        const rows = response.rows || []
        if (!rows.length) {
          this.$message && this.$message.warning('暂无数据可导出')
          return
        }
        const now = new Date()
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        await exportInventoryAlertStyledXlsx({
          rows,
          beginDate: '',
          endDate: '',
          fileName: `库存预警表${dateStr}.xlsx`,
        })
      } catch (e) {
        console.error(e)
        this.$message && this.$message.error('导出失败，请稍后重试')
      } finally {
        this.loading = false
      }
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
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.inventory-alert-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
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
.query-row-second { margin-bottom: 2px; position: relative; }
.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}
.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}
.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
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
.inventory-alert-table-scroll {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.inventory-alert-table-scroll::-webkit-scrollbar {
  height: 10px;
}
.inventory-alert-table-scroll::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 4px;
}
.inventory-alert-table-scroll::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 4px;
}
.inventory-alert-table-scroll::-webkit-scrollbar-thumb:hover {
  background: #808080;
}
.inventory-alert-qty-warn {
  color: #f56c6c;
  font-weight: 600;
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
.table-container ::v-deep .el-table__body-wrapper { padding-bottom: 32px; }
.table-container ::v-deep .el-table__footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  background: #fff;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  background: #fff;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell .cell,
.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell .cell {
  white-space: nowrap;
  overflow: visible;
}
</style>
