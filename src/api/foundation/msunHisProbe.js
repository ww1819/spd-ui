import request from '@/utils/request'

/** 众阳 HIS 联调环境（SPD 后端 → scminterface） */
export function getMsunHisEnv() {
  return request({
    url: '/foundation/msunHis/probe/env',
    method: 'get'
  })
}

/** 调用众阳 HIS 探针接口（apiKey 见 utils/msunHisProbeApi.js） */
export function invokeMsunHisProbe(apiKey, params) {
  return request({
    url: '/foundation/msunHis/probe/invoke/' + apiKey,
    method: 'post',
    data: params || {}
  })
}
