import request from '@/utils/request'

/** 主数据变更快照列表（最多 200 条） */
export function listMasterSnapshot(query) {
  return request({
    url: '/foundation/masterSnapshot/list',
    method: 'get',
    params: query
  })
}
