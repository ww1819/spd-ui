<template>
  <div class="app-container list-page initial-stock-import-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="期初单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" placeholder="仓库" />
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-date-picker
                v-model="dateRangeBegin"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="导入开始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="dateRangeEnd"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="导入结束日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option label="待审核" :value="0" />
                <el-option label="已审核" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="openUpload"
          v-hasPermi="['warehouse:initialStockImport:import']"
        >期初导入</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="dataList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="期初单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">{{ scope.row.billNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="所属仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="导入操作人" align="center" prop="importOperator" width="120" show-overflow-tooltip resizable />
      <el-table-column label="导入时间" align="center" prop="importTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.importTime">{{ parseTime(scope.row.importTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="库存生成时间" align="center" prop="stockGenTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.stockGenTime">{{ parseTime(scope.row.stockGenTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.billStatus === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.billStatus === 1" type="success">已审核</el-tag>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['warehouse:initialStockImport:audit']" v-if="scope.row.billStatus === 0">审核</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
    </div>
    </div>

    <!-- 上传/预览 弹窗 -->
    <InitialStockImportUploadDialog v-if="upload.visible" />
    <InitialStockImportDetailDialog v-if="detail.visible" />
  </div>
</template>

<script>
import { preview, confirmImport, listInitialImport, getInitialImport, auditInitialImport, importTemplate } from '@/api/warehouse/initialStockImport'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'InitialStockImport',
  components: {
    SelectWarehouse,
    InitialStockImportUploadDialog: () => import('./components/InitialStockImportUploadDialog'),
    InitialStockImportDetailDialog: () => import('./components/InitialStockImportDetailDialog')
  },
  data() {
    return {
      loading: true,
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      total: 0,
      dataList: [],
      dateRangeBegin: null,
      dateRangeEnd: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        warehouseId: null,
        billStatus: null
      },
      upload: {
        visible: false,
        warehouseId: null,
        file: null,
        previewList: [],
        confirmLoading: false
      },
      detail: {
        visible: false,
        form: {}
      }
    }
  },
  computed: {
    canConfirmImport() {
      if (!this.upload.previewList || !this.upload.previewList.length) return false
      if (this.upload.previewList.some(p => p.error)) return false
      if (this.upload.warehouseId != null) return true
      const first = this.upload.previewList[0] && this.upload.previewList[0].data
      return !!(first && first.warehouseCode)
    }
  },
  created() {
    this.getList(true)
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize)
    this.scheduleApplyLayoutRefresh()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize)
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight())
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight())
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav)
    }
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight()
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight()
      this.$nextTick(() => {
        run()
        requestAnimationFrame(() => {
          run()
          ;[50, 120, 300].forEach((ms) => setTimeout(run, ms))
        })
      })
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel
      const pagWrap = this.$refs.paginationWrap
      if (!panel || !panel.getBoundingClientRect) return
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height
      if (!panelH) return
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8
      const next = Math.floor(panelH - pagH)
      const height = Math.max(200, next)
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable
        if (table && table.doLayout) {
          table.doLayout()
        }
        this.$nextTick(() => {
          this.syncApplyTableSticky()
          requestAnimationFrame(() => this.syncApplyTableSticky())
        })
      })
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable
      const root = table && table.$el
      if (!root) return
      const bodyWrap = root.querySelector('.el-table__body-wrapper')
      if (!bodyWrap) return
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth)
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`)
    },
    normalizeRoutePath(path) {
      if (!path) {
        return ''
      }
      const normalized = String(path).replace(/\\/g, '/')
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1)
      }
      return normalized
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path)
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) {
        return
      }
      if (nav.tick === this._lastSidebarNavTick) {
        return
      }
      this._lastSidebarNavTick = nav.tick
      this.resetPageFromSidebar()
    },
    resetPageFromSidebar() {
      this.upload.visible = false
      this.detail.visible = false
      this.queryParams.pageNum = 1
      this.getList(true)
    },
    sortByNested(a, b, path) {
      const getVal = (obj, p) => p.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj)
      const va = getVal(a, path)
      const vb = getVal(b, path)
      if (va == null && vb == null) return 0
      if (va == null) return -1
      if (vb == null) return 1
      return String(va).localeCompare(String(vb), 'zh-CN')
    },
    formatNum(val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (isNaN(n)) return '--'
      return Number(n).toFixed(6)
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : ''
    },
    applyMainRowClassName({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10))
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10))
      row.index = (pageNum - 1) * pageSize + rowIndex + 1
      const key = this.getApplyMainRowKey(row)
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected'
      }
      return ''
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable
      if (!table || !this.dataList || !this.dataList.length) {
        return
      }
      const keys = this.selectedRowMap || {}
      if (!Object.keys(keys).length) {
        return
      }
      this.dataList.forEach((row) => {
        const key = this.getApplyMainRowKey(row)
        if (key && keys[key]) {
          table.toggleRowSelection(row, true)
        }
      })
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.dataList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean)
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key)
        }
      })
      ;(selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row)
        if (key) {
          this.$set(this.selectedRowMap, key, row)
        }
      })
    },
    getList(restoreSelection) {
      this.loading = true
      const params = { ...this.queryParams }
      if (this.dateRangeBegin || this.dateRangeEnd) {
        params.params = { beginTime: this.dateRangeBegin, endTime: this.dateRangeEnd }
      }
      listInitialImport(params).then(response => {
        this.dataList = response.rows || []
        this.total = response.total || 0
        this.loading = false
        if (restoreSelection) {
          this.$nextTick(() => {
            this.restoreMainPageSelection()
            this.scheduleApplyLayoutRefresh()
          })
        } else {
          this.scheduleApplyLayoutRefresh()
        }
      }).catch(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRangeBegin = null
      this.dateRangeEnd = null
      this.resetForm('queryForm')
      this.queryParams.billNo = null
      this.queryParams.warehouseId = null
      this.queryParams.billStatus = null
      this.handleQuery()
    },
    openUpload() {
      this.upload.visible = true
      this.upload.warehouseId = null
      this.upload.file = null
      this.upload.previewList = []
      this.$refs.uploadRef && this.$refs.uploadRef.clearFiles()
    },
    handleFileChange(file) {
      this.upload.file = file.raw
      if (!this.upload.file) return
      preview(this.upload.file, this.upload.warehouseId).then(res => {
        if (res.code !== 200) {
          this.$message.error(res.msg || '解析失败')
          return
        }
        const data = res.data
        this.upload.previewList = data.list || []
        if (data.warehouseId) this.upload.warehouseId = data.warehouseId
        if (!this.upload.previewList.length) {
          this.$message.warning('未解析到有效数据')
        } else {
          this.$message.success('解析成功，请确认后点击「确认导入」')
        }
      }).catch(e => {
        this.$message.error(e.msg || '解析失败')
      })
    },
    handleExceed() {
      this.$message.warning('仅支持单文件上传')
    },
    confirmImport() {
      const rows = this.upload.previewList.filter(p => !p.error).map(p => p.data)
      if (!rows.length) {
        this.$message.warning('没有可导入的数据')
        return
      }
      let warehouseId = this.upload.warehouseId
      if (warehouseId == null && rows[0] && rows[0].warehouseCode) {
        this.$message.warning('请选择所属仓库')
        return
      }
      this.upload.confirmLoading = true
      confirmImport(warehouseId, rows).then(res => {
        this.upload.confirmLoading = false
        this.upload.visible = false
        this.$message.success(res.msg || '导入成功')
        this.getList()
      }).catch(() => { this.upload.confirmLoading = false })
    },
    downloadTemplate() {
      importTemplate().then(res => {
        const blob = res && res instanceof Blob ? res : (res && res.data)
        if (!blob || !(blob instanceof Blob)) {
          this.$message.error('下载模板失败')
          return
        }
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = '期初库存导入模板.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
      }).catch(() => {
        this.$message.error('下载模板失败')
      })
    },
    handleView(row) {
      getInitialImport(row.id).then(res => {
        this.detail.form = res.data || {}
        this.detail.visible = true
      })
    },
    handleAudit(row) {
      const id = row.id
      this.$confirm('审核后将生成批次、库存及仓库流水（QC），是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return auditInitialImport(id)
      }).then(() => {
        this.$message.success('审核成功')
        this.detail.visible = false
        this.getList()
      })
    }
  }
}
</script>
