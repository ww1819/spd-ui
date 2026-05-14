<template>
  <div class="app-container hc-barcode-circulation">
    <el-row :gutter="12" type="flex" class="top-board-row" align="stretch">
      <el-col :xs="24" :sm="24" :md="7" :lg="6" :xl="5">
        <el-card shadow="never" class="product-card" :body-style="{ padding: '10px 14px', height: '100%' }">
          <div class="product-info-title">商品信息</div>
          <template v-if="productInfo.hasData">
            <div class="info-row"><span class="info-label">品名</span><span class="info-value">{{ productInfo.materialName || '—' }}</span></div>
            <div class="info-row"><span class="info-label">产品编码</span><span class="info-value">{{ productInfo.materialCode || '—' }}</span></div>
            <div class="info-row"><span class="info-label">规格</span><span class="info-value">{{ productInfo.materialSpeci || '—' }}</span></div>
            <div class="info-row"><span class="info-label">型号</span><span class="info-value">{{ productInfo.materialModel || '—' }}</span></div>
            <div class="info-row"><span class="info-label">高低值</span><span class="info-value">{{ productInfo.valueLevelText }}</span></div>
            <div class="info-row"><span class="info-label">条码</span><span class="info-value">{{ productInfo.barcodeValue || '—' }}</span></div>
            <div class="info-row"><span class="info-label">主档ID</span><span class="info-value text-mono">{{ productInfo.hcBarcodeMasterId || '—' }}</span></div>
          </template>
          <div v-else class="product-info-empty">暂无数据，请使用「条码值」查询流通记录后展示</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="17" :lg="18" :xl="19">
        <el-card shadow="never" class="chart-card" :body-style="{ padding: '8px 12px 4px', height: '100%' }">
          <div class="chart-card-title">标签码履历图</div>
          <div ref="barcodeHistoryChart" class="barcode-history-chart" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10" class="mb8 toolbar-row" type="flex" align="middle">
      <el-col :xs="24" :sm="24" :md="18" :lg="19" :xl="20">
        <div class="toolbar-inline">
          <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true" label-width="68px" class="toolbar-query-form">
            <el-form-item label="条码值" prop="barcodeValue">
              <el-input v-model="queryParams.barcodeValue" placeholder="模糊匹配" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-button
            type="warning"
            icon="el-icon-download"
            size="small"
            @click="handleExport"
            v-hasPermi="['hc:barcode:public:circulation:export']"
          >导出</el-button>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="5" :xl="4" class="toolbar-right-col">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="dataList" border stripe size="small" :max-height="tableMaxHeight">
      <el-table-column label="标签码" prop="barcodeValue" min-width="140" show-overflow-tooltip />
      <el-table-column label="产品编码" prop="materialCode" min-width="120" show-overflow-tooltip />
      <el-table-column label="产品名称" prop="materialName" min-width="160" show-overflow-tooltip />
      <el-table-column label="规格" prop="materialSpeci" min-width="120" show-overflow-tooltip />
      <el-table-column label="型号" prop="materialModel" min-width="100" show-overflow-tooltip />
      <el-table-column label="业务类型" prop="eventName" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作人" prop="operatorName" width="100" show-overflow-tooltip />
      <el-table-column label="生成日期" prop="createTime" width="160" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : '—' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listHcBarcodeCirculation } from '@/api/warehouse/hcBarcodePublic'

