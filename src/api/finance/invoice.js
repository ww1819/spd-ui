import request from '@/utils/request'

// 发票列表
export function listInvoice(query) {
  return request({
    url: '/finance/invoice/list',
    method: 'get',
    params: query
  })
}

// 发票详情
export function getInvoice(id) {
  return request({
    url: '/finance/invoice/' + id,
    method: 'get'
  })
}

// 新增发票
export function addInvoice(data) {
  return request({
    url: '/finance/invoice',
    method: 'post',
    data: data
  })
}

// 修改发票
export function updateInvoice(data) {
  return request({
    url: '/finance/invoice',
    method: 'put',
    data: data
  })
}

// 删除发票
export function delInvoice(id) {
  return request({
    url: '/finance/invoice/' + id,
    method: 'delete'
  })
}

// 发票审核
export function auditInvoice(id) {
  return request({
    url: '/finance/invoice/audit/' + id,
    method: 'put'
  })
}
