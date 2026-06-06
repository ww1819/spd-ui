import request from '@/utils/request'

/** 201 出库单 HIS 补退推送 */
export function repushMsunOutbound(billId) {
  return request({
    url: '/foundation/msunHis/bill/repush/outbound/' + billId,
    method: 'post'
  })
}

/** 查询明细 HIS 批次库存镜像（经 SPD 调 scminterface） */
export function queryMsunEntryHis(params) {
  return request({
    url: '/foundation/msunHis/mirror/entry-his',
    method: 'get',
    params
  })
}

/** 按 SPD 单号查询 HIS 推送日志（推送后） */
export function queryMsunBillHis(params) {
  return request({
    url: '/foundation/msunHis/mirror/bill-his',
    method: 'get',
    params
  })
}