export default {
  name: 'HcBarcodeCirculation',
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      dataList: [],
      productInfo: {
        hasData: false,
        materialName: '',
        materialCode: '',
        materialSpeci: '',
        materialModel: '',
        valueLevelText: '—',
        barcodeValue: '',
        hcBarcodeMasterId: ''
      },
      tableMaxHeight: 360,
      historyChartInstance: null,
      _historyChartResizeHandler: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        hcBarcodeMasterId: undefined,
        barcodeValue: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  mounted() {
    this.$nextTick(() => {
      this.updateTableMaxHeight()
      this.initBarcodeHistoryChart()
      this._historyChartResizeHandler = () => {
        this.updateTableMaxHeight()
        if (this.historyChartInstance) {
          this.historyChartInstance.resize()
        }
      }
      window.addEventListener('resize', this._historyChartResizeHandler)
    })
  },
  beforeDestroy() {
    if (this._historyChartResizeHandler) {
      window.removeEventListener('resize', this._historyChartResizeHandler)
      this._historyChartResizeHandler = null
    }
    if (this.historyChartInstance) {
      this.historyChartInstance.dispose()
      this.historyChartInstance = null
    }
  },
  methods: {
    updateTableMaxHeight() {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      this.tableMaxHeight = Math.max(220, Math.min(560, vh - 500))
    },
    /** 0=仓库侧（下） 1=科室侧（上） */
    flowLaneIndex(row) {
      const code = String(row.eventCode || row.event_code || '').toUpperCase()
      if (['GZ_SHIP_OUT', 'KS_XH', 'KS_TXH'].includes(code)) {
        return 1
      }
      const name = String(row.eventName || row.event_name || '')
      if (/科室/.test(name) && !/仓库/.test(name) && !/院区/.test(name)) {
        return 1
      }
      const toD = row.toDepartmentId != null ? row.toDepartmentId : row.to_department_id
      if (toD != null && String(toD).trim() !== '') {
        return 1
      }
      return 0
    },
    formatEventTime(row) {
      const t = row.eventTime != null ? row.eventTime : row.event_time
      if (!t) {
        return '—'
      }
      return this.parseTime(t, '{y}-{m}-{d}\n{h}:{i}:{s}')
    },
    initBarcodeHistoryChart() {
      const el = this.$refs.barcodeHistoryChart
      if (!el || !this.$echarts) {
        return
      }
      if (this.historyChartInstance) {
        this.historyChartInstance.dispose()
      }
      this.historyChartInstance = this.$echarts.init(el)
      this.applyHistoryChartOption([])
    },
    applyHistoryChartOption(rows) {
      if (!this.historyChartInstance) {
        return
      }
      const sorted = [...(rows || [])].filter((r) => r && (r.eventTime != null || r.event_time != null)).sort((a, b) => {
        const ta = new Date(a.eventTime || a.event_time).getTime()
        const tb = new Date(b.eventTime || b.event_time).getTime()
        if (ta !== tb) {
          return ta - tb
        }
        const ida = String(a.id || '')
        const idb = String(b.id || '')
        return ida.localeCompare(idb)
      })
      const timeSeen = {}
      const xData = sorted.map((r) => {
        const base = this.formatEventTime(r)
        timeSeen[base] = (timeSeen[base] || 0) + 1
        const n = timeSeen[base]
        return n > 1 ? base + '\n(' + n + ')' : base
      })
      const laneData = sorted.map((r) => this.flowLaneIndex(r))
      const eventNames = sorted.map((r) => String(r.eventName || r.event_name || '—'))
      const billNos = sorted.map((r) => String(r.billNo || r.bill_no || ''))

      const empty = sorted.length === 0
      this.historyChartInstance.setOption({
        backgroundColor: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#eef6ff' },
            { offset: 1, color: '#f9fbfd' }
          ]
        },
        title: {
          show: empty,
          text: '请输入条码值查询后展示履历',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#909399', fontSize: 13, fontWeight: 'normal' }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line' },
          formatter: (params) => {
            const p = params && params[0]
            if (!p || p.dataIndex == null) {
              return ''
            }
            const i = p.dataIndex
            const ev = eventNames[i] || '—'
            const bill = billNos[i]
            const lane = laneData[i] === 1 ? '科室侧' : '仓库侧'
            let s = (p.axisValueLabel || p.name || '').replace(/\n/g, ' ') + '<br/>' + ev + '<br/>位置：' + lane
            if (bill) {
              s += '<br/>单号：' + bill
            }
            return s
          }
        },
        grid: { left: 56, right: 20, top: 28, bottom: xData.length > 8 ? 72 : 48 },
        xAxis: {
          type: 'category',
          boundaryGap: true,
          data: xData,
          axisLabel: {
            color: '#606266',
            fontSize: 10,
            rotate: xData.length > 6 ? 38 : 0,
            interval: 0
          },
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          interval: 1,
          splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e4e7ed' } },
          axisLabel: {
            color: '#606266',
            formatter: (v) => (v === 1 ? '科室' : '仓库')
          },
          axisLine: { show: true, lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: '履历',
            type: 'line',
            step: 'end',
            symbol: 'circle',
            symbolSize: 12,
            lineStyle: { width: 3, color: '#e67e22' },
            itemStyle: {
              color: '#2ecc71',
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: !empty,
              position: 'top',
              distance: 8,
              color: '#b8860b',
              fontSize: 11,
              formatter: (p) => (eventNames[p.dataIndex] != null ? eventNames[p.dataIndex] : '')
            },
            data: laneData,
            z: 2
          }
        ]
      }, true)
      this.$nextTick(() => {
        if (this.historyChartInstance) {
          this.historyChartInstance.resize()
        }
      })
    },
    loadHistoryChartSeries() {
      const bc = (this.queryParams.barcodeValue || '').trim()
      if (!this.historyChartInstance) {
        return
      }
      if (!bc) {
        this.applyHistoryChartOption([])
        return
      }
      listHcBarcodeCirculation({
        ...this.queryParams,
        pageNum: 1,
        pageSize: 500
      })
        .then((res) => {
          this.applyHistoryChartOption(res.rows || [])
        })
        .catch(() => {
          this.applyHistoryChartOption([])
        })
    },
    valueLevelToText(v) {
      if (v === '1' || v === 1) return '高值'
      if (v === '2' || v === 2) return '低值'
      return v != null && v !== '' ? String(v) : '—'
    },
    syncProductInfoFromList(rows) {
      const list = rows || []
      const r = list.find((x) =>
        (x.materialName || x.material_name) ||
        (x.barcodeValue || x.barcode_value) ||
        (x.hcBarcodeMasterId || x.hc_barcode_master_id)
      )
      if (!r) {
        this.productInfo = {
          hasData: false,
          materialName: '',
          materialCode: '',
          materialSpeci: '',
          materialModel: '',
          valueLevelText: '—',
          barcodeValue: '',
          hcBarcodeMasterId: ''
        }
        return
      }
      const vl = r.valueLevel != null ? r.valueLevel : r.value_level
      this.productInfo = {
        hasData: true,
        materialName: (r.materialName || r.material_name || '').toString(),
        materialCode: (r.materialCode || r.material_code || '').toString(),
        materialSpeci: (r.materialSpeci || r.material_speci || '').toString(),
        materialModel: (r.materialModel || r.material_model || '').toString(),
        valueLevelText: this.valueLevelToText(vl),
        barcodeValue: (r.barcodeValue || r.barcode_value || '').toString(),
        hcBarcodeMasterId: (r.hcBarcodeMasterId || r.hc_barcode_master_id || '').toString()
      }
    },
    getList() {
      this.loading = true
      listHcBarcodeCirculation(this.queryParams).then(res => {
        this.dataList = res.rows || []
        this.total = res.total || 0
        this.syncProductInfoFromList(this.dataList)
        this.loading = false
        this.loadHistoryChartSeries()
      }).catch(() => {
        this.loading = false
        this.syncProductInfoFromList([])
        this.loadHistoryChartSeries()
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.hcBarcodeMasterId = undefined
      this.handleQuery()
    },
    handleExport() {
      this.download('hc/barcode/public/circulation/export', { ...this.queryParams }, `条码流通_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
.top-board-row {
  margin-bottom: 12px;
}
.top-board-row .el-col {
  display: flex;
}
.top-board-row .product-card,
.top-board-row .chart-card {
  flex: 1;
  width: 100%;
  margin-bottom: 0;
}
.product-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.product-info-empty {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  padding-top: 4px;
}
.info-row {
  font-size: 13px;
  margin-bottom: 10px;
  line-height: 1.5;
  word-break: break-all;
}
.info-label {
  color: #909399;
  display: inline-block;
  width: 72px;
  vertical-align: top;
  flex-shrink: 0;
}
.info-value {
  color: #303133;
  display: inline-block;
  max-width: calc(100% - 78px);
  vertical-align: top;
}
.text-mono {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
}
.chart-card-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  line-height: 1.4;
}
.barcode-history-chart {
  width: 100%;
  height: 240px;
}
.hc-barcode-circulation .mb8 {
  margin-bottom: 8px;
}
.toolbar-row {
  flex-wrap: wrap;
}
.toolbar-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.toolbar-query-form.el-form--inline {
  display: inline-block;
  margin-bottom: 0;
  vertical-align: middle;
}
.toolbar-query-form.el-form--inline .el-form-item {
  margin-bottom: 0;
  margin-right: 12px;
}
.toolbar-right-col {
  text-align: right;
}
@media (max-width: 992px) {
  .toolbar-right-col {
    text-align: left;
    margin-top: 8px;
  }
}
</style>
