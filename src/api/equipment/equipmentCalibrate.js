import request from '@/utils/request'

// 查询设备校准列表
export function listEquipmentCalibrate(query) {
  return request({
    url: '/equipment/calibrate/list',
    method: 'get',
    params: query
  })
}

// 查询设备校准详细
export function getEquipmentCalibrate(calibrateId) {
  return request({
    url: '/equipment/calibrate/' + calibrateId,
    method: 'get'
  })
}

// 新增设备校准
export function addEquipmentCalibrate(data) {
  return request({
    url: '/equipment/calibrate',
    method: 'post',
    data: data
  })
}

// 修改设备校准
export function updateEquipmentCalibrate(data) {
  return request({
    url: '/equipment/calibrate',
    method: 'put',
    data: data
  })
}

// 删除设备校准
export function delEquipmentCalibrate(calibrateId) {
  return request({
    url: '/equipment/calibrate/' + calibrateId,
    method: 'delete'
  })
}

// 导出设备校准
export function exportEquipmentCalibrate(query) {
  return request({
    url: '/equipment/calibrate/export',
    method: 'get',
    params: query
  })
} 