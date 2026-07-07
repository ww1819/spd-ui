import { runConfiguredTableExport } from '@/utils/tableExportRunner'
import { listTraceabilityEntry, listMaterialUsageReport, listTraceSummaryExecDept, listTraceSummaryApplyDept, listTraceSummarySupplier } from '@/api/gz/traceability'
import { listDepotInventory } from '@/api/gz/depotInventory'

function dash(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

function formatCurrency(vm, value) {
  if (value === null || value === undefined || value === '') return '--'
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  const filter = vm.$options.filters && vm.$options.filters.formatCurrency
  return filter ? filter(n) : n.toFixed(2)
}

function formatDate(vm, value) {
  if (!value) return '--'
  return vm.parseTime(value, '{y}-{m}-{d}')
}

function orderStatusText(row) {
  if (!row) return '--'
  if (row.orderStatus === 1 || row.parentOrderStatus === 1) return '未审核'
  if (row.orderStatus === 2 || row.parentOrderStatus === 2) return '已审核'
  return '--'
}

function formatMaterialYesNo(val) {
  if (val === null || val === undefined || val === '') return '--'
  const s = String(val).trim()
  if (s === '1' || s === 'true' || s === '是') return '是'
  if (s === '0' || s === '2' || s === 'false' || s === '否') return '否'
  return s
}

function formatVisitKind(val) {
  if (val === null || val === undefined || val === '') return '--'
  const s = String(val).trim().toUpperCase()
  if (s === 'INPATIENT' || val === '住院') return '住院'
  if (s === 'OUTPATIENT' || val === '门诊') return '门诊'
  return val
}

function buildDetailQuery(queryParams) {
  const q = {
    orderStatus: queryParams.orderStatus != null ? queryParams.orderStatus : 2,
    inHospitalCode: queryParams.inHospitalCode || null,
    materialKeyword: queryParams.materialKeyword || null,
    materialSpeci: queryParams.materialSpeci || null,
    factoryId: queryParams.factoryId || null,
    warehouseId: queryParams.warehouseId || null,
    materialNo: queryParams.materialNo || null,
    chargeCodeKeyword: queryParams.chargeCodeKeyword || null,
    hospitalNumber: queryParams.hospitalNumber || null,
    patientName: queryParams.patientName || null,
    udiKeyword: queryParams.udiKeyword || null,
    sunshineCodeKeyword: queryParams.sunshineCodeKeyword || null,
    medicalNoKeyword: queryParams.medicalNoKeyword || null,
    isBilling: queryParams.isBilling || null,
    isProcure: queryParams.isProcure || null,
    isMonitor: queryParams.isMonitor || null,
    supplierId: queryParams.supplierId || null,
    supplierKeyword: (!queryParams.supplierId && queryParams.supplierKeyword)
      ? queryParams.supplierKeyword
      : null
  }
  if (queryParams.startDate) q.startDate = queryParams.startDate
  if (queryParams.endDate) q.endDate = queryParams.endDate
  return q
}

function detailColumns(vm) {
  return [
    { label: '序号', valueGetter: (_, index) => index + 1 },
    { label: '耗材编码', valueGetter: (row) => dash(row.material && row.material.code) },
    { label: '院内码', valueGetter: (row) => dash(row.inHospitalCode || row.masterBarcode || row.mainBarcode) },
    { label: '耗材名称', valueGetter: (row) => dash((row.material && row.material.name) || row.materialName) },
    { label: '规格', valueGetter: (row) => dash((row.material && row.material.speci) || row.specification) },
    { label: '型号', valueGetter: (row) => dash((row.material && row.material.model) || row.model) },
    { label: '单位', valueGetter: (row) => dash(row.material && row.material.fdUnit && row.material.fdUnit.unitName) },
    {
      label: '数量',
      valueGetter: (row) => (row.quantity !== null && row.quantity !== undefined ? row.quantity : '--')
    },
    { label: '单价', valueGetter: (row) => formatCurrency(vm, row.chargePrice) },
    {
      label: '金额',
      valueGetter: (row) => {
        if (row.quantity == null || row.chargePrice == null) return '--'
        return (Number(row.quantity) * Number(row.chargePrice)).toFixed(2)
      }
    },
    {
      label: '生产日期',
      valueGetter: (row) => formatDate(vm, row.beginTime || row.materialDate)
    },
    { label: '有效期', valueGetter: (row) => formatDate(vm, row.expiryDate) },
    { label: '批号', valueGetter: (row) => dash(row.batchNumber || row.materialNo) },
    { label: '批次号', valueGetter: (row) => dash(row.batchNo) },
    { label: '开单科室', valueGetter: (row) => dash(row.applyDeptName) },
    { label: '执行科室', valueGetter: (row) => dash(row.execDeptName) },
    { label: '核销科室', valueGetter: (row) => dash(row.writeOffDeptName) },
    {
      label: '注册证号',
      valueGetter: (row) => dash((row.material && row.material.registerNo) || row.registerNo)
    },
    {
      label: '注册证有效期',
      valueGetter: (row) => formatDate(vm, (row.material && row.material.periodDate) || row.periodDate)
    },
    {
      label: '计费',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isBilling)
    },
    {
      label: '集采',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isProcure)
    },
    {
      label: '重点耗材',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isMonitor)
    },
    { label: '单据状态', valueGetter: (row) => orderStatusText(row) },
    {
      label: '生产厂家',
      valueGetter: (row) => dash(
        (row.material && row.material.fdFactory && row.material.fdFactory.factoryName)
        || row.manufacturer
        || row.factoryName
      )
    },
    { label: '供应商', valueGetter: (row) => dash(row.supplier && row.supplier.name) },
    { label: '收费编码', valueGetter: (row) => dash(row.chargeCode || (row.material && (row.material.hisChargeItemCode || row.material.hisChargeItemId))) },
    { label: '收费名称', valueGetter: (row) => dash(row.material && row.material.hisChargeItemName) },
    { label: '收费规格', valueGetter: (row) => dash(row.material && row.material.hisChargeItemSpeci) },
    { label: '收费单价', valueGetter: (row) => formatCurrency(vm, row.material && row.material.hisChargeItemPrice) },
    { label: '就诊类型', valueGetter: (row) => formatVisitKind(row.visitKind) },
    { label: '病人住院号/门诊号', valueGetter: (row) => dash(row.hospitalNumber) },
    { label: '病人姓名', valueGetter: (row) => dash(row.patientName) },
    { label: '病人性别', valueGetter: (row) => dash(row.patientSex) },
    { label: '手术医生', valueGetter: (row) => dash(row.chiefSurgeon) },
    { label: '手术诊断', valueGetter: (row) => dash(row.surgicalDiagnosis) },
    { label: '计费时间', valueGetter: (row) => formatDate(vm, row.billingTime) },
    {
      label: 'UDI码',
      valueGetter: (row) => dash((row.material && row.material.udiNo) || row.udiCode)
    },
    {
      label: '辅条码',
      valueGetter: (row) => dash(row.secondaryBarcode || row.auxiliaryBarcode)
    },
    { label: '扫描日期', valueGetter: (row) => formatDate(vm, row.scanDate) },
    { label: '扫描人', valueGetter: (row) => dash(row.scanUser) },
    {
      label: '阳光平台编码',
      valueGetter: (row) => dash(row.material && row.material.sunshineCode)
    },
    {
      label: '医保编码',
      valueGetter: (row) => dash((row.material && row.material.medicalNo) || row.medicalNo)
    },
    {
      label: '财务分类',
      valueGetter: (row) => dash(
        row.material && row.material.fdFinanceCategory && row.material.fdFinanceCategory.financeCategoryName
      )
    },
    {
      label: '库房分类',
      valueGetter: (row) => dash(
        row.material && row.material.fdWarehouseCategory && row.material.fdWarehouseCategory.warehouseCategoryName
      )
    },
    { label: '仓库来源', valueGetter: (row) => dash(row.warehouseName) },
    {
      label: '批次字典',
      valueGetter: (row) => `${dash(row.batchSource)} / ${dash(row.originBusinessType)}`
    }
  ]
}

