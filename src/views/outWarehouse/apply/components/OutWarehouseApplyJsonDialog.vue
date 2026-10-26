<template>
    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="760px" append-to-body>
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'OutWarehouseApplyJsonDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.rkOutDeptDialogVisible !== undefined)],
  inheritAttrs: false
}
</script>
