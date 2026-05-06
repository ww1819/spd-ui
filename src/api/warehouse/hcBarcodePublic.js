import request from '@/utils/request'

/** 条码归属主档分页 */
export function listHcBarcodeOwnership(query) {
  return request({
    url: '/hc/barcode/public/ownership/list',
    method: 'get',
    params: query
  })
}

/** 条码归属详情 */
export function getHcBarcodeOwnership(id) {
  return request({
    url: '/hc/barcode/public/ownership/' + id,
    method: 'get'
  })
}

/** 条码流通流水分页 */
export function listHcBarcodeCirculation(query) {
  return request({
    url: '/hc/barcode/public/circulation/list',
    method: 'get',
    params: query
  })
}

/** 导出条码归属 */
export function exportHcBarcodeOwnership(query) {
  return request({
    url: '/hc/barcode/public/ownership/export',
    method: 'post',
    params: query
  })
}

/** 导出条码流通 */
export function exportHcBarcodeCirculation(query) {
  return request({
    url: '/hc/barcode/public/circulation/export',
    method: 'post',
    params: query
  })
}
