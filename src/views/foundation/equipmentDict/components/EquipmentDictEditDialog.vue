<template>
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content equipmentDict-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button @click="cancel" class="close-btn">关闭</el-button>
          </div>
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="form">
            <el-form ref="form" :model="form" :rules="rules" label-width="120px">
              <!-- 第一行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="档案编码：" prop="code">
                    <el-input 
                      v-model="form.code" 
                      :disabled="true"
                      placeholder="选择所属分类后自动显示" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="档案名称：" prop="name">
                    <el-input v-model="form.name" @input="nameChange" placeholder="档案名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="所属分类：" prop="category68Id">
                    <el-select 
                      v-model="form.category68Id" 
                      placeholder="所属分类" 
                      style="width: 100%"
                      filterable
                      clearable
                      @change="handleCategory68Change"
                    >
                      <el-option
                        v-for="item in category68Options"
                        :key="item.category68Id"
                        :label="getCategory68DisplayLabel(item)"
                        :value="item.category68Id"
                      >
                        <span>{{ item.category68Name }}</span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第二行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="单位：" prop="unitId">
                    <SelectUnit v-model="form.unitId" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="财务分类：" prop="isWay">
                    <el-select v-model="form.isWay" placeholder="财务分类" style="width: 100%">
                      <el-option
                        v-for="dict in dict.type.way_status"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="折旧年限：" prop="depreciationYears">
                    <el-input-number v-model="form.depreciationYears" placeholder="折旧年限" :min="0" :precision="0" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="使用年限：" prop="useYears">
                    <el-input-number v-model="form.useYears" placeholder="使用年限" :min="0" :precision="0" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-tab-pane>
        
          <!-- 产品图片 -->
          <el-tab-pane label="产品图片" name="image">
            <div class="image-tab-content" style="text-align: center; padding: 40px 20px;">
            <div class="equipmentDict-image-container" style="display: inline-block;">
              <el-upload
                ref="imageUpload"
                :action="imageUploadUrl"
                :headers="imageUploadHeaders"
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
                :auto-upload="true"
                accept="image/*"
              >
                <div v-if="form.imageUrl" class="equipmentDict-image-preview-large" slot="trigger">
                  <img :src="form.imageUrl" alt="设备图片" @click.stop="previewImage" />
                  <div class="image-overlay">
                    <i class="el-icon-zoom-in" @click.stop="previewImage" title="查看图片"></i>
                    <i class="el-icon-delete" @click.stop="removeImage" title="删除图片"></i>
                  </div>
                </div>
                <div v-else class="equipmentDict-image-placeholder-large" slot="trigger">
                  <i class="el-icon-plus"></i>
                  <div style="font-size: 14px; color: #999; margin-top: 10px;">点击上传图片</div>
                  <div style="font-size: 12px; color: #ccc; margin-top: 5px;">支持 JPG、PNG 格式，大小不超过 2MB</div>
                </div>
              </el-upload>
              <div v-if="form.imageUrl" style="margin-top: 20px;">
                <el-button type="primary" @click="previewImage">查看图片</el-button>
                <el-button type="primary" @click="saveImage">保存</el-button>
                <el-button type="primary" @click="removeImage">删除图片</el-button>
              </div>
            </div>
          </div>
          </el-tab-pane>
        </el-tabs>
        
        <div class="dialog-footer" style="text-align:center;margin-top:16px;">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectUnit from '@/components/SelectModel/SelectUnit'

export default {
  name: 'EquipmentDictEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'EquipmentDict')],
  components: { SelectUnit },
  dicts: ['way_status'],
  inheritAttrs: false
}
</script>
