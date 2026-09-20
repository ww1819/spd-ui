<template>
  <div class="app-container list-page first-inventory-page inv-alert-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--select">
            <div class="query-select-wrapper more-search-select-wrap">
              <SelectSupplier v-model="queryParams.supplierId" />
            </div>
          </div>
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
                <MaterialAutocomplete v-model="queryParams.materialName" placeholder="产品编码/名称/简码"/>
              </div>
            </template>
          </div>
        </div>
        <!-- 仅用于读写「更多检索」本地默认，界面不展示 -->
        <more-search-bar
          ref="moreSearchBar"
          class="ctk-more-search-bar--hidden"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          :show-picker="false"
          :show-save="false"
          :show-search-actions="false"
          @change="onMoreSearchTypesChange"
        />

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-item-inline">
              <el-select
                v-model="queryParams.alertStatus"
                placeholder="预警状态"
                clearable
                class="more-search-short-select"
              >
                <el-option label="全部" value=""/>
                <el-option label="预警" value="1"/>
                <el-option label="正常" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item class="query-item-inline">
              <el-select
                v-model="queryParams.materialIsUse"
                placeholder="产品档案"
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
            </el-form-item>
            <div class="ctk-query-actions query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="list-toolbar ctk-list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <div
          class="toolbar-more-search"
          @mouseenter="onToolbarMoreEnter"
          @mouseleave="onToolbarMoreLeave"
        >
          <span class="more-search-label">更多检索</span>
          <el-select
            ref="toolbarMoreSelect"
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            size="small"
            :popper-append-to-body="false"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
            @visible-change="onToolbarMoreVisibleChange"
          >
            <el-option
              v-for="opt in moreSearchOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button
          type="success"
          size="small"
          icon="el-icon-check"
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        >保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="invDetailTable"
        class="inv-detail-main-table"
        v-loading="loading"
        :data="list"
        :row-key="getDetailRowKey"
        :row-class-name="invDetailRowClassName"
        border
        stripe
        :height="tableHeight"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleDetailRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" fixed="left"/>
        <el-table-column type="index" label="序号" width="72" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">{{ scope.$index + 1 + (queryParams.pageNum - 1) * queryParams.pageSize }}</template>
        </el-table-column>
        <el-table-column label="产品编码" align="center" prop="materialCode" width="100" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
        <el-table-column label="产品名称" align="center" prop="materialName" width="160" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName"/>
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
        { value: "materialName", label: "产品" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialName: null,
        alertStatus: null,
        supplierId: null,
        materialIsUse: null
      },
      selectedRowKeys: [],
      tableHeight: 400,
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null
    }
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.alert.moreSearchTypes"
    },
    builtInMoreSearchDefaults() {
      return ["warehouse", "materialName"]
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
  mounted() {
    this.$nextTick(() => {
      this.updateTableHeight()
      setTimeout(() => this.updateTableHeight(), 80)
    })
    window.addEventListener('resize', this.updateTableHeight)
  },
  activated() {
    this.$nextTick(() => this.updateTableHeight())
  },
  beforeDestroy() {
    this.clearToolbarMoreCloseTimer()
    window.removeEventListener('resize', this.updateTableHeight)
  },
  watch: {
    $route() {
      this.mergeRouteQueryToSearch()
      this.handleQuery()
    },
    showSearch() {
      this.$nextTick(() => this.updateTableHeight())
    }
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel
        if (!panel) return
        const h = Math.floor(panel.clientHeight)
        if (h > 120) {
          this.tableHeight = h
          this.$nextTick(() => {
            if (this.$refs.invDetailTable && this.$refs.invDetailTable.doLayout) {
              this.$refs.invDetailTable.doLayout()
            }
          })
        }
      })
    },
    moreSearchFieldClass(t) {
      if (t === "alertStatus" || t === "materialIsUse") return "more-search-field--short"
      return "more-search-field--select"
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim()
      const vb = (getVal(b) || '').toString().trim()
      return va.localeCompare(vb, 'zh-CN')
    },
    sortByMaterialCode(a, b) {
      return this.sortByStr(a, b, r => r.materialCode || '')
    },
    sortByMaterialName(a, b) {
      return this.sortByStr(a, b, r => r.materialName || '')
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
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
    saveMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar
      if (bar && typeof bar.saveDefaults === 'function') {
        bar.saveDefaults()
      }
    },
    clearToolbarMoreCloseTimer() {
      if (this.toolbarMoreCloseTimer) {
        clearTimeout(this.toolbarMoreCloseTimer)
        this.toolbarMoreCloseTimer = null
      }
    },
    setToolbarMoreVisible(visible) {
      const sel = this.$refs.toolbarMoreSelect
      if (!sel) return
      if (sel.visible === visible) return
      sel.visible = visible
      if (!visible && typeof sel.blur === 'function') {
        sel.blur()
      }
    },
    onToolbarMoreEnter() {
      this.toolbarMoreHover = true
      this.clearToolbarMoreCloseTimer()
      this.setToolbarMoreVisible(true)
    },
    onToolbarMoreLeave() {
      this.toolbarMoreHover = false
      this.clearToolbarMoreCloseTimer()
      this.toolbarMoreCloseTimer = setTimeout(() => {
        if (!this.toolbarMoreHover) {
          this.setToolbarMoreVisible(false)
        }
      }, 280)
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false
      }
    },
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
      if (isUse === undefined || isUse === null || isUse === '') return '--'
      const v = this.selectDictLabel && this.dict && this.dict.type && this.dict.type.is_use_status
        ? this.selectDictLabel(this.dict.type.is_use_status, String(isUse))
        : '';
      return v || '--'
    },
    formatInventoryAlertInt(v) {
      if (v === null || v === undefined || v === '') return '—'
      const n = Math.round(Number(v))
      return Number.isFinite(n) ? String(n) : '—'
    },
    formatInventoryAlertMoney(v) {
      const n = parseFloat(v)
      if (!Number.isFinite(n)) return '0'
      return this.formatAmount(n)
    },
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listInventoryAlert(params).then(response => {
        const rows = response.rows || []
        this.list = rows.map((item, idx) => {
          const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10)
          return {
            ...item,
            _rowKey: `${pageBase + idx}_${item.id || ''}_${item.materialCode || ''}_${item.batchNo || ''}`
          }
        })
        this.total = response.total != null ? response.total : 0
        this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 }
        this.selectedRowKeys = []
        this.ids = []
        this.loading = false
        this.$nextTick(() => this.updateTableHeight())
      }).catch(() => {
        this.list = []
        this.total = 0
        this.totalInfo = { totalQty: 0, totalAmt: 0 }
        this.selectedRowKeys = []
        this.ids = []
        this.loading = false
      })
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || (row && row.id) || ''
    },
    invDetailRowClassName({ row }) {
      const key = this.getDetailRowKey(row)
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'inv-row-selected'
      }
      return ''
    },
    handleDetailRowDblclick(row) {
      const table = this.$refs.invDetailTable
      if (!table || !row) return
      const key = this.getDetailRowKey(row)
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || []
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDetailRowKey(r) === key)
      ))
      table.toggleRowSelection(row, !selected)
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
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row))
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
.app-container.first-inventory-page {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  flex: 0 0 auto !important;
  gap: 12px !important;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 4px 0 6px !important;
  min-height: 40px !important;
  overflow: visible !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 32px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto !important;
  padding: 0 4px !important;
  flex: 0 0 auto !important;
  overflow: visible !important;
  background: transparent !important;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}

.first-inventory-page .el-table th .cell {
  white-space: nowrap;
}

.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th,
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

.inv-alert-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.inv-alert-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.inv-alert-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.inv-alert-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.inv-alert-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.inv-alert-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
}

.first-inventory-page .inv-detail-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.query-select-wrapper {
  width: 180px;
}

.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: 32px;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}

.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.ctk-more-search-bar--hidden {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
.more-search-type {
  width: 148px;
  min-width: 148px;
  max-width: 148px;
}

.query-row-second {
  margin-top: 0;
  margin-bottom: 0;
}

.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding-bottom: 0;
}
.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
}
.ctk-query-actions {
  margin-left: 0 !important;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.form-fields-container {
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  flex-wrap: nowrap !important;
  align-items: center !important;
}
.ctk-list-toolbar .list-toolbar-right {
  flex-wrap: nowrap !important;
  flex-shrink: 0;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
  flex: 1 1 auto;
}

.inventory-alert-qty-warn {
  color: #f56c6c;
  font-weight: 600;
}

.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}
</style>
