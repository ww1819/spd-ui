import request from '@/utils/request'

/** 201 出库单 HIS 手动推送（已审核，未成功/失败明细） */
export function pushMsunOutbound(billId) {
  return request({
    url: '/foundation/msunHis/bill/push/outbound/' + billId,
    method: 'post'
  })
}

/** @deprecated 使用 pushMsunOutbound */
export function repushMsunOutbound(billId) {
  return pushMsunOutbound(billId)
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
