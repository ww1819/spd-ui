<template>
  <component
    :is="printComponent"
    ref="innerPrintRef"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import outOrderPrintZq from '@/views/outWarehouse/audit/outOrderPrintZq'
import outOrderPrintHs from '@/views/outWarehouse/audit/outOrderPrintHs'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

export default {
  name: 'OutOrderPrint',
  components: { outOrderPrintZq, outOrderPrintHs },
  inheritAttrs: false,
  computed: {
    printComponent() {
      const cid = this.$store.getters.customerId
      return isZqInboundPrintTenant(cid) ? 'outOrderPrintZq' : 'outOrderPrintHs'
    }
  },
  methods: {
    start() {
      const inner = this.$refs.innerPrintRef
      if (inner && typeof inner.start === 'function') {
        inner.start()
      }
    },
    startLodop(options) {
      const inner = this.$refs.innerPrintRef
      if (inner && typeof inner.startLodop === 'function') {
        return inner.startLodop(options)
      }
      return Promise.reject(new Error('当前出库单模板不支持 Lodop 打印'))
    },
    applyPrintCellAutoFont() {
      const inner = this.$refs.innerPrintRef
      if (inner && typeof inner.applyPrintCellAutoFont === 'function') {
        inner.applyPrintCellAutoFont()
      }
    }
  }
}
</script>
