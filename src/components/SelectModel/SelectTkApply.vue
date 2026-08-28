<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask tk-apply-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'tk-apply-select-full-modal': !nested
    }"
  >
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        v-show="showSearch"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form tk-apply-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="退库单号" prop="billNo">
                <el-input
                  v-model="queryParams.billNo"
                  placeholder="科室退库单号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="仓库" prop="warehouseId">
                <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="供应商" prop="supplierId">
                <SelectSupplier v-model="queryParams.supplierId" :value2="isShow" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="科室" prop="departmentId">
                <SelectDepartment v-model="queryParams.departmentId" :value2="isShow" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材" prop="materialId">
                <SelectMaterial v-model="queryParams.materialId" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="引用状态" prop="docRefStatus">
                <el-select v-model="queryParams.params.docRefStatus" clearable placeholder="全部" size="small">
                  <el-option v-for="o in docRefStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">科室退库单信息</span>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-search"
              @click="handleQuery"
            >搜索</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-refresh"
              @click="resetQuery"
            >重置</el-button>
            <el-button size="small" @click="handleClose">取 消</el-button>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-check"
              @click="checkBtn"
            >确 定</el-button>
          </div>
        </el-row>

        <div
          v-if="nested"
          class="apply-table-panel"
          ref="filterTablePanel"
        >
          <el-table
            ref="singleTable"
            v-loading="loading"
            class="table-compact apply-main-table"
            :data="warehouseList"
            :row-class-name="warehouseListIndex"
            @selection-change="handleSelectionChange"
            :height="filterTableHeight"
            border
            stripe
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
            <el-table-column
              label="科室退库单号"
              align="center"
              prop="billNo"
              width="180"
              show-overflow-tooltip
              resizable
              sortable
              :sort-method="(a, b) => sortByStr(a, b, 'billNo')"
            >
              <template slot-scope="scope">
                <el-button type="text" @click="handleView(scope.row)">
                  <span>{{ scope.row.billNo }}</span>
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable />
            <el-table-column
              label="制单日期"
              align="center"
              prop="billDate"
              width="140"
              show-overflow-tooltip
              resizable
              sortable
              :sort-method="(a, b) => sortByDate(a, b, 'billDate')"
            >
              <template slot-scope="scope">
                <span v-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="金额" align="center" prop="totalAmount" width="110" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="引用状态" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
                <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
                <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="单据状态" align="center" prop="billStatus" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
              </template>
            </el-table-column>
            <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip resizable sortable :sort-method="(a, b) => sortByDate(a, b, 'auditDate')">
              <template slot-scope="scope">
                <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="apply-pagination-wrap" ref="filterPaginationWrap">
            <pagination
              class="modal-entry-pagination"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              :hide-on-single-page="false"
              @pagination="handlePagination"
            />
          </div>
        </div>

        <div v-else class="modal-detail-section apply-modal-table-panel">
          <div class="table-wrapper">
            <el-table
              ref="singleTable"
              v-loading="loading"
              class="apply-detail-table"
              :data="warehouseList"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
              <el-table-column
                label="科室退库单号"
                align="center"
                prop="billNo"
                width="180"
                show-overflow-tooltip
                resizable
                sortable
                :sort-method="(a, b) => sortByStr(a, b, 'billNo')"
              >
                <template slot-scope="scope">
                  <el-button type="text" @click="handleView(scope.row)">
                    <span>{{ scope.row.billNo }}</span>
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable />
              <el-table-column
                label="制单日期"
                align="center"
                prop="billDate"
                width="140"
                show-overflow-tooltip
                resizable
                sortable
                :sort-method="(a, b) => sortByDate(a, b, 'billDate')"
              >
                <template slot-scope="scope">
                  <span v-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
              <el-table-column label="金额" align="center" prop="totalAmount" width="110" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="引用状态" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
                  <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
                  <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="单据状态" align="center" prop="billStatus" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus" />
                </template>
              </el-table-column>
              <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip resizable sortable :sort-method="(a, b) => sortByDate(a, b, 'auditDate')">
                <template slot-scope="scope">
                  <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="90" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <el-button size="small" type="text" icon="el-icon-view" @click="handleView(scope.row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="apply-pagination-wrap">
            <pagination
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="handlePagination"
            />
          </div>
        </div>
      </el-form>
    </div>

    <el-dialog :title="title" :visible.sync="open" append-to-body width="90%" top="4vh" @close="open = false">
      <el-table :data="stkIoBillEntryList" border max-height="520" size="small">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="qty" width="90" align="right" />
        <el-table-column label="已引用数量" width="110" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可引用数量" width="110" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" width="120" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import SelectMaterial from '@/components/SelectModel/SelectMaterial'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectDepartment from '@/components/SelectModel/SelectDepartment'
import SelectSupplier from '@/components/SelectModel/SelectSupplier'
import { listTkInventory, getTkInventory } from '@/api/warehouse/tkInventory'
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'

