import request from '@/utils/request'

// 查询库房分类列表
export function listWarehouseCategory(query) {
  return request({
    url: '/foundation/warehouseCategory/list',
    method: 'get',
    params: query
  })
}

// 查询库房分类列表
export function listWarehouseCategoryAll(query) {
  return request({
    url: '/foundation/warehouseCategory/listAll',
    method: 'get',
    params: query
  })
}

// 查询库房分类树形列表
export function treeselect() {
  return request({
    url: '/foundation/warehouseCategory/treeselect',
    method: 'get'
  })
}

// 查询库房分类详细
export function getWarehouseCategory(warehouseCategoryId) {
  return request({
    url: '/foundation/warehouseCategory/' + warehouseCategoryId,
    method: 'get'
  })
}

// 新增库房分类
export function addWarehouseCategory(data) {
  return request({
    url: '/foundation/warehouseCategory',
    method: 'post',
    data: data
  })
}

// 修改库房分类
export function updateWarehouseCategory(data) {
  return request({
    url: '/foundation/warehouseCategory',
    method: 'put',
    data: data
  })
}

// 删除库房分类
export function delWarehouseCategory(warehouseCategoryId) {
  return request({
    url: '/foundation/warehouseCategory/' + warehouseCategoryId,
    method: 'delete'
  })
}

// 批量更新库房分类名称简码
export function updateWarehouseCategoryReferred(ids) {
  return request({
    url: '/foundation/warehouseCategory/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 库房分类导入：仅校验 */
export function validateWarehouseCategoryImport(file, updateSupport) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importValidate?updateSupport=' + !!updateSupport,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

/** 库房分类导入：confirm=true 落库 */
export function importWarehouseCategoryData(file, updateSupport, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importData?updateSupport=' + !!updateSupport + '&confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}


export function validateWarehouseCategoryImportAdd(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importAddValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importWarehouseCategoryAddData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importAddData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function validateWarehouseCategoryImportUpdate(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importUpdateValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importWarehouseCategoryUpdateData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/warehouseCategory/importUpdateData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function downloadWarehouseCategoryImportAddTemplate(){return request({url:'/foundation/warehouseCategory/importAddTemplate',method:'post',responseType:'blob'})}
export function downloadWarehouseCategoryImportUpdateTemplate(){return request({url:'/foundation/warehouseCategory/importUpdateTemplate',method:'post',responseType:'blob'})}
