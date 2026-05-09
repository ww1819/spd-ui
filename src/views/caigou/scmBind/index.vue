<template>
  <div class="app-container">
    <el-card shadow="never" class="mb16">
      <div slot="header" class="clearfix">
        <span>当前租户 — 云平台医院编码</span>
      </div>
      <el-form :model="tenantForm" label-width="140px" size="small">
        <el-form-item label="平台医院编码">
          <el-input
            v-model="tenantForm.scmHospitalCode"
            clearable
            placeholder="与云平台 hospital_code 一致"
            style="max-width: 420px"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tenantForm.remark" type="textarea" :rows="2" style="max-width: 520px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTenant" v-hasPermi="['caigou:scmBind:edit']">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>供应商 — 云平台供应商编码</span>
      </div>
      <el-form :inline="true" size="small" class="mb12" v-hasPermi="['caigou:scmBind:edit']">
        <el-form-item label="选择供应商">
          <select-supplier v-model="newBind.supplierId" style="min-width: 220px" />
        </el-form-item>
        <el-form-item label="平台编码">
          <el-input v-model="newBind.scmSupplierCode" clearable placeholder="supplier_code" style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addSupplierBind">新增绑定</el-button>
        </el-form-item>
      </el-form>
      <el-form :inline="true" size="small" class="mb12 supplier-query-bar">
        <el-form-item label="SPD供应商编码">
          <el-input
            v-model="supplierQuery.spdSupplierCode"
            clearable
            placeholder="模糊"
            style="width: 168px"
            @keyup.enter.native="handleSupplierQuery"
          />
        </el-form-item>
        <el-form-item label="平台供应商编码">
          <el-input
            v-model="supplierQuery.scmSupplierCode"
            clearable
            placeholder="模糊"
            style="width: 168px"
            @keyup.enter.native="handleSupplierQuery"
          />
        </el-form-item>
        <el-form-item label="名称简码">
          <el-input
            v-model="supplierQuery.referredCode"
            clearable
            placeholder="拼音简码，模糊"
            style="width: 168px"
            @keyup.enter.native="handleSupplierQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSupplierQuery">查询</el-button>
          <el-button @click="resetSupplierQuery">重置</el-button>
          <el-button
            type="danger"
            plain
            :disabled="supplierSelection.length === 0"
            @click="batchDeleteSupplier"
            v-hasPermi="['caigou:scmBind:remove']"
          >批量删除</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="supplierTable"
        v-loading="supplierLoading"
        :data="supplierList"
        border
        size="small"
        row-key="supplierId"
        @selection-change="handleSupplierSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="SPD供应商ID" prop="supplierId" width="130" align="center" />
        <el-table-column label="SPD供应商编码" prop="supplierCode" min-width="140" show-overflow-tooltip />
        <el-table-column label="SPD供应商名称" prop="supplierName" min-width="180" show-overflow-tooltip />
        <el-table-column label="平台供应商编码" prop="scmSupplierCode" min-width="200" show-overflow-tooltip />
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.remark != null && scope.row.remark !== '' ? scope.row.remark : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openSupplierEdit(scope.row)" v-hasPermi="['caigou:scmBind:edit']">修改</el-button>
            <el-button type="text" size="small" style="color: #f56c6c" @click="deleteSupplierRow(scope.row)" v-hasPermi="['caigou:scmBind:remove']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        title="修改平台编码绑定"
        :visible.sync="supplierEditVisible"
        width="520px"
        append-to-body
        destroy-on-close
        @close="resetSupplierEditForm"
      >
        <el-form ref="supplierEditFormRef" :model="supplierEditForm" :rules="supplierEditRules" label-width="130px" size="small">
          <el-form-item label="SPD供应商">
            <span>{{ supplierEditForm.supplierName || '—' }}</span>
            <span style="color: #909399; margin-left: 8px">ID: {{ supplierEditForm.supplierId }}</span>
          </el-form-item>
          <el-form-item label="SPD供应商编码">
            <span>{{ supplierEditForm.supplierCode || '—' }}</span>
          </el-form-item>
          <el-form-item label="平台供应商编码" prop="scmSupplierCode">
            <el-input v-model="supplierEditForm.scmSupplierCode" clearable placeholder="与云平台 supplier_code 一致" maxlength="64" show-word-limit />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="supplierEditForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="选填" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="supplierEditVisible = false">取消</el-button>
          <el-button type="primary" @click="submitSupplierEdit">确定</el-button>
        </div>
      </el-dialog>
      <p class="text-muted" style="margin-top: 12px; color: #909399; font-size: 13px;">
        说明：列表为当前租户下已存在的有效绑定（逻辑删除 del_flag=1 的不展示）；同一 SPD 供应商在本租户下仅允许一条对照记录；多家供应商可维护相同的平台供应商编码。新增时请先选择本地供应商并填写平台编码。
      </p>
    </el-card>
  </div>
</template>

<script>
import { getTenantScmBind, saveTenantScmBind, listSupplierScmBind, saveSupplierScmBind, delSupplierScmBind } from '@/api/caigou/scmBind'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'

