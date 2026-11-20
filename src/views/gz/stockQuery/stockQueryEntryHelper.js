/**
 * 备货查询：服务端明细分页 VO → 表格行
 */
export function mapStockQueryEntryRow(vo, idx = 0) {
  if (!vo) {
    return null
  }
  const materialCode = vo.materialCode || ''
  return {
    id: vo.entryId != null ? vo.entryId : `row-${idx}`,
    entryId: vo.entryId,
    billKind: vo.billKind,
    billTypeName: vo.billTypeName,
    orderNo: vo.orderNo,
    orderStatus: vo.orderStatus,
    orderDate: vo.orderDate,
    auditDate: vo.auditDate,
    createBy: vo.createBy,
    updateBy: vo.updateBy || vo.auditBy,
    materialId: vo.materialId,
    materialCode,
    materialName: vo.materialName,
    specification: vo.materialSpeci,
    model: vo.materialModel,
    unitName: vo.unitName,
    factoryName: vo.factoryName,
    udiNo: vo.udiNo,
    registerNo: vo.registerNo,
    price: vo.price,
    qty: vo.qty,
    amt: vo.amt,
    batchNo: vo.batchNo,
    batchNumber: vo.batchNumber,
    beginTime: vo.beginTime,
    endTime: vo.endTime,
    inHospitalCode: vo.inHospitalCode,
    warehouse: vo.warehouseId != null || vo.warehouseName
      ? { id: vo.warehouseId, name: vo.warehouseName }
      : null,
    department: vo.departmentId != null || vo.departmentName
      ? { id: vo.departmentId, name: vo.departmentName }
      : null,
    supplier: vo.supplierId != null || vo.supplierName
      ? { id: vo.supplierId, name: vo.supplierName }
      : null,
    material: {
      code: materialCode,
      name: vo.materialName,
      speci: vo.materialSpeci,
      model: vo.materialModel,
      unitName: vo.unitName,
      udiNo: vo.udiNo,
      registerNo: vo.registerNo,
      periodDate: vo.periodDate,
      fdUnit: vo.unitName ? { unitName: vo.unitName } : null,
      fdFactory: vo.factoryName ? { factoryName: vo.factoryName } : null
    }
  }
}

/** 组装服务端查询参数（与 GzStockQueryParam 对齐） */
export function buildStockQueryParams(queryParams, extras = {}) {
  const q = queryParams || {}
  const params = {
    pageNum: Number(q.pageNum) || 1,
    pageSize: Number(q.pageSize) || 10,
    timeField: extras.timeField || 'auditDate',
    warehouseId: q.warehouseId || undefined,
    departmentId: q.departmentId || undefined,
    supplierId: q.supplierId || undefined,
    inHospitalCode: emptyToUndef(q.inHospitalCode),
    orderNo: emptyToUndef(q.orderNo),
    orderStatus: q.orderStatus != null && q.orderStatus !== '' ? q.orderStatus : undefined,
    beginDate: emptyToUndef(q.beginDate),
    endDate: emptyToUndef(q.endDate),
    materialKeyword: emptyToUndef(q.materialKeyword),
    batchNumber: emptyToUndef(q.batchNumber),
    batchNo: emptyToUndef(q.batchNo),
    udiNo: emptyToUndef(q.udiNo),
    factoryKeyword: emptyToUndef(q.factoryKeyword),
    materialSpeci: emptyToUndef(q.materialSpeci)
  }
  Object.keys(params).forEach(k => {
    if (params[k] === undefined) {
      delete params[k]
    }
  })
  return params
}

function emptyToUndef(v) {
  if (v == null) return undefined
  const s = String(v).trim()
  return s === '' ? undefined : s
}