export default {
  name: 'SelectTkApply',
  dicts: ['biz_status'],
  components: { SelectMaterial, SelectWarehouse, SelectDepartment, SelectSupplier },
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String],
    departmentValue: [Number, String],
    materialValue: [Number, String],
    supplierValue: [Number, String],
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: '科室退库单'
    }
  },
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      showSearch: true,
      total: 0,
      warehouseList: [],
      stkIoBillEntryList: [],
      title: '',
      open: false,
      filterTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        applyBillNo: null,
        warehouseId: null,
        departmentId: null,
        supplierId: null,
        materialId: null,
        params: {}
      },
      form: {}
    }
  },
  mounted() {
    this.syncOpenFromProp()
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize)
    }
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize)
    }
  },
  watch: {
    DialogComponentShow(val) {
      if (val) {
        this.syncOpenFromProp()
      } else {
        this.show = false
      }
    }
  },
  methods: {
    syncOpenFromProp() {
      this.show = !!this.DialogComponentShow
      this.queryParams.warehouseId = this.warehouseValue
      this.queryParams.supplierId = this.supplierValue
      this.queryParams.departmentId = this.departmentValue
      this.queryParams.materialId = this.materialValue
      if (this.show) {
        this.selectRow = []
        this.getList()
        if (this.nested) {
          this.$nextTick(() => this.updateFilterTableHeight())
        }
      }
    },
    getList() {
      this.queryParams.billType = '401'
      this.queryParams.billStatus = '2'
      this.loading = true
      listTkInventory(this.queryParams)
        .then(response => {
          this.warehouseList = response.rows || []
          this.total = response.total != null ? Number(response.total) : 0
          this.loading = false
          if (this.nested) {
            this.$nextTick(() => this.updateFilterTableHeight())
          }
        })
        .catch(() => {
          this.loading = false
        })
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page
      if (limit != null) this.queryParams.pageSize = limit
      this.getList()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.queryParams.pageNum = 1
      this.queryParams.pageSize = 10
      this.queryParams.params = this.queryParams.params || {}
      this.queryParams.params.docRefStatus = null
      this.queryParams.warehouseId = this.warehouseValue
      this.queryParams.supplierId = this.supplierValue
      this.queryParams.departmentId = this.departmentValue
      this.queryParams.materialId = this.materialValue
      this.handleQuery()
    },
    handleSelectionChange(val) {
      this.selectRow = val || []
    },
    handleClose() {
      this.show = false
      this.$emit('closeDialog')
    },
    async checkBtn() {
      if (!this.selectRow || !this.selectRow.length) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      const row = this.selectRow[0]
      if (!row || !row.id) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      try {
        const res = await getTkInventory(row.id)
        const entries = (res.data && res.data.stkIoBillEntryList) || []
        const sidSet = new Set()
        for (const e of entries) {
          if (!e) continue
          const sid = e.supplerId != null ? e.supplerId : e.supplierId
          if (sid != null && String(sid).trim() !== '') {
            sidSet.add(String(sid).trim())
          }
        }
        if (sidSet.size > 1) {
          this.$message.error('该退库单明细存在多个不同供应商，不能引用生成退货单')
          return
        }
      } catch (err) {
        const msg = (err && err.response && err.response.data && err.response.data.msg) || (err && err.message) || ''
        this.$message.error(msg ? `校验退库单失败：${msg}` : '校验退库单失败')
        return
      }
      this.$emit('selectData', this.selectRow)
      this.handleClose()
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1
    },
    handleView(row) {
      getTkInventory(row.id).then(response => {
        this.form = response.data
        this.stkIoBillEntryList = (response.data && response.data.stkIoBillEntryList) || []
        this.open = true
        this.title = '查看科室退库单明细'
      })
    },
    sortByStr(a, b, field) {
      const va = (a && a[field] != null) ? String(a[field]) : ''
      const vb = (b && b[field] != null) ? String(b[field]) : ''
      return va.localeCompare(vb, 'zh-CN')
    },
    sortByDate(a, b, field) {
      const ta = a && a[field] ? new Date(a[field]).getTime() : 0
      const tb = b && b[field] ? new Date(b[field]).getTime() : 0
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
      if (Number.isNaN(ta)) return 1
      if (Number.isNaN(tb)) return -1
      return ta - tb
    },
    onFilterWindowResize() {
      this.updateFilterTableHeight()
    },
    updateFilterTableHeight() {
      if (!this.nested || !this.show) return
      const run = () => {
        const panel = this.$refs.filterTablePanel
        const pagWrap = this.$refs.filterPaginationWrap
        if (!panel || !panel.getBoundingClientRect) return
        const panelH = panel.clientHeight || panel.getBoundingClientRect().height
        if (!panelH) return
        const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8
        const next = Math.floor(panelH - pagH)
        const height = Math.max(200, next)
        if (Math.abs(this.filterTableHeight - height) >= 2) {
          this.filterTableHeight = height
        }
        this.$nextTick(() => {
          const table = this.$refs.singleTable
          if (table && table.doLayout) table.doLayout()
        })
      }
      this.$nextTick(run)
      requestAnimationFrame(run)
      ;[50, 120, 300].forEach((ms) => setTimeout(run, ms))
    }
  }
}
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.tk-apply-select-full-modal.local-modal-mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
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

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

<style lang="scss">
.tk-apply-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.tk-apply-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.tk-apply-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.tk-apply-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tk-apply-select-mask .local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1;
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
}

.tk-apply-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.tk-apply-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.tk-apply-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.tk-apply-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  box-sizing: border-box;
}

.tk-apply-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.tk-apply-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.tk-apply-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tk-apply-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.tk-apply-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.tk-apply-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.tk-apply-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>
