<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="110px">
          <el-form-item label="集采周期" prop="periodId">
            <el-select v-model="form.periodId" placeholder="请选择周期" filterable style="width: 100%" :disabled="!!form.id">
              <el-option
                v-for="item in periodOptions"
                :key="item.id"
                :label="formatPeriodLabel(item)"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="currentMode === 'PRODUCT'" label="耗材" prop="materialId">
            <SelectMaterial v-model="form.materialId" :value2="!!form.id" />
          </el-form-item>
          <el-form-item v-if="currentMode === 'TYPE'" label="集采类型" prop="jcTypeId">
            <SelectJcType v-model="form.jcTypeId" :disabled="!!form.id" />
          </el-form-item>
          <el-form-item label="报量数" prop="reportQty">
            <el-input-number v-model="form.reportQty" :min="0" :step="0.001" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
          </el-form-item>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectMaterial from '@/components/SelectModel/SelectMaterial'
import SelectJcType from '@/components/SelectModel/SelectJcType'

export default {
  name: 'JcReportEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'JcReport')],
  components: { SelectMaterial, SelectJcType },
  inheritAttrs: false
}
</script>
