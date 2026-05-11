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
