<template>
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small" class="focus18-drawer-form">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="耗材类别" prop="category">
                  <el-input v-model="form.category" class="focus18-drawer-control" placeholder="耗材类别" maxlength="100" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="耗材分类代码" prop="classCode">
                  <el-input v-model="form.classCode" class="focus18-drawer-control" placeholder="耗材分类代码" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="一级分类" prop="level1">
                  <el-input v-model="form.level1" class="focus18-drawer-control" placeholder="学科/品类" maxlength="200" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="二级分类" prop="level2">
                  <el-input v-model="form.level2" class="focus18-drawer-control" placeholder="用途/品目" maxlength="200" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="三级分类" prop="level3">
                  <el-input v-model="form.level3" class="focus18-drawer-control" placeholder="部位/功能/品种" maxlength="200" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="通用名代码" prop="genericCode">
                  <el-input v-model="form.genericCode" class="focus18-drawer-control" placeholder="通用名代码" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="医保通用名" prop="medicalGenericName">
                  <el-input v-model="form.medicalGenericName" class="focus18-drawer-control" placeholder="医保通用名" maxlength="200" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="材质代码" prop="materialCode">
                  <el-input v-model="form.materialCode" class="focus18-drawer-control" placeholder="材质代码" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="材质" prop="material">
                  <el-input v-model="form.material" class="focus18-drawer-control" placeholder="材质" maxlength="200" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="特征代码" prop="featureCode">
                  <el-input v-model="form.featureCode" class="focus18-drawer-control" placeholder="特征代码" maxlength="100" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="特征参数" prop="featureParam">
                  <el-input v-model="form.featureParam" class="focus18-drawer-control" placeholder="特征参数" maxlength="500" />
                </el-form-item>
              </el-col>
            </el-row>
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
  name: 'Focus18EditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Focus18')],
  inheritAttrs: false
}
</script>
