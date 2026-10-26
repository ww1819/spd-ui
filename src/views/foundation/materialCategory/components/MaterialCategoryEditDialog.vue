<template>
    <div v-if="open" class="material-category-drawer-mask" @click.self="cancel">
      <div class="material-category-drawer-panel" @click.stop>
        <div class="material-category-drawer-header">
          <span class="material-category-drawer-title">{{ title }}</span>
          <i class="el-icon-close material-category-drawer-close" @click="cancel" />
        </div>
        <div class="material-category-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="分类编码" prop="materialCategoryCode">
              <el-input v-model="form.materialCategoryCode" :disabled="isDisabled" placeholder="分类编码" />
            </el-form-item>
            <el-form-item label="分类名称" prop="materialCategoryName">
              <el-input v-model="form.materialCategoryName" placeholder="分类名称" />
            </el-form-item>
            <el-form-item label="拼音简码" prop="pinyinCode">
              <el-input v-model="form.pinyinCode" placeholder="自动生成" disabled />
            </el-form-item>
            <el-form-item label="分类地址" prop="materialCategoryAddress">
              <el-input v-model="form.materialCategoryAddress" type="textarea" :rows="2" placeholder="分类地址" />
            </el-form-item>
            <el-form-item label="联系方式" prop="materialCategoryContact">
              <el-input v-model="form.materialCategoryContact" placeholder="联系方式" />
            </el-form-item>
          </el-form>
        </div>
        <div class="material-category-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MaterialCategoryEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'MaterialCategory')],
  inheritAttrs: false
}
</script>
