<template>
    <el-dialog
      title="编辑3D布局"
      :visible.sync="layoutDialogVisible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="layoutFormRef" :model="layoutForm" :rules="layoutFormRules" label-width="110px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="warehouseName">
              <el-input v-model.trim="layoutForm.warehouseName" placeholder="请输入仓库名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库区域" prop="areaName">
              <el-input v-model.trim="layoutForm.areaName" placeholder="请输入区域名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库长度(m)" prop="warehouseLength">
              <el-input-number v-model="layoutForm.warehouseLength" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库宽度(m)" prop="warehouseWidth">
              <el-input-number v-model="layoutForm.warehouseWidth" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域长度(m)" prop="areaLength">
              <el-input-number v-model="layoutForm.areaLength" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域宽度(m)" prop="areaWidth">
              <el-input-number v-model="layoutForm.areaWidth" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="layoutDialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="submitLayoutForm">保 存</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'SmartBoardLayoutDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'SmartWarehouseBoard')],
  inheritAttrs: false
}
</script>
