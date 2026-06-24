<template>
  <div class="app-container profit-loss-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form query-form-compact">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="盈亏单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo" placeholder="盈亏单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="盘点单号" prop="stocktakingNo" class="query-item-inline">
            <el-input v-model="queryParams.stocktakingNo" placeholder="盘点单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" />
            </div>
          </el-form-item>
          <el-form-item label="单据状态" prop="billStatus" class="query-item-inline">
            <el-select v-model="queryParams.billStatus" placeholder="请选择" clearable style="width: 180px">
              <el-option label="待审核" :value="1" />
              <el-option label="已审核" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="24">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
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

    <el-table v-loading="loading" :data="dataList" class="table-compact" :row-class-name="tableRowIndex" height="calc(100vh - 340px)" border stripe>
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="盈亏单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">{{ scope.row.billNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="盘点单号" align="center" prop="stocktakingNo" width="180" show-overflow-tooltip resizable />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="150" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)" style="padding: 0 5px; margin: 0;">查看</el-button>
            <el-button size="small" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['warehouse:profitLoss:edit']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">修改</el-button>
            <el-button size="small" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['warehouse:profitLoss:audit']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">审核</el-button>
            <el-button size="small" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['warehouse:profitLoss:remove']" v-if="scope.row.billStatus === 1" style="padding: 0 5px; margin: 0;">删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 新增/修改/查看 弹窗（布局对齐到货验收） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" size="small" class="modal-form-compact profit-loss-modal-head-form">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="billStatus" class="head-label-nowrap">
                      <el-input :value="billStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="盈亏单号" prop="billNo" class="head-label-nowrap">
                      <el-input v-model="form.billNo" placeholder="保存后自动生成" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="盘点单号" prop="stocktakingNo" class="head-label-nowrap">
                      <el-input v-model="form.stocktakingNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId" class="head-label-nowrap">
                      <el-input :value="warehouseDisplayName" :disabled="true" placeholder="仓库" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
                <div class="detail-toolbar-row">
                  <span class="detail-toolbar-title">盈亏明细信息</span>
                  <div class="detail-toolbar-actions">
                    <el-button
                      v-if="detailEditable && !form.id"
                      type="primary"
                      plain
                      icon="el-icon-connection"
                      size="small"
                      @click="openStocktakingPickDialog"
                    >引入盘点单</el-button>
                    <el-button
                      v-if="detailEditable && entryFullList.length"
                      type="primary"
                      size="small"
                      @click="submitForm"
                      :loading="submitLoading"
                    >保 存</el-button>
                  </div>
                </div>
                <div class="table-wrapper">
                  <el-table
                    ref="profitLossEntryTable"
                    class="profit-loss-detail-table"
                    :data="entryFullList"
                    :row-class-name="rowEntryIndex"
                    :height="detailTableHeight"
                    border
                    show-summary
                    :summary-method="getEntrySummaries"
                  >
                    <el-table-column label="序号" align="center" header-align="center" prop="index" width="60" show-overflow-tooltip resizable />
                    <el-table-column label="耗材编码" align="center" header-align="center" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="耗材名称" align="center" header-align="center" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="120" show-overflow-tooltip resizable />
                    <el-table-column label="当前库存" align="center" header-align="center" prop="bookQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.bookQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盘点库存" align="center" header-align="center" prop="stockQty" width="95" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.stockQty) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span :style="{ color: scope.row.profitQty > 0 ? '#67c23a' : scope.row.profitQty < 0 ? '#f56c6c' : '' }">{{ formatNum(scope.row.profitQty) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" align="center" header-align="center" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
                    </el-table-column>
                    <el-table-column label="盈亏金额" align="center" header-align="center" prop="profitAmount" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">{{ formatNum(scope.row.profitAmount) }}</template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 引入盘点单 -->
    <el-dialog
      title="引入盘点单"
      :visible.sync="stocktakingPickVisible"
      width="920px"
      append-to-body
      :close-on-click-modal="false"
      @open="handleStocktakingPickDialogOpen"
    >
      <el-form :model="stocktakingPickQuery" ref="stocktakingPickForm" size="small" :inline="true" label-width="80px">
        <el-form-item label="业务单号" prop="stockNo">
          <el-input v-model="stocktakingPickQuery.stockNo" placeholder="业务单号" clearable style="width: 180px" @keyup.enter.native="searchStocktakingPickList" />
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <div class="query-select-wrapper">
            <SelectWarehouse v-model="stocktakingPickQuery.warehouseId" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="searchStocktakingPickList">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetStocktakingPickQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        v-loading="stocktakingPickLoading"
        :data="stocktakingPickList"
        highlight-current-row
        border
        stripe
        height="360px"
        @current-change="handleStocktakingPickCurrentChange"
      >
        <el-table-column label="业务单号" align="center" prop="stockNo" min-width="160" show-overflow-tooltip />
        <el-table-column label="仓库" align="center" prop="warehouse.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="制单日期" align="center" prop="stockDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatNum(scope.row.profitAmount) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        :total="stocktakingPickTotal"
        :page.sync="stocktakingPickQuery.pageNum"
        :limit.sync="stocktakingPickQuery.pageSize"
        @pagination="searchStocktakingPickList"
      />
      <div slot="footer" class="dialog-footer">
        <el-button @click="stocktakingPickVisible = false">取 消</el-button>
        <el-button type="primary" :disabled="!stocktakingPickSelected" :loading="loadDraftLoading" @click="confirmStocktakingPick">确 定</el-button>
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
        billStatus: null,
        beginDate: null,
        endDate: null
      },
      form: {},
      entryList: [],
      rules: {
        stocktakingId: [{ required: true, message: '请引入已审核的盘点单', trigger: 'change' }]
      },
      loadDraftLoading: false,
      submitLoading: false,
      stocktakingPickVisible: false,
      stocktakingPickLoading: false,
      stocktakingPickList: [],
      stocktakingPickTotal: 0,
      stocktakingPickSelected: null,
      stocktakingPickQuery: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        warehouseId: null,
        stockStatus: 2,
        stockType: '501',
        forProfitLossPick: 1
      }
    }
  },
  computed: {
    detailTableHeight() {
      return 'max(260px, calc(100vh - 340px))'
    },
    billStatusLabel() {
      const status = this.form && this.form.billStatus
      if (status == null || status === '') {
        return ''
      }
      const label = this.selectDictLabel(this.dict.type.biz_status, String(status))
      return label || ''
    },
    warehouseDisplayName() {
      const f = this.form || {}
      if (f.warehouse && f.warehouse.name) {
        return f.warehouse.name
      }
      return '--'
    },
    detailEditable() {
      return !this.dialogReadOnly && (this.form.billStatus == null || this.form.billStatus === 1 || this.form.billStatus === '1')
    },
    entryFullList() {
      const list = (this.form && this.form.entryList && this.form.entryList.length)
        ? this.form.entryList
        : (this.entryList || [])
      return Array.isArray(list) ? list : []
    }
  },
  created() {
    this.getList()
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
    loadStocktakingPickList() {
      this.stocktakingPickLoading = true
      listStocktaking({ ...this.stocktakingPickQuery }).then(response => {
        this.stocktakingPickList = response.rows || []
        this.stocktakingPickTotal = response.total || 0
        this.stocktakingPickLoading = false
      }).catch(() => {
        this.stocktakingPickLoading = false
      })
    },
    openStocktakingPickDialog() {
      this.stocktakingPickVisible = true
    },
    handleStocktakingPickDialogOpen() {
      this.stocktakingPickSelected = null
      this.stocktakingPickQuery.pageNum = 1
      this.searchStocktakingPickList()
    },
    searchStocktakingPickList() {
      this.stocktakingPickQuery.pageNum = this.stocktakingPickQuery.pageNum || 1
      this.loadStocktakingPickList()
    },
    resetStocktakingPickQuery() {
      this.stocktakingPickQuery.stockNo = null
      this.stocktakingPickQuery.warehouseId = null
      this.stocktakingPickQuery.pageNum = 1
      this.searchStocktakingPickList()
    },
    handleStocktakingPickCurrentChange(row) {
      this.stocktakingPickSelected = row || null
    },
    confirmStocktakingPick() {
      if (!this.stocktakingPickSelected) {
        this.$message.warning('请选择盘点单')
        return
      }
      this.form.stocktakingId = this.stocktakingPickSelected.id
      this.form.stocktakingNo = this.stocktakingPickSelected.stockNo
      this.form.warehouseId = this.stocktakingPickSelected.warehouseId
      const wh = this.stocktakingPickSelected.warehouse
      this.form.warehouse = wh ? { id: wh.id, name: wh.name, code: wh.code } : null
      this.loadDraft(this.stocktakingPickSelected)
    },
    loadDraft(stocktakingRow) {
      const pick = stocktakingRow || { id: this.form.stocktakingId, warehouse: this.form.warehouse }
      if (!pick.id) {
        this.$message.warning('请先选择已审核的盘点单')
        return
      }
      this.loadDraftLoading = true
      apiLoadDraft(pick.id).then(response => {
        this.form = response.data
        this.form.entryList = response.data.entryList || []
        if (pick.warehouse) {
          this.form.warehouse = {
            id: pick.warehouse.id,
            name: pick.warehouse.name,
            code: pick.warehouse.code
          }
        }
        this.loadDraftLoading = false
        this.stocktakingPickVisible = false
        this.$message.success('已引入盘点单并加载盈亏明细')
      }).catch(() => { this.loadDraftLoading = false })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    reset() {
      this.form = {}
      this.entryList = []
      this.stocktakingPickSelected = null
      this.resetForm('form')
    },
    rowEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1
    },
    getEntrySummaries({ columns }) {
      const list = this.entryFullList
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计'
          return
        }
        const prop = column.property
        if (prop === 'profitQty' || prop === 'profitAmount' || prop === 'bookQty' || prop === 'stockQty') {
          const total = list.reduce((sum, row) => sum + (Number(row[prop]) || 0), 0)
          sums[index] = this.formatNum(total)
        } else {
          sums[index] = ''
        }
      })
      return sums
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
          this.$message.warning('请先引入盘点单并加载盈亏明细')
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
      this.$modal.confirm(
        '是否确认审核该盈亏单？审核后：盘亏会调整库存并生成流水；盘盈将生成待入账/仅追溯用记录，不直接更新库存与结算流水。'
      ).then(() => {
        return auditProfitLoss(row.id)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('审核成功')
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.query-select-wrapper {
  width: 180px;
}

/* 弹窗：与到货验收/盘点申请一致 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.local-modal-content >>> .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

.local-modal-content .modal-detail-section .detail-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0;
  margin-bottom: 0;
  padding: 12px 0;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .detail-toolbar-title {
  font-weight: 600;
  color: #303133;
}

.local-modal-content .modal-detail-section .detail-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  flex: 0 1 auto;
  overflow: hidden;
}

.local-modal-content >>> .modal-form-compact .el-row {
  margin-bottom: 4px;
}

.local-modal-content >>> .modal-form-compact .el-form-item {
  margin-bottom: 4px;
}

.local-modal-content >>> .modal-form-compact .el-input,
.local-modal-content >>> .modal-form-compact .el-select,
.local-modal-content >>> .modal-form-compact .el-date-picker {
  width: 100%;
}

.local-modal-content >>> .modal-form-compact .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.local-modal-content >>> .profit-loss-modal-head-form .head-label-nowrap .el-form-item__label {
  white-space: nowrap;
}

.local-modal-content >>> .modal-detail-section .profit-loss-detail-table th {
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

.local-modal-content >>> .modal-detail-section .profit-loss-detail-table th .cell {
  text-align: center !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.local-modal-content >>> .modal-detail-section .profit-loss-detail-table td .cell {
  font-size: 14px !important;
}

.local-modal-content >>> .modal-detail-section .profit-loss-detail-table .el-table__footer-wrapper td .cell,
.local-modal-content >>> .modal-detail-section .profit-loss-detail-table .el-table__fixed-footer-wrapper td .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style>
/* 与盘点申请 / 到货验收列表页布局一致 */
.app-container.profit-loss-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.profit-loss-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
}

.app-container.profit-loss-page > .el-form.query-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.app-container.profit-loss-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.profit-loss-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.profit-loss-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.profit-loss-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-second {
  position: relative;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.profit-loss-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.profit-loss-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.profit-loss-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.profit-loss-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.profit-loss-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.profit-loss-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.profit-loss-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.profit-loss-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.profit-loss-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
  transition: background 0.2s ease !important;
}

.app-container.profit-loss-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
}

.app-container.profit-loss-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

.app-container.profit-loss-page > .el-table.table-compact .el-table__body-wrapper {
  scroll-behavior: smooth !important;
  -webkit-overflow-scrolling: touch !important;
}
</style>
