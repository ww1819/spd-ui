<template>
    <el-dialog title="查看采购计划" :visible.sync="planViewDialogVisible" width="95%" append-to-body>
      <div v-if="planDetail" class="plan-view-header" style="display:flex;flex-wrap:wrap;gap:16px 24px;margin-bottom:12px;">
        <span><strong>计划单号：</strong>{{ planDetail.planNo || '--' }}</span>
        <span><strong>仓库：</strong>{{ planDetail.warehouse && planDetail.warehouse.name ? planDetail.warehouse.name : '--' }}</span>
        <span><strong>制单人：</strong>{{ planDetail.createByName || '--' }}</span>
        <span><strong>制单时间：</strong>{{ planDetail.createTime ? parseTime(planDetail.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        <span><strong>提交人：</strong>{{ planDetail.updateByName || '--' }}</span>
        <span><strong>提交时间：</strong>{{ planDetail.updateTime ? parseTime(planDetail.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        <span><strong>审核人：</strong>{{ planDetail.auditByName || '--' }}</span>
        <span><strong>审核时间：</strong>{{ planDetail.auditDate ? parseTime(planDetail.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
      </div>
      <el-table v-if="planDetail && planDetail.purchasePlanEntryList" :data="planDetail.purchasePlanEntryList" border max-height="420">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="产品编码" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.stockQty != null ? scope.row.stockQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单数量" prop="qty" width="100" align="right" />
        <el-table-column label="单价" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.price != null ? formatPrice4(scope.row.price) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.amt != null ? formatPrice4(scope.row.amt) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="包装规格" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="planViewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PurchasePublishPlanViewDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseOrderAudit' && vm.$el && vm.$el.classList && vm.$el.classList.contains('caigou-publish-page'))],
  inheritAttrs: false
}
</script>
