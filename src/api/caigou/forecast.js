import request from '@/utils/request'

/** 预测补货任务列表 */
export function listForecastTask(query) {
  return request({
    url: '/caigou/forecast/list',
    method: 'get',
    params: query
  })
}

/** 任务详情（含建议明细） */
export function getForecastTask(id) {
  return request({
    url: '/caigou/forecast/task/' + id,
    method: 'get'
  })
}

/** 计算建议 */
export function calcForecast(data) {
  return request({
    url: '/caigou/forecast/calc',
    method: 'post',
    data
  })
}

/** 更新确认量/勾选 */
export function updateForecastEntry(data) {
  return request({
    url: '/caigou/forecast/entry',
    method: 'put',
    data
  })
}

/** 生成草稿采购计划 */
export function generateForecastPlan(data) {
  return request({
    url: '/caigou/forecast/generatePlan',
    method: 'post',
    data
  })
}
