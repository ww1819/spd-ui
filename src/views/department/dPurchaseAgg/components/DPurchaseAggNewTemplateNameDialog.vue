<template>
    <!-- 维护模板名称：新建空模板 / 另存为模板 -->
    <el-dialog
      :title="templateNameDialogMode === 'saveAs' ? '另存为模板' : '维护模板名称'"
      :visible.sync="newTemplateNameDialogVisible"
      width="400px"
      append-to-body
      :modal-append-to-body="true"
      :z-index="5000"
      custom-class="purchase-template-name-dialog"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px" @submit.native.prevent>
        <el-form-item label="模板名称">
          <el-input
            v-model="newTemplateName"
            placeholder="请输入模板名称"
            clearable
            maxlength="100"
            show-word-limit
            @keyup.enter.native="confirmNewTemplateName"
          />
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
  name: 'DPurchaseAggNewTemplateNameDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DPurchaseAgg')],
  inheritAttrs: false
}
</script>
