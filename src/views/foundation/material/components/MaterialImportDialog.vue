<template>
    <!-- 耗材档案：新增/更新导入 -->
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 620px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="upload.mode === 'add'"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="新增导入：HIS系统ID 在组织机构内已存在则整单拒绝；请填写 HIS生产厂家ID 或 SPD生产厂家ID；HIS财务分类ID 用于匹配 SPD 财务分类。"
        />
        <el-alert
          v-if="upload.mode === 'update'"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="三步：导出档案 → 发给供应商完善 → 把填好的文件上传回来。有勾选只导出勾选的，没勾选则导出当前查询全部。请勿删除隐藏的档案ID列；空着的格子表示不改。耗材编码不会被更新。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          先整单校验，通过后确认写入。解析结果可预览并导出以便排查。
        </p>
        <el-upload
          ref="materialImportUpload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopMaterialImportUpload"
          :on-change="handleMaterialImportFileChange"
          :on-remove="handleMaterialImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click.stop.prevent="downloadMaterialImportTemplate">{{ upload.mode === 'update' ? '导出待完善档案' : '下载模板' }}</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitMaterialImportFlow">校验并导入</el-button>
          <el-button @click="closeMaterialImport">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import hostProxyMixin from './hostProxyMixin'

export default {
  name: 'MaterialImportDialog',
  mixins: [hostProxyMixin],
  inheritAttrs: false
}
</script>
