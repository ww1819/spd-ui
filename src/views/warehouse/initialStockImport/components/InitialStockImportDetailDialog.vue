<template>
    <el-dialog title="期初单详情" :visible.sync="detail.visible" width="920px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="期初单号">{{ detail.form.billNo }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ detail.form.warehouse && detail.form.warehouse.name ? detail.form.warehouse.name : '--' }}</el-descriptions-item>
        <el-descriptions-item label="导入操作人">{{ detail.form.importOperator }}</el-descriptions-item>
        <el-descriptions-item label="导入时间">{{ parseTime(detail.form.importTime, '{y}-{m}-{d} {h}:{i}') }}</el-descriptions-item>
        <el-descriptions-item label="库存生成时间">{{ detail.form.stockGenTime ? parseTime(detail.form.stockGenTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag v-if="detail.form.billStatus === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="detail.form.billStatus === 1" type="success">已审核</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px; font-weight: 600;">明细</div>
      <el-table :data="detail.form.entryList || []" border size="small" max-height="320" style="margin-top: 6px;">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="产品编码" align="center" prop="material.code" min-width="100" show-overflow-tooltip />
        <el-table-column label="产品名称" align="center" prop="material.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="规格" align="center" prop="speci" width="90" show-overflow-tooltip />
        <el-table-column label="型号" align="center" prop="model" width="90" show-overflow-tooltip />
        <el-table-column label="批次号" align="center" prop="batchNo" width="140" show-overflow-tooltip />
        <el-table-column label="批号" align="center" prop="batchNumber" width="100" show-overflow-tooltip />
        <el-table-column label="单价" align="right" prop="unitPrice" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column label="数量" align="right" prop="qty" width="80">
          <template slot-scope="scope">{{ formatNum(scope.row.qty) }}</template>
        </el-table-column>
        <el-table-column label="金额" align="right" prop="amt" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.amt) }}</template>
        </el-table-column>
        <el-table-column label="生产日期" align="center" prop="beginTime" width="100" />
        <el-table-column label="效期" align="center" prop="endTime" width="100" />
        <el-table-column label="库存明细his_id" align="center" prop="hisId" min-width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="detail.visible = false">关 闭</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="handleAudit(detail.form)" v-hasPermi="['warehouse:initialStockImport:audit']" v-if="detail.form.billStatus === 0">审 核</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InitialStockImportDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InitialStockImport')],
  inheritAttrs: false
}
</script>
