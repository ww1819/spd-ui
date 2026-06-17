<template>
  <el-dialog title="采购计划进度" :visible.sync="innerVisible" width="600px" :close-on-click-modal="false" append-to-body>
    <div v-if="row" style="margin-bottom: 20px;">
      <p><strong>计划单号：</strong>{{ row.planNo }}</p>
      <p><strong>仓库：</strong>{{ row.warehouse && row.warehouse.name ? row.warehouse.name : '' }}</p>
      <p><strong>金额：</strong>{{ row.totalAmount ? parseFloat(row.totalAmount).toFixed(2) : '0.00' }}</p>
      <p><strong>单据状态：</strong>
        <dict-tag :options="dict.type.plan_status" :value="row.planStatus"/>
      </p>
    </div>
    <el-steps :active="activeStep" direction="vertical" finish-status="success">
      <el-step
        v-for="(step, index) in steps"
        :key="index"
        :title="step.title"
        :description="step.description"
        :status="step.status"
      />
    </el-steps>
    <div slot="footer" class="dialog-footer">
      <el-button @click="innerVisible = false">关 闭</el-button>
    </div>
  </el-dialog>
</template>

<script>
const DEFAULT_STEPS = [
  { title: '未提交', description: '采购计划已创建，等待提交审核', status: 'wait' },
  { title: '待审核', description: '采购计划已提交，等待审核', status: 'wait' },
  { title: '已审核', description: '采购计划已审核通过', status: 'wait' }
]

export default {
  name: 'PlanProgressDialog',
  dicts: ['plan_status'],
  props: {
    visible: { type: Boolean, default: false },
    row: { type: Object, default: null }
  },
  data() {
    return {
      steps: DEFAULT_STEPS.map(s => ({ ...s }))
    }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    activeStep() {
      if (!this.row) return 0
      const status = String(this.row.planStatus)
      if (status === '0') return 0
      if (status === '1') return 1
      if (status === '2' || status === '3') return 2
      return 0
    }
  },
  watch: {
    visible(val) {
      if (val && this.row) {
        this.applyPlanStatus(this.row.planStatus)
      }
    }
  },
  methods: {
    applyPlanStatus(planStatus) {
      this.steps = DEFAULT_STEPS.map(s => ({ ...s, status: 'wait' }))
      const status = String(planStatus)
      if (status === '0') {
        this.steps[0].status = 'process'
      } else if (status === '1') {
        this.steps[0].status = 'finish'
        this.steps[1].status = 'process'
      } else if (status === '2' || status === '3') {
        this.steps.forEach(step => { step.status = 'finish' })
      }
    }
  }
}
</script>
