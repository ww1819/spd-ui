<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item label="单号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="仓库结算单单号" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <SelectWarehouse v-model="queryParams.warehouseId" clearable style="width: 160px" />
      </el-form-item>
      <el-form-item label="结算方式" prop="settlementMethod">
        <el-select v-model="queryParams.settlementMethod" placeholder="全部" clearable style="width: 120px">
          <el-option label="入库结算" value="1" />
          <el-option label="出库结算" value="2" />
          <el-option label="消耗结算" value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 100px">
          <el-option label="待审核" :value="0" />
          <el-option label="已审核" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="制单日期">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          style="width: 240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="handleAdd" v-hasPermi="['finance:whSettlement:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="small" :disabled="single" @click="handleUpdate(selectedRow)" v-hasPermi="['finance:whSettlement:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="small" :disabled="multiple" @click="handleDelete" v-hasPermi="['finance:whSettlement:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="单号" align="center" prop="billNo" width="160" show-overflow-tooltip />
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip />
      <el-table-column label="结算方式" align="center" prop="settlementMethod" width="100">
        <template slot-scope="scope">
          {{ scope.row.settlementMethod === '1' ? '入库结算' : scope.row.settlementMethod === '2' ? '出库结算' : scope.row.settlementMethod === '3' ? '消耗结算' : scope.row.settlementMethod }}
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" width="90" />
      <el-table-column label="制单时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="审核状态" align="center" prop="auditStatus" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.auditStatus === 1 ? 'success' : 'warning'">{{ scope.row.auditStatus === 1 ? '已审核' : '待审核' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="90" />
      <el-table-column label="审核时间" align="center" prop="auditTime" width="160">
        <template slot-scope="scope">{{ scope.row.auditTime ? parseTime(scope.row.auditTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-view" @click="handleUpdate(scope.row)" v-hasPermi="['finance:whSettlement:query']">详情/修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['finance:whSettlement:audit']" v-if="scope.row.auditStatus !== 1">审核</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['finance:whSettlement:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改 弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="open" width="960px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId" :rules="[{ required: true, message: '请选择仓库', trigger: 'change' }]">
              <SelectWarehouse v-model="form.warehouseId" :disabled="form.auditStatus === 1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结算方式" prop="settlementMethod" :rules="[{ required: true, message: '请选择结算方式', trigger: 'change' }]">
              <el-select v-model="form.settlementMethod" placeholder="请选择" style="width: 100%" :disabled="!!form.id">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="!form.id">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="extractDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="!form.id">
          <el-col :span="24">
            <el-button type="primary" size="small" @click="doExtractData" :loading="extractLoading">提取数据</el-button>
            <span class="el-form-item__label" style="margin-left: 12px;">提取后将显示下方明细，可删除不需要的行再保存。</span>
          </el-col>
        </el-row>
      </el-form>
      <el-table v-if="form.id || (entryList && entryList.length)" :data="entryList" border max-height="320" size="small">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="billNo" label="业务单号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="materialName" label="耗材名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="speci" label="规格" width="100" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.unitPrice != null ? Number(scope.row.unitPrice).toFixed(4) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="amt" label="金额" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.amt != null ? Number(scope.row.amt).toFixed(2) : '--' }}</template>
        </el-table-column>
        <el-table-column v-if="form.id && form.auditStatus !== 1" label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeOneEntry(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">{{ form.id ? '保存明细' : '保存结算单' }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listWhSettlement, getWhSettlement, addWhSettlement, updateWhSettlement, delWhSettlement, extractData, saveEntries, removeEntries, auditWhSettlement } from '@/api/finance/whSettlement'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'WhSettlement',
  components: { SelectWarehouse },
  data() {
    return {
      loading: false,
      showSearch: true,
      list: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: undefined,
        warehouseId: undefined,
        settlementMethod: undefined,
        auditStatus: undefined
      },
      dateRange: [],
      ids: [],
      single: true,
      multiple: true,
      selectedRow: null,
      open: false,
      dialogTitle: '',
      form: {},
      formRef: null,
      entryList: [],
      extractDateRange: [],
      extractLoading: false,
      submitLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      if (this.dateRange && this.dateRange.length === 2) {
        params.params = {}
        params.params.beginTime = this.dateRange[0]
        params.params.endTime = this.dateRange[1]
      }
      listWhSettlement(params).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleAdd() {
      this.form = { warehouseId: undefined, settlementMethod: undefined }
      this.entryList = []
      this.extractDateRange = []
      this.dialogTitle = '新增仓库结算单'
      this.open = true
    },
    handleUpdate(row) {
      const r = row || this.selectedRow
      if (!r || !r.id) {
        this.$modal.msgWarning('请选择一条记录')
        return
      }
      getWhSettlement(r.id).then(res => {
        const data = res.data || {}
        this.form = { ...data }
        this.entryList = (data.entryList || []).map(e => ({ ...e }))
        this.dialogTitle = data.auditStatus === 1 ? '仓库结算单详情' : '修改仓库结算单'
        this.open = true
      })
    },
    doExtractData() {
      if (!this.form.warehouseId || !this.form.settlementMethod) {
        this.$modal.msgWarning('请先选择仓库和结算方式')
        return
      }
      if (!this.extractDateRange || this.extractDateRange.length !== 2) {
        this.$modal.msgWarning('请选择日期范围')
        return
      }
      this.extractLoading = true
      extractData({
        warehouseId: this.form.warehouseId,
        settlementMethod: this.form.settlementMethod,
        beginTime: this.extractDateRange[0],
        endTime: this.extractDateRange[1]
      }).then(res => {
        this.entryList = res.data || []
        this.extractLoading = false
        this.$modal.msgSuccess('提取成功，共 ' + (this.entryList.length) + ' 条')
      }).catch(() => { this.extractLoading = false })
    },
    removeOneEntry(entryId) {
      if (!this.form.id) return
      this.$modal.confirm('确认删除该明细？').then(() => {
        return removeEntries(this.form.id, [entryId])
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        return getWhSettlement(this.form.id)
      }).then(res => {
        this.entryList = (res.data && res.data.entryList) || []
      }).catch(() => {})
    },
    submitForm() {
      if (this.form.auditStatus === 1) {
        this.open = false
        return
      }
      if (this.form.id) {
        this.$refs.formRef && this.$refs.formRef.validate(valid => {
          if (!valid) return
          this.submitLoading = true
          saveEntries(this.form.id, this.entryList).then(() => {
            this.$modal.msgSuccess('保存成功')
            this.submitLoading = false
            this.open = false
            this.getList()
          }).catch(() => { this.submitLoading = false })
        })
      } else {
        this.$refs.formRef && this.$refs.formRef.validate(valid => {
          if (!valid) return
          if (!this.entryList || !this.entryList.length) {
            this.$modal.msgWarning('请先提取数据并保留至少一条明细')
            return
          }
          this.submitLoading = true
          addWhSettlement({
            warehouseId: this.form.warehouseId,
            settlementMethod: this.form.settlementMethod,
            entryList: this.entryList
          }).then(() => {
            this.$modal.msgSuccess('保存成功')
            this.submitLoading = false
            this.open = false
            this.getList()
          }).catch(() => { this.submitLoading = false })
        })
      }
    },
    handleAudit(row) {
      const id = (row && row.id) || (this.ids && this.ids[0])
      if (!id) {
        this.$modal.msgWarning('请选择一条记录')
        return
      }
      this.$modal.confirm('审核后将生成供应商结算单且不可再修改明细，是否确认审核？').then(() => {
        return auditWhSettlement(id)
      }).then(() => {
        this.$modal.msgSuccess('审核成功')
        this.getList()
      }).catch(() => {})
    },
    handleDelete(row) {
      const ids = row && row.id ? [row.id] : this.ids
      if (!ids || !ids.length) {
        this.$modal.msgWarning('请选择要删除的记录')
        return
      }
      this.$modal.confirm('是否确认删除该仓库结算单？').then(() => {
        return delWhSettlement(ids[0])
      }).then(() => {
        this.$modal.msgSuccess('删除成功')
        this.getList()
      }).catch(() => {})
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
      this.selectedRow = selection.length === 1 ? selection[0] : null
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    }
  }
}
</script>
