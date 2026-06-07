<template>
  <component
    :is="printComponent"
    ref="innerPrintRef"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import refundDepotOrderPrintZq from '@/views/outWarehouse/refundDepotAudit/refundDepotOrderPrintZq'
import refundDepotOrderPrintHs from '@/views/outWarehouse/refundDepotAudit/refundDepotOrderPrintHs'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

export default {
  name: 'RefundDepotOrderPrint',
  components: { refundDepotOrderPrintZq, refundDepotOrderPrintHs },
  inheritAttrs: false,
  computed: {
    printComponent() {
      const cid = this.$store.getters.customerId
      return isZqInboundPrintTenant(cid) ? 'refundDepotOrderPrintZq' : 'refundDepotOrderPrintHs'
    }
  },
  methods: {
    start() {
      const inner = this.$refs.innerPrintRef
      if (inner && typeof inner.start === 'function') {
        inner.start()
      }
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
