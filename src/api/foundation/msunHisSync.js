import request from '@/utils/request'

/** 众阳 HIS 主数据同步（可选探针入参，经 SPD 后端代理） */
export function syncMsunHisMaster(syncType, probeParams) {
  return request({
    url: '/foundation/msunHis/sync/' + syncType,
    method: 'post',
    data: probeParams || {}
  })
}
