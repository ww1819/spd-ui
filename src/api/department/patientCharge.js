import request from '@/utils/request'

export function listInpatientMirror(query) {
  return request({
    url: '/his/patientCharge/mirror/inpatient/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function listOutpatientMirror(query) {
  return request({
    url: '/his/patientCharge/mirror/outpatient/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function listAllMirror(query) {
  return request({
    url: '/his/patientCharge/mirror/all/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

/** 计费镜像行关联的科室消耗记录 */
export function listMirrorConsumeRecords(visitKind, mirrorRowId) {
  return request({
    url: '/his/patientCharge/mirror/consumeRecords',
    method: 'get',
    timeout: 30000,
    params: { visitKind, mirrorRowId }
  })
}

export function listChargeSummary(query) {
  return request({
    url: '/his/patientCharge/summary/list',
    method: 'get',
    params: query
  })
}

export function fetchInpatientMirror(data) {
  return request({
    url: '/his/patientCharge/mirror/fetch/inpatient',
    method: 'post',
    timeout: 120000,
    data
  })
}

export function fetchOutpatientMirror(data) {
  return request({
    url: '/his/patientCharge/mirror/fetch/outpatient',
    method: 'post',
    timeout: 120000,
    data
  })
}

export function listHisFetchBatch(limit) {
  return request({
    url: '/his/patientCharge/fetchBatch/list',
    method: 'get',
    params: { limit }
  })
}

export function processMirrorLowValue(data) {
  return request({
    url: '/his/patientCharge/mirror/processLowValue',
    method: 'post',
    timeout: 120000,
    data
  })
}

export function processMirrorLowValueBatch(data) {
  return request({
    url: '/his/patientCharge/mirror/processLowValueBatch',
    method: 'post',
    timeout: 300000,
    data
  })
}

export function scanMirrorHighBarcode(data) {
  return request({
    url: '/his/patientCharge/mirror/scanHighBarcode',
    method: 'post',
    timeout: 60000,
    data
  })
}

export function applyMirrorHighConsume(data) {
  return request({
    url: '/his/patientCharge/mirror/applyHighConsume',
    method: 'post',
    timeout: 120000,
    data
  })
}

/** 租户计费自动处理开关（衡水三院：抓取后自动消耗 / 自动退费） */
export function getTenantBillingSetting() {
  return request({
    url: '/his/patientCharge/tenant/billingSetting',
    method: 'get'
  })
}

export function saveTenantBillingSetting(data) {
  return request({
    url: '/his/patientCharge/tenant/billingSetting',
    method: 'put',
    data
  })
}
