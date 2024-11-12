import request from '@/utils/request'

// 查询财务分类维护列表
export function listFinanceCategory(query) {
  return request({
    url: '/foundation/financeCategory/list',
    method: 'get',
    params: query
  })
}

// 查询所有财务分类维护列表
export function listFinanceCategoryAll(query) {
  return request({
    url: '/foundation/financeCategory/listAll',
    method: 'get',
    params: query
  })
}

// 查询财务分类维护详细
export function getFinanceCategory(financeCategoryId) {
  return request({
    url: '/foundation/financeCategory/' + financeCategoryId,
    method: 'get'
  })
}

// 新增财务分类维护
export function addFinanceCategory(data) {
  return request({
    url: '/foundation/financeCategory',
    method: 'post',
    data: data
  })
}

// 修改财务分类维护
export function updateFinanceCategory(data) {
  return request({
    url: '/foundation/financeCategory',
    method: 'put',
    data: data
  })
}

// 删除财务分类维护
export function delFinanceCategory(financeCategoryId) {
  return request({
    url: '/foundation/financeCategory/' + financeCategoryId,
    method: 'delete'
  })
}
