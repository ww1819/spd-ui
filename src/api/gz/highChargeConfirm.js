import request from '@/utils/request'

export function listHighChargeConfirm(query) {
  return request({
    url: '/gz/highChargeConfirm/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function confirmHighChargeConsume(data) {
  return request({
    url: '/gz/highChargeConfirm/confirm',
    method: 'post',
    data
  })
}

export function getHighChargeConfirmDetail(confirmId) {
  return request({
    url: '/gz/highChargeConfirm/confirmDetail/' + confirmId,
    method: 'get'
  })
}
