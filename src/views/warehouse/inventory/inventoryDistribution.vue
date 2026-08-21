<template>
  <div class="app-container list-page inventory-distribution-page">
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
            class="more-search-dynamic-field more-search-field--select"
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
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
            <el-form-item label="分组" prop="groupBy" class="query-item-inline">
              <el-select v-model="queryParams.groupBy" placeholder="请选择" class="more-search-short-select">
                <el-option label="仓库" value="warehouse"/>
                <el-option label="供应商" value="supplier"/>
                <el-option label="生产厂家" value="factory"/>
                <el-option label="库房分类" value="warehouseCategory"/>
              </el-select>
            </el-form-item>
            <el-form-item label="口径" prop="metric" class="query-item-inline">
              <el-select v-model="queryParams.metric" placeholder="请选择" class="more-search-short-select">
                <el-option label="库存数量" value="qty"/>
                <el-option label="金额" value="amt"/>
              </el-select>
            </el-form-item>
            <el-form-item label="Top" prop="topN" class="query-item-inline">
              <el-input-number v-model="queryParams.topN" :min="1" :max="50" controls-position="right" class="query-input-topn"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="handleQuery"></right-toolbar>
      </div>
    </el-row>

    <div class="detail-container">
      <el-row :gutter="10" style="height: 100%;">
        <el-col :span="14" style="height: 100%;">
          <div class="detail-box">
            <div class="detail-title">明细框</div>
            <el-table v-loading="loading" :data="groupRows" height="46vh" border>
              <el-table-column type="index" label="序号" width="80" align="center"/>
              <el-table-column :label="groupLabel" prop="groupName" min-width="160" show-overflow-tooltip/>
              <el-table-column label="库存数量" prop="qty" width="120" align="right">
                <template slot-scope="scope">
                  <span>{{ scope.row.qty != null ? scope.row.qty : 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column label="金额" prop="amt" width="140" align="right">
                <template slot-scope="scope">
                  <span>{{ formatAmt(scope.row.amt) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
        <el-col :span="10" style="height: 100%;">
          <div class="detail-box pie-box-shift-right">
            <div class="detail-title">饼状图</div>
            <div ref="pieChart" class="pie-chart"></div>
          </div>
        </el-col>
        <el-col v-if="false" :span="7" style="height: 100%;">
          <div class="detail-box">
            <div class="detail-title">柱状图</div>
            <div ref="barChart" class="bar-chart"></div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { listInventoryDistribution } from '@/api/warehouse/inventory'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import MaterialAutocomplete from '@/components/SelectModel/MaterialAutocomplete'
import RightToolbar from '@/components/RightToolbar'

export default {
  name: 'InventoryDistribution',
  components: { SelectWarehouse, SelectSupplier, MaterialAutocomplete, RightToolbar },
  data() {
    return {
      showSearch: true,
      loading: false,
      groupRows: [],
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "warehouse", label: "仓库" },
        { value: "materialName", label: "耗材" },
        { value: "supplier", label: "供应商" }
      ],
      queryParams: {
        warehouseId: null,
        supplierId: null,
        materialName: null,
        beginDate: null,
        endDate: null,
        groupBy: 'warehouse',
        metric: 'qty',
        topN: 10
      },
      chart: null,
      chartPie: null
    }
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.distribution.moreSearchTypes"
    },
    builtInMoreSearchDefaults() {
      return ["warehouse", "materialName", "supplier"]
    },
    groupLabel() {
      const m = {
        warehouse: '仓库',
        supplier: '供应商',
        factory: '生产厂家',
        warehouseCategory: '库房分类'
      }
      return m[this.queryParams.groupBy] || '分组'
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.resizeChart, { passive: true })
    this.handleQuery()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeChart)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
    if (this.chartPie) {
      this.chartPie.dispose()
      this.chartPie = null
    }
  },
  methods: {
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
      if (!set.has("supplier")) target.supplierId = null
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
    formatAmt(v) {
      const n = Number(v || 0)
      const f = this.$options.filters && this.$options.filters.formatCurrency
      return f ? f(n) : n.toFixed(2)
    },
    initChart() {
      if (this.$refs.barChart && !this.chart) {
        this.chart = echarts.init(this.$refs.barChart, 'macarons')
      }
      if (this.$refs.pieChart && !this.chartPie) {
        this.chartPie = echarts.init(this.$refs.pieChart, 'macarons')
      }
      this.renderChart()
    },
    resizeChart() {
      if (this.chart) this.chart.resize()
      if (this.chartPie) this.chartPie.resize()
    },
    renderChart() {
      const top = (this.groupRows || []).slice(0, Number(this.queryParams.topN) || 10)
      const seriesName = this.queryParams.metric === 'amt' ? '金额' : '库存数量'
      const totalQty = top.reduce((s, r) => s + Number(r.qty || 0), 0)
      const totalAmt = top.reduce((s, r) => s + Number(r.amt || 0), 0)
      if (this.chart) {
        const x = top.map(r => r.groupName)
        const y = top.map(r => (this.queryParams.metric === 'amt' ? Number(r.amt || 0) : Number(r.qty || 0)))
        this.chart.setOption({
          grid: { left: 10, right: 10, top: 30, bottom: 10, containLabel: true },
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          xAxis: { type: 'value' },
          yAxis: { type: 'category', data: x, axisLabel: { interval: 0 } },
          series: [{ name: seriesName, type: 'bar', data: y, barMaxWidth: 20 }]
        }, true)
      }
      if (this.chartPie) {
        const rowByName = new Map(top.map(r => [r.groupName, r]))
        const pieData = top.map(r => ({
          name: r.groupName,
          value: this.queryParams.metric === 'amt' ? Number(r.amt || 0) : Number(r.qty || 0)
        }))
        this.chartPie.setOption({
          tooltip: {
            trigger: 'item',
            formatter: (p) => {
              const row = rowByName.get(p.name) || { qty: 0, amt: 0 }
              const qty = Number(row.qty || 0)
              const amt = Number(row.amt || 0)
              const qtyPct = totalQty > 0 ? ((qty / totalQty) * 100).toFixed(1) : '0.0'
              const amtPct = totalAmt > 0 ? ((amt / totalAmt) * 100).toFixed(1) : '0.0'
              return `${p.name}<br/>库存数量：${qty}（${qtyPct}%）<br/>金额：${this.formatAmt(amt)}（${amtPct}%）`
            }
          },
          legend: { type: 'scroll', bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
          series: [{
            name: seriesName,
            type: 'pie',
            radius: ['32%', '58%'],
            center: ['50%', '44%'],
            data: pieData,
            label: {
              fontSize: 11,
              formatter: (p) => {
                const row = rowByName.get(p.name) || { qty: 0, amt: 0 }
                const qty = Number(row.qty || 0)
                const amt = Number(row.amt || 0)
                const qtyPct = totalQty > 0 ? ((qty / totalQty) * 100).toFixed(1) : '0.0'
                const amtPct = totalAmt > 0 ? ((amt / totalAmt) * 100).toFixed(1) : '0.0'
                return `${p.name}\n数:${qtyPct}% 金:${amtPct}%`
              }
            },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.15)' } }
          }]
        }, true)
      }
    },
    handleQuery() {
      this.loading = true
      const q = {
        warehouseId: this.queryParams.warehouseId,
        supplierId: this.queryParams.supplierId,
        materialName: this.queryParams.materialName,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        distributionGroupBy: this.queryParams.groupBy || 'warehouse'
      }
      this.applyMoreSearchToQueryParams(q)
      listInventoryDistribution(q).then(res => {
        const rows = (res && res.data) ? res.data : []
        let list = rows.map(r => ({
          groupName: r.groupName != null ? String(r.groupName) : '未填写',
          qty: Number(r.qty || 0),
          amt: Number(r.amt || 0)
        }))
        const metric = this.queryParams.metric
        list.sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0))
        const topN = Number(this.queryParams.topN) || 10
        this.groupRows = list.slice(0, topN)
        this.$nextTick(() => {
          this.initChart()
          this.renderChart()
        })
      }).finally(() => {
        this.loading = false
      })
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.warehouseId = null
      this.queryParams.supplierId = null
      this.queryParams.materialName = null
      this.queryParams.beginDate = null
      this.queryParams.endDate = null
      this.queryParams.groupBy = 'warehouse'
      this.queryParams.metric = 'qty'
      this.queryParams.topN = 10
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.handleQuery()
    }
  }
}
</script>

<style>
/* 与库存明细查询一致：内层不叠加左右 padding，由 inventory-query-page 统一 8px */
.app-container.inventory-distribution-page {
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

.query-select-metric {
  width: 120px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
}

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

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 150px;
}
.query-item-date-range .query-date-start {
  margin-right: 6px;
}
.query-item-date-range .query-date-end {
  margin-left: 6px;
}
.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
}

.query-input-topn {
  width: 140px;
}

/* 与库存明细查询 query-fields 容器一致 */
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

.detail-container {
  margin-top: 8px;
  height: calc(100vh - 260px);
  margin-left: 0;
  margin-right: 0;
}

.detail-box {
  background: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 8px;
  height: 100%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
}

.detail-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.pie-box-shift-right {
  padding-left: 18px;
}

.bar-chart,
.pie-chart {
  width: 100%;
  height: 46vh;
}
</style>

