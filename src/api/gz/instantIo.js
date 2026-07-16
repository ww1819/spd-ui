import request from '@/utils/request'

export function listGzInstantIo(query) {
  return request({
    url: '/gz/instantIo/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function auditGzInstantIo(data) {
  return request({
    url: '/gz/instantIo/audit',
    method: 'post',
    data
  })
}

export function reverseGzInstantIo(data) {
  return request({
    url: '/gz/instantIo/reverse',
    method: 'post',
    data
  })
}

export function writeOffGzInstantIo(data) {
  return request({
    url: '/gz/instantIo/writeOff',
    method: 'post',
    data
  })
}
