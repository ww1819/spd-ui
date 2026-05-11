<template>
  <section class="app-main">
    <!-- 消息提醒：主内容区内 local-modal（与到货验收页策略一致） -->
    <transition name="wh-modal-fade">
      <div
        v-if="warehouseReminderVisible"
        class="wh-reminder-local-mask"
        @click.self="closeWarehouseReminder"
      >
        <transition name="wh-modal-zoom">
          <div v-if="warehouseReminderVisible" class="wh-reminder-local-content">
            <div class="wh-reminder-modal-header">
              <div class="wh-reminder-modal-title">消息提醒</div>
              <el-button size="small" class="wh-reminder-close-btn" @click="closeWarehouseReminder">关闭</el-button>
            </div>
            <div class="wh-reminder-modal-body">
              <div class="wh-reminder-body-layout">
                <aside class="wh-reminder-aside">
                  <nav class="wh-reminder-side-menu" aria-label="消息提醒分类">
                    <div
                      v-for="m in reminderSideMenus"
                      :key="m.key"
                      :class="['wh-reminder-side-item', { active: messageReminderCategory === m.key }]"
                      role="button"
                      tabindex="0"
                      @click="selectReminderCategory(m.key)"
                      @keyup.enter="selectReminderCategory(m.key)"
                    >
                      {{ m.label }}
                    </div>
                  </nav>
                </aside>
                <div class="wh-reminder-panel">
                  <template v-if="messageReminderCategory === 'warehouse'">
                    <nav class="wh-reminder-sub-tabs" aria-label="仓库预警分类">
                      <div
                        v-for="t in warehouseSubTabs"
                        :key="t.key"
                        :class="['wh-reminder-sub-tab', { active: warehouseReminderSubTab === t.key }]"
                        role="button"
                        tabindex="0"
                        @click="selectWarehouseSubTab(t.key)"
                        @keyup.enter="selectWarehouseSubTab(t.key)"
                      >
                        <span>{{ t.label }}</span>
                        <span
                          v-if="warehouseSubTabBadge(t.key)"
                          class="wh-reminder-sub-tab-badge"
                        >{{ warehouseSubTabBadge(t.key) }}</span>
                      </div>
                    </nav>
                    <div
                      v-show="showWarehouseBillBlock"
                      v-loading="warehouseReminderLoading"
                      class="wh-reminder-bill-layout"
                    >
                      <div class="wh-reminder-bill-right">
                        <p v-if="warehouseReminderError" class="wh-reminder-error wh-reminder-error--above-table">{{ warehouseReminderError }}</p>
                        <div v-show="showWarehouseApplyBlock" class="wh-reminder-table-section">
                          <div class="wh-reminder-apply-toolbar">
                            <div class="wh-reminder-detail-section-title">待出库申领单</div>
                            <el-select
                              v-model="applyOutboundStatusFilter"
                              size="small"
                              class="wh-reminder-status-filter"
                              placeholder="状态"
                            >
                              <el-option label="全部" value="all" />
                              <el-option label="未出库" value="pending" />
                              <el-option label="已出库" value="out" />
                            </el-select>
                          </div>
                          <el-table
                            :data="filteredWarehouseApplyRows"
                            border
                            stripe
                            size="small"
                            class="wh-reminder-detail-table"
                            max-height="320"
                            empty-text="暂无数据"
                          >
                            <el-table-column type="index" label="序号" width="58" align="center" />
                            <el-table-column label="申领单号" prop="applyBillNo" min-width="140" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span
                                  class="wh-reminder-bill-no-link"
                                  :title="'双击打开出库申请'"
                                  @dblclick.prevent="handleDeptApplyBillNoDblClick(scope.row.applyBillNo)"
                                >{{ scope.row.applyBillNo }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="状态" width="92" align="center">
                              <template slot-scope="scope">
                                <el-tag v-if="applyRowOutboundDone(scope.row)" type="success" size="small">已出库</el-tag>
                                <el-tag v-else type="info" size="small">未出库</el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单时间" min-width="150" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="科室" min-width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.departmentName || '—' }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ formatReminderMoney(scope.row.totalAmount) }}</span>
                                <span v-else>—</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单人" width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.creatorName || '—' }}</span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                      </div>
                    </div>
                    <div
                      v-show="showWarehouseInventoryBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">库存预警请在库存查询、库存预警等相关业务菜单中查看与处理。</p>
                    </div>
                    <div
                      v-show="showWarehouseNearExpiryBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">库存近效期仓库预警请在近效期库存、批次效期等相关业务菜单中查看与处理。</p>
                    </div>
                  </template>
                  <template v-if="messageReminderCategory === 'department'">
                    <nav class="wh-reminder-sub-tabs" aria-label="科室预警分类">
                      <div
                        v-for="t in departmentSubTabs"
                        :key="t.key"
                        :class="['wh-reminder-sub-tab', { active: departmentReminderSubTab === t.key }]"
                        role="button"
                        tabindex="0"
                        @click="selectDepartmentSubTab(t.key)"
                        @keyup.enter="selectDepartmentSubTab(t.key)"
                      >
                        <span>{{ t.label }}</span>
                      </div>
                    </nav>
                    <div
                      v-show="showDepartmentUnreceivedBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">科室未收货确认预警请在科室收货确认等相关业务菜单中查看与处理。</p>
                    </div>
                    <div
                      v-show="showDepartmentInventoryBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">科室库存预警请在科室库存、科室库存预警等相关业务菜单中查看与处理。</p>
                    </div>
                    <div
                      v-show="showDepartmentExpiryBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">科室有效期预警请在科室效期预警、科室批次效期等相关业务菜单中查看与处理。</p>
                    </div>
                  </template>
                  <div
                    v-show="messageReminderCategory === 'data'"
                    class="wh-reminder-panel-inner wh-reminder-placeholder"
                  >
                    <p class="wh-reminder-line">数据异常预警内容请在相关业务菜单中查看与处理。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view v-if="!$route.meta.link" :key="key" />
      </keep-alive>
    </transition>
    <iframe-toggle />
  </section>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import iframeToggle from './IframeToggle/index'
import { fetchHomeWarehouseReminderCounts, fetchHomeWarehouseReminderApplyList } from '@/api/dashboard/home'

export default {
  name: 'AppMain',
  components: { iframeToggle },
  data() {
    return {
      warehouseReminderLoading: false,
      warehouseReminder: { apply: 0, purchase: 0 },
      warehouseReminderError: '',
      pendingApplyRows: [],
      /** 待出库申领单：all | pending | out，默认全部 */
      applyOutboundStatusFilter: 'all'
    }
  },
  computed: {
    reminderSideMenus() {
      return [
        { key: 'warehouse', label: '仓库预警' },
        { key: 'department', label: '科室预警' },
        { key: 'data', label: '数据异常预警' }
      ]
    },
    warehouseSubTabs() {
      return [
        { key: 'all', label: '全部' },
        { key: 'apply', label: '申领单预警' },
        { key: 'purchase', label: '申购单预警' },
        { key: 'inventory', label: '库存预警' },
        { key: 'nearExpiry', label: '库存近效期仓库预警' }
      ]
    },
    departmentSubTabs() {
      return [
        { key: 'all', label: '全部' },
        { key: 'unreceivedConfirm', label: '科室未收货确认预警' },
        { key: 'inventory', label: '科室库存预警' },
        { key: 'expiry', label: '科室有效期预警' }
      ]
    },
    showWarehouseApplyBlock() {
      return this.warehouseReminderSubTab === 'all' || this.warehouseReminderSubTab === 'apply'
    },
    showWarehousePurchaseBlock() {
      return this.warehouseReminderSubTab === 'all' || this.warehouseReminderSubTab === 'purchase'
    },
    showWarehouseInventoryBlock() {
      return this.warehouseReminderSubTab === 'inventory'
    },
    showWarehouseNearExpiryBlock() {
      return this.warehouseReminderSubTab === 'nearExpiry'
    },
    showWarehouseBillBlock() {
      return this.showWarehouseApplyBlock || this.showWarehousePurchaseBlock
    },
    filteredWarehouseApplyRows() {
      const rows = this.pendingApplyRows || []
      return rows.filter(row => {
        if (this.shouldHideStaleOutboundRow(row)) return false
        const done = this.applyRowOutboundDone(row)
        if (this.applyOutboundStatusFilter === 'pending') return !done
        if (this.applyOutboundStatusFilter === 'out') return done
        return true
      })
    },
    showDepartmentUnreceivedBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'unreceivedConfirm'
    },
    showDepartmentInventoryBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'inventory'
    },
    showDepartmentExpiryBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'expiry'
    },
    ...mapState({
      warehouseReminderVisible: state => state.app.warehouseReminderVisible,
      messageReminderCategory: state => state.app.messageReminderCategory,
      warehouseReminderSubTab: state => state.app.warehouseReminderSubTab,
      departmentReminderSubTab: state => state.app.departmentReminderSubTab
    }),
    ...mapGetters(['sidebarRouters']),
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
    key() {
      return this.$route.path
    }
  },
  watch: {
    $route(to, from) {
      if (!this.warehouseReminderVisible || !from || from.matched.length === 0) return
      if (to.path !== from.path) {
        this.closeWarehouseReminder()
      }
    },
    warehouseReminderVisible(val) {
      if (val && this.messageReminderCategory === 'warehouse' && this.showWarehouseBillBlock) {
        this.loadWarehouseReminderCounts()
      }
    },
    messageReminderCategory(val) {
      if (this.warehouseReminderVisible && val === 'warehouse' && this.showWarehouseBillBlock) {
        this.loadWarehouseReminderCounts()
      }
    },
    warehouseReminderSubTab() {
      if (this.warehouseReminderVisible && this.messageReminderCategory === 'warehouse' && this.showWarehouseBillBlock) {
        this.loadWarehouseReminderCounts()
      }
    }
  },
  methods: {
    warehouseSubTabBadge(key) {
      if (key === 'apply' && this.warehouseReminder.apply > 0) {
        return this.warehouseReminder.apply
      }
      if (key === 'purchase' && this.warehouseReminder.purchase > 0) {
        return this.warehouseReminder.purchase
      }
      if (key === 'all' && (this.warehouseReminder.apply + this.warehouseReminder.purchase) > 0) {
        return this.warehouseReminder.apply + this.warehouseReminder.purchase
      }
      return 0
    },
    selectReminderCategory(key) {
      this.$store.commit('app/SET_MESSAGE_REMINDER_CATEGORY', key)
      if (key === 'warehouse') {
        this.$store.commit('app/SET_WAREHOUSE_REMINDER_SUB_TAB', 'all')
        this.loadWarehouseReminderCounts()
      } else if (key === 'department') {
        this.$store.commit('app/SET_DEPARTMENT_REMINDER_SUB_TAB', 'all')
      }
    },
    selectDepartmentSubTab(key) {
      this.$store.commit('app/SET_DEPARTMENT_REMINDER_SUB_TAB', key)
    },
    selectWarehouseSubTab(key) {
      this.$store.commit('app/SET_WAREHOUSE_REMINDER_SUB_TAB', key)
      if (key === 'all' || key === 'apply' || key === 'purchase') {
        this.loadWarehouseReminderCounts()
      }
    },
    closeWarehouseReminder() {
      this.$store.dispatch('app/closeWarehouseReminder')
    },
    joinSidebarRoutePath(base, segment) {
      const s = segment != null ? String(segment).trim() : ''
      if (!s || s === '/') return base || '/'
      if (s.startsWith('/')) return s.replace(/\/+/g, '/')
      const b = (base || '').replace(/\/$/, '')
      if (!b || b === '/') return `/${s}`.replace(/\/+/g, '/')
      return `${b}/${s}`.replace(/\/+/g, '/')
    },
    findSidebarPathByMetaTitle(routes, title, parentPath) {
      for (const route of routes || []) {
        if (route.hidden) continue
        const nextPath = this.joinSidebarRoutePath(parentPath, route.path)
        if (route.meta && route.meta.title === title) {
          return nextPath.startsWith('/') ? nextPath : `/${nextPath}`
        }
        if (route.children && route.children.length) {
          const baseForChildren = nextPath === '/' ? '' : nextPath
          const hit = this.findSidebarPathByMetaTitle(route.children, title, baseForChildren)
          if (hit) return hit
        }
      }
      return ''
    },
    resolveOutWarehouseApplyMenuPath() {
      const fromMenu = this.findSidebarPathByMetaTitle(this.sidebarRouters, '出库申请', '')
      return fromMenu || '/warehouse/outWarehouse/apply'
    },
    handleDeptApplyBillNoDblClick(applyBillNo) {
      if (!applyBillNo) return
      const path = this.resolveOutWarehouseApplyMenuPath()
      this.closeWarehouseReminder()
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('出库申请', path, { refBillNo: String(applyBillNo) })
      } else {
        this.$router.push({ path, query: { refBillNo: String(applyBillNo) } })
      }
    },
    formatReminderMoney(v) {
      const n = parseFloat(v)
      if (!Number.isFinite(n)) return '0.00'
      return n.toFixed(2)
    },
    /** 存在关联且已审核完成的出库单（以出库审核时间为准） */
    applyRowOutboundDone(row) {
      return !!(row && row.lastOutboundAuditDate)
    },
    /** 已出库满 24 小时不再展示（任意筛选下均隐藏） */
    shouldHideStaleOutboundRow(row) {
      if (!this.applyRowOutboundDone(row)) return false
      const t = new Date(row.lastOutboundAuditDate).getTime()
      if (!Number.isFinite(t)) return false
      return Date.now() - t >= 86400000
    },
    async loadWarehouseReminderDetails() {
      if (!this.showWarehouseBillBlock) {
        this.pendingApplyRows = []
        return
      }
      if (!this.showWarehouseApplyBlock) {
        this.pendingApplyRows = []
        return
      }
      this.applyOutboundStatusFilter = 'all'
      try {
        const res = await fetchHomeWarehouseReminderApplyList()
        const raw = res && res.data
        this.pendingApplyRows = Array.isArray(raw) ? raw : []
      } catch (e) {
        this.pendingApplyRows = []
      }
    },
    async loadWarehouseReminderCounts() {
      this.warehouseReminderLoading = true
      this.warehouseReminderError = ''
      try {
        const res = await fetchHomeWarehouseReminderCounts()
        const d = (res && res.data) || {}
        this.warehouseReminder = {
          apply: Number(d.pendingApplyBillCount) || 0,
          purchase: Number(d.pendingPurchaseBillCount) || 0
        }
        await this.loadWarehouseReminderDetails()
      } catch (e) {
        this.warehouseReminder = { apply: 0, purchase: 0 }
        this.pendingApplyRows = []
        this.warehouseReminderError = (e && e.message) ? String(e.message) : '加载失败，请稍后重试'
      } finally {
        this.warehouseReminderLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  min-height: calc(100vh - 50px);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.fixed-header + .app-main {
  padding-top: 50px;
}

.hasTagsView {
  .app-main {
    min-height: calc(100vh - 84px);
  }

  .fixed-header + .app-main {
    padding-top: 84px;
  }
}

.wh-reminder-local-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.wh-reminder-local-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.wh-reminder-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #ebeef5;
  min-height: 40px;
  flex-shrink: 0;
}

.wh-reminder-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.wh-reminder-close-btn {
  border: none;
  background: transparent;
}

.wh-reminder-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.wh-reminder-modal-body {
  flex: 1;
  padding: 0;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.wh-reminder-body-layout {
  display: flex;
  align-items: stretch;
  min-height: 0;
  height: 100%;
}

.wh-reminder-aside {
  flex: 0 0 200px;
  width: 200px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  box-sizing: border-box;
}

.wh-reminder-side-menu {
  padding: 8px 0 16px;
  user-select: none;
}

.wh-reminder-side-item {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.wh-reminder-side-item:hover {
  color: #409eff;
  background: #f5f7fa;
}

.wh-reminder-side-item.active {
  color: #409eff;
  font-weight: 500;
  background: #ecf5ff;
}

.wh-reminder-panel {
  flex: 1;
  min-width: 0;
  min-height: 120px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.wh-reminder-sub-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  margin: 0 0 20px;
  padding: 0;
  border-bottom: 1px solid #ebeef5;
  user-select: none;
}

.wh-reminder-sub-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  cursor: pointer;
  transition: color 0.2s;
}

.wh-reminder-sub-tab:hover {
  color: #409eff;
}

.wh-reminder-sub-tab.active {
  color: #409eff;
  font-weight: 500;
}

.wh-reminder-sub-tab.active::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -1px;
  height: 2px;
  background: #409eff;
}

.wh-reminder-sub-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  box-sizing: border-box;
}