function summaryColumns(vm, deptLabel, deptGetter) {
  return [
    { label: '序号', valueGetter: (_, index) => index + 1 },
    { label: deptLabel, valueGetter: deptGetter },
    { label: '耗材编码', valueGetter: (row) => dash(row.material && row.material.code) },
    { label: '耗材名称', valueGetter: (row) => dash(row.material && row.material.name) },
    { label: '规格', valueGetter: (row) => dash((row.material && row.material.speci) || row.specification) },
    { label: '型号', valueGetter: (row) => dash((row.material && row.material.model) || row.model) },
    { label: '数量', valueGetter: (row) => dash(row.quantity) },
    { label: '金额', valueGetter: (row) => formatCurrency(vm, row.amount) }
  ]
}

function execDeptSummaryColumns(vm) {
  return [
    ...summaryColumns(vm, '执行科室', (row) => dash(row.execDeptName)),
    {
      label: '生产厂家',
      valueGetter: (row) => dash(row.factoryName)
    },
    { label: '供应商', valueGetter: (row) => dash(row.supplierName) },
    {
      label: '注册证号',
      valueGetter: (row) => dash(row.material && row.material.registerNo)
    },
    {
      label: '注册证有效期',
      valueGetter: (row) => formatDate(vm, row.material && row.material.periodDate)
    },
    {
      label: '集采',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isProcure)
    }
  ]
}

