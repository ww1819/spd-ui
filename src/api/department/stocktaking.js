import request from '@/utils/request'

// 查询科室盘点列表
export function listStocktaking(query) {
  return request({
    url: '/department/stocktaking/list',
    method: 'get',
    params: query
  })
}

/** 盘点导出明细行（JSON，前端按库存明细查询表同款样式写 xlsx） */
export function listStocktakingExportRows(query) {
  return request({
    url: '/department/stocktaking/export/rows',
    method: 'get',
    params: query
  })
}

// 查询科室盘点详细
export function getStocktaking(id) {
  return request({
    url: '/department/stocktaking/' + id,
    method: 'get'
  })
}

// 新增科室盘点
export function addStocktaking(data) {
  return request({
    url: '/department/stocktaking',
    method: 'post',
    data: data
  })
}

// 修改科室盘点（全量明细，追加新行等场景仍可用）
export function updateStocktaking(data) {
  return request({
    url: '/department/stocktaking',
    method: 'put',
    data: data
  })
}

/** 精简保存：主表 + 有变更的明细实盘/账面/已盘 */
export function patchSaveStocktaking(data) {
  return request({
    url: '/department/stocktaking/patch-save',
    method: 'put',
    data
  })
}

/** 向已存在的科室盘点单追加明细（新行，无明细 id），返回完整单据；body: { entries, expectedUpdateTime } */
export function appendDeptStocktakingEntries(billId, body) {
  return request({
    url: '/department/stocktaking/' + billId + '/entries',
    method: 'post',
    data: body
  })
}

/** 科室盘点：服务端按「已收货确认」科室库存生成并保存主单+明细，成功后返回完整单据 */
export function initDeptStocktakingFromInventory(data) {
  return request({
    url: '/department/stocktaking/init-from-inventory',
    method: 'post',
    data
  })
}

// 删除科室盘点
export function delStocktaking(id) {
  return request({
    url: '/department/stocktaking/' + id,
    method: 'delete'
  })
}

// 审核科室盘点（服务端逐条落科室库存/流水，明细多时可能超过默认 10s）
export function auditStocktaking(data) {
  return request({
    url: '/department/stocktaking/auditStocktaking',
    method: 'put',
    data: data,
    timeout: 120000
  })
}

/** 更新科室盘点明细「是否已盘」（未审核单） */
export function updateDeptStocktakingEntryCounted(data) {
  return request({
    url: '/department/stocktaking/entry/counted',
    method: 'put',
    data
  })
}
