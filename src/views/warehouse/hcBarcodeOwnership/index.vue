<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true" label-width="88px">
      <el-form-item label="条码值" prop="barcodeValue">
        <el-input v-model="queryParams.barcodeValue" placeholder="院内码/定数包码" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="高低值" prop="valueLevel">
        <el-select v-model="queryParams.valueLevel" placeholder="全部" clearable style="width: 120px">
          <el-option label="高值" value="1" />
          <el-option label="低值" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="businessTypeCode">
        <el-input v-model="queryParams.businessTypeCode" placeholder="如 GZ_ORDER_PREP_ACCEPT" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="单据号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="单据号" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="耗材名称" prop="materialName">
        <el-input v-model="queryParams.materialName" placeholder="耗材名称" clearable style="width: 160px" @keyup.enter.native="handleQuery" />
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
          v-hasPermi="['hc:barcode:public:ownership:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="dataList" border stripe size="small" height="calc(100vh - 260px)">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="条码值" prop="barcodeValue" min-width="140" show-overflow-tooltip />
      <el-table-column label="高低值" prop="valueLevel" width="72" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.valueLevel === '1' ? '高值' : (scope.row.valueLevel === '2' ? '低值' : scope.row.valueLevel) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="业务类型" prop="businessTypeName" min-width="140" show-overflow-tooltip />
      <el-table-column label="单据号" prop="billNo" width="140" show-overflow-tooltip />
      <el-table-column label="耗材" prop="materialName" min-width="140" show-overflow-tooltip />
      <el-table-column label="规格" prop="materialSpeci" width="100" show-overflow-tooltip />
      <el-table-column label="批次号" prop="batchNo" width="120" show-overflow-tooltip />
      <el-table-column label="仓库" prop="warehouseName" width="120" show-overflow-tooltip />
      <el-table-column label="归属" prop="currentHolderType" width="80" align="center" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="80" align="center" />
      <el-table-column label="创建时间" prop="createTime" width="160" align="center" />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog title="条码归属详情" :visible.sync="detailVisible" width="720px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="条码值">{{ detail.barcodeValue }}</el-descriptions-item>
        <el-descriptions-item label="高低值">{{ detail.valueLevel === '1' ? '高值' : (detail.valueLevel === '2' ? '低值' : detail.valueLevel) }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ detail.businessTypeName }}</el-descriptions-item>
        <el-descriptions-item label="单据号">{{ detail.billNo }}</el-descriptions-item>
        <el-descriptions-item label="耗材">{{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ detail.materialSpeci }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="当前持有方">{{ detail.currentHolderType }}</el-descriptions-item>
        <el-descriptions-item label="当前仓库ID">{{ detail.currentWarehouseId }}</el-descriptions-item>
        <el-descriptions-item label="当前科室ID">{{ detail.currentDepartmentId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="主条码" :span="2">{{ detail.masterBarcode }}</el-descriptions-item>
        <el-descriptions-item label="副条码" :span="2">{{ detail.secondaryBarcode }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { listHcBarcodeOwnership, getHcBarcodeOwnership } from '@/api/warehouse/hcBarcodePublic'

export default {
  name: 'HcBarcodeOwnership',
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      dataList: [],
      detailVisible: false,
      detail: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        barcodeValue: undefined,
        valueLevel: undefined,
        businessTypeCode: undefined,
        billNo: undefined,
        materialName: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listHcBarcodeOwnership(this.queryParams).then(res => {
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
      this.download('hc/barcode/public/ownership/export', { ...this.queryParams }, `条码归属_${new Date().getTime()}.xlsx`)
    },
    openDetail(row) {
      if (!row || !row.id) {
        return
      }
      getHcBarcodeOwnership(row.id).then(res => {
        this.detail = res.data
        this.detailVisible = true
      })
    }
  }
}
</script>
