import RMBConverter from '@/utils/tools'

/**
 * 组装采购退货单打印 row（与 refundGoodsOrderPrint 约定一致）
 */
export function buildRefundGoodsPrintRowFromDetail(listRow, detail) {
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
      unitName: (prod.fdUnit && prod.fdUnit.unitName) || (item.material && item.material.fdUnit && item.material.fdUnit.unitName) || '',
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
    supplierName: (row.supplier && row.supplier.name) || (data.supplier && data.supplier.name) || '',
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
