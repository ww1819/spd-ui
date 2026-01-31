<template>
  <div class="app-container profit-loss-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="query-form-compact">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="盈亏单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo" placeholder="请输入盈亏单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="盘点单号" prop="stocktakingNo" class="query-item-inline">
            <el-input v-model="queryParams.stocktakingNo" placeholder="请输入盘点单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <SelectWarehouse v-model="queryParams.warehouseId" />
          </el-form-item>
          <el-form-item label="单据状态" prop="billStatus" class="query-item-inline">
            <el-select v-model="queryParams.billStatus" placeholder="请选择" clearable style="width: 120px">
              <el-option label="待审核" :value="1" />
              <el-option label="已审核" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="medium" @click="handleAdd" v-hasPermi="['warehouse:profitLoss:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" class="table-compact" :row-class-name="tableRowIndex" height="calc(100vh - 340px)" border>
      <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip />
      <el-table-column label="盈亏单号" align="center" prop="billNo" min-width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">{{ scope.row.billNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="盘点单号" align="center" prop="stocktakingNo" min-width="140" show-overflow-tooltip />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip />
      <el-table-column label="单据状态" align="center" prop="billStatus" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="100" show-overflow-tooltip />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="220" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
          <el-button size="mini" type="text" @click="handleUpdate(scope.row)" v-hasPermi="['warehouse:profitLoss:edit']" v-if="scope.row.billStatus === 1">修改</el-button>
          <el-button size="mini" type="text" @click="handleAudit(scope.row)" v-hasPermi="['warehouse:profitLoss:audit']" v-if="scope.row.billStatus === 1">审核</el-button>
          <el-button size="mini" type="text" @click="handleDelete(scope.row)" v-hasPermi="['warehouse:profitLoss:remove']" v-if="scope.row.billStatus === 1">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 新增/修改/查看 弹窗 -->
    <el-dialog :title="title" :visible.sync="open" width="960px" append-to-body :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" :disabled="dialogReadOnly">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="盈亏单号" prop="billNo">
              <el-input v-model="form.billNo" placeholder="保存后自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="盘点单号" prop="stocktakingNo">
              <el-input v-model="form.stocktakingNo" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单据状态" prop="billStatus">
              <dict-tag :options="dict.type.biz_status" :value="form.billStatus" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 新增时：选择盘点单并加载草稿 -->
        <el-row v-if="!form.id && title === '新增盈亏单'" :gutter="16">
          <el-col :span="16">
            <el-form-item label="已审核盘点单" prop="stocktakingId">
              <el-select v-model="form.stocktakingId" placeholder="请选择已审核的盘点单" filterable clearable style="width: 100%" @change="onStocktakingChange">
                <el-option v-for="item in stocktakingOptions" :key="item.id" :label="item.stockNo + '（' + (item.warehouse && item.warehouse.name ? item.warehouse.name : '') + '）'" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" size="small" @click="loadDraft" :disabled="!form.stocktakingId" :loading="loadDraftLoading">加载有盈亏明细</el-button>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId">
              <el-input v-if="form.warehouse && form.warehouse.name" v-model="form.warehouse.name" disabled />
              <span v-else>--</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div v-if="(form.entryList && form.entryList.length) || (form.id && entryList.length)" style="margin-top: 12px;">
        <div style="margin-bottom: 8px; font-weight: 600;">盈亏明细</div>
        <el-table :data="form.entryList || entryList" border size="small" max-height="320">
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column label="耗材编码" align="center" prop="material.code" min-width="100" show-overflow-tooltip />
          <el-table-column label="耗材名称" align="center" prop="material.name" min-width="140" show-overflow-tooltip />
          <el-table-column label="批次号" align="center" prop="batchNo" width="120" show-overflow-tooltip />
          <el-table-column label="当前库存" align="center" prop="bookQty" width="95">
            <template slot-scope="scope">{{ formatNum(scope.row.bookQty) }}</template>
          </el-table-column>
          <el-table-column label="盘点库存" align="center" prop="stockQty" width="95">
            <template slot-scope="scope">{{ formatNum(scope.row.stockQty) }}</template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" prop="profitQty" width="90">
            <template slot-scope="scope">
              <span :style="{ color: scope.row.profitQty > 0 ? '#67c23a' : scope.row.profitQty < 0 ? '#f56c6c' : '' }">{{ formatNum(scope.row.profitQty) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="unitPrice" width="90">
            <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="100">
            <template slot-scope="scope">{{ formatNum(scope.row.profitAmount) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading" v-if="!dialogReadOnly && (form.entryList && form.entryList.length)">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listProfitLoss, getProfitLoss, loadDraft as apiLoadDraft, addProfitLoss, updateProfitLoss, delProfitLoss, auditProfitLoss } from '@/api/warehouse/profitLoss'
import { listStocktaking } from '@/api/warehouse/stocktaking'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'ProfitLoss',
  dicts: ['biz_status'],
  components: { SelectWarehouse },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      dataList: [],
      title: '',
      open: false,
      dialogReadOnly: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        stocktakingNo: null,
        warehouseId: null,
        billStatus: null
      },
      form: {},
      entryList: [],
      rules: {
        stocktakingId: [{ required: true, message: '请选择已审核的盘点单', trigger: 'change' }]
      },
      stocktakingOptions: [],
      loadDraftLoading: false,
      submitLoading: false
    }
  },
  created() {
    this.getList()
    this.loadStocktakingOptions()
  },
  methods: {
    formatNum(val) {
      if (val == null || val === '') return '--'
      const n = Number(val)
      if (isNaN(n)) return '--'
      return n % 1 === 0 ? String(n) : Number(n).toFixed(2)
    },
    tableRowIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10))
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10))
      row.index = (pageNum - 1) * pageSize + rowIndex + 1
    },
    getList() {
      this.loading = true
      listProfitLoss(this.queryParams).then(response => {
        this.dataList = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    loadStocktakingOptions() {
      listStocktaking({ stockStatus: 2, pageNum: 1, pageSize: 500 }).then(response => {
        this.stocktakingOptions = response.rows || []
      })
    },
    onStocktakingChange() {
      this.form.entryList = []
      if (!this.form.stocktakingId) {
        this.form.stocktakingNo = null
        this.form.warehouseId = null
        this.form.warehouse = null
        return
      }
      const opt = this.stocktakingOptions.find(s => s.id === this.form.stocktakingId)
      if (opt) {
        this.form.stocktakingNo = opt.stockNo
        this.form.warehouseId = opt.warehouseId
        this.form.warehouse = opt.warehouse ? { id: opt.warehouse.id, name: opt.warehouse.name, code: opt.warehouse.code } : null
      }
    },
    loadDraft() {
      if (!this.form.stocktakingId) {
        this.$message.warning('请先选择已审核的盘点单')
        return
      }
      this.loadDraftLoading = true
      apiLoadDraft(this.form.stocktakingId).then(response => {
        this.form = response.data
        this.form.entryList = response.data.entryList || []
        // 后端草稿可能不包含 warehouse 对象，用已选盘点单的仓库信息补全显示
        const opt = this.stocktakingOptions.find(s => s.id === this.form.stocktakingId)
        if (opt && opt.warehouse) {
          this.form.warehouse = { id: opt.warehouse.id, name: opt.warehouse.name, code: opt.warehouse.code }
        }
        this.loadDraftLoading = false
        this.$message.success('已加载有盈亏明细')
      }).catch(() => { this.loadDraftLoading = false })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {}
      this.entryList = []
      this.resetForm('form')
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleAdd() {
      this.reset()
      this.title = '新增盈亏单'
      this.dialogReadOnly = false
      this.open = true
      this.loadStocktakingOptions()
    },
    handleView(row) {
      this.reset()
      const id = row.id
      getProfitLoss(id).then(response => {
        this.form = response.data
        this.entryList = (response.data && response.data.entryList) ? response.data.entryList : []
        this.title = '查看盈亏单'
        this.dialogReadOnly = true
        this.open = true
      })
    },
    handleUpdate(row) {
      this.reset()
      const id = row.id
      getProfitLoss(id).then(response => {
        this.form = response.data
        this.form.entryList = response.data.entryList || []
        this.title = '修改盈亏单'
        this.dialogReadOnly = false
        this.open = true
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) return
        if (!this.form.entryList || !this.form.entryList.length) {
          this.$message.warning('请先加载有盈亏明细')
          return
        }
        if (this.submitLoading) return
        this.submitLoading = true
        const isUpdate = !!this.form.id
        const request = isUpdate ? updateProfitLoss(this.form) : addProfitLoss(this.form)
        request.then(response => {
          const data = response.data || response
          if (!isUpdate && data) {
            this.form.id = data.id
            if (data.billNo != null) this.form.billNo = data.billNo
          }
          this.$modal.msgSuccess(isUpdate ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        }).finally(() => {
          this.submitLoading = false
        })
      })
    },
    handleDelete(row) {
      this.$modal.confirm('是否确认删除该盈亏单？').then(() => {
        return delProfitLoss(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
    handleAudit(row) {
      this.$modal.confirm('是否确认审核该盈亏单？审核后将根据盈亏数量调整库存并生成流水。').then(() => {
        return auditProfitLoss(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('审核成功')
      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.profit-loss-page {
  padding-left: 8px;
  padding-right: 8px;
}
</style>

<style>
.app-container.profit-loss-page > .el-form.query-form-compact {
  margin-top: -8px;
}
.app-container.profit-loss-page > .el-row.button-row-compact {
  margin-top: -8px;
  padding-top: 0;
  margin-bottom: 8px;
}
.app-container.profit-loss-page > .el-table.table-compact {
  margin-top: 0;
}
.app-container.profit-loss-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 14px;
  height: 48px;
}
</style>