export default {
  name: 'CaigouScmBind',
  components: { SelectSupplier },
  data() {
    return {
      tenantForm: {
        scmHospitalCode: '',
        remark: ''
      },
      supplierList: [],
      supplierLoading: false,
      newBind: {
        supplierId: undefined,
        scmSupplierCode: '',
        remark: ''
      },
      supplierQuery: {
        spdSupplierCode: '',
        scmSupplierCode: '',
        referredCode: ''
      },
      supplierSelection: [],
      supplierEditVisible: false,
      supplierEditForm: {
        supplierId: undefined,
        supplierName: '',
        supplierCode: '',
        scmSupplierCode: '',
        remark: ''
      },
      supplierEditRules: {
        scmSupplierCode: [
          { required: true, message: '平台供应商编码不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.loadAll()
  },
  methods: {
    loadAll() {
      this.loadTenant()
      this.loadSuppliers()
    },
    loadTenant() {
      getTenantScmBind().then(res => {
        const d = res && res.data != null ? res.data : {}
        this.tenantForm = {
          scmHospitalCode: d.scmHospitalCode || '',
          remark: d.remark || ''
        }
      })
    },
    loadSuppliers() {
      this.supplierLoading = true
      const params = {}
      const q = this.supplierQuery || {}
      ;['spdSupplierCode', 'scmSupplierCode', 'referredCode'].forEach(key => {
        const v = q[key]
        if (v != null && String(v).trim() !== '') {
          params[key] = String(v).trim()
        }
      })
      listSupplierScmBind(params)
        .then(res => {
          const rows = res && res.data != null ? res.data : []
          this.supplierList = Array.isArray(rows) ? rows.map(r => ({ ...r })) : []
          this.supplierSelection = []
          this.$nextTick(() => {
            if (this.$refs.supplierTable) {
              this.$refs.supplierTable.clearSelection()
            }
          })
        })
        .finally(() => {
          this.supplierLoading = false
        })
    },
    handleSupplierQuery() {
      this.loadSuppliers()
    },
    resetSupplierQuery() {
      this.supplierQuery = {
        spdSupplierCode: '',
        scmSupplierCode: '',
        referredCode: ''
      }
      this.loadSuppliers()
    },
    handleSupplierSelectionChange(rows) {
      this.supplierSelection = rows || []
    },
    deleteSupplierRow(row) {
      if (!row || row.supplierId == null || row.supplierId === '') {
        this.$modal.msgError('供应商ID无效')
        return
      }
      const sid = row.supplierId
      this.$modal.confirm('是否确认删除 SPD 供应商「' + (row.supplierName || sid) + '」的平台编码绑定？').then(() => {
        return delSupplierScmBind(sid)
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.loadSuppliers()
      }).catch(() => {})
    },
    batchDeleteSupplier() {
      const sel = this.supplierSelection || []
      if (sel.length === 0) {
        this.$modal.msgError('请先勾选要删除的绑定')
        return
      }
      const ids = sel.map(r => r.supplierId).filter(id => id != null && id !== '')
      if (ids.length === 0) {
        this.$modal.msgError('未获取到有效的供应商ID')
        return
      }
      this.$modal.confirm('是否确认删除选中的 ' + ids.length + ' 条供应商平台编码绑定？').then(() => {
        return delSupplierScmBind(ids.join(','))
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.loadSuppliers()
      }).catch(() => {})
    },
    saveTenant() {
      saveTenantScmBind({
        scmHospitalCode: this.tenantForm.scmHospitalCode,
        remark: this.tenantForm.remark
      }).then(() => {
        this.$modal.msgSuccess('保存成功')
        this.loadTenant()
      })
    },
    openSupplierEdit(row) {
      if (!row || row.supplierId == null || row.supplierId === '') {
        this.$modal.msgError('供应商ID无效')
        return
      }
      this.supplierEditForm = {
        supplierId: row.supplierId,
        supplierName: row.supplierName || '',
        supplierCode: row.supplierCode || '',
        scmSupplierCode: row.scmSupplierCode != null ? String(row.scmSupplierCode) : '',
        remark: row.remark != null ? String(row.remark) : ''
      }
      this.supplierEditVisible = true
      this.$nextTick(() => {
        if (this.$refs.supplierEditFormRef) {
          this.$refs.supplierEditFormRef.clearValidate()
        }
      })
    },
    resetSupplierEditForm() {
      this.supplierEditForm = {
        supplierId: undefined,
        supplierName: '',
        supplierCode: '',
        scmSupplierCode: '',
        remark: ''
      }
      if (this.$refs.supplierEditFormRef) {
        this.$refs.supplierEditFormRef.clearValidate()
      }
    },
    submitSupplierEdit() {
      this.$refs.supplierEditFormRef.validate(valid => {
        if (!valid) return
        const f = this.supplierEditForm
        if (!f.supplierId) {
          this.$modal.msgError('供应商ID无效')
          return
        }
        const code = f.scmSupplierCode != null ? String(f.scmSupplierCode).trim() : ''
        if (!code) {
          this.$modal.msgError('请填写平台供应商编码')
          return
        }
        saveSupplierScmBind({
          supplierId: Number(f.supplierId),
          scmSupplierCode: code,
          remark: f.remark
        }).then(() => {
          this.$modal.msgSuccess('保存成功')
          this.supplierEditVisible = false
          this.loadSuppliers()
        })
      })
    },
    addSupplierBind() {
      if (this.newBind.supplierId == null || this.newBind.supplierId === '') {
        this.$modal.msgError('请选择供应商')
        return
      }
      if (!this.newBind.scmSupplierCode || !String(this.newBind.scmSupplierCode).trim()) {
        this.$modal.msgError('请填写平台供应商编码')
        return
      }
      saveSupplierScmBind({
        supplierId: Number(this.newBind.supplierId),
        scmSupplierCode: String(this.newBind.scmSupplierCode).trim(),
        remark: this.newBind.remark
      }).then(() => {
        this.$modal.msgSuccess('新增成功')
        this.newBind = { supplierId: undefined, scmSupplierCode: '', remark: '' }
        this.loadSuppliers()
      })
    }
  }
}
</script>

<style scoped>
.mb16 {
  margin-bottom: 16px;
}
.mb12 {
  margin-bottom: 12px;
}
</style>
