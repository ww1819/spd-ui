import request from '@/utils/request'

// 查询进销存明细列表
export function selectWarehousePsiReport(query) {
  return request({
    url: '/department/consumeDetail/selectWarehousePsiReport',
    method: 'get',
    params: query
  })
}

/** 进销存汇总（按产品档案） */
export function selectWarehousePsiReportByMaterial(query) {
  return request({
    url: '/department/consumeDetail/selectWarehousePsiReportByMaterial',
    method: 'get',
    params: query
  })
}

