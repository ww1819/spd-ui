import RMBConverter from '@/utils/tools'

function resolveUserKeyFromList(userList, rawKey) {
  if (rawKey == null || String(rawKey).trim() === '' || !Array.isArray(userList) || !userList.length) {
    return ''
  }
  const key = String(rawKey).trim()
  const isNumericId = /^\d+$/.test(key)
  let user = null
  if (isNumericId) {
    user = userList.find(u => String(u.userId) === key || u.userId == key)
  }
  if (!user) {
    user = userList.find(u =>
      String(u.userName) === key ||
      (u.nickName != null && String(u.nickName) === key)
    )
  }
  if (user) {
    return user.nickName || user.userName || ''
  }
  return ''
}

function resolveUserDisplayName(userObj, nameCandidates, userList) {
  const user = userObj || {}
  const candidates = [
    user.nickName,
    user.userName,
    ...(nameCandidates || [])
  ]
  for (const c of candidates) {
    if (c == null || String(c).trim() === '') continue
    const text = String(c).trim()
    if (!/^\d+$/.test(text)) return text
    const fromList = resolveUserKeyFromList(userList, text)
    if (fromList) return fromList
  }
  return user.nickName || user.userName || ''
}

function resolveInboundOperator(summary, data, userList) {
  const s = summary || {}
  const d = data || {}
  return resolveUserDisplayName(s.creater || d.creater, [s.createrName, d.createrName, s.createBy, d.createBy], userList)
}

function resolveAuditorName(summary, data, userList) {
  const s = summary || {}
  const d = data || {}
  const auditKey = s.auditBy || d.auditBy || s.updateBy || d.updateBy
  const fromUser = resolveUserDisplayName(s.auditor || d.auditor, [auditKey], userList)
  if (fromUser && !/^\d+$/.test(fromUser)) {
    return fromUser
  }
  return resolveUserKeyFromList(userList, auditKey) || fromUser
}

export function buildGzAcceptancePrintRowFromDetail(summaryRow, detailData, printKind, userList, extra = {}) {
  const summary = summaryRow || {}
  const data = detailData || {}
  const extras = extra || {}
  const isShipment = printKind === 'shipment'
    || String(summary.orderType || data.orderType || data.shipmentType || '') === '102'
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

  const orderNo = summary.orderNo || data.orderNo || ''
  const orderDate = summary.orderDate || data.orderDate || ''
  const auditDate = summary.auditDate || data.auditDate || ''
  const supplier = summary.supplier || data.supplier || {}
  const warehouse = summary.warehouse || data.warehouse || {}
  const department = summary.department || data.department || {}
  const createBy = summary.createBy || data.createBy || ''
  const warehouseName = extras.warehouseName || summary.warehouseName || data.warehouseName || warehouse.name || ''
  const departmentName = extras.departmentName || summary.departmentName || data.departmentName || department.name || ''
  const supplierName = extras.supplierName || summary.supplierName || data.supplierName || supplier.name || ''

  return {
    billNo: orderNo,
    billDate: orderDate,
    auditDate,
    supplierName: isShipment ? departmentName : supplierName,
    departmentName,
    warehouseName,
    totalAmt,
    totalQty,
    totalAmtConverter: RMBConverter.numberToChinese(totalAmt),
    fundSourceAccount: '',
    createBy,
    inboundOperator: isShipment ? resolveAuditorName(summary, data, userList) : resolveInboundOperator(summary, data, userList),
    billType: isShipment ? 102 : 101,
    printKind: isShipment ? 'shipment' : 'order',
    detailList: detailList.map(item => ({
      ...item,
      unitPrice: item.price,
      unitName: item.unitName || ''
    }))
  }
}
