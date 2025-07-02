import request from '@/utils/request'

// 查询科室库存明细列表
export function listDepartmentInventory(query) {
  return request({
    url: '/warehouse/departmentInventory/list',
    method: 'get',
    params: query
  })
} 