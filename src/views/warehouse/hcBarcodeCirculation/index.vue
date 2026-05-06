<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true" label-width="100px">
      <el-form-item label="主档ID" prop="hcBarcodeMasterId">
        <el-input v-model="queryParams.hcBarcodeMasterId" placeholder="hc_barcode_master.id" clearable style="width: 260px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="条码值" prop="barcodeValue">
        <el-input v-model="queryParams.barcodeValue" placeholder="模糊匹配" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['hc:barcode:public:circulation:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="dataList" border stripe size="small" height="calc(100vh - 220px)">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="事件" prop="eventName" min-width="160" show-overflow-tooltip />
      <el-table-column label="事件码" prop="eventCode" width="120" show-overflow-tooltip />
      <el-table-column label="事件时间" prop="eventTime" width="160" align="center" />
      <el-table-column label="条码" prop="barcodeValue" min-width="120" show-overflow-tooltip />
      <el-table-column label="业务域" prop="billDomain" width="100" show-overflow-tooltip />
      <el-table-column label="单据号" prop="billNo" width="140" show-overflow-tooltip />
      <el-table-column label="数量" prop="qty" width="90" align="right" />
      <el-table-column label="转出仓" prop="fromWarehouseId" width="100" show-overflow-tooltip />
      <el-table-column label="转入仓" prop="toWarehouseId" width="100" show-overflow-tooltip />
      <el-table-column label="转出科室" prop="fromDepartmentId" width="100" show-overflow-tooltip />
      <el-table-column label="转入科室" prop="toDepartmentId" width="100" show-overflow-tooltip />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listHcBarcodeCirculation } from '@/api/warehouse/hcBarcodePublic'

export default {
  name: 'HcBarcodeCirculation',
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      dataList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        hcBarcodeMasterId: undefined,
        barcodeValue: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listHcBarcodeCirculation(this.queryParams).then(res => {
        this.dataList = res.rows || []
        this.total = res.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.handleQuery()
    },
    handleExport() {
      this.download('hc/barcode/public/circulation/export', { ...this.queryParams }, `条码流通_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
