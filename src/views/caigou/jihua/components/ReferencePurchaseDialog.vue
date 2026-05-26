<template>
  <div v-if="innerVisible" class="local-modal-mask ref-purchase-root" :style="layoutCssVars">
    <transition name="modal-zoom">
      <div v-if="innerVisible" class="local-modal-content ref-purchase-modal">
        <div class="modal-header">
          <div class="modal-title">引用申购单</div>
          <el-button type="text" @click="handleClose" class="close-btn" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <div class="modal-body">
          <div class="query-container-fixed">
            <div class="query-container">
              <el-form :model="queryParams" :inline="true" size="small" label-width="70px">
                <el-row :gutter="10">
                  <el-col :span="5">
                    <el-form-item label="计划仓库">
                      <el-input :value="warehouseLabel" disabled placeholder="请先在计划表头选择仓库" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="高值/低值">
                      <el-input :value="isGzLabel" disabled placeholder="请先在计划表头选择" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室">
                      <SelectDepartment v-model="queryParams.departmentId" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="单号">
                      <el-input v-model="queryParams.purchaseBillNo" placeholder="申购单号" clearable style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-form-item label="日期" class="ref-date-form-item">
                      <div class="ref-date-range">
                        <el-date-picker
                          v-model="queryParams.beginDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="起"
                          clearable
                        />
                        <span class="ref-date-sep">至</span>
                        <el-date-picker
                          v-model="queryParams.endDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="止"
                          clearable
                        />
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="计划引用">
                      <el-select v-model="queryParams.purchasePlanRefStatus" placeholder="全部" clearable style="width: 100%;">
                        <el-option label="未引用" :value="0" />
                        <el-option label="部分引用" :value="1" />
                        <el-option label="全部引用" :value="2" />
                        <el-option label="计划驳回" :value="3" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
            <div class="button-container">
              <el-button type="warning" icon="el-icon-close" size="medium" :disabled="isRejectDisabled" @click="openReject">驳 回</el-button>
              <el-button type="primary" icon="el-icon-search" size="medium" @click="handleSearch">搜索</el-button>
              <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
              <el-button size="medium" @click="handleClose">取 消</el-button>
              <span v-if="selectedCount > 0" class="ref-purchase-selected-tip">已选 {{ selectedCount }} 张申购单（含跨页）</span>
              <el-button type="primary" size="medium" :disabled="selectedCount === 0" :loading="confirmLoading" @click="handleConfirm">确 定</el-button>
            </div>
          </div>
          <div class="reference-purchase-layout">
            <div class="purchase-list-container">
              <div class="purchase-list-table-wrap">
                <el-table
                  ref="purchaseListTable"
                  v-loading="loading"
                  :data="purchaseList"
                  border
                  row-key="id"
                  :cell-style="{ padding: '8px 4px' }"
                  @selection-change="onListSelectionChange"
                  :height="listTableHeight"
                >
                  <el-table-column type="selection" width="50" align="center" fixed="left" :reserve-selection="true" />
                  <el-table-column label="序号" align="center" width="70">
                    <template slot-scope="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
                  </el-table-column>
                  <el-table-column label="单号" prop="purchaseBillNo" width="150" show-overflow-tooltip />
                  <el-table-column label="仓库" width="100" show-overflow-tooltip>
                    <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
                  </el-table-column>
                  <el-table-column label="高值/低值" width="90" show-overflow-tooltip>
                    <template slot-scope="scope">{{ formatIsGzLabel(scope.row.isGz) }}</template>
                  </el-table-column>
                  <el-table-column label="科室" prop="department.name" width="80" show-overflow-tooltip />
                  <el-table-column label="金额" prop="totalAmount" width="100" align="right">
                    <template slot-scope="scope">{{ scope.row.totalAmount ? parseFloat(scope.row.totalAmount).toFixed(2) : '0.00' }}</template>
                  </el-table-column>
                  <el-table-column label="制单日期" prop="purchaseBillDate" width="120">
                    <template slot-scope="scope">
                      <span v-if="scope.row.purchaseBillDate">{{ parseTime(scope.row.purchaseBillDate, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="制单人" width="120">
                    <template slot-scope="scope">{{ scope.row.user && (scope.row.user.userName || scope.row.user.nickName) || '--' }}</template>
                  </el-table-column>
                  <el-table-column label="计划引用" width="96">
                    <template slot-scope="scope">
                      <el-tag :type="purchasePlanRefTagType(scope.row.purchasePlanRefStatus)" size="small">{{ purchasePlanRefLabel(scope.row.purchasePlanRefStatus) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="出库引用" width="96">
                    <template slot-scope="scope">
                      <el-tag :type="outboundRefTagType(scope.row.outboundRefStatus)" size="small">{{ outboundRefLabel(scope.row.outboundRefStatus) }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="驳回原因" prop="rejectReason" width="150" show-overflow-tooltip />
                </el-table>
              </div>
              <div class="ref-purchase-pagination-wrap">
                <pagination :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="loadList" />
              </div>
            </div>
            <div class="purchase-detail-container">
              <div v-if="entryLoading" class="entry-loading-tip">正在加载明细…</div>
              <div class="purchase-detail-table-wrap">
              <el-table
                :data="entryPageList"
                border
                :cell-style="{ padding: '8px 4px' }"
                @selection-change="onEntrySelectionChange"
                :height="entryTableHeight"
              >
                <el-table-column type="selection" width="50" align="center" fixed="left" :selectable="isEntrySelectable" />
                <el-table-column label="耗材编码" width="120" show-overflow-tooltip>
                  <template slot-scope="scope">{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</template>
                </el-table-column>
                <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip />
                <el-table-column label="规格" prop="materialSpec" width="120" show-overflow-tooltip />
                <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip />
                <el-table-column label="单位" prop="unit" width="80" show-overflow-tooltip />
                <el-table-column label="数量" prop="qty" width="100" align="right">
                  <template slot-scope="scope">{{ scope.row.qty ? parseFloat(scope.row.qty).toFixed(2) : '0.00' }}</template>
                </el-table-column>
                <el-table-column label="单价" prop="unitPrice" width="100" align="right">
                  <template slot-scope="scope">{{ scope.row.unitPrice ? parseFloat(scope.row.unitPrice).toFixed(2) : '0.00' }}</template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="100" align="right">
                  <template slot-scope="scope">{{ scope.row.amt ? parseFloat(scope.row.amt).toFixed(2) : '0.00' }}</template>
                </el-table-column>
                <el-table-column label="供应商" width="150" show-overflow-tooltip>
                  <template slot-scope="scope">{{ scope.row.supplierName || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</template>
                </el-table-column>
              </el-table>
              </div>
              <div v-if="entryTotal > entryPageSize" class="entry-pagination-wrap">
                <el-pagination
                  small
                  layout="total, prev, pager, next"
                  :total="entryTotal"
                  :page-size="entryPageSize"
                  :current-page.sync="entryPageNum"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <el-dialog title="驳回原因" :visible.sync="rejectVisible" width="500px" append-to-body :close-on-click-modal="false">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectForm" label-width="100px">
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4" placeholder="驳回原因" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitReject">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPurchase, getPurchase, rejectPurchase } from '@/api/department/purchase'
import { fetchReferenceApplyEntries } from '@/api/caigou/purchasePlan'
import { listWarehouseAll } from '@/api/foundation/warehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import {
  normalizePurchaseEntry,
  buildPlanRowsFromPurchaseEntries,
  mapReferenceApplyEntriesFromApi,
  purchasePlanRefLabel,
  purchasePlanRefTagType,
  outboundRefLabel,
  outboundRefTagType,
  runPool,
  formatReferenceBillNo,
  yieldToMain
} from '../utils/planEntryUtils'
import { formatIsGzLabel } from '@/utils/purchaseAggEntry'

const ENTRY_PAGE_SIZE = 200
const RELOAD_DEBOUNCE_MS = 320
const FETCH_CONCURRENCY = 5

export default {
  name: 'ReferencePurchaseDialog',
  components: { SelectDepartment },
  props: {
    visible: { type: Boolean, default: false },
    warehouseId: { type: [Number, String], default: null },
    isGz: { type: [Number, String], default: null },
    planId: { type: [Number, String], default: null },
    planEntryMode: { type: String, default: '1' },
    referencedEntryIdSet: { type: Object, default: () => new Set() }
  },
  data() {
    return {
      loading: false,
      entryLoading: false,
      confirmLoading: false,
      purchaseList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        departmentId: null,
        purchaseBillNo: null,
        beginDate: null,
        endDate: null,
        purchasePlanRefStatus: null,
        purchaseBillStatus: 2
      },
      selectedRowMap: {},
      selectionRestoring: false,
      selectedEntryList: [],
      selectedEntryIds: [],
      entryPageNum: 1,
      entryPageSize: ENTRY_PAGE_SIZE,
      warehouseLabel: '',
      reloadTimer: null,
      rejectVisible: false,
      rejectForm: { rejectReason: '' },
      rejectRules: {
        rejectReason: [{ required: true, message: '驳回原因不能为空', trigger: 'blur' }]
      },
      layoutCssVars: {},
      _layoutResizeHandler: null
    }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    selectedCount() {
      return Object.keys(this.selectedRowMap || {}).length
    },
    isGzLabel() {
      return formatIsGzLabel(this.isGz)
    },
    /** 主内容区高度（vh），左侧列表区 = 该区高度 - 分页条 */
    listTableHeight() {
      const m = this._layoutMetrics()
      return Math.max(120, m.contentH - m.pagerH - 2)
    },
    entryTableHeight() {
      const m = this._layoutMetrics()
      const entryPager = this.entryTotal > this.entryPageSize ? m.entryPagerH : 0
      return Math.max(120, m.contentH - entryPager - 2)
    },
    entryTotal() {
      return (this.selectedEntryList || []).length
    },
    entryPageList() {
      const list = this.selectedEntryList || []
      const start = (this.entryPageNum - 1) * this.entryPageSize
      return list.slice(start, start + this.entryPageSize)
    },
    isRejectDisabled() {
      const rows = Object.values(this.selectedRowMap || {})
      if (rows.length !== 1) return true
      const row = rows[0]
      const status = row && (row.purchasePlanRefStatus !== undefined ? row.purchasePlanRefStatus : row.purchase_plan_ref_status)
      return status === 1 || status === '1' || status === 2 || status === '2' || status === 3 || status === '3'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initOpen()
        this.$nextTick(() => this.bindLayoutResize())
      } else {
        this.clearCache()
        this.unbindLayoutResize()
      }
    },
    entryTotal() {
      this.updateLayoutCssVars()
    }
  },
  mounted() {
    this.updateLayoutCssVars()
    this.bindLayoutResize()
  },
  beforeDestroy() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    this.unbindLayoutResize()
  },
  methods: {
    formatIsGzLabel,
    _layoutMetrics() {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      const modalH = Math.round(vh * 0.94)
      const headerH = Math.round(vh * 0.05)
      const topH = Math.round(vh * 0.26)
      const bodyPad = Math.round(vh * 0.02)
      const contentH = Math.max(180, modalH - headerH - topH - bodyPad)
      const pagerH = Math.max(44, Math.round(vh * 0.055))
      const entryPagerH = Math.max(40, Math.round(vh * 0.05))
      return { modalH, headerH, topH, bodyPad, contentH, pagerH, entryPagerH }
    },
    updateLayoutCssVars() {
      const m = this._layoutMetrics()
      this.layoutCssVars = {
        '--ref-modal-h': `${m.modalH}px`,
        '--ref-content-h': `${m.contentH}px`,
        '--ref-pager-h': `${m.pagerH}px`,
        '--ref-entry-pager-h': `${m.entryPagerH}px`
      }
    },
    bindLayoutResize() {
      if (this._layoutResizeHandler || typeof window === 'undefined') return
      this._layoutResizeHandler = () => this.updateLayoutCssVars()
      window.addEventListener('resize', this._layoutResizeHandler)
    },
    unbindLayoutResize() {
      if (this._layoutResizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', this._layoutResizeHandler)
        this._layoutResizeHandler = null
      }
    },
    purchasePlanRefLabel,
    purchasePlanRefTagType,
    outboundRefLabel,
    outboundRefTagType,
    initOpen() {
      this.updateLayoutCssVars()
      this.syncWarehouseFromProp()
      this.queryParams.pageNum = 1
      this.clearCache()
      this.resolveWarehouseLabel().finally(() => this.loadList())
    },
    syncWarehouseFromProp() {
      const wid = this.warehouseId
      if (wid != null && wid !== '') {
        const n = Number(wid)
        this.queryParams.warehouseId = Number.isFinite(n) ? n : wid
      } else {
        this.queryParams.warehouseId = null
      }
    },
    resolveWarehouseLabel() {
      const wid = this.warehouseId
      if (wid == null || wid === '') {
        this.warehouseLabel = ''
        return Promise.resolve('')
      }
      const userId = this.$store.state.user.userId
      return listWarehouseAll(userId).then(res => {
        const rows = res || res.data || res.rows || []
        const hit = rows.find(item => String(item.id) === String(wid) || item.id == wid)
        this.warehouseLabel = hit && hit.name ? hit.name : ''
        return this.warehouseLabel
      }).catch(() => {
        this.warehouseLabel = ''
        return ''
      })
    },
    clearCache() {
      this.selectedRowMap = {}
      this.selectedEntryList = []
      this.selectedEntryIds = []
      this.entryPageNum = 1
    },
    handleClose() {
      this.innerVisible = false
      this.$emit('close')
    },
    handleSearch() {
      if (!this.warehouseId) {
        this.$modal.msgWarning('请先在计划表头选择仓库')
        return
      }
      this.syncWarehouseFromProp()
      this.queryParams.pageNum = 1
      this.loadList()
    },
    resetQuery() {
      this.queryParams.departmentId = null
      this.queryParams.purchaseBillNo = null
      this.queryParams.beginDate = null
      this.queryParams.endDate = null
      this.queryParams.purchasePlanRefStatus = null
      this.queryParams.pageNum = 1
      this.syncWarehouseFromProp()
      this.clearCache()
      this.loadList()
    },
    loadList() {
      if (!this.warehouseId) {
        this.purchaseList = []
        this.total = 0
        return
      }
      if (!this.isGz) {
        this.purchaseList = []
        this.total = 0
        return
      }
      this.syncWarehouseFromProp()
      this.loading = true
      const params = {
        ...this.queryParams,
        isGz: this.isGz,
        excludeReferenced: true,
        excludeReferencedPlanId: this.planId != null ? this.planId : undefined
      }
      listPurchase(params).then(response => {
        this.purchaseList = response.rows || []
        this.total = response.total != null ? Number(response.total) : 0
        this.loading = false
        this.$nextTick(() => this.restoreListSelection())
      }).catch(() => {
        this.loading = false
      })
    },
    restoreListSelection() {
      const table = this.$refs.purchaseListTable
      if (!table) return
      this.selectionRestoring = true
      table.clearSelection()
      ;(this.purchaseList || []).forEach(row => {
        const key = row && row.id != null ? String(row.id) : ''
        if (key && this.selectedRowMap[key]) table.toggleRowSelection(row, true)
      })
      this.$nextTick(() => { this.selectionRestoring = false })
    },
    onListSelectionChange(selection) {
      if (this.selectionRestoring) return
      const pageKeys = (this.purchaseList || []).map(r => (r && r.id != null ? String(r.id) : '')).filter(Boolean)
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key)
      })
      ;(selection || []).forEach(row => {
        if (row && row.id != null) this.$set(this.selectedRowMap, String(row.id), row)
      })
      this.selectedEntryIds = []
      this.scheduleReloadEntries()
    },
    scheduleReloadEntries() {
      if (this.reloadTimer) clearTimeout(this.reloadTimer)
      this.reloadTimer = setTimeout(() => {
        this.reloadTimer = null
        this.reloadEntries()
      }, RELOAD_DEBOUNCE_MS)
    },
    async reloadEntries() {
      const selection = Object.values(this.selectedRowMap || {})
      if (!selection.length) {
        this.selectedEntryList = []
        return
      }
      this.entryLoading = true
      try {
        const tasks = selection.map((row) => () => getPurchase(row.id).then(res => ({ row, data: res.data })))
        const responses = await runPool(tasks, FETCH_CONCURRENCY)
        const allEntries = []
        responses.forEach(({ row, data }) => {
          if (!data || !data.depPurchaseApplyEntryList) return
          const departmentName = (row.department && row.department.name) || '引用申购单'
          const purchaseBillNo = row.purchaseBillNo || ''
          const departmentId = row.departmentId != null ? row.departmentId : (row.department && row.department.id)
          data.depPurchaseApplyEntryList.forEach((entry) => {
            const entryId = entry.id != null ? String(entry.id) : ''
            if (entryId && this.referencedEntryIdSet && this.referencedEntryIdSet.has(entryId)) return
            allEntries.push(normalizePurchaseEntry(entry, { departmentName, purchaseBillNo, departmentId }))
          })
        })
        this.selectedEntryList = allEntries
        this.entryPageNum = 1
      } catch (e) {
        this.selectedEntryList = []
      } finally {
        this.entryLoading = false
      }
    },
    isEntrySelectable(row) {
      if (!row) return true
      const entryId = row.id != null ? String(row.id) : ''
      return !(entryId && this.referencedEntryIdSet && this.referencedEntryIdSet.has(entryId))
    },
    onEntrySelectionChange(selection) {
      this.selectedEntryIds = (selection || []).map(item => item.id || item.materialId)
    },
    /** 右侧勾选了明细：用已加载的预览数据；未勾选：后台按申购单批量拉取 */
    async resolveEntriesForConfirm(applyIds) {
      const rightIds = (this.selectedEntryIds || []).filter((id) => id != null && id !== '')
      if (rightIds.length > 0) {
        if (!this.selectedEntryList.length) {
          if (this.entryLoading) {
            this.$modal.msgWarning('右侧明细正在加载，请稍候再确定')
            return null
          }
          this.$modal.msgWarning('右侧明细尚未加载完成，请稍候；或不勾选明细直接确定以引用所选申购单全部明细')
          return null
        }
        const idSet = new Set(rightIds.map((id) => String(id)))
        let list = this.selectedEntryList.filter((entry) => {
          const eid = entry.id != null ? String(entry.id) : ''
          return eid && idSet.has(eid)
        })
        const before = list.length
        list = list.filter((entry) => this.isEntrySelectable(entry))
        if (before > list.length) {
          this.$modal.msgWarning(`已跳过 ${before - list.length} 条已在计划明细中的申购明细`)
        }
        return list
      }
      const excludeEntryIds = this.referencedEntryIdSet
        ? [...this.referencedEntryIdSet].map((id) => String(id))
        : []
      const res = await fetchReferenceApplyEntries(applyIds, excludeEntryIds.length ? excludeEntryIds : undefined)
      const rawList = (res && res.data) ? (Array.isArray(res.data) ? res.data : []) : []
      return mapReferenceApplyEntriesFromApi(rawList)
    },
    async handleConfirm() {
      const rows = Object.values(this.selectedRowMap || {})
      if (!rows.length) {
        this.$modal.msgWarning('请先选择至少一张申购单')
        return
      }
      const applyIds = rows.map((r) => r.id).filter((id) => id != null)
      if (!applyIds.length) {
        this.$modal.msgWarning('所选申购单无效')
        return
      }
      this.confirmLoading = true
      try {
        const entriesToAdd = await this.resolveEntriesForConfirm(applyIds)
        if (entriesToAdd == null) return
        if (!entriesToAdd.length) {
          this.$modal.msgWarning('没有可引用的明细（可能均已加入当前计划）')
          return
        }
        await yieldToMain()
        const newRows = buildPlanRowsFromPurchaseEntries(entriesToAdd, this.planEntryMode)
        if (!newRows.length) {
          this.$modal.msgWarning('未能生成计划明细，请检查申购单数据')
          return
        }
        if (newRows.length > 800) {
          await this.$confirm(
            `将添加约 ${newRows.length} 条计划明细，数据较多时可能需要等待十几秒，是否继续？`,
            '提示',
            { type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消' }
          )
        }
        const referenceBillNo = formatReferenceBillNo(rows.map((r) => r.purchaseBillNo))
        this.innerVisible = false
        this.$emit('confirm', { newRows, referenceBillNo, planSource: '引用申购单' })
      } catch (e) {
        if (e !== 'cancel') {
          this.$modal.msgError((e && e.message) || '获取申购明细失败，请稍后重试')
        }
      } finally {
        this.confirmLoading = false
      }
    },
    openReject() {
      const rows = Object.values(this.selectedRowMap || {})
      if (rows.length !== 1) {
        this.$modal.msgWarning('请选择一条申购单进行驳回')
        return
      }
      this.rejectForm.rejectReason = ''
      this.rejectVisible = true
    },
    submitReject() {
      this.$refs.rejectForm.validate(valid => {
        if (!valid) return
        const rows = Object.values(this.selectedRowMap || {})
        if (rows.length !== 1) return
        rejectPurchase({ id: String(rows[0].id), rejectReason: this.rejectForm.rejectReason }).then(() => {
          this.$modal.msgSuccess('驳回成功')
          this.rejectVisible = false
          this.loadList()
        }).catch(() => this.$modal.msgError('驳回失败'))
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/plan-modal-common.scss';

/* 引用申购单：整页按视口高度锁死，主区域 flex 分配，避免分页被裁切 */
.ref-purchase-root .local-modal-content.ref-purchase-modal {
  height: var(--ref-modal-h, 94vh);
  min-height: var(--ref-modal-h, 94vh);
  max-height: var(--ref-modal-h, 94vh);
  overflow: hidden;
}

.ref-purchase-root .modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.ref-purchase-modal .modal-body {
  overflow: hidden;
}

.query-container-fixed {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  flex-shrink: 0;
}

.query-container {
  background: #fff;
  padding: 2px 20px 4px 20px !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 0;
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  box-sizing: border-box;
}

.query-container ::v-deep .el-form {
  margin-bottom: 0 !important;
}

.query-container ::v-deep .el-row {
  margin-bottom: 4px;
}

.query-container ::v-deep .el-row:last-child {
  margin-bottom: 0;
}

.query-container ::v-deep .el-form-item {
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  display: flex !important;
  align-items: center !important;
  white-space: nowrap !important;
}

.query-container ::v-deep .el-form-item__label {
  padding-bottom: 0 !important;
  padding-top: 0 !important;
  line-height: 28px !important;
  height: 28px !important;
  width: 70px !important;
  flex-shrink: 0 !important;
  white-space: nowrap !important;
}

.query-container ::v-deep .el-form-item__content {
  line-height: 34px !important;
  margin-left: 0 !important;
  flex: 1 !important;
  min-width: 0 !important;
}

.query-container ::v-deep .el-input__inner {
  height: 34px !important;
  line-height: 34px !important;
  font-size: 13px !important;
}

.query-container ::v-deep .el-input__icon {
  line-height: 34px !important;
}

.query-container ::v-deep .el-date-editor.el-input {
  width: 140px;
  height: 34px !important;
}

.query-container ::v-deep .el-date-editor .el-input__inner {
  height: 34px !important;
  line-height: 34px !important;
  font-size: 13px !important;
}

.query-container ::v-deep .el-select {
  width: 100%;
}

.query-container ::v-deep .el-select .el-input__inner {
  height: 34px !important;
  line-height: 34px !important;
  font-size: 13px !important;
}

.query-container ::v-deep .el-select .el-input__icon {
  line-height: 34px !important;
}

.ref-date-range {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
}

.ref-date-sep {
  flex-shrink: 0;
  margin: 0 8px;
  color: #606266;
  font-size: 13px;
  line-height: 34px;
}

.button-container {
  text-align: left;
  margin: 10px 0;
  padding: 0 20px;
}

.button-container .el-button {
  margin-right: 10px;
}

.reference-purchase-layout {
  display: flex;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  height: var(--ref-content-h, 58vh);
  max-height: var(--ref-content-h, 58vh);
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  overflow: hidden;
}

.purchase-list-container {
  flex: 0 0 600px;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  margin-left: -20px;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.purchase-list-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.purchase-detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  position: relative;
}

.purchase-detail-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.entry-loading-tip {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 2;
  font-size: 12px;
  color: #409eff;
}

.ref-purchase-pagination-wrap {
  flex: 0 0 var(--ref-pager-h, 5.5vh);
  min-height: var(--ref-pager-h, 5.5vh);
  max-height: var(--ref-pager-h, 5.5vh);
  border-top: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  background: #fff;
  box-sizing: border-box;
  overflow: visible;
  z-index: 1;
}

.ref-purchase-pagination-wrap ::v-deep .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.entry-pagination-wrap {
  flex: 0 0 var(--ref-entry-pager-h, 5vh);
  min-height: var(--ref-entry-pager-h, 5vh);
  max-height: var(--ref-entry-pager-h, 5vh);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  box-sizing: border-box;
}

.ref-purchase-selected-tip {
  margin: 0 12px;
  font-size: 13px;
  color: #409eff;
  line-height: 36px;
}
</style>
