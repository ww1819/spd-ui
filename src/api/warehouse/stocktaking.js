import request from '@/utils/request'

// 查询盘点列表
export function listStocktaking(query) {
  return request({
    url: '/stocktaking/in/list',
    method: 'get',
    params: query
  })
}

// 查询盘点详细
export function getStocktaking(id) {
  return request({
    url: '/stocktaking/in/' + id,
    method: 'get'
  })
}

// 新增盘点
export function addStocktaking(data) {
  return request({
    url: '/stocktaking/in',
    method: 'post',
    data: data
  })
}

// 修改盘点
export function updateStocktaking(data) {
  return request({
    url: '/stocktaking/in',
    method: 'put',
    data: data
  })
}

/** 向已存在的仓库盘点单追加明细（新行无明细 id），返回完整单据 */
export function appendStocktakingEntries(billId, entries) {
  return request({
    url: '/stocktaking/in/' + billId + '/entries',
    method: 'post',
    data: entries
  })
}

// 删除盘点
export function delStocktaking(id) {
  return request({
    url: '/stocktaking/in/' + id,
    method: 'delete'
  })
}

// 审核盘点（可传 qtyAdjustList：账面与仓库实物不一致时逐条确认后的盘点数量）
export function auditStocktaking(data) {
  return request({
    url: '/stocktaking/in/auditStocktaking',
    method: 'put',
    data: data
  })
}

/** 审核前校验：仓库盘点明细 qty 与当前 stk_inventory 是否一致（仅 stock_type=501 有差异行） */
export function checkStocktakingQty(data) {
  return request({
    url: '/stocktaking/in/auditStocktaking/checkQty',
    method: 'post',
    data: data
  })
}

/** 更新盘点明细「是否已盘」（未审核单） */
export function updateStocktakingEntryCounted(data) {
  return request({
    url: '/stocktaking/in/entry/counted',
    method: 'put',
    data
  })
}