export async function exportTraceSummaryExecDeptTable(vm, queryParams) {
  const columns = execDeptSummaryColumns(vm)
  return runConfiguredTableExport({
    reportTitle: '使用追溯汇总表(执行科室)',
    dateRangeKeys: { start: 'startDate', end: 'endDate' },
    query: buildDetailQuery(queryParams),
    pageSize: 500,
    mode: 'all',
    fetchPage: (params) => listTraceSummaryExecDept(params),
    sheetName: '使用追溯汇总表(执行科室)',
    columns,
    summaryRow: ({ rawRows }) => {
      const qty = rawRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const amt = rawRows.reduce((s, r) => s + Number(r.amount || 0), 0)
      const row = {}
      columns.forEach((col, idx) => {
        const label = col.label
        if (idx === 0) row[label] = '合计'
        else if (label === '数量') row[label] = qty
        else if (label === '金额') row[label] = formatCurrency(vm, amt)
        else row[label] = ''
      })
      return row
    }
  })
}

function applyDeptSummaryColumns(vm) {
  return [
    ...summaryColumns(vm, '开单科室', (row) => dash(row.applyDeptName)),
    {
      label: '生产厂家',
      valueGetter: (row) => dash(row.factoryName)
    },
    { label: '供应商', valueGetter: (row) => dash(row.supplierName) },
    {
      label: '注册证号',
      valueGetter: (row) => dash(row.material && row.material.registerNo)
    },
    {
      label: '注册证有效期',
      valueGetter: (row) => formatDate(vm, row.material && row.material.periodDate)
    },
    {
      label: '集采',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isProcure)
    }
  ]
}

export async function exportTraceSummaryApplyDeptTable(vm, queryParams) {
  const columns = applyDeptSummaryColumns(vm)
  return runConfiguredTableExport({
    reportTitle: '使用追溯汇总表(开单科室)',
    dateRangeKeys: { start: 'startDate', end: 'endDate' },
    query: buildDetailQuery(queryParams),
    pageSize: 500,
    mode: 'all',
    fetchPage: (params) => listTraceSummaryApplyDept(params),
    sheetName: '使用追溯汇总表(开单科室)',
    columns,
    summaryRow: ({ rawRows }) => {
      const qty = rawRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const amt = rawRows.reduce((s, r) => s + Number(r.amount || 0), 0)
      const row = {}
      columns.forEach((col, idx) => {
        const label = col.label
        if (idx === 0) row[label] = '合计'
        else if (label === '数量') row[label] = qty
        else if (label === '金额') row[label] = formatCurrency(vm, amt)
        else row[label] = ''
      })
      return row
    }
  })
}

function supplierSummaryColumns(vm) {
  return [
    ...summaryColumns(vm, '供应商', (row) => dash(row.supplierName)),
    {
      label: '生产厂家',
      valueGetter: (row) => dash(row.factoryName)
    },
    { label: '供应商', valueGetter: (row) => dash(row.supplierName) },
    {
      label: '注册证号',
      valueGetter: (row) => dash(row.material && row.material.registerNo)
    },
    {
      label: '注册证有效期',
      valueGetter: (row) => formatDate(vm, row.material && row.material.periodDate)
    },
    {
      label: '集采',
      valueGetter: (row) => formatMaterialYesNo(row.material && row.material.isProcure)
    }
  ]
}

