<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="单号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="供应商结算单单号" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="供应商" prop="supplierId">
        <SelectSupplier v-model="queryParams.supplierId" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 100px">
          <el-option label="待审核" :value="0" />
          <el-option label="已审核" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" border>
      <el-table-column label="单号" align="center" prop="billNo" width="160" show-overflow-tooltip />
      <el-table-column label="供应商" align="center" prop="supplierName" width="140" show-overflow-tooltip />
      <el-table-column label="制单人" align="center" prop="createBy" width="90" />
      <el-table-column label="制单时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="审核状态" align="center" prop="auditStatus" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.auditStatus === 1 ? 'success' : 'warning'">{{ scope.row.auditStatus === 1 ? '已审核' : '待审核' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="90" />
      <el-table-column label="审核时间" align="center" prop="auditTime" width="160">
        <template slot-scope="scope">{{ scope.row.auditTime ? parseTime(scope.row.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleDetail(scope.row)" v-hasPermi="['finance:suppSettlement:query']">详情</el-button>
          <el-button size="mini" type="text" icon="el-icon-link" @click="handleInvoices(scope.row)" v-hasPermi="['finance:suppSettlement:linkInvoice']">关联发票</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 详情弹窗 -->
    <el-dialog title="供应商结算单详情" :visible.sync="detailOpen" width="900px" append-to-body>
      <el-descriptions :column="2" border size="small" v-if="detailRow">
        <el-descriptions-item label="单号">{{ detailRow.billNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="制单人">{{ detailRow.createBy }}</el-descriptions-item>
        <el-descriptions-item label="制单时间">{{ detailRow.createTime ? parseTime(detailRow.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ detailRow.auditStatus === 1 ? '已审核' : '待审核' }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detailRow.auditBy }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detailRow.auditTime ? parseTime(detailRow.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px;"><strong>明细</strong></div>
      <el-table :data="detailRow && detailRow.entryList || []" border size="small" max-height="300">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="whSettlementBillNo" label="仓库结算单单号" width="150" show-overflow-tooltip />
        <el-table-column prop="materialName" label="耗材名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="speci" label="规格" width="90" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.unitPrice != null ? Number(scope.row.unitPrice).toFixed(4) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="amt" label="金额" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.amt != null ? Number(scope.row.amt).toFixed(2) : '--' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 关联发票弹窗 -->
    <el-dialog title="关联发票" :visible.sync="invoiceOpen" width="560px" append-to-body>
      <div v-if="currentSuppId">
        <div class="mb8">已关联发票：</div>
        <el-table :data="linkedInvoices" border size="small" max-height="200">
          <el-table-column prop="invoiceNo" label="发票号码" width="120" />
          <el-table-column prop="invoiceDate" label="开票日期" width="110">
            <template slot-scope="scope">{{ scope.row.invoiceDate ? parseTime(scope.row.invoiceDate, '{y}-{m}-{d}') : '--' }}</template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="价税合计" width="100" align="right">
            <template slot-scope="scope">{{ scope.row.totalAmount != null ? Number(scope.row.totalAmount).toFixed(2) : '--' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="doRemoveInvoice(scope.row.invoiceId)" v-hasPermi="['finance:suppSettlement:linkInvoice']">取消关联</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mb8" style="margin-top: 12px;">添加关联：</div>
        <el-select v-model="selectedInvoiceId" placeholder="选择发票" filterable clearable style="width: 100%" @change="onSelectInvoice">
          <el-option v-for="item in invoiceOptions" :key="item.id" :label="item.invoiceNo + ' | ' + (item.invoiceDate || '') + ' | ' + (item.totalAmount != null ? Number(item.totalAmount).toFixed(2) : '')" :value="item.id" />
        </el-select>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSuppSettlement, getSuppSettlement, listInvoices, addInvoiceLink, removeInvoiceLink } from '@/api/finance/suppSettlement'
import { listInvoice } from '@/api/finance/invoice'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'SuppSettlement',
  components: { SelectSupplier },
  data() {
    return {
      loading: false,
      showSearch: true,
      list: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: undefined,
        supplierId: undefined,
        auditStatus: undefined
      },
      detailOpen: false,
      detailRow: null,
      invoiceOpen: false,
      currentSuppId: null,
      linkedInvoices: [],
      invoiceOptions: [],
      selectedInvoiceId: null
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listSuppSettlement(this.queryParams).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleDetail(row) {
      getSuppSettlement(row.id).then(res => {
        this.detailRow = res.data || {}
        this.detailOpen = true
      })
    },
    handleInvoices(row) {
      this.currentSuppId = row.id
      this.linkedInvoices = []
      this.invoiceOptions = []
      this.selectedInvoiceId = null
      this.invoiceOpen = true
      Promise.all([listInvoices(row.id), listInvoice({ pageNum: 1, pageSize: 500 })]).then(([linkRes, listRes]) => {
        const linked = linkRes.data || []
        const allInvoices = listRes.rows || []
        this.linkedInvoices = linked.map(l => {
          const inv = allInvoices.find(i => i.id === l.invoiceId)
          return { ...l, invoiceNo: inv ? inv.invoiceNo : l.invoiceId, invoiceDate: inv ? inv.invoiceDate : null, totalAmount: inv ? inv.totalAmount : null }
        })
        this.invoiceOptions = allInvoices.filter(i => !linked.some(l => l.invoiceId === i.id))
      })
    },
    onSelectInvoice(invoiceId) {
      if (!invoiceId) return
      addInvoiceLink(this.currentSuppId, invoiceId).then(() => {
        this.$modal.msgSuccess('关联成功')
        return listInvoices(this.currentSuppId)
      }).then(res => {
        this.linkedInvoices = res.data || []
        this.invoiceOptions = this.invoiceOptions.filter(i => i.id !== invoiceId)
        this.selectedInvoiceId = null
      })
    },
    doRemoveInvoice(invoiceId) {
      this.$modal.confirm('确认取消关联该发票？').then(() => {
        return removeInvoiceLink(this.currentSuppId, invoiceId)
      }).then(() => {
        this.$modal.msgSuccess('已取消关联')
        return Promise.all([listInvoices(this.currentSuppId), listInvoice({ pageNum: 1, pageSize: 500 })])
      }).then(([linkRes, listRes]) => {
        const linked = linkRes.data || []
        const allInvoices = listRes.rows || []
        this.linkedInvoices = linked.map(l => {
          const inv = allInvoices.find(i => i.id === l.invoiceId)
          return { ...l, invoiceNo: inv ? inv.invoiceNo : l.invoiceId, invoiceDate: inv ? inv.invoiceDate : null, totalAmount: inv ? inv.totalAmount : null }
        })
        this.invoiceOptions = allInvoices.filter(i => !linked.some(l => l.invoiceId === i.id))
      }).catch(() => {})
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    }
  }
}
</script>
