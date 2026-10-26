<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="分类编码" prop="warehouseCategoryCode">
              <el-input v-model="form.warehouseCategoryCode" :disabled="isDisabled" placeholder="分类编码" />
            </el-form-item>
            <el-form-item label="分类名称" prop="warehouseCategoryName">
              <el-input v-model="form.warehouseCategoryName" placeholder="分类名称" />
            </el-form-item>
            <el-form-item label="选择上级分类" prop="parentId">
              <el-select v-model="form.parentId" placeholder="上级分类" clearable style="width: 100%">
                <el-option
                  v-for="item in parentOptions"
                  :key="item.warehouseCategoryId"
                  :label="item.warehouseCategoryName"
                  :value="item.warehouseCategoryId"
                  :disabled="form.warehouseCategoryId && item.warehouseCategoryId === form.warehouseCategoryId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="名称简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可点「更新简码」自动生成" clearable />
            </el-form-item>
            <el-form-item label="HIS系统ID" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.warehouseCategoryId"
                :placeholder="form.warehouseCategoryId ? '保存后不可修改' : (factoryImportRequiresHisId ? '衡水新增必填' : '非衡水无需填写')"
                clearable
              />
            </el-form-item>
            <el-form-item label="组织机构ID" prop="tenantId">
              <el-input v-model="form.tenantId" placeholder="保存时默认当前组织机构" disabled />
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
  name: 'WarehouseCategoryEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WarehouseCategory')],
  inheritAttrs: false
}
</script>
