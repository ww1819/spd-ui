<template>
    <el-dialog title="补全历史执行科室" :visible.sync="execDeptBackfillDialogVisible" width="520px" append-to-body @close="resetExecDeptBackfillForm">
      <el-form :model="execDeptBackfillForm" label-width="100px" size="small">
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="execDeptBackfillForm.beginDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="00:00:00"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="execDeptBackfillForm.endDate"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="yyyy-MM-dd HH:mm:ss"
            style="width:100%"
            default-time="23:59:59"
          />
        </el-form-item>
        <el-form-item label="补全范围">
          <el-checkbox v-model="execDeptBackfillForm.fetchInpatient" :disabled="!canFetchInpatient">住院</el-checkbox>
          <el-checkbox v-model="execDeptBackfillForm.fetchOutpatient" :disabled="!canFetchOutpatient" style="margin-left:16px">门诊</el-checkbox>
        </el-form-item>
        <el-form-item label="间隔天数">
          <el-input-number
            v-model="execDeptBackfillForm.chunkDays"
            :min="1"
            :max="7"
            :step="1"
            controls-position="right"
            style="width: 120px"
          />
          <span class="charge-fetch-chunk-tip">跨度较大时按此间隔自动分段补全（默认5天，最大7天）</span>
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon :title="patientChargeHisSlowHint + ' 仅更新已有收费行缺失的执行科室，不新增。'" />
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="execDeptBackfillDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="execDeptBackfillSubmitting" @click="submitExecDeptBackfill">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'PatientChargeExecDeptDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PatientChargeHis')],
  inheritAttrs: false
}
</script>
