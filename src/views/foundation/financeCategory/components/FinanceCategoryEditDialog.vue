<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="财务类别编码" prop="financeCategoryCode">
              <el-input v-model="form.financeCategoryCode" :disabled="isDisabled" placeholder="请输入编码" />
            </el-form-item>
            <el-form-item label="财务类别名称" prop="financeCategoryName">
              <el-input v-model="form.financeCategoryName" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="名称简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可点「更新简码」生成" clearable />
            </el-form-item>
            <el-form-item label="使用状态" prop="isUse">
              <el-select v-model="form.isUse" placeholder="使用状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="HIS系统ID" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.financeCategoryId"
                :placeholder="form.financeCategoryId ? '保存后不可修改' : (factoryImportRequiresHisId ? '衡水新增必填' : '非衡水无需填写')"
                clearable
              />
            </el-form-item>
            <el-form-item label="地址" prop="financeCategoryAddress">
              <el-input v-model="form.financeCategoryAddress" placeholder="地址" clearable />
            </el-form-item>
            <el-form-item label="联系方式" prop="financeCategoryContact">
              <el-input v-model="form.financeCategoryContact" placeholder="联系方式" clearable />
            </el-form-item>
            <el-form-item label="组织机构ID" prop="tenantId">
              <el-input v-model="form.tenantId" disabled placeholder="保存时默认当前组织机构" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'FinanceCategoryEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FinanceCategory')],
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
