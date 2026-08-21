/**
 * 打印页单价/金额：读租户已生效小数位（覆盖本地写死 toFixed）
 */
import { formatAmount, formatPrice } from '@/utils/moneyFormat'

export default {
  methods: {
    formatPrice(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      if (!Number.isFinite(n)) return v
      return formatPrice(n, '')
    },
    formatAmt(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      if (!Number.isFinite(n)) return v
      return formatAmount(n, '')
    },
    /** 少数模板用 formatAmount 命名 */
    formatAmount(v) {
      return this.formatAmt(v)
    }
  }
}
