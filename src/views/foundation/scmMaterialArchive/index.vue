<template>
  <div class="app-container scm-material-archive-page">
    <!-- 菜单路径：foundation/scmMaterialArchive；权限 foundation:scmMaterial:* -->
    <el-alert
      title="说明"
      type="info"
      :closable="false"
      show-icon
      class="mb12"
      description="推送：将院内已绑定平台供应商编码的产品写入供应链正式档。同步：拉取平台档案到本地镜像。应用：将镜像中启用字段写回院内产品（铁锁字段不可覆盖）。"
    />

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="推送候选" name="push">
        <el-form :inline="true" size="small" class="mb12">
          <el-form-item label="关键词">
            <el-input
              v-model="pushKeyword"
              clearable
              placeholder="编码/名称/规格/供应商"
              style="width: 220px"
              @keyup.enter.native="loadPushCandidates"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="loadPushCandidates">查询</el-button>
            <el-button
              type="success"
              icon="el-icon-upload2"
              :disabled="!pushSelection.length"
              v-hasPermi="['foundation:scmMaterial:push']"
              @click="doPush"
            >推送到平台（{{ pushSelection.length }}）</el-button>
            <el-button type="text" v-hasPermi="['foundation:scmMaterial:config']" @click="openFieldCfg">字段配置</el-button>
          </el-form-item>
        </el-form>
        <el-table
          v-loading="pushLoading"
          :data="pushRows"
          border
          size="small"
          height="calc(100vh - 320px)"
          @selection-change="onPushSelectionChange"
        >
          <el-table-column type="selection" width="45" align="center" />
          <el-table-column prop="materialCode" label="院内编码" width="110" show-overflow-tooltip />
          <el-table-column prop="materialName" label="产品名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="100" show-overflow-tooltip />
          <el-table-column prop="model" label="型号" width="90" show-overflow-tooltip />
          <el-table-column prop="supplierName" label="供应商" width="110" show-overflow-tooltip />
          <el-table-column prop="scmSupplierCode" label="平台供应商编码" width="120" show-overflow-tooltip />
          <el-table-column prop="price" label="单价" width="80" align="right" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="同步与应用" name="mirror">
        <el-form :inline="true" size="small" class="mb12">
          <el-form-item label="关键词">
            <el-input
              v-model="mirrorKeyword"
              clearable
              placeholder="名称/编码"
              style="width: 180px"
              @keyup.enter.native="loadMirrors"
            />
          </el-form-item>
          <el-form-item label="应用状态">
            <el-select v-model="mirrorApplyStatus" clearable placeholder="全部" style="width: 120px">
              <el-option label="未应用" value="0" />
              <el-option label="已应用" value="1" />
              <el-option label="部分应用" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="loadMirrors">查询镜像</el-button>
            <el-button
              type="warning"
              icon="el-icon-refresh"
              v-hasPermi="['foundation:scmMaterial:sync']"
              @click="doSync"
            >从平台同步</el-button>
          </el-form-item>
        </el-form>
        <el-table
          v-loading="mirrorLoading"
          :data="mirrorRows"
          border
          size="small"
          height="calc(100vh - 320px)"
          highlight-current-row
        >
          <el-table-column prop="materialName" label="产品名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="specification" label="规格" width="100" show-overflow-tooltip />
          <el-table-column prop="scmSupplierCode" label="平台供应商" width="110" show-overflow-tooltip />
          <el-table-column prop="spdMaterialId" label="院内产品ID" width="100" show-overflow-tooltip />
          <el-table-column label="应用状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="applyStatusTag(scope.row.applyStatus)" size="mini">
                {{ applyStatusLabel(scope.row.applyStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="scmUpdateTime" label="平台更新时间" width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="text"
                size="mini"
                v-hasPermi="['foundation:scmMaterial:apply']"
                :disabled="!scope.row.spdMaterialId"
                @click="doApply(scope.row)"
              >应用</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog title="推送/应用字段配置" :visible.sync="fieldCfgVisible" width="720px" append-to-body destroy-on-close>
      <el-table v-loading="fieldCfgLoading" :data="fieldCfgRows" border size="small" max-height="420">
        <el-table-column prop="fieldCode" label="字段编码" width="140" />
        <el-table-column prop="fieldLabel" label="显示名" width="120" />
        <el-table-column label="推送" width="80" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.pushEnabled" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column label="允许应用" width="90" align="center">
          <template slot-scope="scope">
            <el-switch v-model="scope.row.applyEnabled" active-value="1" inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column prop="sortNo" label="排序" width="70" align="center" />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="fieldCfgVisible = false">取消</el-button>
        <el-button type="primary" v-hasPermi="['foundation:scmMaterial:config']" @click="saveFieldCfg">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listPushCandidates,
  pushMaterialArchive,
  syncMaterialArchive,
  listMaterialMirror,
  applyMaterialMirror,
  getMaterialFieldCfg,
  saveMaterialFieldCfg
} from '@/api/foundation/scmMaterialArchive'

export default {
  name: 'FoundationScmMaterialArchive',
  data() {
    return {
      activeTab: 'push',
      pushKeyword: '',
      pushLoading: false,
      pushRows: [],
      pushSelection: [],
      mirrorKeyword: '',
      mirrorApplyStatus: '',
      mirrorLoading: false,
      mirrorRows: [],
      fieldCfgVisible: false,
      fieldCfgLoading: false,
      fieldCfgRows: []
    }
  },
  created() {
    this.loadPushCandidates()
  },
  methods: {
    applyStatusLabel(s) {
      const m = { '0': '未应用', '1': '已应用', '2': '部分应用' }
      return m[String(s)] || s || '-'
    },
    applyStatusTag(s) {
      const v = String(s)
      if (v === '1') return 'success'
      if (v === '2') return 'warning'
      return 'info'
    },
    loadPushCandidates() {
      this.pushLoading = true
      listPushCandidates({ keyword: this.pushKeyword || undefined })
        .then(res => {
          this.pushRows = res.data || []
        })
        .catch(() => {
          this.pushRows = []
        })
        .finally(() => {
          this.pushLoading = false
        })
    },
    onPushSelectionChange(rows) {
      this.pushSelection = rows || []
    },
    doPush() {
      const ids = this.pushSelection.map(r => r.materialId).filter(Boolean)
      if (!ids.length) {
        this.$modal.msgWarning('请选择要推送的产品')
        return
      }
      this.$modal.confirm(`确认推送 ${ids.length} 条产品到供应链平台？`).then(() => {
        return pushMaterialArchive({ materialIds: ids })
      }).then(res => {
        const d = res.data || {}
        const skipped = (d.skipped || []).length
        let msg = `已提交 ${d.pushedCount || ids.length} 条`
        if (skipped) msg += `，跳过 ${skipped} 条`
        this.$modal.msgSuccess(msg)
        this.loadPushCandidates()
      }).catch(() => {})
    },
    doSync() {
      this.$modal.confirm('从平台拉取档案并更新本地镜像，是否继续？').then(() => {
        this.mirrorLoading = true
        return syncMaterialArchive({ keyword: this.mirrorKeyword || undefined })
      }).then(res => {
        const d = res.data || {}
        this.$modal.msgSuccess(`同步完成，更新 ${d.itemCount || 0} 条`)
        this.activeTab = 'mirror'
        return this.loadMirrors()
      }).catch(() => {}).finally(() => {
        this.mirrorLoading = false
      })
    },
    loadMirrors() {
      this.mirrorLoading = true
      listMaterialMirror({
        keyword: this.mirrorKeyword || undefined,
        applyStatus: this.mirrorApplyStatus || undefined
      })
        .then(res => {
          this.mirrorRows = res.data || []
        })
        .catch(() => {
          this.mirrorRows = []
        })
        .finally(() => {
          this.mirrorLoading = false
        })
    },
    doApply(row) {
      if (!row || !row.id) return
      this.$modal.confirm(`将镜像「${row.materialName || row.id}」写回院内产品？`).then(() => {
        return applyMaterialMirror({ mirrorId: row.id })
      }).then(res => {
        const d = res.data || {}
        const fields = (d.appliedFields || []).join(', ')
        this.$modal.msgSuccess(fields ? `已应用字段：${fields}` : '应用成功')
        this.loadMirrors()
      }).catch(() => {})
    },
    openFieldCfg() {
      this.fieldCfgVisible = true
      this.fieldCfgLoading = true
      getMaterialFieldCfg()
        .then(res => {
          this.fieldCfgRows = (res.data || []).map(r => ({ ...r }))
        })
        .catch(() => {
          this.fieldCfgRows = []
        })
        .finally(() => {
          this.fieldCfgLoading = false
        })
    },
    saveFieldCfg() {
      saveMaterialFieldCfg(this.fieldCfgRows).then(() => {
        this.$modal.msgSuccess('字段配置已保存')
        this.fieldCfgVisible = false
      }).catch(() => {})
    }
  },
  watch: {
    activeTab(val) {
      if (val === 'mirror' && !this.mirrorRows.length) {
        this.loadMirrors()
      }
    }
  }
}
</script>

<style scoped>
.mb12 { margin-bottom: 12px; }
</style>
