<template>
  <div class="app-container list-page hc-customer-page">
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
            class="more-search-dynamic-field more-search-field--text"
          >
            <el-input
              v-if="t === 'customerCode'"
              v-model="queryParams.customerCode"
              placeholder="客户编码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.customerName"
              placeholder="客户名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item prop="hcStatus" class="query-item-inline">
              <el-select v-model="queryParams.hcStatus" placeholder="耗材状态" clearable class="more-search-short-select">
                <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
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
          v-hasPermi="['hc:system:customer:list']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['hc:system:customer:query']"
        >修改</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['hc:system:customer:list']"
        >删除</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          @click="openFullInitDialog"
          v-hasPermi="['hc:system:customer:initDb']"
        >全库初始化</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>
    <el-table v-loading="loading" :data="customerList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="客户编号" prop="customerId" width="220" show-overflow-tooltip />
      <el-table-column label="租户类型" prop="tenantKey" width="120" show-overflow-tooltip />
      <el-table-column label="客户名称" prop="customerName" min-width="160" show-overflow-tooltip />
      <el-table-column label="客户编码" prop="customerCode" width="140" show-overflow-tooltip />
      <el-table-column label="耗材状态" align="center" width="90">
        <template slot-scope="scope">
          <el-tag :type="(scope.row.hcStatus || '0') === '0' ? 'success' : 'danger'">{{ (scope.row.hcStatus || '0') === '0' ? '正常' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="耗材系统计划停用时间" align="center" width="190">
        <template slot-scope="scope">{{ scope.row.hcPlannedDisableTime ? parseTime(scope.row.hcPlannedDisableTime, '{y}-{m}-{d} {h}:{i}') : '-' }}</template>
      </el-table-column>
      <el-table-column label="单价小数位" align="center" width="100" prop="priceDecimalPlaces" />
      <el-table-column label="金额小数位" align="center" width="100" prop="amountDecimalPlaces" />
      <el-table-column label="创建时间" align="center" width="160">
        <template slot-scope="scope">{{ parseTime(scope.row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="600" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:system:customer:query']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-video-pause" @click="handleChangeStatus(scope.row, '1')" v-hasPermi="['hc:system:customer:query']" v-if="(scope.row.hcStatus || '0') === '0'">停用</el-button>
          <el-button size="mini" type="text" icon="el-icon-video-play" @click="handleChangeStatus(scope.row, '0')" v-hasPermi="['hc:system:customer:query']" v-if="(scope.row.hcStatus || '0') === '1'">启用</el-button>
          <el-button size="mini" type="text" icon="el-icon-s-operation" @click="handleAssignMenu(scope.row)" v-hasPermi="['hc:system:customer:query']">耗材客户权限</el-button>
          <el-button size="mini" type="text" icon="el-icon-coin" @click="handleMoneyScale(scope.row)" v-hasPermi="['hc:system:customer:query']">金额小数位</el-button>
          <el-button size="mini" type="text" icon="el-icon-refresh-right" @click="handleResetMaterial(scope.row)" v-hasPermi="['hc:system:customerMenuManage:edit']">耗材功能重置</el-button>
          <el-button size="mini" type="text" icon="el-icon-document" @click="handleStatusLog(scope.row)" v-hasPermi="['hc:system:customer:query']">启停用记录</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:system:customer:list']">删除</el-button>
          <el-button size="mini" type="text" class="text-danger" icon="el-icon-remove-outline" @click="handlePurgeHc(scope.row)" v-hasPermi="['hc:system:customer:purgeHc']">清理耗材数据</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
    <HcCustomerEditDialog v-if="open" />
    <HcCustomerStatusDialog v-if="openStatus" />
    <HcCustomerLogDialog v-if="openLog" />
    <HcCustomerFullInitDialog v-if="openFullInit" />
    <HcCustomerMenuDialog v-if="openMenu" />
    <HcCustomerMoneyScaleDialog v-if="openMoneyScale" />
  </div>
</template>

<script>
import { addCustomer, delCustomer, getTenantEnumList, listHcCustomers, getHcCustomer, updateHcCustomer, changeHcStatus, getCustomerStatusLogs, getCustomerPeriodLogs, treeselectHcMenu, getHcCustomerMenuIds, saveHcCustomerMenus, resetMaterialFunctions, initFullDatabase, purgeConsumablesData, submitMoneyScale, approveMoneyScale, rejectMoneyScale, listMoneyScaleAudits } from '@/api/material/customer'
import { toMenuIdNumbers } from '@/utils/menuAuthUtils'

export default {
  name: 'HcCustomer',
  components: {
    HcCustomerEditDialog: () => import('./components/HcCustomerEditDialog'),
    HcCustomerStatusDialog: () => import('./components/HcCustomerStatusDialog'),
    HcCustomerLogDialog: () => import('./components/HcCustomerLogDialog'),
    HcCustomerFullInitDialog: () => import('./components/HcCustomerFullInitDialog'),
    HcCustomerMenuDialog: () => import('./components/HcCustomerMenuDialog'),
    HcCustomerMoneyScaleDialog: () => import('./components/HcCustomerMoneyScaleDialog')
  },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '客户名称', value: 'customerName' },
        { label: '客户编码', value: 'customerCode' }
      ],
      total: 0,
      customerList: [],
      title: '',
      open: false,
      openMenu: false,
      openStatus: false,
      openLog: false,
      openMoneyScale: false,
      moneyScaleForm: {
        customerId: '',
        customerName: '',
        currentPrice: 3,
        currentAmount: 3,
        currentRoundMode: 'HALF_UP',
        priceDecimalPlaces: 3,
        amountDecimalPlaces: 3,
        moneyRoundMode: 'HALF_UP',
        applyRemark: ''
      },
      moneyScaleAuditList: [],
      statusForm: { customerId: '', customerName: '', status: '0', statusChangeReason: '' },
      statusRules: { statusChangeReason: [{ required: true, validator: (r, v, cb) => { if (!v || !String(v).trim()) cb(new Error('请输入原因')); else cb(); }, trigger: 'blur' }] },
      statusDialogTitle: '启停用客户',
      logForm: { customerId: '', customerName: '' },
      activeLogTab: 'statusLog',
      statusLogList: [],
      periodLogList: [],
      menuOptions: [],
      menuExpand: false,
      menuParentChildLinked: true,
      menuExistingIds: [],
      menuSelectedIds: [],
      menuForm: { customerId: '', customerName: '' },
      openFullInit: false,
      fullInitTokenInput: '',
      FULL_INIT_TOKEN: 'CONFIRM_PURGE_ALL_TENANT_DATA',
      queryParams: { pageNum: 1, pageSize: 10, customerName: undefined, customerCode: undefined, hcStatus: undefined },
      tenantEnumList: [],
      form: {},
      pickerOptions: { disabledDate(time) { return time.getTime() < Date.now() - 8.64e7 } },
      rules: {
        customerName: [{ required: true, message: '客户名称不能为空', trigger: 'blur' }],
        tenantKey: [{ required: true, validator: (r, v, cb) => { if (this.form.customerId) return cb(); if (!v || !String(v).trim()) cb(new Error('请选择租户类型')); else cb(); }, trigger: 'change' }]
      }
    }
  },
  computed: {
    moreSearchStorageKey() {
      return 'spd.material.system.customer.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    },
    selectedTenantEnum() {
      if (!this.form.tenantKey || !this.tenantEnumList.length) return null
      return this.tenantEnumList.find(t => t.name === this.form.tenantKey) || null
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.getList()
    getTenantEnumList().then(res => { this.tenantEnumList = res.data || [] }).catch(() => { this.tenantEnumList = [] })
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listHcCustomers(params).then(res => {
        this.customerList = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    cancel() { this.open = false; this.resetForm('form'); this.form = {} },
    reset() { this.form = { customerId: undefined, customerName: undefined, customerCode: undefined, tenantKey: undefined, status: '0', hcStatus: '0', hcPlannedDisableTime: undefined, remark: undefined }; this.resetForm('form') },
    onTenantKeyChange(val) { const item = this.tenantEnumList.find(t => t.name === val); if (item) this.form.customerCode = item.customerCode },
    handleAdd() { this.reset(); this.open = true; this.title = '新增客户' },
    handleUpdate(row) {
      this.reset()
      const id = row.customerId || this.ids[0]
      getHcCustomer(id).then(res => { this.form = res.data; this.open = true; this.title = '修改客户' })
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        if (this.form.customerId) {
          updateHcCustomer({ customerId: this.form.customerId, customerName: this.form.customerName, remark: this.form.remark, hcStatus: this.form.hcStatus, hcPlannedDisableTime: this.form.hcPlannedDisableTime }).then(() => { this.$modal.msgSuccess('修改成功'); this.open = false; this.getList() })
        } else {
          addCustomer(this.form).then(() => { this.$modal.msgSuccess('新增成功'); this.open = false; this.getList() })
        }
      })
    },
    handleDelete(row) {
      const ids = row.customerId ? [row.customerId] : this.ids
      this.$modal.confirm('是否确认删除所选客户？').then(() => delCustomer(ids[0])).then(() => { this.getList(); this.$modal.msgSuccess('删除成功') }).catch(() => {})
    },
    handleSelectionChange(selection) { this.ids = selection.map(item => item.customerId); this.single = selection.length !== 1; this.multiple = !selection.length },
    handleQuery() { this.queryParams.pageNum = 1; this.getList() },
    resetQuery() { this.resetForm('queryForm'); this.moreSearchTypes = this.loadMoreSearchDefaults(); this.onMoreSearchTypesChange(); this.handleQuery() },
    collectCustomerMenuTreeIds(nodes, acc) {
      const set = acc || new Set()
      if (!nodes || !nodes.length) return set
      nodes.forEach(n => {
        const id = n.menuId != null ? n.menuId : n.id
        if (id != null && id !== '') set.add(String(id))
        if (n.children && n.children.length) this.collectCustomerMenuTreeIds(n.children, set)
      })
      return set
    },
    handleAssignMenu(row) {
      this.menuForm = { customerId: row.customerId, customerName: row.customerName }
      this.openMenu = true
      this.menuOptions = []
      const customerId = row.customerId != null ? String(row.customerId) : ''
      Promise.all([treeselectHcMenu(), getHcCustomerMenuIds(customerId)]).then(([treeRes, idsRes]) => {
        const rawTree = treeRes.data || []
        this.menuOptions = this.mapTreeToMenuKeys(rawTree)
        const ids = idsRes.data || []
        const allowed = this.collectCustomerMenuTreeIds(this.menuOptions)
        const filtered = ids.map(String).filter(id => allowed.has(id))
        this.menuExistingIds = filtered.slice()
        this.menuSelectedIds = toMenuIdNumbers(filtered)
        this.$nextTick(() => {
          if (this.$refs.menuAuthDualTree) {
            this.$refs.menuAuthDualTree.resetAutoPreselectState()
            this.$refs.menuAuthDualTree.setSelectedIds(this.menuSelectedIds)
          }
        })
      })
    },
    mapTreeToMenuKeys(nodes) {
      if (!nodes || !nodes.length) return []
      return nodes.map(n => ({
        menuId: n.id != null ? n.id : n.menuId,
        menuName: n.label != null ? n.label : n.menuName,
        children: n.children && n.children.length ? this.mapTreeToMenuKeys(n.children) : undefined
      }))
    },
    handleMenuTreeExpand(v) {
      if (this.$refs.menuAuthDualTree) this.$refs.menuAuthDualTree.setExpandAll(!!v)
    },
    handleMenuSelectAll(v) {
      if (!this.$refs.menuAuthDualTree) return
      if (v) this.$refs.menuAuthDualTree.selectAllCheckable()
      else this.$refs.menuAuthDualTree.clearSelection()
    },
    handleChangeStatus(row, status) {
      this.statusForm = { customerId: row.customerId, customerName: row.customerName, status: status, statusChangeReason: '' }
      this.statusDialogTitle = status === '0' ? '启用客户' : '停用客户'
      this.openStatus = true
      this.$nextTick(() => this.$refs.statusForm && this.$refs.statusForm.clearValidate())
    },
    submitStatusForm() {
      this.$refs.statusForm.validate(valid => {
        if (!valid) return
        changeHcStatus(this.statusForm).then(() => { this.$modal.msgSuccess('操作成功'); this.openStatus = false; this.getList() })
      })
    },
    handleStatusLog(row) {
      this.logForm = { customerId: row.customerId, customerName: row.customerName }
      this.activeLogTab = 'statusLog'
      this.openLog = true
      this.statusLogList = []
      this.periodLogList = []
      getCustomerStatusLogs(row.customerId).then(res => { this.statusLogList = res.data || [] })
      getCustomerPeriodLogs(row.customerId).then(res => { this.periodLogList = res.data || [] })
    },
    handleResetMaterial(row) {
      const name = row.customerName || row.customerId
      this.$modal.confirm('是否确认将客户“' + name + '”的耗材功能重置？将重置耗材客户菜单权限、super 岗位及 super_01 的菜单权限为系统设置下非平台管理功能；若 super 岗位或 super_01 不存在则会创建。').then(() => resetMaterialFunctions(row.customerId)).then(() => { this.$modal.msgSuccess('耗材功能重置成功'); this.getList() }).catch(() => {})
    },
    openFullInitDialog() {
      this.fullInitTokenInput = ''
      this.openFullInit = true
    },
    submitFullInit() {
      if (this.fullInitTokenInput !== this.FULL_INIT_TOKEN) {
        this.$modal.msgError('口令不正确')
        return
      }
      initFullDatabase(this.fullInitTokenInput).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '已提交全库初始化')
        this.openFullInit = false
        this.fullInitTokenInput = ''
      }).catch(() => {})
    },
    handlePurgeHc(row) {
      const name = row.customerName || row.customerId
      this.$modal.confirm('确认物理删除租户「' + name + '」下全部耗材业务数据（含该租户用户，不删除客户主档）？此操作不可恢复。').then(() => purgeConsumablesData(row.customerId)).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '清理完成')
        this.getList()
      }).catch(() => {})
    },
    submitMenuForm() {
      const menuIds = (this.$refs.menuAuthDualTree
        ? this.$refs.menuAuthDualTree.getSelectedIds()
        : this.menuSelectedIds || []
      ).map(String)
      saveHcCustomerMenus(this.menuForm.customerId, menuIds).then(() => { this.$modal.msgSuccess('保存成功'); this.openMenu = false })
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
        customerName: 'customerName',
        customerCode: 'customerCode'
      }
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null
        }
      })
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
    handleMoneyScale(row) {
      this.moneyScaleForm = {
        customerId: row.customerId,
        customerName: row.customerName,
        currentPrice: row.priceDecimalPlaces != null ? row.priceDecimalPlaces : 3,
        currentAmount: row.amountDecimalPlaces != null ? row.amountDecimalPlaces : 3,
        currentRoundMode: row.moneyRoundMode || 'HALF_UP',
        priceDecimalPlaces: row.priceDecimalPlaces != null ? row.priceDecimalPlaces : 3,
        amountDecimalPlaces: row.amountDecimalPlaces != null ? row.amountDecimalPlaces : 3,
        moneyRoundMode: row.moneyRoundMode || 'HALF_UP',
        applyRemark: ''
      }
      this.openMoneyScale = true
    },
    loadMoneyScaleAudits() {
      if (!this.moneyScaleForm.customerId) return
      listMoneyScaleAudits(this.moneyScaleForm.customerId).then(res => {
        this.moneyScaleAuditList = res.data || []
      }).catch(() => { this.moneyScaleAuditList = [] })
    },
    submitMoneyScaleForm() {
      const f = this.moneyScaleForm
      if (f.priceDecimalPlaces == null || f.amountDecimalPlaces == null) {
        this.$modal.msgError('请填写单价/金额小数位')
        return
      }
      submitMoneyScale(f.customerId, {
        priceDecimalPlaces: f.priceDecimalPlaces,
        amountDecimalPlaces: f.amountDecimalPlaces,
        moneyRoundMode: f.moneyRoundMode || 'HALF_UP',
        applyRemark: f.applyRemark
      }).then(() => {
        this.$modal.msgSuccess('已提交审核')
        this.loadMoneyScaleAudits()
        this.getList()
      })
    },
    approveMoneyScaleRow(row) {
      this.$modal.confirm('确认通过该金额小数位申请？（允许自审，通过后租户需重新登录生效）').then(() => {
        return approveMoneyScale(row.auditId, '审核通过')
      }).then(() => {
        this.$modal.msgSuccess('已通过')
        this.loadMoneyScaleAudits()
        this.getList()
      }).catch(() => {})
    },
    rejectMoneyScaleRow(row) {
      this.$prompt('请输入驳回原因', '驳回', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '驳回原因不能为空'
      }).then(({ value }) => rejectMoneyScale(row.auditId, value)).then(() => {
        this.$modal.msgSuccess('已驳回')
        this.loadMoneyScaleAudits()
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.list-query-panel {
  margin-top: -20px;
}
.log-dialog-header { margin-bottom: 12px; font-weight: 600; color: #303133; }
.text-danger { color: #f56c6c; }
</style>
