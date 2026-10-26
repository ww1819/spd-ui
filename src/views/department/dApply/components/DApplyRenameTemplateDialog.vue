<template>
    <!-- 双击模板：修改模板名称小窗（仅改内存，点主弹窗保存按钮才提交） -->
    <el-dialog title="修改模板名称" :visible.sync="renameTemplateDialogVisible" width="400px" append-to-body :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="renameTemplateName" placeholder="请输入模板名称" clearable maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="renameTemplateDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRenameTemplate">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyRenameTemplateDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  inheritAttrs: false
}
</script>
