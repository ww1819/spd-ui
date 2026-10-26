<template>
    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="860px">
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonViewer.visible = false">关 闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderAuditJsonDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'OrderAudit')],
  inheritAttrs: false
}
</script>
