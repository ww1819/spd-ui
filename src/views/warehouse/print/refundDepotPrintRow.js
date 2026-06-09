import store from '@/store'
import RMBConverter from '@/utils/tools'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

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
  return ''
}

function resolveSupplierName(prod, item) {
  const fromProd = prod && prod.supplier && prod.supplier.name
  if (fromProd) return fromProd
  const fromItem = item && item.supplier && item.supplier.name
  if (fromItem) return fromItem
  return ''
}

/** 枣强县中医院：新版退库单打印数据 */
export function buildRefundDepotPrintRowFromDetailZq(listRow, detail) {
  const row = listRow || {}
  const data = detail || {}
  const details = data.stkIoBillEntryList
  const materiaDetails = data.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    if (it && it.id != null) map[it.id] = it
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
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: nameFromSnap ? item.materialName : ((prod && prod.name) || ''),
      materialSpeci: specFromSnap ? item.materialSpeci : ((prod && prod.speci) || ''),
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      financeCategoryName: (fdFinanceCategory && fdFinanceCategory.financeCategoryName) || '',
      unitName: (fdUnit && fdUnit.unitName) || '',
      supplierName: resolveSupplierName(prod, item)
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)

  return {
    billNo: row.billNo != null ? row.billNo : data.billNo,
    departmentName: (row.department && row.department.name) || (data.department && data.department.name) || '',
    warehouseName: (row.warehouse && row.warehouse.name) || (data.warehouse && data.warehouse.name) || '',
    billDate: row.billDate != null ? row.billDate : data.billDate,
    billCreateTime: row.createTime != null ? row.createTime : data.createTime,
    auditDate: row.auditDate != null ? row.auditDate : data.auditDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    createBy: resolveCreaterName(row, data),
    auditorName: resolveAuditorName(row, data),
    returnerName: '',
    billType: data.billType != null ? data.billType : row.billType
  }
}

/** 衡水三院等：原科室退库单打印数据 */
export function buildRefundDepotPrintRowFromDetailHs(listRow, detail) {
  const row = listRow || {}
  const data = detail || {}
  const details = data.stkIoBillEntryList
  const materiaDetails = data.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    if (it && it.id != null) map[it.id] = it
  })

  let detailList = []
  let totalAmt = 0
  let totalQty = 0

  ;(details || []).forEach(item => {
    if (item == null) return
    totalAmt += Number(item.amt) || 0
    totalQty += Number(item.qty) || 0

    const prod = map[item.materialId] || {}
    const fdFactory = prod.fdFactory != null ? prod.fdFactory : null
    const fdWarehouseCategory = prod.fdWarehouseCategory != null ? prod.fdWarehouseCategory : null

    detailList.push({
      batchNumber: item.batchNumber,
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: (prod && prod.name) || '',
      materialSpeci: (prod && prod.speci) || '',
      periodDate: (prod && prod.periodDate) || '',
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      warehouseCategoryName: (fdWarehouseCategory && fdWarehouseCategory.warehouseCategoryName) || ''
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)

  return {
    billNo: row.billNo != null ? row.billNo : data.billNo,
    departmentName: (row.department && row.department.name) || (data.department && data.department.name) || '',
    warehouseName: (row.warehouse && row.warehouse.name) || (data.warehouse && data.warehouse.name) || '',
    billDate: row.billDate != null ? row.billDate : data.billDate,
    auditDate: row.auditDate != null ? row.auditDate : data.auditDate,
    printDate: row.printDate != null ? row.printDate : data.printDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList
  }
}

/**
 * 按当前租户组装退库单打印 row。
 * @param {Object|null} listRow 列表行
 * @param {Object} detail getTkInventory 返回的 data
 * @param {string} [customerId] 可选，默认取 store.getters.customerId
 */
export function buildRefundDepotPrintRowFromDetail(listRow, detail, customerId) {
  const cid = customerId != null
    ? customerId
    : (store.getters && store.getters.customerId) || ''
  if (isZqInboundPrintTenant(cid)) {
    return buildRefundDepotPrintRowFromDetailZq(listRow, detail)
  }
  return buildRefundDepotPrintRowFromDetailHs(listRow, detail)
}
