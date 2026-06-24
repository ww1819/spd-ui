import request from '@/utils/request'
import { PATIENT_CHARGE_SEGMENT_TIMEOUT_MS } from '@/utils/patientChargeFetch'

/** HIS 慢查询：抑制全局「系统接口请求超时」，由业务页展示分段进度与友好提示 */
const PATIENT_CHARGE_HIS_HEADERS = {
  repeatSubmit: false,
  hideError: true
}

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

/** 住院/门诊计费抓取：前端按间隔天数分段，每段单独请求 */
export function fetchInpatientMirror(data) {
  return request({
    url: '/his/patientCharge/mirror/fetch/inpatient',
    method: 'post',
    timeout: PATIENT_CHARGE_SEGMENT_TIMEOUT_MS,
    headers: PATIENT_CHARGE_HIS_HEADERS,
    data
  })
}

export function fetchOutpatientMirror(data) {
  return request({
    url: '/his/patientCharge/mirror/fetch/outpatient',
    method: 'post',
    timeout: PATIENT_CHARGE_SEGMENT_TIMEOUT_MS,
    headers: PATIENT_CHARGE_HIS_HEADERS,
    data
  })
}

/** 历史收费镜像补全执行科室（按计费时间区间从 HIS 回写 exec_dept_id/name） */
export function backfillInpatientExecDept(data) {
  return request({
    url: '/his/patientCharge/mirror/backfillExecDept/inpatient',
    method: 'post',
    timeout: PATIENT_CHARGE_SEGMENT_TIMEOUT_MS,
    headers: PATIENT_CHARGE_HIS_HEADERS,
    data
  })
}

export function backfillOutpatientExecDept(data) {
  return request({
    url: '/his/patientCharge/mirror/backfillExecDept/outpatient',
    method: 'post',
    timeout: PATIENT_CHARGE_SEGMENT_TIMEOUT_MS,
    headers: PATIENT_CHARGE_HIS_HEADERS,
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

/** 低值冲销：反消耗并恢复待处理（计费行联动关联退费行） */
export function writeOffMirrorLowValue(data) {
  return request({
    url: '/his/patientCharge/mirror/writeOffLowValue',
    method: 'post',
    timeout: 120000,
    data
  })
}
