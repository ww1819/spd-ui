import request from '@/utils/request'

// 查询出库列表
export function listOutWarehouse(query) {
  return request({
    url: '/warehouse/outWarehouse/list',
    method: 'get',
    params: query
  })
}

// 查询出库详细
export function getOutWarehouse(id) {
  return request({
    url: '/warehouse/outWarehouse/' + id,
    method: 'get'
  })
}

// 新增出库
export function addOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/addOutWarehouse',
    method: 'post',
    data: data
  })
}

// 修改出库
export function updateOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/updateOutWarehouse',
    method: 'put',
    data: data
  })
}

// 删除出库
export function delOutWarehouse(id) {
  return request({
    url: '/warehouse/outWarehouse/' + id,
    method: 'delete'
  })
}

// 审核出库
export function auditOutWarehouse(data) {
  return request({
    url: '/warehouse/outWarehouse/auditOutWarehouse',
    method: 'put',
    data: data
  })
}

// 查询出退库列表
export function listCTKWarehouse(query) {
  return request({
    url: '/warehouse/rthWarehouse/CTKList',
    method: 'get',
    params: query
  })
}

// 查询出退库汇总列表
export function listCTKWarehouseSummary(query) {
  return request({
    url: '/warehouse/rthWarehouse/CTKListSummary',
    method: 'get',
    params: query
  })
}

// 采购汇总报表（按供应商）
export function listPurchaseSummaryBySupplier(query) {
  return request({
    url: '/warehouse/rthWarehouse/purchaseSummaryBySupplier',
    method: 'get',
    params: query
  })
}

// 耗材使用排名（出/退库按耗材汇总）
export function listMaterialUsageRank(query) {
  return request({
    url: '/warehouse/rthWarehouse/materialUsageRank',
    method: 'get',
    params: query
  })
}


export function createCkEntriesByRkApply(data) {
  return request({
    url: '/warehouse/outWarehouse/createCkEntriesByRkApply',
    method: 'get',
    params: data
  })
}

export function createCkEntriesByDApply(data) {
  return request({
    url: '/warehouse/outWarehouse/createCkEntriesByDApply',
    method: 'get',
    params: data
  })
}

/** 按仓库申请单 UUID7 生成出库明细 */
export function createCkEntriesByWhApply(data) {
  return request({
    url: '/warehouse/outWarehouse/createCkEntriesByWhApply',
    method: 'get',
    params: data
  })
}

/** 出库引用：仍有可出库数量的仓库申请单分页列表 */
export function listWhApplyForCk(query) {
  return request({
    url: '/warehouse/outWarehouse/whApplyListForCk',
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
