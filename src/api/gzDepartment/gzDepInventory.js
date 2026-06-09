import request from '@/utils/request'

// 查询高值科室库存列表
export function listGzDepInventory(query) {
  return request({
    url: '/gzDepartment/gzDepInventory/list',
    method: 'get',
    params: query
  })
}

/** 弹窗/备货退库等：仅需登录，与 list 同源，避免无 gzDepartment:gzDepInventory:list 时 403 */
export function listGzDepInventoryPick(query) {
  return request({
    url: '/gzDepartment/gzDepInventory/pick/list',
    method: 'get',
    params: query
  })
}

// 查询高值科室库存详细
export function getGzDepInventory(id) {
  return request({
    url: '/gzDepartment/gzDepInventory/' + id,
    method: 'get'
  })
}

// 新增高值科室库存
export function addGzDepInventory(data) {
  return request({
    url: '/gzDepartment/gzDepInventory',
    method: 'post',
    data: data
  })
}

// 修改高值科室库存
export function updateGzDepInventory(data) {
  return request({
    url: '/gzDepartment/gzDepInventory',
    method: 'put',
    data: data
  })
}

// 删除高值科室库存
export function delGzDepInventory(id) {
  return request({
    url: '/gzDepartment/gzDepInventory/' + id,
    method: 'delete'
  })
}
