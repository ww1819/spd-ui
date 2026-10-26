<template>
    <el-dialog title="调用结果" :visible.sync="resultVisible" width="70%" append-to-body>
      <pre class="result-pre">{{ resultText }}</pre>
      <div slot="footer">
        <el-button type="primary" @click="copyResult">复制 JSON</el-button>
        <el-button @click="resultVisible = false">关闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MsunProbeResultDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'MsunHisProbe')],
  inheritAttrs: false
}
</script>