export async function exportTraceSummarySupplierTable(vm, queryParams) {
  const columns = supplierSummaryColumns(vm)
  return runConfiguredTableExport({
    reportTitle: '使用追溯汇总表(供应商)',
    dateRangeKeys: { start: 'startDate', end: 'endDate' },
    query: buildDetailQuery(queryParams),
    pageSize: 500,
    mode: 'all',
    fetchPage: (params) => listTraceSummarySupplier(params),
    sheetName: '使用追溯汇总表(供应商)',
    columns,
    summaryRow: ({ rawRows }) => {
      const qty = rawRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const amt = rawRows.reduce((s, r) => s + Number(r.amount || 0), 0)
      const row = {}
      columns.forEach((col, idx) => {
        const label = col.label
        if (idx === 0) row[label] = '合计'
        else if (label === '数量') row[label] = qty
        else if (label === '金额') row[label] = formatCurrency(vm, amt)
        else row[label] = ''
      })
      return row
    }
  })
}

export async function exportTraceDetailTable(vm, queryParams) {
  const baseQuery = buildDetailQuery(queryParams)
  const columns = detailColumns(vm)
  return runConfiguredTableExport({
    reportTitle: '使用追溯明细表',
    dateRangeKeys: { start: 'startDate', end: 'endDate' },
    query: baseQuery,
    pageSize: 500,
    mode: 'all',
    fetchPage: (params) => listTraceabilityEntry(params),
    sheetName: '使用追溯明细表',
    columns,
    summaryRow: ({ rawRows }) => {
      const qty = rawRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const amt = rawRows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.chargePrice || 0), 0)
      const row = {}
      columns.forEach((col, idx) => {
        const label = col.label
        if (idx === 0) row[label] = '合计'
        else if (label === '数量') row[label] = qty
        else if (label === '金额') row[label] = amt.toFixed(2)
        else row[label] = ''
      })
      return row
    }
  })
}

export async function exportTraceSummaryTable(vm, queryParams, options) {
  const deptLabel = options.deptLabel
  const deptGetter = options.deptGetter
  const reportTitle = options.reportTitle
  const columns = summaryColumns(vm, deptLabel, deptGetter)
  return runConfiguredTableExport({
    reportTitle,
    dateRangeKeys: { start: 'materialDate', end: 'warehouseDate' },
    query: { ...queryParams },
    pageSize: 500,
    mode: 'all',
    fetchPage: (params) => listDepotInventory(params),
    sheetName: reportTitle,
    columns,
    summaryRow: ({ rawRows }) => {
      const qty = rawRows.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const amt = rawRows.reduce((s, r) => s + Number(r.amount || 0), 0)
      const row = {}
      columns.forEach((col, idx) => {
        const label = col.label
        if (idx === 0) row[label] = '合计'
        else if (label === '数量') row[label] = qty
        else if (label === '金额') row[label] = formatCurrency(vm, amt)
        else row[label] = ''
      })
      return row
    }
  })
}

export async function exportMaterialUsageReportTable(vm, queryParams, helpers) {
  const buildApiQuery = helpers.buildApiQuery
  const applyRowEditCache = helpers.applyRowEditCache
  const baseQuery = buildApiQuery()
  delete baseQuery.pageNum
  delete baseQuery.pageSize

  const columns = [
    { label: '序号', valueGetter: (_, index) => index + 1 },
    { label: '科室', valueGetter: (row) => dash(row.departmentName) },
    { label: '耗材名称', valueGetter: (row) => dash(row.materialName) },
    { label: '规格', valueGetter: (row) => dash(row.specification) },
    { label: '型号', valueGetter: (row) => dash(row.model) },
    { label: '单位', valueGetter: (row) => dash(row.unitName) },
    { label: '消耗数量', valueGetter: (row) => dash(row.consumeQty) },
    { label: '剩余数量', valueGetter: (row) => dash(row.remainQty) },
    { label: '预计下个月需求', valueGetter: (row) => dash(row.nextMonthDemand) },
    { label: '备注', valueGetter: (row) => dash(row.remark) }
  ]

  return runConfiguredTableExport({
    reportTitle: '高值耗材使用情况报表',
    dateRangeKeys: { start: 'beginDate', end: 'endDate' },
    query: {
      materialId: baseQuery.materialId,
      materialName: baseQuery.materialName,
      supplierId: baseQuery.supplierId,
      batchNo: baseQuery.batchNo,
      materialNo: baseQuery.materialNo,
      beginDate: baseQuery.beginDate,
      endDate: baseQuery.endDate
    },
    pageSize: 500,
    mode: 'all',
    fetchPage: async (params) => {
      const resp = await listMaterialUsageReport(params)
      const rows = applyRowEditCache(resp.rows || [])
      return { ...resp, rows }
    },
    sheetName: '高值耗材使用情况报表',
    columns
  })
}
