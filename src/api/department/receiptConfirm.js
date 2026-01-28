import request from '@/utils/request'

// 查询收货确认列表
export function listReceiptConfirm(query) {
  return request({
    url: '/department/receiptConfirm/list',
    method: 'get',
    params: query
  })
}

// 查询收货确认详情
export function getReceiptConfirm(id) {
  return request({
    url: '/department/receiptConfirm/' + id,
    method: 'get'
  })
}

// 确认收货
export function confirmReceipt(data) {
  return request({
    url: '/department/receiptConfirm/confirm',
    method: 'put',
    data: data
  })
}

