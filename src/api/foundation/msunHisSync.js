import request from '@/utils/request'

/** 众阳 HIS 主数据全量同步：HIS 拉数较慢，前端放宽超时并定制提示 */
const MSUN_HIS_SYNC_TIMEOUT_MS = 300000
const MSUN_HIS_SYNC_TIMEOUT_MSG =
  'HIS 下载数据耗时较长，本次请求已超时。同步可能仍在后台进行，请稍后刷新列表查看结果，请勿短时间重复点击。'

/** 众阳 HIS 主数据同步（可选探针入参，经 SPD 后端代理） */
export function syncMsunHisMaster(syncType, probeParams) {
  return request({
    url: '/foundation/msunHis/sync/' + syncType,
    method: 'post',
    data: probeParams || {},
    timeout: MSUN_HIS_SYNC_TIMEOUT_MS,
    timeoutMsg: MSUN_HIS_SYNC_TIMEOUT_MSG
  })
}

/** 单条耗材档案从众阳 HIS 同步 */
export function syncMsunHisMaterialSingle(materialId) {
  return request({
    url: '/foundation/msunHis/sync/materials/single/' + materialId,
    method: 'post',
    timeout: 120000,
    timeoutMsg: 'HIS 单条耗材同步超时。请稍后在列表中核对是否已更新，勿短时间重复点击。'
  })
}
