<template>
  <el-dialog
    title="HIS 批次库存镜像"
    :visible.sync="innerVisible"
    width="920px"
    append-to-body
    @close="handleClose"
  >
    <div v-loading="loading" class="msun-his-entry-view">
      <p v-if="hint" class="hint">{{ hint }}</p>
      <el-table v-if="rows.length" :data="rows" border size="small" max-height="420">
        <el-table-column label="pharmacyStockId" prop="pharmacy_stock_id" min-width="140" show-overflow-tooltip />
        <el-table-column label="库存数量" min-width="90">
          <template slot-scope="scope">
            {{ scope.row.stock_amount != null ? scope.row.stock_amount : scope.row.quantity }}
          </template>
        </el-table-column>
        <el-table-column label="批号" prop="batch_number" width="120" show-overflow-tooltip />
        <el-table-column label="科室ID" prop="dept_id" width="90" show-overflow-tooltip />
        <el-table-column label="drugId" prop="drug_id" width="90" show-overflow-tooltip />
        <el-table-column label="规格ID" prop="drug_spec_packing_id" width="100" show-overflow-tooltip />
        <el-table-column label="更新时间" prop="update_time" width="160" show-overflow-tooltip />
      </el-table>
      <el-empty v-else-if="!loading" description="未匹配到镜像数据（推送前仅能查库存类镜像）" />
    </div>
  </el-dialog>
</template>

<script>
import { queryMsunEntryHis } from '@/api/foundation/msunHisBill'
import { buildEntryHisQuery } from '@/utils/msunHis'

export default {
  name: 'MsunHisEntryView',
  props: {
    visible: { type: Boolean, default: false },
    entry: { type: Object, default: null },
    department: { type: Object, default: null }
  },
  data() {
    return {
      innerVisible: false,
      loading: false,
      rows: [],
      hint: ''
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(v) {
        this.innerVisible = v
        if (v) this.loadData()
      }
    },
    innerVisible(v) {
      if (!v) this.$emit('update:visible', false)
    }
  },
  methods: {
    loadData() {
      if (!this.entry) {
        this.rows = []
        return
      }
      const params = buildEntryHisQuery(this.entry, this.department)
      if (!params.pharmacyStockId && !params.drugId) {
        this.hint = '缺少 HIS 对照（耗材 his_id / pharmacyStockId）'
        this.rows = []
        return
      }
      this.hint = ''
      this.loading = true
      queryMsunEntryHis(params).then(res => {
        const data = res.data || {}
        this.rows = data.batchStocks || []
      }).catch(() => {
        this.rows = []
      }).finally(() => {
        this.loading = false
      })
    },
    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.hint {
  color: #e6a23c;
  margin: 0 0 12px;
  font-size: 13px;
}
</style>
