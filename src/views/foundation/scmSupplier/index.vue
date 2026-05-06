<template>
  <div class="app-container scm-supplier-page">
    <el-alert
      title="说明"
      type="info"
      :closable="false"
      show-icon
      class="mb12"
      description="左侧为平台在本院可见的供应商；右侧可查看平台档案、选择院内已绑定平台编码的供应商做关联查看、补全或下载 JSON（全量/脱敏由后端根据平台绑定与采购订单判定）。"
    />

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never" class="h-card">
          <div slot="header" class="card-header">平台供应商列表</div>
          <el-table
            v-loading="scmLoading"
            :data="scmRows"
            border
            size="small"
            highlight-current-row
            height="calc(100vh - 260px)"
            @current-change="onScmRowChange"
          >
            <el-table-column prop="supplierCode" label="平台编码" width="120" show-overflow-tooltip />
            <el-table-column prop="companyName" label="企业名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="companyShortName" label="简称" width="100" show-overflow-tooltip />
            <el-table-column prop="contactPhone" label="电话" width="110" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never" class="h-card">
          <div slot="header" class="card-header">平台档案</div>
          <div v-if="!selectedScmCode" class="empty-hint">请在左侧选择一行</div>
          <div v-else v-loading="profileLoading">
            <el-descriptions :column="2" size="small" border class="mb12">
              <el-descriptions-item label="平台编码">{{ selectedScmCode }}</el-descriptions-item>
              <el-descriptions-item label="院端供货绑定">
                <el-tag v-if="profileObj && profileObj.hospitalSupplierBound" type="success" size="mini">已绑定</el-tag>
                <el-tag v-else type="warning" size="mini">未绑定</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <div class="profile-json-wrap">
              <pre class="json-block">{{ profileJsonText }}</pre>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="mt12">
          <div slot="header" class="card-header">院内供应商关联 / 补全 / 下载</div>
          <el-form size="small" label-width="120px" class="link-form">
            <el-form-item label="院内供应商">
              <el-select
                v-model="fdSupplierId"
                filterable
                remote
                clearable
                reserve-keyword
                placeholder="编码或名称检索"
                :remote-method="remoteSearchSupplier"
                :loading="supplierSearchLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="item in supplierOptions"
                  :key="item.id"
                  :label="(item.code || '') + ' — ' + (item.name || '')"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" :disabled="!fdSupplierId" @click="loadLinked">加载关联</el-button>
              <el-button
                type="success"
                size="small"
                :disabled="!fdSupplierId"
                v-hasPermi="['foundation:scmSupplier:merge']"
                @click="doMerge(false)"
              >补全（仅填空）</el-button>
              <el-button
                type="warning"
                size="small"
                :disabled="!fdSupplierId"
                v-hasPermi="['foundation:scmSupplier:merge']"
                @click="doMerge(true)"
              >补全（覆盖非空）</el-button>
              <el-button
                type="primary"
                plain
                size="small"
                icon="el-icon-download"
                :disabled="!fdSupplierId"
                v-hasPermi="['foundation:scmSupplier:export']"
                @click="doExportJson"
              >下载平台资料 JSON</el-button>
            </el-form-item>
          </el-form>
          <div v-if="linkedJson" class="linked-wrap">
            <el-divider content-position="left">关联数据（院内 + 平台）</el-divider>
            <pre class="json-block small">{{ linkedJson }}</pre>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import {
  listScmSupplierPlatform,
  getScmSupplierProfile,
  getScmSupplierLinked,
  mergeScmToFdSupplier,
  exportScmSupplierJson
} from '@/api/foundation/scmSupplier'
import { listSupplier } from '@/api/foundation/supplier'