.wh-reminder-panel-inner {
  max-width: 720px;
}

.wh-reminder-bill-layout {
  width: 100%;
  min-height: 120px;
}

.wh-reminder-bill-right {
  width: 100%;
  min-width: 0;
}

.wh-reminder-error--above-table {
  margin-bottom: 12px;
}

.wh-reminder-detail-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.wh-reminder-apply-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.wh-reminder-status-filter {
  width: 120px;
}

.wh-reminder-bill-no-link {
  cursor: pointer;
  color: #409eff;
  user-select: none;
}

.wh-reminder-detail-table {
  width: 100%;
}

.wh-reminder-placeholder .wh-reminder-line {
  color: #606266;
}

.wh-reminder-line {
  margin: 0 0 20px;
  font-size: 16px;
  color: #303133;
  line-height: 1.65;
}

.wh-reminder-label {
  color: #606266;
}

.wh-reminder-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.wh-reminder-error {
  margin: 8px 0 0;
  font-size: 14px;
  color: #f56c6c;
}

.wh-modal-fade-enter-active,
.wh-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.wh-modal-fade-enter,
.wh-modal-fade-leave-to {
  opacity: 0;
}

.wh-modal-zoom-enter-active,
.wh-modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.wh-modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.wh-modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style lang="scss">
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 6px;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background-color: #c0c0c0;
  border-radius: 3px;
}
</style>

<style lang="scss">
#app .main-container .app-main .wh-reminder-local-mask {
  left: -8px;
  right: -8px;
  width: auto;
}
</style>
