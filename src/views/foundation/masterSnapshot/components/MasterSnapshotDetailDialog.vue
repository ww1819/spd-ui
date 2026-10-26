<template>
    <el-dialog title="变更前后（JSON）" :visible.sync="detailOpen" width="900px" append-to-body @closed="detailRow = null">
      <template v-if="detailRow">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="变更前" name="before">
            <pre class="json-block">{{ formatJson(detailRow.beforeJson) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="变更后" name="after">
            <pre class="json-block">{{ formatJson(detailRow.afterJson) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MasterSnapshotDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FoundationMasterSnapshot')],
  inheritAttrs: false
}
</script>
