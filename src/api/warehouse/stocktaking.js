import request from '@/utils/request'

// 查询盘点列表
export function listStocktaking(query) {
  return request({
    url: '/stocktaking/in/list',
    method: 'get',
    params: query
  })
}

// 查询盘点详细
export function getStocktaking(id) {
  return request({
    url: '/stocktaking/in/' + id,
    method: 'get'
  })
}

// 新增盘点
export function addStocktaking(data) {
  return request({
    url: '/stocktaking/in',
    method: 'post',
    data: data
  })
}

// 修改盘点
export function updateStocktaking(data) {
  return request({
    url: '/stocktaking/in',
    method: 'put',
    data: data
  })
}

// 删除盘点
export function delStocktaking(id) {
  return request({
    url: '/stocktaking/in/' + id,
    method: 'delete'
  })
}

// 审核盘点
export function auditStocktaking(data) {
  return request({
    url: '/stocktaking/in/auditStocktaking',
    method: 'put',
    data: data
  })
}
