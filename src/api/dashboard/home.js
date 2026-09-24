import request from '@/utils/request'

const DASHBOARD_TIMEOUT_MS = 120000

/** 首页仓库采购图（聚合，仅需登录） */
export function fetchHomeWarehousePurchase(year) {
  return request({
    url: '/dashboard/home/warehousePurchase',
    method: 'get',
    params: { year },
    timeout: DASHBOARD_TIMEOUT_MS,
    headers: { hideError: true }
  })
}

/** 首页科室使用图（聚合，仅需登录） */
export function fetchHomeDepartmentUsage(year) {
  return request({
    url: '/dashboard/home/departmentUsage',
    method: 'get',
    params: { year },
    timeout: DASHBOARD_TIMEOUT_MS,
    headers: { hideError: true }
  })
}

/** 首页今日统计（聚合，仅需登录） */
export function fetchHomeTodayStats(day) {
  return request({
    url: '/dashboard/home/todayStats',
    method: 'get',
    params: { day },
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 首页出库统计占比：当月出退库按财务分类汇总金额（仅需登录） */
export function fetchHomeOutboundFinanceCategoryProportion() {
  return request({
    url: '/dashboard/home/outboundFinanceCategoryProportion',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 首页入库统计占比：当月入退货按财务分类汇总金额（仅需登录） */
export function fetchHomeInboundFinanceCategoryProportion() {
  return request({
    url: '/dashboard/home/inboundFinanceCategoryProportion',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 仓库提醒：待审核申领单、待审核申购单单据数（聚合，仅需登录） */
export function fetchHomeWarehouseReminderCounts() {
  return request({
    url: '/dashboard/home/warehouseReminderCounts',
    method: 'get',
    timeout: 30000,
    headers: { hideError: true }
  })
}

/** 消息提醒：待出库申领单列表（含出库审核时间，仅需登录） */
export function fetchHomeWarehouseReminderApplyList() {
  return request({
    url: '/dashboard/home/warehouseReminderApplyList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：科室申购监控列表（含审核时间，仅需登录） */
export function fetchHomeWarehouseReminderPurchaseList() {
  return request({
    url: '/dashboard/home/warehouseReminderPurchaseList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：仓库库存近效期明细（有效期≤30天，仅需登录） */
export function fetchHomeWarehouseReminderNearExpiryList() {
  return request({
    url: '/dashboard/home/warehouseReminderNearExpiryList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：库存预警明细（与库存查询「库存预警」一致，仅需登录） */
export function fetchHomeWarehouseReminderInventoryAlertList() {
  return request({
    url: '/dashboard/home/warehouseReminderInventoryAlertList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：科室未收货确认的已审核出库单（billCount + bills，仅需登录） */
export function fetchHomeDepartmentReminderUnreceivedReceipt() {
  return request({
    url: '/dashboard/home/departmentReminderUnreceivedReceipt',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：科室近效期库存明细（lineCount + lines，仅需登录） */
export function fetchHomeDepartmentReminderNearExpiryList() {
  return request({
    url: '/dashboard/home/departmentReminderNearExpiryList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：科室库存预警明细（lineCount + lines，仅需登录） */
export function fetchHomeDepartmentReminderInventoryAlertList() {
  return request({
    url: '/dashboard/home/departmentReminderInventoryAlertList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 消息提醒：科室销提醒（lineCount + lines，仅需登录） */
export function fetchHomeDepartmentReminderConsumeList() {
  return request({
    url: '/dashboard/home/departmentReminderConsumeList',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

export function fetchHomePref() {
  return request({
    url: '/dashboard/home/pref',
    method: 'get',
    headers: { hideError: true }
  })
}

export function saveHomePref(homeView) {
  return request({
    url: '/dashboard/home/pref',
    method: 'put',
    data: { homeView },
    headers: { hideError: true }
  })
}

export function reportMenuHit(data) {
  return request({
    url: '/dashboard/home/menuHit',
    method: 'post',
    data,
    headers: { hideError: true }
  })
}

export function fetchFrequentMenus(limit) {
  return request({
    url: '/dashboard/home/frequentMenus',
    method: 'get',
    params: { limit: limit || 8 },
    headers: { hideError: true }
  })
}

/** 采购首页顶部指标 */
export function fetchPurchaseHomeStats() {
  return request({
    url: '/dashboard/home/purchaseHomeStats',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 库房首页顶部指标 */
export function fetchWarehouseHomeStats() {
  return request({
    url: '/dashboard/home/warehouseHomeStats',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

/** 科室首页顶部指标 */
export function fetchDepartmentHomeStats() {
  return request({
    url: '/dashboard/home/departmentHomeStats',
    method: 'get',
    timeout: 60000,
    headers: { hideError: true }
  })
}

export function fetchHomeKpiTrend(days) {
  return request({
    url: '/dashboard/home/kpiTrend',
    method: 'get',
    params: { days: days || 7 },
    timeout: 60000,
    headers: { hideError: true }
  })
}

export function fetchHomeDepartmentReminderCounts() {
  return request({
    url: '/dashboard/home/departmentReminderCounts',
    method: 'get',
    timeout: 30000,
    headers: { hideError: true }
  })
}
