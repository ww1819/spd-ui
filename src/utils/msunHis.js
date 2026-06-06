/** 枣强县中医院 customerId（与 scminterface hospitalKey 一致） */
export const ZQ_TCM_TENANT = 'zaoqiang-tcm-001'

/** 已接入众阳 HIS 的 SPD 租户（与 MsunHisTenantRegistry 同步维护） */
export const MSUN_INTEGRATED_TENANT_IDS = [ZQ_TCM_TENANT]

const PUSH_STATUS_MAP = {
  '0': { label: '未推送', type: 'info' },
  '1': { label: '推送中', type: 'warning' },
  '2': { label: '成功', type: 'success' },
  '3': { label: '失败', type: 'danger' }
}

export function isMsunIntegratedTenant(customerId) {
  const id = customerId == null ? '' : String(customerId).trim()
  return MSUN_INTEGRATED_TENANT_IDS.includes(id)
}

/** @deprecated 使用 isMsunIntegratedTenant */
export function isZaoqiangTenant(customerId) {
  return isMsunIntegratedTenant(customerId)
}

export function msunPushStatusMeta(status) {
  const key = status == null || status === '' ? '0' : String(status)
  return PUSH_STATUS_MAP[key] || { label: status || '—', type: 'info' }
}

/** 是否可补退（201 已审后） */
export function canMsunRepush(status) {
  const s = status == null || status === '' ? '0' : String(status)
  return s === '0' || s === '3'
}

export function buildEntryHisQuery(entry, department) {
  const mat = entry && entry.material ? entry.material : {}
  const params = {}
  if (entry && entry.hisPharmacyStockId) {
    params.pharmacyStockId = entry.hisPharmacyStockId
  }
  if (department && department.hisId) {
    params.deptId = department.hisId
  }
  const drugId = (entry && entry.hisDrugId) || mat.hisId
  const specId = (entry && entry.hisDrugSpecPackingId) || mat.hisSpecPackingId
  if (drugId) params.drugId = drugId
  if (specId) params.drugSpecPackingId = specId
  if (entry && entry.batchNumber) params.batchNumber = entry.batchNumber
  return params
}
