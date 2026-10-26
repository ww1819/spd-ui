<template>
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 520px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="departImportRequiresHisDeptId"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="衡水市第三人民医院：手工新增与 Excel 新增科室时「HIS科室编码」（第三方系统科室编码）必填；已存在科室的修改/导入更新不会改库中该编码。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：只新增不存在的科室编码，或勾选「更新已存在」后<strong>仅更新科室名称</strong>（简码随名称自动生成，不更新备注与 HIS 科室编码）。不会删除未出现在文件中的科室。先整单校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopDepartUpload"
          :on-change="handleDepartImportFileChange"
          :on-remove="handleDepartImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <div class="el-upload__tip" slot="tip">
              <el-checkbox v-model="upload.updateSupport" disabled /> 更新模式（按系统主键）
            </div>
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitDepartImportFlow">校验并导入</el-button>
          <el-button @click="closeDepartImport">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DepartUploadDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'depart')],
  inheritAttrs: false
}
</script>
