<template>
    <el-dialog title="引用备货验收单" :visible.sync="refAcceptOpen" width="900px" append-to-body @close="onRefAcceptDialogClose">
      <p style="margin:0 0 8px;color:#909399;font-size:13px">
        出库仓库：已锁定为表头仓库；<span v-if="form.departmentId">申请科室已锁定为表头科室</span><span v-else>未选科室时不按科室过滤</span>。
      </p>
      <el-tabs v-model="refTabStatus" @tab-click="loadRefAcceptList">
        <el-tab-pane label="未引用" name="0" />
        <el-tab-pane label="部分引用" name="1" />
        <el-tab-pane label="已引用" name="2" />
      </el-tabs>
      <el-table :data="refAcceptList" v-loading="refLoading" highlight-current-row
                @current-change="onRefAcceptRowChange"
                max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column prop="orderNo" label="验收单号" min-width="140" show-overflow-tooltip/>
        <el-table-column label="申请科室" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.applyDepartment && scope.row.applyDepartment.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="可引条码数" width="100" align="center" prop="refAvailableCount"/>
        <el-table-column label="引用状态" width="90" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.shipmentRefStatus === 2">已引用</span>
            <span v-else-if="scope.row.shipmentRefStatus === 1">部分引用</span>
            <span v-else>未引用</span>
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="110" align="center">
          <template slot-scope="scope">{{ formatDisplayDateTime(scope.row.auditDate, scope.row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refAcceptOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefAcceptance">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderAuditRefAcceptDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'OrderAudit')],
  inheritAttrs: false
}
</script>
