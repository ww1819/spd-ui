import request from '@/utils/request'

// 查询供应商列表
export function listSupplier(query) {
  return request({
    url: '/foundation/supplier/list',
    method: 'get',
    params: query
  })
}

// 查询所有供应商列表
export function listSupplierAll(query) {
  return request({
    url: '/foundation/supplier/listAll',
    method: 'get',
    params: query
  })
}

// 查询供应商详细
export function getSupplier(id) {
  return request({
    url: '/foundation/supplier/' + id,
    method: 'get'
  })
}

// 新增供应商
export function addSupplier(data) {
  return request({
    url: '/foundation/supplier',
    method: 'post',
    data: data
  })
}

// 修改供应商
export function updateSupplier(data) {
  return request({
    url: '/foundation/supplier',
    method: 'put',
    data: data
  })
}

// 删除供应商
export function delSupplier(id) {
  return request({
    url: '/foundation/supplier/' + id,
    method: 'delete'
  })
}

// 批量更新供应商名称简码
export function updateSupplierReferred(ids) {
  return request({
    url: '/foundation/supplier/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 供应商变更记录 */
export function listSupplierChangeLog(supplierId) {
  return request({
    url: '/foundation/supplier/changeLog/' + supplierId,
    method: 'get'
  })
}

/** 供应商导入：仅校验 */
export function validateSupplierImport(file, updateSupport) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importValidate?updateSupport=' + !!updateSupport,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

/** 供应商导入：confirm=true 落库 */
export function importSupplierData(file, updateSupport, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importData?updateSupport=' + !!updateSupport + '&confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}


export function validateSupplierImportAdd(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importAddValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

export function importSupplierAddData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importAddData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

export function validateSupplierImportUpdate(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importUpdateValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

export function importSupplierUpdateData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/supplier/importUpdateData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function downloadSupplierImportAddTemplate(){return request({url:'/foundation/supplier/importAddTemplate',method:'post',responseType:'blob'})}
export function downloadSupplierImportUpdateTemplate(){return request({url:'/foundation/supplier/importUpdateTemplate',method:'post',responseType:'blob'})}
