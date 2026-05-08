<template>
  <div class="app-container">
    <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" label-width="88px">
      <el-form-item label="开始时间">
        <el-date-picker
          v-model="queryParams.beginDate"
          type="datetime"
          value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="开始时间"
          style="width: 190px"
        />
      </el-form-item>
      <el-form-item label="结束时间">
        <el-date-picker
          v-model="queryParams.endDate"
          type="datetime"
          value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="结束时间"
          style="width: 190px"
        />
      </el-form-item>
      <el-form-item label="仓库">
        <SelectWarehouse v-model="queryParams.warehouseId" :finance-pick-mode="true" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="供应商">
        <SelectSupplier v-model="queryParams.supplerId" :finance-pick-mode="true" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="科室">
        <SelectDepartment v-model="queryParams.departmentId" :finance-pick-mode="true" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">查询</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-tabs v-model="activeTab" @tab-click="loadCurrentTab">
      <el-tab-pane label="卫材入库" name="inbound">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="warning"
              icon="el-icon-download"
              size="small"
              @click="handleExportInbound"
              v-hasPermi="['finance:medicalStockSummary:export']"
            >导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loadingInbound" :data="inboundList" border>
          <el-table-column label="日期" prop="statDate" align="center" width="160" />
          <el-table-column label="供货商" prop="supplierName" align="center" min-width="220" />
          <el-table-column label="材料类别" prop="materialCategoryName" align="center" min-width="180" />
          <el-table-column label="金额" prop="amount" align="right" width="160">
            <template slot-scope="scope">
              {{ formatAmount(scope.row.amount) }}
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="inboundTotal > 0"
          :total="inboundTotal"
          :page.sync="inboundPage.pageNum"
          :limit.sync="inboundPage.pageSize"
          @pagination="loadInbound"
        />
      </el-tab-pane>

      <el-tab-pane label="卫材出库" name="outbound">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="warning"
              icon="el-icon-download"
              size="small"
              @click="handleExportOutbound"
              v-hasPermi="['finance:medicalStockSummary:export']"
            >导出</el-button>
          </el-col>
        </el-row>

        <el-table v-loading="loadingOutbound" :data="outboundList" border>
          <el-table-column label="日期" prop="statDate" align="center" width="160" />
          <el-table-column label="科室名称" prop="departmentName" align="center" min-width="180" />
          <el-table-column label="材料类别" prop="materialCategoryName" align="center" min-width="180" />
          <el-table-column label="金额" prop="amount" align="right" width="160">
            <template slot-scope="scope">
              {{ formatAmount(scope.row.amount) }}
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" align="center" width="120" />
          <el-table-column label="是否高值" prop="isGzText" align="center" width="100" />
        </el-table>
        <pagination
          v-show="outboundTotal > 0"
          :total="outboundTotal"
          :page.sync="outboundPage.pageNum"
          :limit.sync="outboundPage.pageSize"
          @pagination="loadOutbound"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { listMedicalInboundSummary, listMedicalOutboundSummary } from '@/api/finance/medicalStockSummary'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'

function pad2(n) {
  return n < 10 ? '0' + n : String(n)
}

function monthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const first = new Date(y, m, 1, 0, 0, 0)
  const last = new Date(y, m + 1, 0, 23, 59, 59)
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  return { beginDate: fmt(first), endDate: fmt(last) }
}

export default {
  name: 'MedicalStockSummary',
  components: { SelectWarehouse, SelectSupplier, SelectDepartment },
  data() {
    return {
      activeTab: 'inbound',
      queryParams: {
        ...monthRange(),
        warehouseId: null,
        supplerId: null,
        departmentId: null,
      },
      inboundList: [],
      inboundTotal: 0,
      inboundPage: { pageNum: 1, pageSize: 10 },
      outboundList: [],
      outboundTotal: 0,
      outboundPage: { pageNum: 1, pageSize: 10 },
      loadingInbound: false,
      loadingOutbound: false,
    }
  },
  created() {
    this.loadInbound()
  },
  methods: {
    formatAmount(v) {
      const n = Number(v || 0)
      if (Number.isNaN(n)) return v
      return n.toFixed(2)
    },
    buildBaseParams() {
      return {
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        warehouseId: this.queryParams.warehouseId,
        supplerId: this.queryParams.supplerId,
        departmentId: this.queryParams.departmentId,
      }
    },
    loadCurrentTab() {
      if (this.activeTab === 'inbound') {
        this.loadInbound()
      } else {
        this.loadOutbound()
      }
    },
    loadInbound() {
      this.loadingInbound = true
      listMedicalInboundSummary({ ...this.buildBaseParams(), ...this.inboundPage }).then((res) => {
        this.inboundList = res.rows || []
        this.inboundTotal = res.total || 0
      }).finally(() => {
        this.loadingInbound = false
      })
    },
    loadOutbound() {
      this.loadingOutbound = true
      listMedicalOutboundSummary({ ...this.buildBaseParams(), ...this.outboundPage }).then((res) => {
        this.outboundList = res.rows || []
        this.outboundTotal = res.total || 0
      }).finally(() => {
        this.loadingOutbound = false
      })
    },
    handleQuery() {
      this.inboundPage.pageNum = 1
      this.outboundPage.pageNum = 1
      this.loadCurrentTab()
    },
    resetQuery() {
      Object.assign(this.queryParams, {
        ...monthRange(),
        warehouseId: null,
        supplerId: null,
        departmentId: null,
      })
      this.inboundPage.pageNum = 1
      this.outboundPage.pageNum = 1
      this.loadCurrentTab()
    },
    handleExportInbound() {
      this.download('/finance/medicalStockSummary/inbound/export', this.buildBaseParams(), `卫材入库汇总_${Date.now()}.xlsx`)
    },
    handleExportOutbound() {
      this.download('/finance/medicalStockSummary/outbound/export', this.buildBaseParams(), `卫材出库汇总_${Date.now()}.xlsx`)
    },
  },
}
</script>
