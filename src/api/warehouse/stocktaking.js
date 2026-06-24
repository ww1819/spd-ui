import request from '@/utils/request'

// 查询盘点列表
export function listStocktaking(query) {
  return request({
    url: '/stocktaking/in/list',
    method: 'get',
    params: query
  })
}

/** 仓库盘点导出明细行（JSON，前端按出退库明细表同款样式写 xlsx） */
export function listWhStocktakingExportRows(query) {
  return request({
    url: '/stocktaking/in/export/rows',
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
    data: data,
    timeout: 120000
  })
}

// 修改盘点
export function updateStocktaking(data) {
  return request({
    url: '/stocktaking/in',
    method: 'put',
    data: data,
    timeout: 120000
  })
}

/** 精简保存：主表 + 有变更的明细实盘/账面/已盘 */
export function patchSaveStocktaking(data) {
  return request({
    url: '/stocktaking/in/patch-save',
    method: 'put',
    data,
    timeout: 120000
  })
}

/** 向已存在的仓库盘点单追加明细（新行无明细 id），返回完整单据；body: { entries, expectedUpdateTime } */
export function appendStocktakingEntries(billId, body) {
  return request({
    url: '/stocktaking/in/' + billId + '/entries',
    method: 'post',
    data: body,
    timeout: 120000
  })
}

/** 仓库盘点：服务端按仓库库存生成并保存主单+明细，成功后返回完整单据 */
export function initWarehouseStocktakingFromInventory(data) {
  return request({
    url: '/stocktaking/in/init-from-inventory',
    method: 'post',
    data
  })
}

// 删除盘点
export function delStocktaking(id) {
  return request({
    url: '/stocktaking/in/' + id,
    method: 'delete'
  })
}

// 审核盘点（可传 qtyAdjustList；501 会逐条对齐库存并写明细，明细多时可能超过默认 10s）
export function auditStocktaking(data) {
  return request({
    url: '/stocktaking/in/auditStocktaking',
    method: 'put',
    data: data,
    timeout: 120000
  })
}

/** 审核前校验：仓库盘点明细 qty 与当前 stk_inventory 是否一致（仅 stock_type=501 有差异行） */
export function checkStocktakingQty(data) {
  return request({
    url: '/stocktaking/in/auditStocktaking/checkQty',
    method: 'post',
    data: data,
    timeout: 120000
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

/** 盘盈明细导入：预览 */
export function previewWhStocktakingProfitImport(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/stocktaking/in/profit-import/preview',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  })
}

/** 盘盈明细导入：确认生成盘点单 */
export function confirmWhStocktakingProfitImport(rows) {
  return request({
    url: '/stocktaking/in/profit-import/confirm',
    method: 'post',
    data: { rows },
    timeout: 120000
  })
}

/** 下载盘盈明细导入模板 */
export function downloadWhStocktakingProfitImportTemplate() {
  return request({
    url: '/stocktaking/in/profit-import/importTemplate',
    method: 'post',
    responseType: 'blob'
  })
}
