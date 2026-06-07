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

/** 枣强县中医院：新版入库单打印数据 */
export function buildInboundPrintRowFromDetailZq(listRow, detail) {
  const row = listRow || {}
  const d = detail || {}
  const details = d.stkIoBillEntryList
  const materiaDetails = d.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    map[it.id] = it
  })

  let detailList = []
  let totalAmt = 0
  let totalQty = 0

  ;(details || []).forEach(item => {
    totalAmt += item.amt
    totalQty += item.qty

    const prod = map[item.materialId] || item.material || {}
    const fdFactory = prod.fdFactory != null ? prod.fdFactory : null
    const fdFinanceCategory = prod.fdFinanceCategory != null ? prod.fdFinanceCategory : null
    const fdUnit = prod.fdUnit != null ? prod.fdUnit : null

    detailList.push({
      batchNumber: item.batchNumber,
      endTime: formatDateOnly(item.endTime),
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: (prod && prod.name) || item.materialName || '',
      materialSpeci: (prod && prod.speci) || item.materialSpeci || '',
      periodDate: (prod && prod.periodDate) || '',
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      financeCategoryName: (fdFinanceCategory && fdFinanceCategory.financeCategoryName) || '',
      unitName: (fdUnit && fdUnit.unitName) || ''
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)

  const supplier = row.supplier || d.supplier
  const warehouse = row.warehouse || d.warehouse
  const creater = row.creater || d.creater
  const billNo = row.billNo != null ? row.billNo : d.billNo
  const billDate = row.billDate != null ? row.billDate : d.billDate
  const remark = row.remark != null ? row.remark : d.remark
  const billType = row.billType != null ? row.billType : d.billType

  return {
    billNo,
    supplierName: (supplier && supplier.name) || '',
    warehouseName: (warehouse && warehouse.name) || '',
    billDate,
    remark: remark != null ? remark : '',
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    createBy: creater && creater.nickName ? creater.nickName : (d.createrName || ''),
    purchaserName: '',
    billType
  }
}

/** 衡水三院等：原物资入库单打印数据 */
export function buildInboundPrintRowFromDetailHs(listRow, detail) {
  const row = listRow || {}
  const d = detail || {}
  const details = d.stkIoBillEntryList
  const materiaDetails = d.materialList
  const map = {}

  ;(materiaDetails || []).forEach(it => {
    map[it.id] = it
  })

  let detailList = []
  let totalAmt = 0
  let totalQty = 0

  ;(details || []).forEach(item => {
    totalAmt += item.amt
    totalQty += item.qty

    const prod = map[item.materialId] || item.material || {}
    const fdFactory = prod.fdFactory != null ? prod.fdFactory : null
    const fdWarehouseCategory = prod.fdWarehouseCategory != null ? prod.fdWarehouseCategory : null
    const fdUnit = prod.fdUnit != null ? prod.fdUnit : null

    detailList.push({
      batchNumber: item.batchNumber,
      amt: item.amt,
      qty: item.qty,
      unitPrice: item.unitPrice,
      price: item.unitPrice,
      materialCode: (prod && prod.code) || '',
      materialName: (prod && prod.name) || item.materialName || '',
      materialSpeci: (prod && prod.speci) || item.materialSpeci || '',
      periodDate: (prod && prod.periodDate) || '',
      factoryName: (fdFactory && fdFactory.factoryName) || '',
      warehouseCategoryName: (fdWarehouseCategory && fdWarehouseCategory.warehouseCategoryName) || '',
      unitName: (fdUnit && fdUnit.unitName) || ''
    })
  })

  const totalAmtConverter = RMBConverter.numberToChinese(totalAmt)

  const supplier = row.supplier || d.supplier
  const warehouse = row.warehouse || d.warehouse
  const creater = row.creater || d.creater
  const billNo = row.billNo != null ? row.billNo : d.billNo
  const billDate = row.billDate != null ? row.billDate : d.billDate
  const billType = row.billType != null ? row.billType : d.billType
  const fundSourceAccount = row.fundSourceAccount != null ? row.fundSourceAccount : d.fundSourceAccount
  const createBy = row.createBy != null ? row.createBy : d.createBy

  return {
    billNo,
    supplierName: (supplier && supplier.name) || '',
    warehouseName: (warehouse && warehouse.name) || '',
    billDate,
    auditDate: row.auditDate != null ? row.auditDate : d.auditDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    fundSourceAccount: fundSourceAccount != null ? fundSourceAccount : '',
    createBy: createBy != null ? createBy : '',
    inboundOperator: (creater && creater.nickName) || row.inboundOperator || createBy || '',
    billType
  }
}

/**
 * 按当前租户组装入库单打印 row。
 * @param {Object|null|undefined} listRow 列表行
 * @param {Object} detail getInWarehouse 返回的 data
 * @param {string} [customerId] 可选，默认取 store.getters.customerId
 */
export function buildInboundPrintRowFromDetail(listRow, detail, customerId) {
  const cid = customerId != null
    ? customerId
    : (store.getters && store.getters.customerId) || ''
  if (isZqInboundPrintTenant(cid)) {
    return buildInboundPrintRowFromDetailZq(listRow, detail)
  }
  return buildInboundPrintRowFromDetailHs(listRow, detail)
}
