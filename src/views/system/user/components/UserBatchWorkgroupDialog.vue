<template>
    <!-- 批量设置耗材工作组 -->
    <el-dialog title="批量设置工作组" :visible.sync="batchWorkgroupOpen" width="440px" append-to-body @close="batchPostId = undefined">
      <p style="color:#909399; margin: 0 0 12px; line-height: 1.5;">
        当前查询共 <b>{{ total }}</b> 人；已跨页选中 <b>{{ crossPageSelectedCount }}</b> 人。提交时可选择仅更新选中或更新全部查询结果，将统一设置为所选耗材工作组（覆盖每人原有 sys_user_post 关联）。
      </p>
      <el-form label-width="88px" size="small">
        <el-form-item label="工作组" required>
          <el-select v-model="batchPostId" placeholder="请选择工作组" clearable filterable style="width: 100%;">
            <el-option
              v-for="p in workgroupList"
              :key="p.postId"
              :label="p.postName"
              :value="p.postId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="batchWorkgroupOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="batchWorkgroupLoading" @click="submitBatchWorkgroup">确 定</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'UserBatchWorkgroupDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'User')],
  inheritAttrs: false
}
</script>
