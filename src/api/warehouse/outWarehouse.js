import request from '@/utils/request'

/** 按仓库+耗材批量查询当前库存数量（出库明细「库存数量」列） */
export function getOutWarehouseMaterialStockQty(warehouseId, materialIds) {
  return request({
    url: '/warehouse/outWarehouse/materialStockQty',
    method: 'get',
    params: {
      warehouseId,
      materialIds: Array.isArray(materialIds) ? materialIds.join(',') : materialIds
    }
  })
}

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

// 记录出库单打印
export function recordOutWarehousePrint(id) {
  return request({
    url: '/warehouse/outWarehouse/recordPrint/' + id,
    method: 'put'
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

/** 出库引用：科室申购单分页列表（按引用状态页签） */
export function listDepPurchaseApplyForCk(query) {
  return request({
    url: '/warehouse/outWarehouse/depPurchaseApplyListForCk',
    method: 'get',
    params: query
  })
}

/** 按科室申购单生成出库明细 */
export function createCkEntriesByDepPurchaseApply(data) {
  return request({
    url: '/warehouse/outWarehouse/createCkEntriesByDepPurchaseApply',
    method: 'get',
    params: data
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
