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
    <el-dialog title="期初库存导入" :visible.sync="upload.visible" width="900px" append-to-body :close-on-click-modal="false">
      <el-form size="small" :inline="true">
        <el-form-item label="所属仓库">
          <SelectWarehouse v-model="upload.warehouseId" placeholder="请选择仓库（可与Excel中一致）" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".xlsx,.xls"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
        </el-form-item>
      </el-form>
      <div v-if="upload.previewList && upload.previewList.length" style="margin-top: 12px;">
        <div style="margin-bottom: 8px;">预览（共 {{ upload.previewList.length }} 条），确认无误后点击「确认导入」生成期初单</div>
        <el-table :data="upload.previewList" border size="small" max-height="280">
          <el-table-column type="index" label="行号" width="55" align="center" />
          <el-table-column label="耗材编码" prop="data.materialCode" min-width="90" show-overflow-tooltip />
          <el-table-column label="耗材名称" prop="data.materialName" min-width="90" show-overflow-tooltip />
          <el-table-column label="HIS产品档案id" prop="data.thirdPartyMaterialId" width="120" show-overflow-tooltip />
          <el-table-column label="规格" prop="data.speci" width="90" show-overflow-tooltip />
          <el-table-column label="型号" prop="data.model" width="90" show-overflow-tooltip />
          <el-table-column label="注册证号" prop="data.registerNo" width="100" show-overflow-tooltip />
          <el-table-column label="医保编码" prop="data.medicalNo" width="90" show-overflow-tooltip />
          <el-table-column label="医保名称" prop="data.medicalName" width="90" show-overflow-tooltip />
          <el-table-column label="主条码" prop="data.mainBarcode" width="100" show-overflow-tooltip />
          <el-table-column label="库房分类" prop="data.warehouseCategory" width="90" show-overflow-tooltip />
          <el-table-column label="财务分类" prop="data.financeCategory" width="90" show-overflow-tooltip />
          <el-table-column label="单价" prop="data.unitPrice" width="80" align="right" />
          <el-table-column label="数量" prop="data.qty" width="70" align="right" />
          <el-table-column label="批号" prop="data.batchNumber" width="90" show-overflow-tooltip />
          <el-table-column label="生产日期" prop="data.beginDateRaw" width="100" show-overflow-tooltip />
          <el-table-column label="效期" prop="data.endDateRaw" width="100" show-overflow-tooltip />
          <el-table-column label="生产厂家" prop="data.factoryName" width="90" show-overflow-tooltip />
          <el-table-column label="HIS生产厂家id" prop="data.hisFactoryId" width="110" show-overflow-tooltip />
          <el-table-column label="供应商" prop="data.supplierName" width="90" show-overflow-tooltip />
          <el-table-column label="HIS供应商id" prop="data.hisSupplierId" width="110" show-overflow-tooltip />
          <el-table-column label="第三方库存明细ID(his_id)" prop="data.hisId" width="140" show-overflow-tooltip />
          <el-table-column label="校验" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              <span v-else style="color: #67c23a;">通过</span>
            </template>
          </el-table-column>
        </el-table>
        <div slot="footer" style="margin-top: 12px; text-align: right;">
          <el-button class="spd-btn spd-btn--secondary" @click="upload.visible = false">取 消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmImport" :loading="upload.confirmLoading" :disabled="!canConfirmImport">确认导入</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 详情 弹窗 -->
    <el-dialog title="期初单详情" :visible.sync="detail.visible" width="920px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="期初单号">{{ detail.form.billNo }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ detail.form.warehouse && detail.form.warehouse.name ? detail.form.warehouse.name : '--' }}</el-descriptions-item>
        <el-descriptions-item label="导入操作人">{{ detail.form.importOperator }}</el-descriptions-item>
        <el-descriptions-item label="导入时间">{{ parseTime(detail.form.importTime, '{y}-{m}-{d} {h}:{i}') }}</el-descriptions-item>
        <el-descriptions-item label="库存生成时间">{{ detail.form.stockGenTime ? parseTime(detail.form.stockGenTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag v-if="detail.form.billStatus === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="detail.form.billStatus === 1" type="success">已审核</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px; font-weight: 600;">明细</div>
      <el-table :data="detail.form.entryList || []" border size="small" max-height="320" style="margin-top: 6px;">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="耗材编码" align="center" prop="material.code" min-width="100" show-overflow-tooltip />
        <el-table-column label="耗材名称" align="center" prop="material.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="规格" align="center" prop="speci" width="90" show-overflow-tooltip />
        <el-table-column label="型号" align="center" prop="model" width="90" show-overflow-tooltip />
        <el-table-column label="批次号" align="center" prop="batchNo" width="140" show-overflow-tooltip />
        <el-table-column label="批号" align="center" prop="batchNumber" width="100" show-overflow-tooltip />
        <el-table-column label="单价" align="right" prop="unitPrice" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column label="数量" align="right" prop="qty" width="80">
          <template slot-scope="scope">{{ formatNum(scope.row.qty) }}</template>
        </el-table-column>
        <el-table-column label="金额" align="right" prop="amt" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.amt) }}</template>
        </el-table-column>
        <el-table-column label="生产日期" align="center" prop="beginTime" width="100" />
        <el-table-column label="效期" align="center" prop="endTime" width="100" />
        <el-table-column label="库存明细his_id" align="center" prop="hisId" min-width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="detail.visible = false">关 闭</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="handleAudit(detail.form)" v-hasPermi="['warehouse:initialStockImport:audit']" v-if="detail.form.billStatus === 0">审 核</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { preview, confirmImport, listInitialImport, getInitialImport, auditInitialImport, importTemplate } from '@/api/warehouse/initialStockImport'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'InitialStockImport',
  components: { SelectWarehouse },
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

<style scoped>
/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担，内层 el-form 不再重复包一层 */
.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.list-query-panel .el-form .el-row {
  margin-bottom: 8px;
}

.list-query-panel .el-form .el-row:last-child {
  margin-bottom: 0;
}

.list-query-panel .el-form .el-form-item {
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first {
  margin-bottom: 10px;
}

.list-query-panel .el-form .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.list-query-panel .el-form .apply-query-field,
.list-query-panel .el-form .query-row-first-inner .apply-query-input {
  width: 170px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .more-search-select-wrap.apply-query-field > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-second .apply-query-field.el-select {
  width: 170px;
}

.list-query-panel .el-form .query-row-first-inner .query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .query-actions .el-button + .el-button {
  margin-left: 0;
}

.list-query-panel .el-form .query-row-second {
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 200px;
}

.list-query-panel .el-form .query-row-second > .el-col > .el-form-item {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) {
  white-space: nowrap;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item {
  white-space: normal;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  max-width: 100%;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.list-query-panel .el-form .query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.list-query-panel .el-form .query-row-second > .query-row-second-inner > .el-form-item {
  display: inline-flex !important;
  width: auto !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  vertical-align: middle;
}

.list-query-panel .el-form .query-row-second-inner .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.app-container {
  position: relative;
}
</style>
