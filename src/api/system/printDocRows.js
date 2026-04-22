import request from '@/utils/request'

export function getPrintDocRows(docKind) {
  return request({
    url: '/system/printDocRows/' + encodeURIComponent(docKind),
    method: 'get'
  })
}

export function updatePrintDocRows(data) {
  return request({
    url: '/system/printDocRows',
    method: 'put',
    data
  })
}
