<template>
  <div class="app-container list-page hc-barcode-ownership-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" class="query-form">
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="moreSearchFieldClass(t)"
          >
            <el-input
              v-if="t === 'barcodeValue'"
              v-model="queryParams.barcodeValue"
              placeholder="院内码/定数包码"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'businessTypeCode'"
              v-model="queryParams.businessTypeCode"
              placeholder="业务类型"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else-if="t === 'billNo'"
              v-model="queryParams.billNo"
              placeholder="单据号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.materialName"
              placeholder="耗材名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item prop="valueLevel" class="query-item-inline">
              <el-select v-model="queryParams.valueLevel" placeholder="高低值" clearable class="more-search-short-select">
                <el-option label="高值" value="1" />
                <el-option label="低值" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['hc:barcode:public:ownership:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
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
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="detailVisible = false">关 闭</el-button>
      </div>
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
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '条码值', value: 'barcodeValue' },
        { label: '业务类型', value: 'businessTypeCode' },
        { label: '单据号', value: 'billNo' },
        { label: '耗材名称', value: 'materialName' }
      ],
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
  computed: {
    moreSearchStorageKey() {
      return 'spd.warehouse.hcBarcodeOwnership.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listHcBarcodeOwnership(params).then(res => {
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
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.handleQuery()
    },
    handleExport() {
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      this.download('hc/barcode/public/ownership/export', params, `条码归属_${new Date().getTime()}.xlsx`)
    },
    openDetail(row) {
      if (!row || !row.id) {
        return
      }
      getHcBarcodeOwnership(row.id).then(res => {
        this.detail = res.data
        this.detailVisible = true
      })
    },
    moreSearchFieldClass() {
      return 'more-search-field--text'
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar
      if (bar && typeof bar.loadDefaults === 'function') {
        return bar.loadDefaults()
      }
      const fallback = this.builtInMoreSearchDefaults.slice()
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return fallback
        const allow = new Set(this.moreSearchOptions.map(o => o.value))
        const cleaned = parsed.filter(v => allow.has(v))
        return cleaned.length ? cleaned : fallback
      } catch (e) {
        return fallback
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || [])
      const map = {
        barcodeValue: 'barcodeValue',
        businessTypeCode: 'businessTypeCode',
        billNo: 'billNo',
        materialName: 'materialName'
      }
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null
        }
      })
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    }
  }
}
</script>

<style scoped>
.list-query-panel {
  margin-top: -20px;
}
</style>
