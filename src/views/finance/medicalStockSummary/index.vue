<template>
  <div class="app-container list-page medical-stock-summary-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" class="query-form">
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
            class="more-search-dynamic-field more-search-field--select"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseIds" :finance-pick-mode="true" :multiple="true" clearable />
              </div>
            </template>
            <template v-else-if="t === 'supplier'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectSupplier v-model="queryParams.supplerId" :finance-pick-mode="true" clearable />
              </div>
            </template>
            <template v-else>
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" :finance-pick-mode="true" clearable />
              </div>
            </template>
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="开始时间" class="query-item-inline">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="开始时间"
                class="query-date-picker"
              />
            </el-form-item>
            <el-form-item label="结束时间" class="query-item-inline">
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="结束时间"
                class="query-date-picker"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left"></div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="loadCurrentTab" />
      </div>
    </el-row>
    <p class="report-tip">统计口径：耗材出库单（201）金额计为正，退库单（401）金额计为负；两个 Tab 均按此出退库数据汇总。</p>

    <el-tabs v-model="activeTab" @tab-click="loadCurrentTab">
      <el-tab-pane label="卫材入库" name="inbound">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="warning"
              icon="el-icon-download"
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="handleExportInbound"
              v-hasPermi="['finance:medicalStockSummary:export']"
            >导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loadingInbound" :data="inboundList" border>
          <el-table-column label="日期" prop="statDate" align="center" width="160" />
          <el-table-column label="供货商" prop="supplierName" align="center" min-width="220" />
          <el-table-column label="材料类别" prop="materialCategoryName" align="center" min-width="180" />
          <el-table-column label="金额" prop="amount" align="right" width="160">
            <template slot-scope="scope">
              {{ formatAmount(scope.row.amount) }}
            </template>
          </el-table-column>
        </el-table>
        <div v-if="inboundTotal > 0" class="pagination-summary">
          <span class="summary-label">合计：</span>总金额（全部）：{{ formatAmount(inboundTotalInfo.totalAmt) }}，当前页金额：{{ inboundPageAmountFormatted }}
        </div>
        <pagination
          v-show="inboundTotal > 0"
          :total="inboundTotal"
          :page.sync="inboundPage.pageNum"
          :limit.sync="inboundPage.pageSize"
          @pagination="onInboundPagination"
        />
      </el-tab-pane>

      <el-tab-pane label="卫材出库" name="outbound">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="warning"
              icon="el-icon-download"
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="handleExportOutbound"
              v-hasPermi="['finance:medicalStockSummary:export']"
            >导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loadingOutbound" :data="outboundList" border>
          <el-table-column label="日期" prop="statDate" align="center" width="160" />
          <el-table-column label="科室名称" prop="departmentName" align="center" min-width="180" />
          <el-table-column label="材料类别" prop="materialCategoryName" align="center" min-width="180" />
          <el-table-column label="金额" prop="amount" align="right" width="160">
            <template slot-scope="scope">
              {{ formatAmount(scope.row.amount) }}
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" align="center" width="120" />
          <el-table-column label="是否高值" prop="isGzText" align="center" width="100" />
        </el-table>
        <div v-if="outboundTotal > 0" class="pagination-summary">
          <span class="summary-label">合计：</span>总金额（全部）：{{ formatAmount(outboundTotalInfo.totalAmt) }}，当前页金额：{{ outboundPageAmountFormatted }}
        </div>
        <pagination
          v-show="outboundTotal > 0"
          :total="outboundTotal"
          :page.sync="outboundPage.pageNum"
          :limit.sync="outboundPage.pageSize"
          @pagination="onOutboundPagination"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { listMedicalInboundSummary, listMedicalOutboundSummary } from '@/api/finance/medicalStockSummary'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

function monthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const first = new Date(y, m, 1, 0, 0, 0)
  const last = new Date(y, m + 1, 0, 23, 59, 59)
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  return { beginDate: fmt(first), endDate: fmt(last) }
}

