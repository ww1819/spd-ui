<template>
    <div v-if="changeLog.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 720px; min-width: 400px; min-height: auto; max-width: 92vw;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">科室变更记录 — {{ changeLog.deptName }}</div>
        <el-table v-loading="changeLog.loading" :data="changeLog.rows" max-height="420" size="small">
          <el-table-column label="时间" prop="changeTime" width="160" />
          <el-table-column label="操作人" prop="operator" width="100" show-overflow-tooltip />
          <el-table-column label="字段" prop="fieldLabel" width="100" show-overflow-tooltip />
          <el-table-column label="原值" prop="oldValue" min-width="120" show-overflow-tooltip />
          <el-table-column label="新值" prop="newValue" min-width="120" show-overflow-tooltip />
        </el-table>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button @click="changeLog.open = false">关 闭</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DepartChangeLogDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'depart')],
  inheritAttrs: false
}
</script>
