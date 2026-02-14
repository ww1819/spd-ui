<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="期初单号" prop="billNo">
        <el-input v-model="queryParams.billNo" placeholder="请输入期初单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <SelectWarehouse v-model="queryParams.warehouseId" />
      </el-form-item>
      <el-form-item label="单据状态" prop="billStatus">
        <el-select v-model="queryParams.billStatus" placeholder="请选择" clearable style="width: 120px">
          <el-option label="待审核" :value="0" />
          <el-option label="已审核" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="导入时间">
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
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-upload2" size="medium" @click="openUpload" v-hasPermi="['warehouse:initialStockImport:import']">期初导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" :row-class-name="tableRowIndex" height="54vh" border>
      <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip />
      <el-table-column label="期初单号" align="center" prop="billNo" min-width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">{{ scope.row.billNo }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="所属仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip />
      <el-table-column label="导入操作人" align="center" prop="importOperator" width="100" show-overflow-tooltip />
      <el-table-column label="导入时间" align="center" prop="importTime" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.importTime">{{ parseTime(scope.row.importTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="库存生成时间" align="center" prop="stockGenTime" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.stockGenTime">{{ parseTime(scope.row.stockGenTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="90">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.billStatus === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.billStatus === 1" type="success">已审核</el-tag>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
          <el-button size="small" type="text" icon="el-icon-check" @click="handleAudit(scope.row)" v-hasPermi="['warehouse:initialStockImport:audit']" v-if="scope.row.billStatus === 0">审核</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <!-- 上传/预览 弹窗 -->
    <el-dialog title="期初库存导入" :visible.sync="upload.visible" width="900px" append-to-body :close-on-click-modal="false">
      <el-form size="small" :inline="true">
        <el-form-item label="所属仓库">
          <SelectWarehouse v-model="upload.warehouseId" placeholder="请选择仓库（可与Excel中一致）" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".xlsx,.xls"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
        </el-form-item>
      </el-form>
      <div v-if="upload.previewList && upload.previewList.length" style="margin-top: 12px;">
        <div style="margin-bottom: 8px;">预览（共 {{ upload.previewList.length }} 条），确认无误后点击「确认导入」生成期初单</div>
        <el-table :data="upload.previewList" border size="small" max-height="280">
          <el-table-column type="index" label="行号" width="55" align="center" />
          <el-table-column label="耗材编码" prop="data.materialCode" min-width="90" show-overflow-tooltip />
          <el-table-column label="耗材名称" prop="data.materialName" min-width="90" show-overflow-tooltip />
          <el-table-column label="第三方库存明细ID" prop="data.thirdPartyDetailId" width="110" show-overflow-tooltip />
          <el-table-column label="第三方产品档案ID" prop="data.thirdPartyMaterialId" width="110" show-overflow-tooltip />
          <el-table-column label="库房分类" prop="data.warehouseCategory" width="90" show-overflow-tooltip />
          <el-table-column label="财务分类" prop="data.financeCategory" width="90" show-overflow-tooltip />
          <el-table-column label="单价" prop="data.unitPrice" width="80" align="right" />
          <el-table-column label="数量" prop="data.qty" width="70" align="right" />
          <el-table-column label="批号" prop="data.batchNumber" width="90" show-overflow-tooltip />
          <el-table-column label="效期" prop="data.endTime" width="90" />
          <el-table-column label="生产厂家" prop="data.factoryName" width="90" show-overflow-tooltip />
          <el-table-column label="供应商" prop="data.supplierName" width="90" show-overflow-tooltip />
          <el-table-column label="校验" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              <span v-else style="color: #67c23a;">通过</span>
            </template>
          </el-table-column>
        </el-table>
        <div slot="footer" style="margin-top: 12px; text-align: right;">
          <el-button @click="upload.visible = false">取 消</el-button>
          <el-button type="primary" @click="confirmImport" :loading="upload.confirmLoading" :disabled="!canConfirmImport">确认导入</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 详情 弹窗 -->
    <el-dialog title="期初单详情" :visible.sync="detail.visible" width="920px" append-to-body>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="期初单号">{{ detail.form.billNo }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ detail.form.warehouse && detail.form.warehouse.name ? detail.form.warehouse.name : '--' }}</el-descriptions-item>
        <el-descriptions-item label="导入操作人">{{ detail.form.importOperator }}</el-descriptions-item>
        <el-descriptions-item label="导入时间">{{ parseTime(detail.form.importTime, '{y}-{m}-{d} {h}:{i}') }}</el-descriptions-item>
        <el-descriptions-item label="库存生成时间">{{ detail.form.stockGenTime ? parseTime(detail.form.stockGenTime, '{y}-{m}-{d} {h}:{i}') : '--' }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag v-if="detail.form.billStatus === 0" type="warning">待审核</el-tag>
          <el-tag v-else-if="detail.form.billStatus === 1" type="success">已审核</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 12px; font-weight: 600;">明细</div>
      <el-table :data="detail.form.entryList || []" border size="small" max-height="320" style="margin-top: 6px;">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="耗材编码" align="center" prop="material.code" min-width="100" show-overflow-tooltip />
        <el-table-column label="耗材名称" align="center" prop="material.name" min-width="120" show-overflow-tooltip />
        <el-table-column label="批次号" align="center" prop="batchNo" width="140" show-overflow-tooltip />
        <el-table-column label="批号" align="center" prop="batchNumber" width="100" show-overflow-tooltip />
        <el-table-column label="单价" align="right" prop="unitPrice" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.unitPrice) }}</template>
        </el-table-column>
        <el-table-column label="数量" align="right" prop="qty" width="80">
          <template slot-scope="scope">{{ formatNum(scope.row.qty) }}</template>
        </el-table-column>
        <el-table-column label="金额" align="right" prop="amt" width="90">
          <template slot-scope="scope">{{ formatNum(scope.row.amt) }}</template>
        </el-table-column>
        <el-table-column label="效期" align="center" prop="endTime" width="100" />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detail.visible = false">关 闭</el-button>
        <el-button type="primary" @click="handleAudit(detail.form)" v-hasPermi="['warehouse:initialStockImport:audit']" v-if="detail.form.billStatus === 0">审 核</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { preview, confirmImport, listInitialImport, getInitialImport, auditInitialImport, importTemplate } from '@/api/warehouse/initialStockImport'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'InitialStockImport',
  components: { SelectWarehouse },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      dataList: [],
      dateRange: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        warehouseId: null,
        billStatus: null
      },
      upload: {
        visible: false,
        warehouseId: null,
        file: null,
        previewList: [],
        confirmLoading: false
      },
      detail: {
        visible: false,
        form: {}
      }
    }
  },
  computed: {
    canConfirmImport() {
      if (!this.upload.previewList || !this.upload.previewList.length) return false
      if (this.upload.previewList.some(p => p.error)) return false
      if (this.upload.warehouseId != null) return true
      const first = this.upload.previewList[0] && this.upload.previewList[0].data
      return !!(first && first.warehouseCode)
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
      const params = { ...this.queryParams }
      if (this.dateRange && this.dateRange.length === 2) {
        params.params = { beginTime: this.dateRange[0], endTime: this.dateRange[1] }
      }
      listInitialImport(params).then(response => {
        this.dataList = response.rows || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    openUpload() {
      this.upload.visible = true
      this.upload.warehouseId = null
      this.upload.file = null
      this.upload.previewList = []
      this.$refs.uploadRef && this.$refs.uploadRef.clearFiles()
    },
    handleFileChange(file) {
      this.upload.file = file.raw
      if (!this.upload.file) return
      preview(this.upload.file, this.upload.warehouseId).then(res => {
        if (res.code !== 200) {
          this.$message.error(res.msg || '解析失败')
          return
        }
        const data = res.data
        this.upload.previewList = data.list || []
        if (data.warehouseId) this.upload.warehouseId = data.warehouseId
        if (!this.upload.previewList.length) {
          this.$message.warning('未解析到有效数据')
        } else {
          this.$message.success('解析成功，请确认后点击「确认导入」')
        }
      }).catch(e => {
        this.$message.error(e.msg || '解析失败')
      })
    },
    handleExceed() {
      this.$message.warning('仅支持单文件上传')
    },
    confirmImport() {
      const rows = this.upload.previewList.filter(p => !p.error).map(p => p.data)
      if (!rows.length) {
        this.$message.warning('没有可导入的数据')
        return
      }
      let warehouseId = this.upload.warehouseId
      if (warehouseId == null && rows[0] && rows[0].warehouseCode) {
        this.$message.warning('请选择所属仓库')
        return
      }
      this.upload.confirmLoading = true
      confirmImport(warehouseId, rows).then(res => {
        this.upload.confirmLoading = false
        this.upload.visible = false
        this.$message.success(res.msg || '导入成功')
        this.getList()
      }).catch(() => { this.upload.confirmLoading = false })
    },
    downloadTemplate() {
      importTemplate().then(res => {
        const blob = res && res instanceof Blob ? res : (res && res.data)
        if (!blob || !(blob instanceof Blob)) {
          this.$message.error('下载模板失败')
          return
        }
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = '期初库存导入模板.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
      }).catch(() => {
        this.$message.error('下载模板失败')
      })
    },
    handleView(row) {
      getInitialImport(row.id).then(res => {
        this.detail.form = res.data || {}
        this.detail.visible = true
      })
    },
    handleAudit(row) {
      const id = row.id
      this.$confirm('审核后将生成批次、库存及仓库流水（QC），是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return auditInitialImport(id)
      }).then(() => {
        this.$message.success('审核成功')
        this.detail.visible = false
        this.getList()
      })
    }
  }
}
</script>

<style scoped>
</style>
