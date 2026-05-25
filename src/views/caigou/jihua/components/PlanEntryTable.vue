<template>
  <div class="table-wrapper">
    <el-table
      :data="list"
      :row-key="entryRowKey"
      show-summary
      :summary-method="summaryMethod"
      @selection-change="$emit('selection-change', $event)"
      ref="entryTable"
      border
      :height="tableHeight"
    >
      <el-table-column type="selection" width="60" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip fixed="left">
        <template slot-scope="scope">{{ scope.$index + 1 }}</template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申购数量" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.applyQty != null ? scope.row.applyQty : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.stockQty != null ? scope.row.stockQty : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="采购数量" prop="qty" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-input
            v-if="editable"
            clearable
            size="small"
            v-model="scope.row.qty"
            placeholder="请输入采购数量"
            @input="$emit('qty-input', scope.row)"
            @blur="$emit('qty-blur', scope.row)"
          />
          <span v-else>{{ scope.row.qty != null ? scope.row.qty : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="价格" prop="price" width="120" align="right" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ formatMoney(scope.row.price) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="amt" width="120" align="right" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ formatMoney(scope.row.amt) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="editable" class="plan-supplier-cell" @click.stop>
            <SelectSupplierFromOptions
              v-if="supplierEditingIndex === scope.$index"
              :value="scope.row.supplierId"
              :options="supplierOptions"
              :loading="supplierLoading"
              placeholder="请选择供应商"
              clearable
              @input="onSupplierInput(scope.row, $event)"
              @visible-change="onSupplierDropdownVisibleChange($event, scope.row)"
            />
            <span
              v-else
              class="plan-supplier-cell__text"
              :class="{ 'is-placeholder': isSupplierPlaceholder(scope.row) }"
              @click="openSupplierEditor(scope.$index)"
            >{{ supplierCellLabel(scope.row) }}</span>
          </div>
          <span v-else>{{ supplierDisplay(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="包装规格" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库房分类" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="财务分类" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申购单号" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.applyBillNos || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申请科室" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ (scope.row.applyDepartment && scope.row.applyDepartment.name) || scope.row.applyDepartmentName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计划来源" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.planSource || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="储存方式" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ wayStatusLabel(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-input v-if="editable" size="small" v-model="scope.row.remark" placeholder="请输入备注" />
          <span v-else>{{ scope.row.remark || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button v-if="scope.row.id" type="text" size="small" @click="$emit('view-apply-details', scope.row)">查看申购明细</el-button>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import SelectSupplierFromOptions from '@/components/SelectModel/SelectSupplierFromOptions'

export default {
  name: 'PlanEntryTable',
  dicts: ['way_status'],
  components: { SelectSupplierFromOptions },
  props: {
    list: { type: Array, default: () => [] },
    editable: { type: Boolean, default: true },
    tableHeight: { type: String, default: 'max(260px, calc(100vh - 368px))' },
    supplierOptions: { type: Array, default: () => [] },
    supplierLoading: { type: Boolean, default: false },
    headerForm: { type: Object, default: () => ({}) },
    summaryMethod: { type: Function, required: true },
    supplierDisplayFn: { type: Function, default: null }
  },
  data() {
    return {
      /** 当前正在编辑供应商的行下标，全局仅允许一个下拉 */
      supplierEditingIndex: null
    }
  },
  watch: {
    list() {
      this.supplierEditingIndex = null
    }
  },
  computed: {
    wayStatusMap() {
      const map = {}
      const list = (this.dict && this.dict.type && this.dict.type.way_status) || []
      list.forEach((d) => {
        if (d && d.value != null) map[d.value] = d.label
      })
      return map
    }
  },
  methods: {
    entryRowKey(row) {
      if (!row) return ''
      if (row.id != null) return `e-${row.id}`
      if (row._entryUid) return `u-${row._entryUid}`
      return `m-${row.materialId != null ? row.materialId : ''}`
    },
    formatMoney(val) {
      if (val == null || val === '') return '0.00'
      const n = parseFloat(val)
      return Number.isFinite(n) ? n.toFixed(2) : '0.00'
    },
    wayStatusLabel(row) {
      const v = row && row.material && row.material.isWay
      if (v == null || v === '') return '--'
      return this.wayStatusMap[v] || this.wayStatusMap[String(v)] || '--'
    },
    supplierDisplay(row) {
      if (this.supplierDisplayFn) return this.supplierDisplayFn(row)
      return '--'
    },
    isSupplierPlaceholder(row) {
      const t = this.supplierDisplay(row)
      return !t || t === '--'
    },
    supplierCellLabel(row) {
      return this.isSupplierPlaceholder(row) ? '点击选择供应商' : this.supplierDisplay(row)
    },
    openSupplierEditor(index) {
      this.supplierEditingIndex = index
    },
    resolveSupplierName(supplierId) {
      if (supplierId == null || supplierId === '') return ''
      const rid = Number(supplierId)
      const hit = (this.supplierOptions || []).find((s) => s != null && Number(s.id) === rid)
      return hit && hit.name ? hit.name : ''
    },
    onSupplierInput(row, supplierId) {
      if (!row) return
      this.$set(row, 'supplierId', supplierId)
      const name = this.resolveSupplierName(supplierId)
      this.$set(row, 'supplierName', name)
      if (supplierId != null && supplierId !== '' && name) {
        this.$set(row, 'supplier', { id: supplierId, name })
      } else {
        this.$set(row, 'supplier', null)
      }
      this.$emit('supplier-change', { row, supplierId, supplierName: name })
    },
    onSupplierDropdownVisibleChange(visible, row) {
      if (!visible) {
        if (row && row.supplierId != null && row.supplierId !== '' && !row.supplierName) {
          const name = this.resolveSupplierName(row.supplierId)
          if (name) {
            this.$set(row, 'supplierName', name)
            this.$set(row, 'supplier', { id: row.supplierId, name })
          }
        }
        this.supplierEditingIndex = null
      }
    },
    doLayout() {
      const t = this.$refs.entryTable
      if (t && typeof t.doLayout === 'function') t.doLayout()
    }
  }
}
</script>

<style lang="scss" scoped>
.plan-supplier-cell__text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  color: #606266;
  line-height: 32px;
  vertical-align: middle;
}
.plan-supplier-cell__text.is-placeholder {
  color: #c0c4cc;
}
.plan-supplier-cell__text:hover {
  color: #409eff;
}
</style>
