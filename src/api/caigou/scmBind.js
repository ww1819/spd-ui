import request from '@/utils/request'

/** 绑定表 del_flag：0 正常，1 删除（与后端 spd_scm_* 表一致） */

/** 当前租户云平台医院编码绑定 */
export function getTenantScmBind() {
  return request({
    url: '/caigou/scmBind/tenant',
    method: 'get'
  })
}

export function saveTenantScmBind(data) {
  return request({
    url: '/caigou/scmBind/tenant',
    method: 'put',
    data
  })
}

/** 当前租户下全部供应商编码绑定 */
export function listSupplierScmBind() {
  return request({
    url: '/caigou/scmBind/supplier/list',
    method: 'get'
  })
}

export function getSupplierScmBind(supplierId) {
  return request({
    url: '/caigou/scmBind/supplier/' + supplierId,
    method: 'get'
  })
}

export function saveSupplierScmBind(data) {
  return request({
    url: '/caigou/scmBind/supplier',
    method: 'put',
    data
  })
}
