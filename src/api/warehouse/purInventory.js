import request from '@/utils/request'

// 查询进销存明细列表
export function listPurInventory(query) {
  return request({
    url: '/warehouse/purInventory/listPurInventory',
    method: 'get',
    params: query
  })
}

