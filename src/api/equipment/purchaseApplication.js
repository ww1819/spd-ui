import request from '@/utils/request'

// 查询设备采购申请列表
export function listEquipmentPurchaseApplication(query) {
  return request({
    url: '/biz/equipmentPurchaseApplication/list',
    method: 'get',
    params: query
  })
}

// 查询设备采购申请详细
export function getEquipmentPurchaseApplication(id) {
  return request({
    url: '/biz/equipmentPurchaseApplication/' + id,
    method: 'get'
  })
}

// 新增设备采购申请
export function addEquipmentPurchaseApplication(data) {
  return request({
    url: '/biz/equipmentPurchaseApplication',
    method: 'post',
    data: data
  })
}

// 修改设备采购申请
export function updateEquipmentPurchaseApplication(data) {
  return request({
    url: '/biz/equipmentPurchaseApplication',
    method: 'put',
    data: data
  })
}

// 删除设备采购申请
export function delEquipmentPurchaseApplication(id) {
  return request({
    url: '/biz/equipmentPurchaseApplication/' + id,
    method: 'delete'
  })
}

// 导出设备采购申请
export function exportEquipmentPurchaseApplication(query) {
  return request({
    url: '/biz/equipmentPurchaseApplication/export',
    method: 'post',
    data: query
  })
} 