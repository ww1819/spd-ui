import request from '@/utils/request'

// 预览：上传文件解析，不落库
export function preview(file, warehouseId) {
  const formData = new FormData()
  formData.append('file', file)
  if (warehouseId != null) formData.append('warehouseId', warehouseId)
  return request({
    url: '/warehouse/initialStockImport/preview',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 确认导入：生成期初处理单
export function confirmImport(warehouseId, rows) {
  return request({
    url: '/warehouse/initialStockImport/confirmImport',
    method: 'post',
    data: { warehouseId, rows }
  })
}

// 期初单列表
export function listInitialImport(query) {
  return request({
    url: '/warehouse/initialStockImport/list',
    method: 'get',
    params: query
  })
}

// 期初单详情（含明细）
export function getInitialImport(id) {
  return request({
    url: '/warehouse/initialStockImport/' + id,
    method: 'get'
  })
}

// 审核期初单
export function auditInitialImport(id) {
  return request({
    url: '/warehouse/initialStockImport/audit/' + id,
    method: 'put'
  })
}

// 下载导入模板
export function importTemplate() {
  return request({
    url: '/warehouse/initialStockImport/importTemplate',
    method: 'post',
    responseType: 'blob'
  })
}
