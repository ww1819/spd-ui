<template>
    <!-- 未选模板时点新增：维护模板名称小窗，确定后创建空模板并选中 -->
    <el-dialog title="维护模板名称" :visible.sync="newTemplateNameDialogVisible" width="400px" append-to-body :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="newTemplateName" placeholder="请输入模板名称" clearable maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="closeNewTemplateNameDialog">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmNewTemplateName">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyNewTemplateNameDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  inheritAttrs: false
}
</script>
