import request from '@/utils/request'

// 查询设备档案列表
export function listEquipmentFile(query) {
  return request({
    url: '/equipment/file/list',
    method: 'get',
    params: query
  })
}

// 查询设备档案详细
export function getEquipmentFile(fileId) {
  return request({
    url: '/equipment/file/' + fileId,
    method: 'get'
  })
}

// 新增设备档案
export function addEquipmentFile(data) {
  return request({
    url: '/equipment/file',
    method: 'post',
    data: data
  })
}

// 修改设备档案
export function updateEquipmentFile(data) {
  return request({
    url: '/equipment/file',
    method: 'put',
    data: data
  })
}

// 删除设备档案
export function delEquipmentFile(fileId) {
  return request({
    url: '/equipment/file/' + fileId,
    method: 'delete'
  })
}

// 下载设备档案
export function downloadEquipmentFile(fileId) {
  return request({
    url: '/equipment/file/download/' + fileId,
    method: 'get'
  })
} 