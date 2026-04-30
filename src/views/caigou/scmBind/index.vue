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
      <el-table v-loading="supplierLoading" :data="supplierList" border size="small">
        <el-table-column label="SPD供应商ID" prop="supplierId" width="130" align="center" />
        <el-table-column label="平台供应商编码" min-width="200">
          <template slot-scope="scope">
            <el-input v-model="scope.row.scmSupplierCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template slot-scope="scope">
            <el-input v-model="scope.row.remark" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="saveSupplierRow(scope.row)" v-hasPermi="['caigou:scmBind:edit']">保存</el-button>
          </template>
        </el-table-column>
      </el-table>
      <p class="text-muted" style="margin-top: 12px; color: #909399; font-size: 13px;">
        说明：列表为当前租户下已存在的绑定记录；新增时请先选择本地供应商并填写平台编码。
      </p>
    </el-card>
  </div>
</template>

<script>
import { getTenantScmBind, saveTenantScmBind, listSupplierScmBind, saveSupplierScmBind } from '@/api/caigou/scmBind'
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
      listSupplierScmBind()
        .then(res => {
          const rows = res && res.data != null ? res.data : []
          this.supplierList = Array.isArray(rows) ? rows.map(r => ({ ...r })) : []
        })
        .finally(() => {
          this.supplierLoading = false
        })
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
    saveSupplierRow(row) {
      if (!row || !row.supplierId) {
        this.$modal.msgError('供应商ID无效')
        return
      }
      saveSupplierScmBind({
        supplierId: Number(row.supplierId),
        scmSupplierCode: row.scmSupplierCode,
        remark: row.remark
      }).then(() => {
        this.$modal.msgSuccess('保存成功')
        this.loadSuppliers()
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
