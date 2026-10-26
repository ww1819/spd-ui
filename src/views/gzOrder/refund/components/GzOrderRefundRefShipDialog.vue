<template>
    <el-dialog title="引用备货出库单（仅带科室仍有库存的明细）" :visible.sync="refShipOpen" width="800px" append-to-body>
      <el-table :data="refShipList" v-loading="refShipLoading" highlight-current-row
                @row-click="row => { refPickShipmentId = row.id; refPickShipmentNo = row.shipmentNo }" max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column label="出库单号" prop="shipmentNo" min-width="140" show-overflow-tooltip/>
        <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.department && scope.row.department.name) || '--' }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refShipOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefShipment">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderRefundRefShipDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'RefundGoods')],
  inheritAttrs: false
}
</script>
