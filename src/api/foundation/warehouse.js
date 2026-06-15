import request from '@/utils/request'
import {parseStrEmpty} from "@/utils/ruoyi";

// 查询仓库列表
export function listWarehouse(query) {
  return request({
    url: '/foundation/warehouse/list',
    method: 'get',
    params: query
  })
}

// 根据用户查询所有仓库列表
export function listWarehouseAll(userId) {
  return request({
    url: '/foundation/warehouse/listAll/' + userId,
    method: 'get'
  })
}

/** 结算仓库下拉（不按用户仓库权限过滤，仅 is_settlement_warehouse=1） */
export function listSettlementWarehousePick() {
  return request({
    url: '/foundation/warehouse/settlementPick',
    method: 'get'
  })
}

// 查询仓库详细
export function getWarehouse(id) {
  return request({
    url: '/foundation/warehouse/' + id,
    method: 'get'
  })
}

// 新增仓库
export function addWarehouse(data) {
  return request({
    url: '/foundation/warehouse',
    method: 'post',
    data: data
  })
}

// 修改仓库
export function updateWarehouse(data) {
  return request({
    url: '/foundation/warehouse',
    method: 'put',
    data: data
  })
}

// 删除仓库
export function delWarehouse(id) {
  return request({
    url: '/foundation/warehouse/' + id,
    method: 'delete'
  })
}

// 查询仓库列表
export function getOptionselect() {
  return request({
    url: '/foundation/warehouse/optionselect',
    method: 'get'
  })
}
