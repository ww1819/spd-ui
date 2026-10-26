<template>
    <el-dialog title="关联发票" :visible.sync="invoiceOpen" width="560px" append-to-body>
      <div v-if="currentSuppId">
        <div class="mb8">已关联发票：</div>
        <el-table :data="linkedInvoices" border size="small" max-height="200">
          <el-table-column prop="invoiceNo" label="发票号码" width="120" />
          <el-table-column prop="invoiceDate" label="开票日期" width="110">
            <template slot-scope="scope">{{ scope.row.invoiceDate ? parseTime(scope.row.invoiceDate, '{y}-{m}-{d}') : '--' }}</template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="价税合计" width="100" align="right">
            <template slot-scope="scope">{{ scope.row.totalAmount != null ? this.formatAmount(scope.row.totalAmount) : '--' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="doRemoveInvoice(scope.row.invoiceId)" v-hasPermi="['finance:suppSettlement:linkInvoice']">取消关联</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mb8" style="margin-top: 12px;">添加关联：</div>
        <el-select v-model="selectedInvoiceId" placeholder="选择发票" filterable clearable style="width: 100%" @change="onSelectInvoice">
          <el-option v-for="item in invoiceOptions" :key="item.id" :label="item.invoiceNo + ' | ' + (item.invoiceDate || '') + ' | ' + (item.totalAmount != null ? this.formatAmount(item.totalAmount) : '')" :value="item.id" />
        </el-select>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="invoiceOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'SuppSettlementInvoiceDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SuppSettlement')],
  inheritAttrs: false
}
</script>
