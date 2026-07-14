/** 枣强县中医院 customerId（与 scminterface hospitalKey 一致） */
export const ZQ_TCM_TENANT = 'zaoqiang-tcm-001'

/** 衡水市第三人民医院 customerId */
export const HS_THIRD_TENANT = 'hengsui-third-001'

/** 枣强县中医院：禁止手工新增基础档案时的提示 */
export const ZQ_TCM_MANUAL_ADD_DENIED_MSG = '枣强县中医院不允许手工新增，请从HIS系统同步'

export function isZqTcmTenant(customerId) {
  const id = customerId == null ? '' : String(customerId).trim()
  return id === ZQ_TCM_TENANT
}

/** 衡水市第三人民医院 */
export function isHsThirdTenant(customerId) {
  const id = customerId == null ? '' : String(customerId).trim()
  return id === HS_THIRD_TENANT
}

/** 枣强入库单打印版式（新版） */
export function isZqInboundPrintTenant(customerId) {
  const id = customerId == null ? '' : String(customerId).trim()
  return id === ZQ_TCM_TENANT
}

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

/** 是否可手动推送（201 已审后：未推送或推送失败） */
export function canMsunRepush(status) {
  const s = status == null || status === '' ? '0' : String(status)
  return s === '0' || s === '3'
}

/** @deprecated 使用 canMsunRepush */
export function canMsunPush(status) {
  return canMsunRepush(status)
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
