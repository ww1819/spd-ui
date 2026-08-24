<template>
  <div class="app-container list-page finance-wh-settlement-page">
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
                <SelectWarehouse v-model="queryParams.warehouseId" clearable />
              </div>
            </template>
            <el-input
              v-else
              v-model="queryParams.billNo"
              placeholder="仓库结算单单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                class="query-date-picker"
              />
            </el-form-item>
            <el-form-item prop="settlementMethod" class="query-item-inline">
              <el-select v-model="queryParams.settlementMethod" placeholder="结算方式" clearable class="more-search-select-wrap">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item prop="auditStatus" class="query-item-inline">
              <el-select v-model="queryParams.auditStatus" placeholder="审核状态" clearable class="more-search-short-select">
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
          @click="handleAdd"
          v-hasPermi="['finance:whSettlement:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate(selectedRow)"
          v-hasPermi="['finance:whSettlement:edit']"
        >修改</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['finance:whSettlement:remove']"
        >删除</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="list" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange" :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="单号" align="center" prop="billNo" width="160" show-overflow-tooltip />
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip />
      <el-table-column label="结算方式" align="center" prop="settlementMethod" width="100">
        <template slot-scope="scope">
          {{ scope.row.settlementMethod === '1' ? '入库结算' : scope.row.settlementMethod === '2' ? '出库结算' : scope.row.settlementMethod === '3' ? '消耗结算' : scope.row.settlementMethod }}
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" width="90" />
      <el-table-column label="制单时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="审核状态" align="center" prop="auditStatus" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.auditStatus === 1 ? 'success' : 'warning'">{{ scope.row.auditStatus === 1 ? '已审核' : '待审核' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="90" />
      <el-table-column label="审核时间" align="center" prop="auditTime" width="160">
        <template slot-scope="scope">{{ scope.row.auditTime ? parseTime(scope.row.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="apply-action-col small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleUpdate(scope.row)" v-hasPermi="['finance:whSettlement:query']">详情/修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['finance:whSettlement:audit']" v-if="scope.row.auditStatus !== 1">审核</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['finance:whSettlement:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
    </div>
    </div>

    <!-- 新增/修改 弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="open" width="960px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId" :rules="[{ required: true, message: '请选择仓库', trigger: 'change' }]">
              <SelectWarehouse v-model="form.warehouseId" :disabled="form.auditStatus === 1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结算方式" prop="settlementMethod" :rules="[{ required: true, message: '请选择结算方式', trigger: 'change' }]">
              <el-select v-model="form.settlementMethod" placeholder="请选择" style="width: 100%" :disabled="!!form.id">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="!form.id">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="extractDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="!form.id">
          <el-col :span="24">
            <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="doExtractData" :loading="extractLoading">提取数据</el-button>
            <span class="el-form-item__label" style="margin-left: 12px;">提取后将显示下方明细，可删除不需要的行再保存。</span>
          </el-col>
        </el-row>
      </el-form>
      <el-table v-if="form.id || (entryList && entryList.length)" :data="entryList" border max-height="320" size="small">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="billNo" label="业务单号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="materialName" label="耗材名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="speci" label="规格" width="100" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.unitPrice != null ? Number(scope.row.unitPrice).toFixed(4) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="amt" label="金额" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.amt != null ? this.formatAmount(scope.row.amt) : '--' }}</template>
        </el-table-column>
        <el-table-column v-if="form.id && form.auditStatus !== 1" label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeOneEntry(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="open = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm" :loading="submitLoading">{{ form.id ? '保存明细' : '保存结算单' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listWhSettlement, getWhSettlement, addWhSettlement, updateWhSettlement, delWhSettlement, extractData, saveEntries, removeEntries, auditWhSettlement } from '@/api/finance/whSettlement'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'WhSettlement',
  components: { SelectWarehouse },
  data() {
    return {
      loading: false,
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '单号', value: 'billNo' },
        { label: '仓库', value: 'warehouse' }
      ],
      list: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: undefined,
        warehouseId: undefined,
        settlementMethod: undefined,
        auditStatus: undefined
      },
      dateRange: [],
      ids: [],
      single: true,
      multiple: true,
      selectedRow: null,
      open: false,
      dialogTitle: '',
      form: {},
      formRef: null,
      entryList: [],
      extractDateRange: [],
      extractLoading: false,
      submitLoading: false
    }
  },
  computed: {
    moreSearchStorageKey() {
      return 'spd.finance.whSettlement.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.getList()
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
    }
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight()
    },
    scheduleApplyLayoutRefresh() {
      this.$nextTick(() => {
        this.updateMainTableHeight()
        requestAnimationFrame(() => this.updateMainTableHeight())
      })
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel
      const pagWrap = this.$refs.paginationWrap
      if (!panel || !panel.getBoundingClientRect) return
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height
      if (!panelH) return
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8
      const height = Math.max(200, Math.floor(panelH - pagH))
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable
        if (table && table.doLayout) table.doLayout()
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
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : ''
    },
    applyMainRowClassName({ row }) {
      const key = this.getApplyMainRowKey(row)
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected'
      }
      return ''
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable
      if (!table || !this.list || !this.list.length) return
      const keys = this.selectedRowMap || {}
      if (!Object.keys(keys).length) return
      this.list.forEach((row) => {
        const key = this.getApplyMainRowKey(row)
        if (key && keys[key]) {
          table.toggleRowSelection(row, true)
        }
      })
    },
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      if (this.dateRange && this.dateRange.length === 2) {
        params.params = {}
        params.params.beginTime = this.dateRange[0]
        params.params.endTime = this.dateRange[1]
      }
      listWhSettlement(params).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
        this.loading = false
        this.$nextTick(() => {
          this.restoreMainPageSelection()
          this.scheduleApplyLayoutRefresh()
        })
      }).catch(() => {
        this.loading = false
        this.scheduleApplyLayoutRefresh()
      })
    },
    handleAdd() {
      this.form = { warehouseId: undefined, settlementMethod: undefined }
      this.entryList = []
      this.extractDateRange = []
      this.dialogTitle = '新增仓库结算单'
      this.open = true
    },
    handleUpdate(row) {
      const r = row || this.selectedRow
      if (!r || !r.id) {
        this.$modal.msgWarning('请选择一条记录')
        return
      }
      getWhSettlement(r.id).then(res => {
        const data = res.data || {}
        this.form = { ...data }
        this.entryList = (data.entryList || []).map(e => ({ ...e }))
        this.dialogTitle = data.auditStatus === 1 ? '仓库结算单详情' : '修改仓库结算单'
        this.open = true
      })
    },
    doExtractData() {
      if (!this.form.warehouseId || !this.form.settlementMethod) {
        this.$modal.msgWarning('请先选择仓库和结算方式')
        return
      }
      if (!this.extractDateRange || this.extractDateRange.length !== 2) {
        this.$modal.msgWarning('请选择日期范围')
        return
      }
      this.extractLoading = true
      extractData({
        warehouseId: this.form.warehouseId,
        settlementMethod: this.form.settlementMethod,
        beginTime: this.extractDateRange[0],
        endTime: this.extractDateRange[1]
      }).then(res => {
        this.entryList = res.data || []
        this.extractLoading = false
        this.$modal.msgSuccess('提取成功，共 ' + (this.entryList.length) + ' 条')
      }).catch(() => { this.extractLoading = false })
    },
    removeOneEntry(entryId) {
      if (!this.form.id) return
      this.$modal.confirm('确认删除该明细？').then(() => {
        return removeEntries(this.form.id, [entryId])
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        return getWhSettlement(this.form.id)
      }).then(res => {
        this.entryList = (res.data && res.data.entryList) || []
      }).catch(() => {})
    },
    submitForm() {
      if (this.form.auditStatus === 1) {
        this.open = false
        return
      }
      if (this.form.id) {
        this.$refs.formRef && this.$refs.formRef.validate(valid => {
          if (!valid) return
          this.submitLoading = true
          saveEntries(this.form.id, this.entryList).then(() => {
            this.$modal.msgSuccess('保存成功')
            this.submitLoading = false
            this.open = false
            this.getList()
          }).catch(() => { this.submitLoading = false })
        })
      } else {
        this.$refs.formRef && this.$refs.formRef.validate(valid => {
          if (!valid) return
          if (!this.entryList || !this.entryList.length) {
            this.$modal.msgWarning('请先提取数据并保留至少一条明细')
            return
          }
          this.submitLoading = true
          addWhSettlement({
            warehouseId: this.form.warehouseId,
            settlementMethod: this.form.settlementMethod,
            entryList: this.entryList
          }).then(() => {
            this.$modal.msgSuccess('保存成功')
            this.submitLoading = false
            this.open = false
            this.getList()
          }).catch(() => { this.submitLoading = false })
        })
      }
    },
    handleAudit(row) {
      const id = (row && row.id) || (this.ids && this.ids[0])
      if (!id) {
        this.$modal.msgWarning('请选择一条记录')
        return
      }
      this.$modal.confirm('审核后将生成供应商结算单且不可再修改明细，是否确认审核？').then(() => {
        return auditWhSettlement(id)
      }).then(() => {
        this.$modal.msgSuccess('审核成功')
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row && row.id ? [row.id] : this.ids
      if (!ids || !ids.length) {
        this.$modal.msgWarning('请选择要删除的记录')
        return
      }
      this.$modal.confirm('是否确认删除该仓库结算单？').then(() => {
        return delWhSettlement(ids[0])
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.getList()
      }).catch(() => {})
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.list || [])
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
      this.ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key)
        return Number.isNaN(n) ? key : n
      })
      this.single = this.ids.length !== 1
      this.multiple = !this.ids.length
      this.selectedRow = this.ids.length === 1 ? this.selectedRowMap[String(this.ids[0])] : null
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.handleQuery()
    },
    moreSearchFieldClass(t) {
      if (t === 'warehouse') {
        return 'more-search-field--select'
      }
      return 'more-search-field--text'
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
        billNo: 'billNo',
        warehouse: 'warehouseId'
      }
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null
        }
      })
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    }
  }
}
</script>
