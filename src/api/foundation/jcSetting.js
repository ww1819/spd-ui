import request from '@/utils/request'

export function getJcSetting() {
  return request({
    url: '/foundation/jcSetting',
    method: 'get'
  })
}

export function saveJcReportMode(reportMode) {
  return request({
    url: '/foundation/jcSetting/reportMode',
    method: 'put',
    data: { reportMode }
  })
}
