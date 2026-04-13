import request from '@/utils/request'

export function listWhWarehouseApply(query) {
  return request({
    url: '/department/whWarehouseApply/list',
    method: 'get',
    params: query
  })
}

export function getWhWarehouseApply(id) {
  return request({
    url: '/department/whWarehouseApply/' + id,
    method: 'get'
  })
}

/** 列表是否包含已整单作废：query.includeVoidWhole = true */
export function voidWhWarehouseApplyWhole(data) {
  return request({
    url: '/department/whWarehouseApply/voidWhole',
    method: 'post',
    data
  })
}

/** data: { whApplyId, entryId, voidQty, reason } */
export function voidWhWarehouseApplyEntry(data) {
  return request({
    url: '/department/whWarehouseApply/voidEntry',
    method: 'post',
    data
  })
}
