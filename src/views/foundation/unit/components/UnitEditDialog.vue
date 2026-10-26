<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="单位编码">
              <el-input v-model="form.unitCode" placeholder="留空则自动生成D开头的编码" />
            </el-form-item>
            <el-form-item label="单位名称" prop="unitName">
              <el-input v-model="form.unitName" placeholder="单位名称" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch
                v-model="form.delFlag"
                :active-value="0"
                :inactive-value="1"
              />
            </el-form-item>
            <el-form-item label="组织机构ID">
              <el-input v-model="form.tenantId" disabled placeholder="保存后由系统写入" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
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
  name: 'UnitEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Unit')],
  inheritAttrs: false
}
</script>
