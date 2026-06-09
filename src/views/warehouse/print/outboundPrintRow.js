import store from '@/store'
import RMBConverter from '@/utils/tools'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

function formatDateOnly(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) {
    const s = String(val).trim()
    return s.length >= 10 ? s.substring(0, 10) : s
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function resolveAuditorName(row, data) {
  const ap = (data && data.auditPerson) || (row && row.auditPerson)
  if (ap && ap.nickName) return ap.nickName
  if (data && data.auditNickName) return data.auditNickName
  if (data && data.auditPersonName) return data.auditPersonName
  if (row && row.auditPersonName) return row.auditPersonName
  return ''
}

function resolveCreaterName(row, data) {
  const cr = (data && data.creater) || (row && row.creater)
  if (cr && cr.nickName) return cr.nickName
  if (data && data.createrNickName) return data.createrNickName
  if (data && data.createrName) return data.createrName
  if (row && row.createrName) return row.createrName
  return (data && data.createBy) || (row && row.createBy) || ''
}

/** 枣强县中医院：新版出库单打印数据 */
export function buildOutboundPrintRowFromDetailZq(listRow, detail) {
  const row = listRow || {}
  const data = detail || {}
  const details = data.stkIoBillEntryList
  const materiaDetails = data.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    if (it == null || it.id == null) return
    map[it.id] = it
  })

  let detailList = []
  let totalAmt = 0
  let totalQty = 0

  ;(details || []).forEach(item => {
    if (item == null) return
    totalAmt += Number(item.amt) || 0
    totalQty += Number(item.qty) || 0

    const emb = item.material || {}
    const arch = map[item.materialId] || {}
    const prod = Object.assign({}, emb, arch)
    const fdFactory = prod.fdFactory != null ? prod.fdFactory : null
    const fdFinanceCategory = prod.fdFinanceCategory != null ? prod.fdFinanceCategory : null
    const fdUnit = prod.fdUnit != null ? prod.fdUnit : null

    const nameFromSnap = item.materialName != null && String(item.materialName).trim() !== ''
    const specFromSnap = item.materialSpeci != null && String(item.materialSpeci).trim() !== ''

    detailList.push({
      batchNumber: item.batchNumber,
      endTime: formatDateOnly(item.endTime != null ? item.endTime : (prod && prod.endTime) || (prod && prod.periodDate) || ''),
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: nameFromSnap ? item.materialName : ((prod && prod.name) || ''),
      materialSpeci: specFromSnap ? item.materialSpeci : ((prod && prod.speci) || ''),
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      financeCategoryName: (fdFinanceCategory && fdFinanceCategory.financeCategoryName) || '',
      unitName: (fdUnit && fdUnit.unitName) || ''
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)
  const supplier = data.supplier || row.supplier

  return {
    billNo: data.billNo != null ? data.billNo : row.billNo,
    departmentName: (data.department && data.department.name) || (row.department && row.department.name) || '',
    warehouseName: (data.warehouse && data.warehouse.name) || (row.warehouse && row.warehouse.name) || '',
    supplierName: (supplier && supplier.name) || '',
    billDate: data.billDate != null ? data.billDate : row.billDate,
    auditDate: data.auditDate != null ? data.auditDate : row.auditDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    createBy: resolveCreaterName(row, data),
    auditorName: resolveAuditorName(row, data),
    recipientName: '',
    billType: data.billType != null ? data.billType : row.billType
  }
}

/** 衡水三院等：原物资出库单打印数据 */
export function buildOutboundPrintRowFromDetailHs(listRow, detail) {
  const row = listRow || {}
  const data = detail || {}
  const details = data.stkIoBillEntryList
  const materiaDetails = data.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    if (it == null || it.id == null) return
    map[it.id] = it
  })

  let detailList = []
  let totalAmt = 0
  let totalQty = 0

  ;(details || []).forEach(item => {
    if (item == null) return
    totalAmt += Number(item.amt) || 0
    totalQty += Number(item.qty) || 0

    const emb = item.material || {}
    const arch = map[item.materialId] || {}
    const prod = Object.assign({}, emb, arch)
    const fdFactory = prod.fdFactory != null ? prod.fdFactory : null
    const fdWarehouseCategory = prod.fdWarehouseCategory != null ? prod.fdWarehouseCategory : null
    const fdUnit = prod.fdUnit != null ? prod.fdUnit : null

    const nameFromSnap = item.materialName != null && String(item.materialName).trim() !== ''
    const specFromSnap = item.materialSpeci != null && String(item.materialSpeci).trim() !== ''
    const modelFromSnap = item.materialModel != null && String(item.materialModel).trim() !== ''
    detailList.push({
      batchNumber: item.batchNumber,
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: nameFromSnap ? item.materialName : ((prod && prod.name) || ''),
      materialSpeci: specFromSnap ? item.materialSpeci : ((prod && prod.speci) || ''),
      materialModel: modelFromSnap ? item.materialModel : ((prod && prod.model) || ''),
      periodDate: (prod && prod.periodDate) || '',
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      warehouseCategoryName: (fdWarehouseCategory && fdWarehouseCategory.warehouseCategoryName) || '',
      unitName: (fdUnit && fdUnit.unitName) || '',
      supplierId: (prod && prod.supplierId) || '',
      beginTime: (prod && prod.beginTime) || '',
      endTime: item.endTime != null ? item.endTime : (prod && prod.endTime) || (prod && prod.periodDate) || ''
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)

  return {
    billNo: data.billNo != null ? data.billNo : row.billNo,
    departmentName: (data.department && data.department.name) || (row.department && row.department.name) || '',
    warehouseName: (data.warehouse && data.warehouse.name) || (row.warehouse && row.warehouse.name) || '',
    billDate: data.billDate != null ? data.billDate : row.billDate,
    auditDate: data.auditDate != null ? data.auditDate : row.auditDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    fundSource: (data.fundSource != null ? data.fundSource : row.fundSource) || '',
    createBy: (data.createBy != null ? data.createBy : row.createBy) || '',
    outboundOperator:
      (data.creater && data.creater.nickName) ||
      (row.creater && row.creater.nickName) ||
      (data.outboundOperator != null ? data.outboundOperator : row.outboundOperator) ||
      (data.createBy != null ? data.createBy : row.createBy) ||
      '',
    billType: data.billType != null ? data.billType : row.billType
  }
}

/**
 * 按当前租户组装出库单打印 row。
 * @param {Object|null} listRow 列表行
 * @param {Object} detail getOutWarehouse 返回的 data
 * @param {string} [customerId] 可选，默认取 store.getters.customerId
 */
export function buildOutboundPrintRowFromDetail(listRow, detail, customerId) {
  const cid = customerId != null
    ? customerId
    : (store.getters && store.getters.customerId) || ''
  if (isZqInboundPrintTenant(cid)) {
    return buildOutboundPrintRowFromDetailZq(listRow, detail)
  }
  return buildOutboundPrintRowFromDetailHs(listRow, detail)
}
