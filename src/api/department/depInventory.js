import request from '@/utils/request'

// 查询科室库存列表
export function listInventory(query) {
  return request({
    url: '/department/inventory/list',
    method: 'get',
    params: query
  })
}

/** 选库存明细弹窗等：仅需登录，数据范围与 list 一致，避免无 department:depInventory:list 时 403。
 *  支持 params：含 id 时按主键精确查一条（盘点保存前对账等，替代 GET /department/inventory/:id 的 query 权限）。 */
export function listInventoryPick(query) {
  return request({
    url: '/department/inventory/pick/list',
    method: 'get',
    params: query
  })
}

/** 按科室+耗材 SQL 汇总数量（全量），用于盘点盘盈弹窗「当前库存」等，避免前端分页累加 */
export function listInventoryPickSummary(query) {
  return request({
    url: '/department/inventory/pick/summary',
    method: 'get',
    params: query
  })
}

// 查询科室库存详细
export function getInventory(id) {
  return request({
    url: '/department/inventory/' + id,
    method: 'get'
  })
}

// 新增科室库存
export function addInventory(data) {
  return request({
    url: '/department/inventory',
    method: 'post',
    data: data
  })
}

// 修改科室库存
export function updateInventory(data) {
  return request({
    url: '/department/inventory',
    method: 'put',
    data: data
  })
}

// 删除科室库存
export function delInventory(id) {
  return request({
    url: '/department/inventory/' + id,
    method: 'delete'
  })
}

// 查询库存汇总列表
export function listInventorySummary(query) {
  return request({
    url: '/department/inventory/summary',
    method: 'get',
    params: query
  })
}

// 查询科室进销存明细列表
export function listDepartmentInOutDetail(query) {
  return request({
    url: '/department/inventory/inout',
    method: 'get',
    params: query
  })
}