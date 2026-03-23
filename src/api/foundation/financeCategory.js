import request from '@/utils/request'

// 查询财务分类维护列表
export function listFinanceCategory(query) {
  return request({
    url: '/foundation/financeCategory/list',
    method: 'get',
    params: query
  })
}

// 查询所有财务分类维护列表
export function listFinanceCategoryAll(query) {
  return request({
    url: '/foundation/financeCategory/listAll',
    method: 'get',
    params: query
  })
}

// 查询财务分类维护详细
export function getFinanceCategory(financeCategoryId) {
  return request({
    url: '/foundation/financeCategory/' + financeCategoryId,
    method: 'get'
  })
}

// 新增财务分类维护
export function addFinanceCategory(data) {
  return request({
    url: '/foundation/financeCategory',
    method: 'post',
    data: data
  })
}

// 修改财务分类维护
export function updateFinanceCategory(data) {
  return request({
    url: '/foundation/financeCategory',
    method: 'put',
    data: data
  })
}

// 删除财务分类维护
export function delFinanceCategory(financeCategoryId) {
  return request({
    url: '/foundation/financeCategory/' + financeCategoryId,
    method: 'delete'
  })
}

// 批量更新财务分类名称简码
export function updateFinanceCategoryReferred(ids) {
  return request({
    url: '/foundation/financeCategory/updateReferred',
    method: 'post',
    data: { ids }
  })
}

/** 财务分类导入：仅校验 */
export function validateFinanceCategoryImport(file, updateSupport) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importValidate?updateSupport=' + !!updateSupport,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}

/** 财务分类导入：confirm=true 落库 */
export function importFinanceCategoryData(file, updateSupport, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importData?updateSupport=' + !!updateSupport + '&confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}


export function validateFinanceCategoryImportAdd(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importAddValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importFinanceCategoryAddData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importAddData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function validateFinanceCategoryImportUpdate(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importUpdateValidate',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function importFinanceCategoryUpdateData(file, confirm) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/foundation/financeCategory/importUpdateData?confirm=' + !!confirm,
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false }
  })
}
export function downloadFinanceCategoryImportAddTemplate(){return request({url:'/foundation/financeCategory/importAddTemplate',method:'post',responseType:'blob'})}
export function downloadFinanceCategoryImportUpdateTemplate(){return request({url:'/foundation/financeCategory/importUpdateTemplate',method:'post',responseType:'blob'})}
