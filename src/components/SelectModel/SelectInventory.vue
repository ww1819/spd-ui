<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask inventory-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'inventory-select-full-modal': !nested
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
        class="modal-form-compact material-filter-form inventory-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="仓库" prop="warehouseId">
                <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow" />
              </el-form-item>
            </el-col>
            <el-col v-if="!hideSupplierQuery" class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="供应商" prop="supplierId">
                <SelectSupplier v-model="queryParams.supplierId" :value2="false" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="入库批次号" prop="batchNo" label-width="84px">
                <el-input
                  v-model="queryParams.batchNo"
                  placeholder="入库批次号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col v-if="hideSupplierQuery" class="apply-modal-field apply-modal-field--standard" />
          </el-row>
          <el-row v-if="isMaterialLocked" :gutter="0" class="apply-modal-form-row" type="flex">
            <el-col>
              <span class="inventory-lock-hint">仅显示当前行耗材（产品档案）的库存，其它耗材已过滤</span>
            </el-col>
          </el-row>
          <el-row v-else :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="产品名称" prop="materialName">
                <el-input
                  v-model="queryParams.materialName"
                  placeholder="产品名称"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="规格" prop="materialSpeci">
                <el-input
                  v-model="queryParams.materialSpeci"
                  placeholder="规格或首字母"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="型号" prop="materialModel">
                <el-input
                  v-model="queryParams.materialModel"
                  placeholder="型号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">库存明细信息</span>
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
            :data="inventoryList"
            :row-class-name="inventoryIndex"
            @selection-change="handleSelectionChange"
            :height="filterTableHeight"
            border
            stripe
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
            <el-table-column label="规格" align="center" prop="material.speci" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
            <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')" />
            <el-table-column label="库存数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable sortable />
            <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable sortable />
            <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable />
            <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
            <el-table-column label="耗材批次号" align="center" width="160" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.batchNo || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable />
            <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable />
            <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginTime" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="150" show-overflow-tooltip resizable />
            <el-table-column label="注册证号" align="center" prop="material.registerNo" width="160" show-overflow-tooltip resizable />
            <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable />
            <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                <span v-else>--</span>
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
              class="apply-detail-table material-filter-detail-table"
              :data="inventoryList"
              :row-class-name="inventoryIndex"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
              <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
              <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
              <el-table-column label="规格" align="center" prop="material.speci" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
              <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable />
              <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')" />
              <el-table-column label="库存数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable sortable />
              <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable sortable />
              <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable />
              <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
              <el-table-column label="耗材批次号" align="center" width="160" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.batchNo || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable />
              <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable />
              <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生产日期" align="center" prop="beginTime" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
                <template slot-scope="scope">
                  <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="150" show-overflow-tooltip resizable />
              <el-table-column label="注册证号" align="center" prop="material.registerNo" width="160" show-overflow-tooltip resizable />
              <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable />
              <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
              <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                  <span v-else>--</span>
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
  </div>
</template>

<script>
import { listInventory } from '@/api/warehouse/inventory'
import { sortInventoryRowsByNameSpecCodeMaterialId } from '@/utils/stocktakingInventorySort'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
/** 下拉用 listDeptSafe，避免依赖 foundation:supplier:list（科室审核/库存选择等场景） */
import SelectSupplier from '@/components/SelectModel/SelectSupplierDept'