export default {
  name: 'FoundationScmSupplier',
  data() {
    return {
      scmLoading: false,
      scmRows: [],
      selectedScmCode: '',
      profileLoading: false,
      profileObj: null,
      fdSupplierId: undefined,
      supplierSearchLoading: false,
      supplierOptions: [],
      linkedJson: ''
    }
  },
  computed: {
    profileJsonText() {
      if (!this.profileObj) return ''
      try {
        return JSON.stringify(this.profileObj, null, 2)
      } catch (e) {
        return String(this.profileObj)
      }
    }
  },
  created() {
    this.loadScmList()
  },
  methods: {
    loadScmList() {
      this.scmLoading = true
      listScmSupplierPlatform()
        .then(res => {
          this.scmRows = res.data || []
        })
        .catch(() => {
          this.scmRows = []
        })
        .finally(() => {
          this.scmLoading = false
        })
    },
    onScmRowChange(row) {
      this.selectedScmCode = row && row.supplierCode ? String(row.supplierCode) : ''
      this.profileObj = null
      if (!this.selectedScmCode) return
      this.profileLoading = true
      getScmSupplierProfile(this.selectedScmCode)
        .then(res => {
          this.profileObj = res.data || {}
        })
        .catch(() => {
          this.profileObj = null
        })
        .finally(() => {
          this.profileLoading = false
        })
    },
    remoteSearchSupplier(q) {
      if (!q || String(q).trim().length < 1) {
        this.supplierOptions = []
        return
      }
      this.supplierSearchLoading = true
      listSupplier({ pageNum: 1, pageSize: 30, name: String(q).trim() })
        .then(res => {
          this.supplierOptions = res.rows || []
        })
        .catch(() => {
          this.supplierOptions = []
        })
        .finally(() => {
          this.supplierSearchLoading = false
        })
    },
    loadLinked() {
      if (!this.fdSupplierId) return
      getScmSupplierLinked(this.fdSupplierId).then(res => {
        const d = res.data || {}
        this.linkedJson = JSON.stringify(d, null, 2)
      }).catch(() => {
        this.linkedJson = ''
      })
    },
    doMerge(overwriteNonEmpty) {
      if (!this.fdSupplierId) return
      const tip = overwriteNonEmpty
        ? '将用平台数据覆盖院内已有非空字段，是否继续？'
        : '仅补全院内有空白的字段，是否继续？'
      this.$modal.confirm(tip).then(() => {
        return mergeScmToFdSupplier({ spdSupplierId: this.fdSupplierId, overwriteNonEmpty })
      }).then(() => {
        this.$modal.msgSuccess('补全成功')
        this.loadLinked()
      }).catch(() => {})
    },
    async doExportJson() {
      if (!this.fdSupplierId) return
      try {
        const blob = await exportScmSupplierJson(this.fdSupplierId)
        if (!(blob instanceof Blob)) {
          this.$modal.msgError('下载失败')
          return
        }
        const text = await blob.text()
        if (text.trim().startsWith('{')) {
          try {
            const j = JSON.parse(text)
            if (j.code !== undefined && j.code !== 200) {
              this.$modal.msgError(j.msg || '导出失败')
              return
            }
          } catch (e) {
            /* 非法 JSON 则按文件内容保存 */
          }
        }
        saveAs(new Blob([text], { type: 'application/json;charset=utf-8' }), `scm_supplier_export_${this.fdSupplierId}.json`)
      } catch (e) {
        this.$modal.msgError((e && e.message) || '下载失败')
      }
    }
  }
}
</script>

<style scoped>
.mb12 { margin-bottom: 12px; }
.mt12 { margin-top: 12px; }
.card-header { font-weight: 600; }
.h-card >>> .el-card__body { padding: 12px; }
.empty-hint { color: #909399; padding: 24px 0; text-align: center; }
.json-block {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.45;
  max-height: 42vh;
  overflow: auto;
}
.json-block.small { max-height: 28vh; }
.profile-json-wrap { margin-top: 8px; }
.link-form { max-width: 720px; }
.linked-wrap { margin-top: 8px; }
</style>
