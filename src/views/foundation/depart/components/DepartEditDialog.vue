<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="科室编码" prop="code">
              <el-input v-model="form.code" placeholder="科室编码" />
            </el-form-item>
            <el-form-item label="科室名称" prop="name">
              <el-input v-model="form.name" placeholder="科室名称" />
            </el-form-item>
            <el-form-item label="简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可留空，保存后可用「更新简码」生成" />
            </el-form-item>
            <el-form-item label="HIS科室编码" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.id || !departImportRequiresHisDeptId"
                :placeholder="hisThirdPartyPlaceholder"
              />
            </el-form-item>
            <el-form-item label="院区" prop="campus">
              <el-input v-model="form.campus" placeholder="可手工维护，非必填" clearable maxlength="128" />
            </el-form-item>
            <el-form-item label="备注" prop="deptRemark">
              <el-input v-model="form.deptRemark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
            <el-form-item label="上级科室" prop="parentId">
              <treeselect
                v-model="form.parentId"
                :options="parentTreeselectOptions"
                :normalizer="normalizerDept"
                placeholder="不选表示客户下顶级科室"
                clearable
                no-options-text="暂无科室"
                style="width:100%"
              />
            </el-form-item>
            <el-form-item label="启用" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
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
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {
  name: 'DepartEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'depart')],
  components: { Treeselect },
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
