import request from '@/utils/request'

// 查询库存明细列表
export function listInventory(query) {
  return request({
    url: '/warehouse/inventory/list',
    method: 'get',
    params: query
  })
}

/** 库存分布分析：按维度 SQL 聚合 */
export function listInventoryDistribution(query) {
  return request({
    url: '/warehouse/inventory/listDistribution',
    method: 'get',
    params: query
  })
}

/** 盘点/弹窗对账：仅需登录，与 list 同源；支持 params.id 精确查一条（替代 GET /warehouse/inventory/:id）。 */
export function listInventoryPick(query) {
  return request({
    url: '/warehouse/inventory/pick/list',
    method: 'get',
    params: query
  })
}

/** 盘点保存对账：按库存主键批量返回 qty（避免拉全仓库存） */
export function listInventoryQtyByIds(ids) {
  const idStr = Array.isArray(ids) ? ids.filter(Boolean).join(',') : String(ids || '')
  return request({
    url: '/warehouse/inventory/pick/qty-by-ids',
    method: 'get',
    params: { ids: idStr },
    timeout: 60000
  })
}

/** 科室申领：全院按耗材聚合的可用库存（策略由后端 DepartmentApplyAvailableStockStrategy 决定） */
export function listDeptApplyAvailableStock(query) {
  return request({
    url: '/warehouse/inventory/listDeptApplyAvailableStock',
    method: 'get',
    params: query
  })
}

// 查询库存明细汇总列表
export function listInventorySummary(query) {
  return request({
    url: '/warehouse/inventory/listInventorySummary',
    method: 'get',
    params: query
  })
}

/** 按仓库+耗材 SQL 汇总数量（全量），用于仓库盘点盘盈弹窗「当前库存」（低权限 pick 接口） */
export function listInventoryStocktakingProfitQtySummary(query) {
  return request({
    url: '/warehouse/inventory/pick/stocktakingProfitQtySummary',
    method: 'get',
    params: query
  })
}

// 查询库存明细详细
export function getInventory(id) {
  return request({
    url: '/warehouse/inventory/' + id,
    method: 'get'
  })
}

// 按仓库筛选实时库存耗材
export function listInventoryMaterialAll(query) {
  return request({
    url: '/warehouse/inventory/listInventoryMaterialAll',
    method: 'get',
    params: query
  })
}

// 新增库存明细
export function addInventory(data) {
  return request({
    url: '/warehouse/inventory',
    method: 'post',
    data: data
  })
}

// 修改库存明细
export function updateInventory(data) {
  return request({
    url: '/warehouse/inventory',
    method: 'put',
    data: data
  })
}

// 删除库存明细
export function delInventory(id) {
  return request({
    url: '/warehouse/inventory/' + id,
    method: 'delete'
  })
}


// 盘点过滤库存明细列表
export function listPDFilter(query) {
  return request({
    url: '/warehouse/inventory/listPDFilter',
    method: 'get',
    params: query
  })
}

// 库存预警列表
export function listInventoryAlert(query) {
  return request({
    url: '/warehouse/inventory/listInventoryAlert',
    method: 'get',
    params: query
  })
}

// 有效期预警表列表
export function listExpiryAlert(query) {
  return request({
    url: '/warehouse/inventory/listExpiryAlert',
    method: 'get',
    params: query,
    // 不显示错误提示，直接返回空结果
    headers: {
      'hideError': true
    }
  }).catch(error => {
    // 捕获错误，返回空结果
    return Promise.resolve({
      code: 200,
      msg: '查询成功',
      rows: [],
      total: 0
    })
  })
}
