<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="周期名称" prop="name">
            <el-input v-model="form.name" placeholder="如：2026年第一批集采" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="开始年月" prop="startYm">
                <el-date-picker
                  v-model="form.startYm"
                  type="month"
                  value-format="yyyy-MM"
                  placeholder="选择开始年月"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束年月" prop="endYm">
                <el-date-picker
                  v-model="form.endYm"
                  type="month"
                  value-format="yyyy-MM"
                  placeholder="选择结束年月"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="使用状态" prop="isUse">
            <el-select v-model="form.isUse" placeholder="使用状态" style="width: 220px">
              <el-option v-for="dict in dict.type.is_use_status" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
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

export default {
  name: 'JcPeriodEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'JcPeriod')],
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
