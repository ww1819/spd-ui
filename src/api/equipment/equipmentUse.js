import request from '@/utils/request'

// 查询设备使用列表
export function listEquipmentUse(query) {
  return request({
    url: '/equipment/use/list',
    method: 'get',
    params: query
  })
}

// 查询设备使用详细
export function getEquipmentUse(useId) {
  return request({
    url: '/equipment/use/' + useId,
    method: 'get'
  })
}

// 新增设备使用
export function addEquipmentUse(data) {
  return request({
    url: '/equipment/use',
    method: 'post',
    data: data
  })
}

// 修改设备使用
export function updateEquipmentUse(data) {
  return request({
    url: '/equipment/use',
    method: 'put',
    data: data
  })
}

// 删除设备使用
export function delEquipmentUse(useId) {
  return request({
    url: '/equipment/use/' + useId,
    method: 'delete'
  })
}

// 导出设备使用
export function exportEquipmentUse(query) {
  return request({
    url: '/equipment/use/export',
    method: 'get',
    params: query
  })
} 