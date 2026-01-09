import request from '@/utils/request'

// 查询新品申购申请列表
export function listNewProductApply(query) {
  return request({
    url: '/department/newProductApply/list',
    method: 'get',
    params: query
  })
}

// 查询新品申购申请详细
export function getNewProductApply(id) {
  return request({
    url: '/department/newProductApply/' + id,
    method: 'get'
  })
}

// 新增新品申购申请
export function addNewProductApply(data) {
  return request({
    url: '/department/newProductApply',
    method: 'post',
    data: data
  })
}

// 修改新品申购申请
export function updateNewProductApply(data) {
  return request({
    url: '/department/newProductApply',
    method: 'put',
    data: data
  })
}

// 删除新品申购申请
export function delNewProductApply(id) {
  return request({
    url: '/department/newProductApply/' + id,
    method: 'delete'
  })
}

// 导出新品申购申请
export function exportNewProductApply(query) {
  return request({
    url: '/department/newProductApply/export',
    method: 'get',
    params: query
  })
}