export default {
  name: 'SelectInventory',
  dicts: ['way_status'],
  components: { SelectWarehouse, SelectSupplier },
  props: {
    DialogComponentShow: [Boolean],
    warehouseValue: [String, Number],
    supplierValue: [String, Number],
    selectedDetails: Array,
    excludeZeroQty: {
      type: Boolean,
      default: false
    },
    hideSupplierQuery: {
      type: Boolean,
      default: false
    },
    lockedMaterialId: {
      type: [String, Number],
      default: null
    },
    ignoreSelectedDetailRowIndex: {
      type: Number,
      default: null
    },
    modalTitle: {
      type: String,
      default: '库存明细'
    },
    stocktakingPickSortByMaterial: {
      type: Boolean,
      default: false
    },
    /** 嵌套在父业务弹窗内（退货申请 TH-添加明细 等，对齐到货验收 RK-添加明细） */
    nested: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      filterTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialId: null,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        supplierId: null,
        batchNo: null,
        onlyPositiveQty: true
      },
      selectedRowMap: {}
    }
  },
  computed: {
    isMaterialLocked() {
      const lock = this.lockedMaterialId
      return lock != null && String(lock).trim() !== ''
    },
    selectedDetailsForOccupiedFilter() {
      const list = this.selectedDetails
      if (!Array.isArray(list) || !list.length) {
        return []
      }
      const idx = this.ignoreSelectedDetailRowIndex
      if (idx == null || idx < 0 || idx >= list.length) {
        return list
      }
      return list.filter((_, i) => i !== idx)
    }
  },
  mounted() {
    this.show = this.DialogComponentShow || false
    this.queryParams.warehouseId = this.warehouseValue
    this.applyHeaderSupplierFilter()
    this.applyLockedMaterialToQuery()
    if (this.show) {
      this.getList()
    }
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize)
      this.$nextTick(() => this.updateFilterTableHeight())
    }
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize)
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal
      if (newVal) {
        this.selectedRowMap = {}
        this.selectRow = []
        this.queryParams.pageNum = 1
        this.queryParams.warehouseId = this.warehouseValue
        this.applyHeaderSupplierFilter()
        this.applyLockedMaterialToQuery()
        this.getList()
        this.$nextTick(() => {
          if (this.nested) this.updateFilterTableHeight()
          if (this.inventoryList && this.inventoryList.length > 0) {
            this.markSelectedItems()
          }
        })
      }
    },
    selectedDetails: {
      handler() {
        if (this.show && this.inventoryList && this.inventoryList.length > 0) {
          this.$nextTick(() => {
            this.markSelectedItems()
          })
        }
      },
      deep: true
    },
    ignoreSelectedDetailRowIndex() {
      if (this.show) {
        this.getList()
      }
    }
  },
  methods: {
    applyLockedMaterialToQuery() {
      const lock = this.lockedMaterialId
      if (lock != null && String(lock).trim() !== '') {
        this.queryParams.materialId = lock
        this.queryParams.materialName = null
        this.queryParams.materialSpeci = null
        this.queryParams.materialModel = null
      } else {
        this.queryParams.materialId = null
      }
    },
    getRowKey(row) {
      if (!row) return null
      if (row.id != null) return String(row.id)
      if (row.materialId != null && row.batchNo) return `${row.materialId}__${row.batchNo}`
      return null
    },
    applyHeaderSupplierFilter() {
      if (this.hideSupplierQuery) {
        this.queryParams.supplierId = this.supplierValue
        this.queryParams.warehouseId = this.warehouseValue
      }
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page
      if (limit != null) this.queryParams.pageSize = limit
      this.getList()
    },
    getList() {
      this.applyHeaderSupplierFilter()
      if (this.warehouseValue != null && this.warehouseValue !== '') {
        this.queryParams.warehouseId = this.warehouseValue
      }
      this.applyLockedMaterialToQuery()
      this.queryParams.onlyPositiveQty = true
      this.loading = true
      const query = { ...this.queryParams }
      if (this.excludeZeroQty) {
        query.excludeZeroQty = true
      }
      listInventory(query)
        .then(response => {
          let rows = response.rows || []
          if (this.isMaterialLocked) {
            const lid = String(this.lockedMaterialId).trim()
            rows = rows.filter((it) => it && String(it.materialId) === lid)
          }
          const occ = this.selectedDetailsForOccupiedFilter
          let list
          let filteredCount = 0
          if (occ && occ.length) {
            const existedKeySet = new Set(
              occ
                .filter(d => d && d.materialId != null && d.batchNo)
                .map(d => `${d.materialId}__${d.batchNo}`)
            )
            const existedInvIds = new Set(
              occ
                .map((d) => (d && d.kcNo != null && d.kcNo !== '' ? String(d.kcNo) : ''))
                .filter((s) => s)
            )
            list = rows.filter((it) => {
              if (!it) {
                return true
              }
              if (it.id != null && existedInvIds.has(String(it.id))) {
                filteredCount++
                return false
              }
              const key = it.materialId != null && it.batchNo ? `${it.materialId}__${it.batchNo}` : null
              if (key && existedKeySet.has(key)) {
                filteredCount++
                return false
              }
              return true
            })
          } else {
            list = rows
          }
          if (this.stocktakingPickSortByMaterial && list && list.length) {
            list = sortInventoryRowsByNameSpecCodeMaterialId(list)
          }
          this.inventoryList = list
          const serverTotal = response.total != null ? Number(response.total) : 0
          // 本页因「已选占用」被滤掉时，分页总数按可见行修正，避免「共 N 条」但表空
          this.total = filteredCount > 0 ? Math.max(0, serverTotal - filteredCount) : serverTotal
          this.loading = false
          this.$nextTick(() => {
            this.markSelectedItems()
            if (this.nested) this.updateFilterTableHeight()
          })
        })
        .catch(() => {
          this.loading = false
        })
    },
    markSelectedItems() {
      if (!this.inventoryList || !this.inventoryList.length || !this.$refs.singleTable) {
        return
      }
      this.$refs.singleTable.clearSelection()
      const selectedRows = []
      this.inventoryList.forEach(inventoryItem => {
        const key = this.getRowKey(inventoryItem)
        if (key && this.selectedRowMap[key]) {
          selectedRows.push(inventoryItem)
        }
      })
      const ign = this.ignoreSelectedDetailRowIndex
      const details = Array.isArray(this.selectedDetails) ? this.selectedDetails : []
      this.inventoryList.forEach(inventoryItem => {
        const isSelected = details.some((detail, idx) => {
          if (ign != null && idx === ign) {
            return false
          }
          return detail.materialId === inventoryItem.materialId && detail.batchNo === inventoryItem.batchNo
        })
        if (isSelected) {
          selectedRows.push(inventoryItem)
        }
      })
      if (selectedRows.length > 0 && this.$refs.singleTable) {
        selectedRows.forEach(row => {
          this.$refs.singleTable.toggleRowSelection(row, true)
        })
      }
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.applyHeaderSupplierFilter()
      this.queryParams.warehouseId = this.warehouseValue
      this.queryParams.onlyPositiveQty = true
      this.applyLockedMaterialToQuery()
      this.handleQuery()
    },
    handleSelectionChange(val) {
      const pageKeys = (this.inventoryList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean)
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          delete this.selectedRowMap[key]
        }
      })
      ;(val || []).forEach(row => {
        const key = this.getRowKey(row)
        if (key) {
          this.selectedRowMap[key] = row
        }
      })
      this.selectRow = Object.values(this.selectedRowMap)
    },
    handleClose() {
      this.show = false
      this.selectedRowMap = {}
      this.selectRow = []
      this.$emit('closeDialog')
    },
    checkBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)
      this.handleClose()
    },
    inventoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return ''
        const keys = path.split('.')
        let v = obj
        for (let i = 0; i < keys.length; i++) {
          v = v ? v[keys[i]] : ''
        }
        return v == null ? '' : String(v)
      }
      return getVal(a).localeCompare(getVal(b), 'zh-CN')
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

.inventory-select-full-modal.local-modal-mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  overflow: hidden;
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

.inventory-select-full-modal .local-modal-content {
  height: 100vh;
  max-height: 100vh;
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

.inventory-lock-hint {
  display: inline-block;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  padding: 4px 0 8px;
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
.inventory-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.inventory-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.inventory-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.inventory-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inventory-select-mask .local-modal-content .apply-modal-query-panel {
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

.inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.inventory-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.inventory-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.inventory-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.inventory-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inventory-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.inventory-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.inventory-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.inventory-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>
