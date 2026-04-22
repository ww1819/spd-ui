import RMBConverter from '@/utils/tools'

/**
 * 组装入库单浏览器打印用 row（与 orderPrint 约定一致）。
 * @param {Object|null|undefined} listRow 列表行（可选）；独立打印页可传 null，仅从 detail 取数
 * @param {Object} detail getInWarehouse 返回的 data（含 stkIoBillEntryList、materialList）
 */
export function buildInboundPrintRowFromDetail(listRow, detail) {
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

    const prod = map[item.materialId] || {}
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
      materialName: (prod && prod.name) || '',
      materialSpeci: (prod && prod.speci) || '',
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
  const auditDate = row.auditDate != null ? row.auditDate : d.auditDate
  const fundSourceAccount = row.fundSourceAccount != null ? row.fundSourceAccount : d.fundSourceAccount
  const createBy = row.createBy != null ? row.createBy : d.createBy
  const inboundOperator = row.inboundOperator != null ? row.inboundOperator : d.inboundOperator
  const billType = row.billType != null ? row.billType : d.billType

  return {
    billNo,
    supplierName: (supplier && supplier.name) || '',
    warehouseName: (warehouse && warehouse.name) || '',
    billDate,
    auditDate,
    totalAmt,
    totalQty,
    totalAmtConverter,
    detailList,
    fundSourceAccount: fundSourceAccount != null ? fundSourceAccount : '',
    createBy: createBy != null ? createBy : '',
    inboundOperator: (creater && creater.nickName) || (inboundOperator != null ? inboundOperator : createBy) || '',
    billType
  }
}
