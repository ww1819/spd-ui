import RMBConverter from '@/utils/tools'

/**
 * 组装出库单浏览器打印 row（与 outOrderPrint 约定一致）
 * @param {Object|null} listRow 列表行，独立页可传 null
 * @param {Object} detail getOutWarehouse 返回的 data
 */
export function buildOutboundPrintRowFromDetail(listRow, detail) {
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
