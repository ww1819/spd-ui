<template>
  <div class="plan-progress-drawer-mask" @click.self="innerVisible = false">
    <div class="plan-progress-drawer-panel" @click.stop>
      <div class="plan-progress-drawer-header">
        <span class="plan-progress-drawer-title">采购计划进度</span>
        <i class="el-icon-close plan-progress-drawer-close" @click="innerVisible = false" />
      </div>
      <div class="plan-progress-drawer-body">
        <div v-if="row" class="plan-progress-meta">
          <p><strong>计划单号：</strong>{{ row.planNo }}</p>
          <p><strong>仓库：</strong>{{ row.warehouse && row.warehouse.name ? row.warehouse.name : '' }}</p>
          <p><strong>金额：</strong>{{ row.totalAmount != null && row.totalAmount !== '' ? formatAmount(row.totalAmount, '0') : '0' }}</p>
          <p>
            <strong>单据状态：</strong>
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
      </div>
      <div class="plan-progress-drawer-footer">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="innerVisible = false">关 闭</el-button>
      </div>
    </div>
  </div>
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
  created() {
    if (this.visible && this.row) {
      this.applyPlanStatus(this.row.planStatus)
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
