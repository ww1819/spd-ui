<template>
  <div class="app-container finance-invoice-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="query-form query-form-compact">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="发票号码" prop="invoiceNo" class="query-item-inline">
            <el-input v-model="queryParams.invoiceNo" placeholder="请输入发票号码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="发票代码" prop="invoiceCode" class="query-item-inline">
            <el-input v-model="queryParams.invoiceCode" placeholder="请输入发票代码" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="审核状态" prop="auditStatus" class="query-item-inline">
            <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 120px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId" />
            </div>
          </el-form-item>
          <el-form-item label="购方名称" prop="buyerName" class="query-item-inline">
            <el-input v-model="queryParams.buyerName" placeholder="购方名称" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="开票日期" class="query-item-inline">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 240px"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row class="query-row-actions">
        <el-col :span="24">
          <el-form-item label-width="0">
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="handleAdd" v-hasPermi="['finance:invoice:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="small" :disabled="single" @click="handleUpdate(selectedRow)" v-hasPermi="['finance:invoice:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="small" :disabled="multiple" @click="handleDelete" v-hasPermi="['finance:invoice:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="invoiceList" class="table-compact" @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="发票号码" align="center" prop="invoiceNo" width="120" show-overflow-tooltip />
      <el-table-column label="发票代码" align="center" prop="invoiceCode" width="120" show-overflow-tooltip />
      <el-table-column label="开票日期" align="center" prop="invoiceDate" width="110">
        <template slot-scope="scope">{{ parseTime(scope.row.invoiceDate, '{y}-{m}-{d}') }}</template>
      </el-table-column>
      <el-table-column label="金额" align="right" prop="amount" width="100">
        <template slot-scope="scope">{{ scope.row.amount != null ? Number(scope.row.amount).toFixed(2) : '--' }}</template>
      </el-table-column>
      <el-table-column label="税额" align="right" prop="taxAmount" width="100">
        <template slot-scope="scope">{{ scope.row.taxAmount != null ? Number(scope.row.taxAmount).toFixed(2) : '--' }}</template>
      </el-table-column>
      <el-table-column label="价税合计" align="right" prop="totalAmount" width="110">
        <template slot-scope="scope">{{ scope.row.totalAmount != null ? Number(scope.row.totalAmount).toFixed(2) : '--' }}</template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplierName" width="140" show-overflow-tooltip />
      <el-table-column label="购方名称" align="center" prop="buyerName" min-width="140" show-overflow-tooltip />
      <el-table-column label="销方名称" align="center" prop="sellerName" min-width="140" show-overflow-tooltip />
      <el-table-column label="审核状态" align="center" prop="auditStatus" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.auditStatus === 1 ? 'success' : 'warning'">{{ scope.row.auditStatus === 1 ? '已审核' : '待审核' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="90" show-overflow-tooltip />
      <el-table-column label="审核时间" align="center" prop="auditTime" width="160">
        <template slot-scope="scope">{{ scope.row.auditTime ? parseTime(scope.row.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['finance:invoice:edit']" :disabled="scope.row.auditStatus === 1">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['finance:invoice:audit']" v-if="scope.row.auditStatus !== 1">审核</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['finance:invoice:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="发票号码" prop="invoiceNo">
              <el-input v-model="form.invoiceNo" placeholder="请输入发票号码" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发票代码" prop="invoiceCode">
              <el-input v-model="form.invoiceCode" placeholder="请输入发票代码" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开票日期" prop="invoiceDate">
              <el-date-picker v-model="form.invoiceDate" type="date" value-format="yyyy-MM-dd" placeholder="选择开票日期" style="width: 100%" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input v-model="form.amount" placeholder="金额" type="number" :disabled="form.auditStatus === 1" @input="calcTotal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税额" prop="taxAmount">
              <el-input v-model="form.taxAmount" placeholder="税额" type="number" :disabled="form.auditStatus === 1" @input="calcTotal" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价税合计" prop="totalAmount">
              <el-input v-model="form.totalAmount" placeholder="价税合计" type="number" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="供应商" prop="supplierId">
              <SelectSupplier v-model="form.supplierId" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="购方名称" prop="buyerName">
              <el-input v-model="form.buyerName" placeholder="购方名称" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购方税号" prop="buyerTaxNo">
              <el-input v-model="form.buyerTaxNo" placeholder="购方税号" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销方名称" prop="sellerName">
              <el-input v-model="form.sellerName" placeholder="销方名称" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销方税号" prop="sellerTaxNo">
              <el-input v-model="form.sellerTaxNo" placeholder="销方税号" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="备注" :disabled="form.auditStatus === 1" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listInvoice, getInvoice, addInvoice, updateInvoice, delInvoice, auditInvoice } from '@/api/finance/invoice'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'FinanceInvoice',
  components: { SelectSupplier },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      invoiceList: [],
      title: '',
      open: false,
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        invoiceNo: undefined,
        invoiceCode: undefined,
        auditStatus: undefined,
        supplierId: undefined,
        buyerName: undefined
      },
      form: {},
      selectedRow: null,
      rules: {
        invoiceNo: [{ required: true, message: '请输入发票号码', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      if (this.dateRange && this.dateRange.length === 2) {
        params.params = {}
        params.params.beginTime = this.dateRange[0]
        params.params.endTime = this.dateRange[1]
      }
      listInvoice(params).then(res => {
        this.invoiceList = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    cancel() {
      this.open = false
      this.resetForm('form')
      this.form = {}
    },
    reset() {
      this.form = {
        id: undefined,
        invoiceNo: undefined,
        invoiceCode: undefined,
        invoiceDate: undefined,
        amount: undefined,
        taxAmount: undefined,
        totalAmount: undefined,
        supplierId: undefined,
        buyerName: undefined,
        buyerTaxNo: undefined,
        sellerName: undefined,
        sellerTaxNo: undefined,
        remark: undefined,
        auditStatus: 0
      }
      this.resetForm('form')
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增发票'
    },
    handleUpdate(row) {
      this.reset()
      const id = row && row.id ? row.id : (this.ids && this.ids[0])
      if (!id) {
        this.$modal.msgWarning('请选择一条记录')
        return
      }
      getInvoice(id).then(res => {
        this.form = res.data || {}
        this.open = true
        this.title = this.form.auditStatus === 1 ? '查看发票（已审核不可修改）' : '修改发票'
      })
    },
    calcTotal() {
      const a = parseFloat(this.form.amount)
      const t = parseFloat(this.form.taxAmount)
      if (!isNaN(a) || !isNaN(t)) {
        this.form.totalAmount = (isNaN(a) ? 0 : a) + (isNaN(t) ? 0 : t)
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return
        if (this.form.id) {
          updateInvoice(this.form).then(() => {
            this.$modal.msgSuccess('修改成功')
            this.open = false
            this.getList()
          })
        } else {
          addInvoice(this.form).then(() => {
            this.$modal.msgSuccess('新增成功')
            this.open = false
            this.getList()
          })
        }
      })
    },
    handleAudit(row) {
      const id = row.id
      this.$modal.confirm('是否确认审核该发票？审核后将不可再修改发票信息。').then(() => {
        return auditInvoice(id)
      }).then(() => {
        this.$modal.msgSuccess('审核成功')
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row && row.id ? [row.id] : this.ids
      if (!ids || !ids.length) {
        this.$modal.msgWarning('请选择要删除的记录')
        return
      }
      this.$modal.confirm('是否确认删除所选发票？').then(() => {
        return delInvoice(ids[0])
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.getList()
      }).catch(() => {})
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
      this.selectedRow = selection.length === 1 ? selection[0] : null
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    }
  }
}
</script>

<style>
/* 发票管理：与「到货验收」一致的搜索区 + 主表 + 翻页常驻（非 scoped） */
.app-container.finance-invoice-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.finance-invoice-page > .el-form.query-form-compact {
  margin-top: -12px !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .el-row {
  margin-bottom: 8px;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .el-row:last-child {
  margin-bottom: 0;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .el-form-item {
  margin-bottom: 0;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.finance-invoice-page > .el-form.query-form-compact .query-select-wrapper > * {
  width: 100%;
}

.app-container.finance-invoice-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.finance-invoice-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.finance-invoice-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.finance-invoice-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.finance-invoice-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.finance-invoice-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.finance-invoice-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.finance-invoice-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.finance-invoice-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}
</style>
