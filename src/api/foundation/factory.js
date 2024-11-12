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
