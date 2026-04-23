<template>
  <div class="app-container finance-settlement-summary">
    <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="审核日期">
        <el-date-picker
          v-model="queryParams.beginDate"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="起始"
          clearable
          style="width: 140px"
        />
        <span style="margin: 0 6px">至</span>
        <el-date-picker
          v-model="queryParams.endDate"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="截止"
          clearable
          style="width: 140px"
        />
      </el-form-item>
      <el-form-item label="业务单号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="单号模糊" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <SelectWarehouse v-model="queryParams.warehouseId" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="科室" prop="departmentId">
        <SelectDepartment v-model="queryParams.departmentId" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="供应商" prop="supplerId">
        <SelectSupplier v-model="queryParams.supplerId" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="耗材" prop="materialNameLike">
        <el-input v-model="queryParams.materialNameLike" placeholder="名称/编码/简码" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['finance:settlementSummary:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="loadData" />
    </el-row>

    <div class="summary-title">{{ titleText }}</div>
    <el-table
      v-loading="loading"
      :data="tableRows"
      border
      size="small"
      :span-method="objectSpanMethod"
      :row-class-name="tableRowClassName"
      style="width: 100%; max-width: 1100px"
    >
      <el-table-column prop="category" label="分类" align="center" width="120" />
      <el-table-column prop="supplierName" label="供货单位" align="left" min-width="280" show-overflow-tooltip />
      <el-table-column prop="wholesaleAmt" label="批发金额" align="right" width="140">
        <template slot-scope="scope">
          <span :class="{ 'subtotal-row': scope.row.isSubtotal }">{{ formatAmt(scope.row.wholesaleAmt) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="retailAmt" label="零售金额" align="right" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.retailAmt || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="outBillCount" label="出库单数" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.outBillCount || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" align="left" min-width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.remark || '' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <p class="hint-text">
      统计口径：已审核出退库（出库 201 金额为正、退库 401 为负）；批发金额 = 单价×数量；产品档案库房分类 11、12 归为「材料」，13 归为「试剂」；分类未维护或非 11/12/13 的归为「未识别分类」，便于补全产品档案库房分类。零售金额、出库单数、备注不填。
    </p>
  </div>
</template>

<script>
import { getSettlementSummaryData } from '@/api/finance/settlementSummary'
import { exportFinanceSettlementSummaryXlsx } from '@/utils/financeSettlementSummaryExport'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import RightToolbar from '@/components/RightToolbar'

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

/** 默认审核区间：当月 1 日～当天（yyyy-MM-dd，与浏览器本地日期一致） */
function getDefaultFinanceAuditDateRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  return {
    beginDate: `${y}-${pad2(m)}-01`,
    endDate: `${y}-${pad2(m)}-${pad2(d)}`,
  }
}

export default {
  name: 'FinanceSettlementSummary',
  components: { SelectWarehouse, SelectDepartment, SelectSupplier, RightToolbar },
  data() {
    return {
      loading: false,
      showSearch: true,
      queryParams: {
        ...getDefaultFinanceAuditDateRange(),
        billNo: null,
        warehouseId: null,
        departmentId: null,
        supplerId: null,
        materialNameLike: null,
      },
      bundle: {
        materialSuppliers: [],
        materialWholesaleTotal: 0,
        reagentSuppliers: [],
        reagentWholesaleTotal: 0,
        unrecognizedSuppliers: [],
        unrecognizedWholesaleTotal: 0,
      },
      tableRows: [],
    }
  },
  computed: {
    titleText() {
      const b = this.queryParams.beginDate || ''
      const e = this.queryParams.endDate || ''
      if (b && e) return `财务结算表汇总（${b} 至 ${e}）`
      if (b) return `财务结算表汇总（${b} 起）`
      return '财务结算表汇总'
    },
  },
  created() {
    this.loadData()
  },
  methods: {
    formatAmt(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      if (Number.isNaN(n)) return v
      return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    buildTableRows(data) {
      const rows = []
      const pushSection = (cat, list, total) => {
        if (!list || !list.length) return
        const n = list.length
        list.forEach((r, i) => {
          rows.push({
            category: cat,
            categoryRowspan: i === 0 ? n + 1 : 0,
            supplierName: r.supplierName,
            wholesaleAmt: r.wholesaleAmt,
            retailAmt: '',
            outBillCount: '',
            remark: '',
            isSubtotal: false,
          })
        })
        rows.push({
          category: cat,
          categoryRowspan: 0,
          supplierName: '△合计',
          wholesaleAmt: total,
          retailAmt: '',
          outBillCount: '',
          remark: '',
          isSubtotal: true,
        })
      }
      pushSection('材料', data.materialSuppliers, data.materialWholesaleTotal)
      pushSection('试剂', data.reagentSuppliers, data.reagentWholesaleTotal)
      pushSection('未识别分类', data.unrecognizedSuppliers, data.unrecognizedWholesaleTotal)
      return rows
    },
    tableRowClassName({ row }) {
      if (row && row.category === '未识别分类' && !row.isSubtotal) {
        return 'row-unrecognized-category'
      }
      if (row && row.category === '未识别分类' && row.isSubtotal) {
        return 'row-unrecognized-subtotal'
      }
      return ''
    },
    objectSpanMethod({ column, rowIndex, columnIndex }) {
      if (columnIndex !== 0) {
        return { rowspan: 1, colspan: 1 }
      }
      const row = this.tableRows[rowIndex]
      if (!row) return { rowspan: 1, colspan: 1 }
      if (row.categoryRowspan > 0) {
        return { rowspan: row.categoryRowspan, colspan: 1 }
      }
      return { rowspan: 0, colspan: 0 }
    },
    /** 请求参数：截止日期带上当天 23:59:59，与后端 audit_date 时分对齐 */
    buildApiQueryParams() {
      const p = { ...this.queryParams }
      if (p.endDate != null && p.endDate !== '') {
        const s = String(p.endDate).trim()
        if (s.length === 10 && !s.includes(' ')) {
          p.endDate = `${s} 23:59:59`
        }
      }
      return p
    },
    loadData() {
      this.loading = true
      getSettlementSummaryData(this.buildApiQueryParams())
        .then((res) => {
          const data = (res && res.data) || {}
          this.bundle = {
            materialSuppliers: data.materialSuppliers || [],
            materialWholesaleTotal: data.materialWholesaleTotal,
            reagentSuppliers: data.reagentSuppliers || [],
            reagentWholesaleTotal: data.reagentWholesaleTotal,
            unrecognizedSuppliers: data.unrecognizedSuppliers || [],
            unrecognizedWholesaleTotal: data.unrecognizedWholesaleTotal,
          }
          this.tableRows = this.buildTableRows(this.bundle)
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleQuery() {
      this.loadData()
    },
    resetQuery() {
      const dr = getDefaultFinanceAuditDateRange()
      Object.assign(this.queryParams, {
        beginDate: dr.beginDate,
        endDate: dr.endDate,
        billNo: null,
        warehouseId: null,
        departmentId: null,
        supplerId: null,
        materialNameLike: null,
      })
      this.$refs.queryForm && this.$refs.queryForm.clearValidate()
      this.handleQuery()
    },
    async handleExport() {
      await exportFinanceSettlementSummaryXlsx({
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        materialSuppliers: this.bundle.materialSuppliers,
        materialWholesaleTotal: this.bundle.materialWholesaleTotal,
        reagentSuppliers: this.bundle.reagentSuppliers,
        reagentWholesaleTotal: this.bundle.reagentWholesaleTotal,
        unrecognizedSuppliers: this.bundle.unrecognizedSuppliers,
        unrecognizedWholesaleTotal: this.bundle.unrecognizedWholesaleTotal,
        fileName: `财务结算汇总_${this.queryParams.beginDate || ''}_${this.queryParams.endDate || ''}_${Date.now()}.xlsx`,
      })
    },
  },
}
</script>

<style scoped>
.summary-title {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 12px 0 16px;
}
.subtotal-row {
  font-weight: 600;
}
.hint-text {
  color: #909399;
  font-size: 12px;
  margin-top: 16px;
  line-height: 1.6;
  max-width: 1100px;
}
</style>

<style>
/* 非 scoped：el-table 行 class 挂在 tr 上 */
.finance-settlement-summary .row-unrecognized-category td {
  background-color: #fff8e6 !important;
}
.finance-settlement-summary .row-unrecognized-subtotal td {
  background-color: #fff3cc !important;
}
</style>
