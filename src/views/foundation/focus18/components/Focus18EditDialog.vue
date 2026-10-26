<template>
    <div v-if="open" class="focus18-drawer-mask" @click.self="cancel">
      <div class="focus18-drawer-panel" @click.stop>
        <div class="focus18-drawer-header">
          <span class="focus18-drawer-title">{{ title }}</span>
          <i class="el-icon-close focus18-drawer-close" @click="cancel" />
        </div>
        <div class="focus18-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="180px">
            <el-form-item label="耗材类别" prop="category">
              <el-input v-model="form.category" placeholder="耗材类别" maxlength="100" />
            </el-form-item>
            <el-form-item label="耗材分类代码" prop="classCode">
              <el-input v-model="form.classCode" placeholder="耗材分类代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="一级分类(学科/品类)" prop="level1">
              <el-input v-model="form.level1" placeholder="一级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="二级分类(用途/品目)" prop="level2">
              <el-input v-model="form.level2" placeholder="二级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="三级分类(部位/功能/品种)" prop="level3">
              <el-input v-model="form.level3" placeholder="三级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="通用名代码" prop="genericCode">
              <el-input v-model="form.genericCode" placeholder="通用名代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="医保通用名" prop="medicalGenericName">
              <el-input v-model="form.medicalGenericName" placeholder="医保通用名" maxlength="200" />
            </el-form-item>
            <el-form-item label="材质代码" prop="materialCode">
              <el-input v-model="form.materialCode" placeholder="材质代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="材质" prop="material">
              <el-input v-model="form.material" placeholder="材质" maxlength="200" />
            </el-form-item>
            <el-form-item label="特征代码" prop="featureCode">
              <el-input v-model="form.featureCode" placeholder="特征代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="特征参数" prop="featureParam">
              <el-input v-model="form.featureParam" placeholder="特征参数" maxlength="500" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="focus18-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'Focus18EditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Focus18')],
  inheritAttrs: false
}
</script>
