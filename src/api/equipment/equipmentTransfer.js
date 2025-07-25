import request from '@/utils/request'

// 查询设备调拨列表
export function listEquipmentTransfer(query) {
  return request({
    url: '/equipment/transfer/list',
    method: 'get',
    params: query
  })
}

// 查询设备调拨详细
export function getEquipmentTransfer(transferId) {
  return request({
    url: '/equipment/transfer/' + transferId,
    method: 'get'
  })
}

// 新增设备调拨
export function addEquipmentTransfer(data) {
  return request({
    url: '/equipment/transfer',
    method: 'post',
    data: data
  })
}

// 修改设备调拨
export function updateEquipmentTransfer(data) {
  return request({
    url: '/equipment/transfer',
    method: 'put',
    data: data
  })
}

// 删除设备调拨
export function delEquipmentTransfer(transferId) {
  return request({
    url: '/equipment/transfer/' + transferId,
    method: 'delete'
  })
}

// 导出设备调拨
export function exportEquipmentTransfer(query) {
  return request({
    url: '/equipment/transfer/export',
    method: 'get',
    params: query
  })
} 