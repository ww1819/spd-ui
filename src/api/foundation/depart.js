import request from '@/utils/request'

// 查询科室列表
export function listdepart(query) {
  return request({
    url: '/foundation/depart/list',
    method: 'get',
    params: query
  })
}

/** 科室维护左侧树（根节点为客户名） */
export function departTree() {
  return request({
    url: '/foundation/depart/tree',
    method: 'get'
  })
}

// 查询所有科室列表
export function listdepartAll(userId) {
  // 确保 userId 是有效的
  if (!userId) {
    return Promise.reject(new Error('userId 不能为空'));
  }
  // 确保 userId 是字符串或数字
  const userIdStr = String(userId).trim();
  if (!userIdStr || userIdStr === 'undefined' || userIdStr === 'null') {
    return Promise.reject(new Error('userId 无效: ' + userIdStr));
  }
  return request({
    url: '/foundation/depart/listAll/' + userIdStr,
    method: 'get'
  })
}

// 查询科室详细
export function getdepart(id) {
  return request({
    url: '/foundation/depart/' + id,
    method: 'get'
  })
}

// 新增科室
export function adddepart(data) {
  return request({
    url: '/foundation/depart',
    method: 'post',
    data: data
  })
}

// 修改科室
export function updatedepart(data) {
  return request({
    url: '/foundation/depart',
    method: 'put',
    data: data
  })
}

// 删除科室
export function deldepart(id) {
  return request({
    url: '/foundation/depart/' + id,
    method: 'delete'
  })
}

// 批量更新科室名称简码
export function updateDepartReferred(ids) {
  return request({
    url: '/foundation/depart/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 科室导入：仅校验（不落库） */
export function validateDepartImport(file, updateSupport) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importValidate?updateSupport=' + !!updateSupport,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

/** 科室变更记录 */
export function listDepartmentChangeLog(deptId) {
  return request({
    url: '/foundation/depart/changeLog/' + deptId,
    method: 'get'
  })
}

/** 科室导入：confirm=true 时落库（须先校验通过） */
export function importDepartData(file, updateSupport, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importData?updateSupport=' + !!updateSupport + '&confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}


export function validateDepartImportAdd(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importAddValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importDepartAddData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importAddData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function validateDepartImportUpdate(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importUpdateValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importDepartUpdateData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/depart/importUpdateData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function downloadDepartImportAddTemplate(){return request({url:'/foundation/depart/importAddTemplate',method:'post',responseType:'blob'})}
export function downloadDepartImportUpdateTemplate(){return request({url:'/foundation/depart/importUpdateTemplate',method:'post',responseType:'blob'})}
