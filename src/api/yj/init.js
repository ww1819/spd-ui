import request from '@/utils/request'

// 查询月结初始化列表
export function monthInitDataList(query) {
  return request({
    url: '/warehouse/yj/monthInitDataList',
    method: 'get',
    params: query
  })
}

// 月结处理
export function monthHandleData(query) {
  return request({
    url: '/warehouse/yj/monthHandleData',
    method: 'get',
    params: query
  })
}


// 清除月结
export function monthClearData(query) {
  return request({
    url: '/warehouse/yj/monthClearData',
    method: 'get',
    params: query
  })
}


