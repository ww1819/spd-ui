import request from '@/utils/request'

// 查询定数监测列表
export function listFixedNumber(query) {
  return request({
    url: '/monitoring/fixedNumber/list',
    method: 'get',
    params: query
  })
}

/** 定数监测新增/维护明细：分页查询可选产品档案（POST body，含 excludeMaterialIds；不按仓库定数 EXISTS 收窄） */
export function listFixedNumberMaterialDetailPick(data) {
  return request({
    url: '/monitoring/fixedNumber/materialDetailPick',
    method: 'post',
    data
  })
}

// 科室申购新增明细专用：查询仓库的定数检测数据（不依赖产品档案 list 权限）
export function listFixedNumberForPurchase(query) {
  return request({
    url: '/monitoring/fixedNumber/listForPurchase',
    method: 'get',
    params: query
  })
}

// 查询定数监测详细
export function getFixedNumber(id) {
  return request({
    url: '/monitoring/fixedNumber/' + id,
    method: 'get'
  })
}

// 新增定数监测（明细可能很多，必须用 POST body 传参，避免 414 URI 过长）
export function addFixedNumber(data) {
  return request({
    url: '/monitoring/fixedNumber',
    method: 'post',
    params: {}, // 明确不往 URL 塞参数，防止被拼成 GET 导致 414
    data: data,
    timeout: 60000, // 明细多时适当延长超时
    // 明细批量保存易触发「1s 内重复提交」误判；403 等由页面统一弹窗，避免与全局 Notification 重复
    headers: { repeatSubmit: false, hideError: true }
  })
}

// 修改定数监测
export function updateFixedNumber(data) {
  return request({
    url: '/monitoring/fixedNumber',
    method: 'put',
    data: data
  })
}

// 删除定数监测
export function delFixedNumber(id) {
  return request({
    url: '/monitoring/fixedNumber/' + id,
    method: 'delete'
  })
}

// 批量删除定数监测
export function delFixedNumberBatch(ids) {
  return request({
    url: '/monitoring/fixedNumber/batchDelete',
    method: 'post',
    data: { ids }
  })
}

// 导出定数监测
export function exportFixedNumber(query) {
  return request({
    url: '/monitoring/fixedNumber/export',
    method: 'get',
    params: query
  })
}

