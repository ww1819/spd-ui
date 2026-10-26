<template>
    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="760px" append-to-body>
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'InWarehouseAuditJsonDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Audit' && vm.deliveryMatchDialog !== undefined)],
  inheritAttrs: false
}
</script>
