import request from '@/utils/request'

// 查询领用明细列表
export function listConsumeDetail(query) {
  return request({
    url: '/department/consumeDetail/list',
    method: 'get',
    params: query
  })
}

// 查询领用汇总列表
export function listConsumeSummary(query) {
  return request({
    url: '/department/consumeDetail/summary',
    method: 'get',
    params: query
  })
}

// 查询领用排名列表
export function listConsumeRanking(query) {
  return request({
    url: '/department/consumeDetail/ranking',
    method: 'get',
    params: query
  })
}

// 导出领用明细
export function exportConsumeDetail(query) {
  return request({
    url: '/department/consumeDetail/export',
    method: 'post',
    params: query
  })
}

// 导出领用汇总
export function exportConsumeSummary(query) {
  return request({
    url: '/department/consumeDetail/exportSummary',
    method: 'post',
    params: query
  })
}

// 导出领用排名
export function exportConsumeRanking(query) {
  return request({
    url: '/department/consumeDetail/exportRanking',
    method: 'post',
    params: query
  })
}
