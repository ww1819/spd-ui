<template>
  <div class="app-container list-page inventory-alert-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
              </div>
            </template>
            <template v-else-if="t === 'materialName'">
              <div class="query-select-wrapper more-search-select-wrap">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </template>
            <template v-else-if="t === 'supplier'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </template>
            <el-select
              v-else-if="t === 'alertStatus'"
              v-model="queryParams.alertStatus"
              placeholder="预警状态"
              clearable
              class="more-search-short-select"
            >
              <el-option label="全部" value=""/>
              <el-option label="预警" value="1"/>
              <el-option label="正常" value="0"/>
            </el-select>
            <el-select
              v-else-if="t === 'materialIsUse'"
              v-model="queryParams.materialIsUse"
              placeholder="启停用"
              clearable
              class="more-search-short-select"
            >
              <el-option
                v-for="dict in dict.type.is_use_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </div>
        </more-search-bar>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
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
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "warehouse", label: "仓库" },
        { value: "materialName", label: "耗材" },
        { value: "alertStatus", label: "预警状态" },
        { value: "materialIsUse", label: "产品档案" },
        { value: "supplier", label: "供应商" }
      ],
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
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.alert.moreSearchTypes"
    },
    builtInMoreSearchDefaults() {
      return ["warehouse", "materialName", "alertStatus", "materialIsUse", "supplier"]
    },
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
        : this.formatAmount(amt)
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
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
    moreSearchFieldClass(t) {
      if (t === "alertStatus" || t === "materialIsUse") return "more-search-field--short"
      return "more-search-field--select"
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults()
      }
      const fallback = this.builtInMoreSearchDefaults.slice()
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return fallback
        const allow = new Set(this.moreSearchOptions.map(o => o.value))
        const cleaned = parsed.filter(v => allow.has(v))
        return cleaned.length ? cleaned : fallback
      } catch (e) {
        return fallback
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || [])
      if (!set.has("warehouse")) target.warehouseId = null
      if (!set.has("materialName")) target.materialName = null
      if (!set.has("alertStatus")) target.alertStatus = null
      if (!set.has("materialIsUse")) target.materialIsUse = null
      if (!set.has("supplier")) target.supplierId = null
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
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
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listInventoryAlert(params).then(response => {
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
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 }
      this.applyMoreSearchToQueryParams(requestParams)
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
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
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
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}
/* 仅作布局包裹，横向滚动交给 el-table 表体，避免与 .el-table__body-wrapper 叠出双横条 */
.inventory-alert-table-scroll {
  width: 100%;
  min-width: 0;
  overflow: visible;
}
.inventory-alert-qty-warn {
  color: #f56c6c;
  font-weight: 600;
}
/* 表体横向可滚；表内合计已关闭，合计见下方 pagination-summary（外层不再 overflow-x，避免双横条） */
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar { height: 10px; transition: height 0.2s ease; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover { height: 14px; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track { background: #e8e8e8; border-radius: 3px; margin: 0 2px; cursor: pointer; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb { background: #a0a0a0; border-radius: 3px; cursor: grab; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover { background: #808080; }
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active { background: #606060; cursor: grabbing; }
.table-container ::v-deep .el-table th.el-table__cell { padding: 10px 12px !important; }
.table-container ::v-deep .el-table th.el-table__cell .cell { white-space: nowrap; }
.table-container ::v-deep .el-table td.el-table__cell { padding: 10px 12px !important; }
.table-container ::v-deep .el-table .cell { padding: 0 4px; }
</style>
