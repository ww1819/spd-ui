<template>
  <component
    :is="printComponent"
    ref="innerPrintRef"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import orderPrintZq from '@/views/inWarehouse/audit/orderPrintZq'
import orderPrintHs from '@/views/inWarehouse/audit/orderPrintHs'
import { isZqInboundPrintTenant } from '@/utils/msunHis'

export default {
  name: 'OrderPrint',
  components: { orderPrintZq, orderPrintHs },
  inheritAttrs: false,
  computed: {
    printComponent() {
      const cid = this.$store.getters.customerId
      return isZqInboundPrintTenant(cid) ? 'orderPrintZq' : 'orderPrintHs'
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
