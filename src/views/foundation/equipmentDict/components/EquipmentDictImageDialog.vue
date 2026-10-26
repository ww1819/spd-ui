<template>
    <el-dialog
      title="图片预览"
      :visible.sync="imagePreviewVisible"
      width="800px"
      append-to-body
    >
      <div style="text-align: center;">
        <img :src="imagePreviewUrl" style="max-width: 100%; max-height: 600px;" alt="预览图片" />
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'EquipmentDictImageDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'EquipmentDict')],
  inheritAttrs: false
}
</script>
