<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="标准分类代码" prop="category68Code">
                <el-input v-model="form.category68Code" :disabled="isDisabled" placeholder="标准分类代码" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分类名称" prop="category68Name">
                <el-input v-model="form.category68Name" placeholder="分类名称" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择上级分类" prop="parentId">
                <el-select v-model="form.parentId" placeholder="上级分类" clearable style="width: 100%">
                  <el-option
                    v-for="item in parentOptions"
                    :key="item.category68Id"
                    :label="item.category68Name"
                    :value="item.category68Id"
                    :disabled="form.category68Id && item.category68Id === form.category68Id"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
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
  name: 'Category68EditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Category68')],
  inheritAttrs: false
}
</script>
