import request from '@/utils/request'

/** 数字孪生 KPI 总览 */
export function twinOverview(query) {
  return request({
    url: '/datacenter/digitalTwin/overview',
    method: 'get',
    params: query
  })
}

/** 五区货架格口 */
export function twinShelves(query) {
  return request({
    url: '/datacenter/digitalTwin/shelves',
    method: 'get',
    params: query
  })
}

/** 库存/效期预警 */
export function twinAlerts(query) {
  return request({
    url: '/datacenter/digitalTwin/alerts',
    method: 'get',
    params: query
  })
}

/** 今日出入库流水 */
export function twinIoRealtime(query) {
  return request({
    url: '/datacenter/digitalTwin/ioRealtime',
    method: 'get',
    params: query
  })
}

/** 货位库存明细 */
export function twinLocationDetail(query) {
  return request({
    url: '/datacenter/digitalTwin/locationDetail',
    method: 'get',
    params: query
  })
}
