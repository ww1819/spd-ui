import request from '@/utils/request'

export function listHighChargeInpatientMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/inpatient/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function listHighChargeOutpatientMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/outpatient/list',
    method: 'get',
    timeout: 30000,
    params: query
  })
}

export function listHighChargeAllMirror(query) {
  return request({
    url: '/gz/highChargeMirror/mirror/all/list',
    method: 'get',
    timeout: 30000,
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
