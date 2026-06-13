import { runConfiguredTableExport } from '@/utils/tableExportRunner'
import { listTraceabilityEntry, listMaterialUsageReport } from '@/api/gz/traceability'
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

function buildDetailQuery(queryParams) {
  const q = {
    traceNo: queryParams.traceNo || null,
    orderStatus: queryParams.orderStatus != null ? queryParams.orderStatus : 2,
    batchNo: queryParams.batchNo || null,
    materialNo: queryParams.materialNo || null
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
    { label: '仓库来源', valueGetter: (row) => dash(row.warehouseName) },
    {
      label: '批次字典',
      valueGetter: (row) => `${dash(row.batchSource)} / ${dash(row.originBusinessType)}`
    },
    {
      label: '生产日期',
      valueGetter: (row) => formatDate(vm, row.beginTime || row.materialDate)
    },
    { label: '有效期', valueGetter: (row) => formatDate(vm, row.expiryDate) },
    { label: '批号', valueGetter: (row) => dash(row.batchNumber || row.materialNo) },
    { label: '批次号', valueGetter: (row) => dash(row.batchNo) },
    {
      label: '注册证号',
      valueGetter: (row) => dash((row.material && row.material.registerNo) || row.registerNo)
    },
    {
      label: '注册证有效期',
      valueGetter: (row) => formatDate(vm, (row.material && row.material.periodDate) || row.periodDate)
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
    { label: '收费编码', valueGetter: (row) => dash(row.chargeCode) },
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
