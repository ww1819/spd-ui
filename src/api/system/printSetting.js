import request from '@/utils/request'

// 查询打印设置列表
export function listPrintSetting(query) {
  return request({
    url: '/system/printSetting/list',
    method: 'get',
    params: query
  })
}

// 查询打印设置详细
export function getPrintSetting(id) {
  return request({
    url: '/system/printSetting/' + id,
    method: 'get'
  })
}

// 根据入库单类型获取默认模板
export function getDefaultTemplate(billType) {
  return request({
    url: '/system/printSetting/getDefault/' + (billType || 'null'),
    method: 'get'
  })
}

// 新增打印设置
export function addPrintSetting(data) {
  return request({
    url: '/system/printSetting',
    method: 'post',
    data: data
  })
}

// 修改打印设置
export function updatePrintSetting(data) {
  return request({
    url: '/system/printSetting',
    method: 'put',
    data: data
  })
}

// 删除打印设置
export function delPrintSetting(id) {
  return request({
    url: '/system/printSetting/' + id,
    method: 'delete'
  })
}

// 设置默认模板
export function setDefaultTemplate(data) {
  return request({
    url: '/system/printSetting/setDefault',
    method: 'put',
    data: data
  })
}
