<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="厂家编码" prop="factoryCode">
              <el-input v-model="form.factoryCode" :disabled="isDisabled" placeholder="厂家编码（不填自动生成）" />
            </el-form-item>
            <el-form-item label="厂家名称" prop="factoryName">
              <el-input v-model="form.factoryName" @input="factoryNameChange" placeholder="厂家名称" />
            </el-form-item>
            <el-form-item label="厂家简码" prop="factoryReferredCode">
              <el-input v-model="form.factoryReferredCode" :disabled="true" placeholder="厂家名称" />
            </el-form-item>
            <el-form-item label="使用状态" prop="factoryStatus">
              <el-select v-model="form.factoryStatus" placeholder="使用状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="厂家联系方式" prop="factoryContact">
              <el-input v-model="form.factoryContact" placeholder="厂家联系方式" />
            </el-form-item>
            <el-form-item label="厂家地址" prop="factoryAddress">
              <el-input v-model="form.factoryAddress" type="textarea" :rows="2" placeholder="厂家地址" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'FactoryEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Factory')],
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