export default {
  name: 'MedicalStockSummary',
  components: { SelectWarehouse, SelectSupplier, SelectDepartment },
  data() {
    return {
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '仓库', value: 'warehouse' },
        { label: '供应商', value: 'supplier' },
        { label: '科室', value: 'department' }
      ],
      activeTab: 'inbound',
      queryParams: {
        ...monthRange(),
        warehouseIds: [],
        supplerId: null,
        departmentId: null,
      },
      inboundList: [],
      inboundTotal: 0,
      inboundTotalInfo: { totalAmt: 0 },
      inboundPage: { pageNum: 1, pageSize: 10 },
      outboundList: [],
      outboundTotal: 0,
      outboundTotalInfo: { totalAmt: 0 },
      outboundPage: { pageNum: 1, pageSize: 10 },
      loadingInbound: false,
      loadingOutbound: false,
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.loadInbound()
  },
  computed: {
    moreSearchStorageKey() {
      return 'spd.finance.medicalStockSummary.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    },
    inboundPageAmountFormatted() {
      const list = this.inboundList || []
      const s = list.reduce((acc, row) => acc + Number(row && row.amount != null ? row.amount : 0), 0)
      return Number.isFinite(s) ? s.toFixed(2) : '0.00'
    },
    outboundPageAmountFormatted() {
      const list = this.outboundList || []
      const s = list.reduce((acc, row) => acc + Number(row && row.amount != null ? row.amount : 0), 0)
      return Number.isFinite(s) ? s.toFixed(2) : '0.00'
    },
  },
  methods: {
    formatAmount(v) {
      const n = Number(v || 0)
      if (Number.isNaN(n)) return v
      return n.toFixed(2)
    },
    buildBaseParams() {
      const p = {
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        warehouseIds: this.queryParams.warehouseIds,
        supplerId: this.queryParams.supplerId,
        departmentId: this.queryParams.departmentId,
      }
      this.applyMoreSearchToQueryParams(p)
      if (Array.isArray(p.warehouseIds) && p.warehouseIds.length === 0) {
        p.warehouseIds = null
      }
      return p
    },
    loadCurrentTab() {
      if (this.activeTab === 'inbound') {
        this.loadInbound()
      } else {
        this.loadOutbound()
      }
    },
    /** Pagination 组件在翻页/改页大小时先 emit pagination，再同步 .sync；需显式写入 pageNum/pageSize 再请求 */
    onInboundPagination({ page, limit }) {
      if (page != null) {
        this.inboundPage.pageNum = page
      }
      if (limit != null) {
        this.inboundPage.pageSize = limit
      }
      this.loadInbound()
    },
    onOutboundPagination({ page, limit }) {
      if (page != null) {
        this.outboundPage.pageNum = page
      }
      if (limit != null) {
        this.outboundPage.pageSize = limit
      }
      this.loadOutbound()
    },
    loadInbound() {
      this.loadingInbound = true
      listMedicalInboundSummary({ ...this.buildBaseParams(), ...this.inboundPage }).then((res) => {
        this.inboundList = res.rows || []
        this.inboundTotal = Number(res.total) || 0
        this.inboundTotalInfo = res.totalInfo && res.totalInfo.totalAmt != null
          ? { totalAmt: res.totalInfo.totalAmt }
          : { totalAmt: 0 }
      }).finally(() => {
        this.loadingInbound = false
      })
    },
    loadOutbound() {
      this.loadingOutbound = true
      listMedicalOutboundSummary({ ...this.buildBaseParams(), ...this.outboundPage }).then((res) => {
        this.outboundList = res.rows || []
        this.outboundTotal = Number(res.total) || 0
        this.outboundTotalInfo = res.totalInfo && res.totalInfo.totalAmt != null
          ? { totalAmt: res.totalInfo.totalAmt }
          : { totalAmt: 0 }
      }).finally(() => {
        this.loadingOutbound = false
      })
    },
    handleQuery() {
      this.inboundPage.pageNum = 1
      this.outboundPage.pageNum = 1
      this.loadCurrentTab()
    },
    resetQuery() {
      Object.assign(this.queryParams, {
        ...monthRange(),
        warehouseIds: [],
        supplerId: null,
        departmentId: null,
      })
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.inboundPage.pageNum = 1
      this.outboundPage.pageNum = 1
      this.loadCurrentTab()
    },
    moreSearchFieldClass() {
      return 'more-search-field--select'
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar
      if (bar && typeof bar.loadDefaults === 'function') {
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
      const map = {
        warehouse: 'warehouseIds',
        supplier: 'supplerId',
        department: 'departmentId'
      }
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = type === 'warehouse' ? [] : null
        }
      })
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
    handleExportInbound() {
      this.download('/finance/medicalStockSummary/inbound/export', this.buildBaseParams(), `卫材入库汇总_${Date.now()}.xlsx`)
    },
    handleExportOutbound() {
      this.download('/finance/medicalStockSummary/outbound/export', this.buildBaseParams(), `卫材出库汇总_${Date.now()}.xlsx`)
    },
  },
}
</script>

<style scoped>
.list-query-panel {
  margin-top: -20px;
}
.report-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.pagination-summary {
  margin: 10px 0 6px;
  font-size: 13px;
  color: #606266;
}
.pagination-summary .summary-label {
  font-weight: 600;
  color: #303133;
}
</style>
