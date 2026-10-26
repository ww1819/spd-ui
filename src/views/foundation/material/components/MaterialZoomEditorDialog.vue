<template>
    <el-dialog :title="zoomEditor.label + ' - 放大编辑'" :visible.sync="zoomEditor.visible" width="760px" append-to-body>
      <el-input
        v-model="zoomEditor.value"
        type="textarea"
        :rows="10"
        resize="none"
        placeholder="请输入内容"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="zoomEditor.visible = false">取 消</el-button>
        <el-button type="primary" @click="applyZoomEditor">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'

export default {
  name: 'MaterialZoomEditorDialog',
  mixins: [hostProxyMixin],
  inheritAttrs: false
}
</script>
