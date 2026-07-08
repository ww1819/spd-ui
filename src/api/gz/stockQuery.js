import request from '@/utils/request'

/** 按院内码追溯备货库存变动（出/退库表无匹配时的提示） */
export function traceDepotInventory(inHospitalCode) {
  return request({
    url: '/gz/stockQuery/depotInventory/trace',
    method: 'get',
    params: { inHospitalCode }
  })
}
