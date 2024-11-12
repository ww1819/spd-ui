import request from '@/utils/request'

// 查询单位明细列表
export function listUnit(query) {
  return request({
    url: '/foundation/unit/list',
    method: 'get',
    params: query
  })
}

// 查询所有单位明细列表
export function listUnitAll(query) {
  return request({
    url: '/foundation/unit/listUnitAll',
    method: 'get',
    params: query
  })
}

// 查询单位明细详细
export function getUnit(unitId) {
  return request({
    url: '/foundation/unit/' + unitId,
    method: 'get'
  })
}

// 新增单位明细
export function addUnit(data) {
  return request({
    url: '/foundation/unit',
    method: 'post',
    data: data
  })
}

// 修改单位明细
export function updateUnit(data) {
  return request({
    url: '/foundation/unit',
    method: 'put',
    data: data
  })
}

// 删除单位明细
export function delUnit(unitId) {
  return request({
    url: '/foundation/unit/' + unitId,
    method: 'delete'
  })
}
