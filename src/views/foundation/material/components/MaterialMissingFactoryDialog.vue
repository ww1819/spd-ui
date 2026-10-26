<template>
    <el-dialog
      title="系统中没有以下生产厂家"
      :visible.sync="missingFactoryDialog.visible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <p style="margin:0 0 12px;color:#606266;line-height:1.6;">
        请勾选需要创建的厂家，确定后写入厂家档案。未勾选的下次导入仍会提示。
      </p>
      <el-table
        ref="missingFactoryTable"
        :data="missingFactoryDialog.list"
        border
        max-height="360"
        size="small"
        @selection-change="onMissingFactorySelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="name" label="生产厂家" min-width="280" show-overflow-tooltip />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="missingFactoryDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="missingFactoryDialog.loading" @click="confirmCreateMissingFactories">确定创建</el-button>
      </span>
    </el-dialog>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'

export default {
  name: 'MaterialMissingFactoryDialog',
  mixins: [hostProxyMixin],
  inheritAttrs: false
}
</script>
