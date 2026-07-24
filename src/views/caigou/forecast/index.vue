<template>
  <div class="app-container caigou-forecast-page">
    <el-tabs v-model="activeTab" @tab-click="onTabClick">
      <el-tab-pane label="计算建议" name="calc">
        <el-form :model="calcForm" size="small" :inline="true" class="query-form query-form-compact">
          <el-form-item label="仓库" required>
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="calcForm.warehouseId" excludeWarehouseType="设备" />
            </div>
          </el-form-item>
          <el-form-item label="高值/低值">
            <el-select v-model="calcForm.isGz" placeholder="全部" clearable style="width: 120px">
              <el-option label="高值" value="1" />
              <el-option label="低值" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="回顾天数">
            <el-input-number v-model="calcForm.calcDays" :min="1" :max="365" controls-position="right" style="width: 120px" />
          </el-form-item>
          <el-form-item label="提前期(天)">
            <el-input-number v-model="calcForm.leadTimeDays" :min="1" :max="90" controls-position="right" style="width: 120px" />
          </el-form-item>
          <el-form-item label="安全天数">
            <el-input-number v-model="calcForm.safetyDays" :min="0" :max="90" controls-position="right" style="width: 120px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="medium" :loading="calcLoading" @click="handleCalc" v-hasPermi="['caigou:forecast:calc']">计算建议</el-button>
            <el-button type="primary" size="medium" :disabled="!currentTaskId || !hasSelected" :loading="genLoading" @click="handleGenerate" v-hasPermi="['caigou:forecast:generate']">生成采购计划</el-button>
            <el-button size="medium" :disabled="!currentTaskId" @click="handleSaveEntries" v-hasPermi="['caigou:forecast:calc']">保存确认量</el-button>
          </el-form-item>
        </el-form>

        <div v-if="currentTask" class="task-meta">
          <span>任务号：{{ currentTask.taskNo }}</span>
          <span>状态：{{ currentTask.status === '1' ? '已生成计划' : '草稿' }}</span>
          <span v-if="currentTask.generatedPlanNos">已生成：{{ currentTask.generatedPlanNos }}</span>
          <el-button v-if="currentTask.generatedPlanNos" type="text" @click="goPurchasePlan">查看采购计划</el-button>
        </div>

        <el-table
          v-loading="detailLoading"
          :data="entryList"
          class="table-compact"
          height="calc(100vh - 360px)"
          stripe
          border
          @selection-change="handleSelectionChange"
          ref="entryTable"
        >
          <el-table-column type="selection" width="50" align="center" :selectable="rowSelectable" />
          <el-table-column label="耗材编码" prop="materialCode" min-width="110" show-overflow-tooltip />
          <el-table-column label="耗材名称" prop="materialName" min-width="140" show-overflow-tooltip />
          <el-table-column label="规格" prop="speci" width="100" show-overflow-tooltip />
          <el-table-column label="型号" prop="model" width="90" show-overflow-tooltip />
          <el-table-column label="单位" prop="unitName" width="60" align="center" />
          <el-table-column label="供应商" prop="supplierName" min-width="120" show-overflow-tooltip>
            <template slot-scope="scope">
              <span :class="{ 'text-danger': !scope.row.supplierId }">{{ scope.row.supplierName || '未维护' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="现存量" prop="stockQty" width="90" align="right" />
          <el-table-column label="在途" prop="inTransitQty" width="80" align="right" />
          <el-table-column label="日均" prop="avgDailyQty" width="90" align="right">
            <template slot-scope="scope">{{ formatNum(scope.row.avgDailyQty) }}</template>
          </el-table-column>
          <el-table-column label="下限" prop="lowerLimit" width="70" align="right" />
          <el-table-column label="上限" prop="upperLimit" width="70" align="right" />
          <el-table-column label="ROP" prop="ropQty" width="90" align="right">
            <template slot-scope="scope">{{ formatNum(scope.row.ropQty) }}</template>
          </el-table-column>
          <el-table-column label="建议量" prop="suggestQty" width="90" align="right">
            <template slot-scope="scope">{{ formatNum(scope.row.suggestQty) }}</template>
          </el-table-column>
          <el-table-column label="确认量" width="120" align="center">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.confirmQty"
                :min="0"
                :precision="2"
                :controls="false"
                size="mini"
                style="width: 100px"
                :disabled="currentTask && currentTask.status === '1'"
              />
            </template>
          </el-table-column>
          <el-table-column label="说明" prop="formulaRemark" min-width="180" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="历史任务" name="history">
        <el-form :model="queryParams" size="small" :inline="true" class="query-form query-form-compact">
          <el-form-item>
            <el-input v-model="queryParams.taskNo" placeholder="任务单号" clearable style="width: 160px" @keyup.enter.native="getHistoryList" />
          </el-form-item>
          <el-form-item>
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="设备" />
            </div>
          </el-form-item>
          <el-form-item>
            <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
              <el-option label="草稿" value="0" />
              <el-option label="已生成计划" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="medium" @click="getHistoryList">搜索</el-button>
            <el-button size="medium" @click="resetHistoryQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="historyLoading" :data="historyList" class="table-compact" height="calc(100vh - 320px)" stripe border>
          <el-table-column label="任务单号" prop="taskNo" width="180" show-overflow-tooltip>
            <template slot-scope="scope">
              <el-button type="text" @click="openHistoryTask(scope.row)">{{ scope.row.taskNo }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="仓库" prop="warehouse.name" min-width="140" show-overflow-tooltip />
          <el-table-column label="高值/低值" width="90" align="center">
            <template slot-scope="scope">{{ formatIsGz(scope.row.isGz) }}</template>
          </el-table-column>
          <el-table-column label="回顾天数" prop="calcDays" width="90" align="center" />
          <el-table-column label="提前期" prop="leadTimeDays" width="80" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="scope">{{ scope.row.status === '1' ? '已生成计划' : '草稿' }}</template>
          </el-table-column>
          <el-table-column label="生成计划单号" prop="generatedPlanNos" min-width="160" show-overflow-tooltip />
          <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
        </el-table>
        <pagination
          v-show="historyTotal > 0"
          :total="historyTotal"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getHistoryList"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import {
  listForecastTask,
  getForecastTask,
  calcForecast,
  updateForecastEntry,
  generateForecastPlan
} from '@/api/caigou/forecast'

export default {
  name: 'CaigouForecast',
  components: { SelectWarehouse },
  data() {
    return {
      activeTab: 'calc',
      calcForm: {
        warehouseId: null,
        isGz: null,
        calcDays: 30,
        leadTimeDays: 7,
        safetyDays: 3
      },
      calcLoading: false,
      genLoading: false,
      detailLoading: false,
      currentTask: null,
      currentTaskId: null,
      entryList: [],
      selectedRows: [],
      historyLoading: false,
      historyList: [],
      historyTotal: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 20,
        taskNo: undefined,
        warehouseId: undefined,
        status: undefined
      }
    }
  },
  computed: {
    hasSelected() {
      return this.selectedRows && this.selectedRows.length > 0
    }
  },
  methods: {
    formatNum(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      if (Number.isNaN(n)) return v
      return n.toFixed(2).replace(/\.?0+$/, '') === '' ? '0' : parseFloat(n.toFixed(6)).toString()
    },
    formatIsGz(v) {
      if (v === '1') return '高值'
      if (v === '2') return '低值'
      return '全部'
    },
    rowSelectable(row) {
      return !(this.currentTask && this.currentTask.status === '1')
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows || []
    },
    applyTask(task) {
      this.currentTask = task
      this.currentTaskId = task && task.id
      this.entryList = (task && task.entryList) ? task.entryList.map(e => ({
        ...e,
        confirmQty: e.confirmQty != null ? Number(e.confirmQty) : 0
      })) : []
      this.$nextTick(() => {
        const table = this.$refs.entryTable
        if (!table) return
        table.clearSelection()
        this.entryList.forEach(row => {
          if (row.selected === '1' || row.selected === 1) {
            table.toggleRowSelection(row, true)
          }
        })
      })
    },
    handleCalc() {
      if (!this.calcForm.warehouseId) {
        this.$modal.msgWarning('请选择仓库')
        return
      }
      this.calcLoading = true
      const payload = {
        warehouseId: this.calcForm.warehouseId,
        isGz: this.calcForm.isGz || undefined,
        calcDays: this.calcForm.calcDays,
        leadTimeDays: this.calcForm.leadTimeDays,
        safetyDays: this.calcForm.safetyDays
      }
      calcForecast(payload).then(res => {
        this.applyTask(res.data)
        this.$modal.msgSuccess('计算完成，共 ' + (this.entryList.length) + ' 条建议')
      }).finally(() => {
        this.calcLoading = false
      })
    },
    buildEntryPayload() {
      const selectedIds = new Set((this.selectedRows || []).map(r => r.id))
      return {
        entries: this.entryList.map(row => ({
          id: row.id,
          confirmQty: row.confirmQty,
          selected: selectedIds.has(row.id) ? '1' : '0'
        }))
      }
    },
    handleSaveEntries() {
      if (!this.currentTaskId) return
      updateForecastEntry(this.buildEntryPayload()).then(() => {
        this.$modal.msgSuccess('已保存')
        return getForecastTask(this.currentTaskId)
      }).then(res => {
        if (res && res.data) this.applyTask(res.data)
      })
    },
    handleGenerate() {
      if (!this.currentTaskId) return
      if (!this.hasSelected) {
        this.$modal.msgWarning('请勾选需要生成计划的明细')
        return
      }
      this.$modal.confirm('确认将勾选明细生成草稿采购计划？').then(() => {
        this.genLoading = true
        return updateForecastEntry(this.buildEntryPayload())
      }).then(() => {
        return generateForecastPlan({
          taskId: this.currentTaskId,
          entryIds: this.selectedRows.map(r => r.id)
        })
      }).then(res => {
        const data = res.data || {}
        this.$modal.msgSuccess(data.message || '生成成功')
        return getForecastTask(this.currentTaskId)
      }).then(res => {
        if (res && res.data) this.applyTask(res.data)
      }).catch(() => {}).finally(() => {
        this.genLoading = false
      })
    },
    goPurchasePlan() {
      this.$router.push({ path: '/caigou/jihua' })
    },
    onTabClick(tab) {
      if (tab.name === 'history') {
        this.getHistoryList()
      }
    },
    getHistoryList() {
      this.historyLoading = true
      listForecastTask(this.queryParams).then(res => {
        this.historyList = res.rows || []
        this.historyTotal = res.total || 0
      }).finally(() => {
        this.historyLoading = false
      })
    },
    resetHistoryQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 20,
        taskNo: undefined,
        warehouseId: undefined,
        status: undefined
      }
      this.getHistoryList()
    },
    openHistoryTask(row) {
      if (!row || !row.id) return
      this.detailLoading = true
      getForecastTask(row.id).then(res => {
        this.applyTask(res.data)
        if (res.data) {
          this.calcForm.warehouseId = res.data.warehouseId
          this.calcForm.isGz = res.data.isGz || null
          this.calcForm.calcDays = res.data.calcDays || 30
          this.calcForm.leadTimeDays = res.data.leadTimeDays || 7
          this.calcForm.safetyDays = res.data.safetyDays != null ? res.data.safetyDays : 3
        }
        this.activeTab = 'calc'
      }).finally(() => {
        this.detailLoading = false
      })
    }
  }
}
</script>

<style scoped>
.caigou-forecast-page .task-meta {
  margin: 0 0 10px;
  color: #606266;
  font-size: 13px;
}
.caigou-forecast-page .task-meta > span {
  margin-right: 16px;
}
.caigou-forecast-page .text-danger {
  color: #f56c6c;
}
.query-select-wrapper {
  display: inline-block;
  min-width: 180px;
}
</style>
