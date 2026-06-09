<template>
  <component
    :is="printComponent"
    ref="innerPrintRef"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import refundGoodsOrderPrintZq from '@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrintZq'
import refundGoodsOrderPrintHs from '@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrintHs'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

export default {
  name: 'RefundGoodsOrderPrint',
  components: { refundGoodsOrderPrintZq, refundGoodsOrderPrintHs },
  inheritAttrs: false,
  computed: {
    printComponent() {
      const cid = this.$store.getters.customerId
      return isZqInboundPrintTenant(cid) ? 'refundGoodsOrderPrintZq' : 'refundGoodsOrderPrintHs'
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
