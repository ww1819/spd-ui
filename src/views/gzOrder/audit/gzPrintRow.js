import RMBConverter from '@/utils/tools'

export function buildGzAcceptancePrintRowFromDetail(summaryRow, detailData) {
  const summary = summaryRow || {}
  const data = detailData || {}
  const details = Array.isArray(data.gzOrderEntryList) ? data.gzOrderEntryList : []
  const materialList = Array.isArray(data.materialList) ? data.materialList : []

  const materialMap = {}
  materialList.forEach((it) => {
    if (it && it.id != null) materialMap[it.id] = it
  })

  let totalAmt = 0
  let totalQty = 0
  const detailList = details.map((item) => {
    const line = item || {}
    const qty = Number(line.qty) || 0
    const amt = Number(line.amt) || 0
    totalQty += qty
    totalAmt += amt
    const prod = materialMap[line.materialId] || {}
    const fdUnit = prod.fdUnit || {}
    return {
      batchNumber: line.batchNumber || '',
      amt: line.amt,
      qty: line.qty,
      price: line.price,
      materialCode: prod.code || '',
      materialName: prod.name || '',
      materialSpeci: prod.speci || '',
      periodDate: prod.periodDate || '',
      factoryName: (prod.fdFactory && prod.fdFactory.factoryName) || '',
      warehouseCategoryName: (prod.fdWarehouseCategory && prod.fdWarehouseCategory.warehouseCategoryName) || '',
      unitName: fdUnit.unitName || ''
    }
  })

  // 对齐 inWarehouse/audit/orderPrint.vue 所需字段
  const orderNo = summary.orderNo || data.orderNo || ''
  const orderDate = summary.orderDate || data.orderDate || ''
  const auditDate = summary.auditDate || data.auditDate || ''
  const supplier = summary.supplier || data.supplier || {}
  const warehouse = summary.warehouse || data.warehouse || {}
  const creater = summary.creater || data.creater || {}
  const createBy = summary.createBy || data.createBy || ''

  return {
    billNo: orderNo,
    billDate: orderDate,
    auditDate,
    supplierName: supplier.name || '',
    warehouseName: warehouse.name || '',
    totalAmt,
    totalQty,
    totalAmtConverter: RMBConverter.numberToChinese(totalAmt),
    fundSourceAccount: '',
    createBy,
    inboundOperator: creater.nickName || createBy || '',
    billType: 101,
    detailList: detailList.map(item => ({
      ...item,
      unitPrice: item.price,
      unitName: item.unitName || ''
    }))
  }
}
