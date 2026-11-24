import request from '@/utils/request'

export function listHighChargeInpatientMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/inpatient/list',
    method: 'get',
    timeout: 60000,
    timeoutMsg: '高值扫描核销列表查询超时，请缩小计费日期范围后重试',
    params: query
  })
}

export function listHighChargeOutpatientMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/outpatient/list',
    method: 'get',
    timeout: 60000,
    timeoutMsg: '高值扫描核销列表查询超时，请缩小计费日期范围后重试',
    params: query
  })
}

export function listHighChargeAllMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/all/list',
    method: 'get',
    timeout: 60000,
    timeoutMsg: '高值扫描核销列表查询超时，请缩小计费日期范围后重试',
    params: query
  })
}

export function listHighChargeConsumeRecords(visitKind, mirrorRowId) {
  return request({
    url: '/gz/highChargeMirror/mirror/consumeRecords',
    method: 'get',
    timeout: 30000,
    params: { visitKind, mirrorRowId }
  })
}

/** 某条计费明细：计费时间～下载时间之间的抓取记录（按需查询） */
export function listHighChargeFetchBatches(visitKind, mirrorRowId) {
  return request({
    url: '/gz/highChargeMirror/mirror/fetchBatches',
    method: 'get',
    timeout: 30000,
    params: { visitKind, mirrorRowId }
  })
}

export function scanHighChargeBarcode(data) {
  return request({
    url: '/gz/highChargeMirror/mirror/scanHighBarcode',
    method: 'post',
    timeout: 60000,
    data
  })
}

export function applyHighChargeConsume(data) {
  return request({
    url: '/gz/highChargeMirror/mirror/applyHighConsume',
    method: 'post',
    timeout: 120000,
    data
  })
}

/** 计费行的确认/冲销状态，key 为 INPATIENT|id、OUTPATIENT|id */
export function listHighChargeWriteOffStatus(data) {
  return request({
    url: '/gz/highChargeMirror/mirror/writeOffStatus',
    method: 'post',
    data
  })
}

/** 整单冲销：data = { traceabilityIds: [], remark } */
export function writeOffHighChargeScan(data) {
  return request({
    url: '/gz/highChargeMirror/mirror/writeOff',
    method: 'post',
    timeout: 120000,
    data
  })
}

/** 进页访问日志（分段耗时），落 sys_oper_log，失败可静默 */
export function reportHighChargePageAccess(data) {
  return request({
    url: '/gz/highChargeMirror/mirror/pageAccess',
    method: 'post',
    timeout: 10000,
    data
  })
}
