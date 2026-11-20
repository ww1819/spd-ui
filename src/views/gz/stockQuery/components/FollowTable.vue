<template>
  <div class="gz-stock-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-stock-main-table"
        v-loading="loading"
        :data="tableList"
        :height="tableHeight"
        :row-key="getRowKey"
        :row-class-name="gzStockRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="col-serial-center" />
        <el-table-column label="序号" align="center" header-align="center" width="56" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单号" align="left" header-align="center" class-name="ctk-col-left" width="150" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.orderNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="院内码" align="left" header-align="center" class-name="ctk-col-left" width="140" show-overflow-tooltip resizable sortable :sort-method="sortByInHospitalCode">
          <template slot-scope="scope">
            <span>{{ scope.row.inHospitalCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode">
          <template slot-scope="scope">
            <span>{{ scope.row.materialCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName">
          <template slot-scope="scope">
            <span>{{ scope.row.materialName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.specification || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" width="90" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" width="56" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.unitName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" width="64" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qty != null && scope.row.qty !== undefined">{{ scope.row.qty }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNumber || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" align="left" header-align="center" class-name="ctk-col-left" width="108" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="left" header-align="center" class-name="ctk-col-left" width="108" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.registerNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" align="left" header-align="center" class-name="ctk-col-left" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.financeCategoryName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" align="left" header-align="center" class-name="ctk-col-left" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.warehouseCategoryName || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container" v-show="total > 0">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="7"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { listFollowEntries } from '@/api/gz/stockQuery'
import { buildStockQueryParams, mapStockQueryEntryRow } from '../stockQueryEntryHelper'

export default {
  name: 'FollowTable',
  dicts: ['biz_status'],
  props: {
    queryParams: { type: Object, required: true }
  },
  data() {
    return {
      loading: true,
      tableList: [],
      total: 0,
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400,
      allDetailRows: [],
      totalInfo: { totalQty: 0, totalAmt: 0 }
    }
  },
  computed: {
    pageTotalQty() {
      return (this.tableList || []).reduce((s, r) => s + (Number(r && r.qty != null ? r.qty : 0) || 0), 0)
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableList || []).reduce((s, r) => s + (Number(r && r.amt != null ? r.amt : 0) || 0), 0)
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(amt)
    }
  },
  created() {
    this.getList()
  },
  mounted() {
    this.$nextTick(() => {
      this.syncTableScroll()
      this.updateTableHeight()
      setTimeout(() => this.updateTableHeight(), 80)
    })
    window.addEventListener('resize', this.updateTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight)
    if (this._headerScrollbarCleanup) this._headerScrollbarCleanup()
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel
        if (!panel) return
        const h = Math.floor(panel.clientHeight)
        if (h > 120 && h !== this.tableHeight) {
          this.tableHeight = h
          this.$nextTick(() => {
            if (this.$refs.table && this.$refs.table.doLayout) this.$refs.table.doLayout()
          })
        }
      })
    },
    getRowKey(row) {
      if (row && row._rowKey) return row._rowKey
      if (!row) return ''
      return [row.entryId || row.id || '', row.orderNo || '', row.inHospitalCode || ''].join('-')
    },
    gzStockRowClassName({ row }) {
      const key = this.getRowKey(row)
      return key && this.selectedRowKeys.indexOf(key) !== -1 ? 'gz-stock-row-selected' : ''
    },
    handleRowDblclick(row) {
      const table = this.$refs.table
      if (!table || !row) return
      const key = this.getRowKey(row)
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || []
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getRowKey(r) === key)
      ))
      table.toggleRowSelection(row, !selected)
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val
      this.getList()
    },
    sortByStr(a, b, getVal) {
      return ((getVal(a) || '').toString().trim()).localeCompare((getVal(b) || '').toString().trim(), 'zh-CN')
    },
    sortByInHospitalCode(a, b) { return this.sortByStr(a, b, r => r.inHospitalCode || '') },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => r.materialCode || '') },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => r.materialName || '') },
    buildQuery() {
      return buildStockQueryParams(this.queryParams, { timeField: 'auditDate' })
    },
    /** 与出/退库查询 firstOutQuery.getList 同一写法 */
    getList() {
      this.loading = true
      const params = this.buildQuery()
      listFollowEntries(params).then(response => {
        const rows = (response && response.rows) || []
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10)
        this.tableList = (rows || []).map((row, idx) => {
          const mapped = mapStockQueryEntryRow(row, idx) || row
          if (mapped && mapped._rowKey == null) {
            mapped._rowKey = `${pageBase + idx}_${mapped.id || ''}_${mapped.orderNo || ''}_${mapped.materialCode || ''}`
          }
          return mapped
        }).filter(Boolean)
        if (response && response.total !== undefined && response.total !== null) {
          this.total = Number(response.total)
        } else {
          this.total = 0
        }
        this.totalInfo = (response && response.totalInfo) || { totalAmt: 0, totalQty: 0 }
        this.allDetailRows = this.tableList.slice()
        this.selectedRowKeys = []
        this.ids = []
        this.loading = false
      }).catch(error => {
        console.error('获取数据失败:', error)
        this.tableList = []
        this.total = 0
        this.totalInfo = { totalAmt: 0, totalQty: 0 }
        this.allDetailRows = []
        this.selectedRowKeys = []
        this.ids = []
        this.loading = false
      })
    },
    fetchAllForExport() {
      const params = this.buildQuery()
      params.pageNum = 1
      params.pageSize = 5000
      return listFollowEntries(params).then(response => {
        const rows = (response && response.rows) || []
        return rows.map((row, idx) => mapStockQueryEntryRow(row, idx)).filter(Boolean)
      })
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.selectedRowKeys = (selection || []).map(row => this.getRowKey(row))
      this.$emit('selection-change', selection)
    },
    syncTableScroll() {
      const headerWrapper = this.$el && this.$el.querySelector('.el-table__header-wrapper')
      const bodyWrapper = this.$el && this.$el.querySelector('.el-table__body-wrapper')
      if (!headerWrapper || !bodyWrapper) return
      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) target.scrollLeft = source.scrollLeft
      }
      const syncBodyToHeader = () => syncScroll(bodyWrapper, headerWrapper)
      const syncHeaderToBody = () => syncScroll(headerWrapper, bodyWrapper)
      if (this._syncBodyToHeader) bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader)
      if (this._syncHeaderToBody) headerWrapper.removeEventListener('scroll', this._syncHeaderToBody)
      this._syncBodyToHeader = syncBodyToHeader
      this._syncHeaderToBody = syncHeaderToBody
      bodyWrapper.addEventListener('scroll', syncBodyToHeader, { passive: true })
      headerWrapper.addEventListener('scroll', syncHeaderToBody, { passive: true })
      this._headerScrollbarCleanup = () => {
        if (this._syncBodyToHeader) bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader)
        if (this._syncHeaderToBody) headerWrapper.removeEventListener('scroll', this._syncHeaderToBody)
      }
    }
  }
}

</script>

<style scoped>
.gz-stock-table-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  position: relative;
  flex: 1 1 auto;
}

.table-container ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.table-container ::v-deep .el-table th.el-table__cell,
.table-container ::v-deep .el-table td.el-table__cell {
  height: 34px !important;
  padding: 4px 4px !important;
  box-sizing: border-box !important;
}
.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 22px !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  word-break: normal;
}
.table-container ::v-deep .el-table th.ctk-col-left .cell,
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>
