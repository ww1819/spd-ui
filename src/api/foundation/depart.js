import request from '@/utils/request'

// 查询科室列表
export function listdepart(query) {
  return request({
    url: '/foundation/depart/list',
    method: 'get',
    params: query
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
