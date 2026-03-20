import request from '@/utils/request'

// 查询厂家维护列表
export function listFactory(query) {
  return request({
    url: '/foundation/factory/list',
    method: 'get',
    params: query
  })
}

// 查询厂家维护列表
export function listFactoryAll(query) {
  return request({
    url: '/foundation/factory/listAll',
    method: 'get',
    params: query
  })
}

// 查询厂家维护详细
export function getFactory(factoryId) {
  return request({
    url: '/foundation/factory/' + factoryId,
    method: 'get'
  })
}

// 新增厂家维护
export function addFactory(data) {
  return request({
    url: '/foundation/factory',
    method: 'post',
    data: data
  })
}

// 修改厂家维护
export function updateFactory(data) {
  return request({
    url: '/foundation/factory',
    method: 'put',
    data: data
  })
}

// 删除厂家维护
export function delFactory(factoryId) {
  return request({
    url: '/foundation/factory/' + factoryId,
    method: 'delete'
  })
}

// 批量更新厂家简码
export function updateFactoryReferred(ids) {
  return request({
    url: '/foundation/factory/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 生产厂家变更记录 */
export function listFactoryChangeLog(factoryId) {
  return request({
    url: '/foundation/factory/changeLog/' + factoryId,
    method: 'get'
  })
}

/** 生产厂家导入：仅校验 */
export function validateFactoryImport(file, updateSupport) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/factory/importValidate?updateSupport=' + !!updateSupport,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

/** 生产厂家导入：confirm=true 落库 */
export function importFactoryData(file, updateSupport, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/factory/importData?updateSupport=' + !!updateSupport + '&confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
