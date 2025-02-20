import request from '@/utils/request'

// 查询入库列表
export function listCaigoujihua(query) {
  return request({
    url: '/caigou/jihua/list',
    method: 'get',
    params: query
  })
}

// 查询入库详细
export function getCaigoujihua(id) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'get'
  })
}



// 新增入库
export function addCaigoujihua(data) {
  return request({
    url: '/caigou/jihua',
    method: 'post',
    data: data
  })
}

// 修改入库
export function updateCaigoujihua(data) {
  return request({
    url: '/caigou/jihua',
    method: 'put',
    data: data
  })
}

// 删除入库
export function delCaigoujihua(id) {
  return request({
    url: '/caigou/jihua/' + id,
    method: 'delete'
  })
}

// 审核入库
export function auditCaigoujihua(data) {
  return request({
    url: '/caigou/jihua/check',
    method: 'put',
    data: data
  })
}




