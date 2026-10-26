<template>
      <div v-if="open" class="local-modal-mask">
        <div class="local-modal-content">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="平台名称" prop="name">
                  <el-input v-model="form.name" placeholder="平台名称" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="平台编码" prop="code">
                  <el-input v-model="form.code" placeholder="平台编码" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="排序号" prop="rank">
                  <el-input v-model="form.rank" placeholder="排序号" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="form.status" placeholder="状态" style="width: 100%">
                    <el-option label="有效" value="有效"></el-option>
                    <el-option label="无效" value="无效"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <div class="dialog-footer" style="text-align:right;margin-top:16px;">
            <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
            <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
          </div>
        </div>
      </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'TestplatEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$el && vm.$el.classList && vm.$el.classList.contains('inspection-platform'))],
  inheritAttrs: false
}
</script>
