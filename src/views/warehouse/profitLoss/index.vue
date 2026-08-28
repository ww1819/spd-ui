<template>
  <div class="app-container list-page profit-loss-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="盈亏单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.stocktakingNo"
              placeholder="盘点单号"
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
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option label="待审核" :value="1" />
                <el-option label="已审核" :value="2" />
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
          @click="handleAdd"
          v-hasPermi="['warehouse:profitLoss:add']"
        >新增</el-button>
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
      <el-table-column label="盈亏单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">{{ scope.row.billNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="盘点单号" align="center" prop="stocktakingNo" width="180" show-overflow-tooltip resizable sortable />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="220">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)" style="padding: 0 5px; margin: 0;">查看</el-button>
            <el-button size="small" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['warehouse:profitLoss:edit']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">修改</el-button>
            <el-button size="small" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['warehouse:profitLoss:audit']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">审核</el-button>
            <el-button size="small" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['warehouse:profitLoss:remove']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">删除</el-button>
          </span>
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

    <!-- 新增/修改/查看 弹窗（布局对齐到货验收） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact profit-loss-modal-head-form" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="billStatus" class="head-label-nowrap">
                      <el-input :value="billStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盈亏单号" prop="billNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.billNo" placeholder="保存后自动生成" :disabled="true" :title="form.billNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盘点单号" prop="stocktakingNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.stocktakingNo" :disabled="true" :title="form.stocktakingNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="head-label-nowrap">
                      <el-input :value="warehouseDisplayName" :disabled="true" placeholder="仓库" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">盈亏明细信息</span>
                  <el-button
                    v-if="detailEditable && !form.id"
                    type="primary"
                    icon="el-icon-connection"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="openStocktakingPickDialog"
                  >引入盘点单</el-button>
                  <el-button
                    v-if="detailEditable && entryFullList.length"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-check"
                    @click="submitForm"
                    :loading="submitLoading"
                  >保 存</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    ref="profitLossEntryTable"
                    class="profit-loss-detail-table apply-detail-table"
                    :data="entryFullList"
                    :row-class-name="applyDetailRowClassName"
                    :height="detailTableHeight"
                    border
                    show-summary
                    :summary-method="getEntrySummaries"
                  >
                    <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
                    <el-table-column label="耗材编码" align="center" header-align="center" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="耗材名称" align="left" header-align="center" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="120" show-overflow-tooltip resizable />
                    <el-table-column label="当前库存" align="center" header-align="center" prop="bookQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.bookQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盘点库存" align="center" header-align="center" prop="stockQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.stockQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span :style="{ color: scope.row.profitQty > 0 ? '#67c23a' : scope.row.profitQty < 0 ? '#f56c6c' : '' }">{{ formatNum(scope.row.profitQty) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" align="right" header-align="center" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏金额" align="right" header-align="center" prop="profitAmount" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.profitAmount) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 引入盘点单 -->
    <el-dialog
      title="引入盘点单"
      :visible.sync="stocktakingPickVisible"
      width="920px"
      append-to-body
      :close-on-click-modal="false"
      @open="handleStocktakingPickDialogOpen"
    >
      <el-form :model="stocktakingPickQuery" ref="stocktakingPickForm" size="small" :inline="true" label-width="80px">
        <el-form-item label="业务单号" prop="stockNo">
          <el-input v-model="stocktakingPickQuery.stockNo" placeholder="业务单号" clearable style="width: 180px" @keyup.enter.native="searchStocktakingPickList" />
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <div class="query-select-wrapper">
            <SelectWarehouse v-model="stocktakingPickQuery.warehouseId" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="searchStocktakingPickList">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetStocktakingPickQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="stocktakingPickLoading"
        :data="stocktakingPickList"
        highlight-current-row
        border
        stripe
        height="360px"
        @current-change="handleStocktakingPickCurrentChange"
      >
        <el-table-column label="业务单号" align="center" prop="stockNo" min-width="160" show-overflow-tooltip />
        <el-table-column label="仓库" align="center" prop="warehouse.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="制单日期" align="center" prop="stockDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatNum(scope.row.profitAmount) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        :total="stocktakingPickTotal"
        :page.sync="stocktakingPickQuery.pageNum"
        :limit.sync="stocktakingPickQuery.pageSize"
        @pagination="searchStocktakingPickList"
      />
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="stocktakingPickVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :disabled="!stocktakingPickSelected" :loading="loadDraftLoading" @click="confirmStocktakingPick">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listProfitLoss, getProfitLoss, loadDraft as apiLoadDraft, addProfitLoss, updateProfitLoss, delProfitLoss, auditProfitLoss } from '@/api/warehouse/profitLoss'
import { listStocktaking } from '@/api/warehouse/stocktaking'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'ProfitLoss',
  dicts: ['biz_status'],
  components: { SelectWarehouse },
  data() {
    return {
      loading: true,
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      total: 0,
      dataList: [],
      title: '',
      open: false,
      dialogReadOnly: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        stocktakingNo: null,
        warehouseId: null,
        billStatus: null,
        beginDate: null,
        endDate: null
      },
      form: {},
      entryList: [],
      rules: {
        stocktakingId: [{ required: true, message: '请引入已审核的盘点单', trigger: 'change' }]
      },
      loadDraftLoading: false,
      submitLoading: false,
      stocktakingPickVisible: false,
      stocktakingPickLoading: false,
      stocktakingPickList: [],
      stocktakingPickTotal: 0,
      stocktakingPickSelected: null,
      stocktakingPickQuery: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        warehouseId: null,
        stockStatus: 2,
        stockType: '501',
        forProfitLossPick: 1
      }
    }
  },
  computed: {
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))'
    },
    billStatusLabel() {
      const status = this.form && this.form.billStatus
      if (status == null || status === '') {
        return ''
      }
      const label = this.selectDictLabel(this.dict.type.biz_status, String(status))
      return label || ''
    },
    warehouseDisplayName() {
      const f = this.form || {}
      if (f.warehouse && f.warehouse.name) {
        return f.warehouse.name
      }
      return '--'
    },
    detailEditable() {
      return !this.dialogReadOnly && (this.form.billStatus == null || this.form.billStatus === 1 || this.form.billStatus === '1')
    },
    entryFullList() {
      const list = (this.form && this.form.entryList && this.form.entryList.length)
        ? this.form.entryList
        : (this.entryList || [])
      return Array.isArray(list) ? list : []
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
      this.open = false
      this.stocktakingPickVisible = false
      this.reset()
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
      return this.formatQty(n)
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
      const queryParams = { ...this.queryParams }
      listProfitLoss(queryParams).then(response => {
        this.dataList = response.rows
        this.total = response.total
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
    loadStocktakingPickList() {
      this.stocktakingPickLoading = true
      listStocktaking({ ...this.stocktakingPickQuery }).then(response => {
        this.stocktakingPickList = response.rows || []
        this.stocktakingPickTotal = response.total || 0
        this.stocktakingPickLoading = false
      }).catch(() => {
        this.stocktakingPickLoading = false
      })
    },
    openStocktakingPickDialog() {
      this.stocktakingPickVisible = true
    },
    handleStocktakingPickDialogOpen() {
      this.stocktakingPickSelected = null
      this.stocktakingPickQuery.pageNum = 1
      this.searchStocktakingPickList()
    },
    searchStocktakingPickList() {
      this.stocktakingPickQuery.pageNum = this.stocktakingPickQuery.pageNum || 1
      this.loadStocktakingPickList()
    },
    resetStocktakingPickQuery() {
      this.stocktakingPickQuery.stockNo = null
      this.stocktakingPickQuery.warehouseId = null
      this.stocktakingPickQuery.pageNum = 1
      this.searchStocktakingPickList()
    },
    handleStocktakingPickCurrentChange(row) {
      this.stocktakingPickSelected = row || null
    },
    confirmStocktakingPick() {
      if (!this.stocktakingPickSelected) {
        this.$message.warning('请选择盘点单')
        return
      }
      this.form.stocktakingId = this.stocktakingPickSelected.id
      this.form.stocktakingNo = this.stocktakingPickSelected.stockNo
      this.form.warehouseId = this.stocktakingPickSelected.warehouseId
      const wh = this.stocktakingPickSelected.warehouse
      this.form.warehouse = wh ? { id: wh.id, name: wh.name, code: wh.code } : null
      this.loadDraft(this.stocktakingPickSelected)
    },
    loadDraft(stocktakingRow) {
      const pick = stocktakingRow || { id: this.form.stocktakingId, warehouse: this.form.warehouse }
      if (!pick.id) {
        this.$message.warning('请先选择已审核的盘点单')
        return
      }
      this.loadDraftLoading = true
      apiLoadDraft(pick.id).then(response => {
        this.form = response.data
        this.form.entryList = response.data.entryList || []
        if (pick.warehouse) {
          this.form.warehouse = {
            id: pick.warehouse.id,
            name: pick.warehouse.name,
            code: pick.warehouse.code
          }
        }
        this.loadDraftLoading = false
        this.stocktakingPickVisible = false
        this.$message.success('已引入盘点单并加载盈亏明细')
      }).catch(() => { this.loadDraftLoading = false })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {}
      this.entryList = []
      this.stocktakingPickSelected = null
      this.resetForm('form')
    },
    rowEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1
    },
    /** 明细表行 class：序号（悬停高亮由 CSS 接管，与到货验收一致） */
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowEntryIndex({ row, rowIndex })
      return ''
    },
    getEntrySummaries({ columns }) {
      const list = this.entryFullList || []
      const sums = columns.map(() => '')
      let summaryLabelPlaced = false
      columns.forEach((column, index) => {
        const prop = column.property
        if (!summaryLabelPlaced && (prop === 'index' || column.label === '序号')) {
          sums[index] = '合计'
          summaryLabelPlaced = true
          return
        }
        if (prop === 'profitQty' || prop === 'profitAmount' || prop === 'bookQty' || prop === 'stockQty') {
          const total = list.reduce((sum, row) => sum + (Number(row[prop]) || 0), 0)
          sums[index] = this.formatNum(total)
        }
      })
      return sums
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.beginDate = null
      this.queryParams.endDate = null
      this.queryParams.billNo = null
      this.queryParams.stocktakingNo = null
      this.queryParams.warehouseId = null
      this.queryParams.billStatus = null
      this.handleQuery()
    },
    handleAdd() {
      this.reset()
      this.title = '新增盈亏单'
      this.dialogReadOnly = false
      this.open = true
    },
    handleView(row) {
      this.reset()
      const id = row.id
      getProfitLoss(id).then(response => {
        this.form = response.data
        this.entryList = (response.data && response.data.entryList) ? response.data.entryList : []
        this.title = '查看盈亏单'
        this.dialogReadOnly = true
        this.open = true
      })
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id
      getProfitLoss(id).then(response => {
        this.form = response.data
        this.form.entryList = response.data.entryList || []
        this.title = '修改盈亏单'
        this.dialogReadOnly = false
        this.open = true
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) return
        if (!this.form.entryList || !this.form.entryList.length) {
          this.$message.warning('请先引入盘点单并加载盈亏明细')
          return
        }
        if (this.submitLoading) return
        this.submitLoading = true
        const isUpdate = !!this.form.id
        const request = isUpdate ? updateProfitLoss(this.form) : addProfitLoss(this.form)
        request.then(response => {
          const data = response.data || response
          if (!isUpdate && data) {
            this.form.id = data.id
            if (data.billNo != null) this.form.billNo = data.billNo
          }
          this.$modal.msgSuccess(isUpdate ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        }).finally(() => {
          this.submitLoading = false
        })
      })
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该盈亏单？').then(() => {
        return delProfitLoss(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleAudit(row) {
      this.$modal.confirm(
        '是否确认审核该盈亏单？审核后：盘亏会调整库存并生成流水；盘盈将生成待入账/仅追溯用记录，不直接更新库存与结算流水。'
      ).then(() => {
        return auditProfitLoss(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('审核成功')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  min-height: 40px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  box-sizing: border-box;
}

/* 弹窗内三块区域：与到货验收一致（标题栏同宽铺满） */
.local-modal-content .apply-modal-query-panel,
.local-modal-content .apply-modal-toolbar.list-toolbar,
.local-modal-content .apply-modal-table-panel {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 12px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-query-panel .el-row {
  margin-bottom: 8px;
}

.local-modal-content .apply-modal-query-panel .el-row:last-child {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 12px;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item.apply-modal-label-required .el-form-item__label,
.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
  margin-right: 0 !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-modal-content .apply-modal-table-panel {
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.local-modal-content .apply-modal-toolbar {
  flex-shrink: 0;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 0;
}

.local-modal-content .apply-modal-table-panel .apply-detail-table {
  margin-bottom: 0 !important;
  box-shadow: none;
}

.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 98px !important;
  max-width: 98px;
}

.local-modal-content .modal-detail-section .el-table .detail-input-compact.el-date-editor.el-input {
  width: 98px !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 1.35;
}

.local-modal-content .modal-detail-section .el-table ::v-deep thead th.el-table__cell {
  padding: 6px 0 !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel .el-input,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-select,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-picker,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-editor {
  width: 140px;
  max-width: 140px;
}

.local-modal-content .modal-form-compact .modal-detail-section .el-input,
.local-modal-content .modal-form-compact .modal-detail-section .el-select,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-picker,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor,
.local-modal-content .modal-form-compact .modal-detail-section .el-input.el-input--small,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor.el-input {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}

.local-modal-content .modal-form-compact .form-item-header-billno .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .modal-form-compact .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-input__icon {
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor.el-input {
  height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 28px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

/* 弹窗内表格：高度由 el-table :height 控制 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table th.is-leaf {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

/* 明细表横向滚动条：12px，固定粗细（须覆盖下方 thin 通配） */
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 合计行：与到货验收同高同色（灰蓝底 #f1f5f9） */
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  position: relative;
  z-index: 30 !important;
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__footer-wrapper tr,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  scrollbar-width: thin;
}

.app-container {
  position: relative;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

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

/* 弹窗明细表悬停由下方非 scoped 的 #D6EBFF 规则接管，避免被本处灰色覆盖 */

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
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

.list-query-panel .el-form .apply-date-type-group {
  margin-right: 10px;
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

/* 弹窗样式已在上方统一为到货验收 apply-modal 结构，此处不再重复旧布局规则 */

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 盈亏处理专用 */
.local-modal-content .profit-loss-modal-head-form .head-label-nowrap ::v-deep .el-form-item__label {
  white-space: nowrap;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非scoped确保生效） */
.app-container.profit-loss-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 14px !important;
}

.app-container.profit-loss-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.profit-loss-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.profit-loss-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.profit-loss-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.profit-loss-page .list-query-panel,
.app-container.profit-loss-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.profit-loss-page .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.app-container.profit-loss-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.profit-loss-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .apply-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 52px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding: 10px 14px 14px !important;
  background: #fff;
  border: none;
  border-top: 1px solid #eef2f7;
  border-radius: 0 0 10px 10px;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.app-container.profit-loss-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__header-wrapper th,
.app-container.profit-loss-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
  font-family: inherit !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.profit-loss-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.profit-loss-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.profit-loss-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.profit-loss-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.profit-loss-page .apply-main-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.profit-loss-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.profit-loss-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.profit-loss-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.profit-loss-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

.app-container.profit-loss-page .apply-main-table.el-table {
  position: relative;
}

.app-container.profit-loss-page .apply-main-table th.apply-select-col,
.app-container.profit-loss-page .apply-main-table td.apply-select-col,
.app-container.profit-loss-page .apply-main-table th.el-table-column--selection,
.app-container.profit-loss-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.profit-loss-page .apply-main-table td.apply-select-col,
.app-container.profit-loss-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .apply-main-table th.apply-select-col,
.app-container.profit-loss-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.profit-loss-page .apply-main-table th.apply-action-col,
.app-container.profit-loss-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.profit-loss-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr > td,
.app-container.profit-loss-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr:hover > td,
.app-container.profit-loss-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.profit-loss-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.profit-loss-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.profit-loss-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.profit-loss-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.profit-loss-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/* 弹窗明细框：与到货验收 apply-modal-table-panel 一致（铺满、无左右圆角边框） */
.app-container.profit-loss-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.profit-loss-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.profit-loss-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.app-container.profit-loss-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

/* 弹窗明细表头：与到货验收主列表一致 */
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.app-container.profit-loss-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表滚动条：与到货验收一致（横向 12px，无两端箭头） */
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

/* 明细表勾选列 sticky */
.app-container.profit-loss-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.profit-loss-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.profit-loss-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.profit-loss-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.profit-loss-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

/* 弹窗明细表：悬停 / 勾选行高亮（与到货验收、退货申请一致） */
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected:hover > td,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.profit-loss-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

/* 合计行始终显示，样式与到货验收一致（表头同色灰蓝底） */
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative;
  z-index: 30 !important;
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  border-bottom: none !important;
  overflow: visible !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:first-child,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:first-child {
  border-left: 1px solid #e2e8f0 !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:last-child,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:last-child {
  border-right: 1px solid #e2e8f0 !important;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell:empty,
.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell:empty {
  padding: 0;
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table-column--selection .cell {
  font-size: 0;
}

/* 修改退库弹窗明细：名称/规格/型号最多两行，行高随内容；悬停 title 看全文 */
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}

.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 6px;
  padding-bottom: 6px;
}
.app-container.profit-loss-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.45;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
}
</style>

