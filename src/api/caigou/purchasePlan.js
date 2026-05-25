import request from '@/utils/request'

// 查询采购计划列表
export function listPurchasePlan(query) {
  return request({
    url: '/caigou/jihua/list',
    method: 'get',
    params: query
  })
}

// 查询采购计划详细
export function getPurchasePlan(id) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'get'
  })
}

/** 按仓库+耗材批量查询当前库存数量（明细「库存数量」列） */
export function getPlanEntryStockQty(warehouseId, materialIds) {
  return request({
    url: '/caigou/jihua/entryStockQty',
    method: 'get',
    params: {
      warehouseId,
      materialIds: Array.isArray(materialIds) ? materialIds.join(',') : materialIds
    }
  })
}

// 新增采购计划（可选 axios 配置，如 headers.repeatSubmit）
export function addPurchasePlan(data, axiosConfig) {
  return request({
    url: '/caigou/jihua',
    method: 'post',
    data: data,
    ...(axiosConfig || {})
  })
}

// 修改采购计划（可选 axios 配置）
export function updatePurchasePlan(data, axiosConfig) {
  return request({
    url: '/caigou/jihua',
    method: 'put',
    data: data,
    ...(axiosConfig || {})
  })
}

// 删除采购计划；restoreDepApplyPlanRefStatus=true 时删除后重算相关科室申购单的计划引用状态
export function delPurchasePlan(id, restoreDepApplyPlanRefStatus) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'delete',
    params: {
      restoreDepApplyPlanRefStatus: restoreDepApplyPlanRefStatus === true
    }
  })
}

// 审核采购计划
export function auditPurchasePlan(data) {
  return request({
    url: '/caigou/jihua/audit',
    method: 'put',
    data: data
  })
}

// 导出采购计划
export function exportPurchasePlan(query) {
  return request({
    url: '/caigou/jihua/export',
    method: 'post',
    params: query
  })
}

// 导出采购记录（年份月份耗材采购记录，列：物资名称、物资规格、数量、单位、供货单位、收货人、收货日期）
export function exportPurchaseRecord(params) {
  return request({
    url: '/caigou/jihua/exportPurchaseRecord',
    method: 'post',
    params: params
  })
}

// 根据采购计划明细ID查询关联的申购明细（科室申购单单号、申购科室、申购数量、制单人、制单时间、审核人、审核时间）
export function getApplyDetails(entryId) {
  return request({
    url: '/caigou/jihua/applyDetails',
    method: 'get',
    params: { entryId }
  })
}

// 根据采购计划ID查询关联的申购单号列表（表头引用申购单号弹窗用）
export function getApplyBillNoList(planId) {
  return request({
    url: '/caigou/jihua/applyBillNoList',
    method: 'get',
    params: { planId }
  })
}

// 根据采购计划ID查询关联的申购单表头列表（科室申购单号、仓库、制单人、制单时间、提交人、提交时间、审核人、审核时间）
export function getApplyBillHeaderList(planId) {
  return request({
    url: '/caigou/jihua/applyBillHeaderList',
    method: 'get',
    params: { planId }
  })
}

// 按仓库查询物资库存数量（materialIds 逗号分隔）
export function getMaterialStockQty(warehouseId, materialIds) {
  return request({
    url: '/caigou/jihua/materialStockQty',
    method: 'get',
    params: { warehouseId, materialIds }
  })
}
