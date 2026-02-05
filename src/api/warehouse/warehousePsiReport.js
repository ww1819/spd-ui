import request from '@/utils/request'

// 查询进销存明细列表
export function selectWarehousePsiReport(query) {
  return request({
    url: '/department/consumeDetail/selectWarehousePsiReport',
    method: 'get',
    params: query
  })
}

