import request from '@/utils/request'

// 查询科室盘点列表
export function listStocktaking(query) {
  return request({
    url: '/department/stocktaking/list',
    method: 'get',
    params: query
  })
}

// 查询科室盘点详细
export function getStocktaking(id) {
  return request({
    url: '/department/stocktaking/' + id,
    method: 'get'
  })
}

// 新增科室盘点
export function addStocktaking(data) {
  return request({
    url: '/department/stocktaking',
    method: 'post',
    data: data
  })
}

// 修改科室盘点
export function updateStocktaking(data) {
  return request({
    url: '/department/stocktaking',
    method: 'put',
    data: data
  })
}

// 删除科室盘点
export function delStocktaking(id) {
  return request({
    url: '/department/stocktaking/' + id,
    method: 'delete'
  })
}

// 审核科室盘点
export function auditStocktaking(data) {
  return request({
    url: '/department/stocktaking/auditStocktaking',
    method: 'put',
    data: data
  })
}
