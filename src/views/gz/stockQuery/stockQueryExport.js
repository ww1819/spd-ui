import { parseTime } from '@/utils/ruoyi'
import { exportPreviewRowsToXlsx } from '@/utils/importPreviewExport'

function text(v) {
  if (v == null || v === '') return ''
  return String(v)
}

function money(v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? n : text(v)
}

function day(v) {
  if (!v) return ''
  return parseTime(v, '{y}-{m}-{d}') || ''
}

function unitName(row) {
  if (!row) return ''
  if (row.unitName) return row.unitName
  const m = row.material
  if (!m) return ''
  if (m.fdUnit && m.fdUnit.unitName) return m.fdUnit.unitName
  if (m.unitName) return m.unitName
  if (typeof m.unit === 'string') return m.unit
  if (m.unit && m.unit.unitName) return m.unit.unitName
  if (m.unit && m.unit.name) return m.unit.name
  return ''
}

function materialCode(row) {
  return (row && (row.materialCode || (row.material && row.material.code))) || ''
}

function materialName(row) {
  return (row && (row.materialName || (row.material && row.material.name))) || ''
}

function speci(row) {
  return (row && ((row.material && row.material.speci) || row.specification)) || ''
}

function model(row) {
  return (row && ((row.material && row.material.model) || row.model)) || ''
}

function factoryName(row) {
  if (!row) return ''
  if (row.factoryName) return row.factoryName
  const f = row.material && row.material.fdFactory
  return (f && f.factoryName) || ''
}

function registerNo(row) {
  return (row && ((row.material && row.material.registerNo) || row.registerNo)) || ''
}

function periodDate(row) {
  return day(row && row.material && row.material.periodDate)
}

function udiNo(row) {
  if (!row) return ''
  const code = materialCode(row)
  if (row.udiNo && row.udiNo !== code) return row.udiNo
  const mUdi = row.material && row.material.udiNo
  if (mUdi && mUdi !== code) return mUdi
  return ''
}

function statusLabel(row, dictOptions) {
  const val = row && row.orderStatus
  if (val == null || val === '') return ''
  const list = dictOptions || []
  const hit = list.find(d => String(d.value) === String(val))
  return hit ? hit.label : String(val)
}

/** 备货入/退货表 */
export function mapInboundExportRows(rows, dictOptions) {
  return (rows || []).map((row, idx) => ({
    序号: idx + 1,
    单号: text(row.orderNo),
    仓库: text(row.warehouse && row.warehouse.name),
    供应商: text(row.supplier && row.supplier.name),
    院内码: text(row.inHospitalCode),
    产品编码: text(materialCode(row)),
    产品名称: text(materialName(row)),
    规格: text(speci(row)),
    型号: text(model(row)),
    单位: text(unitName(row)),
    单价: money(row.price),
    数量: money(row.qty),
    金额: money(row.amt),
    生产日期: day(row.beginTime),
    有效期: day(row.endTime),
    批号: text(row.batchNumber),
    批次: text(row.batchNo),
    生产厂家: text(factoryName(row)),
    注册证号: text(registerNo(row)),
    注册证有效期: periodDate(row),
    UDI码: text(udiNo(row)),
    单据状态: statusLabel(row, dictOptions),
    制单人: text(row.createBy),
    制单日期: day(row.orderDate),
    审核人: text(row.updateBy),
    审核日期: day(row.auditDate),
    单据类型: text(row.billTypeName)
  }))
}

/** 备货出/退库表 */
export function mapOutboundExportRows(rows, dictOptions) {
  return (rows || []).map((row, idx) => ({
    序号: idx + 1,
    单号: text(row.orderNo),
    仓库: text(row.warehouse && row.warehouse.name),
    科室: text(row.department && row.department.name),
    院内码: text(row.inHospitalCode),
    产品编码: text(materialCode(row)),
    产品名称: text(materialName(row)),
    规格: text(speci(row)),
    型号: text(model(row)),
    单位: text(unitName(row)),
    单价: money(row.price),
    数量: money(row.qty),
    金额: money(row.amt),
    生产日期: day(row.beginTime),
    有效期: day(row.endTime),
    批号: text(row.batchNumber),
    批次: text(row.batchNo),
    生产厂家: text(factoryName(row)),
    注册证号: text(registerNo(row)),
    注册证有效期: periodDate(row),
    UDI码: text(udiNo(row)),
    单据状态: statusLabel(row, dictOptions),
    制单人: text(row.createBy),
    制单日期: day(row.orderDate),
    审核人: text(row.updateBy),
    审核日期: day(row.auditDate),
    单据类型: text(row.billTypeName)
  }))
}

/** 跟台表 */
export function mapFollowExportRows(rows) {
  return (rows || []).map((row, idx) => ({
    序号: idx + 1,
    单号: text(row.orderNo),
    院内码: text(row.inHospitalCode),
    产品编码: text(materialCode(row)),
    产品名称: text(materialName(row)),
    规格: text(speci(row)),
    型号: text(model(row)),
    单位: text(unitName(row)),
    数量: money(row.qty),
    批号: text(row.batchNumber),
    生产日期: day(row.beginTime),
    有效期: day(row.endTime),
    注册证号: text(registerNo(row)),
    财务分类: text(row.financeCategoryName),
    库房分类: text(row.warehouseCategoryName)
  }))
}

export function exportStockQueryRows(previewRows, fileName, sheetName) {
  if (!previewRows || !previewRows.length) {
    return false
  }
  exportPreviewRowsToXlsx(previewRows, fileName, { sheetName: sheetName || '备货查询' })
  return true
}
