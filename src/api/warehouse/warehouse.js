import request from '@/utils/request'

// 按科室汇总当月出退库金额与数量（数据可视化大屏：科室领用排名、高值消耗图等）
export function outboundSummaryByDepartment() {
  return request({
    url: '/warehouse/warehouse/outboundSummaryByDepartment',
    method: 'get'
  })
}

/** 数据可视化大屏：验收/出库/消耗 金额与数量合计（当前租户） */
export function biScreenConsumablesTotals() {
  return request({
    url: '/warehouse/warehouse/biScreenConsumablesTotals',
    method: 'get'
  })
}

/** 数据可视化大屏：本月送货入库前十供应商（按配送金额合计降序） */
export function biScreenInboundSupplierTop10() {
  return request({
    url: '/warehouse/warehouse/biScreenInboundSupplierTop10',
    method: 'get'
  })
}

/** 数据可视化大屏：近 20 天入退货按日汇总金额（高值/低值耗材，折线+柱图） */
export function biScreenInboundDailyHighLowValue() {
  return request({
    url: '/warehouse/warehouse/biScreenInboundDailyHighLowValue',
    method: 'get'
  })
}

/** 数据可视化大屏：当月出退库按耗材汇总金额 TOP20（耗材排行榜） */
export function biScreenOutboundMaterialMonthTop() {
  return request({
    url: '/warehouse/warehouse/biScreenOutboundMaterialMonthTop',
    method: 'get'
  })
}

/** 数据可视化大屏：当月入退货按财务分类汇总入库金额（玫瑰饼图/圆环图） */
export function biScreenInboundFinanceCategoryMonth() {
  return request({
    url: '/warehouse/warehouse/biScreenInboundFinanceCategoryMonth',
    method: 'get'
  })
}

/** 数据可视化大屏：今日已审核出库单笔数、今日已审核入库单(101)笔数 */
export function biScreenTodayInboundOutboundBillCount() {
  return request({
    url: '/warehouse/warehouse/biScreenTodayInboundOutboundBillCount',
    method: 'get'
  })
}

/** 数据可视化大屏：当年按自然月汇总入库金额(101)、退货入库金额(301)（年度采购/入退货曲线） */
export function biScreenYearInboundReturnByMonth() {
  return request({
    url: '/warehouse/warehouse/biScreenYearInboundReturnByMonth',
    method: 'get'
  })
}

// 查询入库列表
export function listWarehouse(query) {
  return request({
    url: '/warehouse/warehouse/list',
    method: 'get',
    params: query
  })
}

// 查询入库详细
export function getInWarehouse(id) {
  return request({
    url: '/warehouse/warehouse/' + id,
    method: 'get'
  })
}

// 记录入库单打印
export function recordInWarehousePrint(id) {
  return request({
    url: '/warehouse/warehouse/recordPrint/' + id,
    method: 'put'
  })
}

// 新增入库
export function addWarehouse(data) {
  return request({
    url: '/warehouse/warehouse',
    method: 'post',
    data: data
  })
}

// 修改入库
export function updateWarehouse(data) {
  return request({
    url: '/warehouse/warehouse',
    method: 'put',
    data: data
  })
}

// 删除入库
export function delWarehouse(id) {
  return request({
    url: '/warehouse/warehouse/' + id,
    method: 'delete'
  })
}

// 审核入库
export function auditWarehouse(data) {
  return request({
    url: '/warehouse/warehouse/auditWarehouse',
    method: 'put',
    data: data
  })
}

// 查询入退货明细列表
export function listRTHWarehouse(query) {
  return request({
    url: '/warehouse/rthWarehouse/RTHList',
    method: 'get',
    params: query
  })
}

// 查询入退货汇总列表
export function listRTHSummary(query) {
  return request({
    url: '/warehouse/rthWarehouse/listRTHSummary',
    method: 'get',
    params: query
  })
}

// 引用订单生成单据明细
export function createRkEntriesByDingdan(query) {
  return request({
    url: '/warehouse/warehouse/createRkEntriesByDingdan',
    method: 'get',
    params: query
  })
}

// 查询配送单（支持配送单号/输入码关键字）
export function queryZsDelivery(query) {
  return request({
    url: '/warehouse/warehouse/queryZsDelivery',
    method: 'get',
    params: query
  })
}

// 引用配送单生成入库明细（后端统一调用供应链接口）
export function createRkEntriesByDeliveryNo(query) {
  return request({
    url: '/warehouse/warehouse/createRkEntriesByDeliveryNo',
    method: 'get',
    params: query
  })
}

// 查询单据明细变更记录
export function listEntryChangeLog(billType, billId) {
  return request({
    url: '/gz/changeLog/list',
    method: 'get',
    params: { billType, billId }
  })
}

