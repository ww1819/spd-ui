<template>
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 520px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="factoryImportRequiresHisId"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="衡水市第三人民医院：Excel 新增行须填「HIS系统ID」且组织机构内唯一；已存在编码的「更新」仅改名称与简码，不改库中 HIS ID。"
        />
        <p v-if="upload.mode === 'add'" style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>新增导入</strong>：与库房分类一致，按<strong>财务分类编码</strong>匹配组织机构数据；仅允许新增（库中已存在相同编码则整单校验不通过）。先校验并确认后写入。
        </p>
        <p v-else style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>更新导入</strong>：与库房分类一致，Excel 须含<strong>财务分类ID、财务分类名称</strong>；仅更新名称与拼音简码，不改编码与 HIS ID。先校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopFinanceUpload"
          :on-change="handleFinanceImportFileChange"
          :on-remove="handleFinanceImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <div v-if="upload.mode === 'update'" class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" disabled /> 当前为更新导入（按主键 ID）
            </div>
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importFinanceTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitFinanceImportFlow">校验并导入</el-button>
          <el-button @click="closeFinanceImport">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'FinanceCategoryUploadDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'FinanceCategory')],
  inheritAttrs: false
}
</script>
