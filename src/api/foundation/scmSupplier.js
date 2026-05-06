import request from '@/utils/request'

/** 当前租户医院在平台可见的供应商列表 */
export function listScmSupplierPlatform() {
  return request({
    url: '/foundation/scmSupplier/scmList',
    method: 'get'
  })
}

/** 平台供应商档案（前置机聚合） */
export function getScmSupplierProfile(scmSupplierCode) {
  return request({
    url: '/foundation/scmSupplier/profile/' + encodeURIComponent(scmSupplierCode),
    method: 'get'
  })
}

/** 院内供应商 + 平台档案 */
export function getScmSupplierLinked(spdSupplierId) {
  return request({
    url: '/foundation/scmSupplier/linked/' + spdSupplierId,
    method: 'get'
  })
}

/** 用平台数据补全院内供应商 */
export function mergeScmToFdSupplier(data) {
  return request({
    url: '/foundation/scmSupplier/merge',
    method: 'post',
    data
  })
}

/** 下载平台供应商 JSON（FULL / LIMITED 由后端判定） */
export function exportScmSupplierJson(spdSupplierId) {
  return request({
    url: '/foundation/scmSupplier/export/' + spdSupplierId,
    method: 'get',
    responseType: 'blob'
  })
}
