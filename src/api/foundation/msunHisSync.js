import request from '@/utils/request'

/** 众阳 HIS 主数据一键同步（仅枣强县中医院租户） */
export function syncMsunHisMaster(syncType) {
  return request({
    url: '/foundation/msunHis/sync/' + syncType,
    method: 'post'
  })
}
