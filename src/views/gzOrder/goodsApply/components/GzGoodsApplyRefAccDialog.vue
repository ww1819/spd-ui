<template>
    <el-dialog title="引用备货验收单（当前仓库有库存且供应商一致）" :visible.sync="refAccThOpen" width="800px" append-to-body>
      <el-table :data="refAccThList" v-loading="refAccThLoading" highlight-current-row
                @row-click="row => { refPickAccOrderId = row.id; refPickAccOrderNo = row.orderNo }" max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column prop="orderNo" label="验收单号" min-width="140" show-overflow-tooltip/>
        <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refAccThOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefAcceptanceTh">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzGoodsApplyRefAccDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Goods')],
  inheritAttrs: false
}
</script>
