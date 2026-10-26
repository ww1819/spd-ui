<template>
    <el-dialog title="退消耗" :visible.sync="reverseDialogOpen" width="900px" append-to-body>
      <el-alert
        title="请输入每条明细本次反消耗数量（必须大于0且不超过可退数量）"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 10px;"
      />
      <el-table :data="reverseRows" border max-height="420px">
        <el-table-column label="来源单号" prop="srcConsumeBillNo" width="170" />
        <el-table-column label="产品名称" prop="materialName" min-width="140" />
        <el-table-column label="规格" prop="materialSpeci" width="120" />
        <el-table-column label="型号" prop="materialModel" width="120" />
        <el-table-column label="正向消耗数量" prop="srcConsumeQty" width="120" />
        <el-table-column label="可退数量" prop="canReverseQty" width="110" />
        <el-table-column label="本次退消耗数量" width="150">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.reverseQty"
              :min="0"
              :max="Number(scope.row.canReverseQty || 0)"
              :step="0.001"
              controls-position="right"
              style="width: 130px;"
            />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="reverseDialogOpen = false">取 消</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="fillReverseAll">按可退数量整单反消耗</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitReverseConsume">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'BatchConsumeReverseDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'BatchConsume')],
  inheritAttrs: false
}
</script>
