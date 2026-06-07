<template>
  <div class="order-print receipt-print" ref="receiptOrderPrintRef">
    <div
      v-for="(pageRows, pageIndex) in pagedDetailList"
      :key="`print-page-${pageIndex}`"
      class="print-page"
      :style="printStyle"
    >
      <div class="doc-header">
        <div class="doc-header-spacer" aria-hidden="true"></div>
        <div class="doc-title">
          <span v-if="hospitalName">{{ hospitalName }}</span>物资入库单
        </div>
        <div class="page-meta">
          <span class="page-index">{{ pageIndex + 1 }}/{{ pagedDetailList.length }}</span>
        </div>
      </div>

      <div class="info-block" :style="tableStyle">
        <div class="info-grid">
          <div class="info-cell">
            <span class="info-label info-label--l1">单据号</span>
            <span class="info-value">{{ row.billNo || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l1">仓库</span>
            <span class="info-value">{{ row.warehouseName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l3">入库日期</span>
            <span class="info-value">{{ formatInboundDate(row.billDate) }}</span>
          </div>
          <div class="info-cell info-cell--span2">
            <span class="info-label info-label--l1">供货商</span>
            <span class="info-value">{{ row.supplierName || '' }}</span>
          </div>
          <div class="info-cell">
            <span class="info-label info-label--l3">资金来源账户</span>
            <span class="info-value">{{ row.fundSourceAccount || '' }}</span>
          </div>
        </div>
      </div>

      <table class="detail-table" :style="tableStyle">
        <colgroup>
          <col style="width: 23%;" />
          <col style="width: 15%;" />
          <col style="width: 6%;" />
          <col style="width: 10%;" />
          <col style="width: 15%;" />
          <col style="width: 14%;" />
          <col style="width: 17%;" />
        </colgroup>
        <thead>
          <tr>
            <th><span class="th-text">消耗品名称</span></th>
            <th><span class="th-text">规格</span></th>
            <th><span class="th-text">单位</span></th>
            <th><span class="th-text">数量</span></th>
            <th><span class="th-text">采购价</span></th>
            <th><span class="th-text">采购金额</span></th>
            <th><span class="th-text">产地</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in pageRows" :key="`${pageIndex}-${idx}`">
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialName || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.materialSpeci || '' }}</span>
            </td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.unitName || '' }}</span>
            </td>
            <td>{{ formatNum(item.qty) }}</td>
            <td>{{ formatPrice(item.unitPrice != null ? item.unitPrice : item.price) }}</td>
            <td>{{ formatAmt(item.amt) }}</td>
            <td class="cell-textual">
              <span class="cell-text">{{ item.factoryName || '' }}</span>
            </td>
          </tr>
          <tr v-if="pageIndex === pagedDetailList.length - 1" class="print-total-row">
            <td colspan="5" class="total-label-cell">
              <span class="total-label">合计</span><span class="total-value">{{ row.totalAmtConverter || '' }}</span>
            </td>
            <td class="total-amt-cell">{{ row.totalAmt != null ? formatAmt(row.totalAmt) : '' }}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="sign-block" :style="tableStyle">
        <div class="sign-item">
          <span class="sign-label">采购</span><span class="sign-value sign-value--blank"></span>
        </div>
        <div class="sign-item">
          <span class="sign-label">保管</span><span class="sign-value sign-value--blank"></span>
        </div>
        <div class="sign-item sign-item--wide">
          <span class="sign-label">入库操作员</span>
          <span class="sign-value">{{ row.inboundOperator || row.createBy || '' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'
import { formatQuantity } from '@/utils/format-quantity'

export default {
  name: 'OrderPrintHs',
  mixins: [hospitalNameMixin],
  props: {
    row: Object,
    billType: [String, Number],
    /** 姣忛〉鏄庣粏琛屾暟锛涙湭浼犳椂榛樿 6 */
    rowsPerPage: {
      type: Number,
      default: undefined
    },
    printOrientation: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      /** 鎵撳嵃绾稿紶锛堜笌涓氬姟绾稿紶涓€鑷达細210mm 脳 140mm锛?*/
      pagePaperSize: '210mm 140mm',
      printSetting: {
        orientation: 'portrait',
        fontSize: 21,
        tableFontSize: 12,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0
      }
    }
  },
  computed: {
    pagedDetailList() {
      const details = (this.row && this.row.detailList) || []
      const pageRows = this.effectiveRowsPerPage
      if (!details.length) return [[]]
      const result = []
      for (let i = 0; i < details.length; i += pageRows) {
        result.push(details.slice(i, i + pageRows))
      }
      return result
    },
    effectiveRowsPerPage() {
      const n = Number(this.rowsPerPage)
      if (Number.isFinite(n) && n >= 1) {
        return Math.min(100, Math.max(1, Math.round(n)))
      }
      return 6
    },
    effectiveOrientation() {
      const p = this.printOrientation
      if (p === 'landscape' || p === 'portrait') return p
      const o = this.printSetting && this.printSetting.orientation
      if (o === 'landscape' || o === 'portrait') return o
      return 'portrait'
    },
    printStyle() {
      const m = this.printSetting
      const clampNonNegativeMm = (v) => {
        const n = Number(v)
        if (isNaN(n)) return 0
        return Math.max(0, n)
      }
      // 鐐归樀鎵撳嵃鏈哄椤堕儴瑁佸垏寰堟晱鎰燂細瀵?marginTop 鍋氫笂闄愪繚鎶わ紝鏃㈤伩鍏嶈鍒囧張閬垮厤鏍囬涓嬬Щ杩囧銆?      const safeTopMm = Math.min(2, clampNonNegativeMm(m.marginTop))
      const margin = `${safeTopMm}mm ${clampNonNegativeMm(m.marginRight)}mm ${clampNonNegativeMm(m.marginBottom)}mm ${clampNonNegativeMm(m.marginLeft)}mm`
      return {
        padding: margin,
        fontSize: Math.round(m.fontSize || 14) + 'px',
        // 鐐归樀鏈烘洿閫傚悎绛夊瀛椾綋锛屽噺灏戝瓧绗︽尋鍘?妯＄硦宸紓
        fontFamily: '"Courier New", "Consolas", "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    },
    tableStyle() {
      return {
        fontSize: Math.round(this.printSetting.tableFontSize || 12) + 'px',
        fontFamily: 'SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif'
      }
    }
  },
  created() {
    this.loadPrintSetting()
  },
  methods: {
    mmValue(v) {
      const n = Number(v)
      return isNaN(n) ? 0 : n
    },
    /** 鍏ュ簱鏃ユ湡锛歽yyy-MM-dd */
    formatInboundDate(val) {
      if (!val) return ''
      const d = new Date(val)
      if (isNaN(d.getTime())) return val
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    formatNum(v) {
      return formatQuantity(v, 2)
    },
    formatPrice(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    formatAmt(v) {
      if (v == null || v === '') return ''
      const n = Number(v)
      return isNaN(n) ? v : n.toFixed(4)
    },
    loadPrintSetting() {
      const billType = this.billType || (this.row && this.row.billType) || 101
      getDefaultTemplate(billType).then(response => {
        if (response.data) {
          const data = response.data
          // 鎵撳嵃瀛椾綋鏁翠綋鏀惧ぇ涓夊彿
          if (data.fontSize != null) this.printSetting.fontSize = Math.round(Number(data.fontSize)) + 3
          if (data.tableFontSize != null) this.printSetting.tableFontSize = Math.round(Number(data.tableFontSize)) + 3
          if (data.orientation) this.printSetting.orientation = data.orientation
          if (data.marginTop != null) this.printSetting.marginTop = data.marginTop
          if (data.marginBottom != null) this.printSetting.marginBottom = data.marginBottom
          if (data.marginLeft != null) this.printSetting.marginLeft = data.marginLeft
          if (data.marginRight != null) this.printSetting.marginRight = data.marginRight
        }
      }).catch(() => {})
    },
    /** 鏄庣粏鏂囨湰鍒楋細鎸夊垪瀹芥祴閲忥紝瓒呰繃涓€琛屽垯閫愭缂╁皬瀛楀彿锛岀洿鑷冲崟琛岄珮搴﹀唴鎴栧埌杈惧瓧鍙蜂笅闄愶紙涓嬮檺浠嶈秴涓€琛屾椂鍏佽澶氳瀹屾暣灞曠ず锛?*/
    applyPrintCellAutoFont() {
      const root = this.$refs.receiptOrderPrintRef || this.$el
      if (!root || typeof document === 'undefined') return

      const cells = root.querySelectorAll('td.cell-textual .cell-text')
      if (!cells || !cells.length) return

      const minPx = 10
      const maxSteps = 64

      const removeMirror = (m) => {
        try {
          if (m && m.parentNode) m.parentNode.removeChild(m)
        } catch (e) {
          // ignore
        }
      }

      const mmToPx = (mm) => {
        const probe = document.createElement('div')
        probe.style.position = 'absolute'
        probe.style.left = '-100000px'
        probe.style.top = '0'
        probe.style.visibility = 'hidden'
        probe.style.height = '0'
        probe.style.width = `${mm}mm`
        document.body.appendChild(probe)
        const w = probe.getBoundingClientRect().width || 0
        removeMirror(probe)
        return w
      }

      const estimateInnerWidthPx = (td) => {
        const tdCs = window.getComputedStyle(td)
        const padL = parseFloat(tdCs.paddingLeft || '0') || 0
        const padR = parseFloat(tdCs.paddingRight || '0') || 0

        const measured = Math.max(0, (td.clientWidth || td.getBoundingClientRect().width || 0) - padL - padR)
        if (measured > 10) return measured

        // 缁勪欢澶勪簬 display:none锛堜緥濡?v-show=false 鐨勭洿鎺ユ墦鍗帮級鏃讹紝clientWidth 鍙兘涓?0锛?        // 鐢ㄧ焊寮犲搴︼紙210mm锛夋寜鍒?colgroup 姣斾緥浼扮畻鍗曞厓鏍煎唴瀹瑰搴︺€?        const pagePx = mmToPx(210) || 794
        const tr = td.parentElement
        if (!tr) return Math.max(120, pagePx * 0.2)

        const tds = Array.from(tr.children || []).filter(n => n && n.tagName === 'TD')
        const idx = tds.indexOf(td)
        const ratios = [0.23, 0.15, 0.06, 0.10, 0.15, 0.14, 0.17]
        const r = ratios[idx] != null ? ratios[idx] : (1 / Math.max(1, tds.length))
        return Math.max(80, pagePx * r - padL - padR)
      }

      const measureUnclampedHeightPx = (el, fontPx) => {
        const td = el.closest('td')
        if (!td) return 0

        const cs = window.getComputedStyle(el)

        const mirror = document.createElement('div')
        mirror.textContent = el.textContent || ''

        const innerW = estimateInnerWidthPx(td)

        mirror.style.position = 'absolute'
        mirror.style.left = '-100000px'
        mirror.style.top = '0'
        mirror.style.visibility = 'hidden'
        mirror.style.pointerEvents = 'none'
        mirror.style.boxSizing = 'border-box'
        mirror.style.width = `${innerW}px`
        mirror.style.whiteSpace = 'normal'
        mirror.style.wordBreak = 'break-word'
        mirror.style.overflow = 'visible'
        mirror.style.lineHeight = '1.35'
        mirror.style.fontFamily = cs.fontFamily
        mirror.style.fontWeight = cs.fontWeight
        mirror.style.fontStyle = cs.fontStyle
        mirror.style.letterSpacing = cs.letterSpacing
        mirror.style.fontSize = `${fontPx}px`

        document.body.appendChild(mirror)
        const h = mirror.scrollHeight
        removeMirror(mirror)
        return h
      }

      cells.forEach((el) => {
        if (!el || el.nodeType !== 1) return
        const text = (el.textContent || '').trim()
        if (!text) return

        // 鍏堟仮澶嶄负琛ㄦ牸榛樿瀛楀彿锛屽啀鎸夐渶缂╁皬锛岄伩鍏嶉噸澶嶆墦鍗拌秺缂╄秺灏?        el.style.fontSize = ''
        el.style.lineHeight = ''

        const cs0 = window.getComputedStyle(el)
        let fontPx = parseFloat(cs0.fontSize || '12') || 12

        let step = 0
        while (step < maxSteps) {
          const lineHeightPx = Math.max(10, Math.round(fontPx * 1.35))
          const oneLineMaxH = lineHeightPx + 1
          const h = measureUnclampedHeightPx(el, fontPx)
          if (h <= oneLineMaxH + 0.5 || fontPx <= minPx) {
            el.style.fontSize = `${fontPx}px`
            el.style.lineHeight = '1.35'
            return
          }
          fontPx -= 0.5
          step++
        }

        el.style.fontSize = `${Math.max(minPx, fontPx)}px`
        el.style.lineHeight = '1.35'
      })
    },
    start() {
      const doPrint = () => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            const el = this.$refs.receiptOrderPrintRef || this.$el
            if (!el) return
            const pageSize = this.pagePaperSize || '210mm 140mm'
            // 璁╂祻瑙堝櫒鍏堝畬鎴愬竷灞€锛屽啀娴嬮噺/璋冩暣瀛楀彿锛屾渶鍚庤繘鍏ユ墦鍗?iframe
            this.applyPrintCellAutoFont()
            if (typeof this.$print === 'function') {
              this.$print(el, {
                injectPageSize: true,
                // 宸﹀彸鐣欏畨鍏ㄨ竟璺濓細閽堝紡鏈虹墿鐞嗕笉鍙墦鍗板尯浼氳鎺夎创杈硅竟妗嗭紱涓婁笅淇濇寔 0锛岄伩鍏嶆妸涓€椤碘€滄尋鈥濇垚涓ら〉
                pageMargin: '0 4mm',
                waitForAssets: true,
                beforePrintDelay: 320
              }, pageSize)
            } else {
              try {
                window.print()
              } catch (e) {
                console.error('鎵撳嵃澶辫触:', e)
              }
            }
          })
        })
      }
      Promise.all([
        this.ensureHospitalNameLoaded ? this.ensureHospitalNameLoaded() : Promise.resolve(),
        Promise.resolve()
      ]).then(doPrint).catch(doPrint)
    }
  }
}
</script>

<style lang="stylus" scoped>
.receipt-print
  line-height 1.5
  width 210mm
  max-width 210mm
  margin 0 auto
  box-sizing border-box
  /* 宸﹀彸鍚勭缉杩涚害 1 涓眽瀛楀搴︼紙ch 鍦ㄤ腑鏂囩瓑瀹藉瓧浣撲笅鈮?瀛楀锛?*/
  padding-left 1ch
  padding-right 1ch
  font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif

.print-page
  position relative
  width 100%
  max-width 100%
  min-height 140mm
  box-sizing border-box
  display flex
  flex-direction column
  break-inside avoid
  page-break-inside avoid
  page-break-after always
  overflow-x: visible
  overflow-y: visible

.print-page:last-child
  page-break-after auto

.doc-header
  display grid
  grid-template-columns 92px 1fr 92px
  align-items center
  column-gap 6px
  margin-bottom 6px

.doc-header-spacer
  width 92px

.page-meta
  justify-self end
  align-self center

.page-index
  font-size 12px
  line-height 1
  letter-spacing 0.5px
  color #333

.doc-title
  font-size 20px
  font-weight normal
  text-align center
  line-height 1.1
  margin 0

.info-block
  margin-bottom 6px

.info-grid
  display grid
  grid-template-columns 1.2fr 0.8fr 1.1fr
  column-gap 18px
  row-gap 2px

.info-cell
  display flex
  align-items center
  min-width 0

.info-cell--span2
  grid-column 1 / span 2

.info-grid .info-label
  text-align left
  flex-basis auto
  max-width none
  margin-right 0

.info-grid .info-label::after
  content ':' 
  margin-right 2px

.info-label
  flex 0 0 auto
  flex-shrink 0
  box-sizing border-box
  text-align right
  white-space nowrap
  &::after
    content '：'

/* 宸﹀垪鏍囩锛堝崟鎹彿/鍏ュ簱鏃ユ湡锛夊搴︿竴鑷达紝鍐掑彿绔栫嚎瀵归綈 */
.info-label--l1
  flex-basis 4.4em
  max-width 4.4em

/* 绗笁鍒楁爣绛惧搴︾粺涓€骞跺乏瀵归綈锛屼繚璇佲€滃叆搴撴棩鏈?璧勯噾鏉ユ簮璐︽埛鈥濆墠娌夸竴鑷?*/
.info-label--l3
  flex-basis 5.8em
  max-width 5.8em

/* 鍙冲垪鏍囩锛堜緵璐у晢/璧勯噾鏉ユ簮璐︽埛锛夊搴︿竴鑷达紝鍐掑彿绔栫嚎瀵归綈 */
.info-label--l2
  flex-basis 9.6em
  max-width 9.6em

.info-value
  flex 1 1 auto
  min-width 0

.detail-table
  width 100%
  table-layout fixed
  border-collapse collapse
  border 1px solid #000
  margin-bottom 10px

.detail-table th,
.detail-table td
  border 1px solid #000
  padding 4px 6px
  text-align center

.detail-table th
  font-weight normal
  background #f5f5f5

/* 琛ㄦ牸鍒楁爣棰樹笉鍔犲啋鍙?*/
.detail-table th .th-text
  display inline-flex
  align-items center
  justify-content center
  max-width 100%
  white-space nowrap

.detail-table td
  word-break normal
  overflow visible

/* 鍚嶇О銆佽鏍笺€佸崟浣嶃€佷骇鍦帮細宸﹀榻愶紝澶氳瀹屾暣灞曠ず锛堟墦鍗板墠鍙寜鍒楀鑷姩鐣ョ缉瀛楀彿锛?*/
.detail-table td.cell-textual
  text-align left
  vertical-align top
  white-space normal
  word-break break-word
  overflow visible

.detail-table td.cell-textual .cell-text
  display block
  overflow visible
  word-break break-word
  white-space normal
  line-height 1.35

/* 鏁伴噺銆侀噰璐环銆侀噰璐噾棰濓細鍐呭鍙冲榻?*/
.detail-table td:nth-child(4),
.detail-table td:nth-child(5),
.detail-table td:nth-child(6)
  text-align right

.detail-table tbody tr.print-total-row td
  border 1px solid #000
  padding 4px 6px
  vertical-align middle

.detail-table tbody tr.print-total-row td.total-label-cell
  text-align left

.detail-table tbody tr.print-total-row td.total-amt-cell
  text-align right
  white-space nowrap

.total-row
  display flex
  justify-content space-between
  align-items center
  margin-bottom 14px

.total-left
  flex-shrink 0
  display inline-flex
  align-items baseline
  max-width 72%

.total-label
  flex 0 0 auto
  text-align right
  white-space nowrap
  &::after
    content '：'

.total-value
  flex 1 1 auto
  min-width 0
  margin-left 6px
  white-space normal
  word-break break-word

.total-num
  min-width 80px
  text-align right

.sign-block
  display grid
  grid-template-columns 1fr 1fr 1fr
  column-gap 12px
  margin-top 2px

.sign-item
  display flex
  align-items center
  min-width 0

.sign-item--wide
  min-width 0

.sign-label
  flex 0 0 auto
  text-align right
  white-space nowrap
  &::after
    content '：'

.sign-value
  flex 1 1 auto
  min-width 0
  margin-left 6px
  white-space nowrap
  overflow hidden
  text-overflow ellipsis

.sign-value--blank
  min-height 1em
</style>

<style lang="stylus" media="print">
@page
  size 210mm 140mm !important
  margin 0 4mm !important

@media print
  html,body
    margin 0 !important
    padding 0 !important

  *
    color #000 !important

  .receipt-print
    width 100% !important
    max-width none !important
    box-sizing border-box !important
    padding-left 0 !important
    padding-right 0 !important
    /* Epson LQ-690K 鐐归樀鎵撳嵃锛氱瓑瀹?鍥哄畾瀛楀彿锛屽噺灏戞ā绯?瀛楀舰宸紓 */
    font-size 16px !important
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-weight normal
    -webkit-font-smoothing none !important
    -moz-osx-font-smoothing none !important
    text-rendering optimizeSpeed
    -webkit-print-color-adjust exact
    print-color-adjust exact

  .print-page
    width 100% !important
    max-width 100% !important
    min-height 140mm !important
    // 閬垮厤鏌愪簺娴忚鍣ㄥ湪鎵撳嵃妯″紡瀵?max-height 瑁佸垏鍒版爣棰樺尯鍩?    max-height none !important
    /* 閽堝紡鏈洪《閮ㄤ笉鍙墦鍗板尯鏇村ぇ锛屾爣棰樻暣浣撲笅绉?*/
    padding-top 6mm !important
    overflow-x: visible
    overflow-y: visible
    break-inside avoid
    page-break-inside avoid
    page-break-after always

  .print-page:last-child
    page-break-after auto

  .doc-header
    display grid !important
    grid-template-columns 92px 1fr 92px !important
    align-items center !important
    column-gap 6px !important
    margin-bottom 6px !important

  .doc-header-spacer
    width 92px !important

  .page-meta
    justify-self end !important
    align-self center !important

  .doc-title
    display block !important
    /* 鏍囬瀛楀彿鏀跺皬锛岄伩鍏嶅湪鐐归樀绾搁珮搴?琛岄珮浼扮畻涓嬪嚭鐜板崐鎴垨绌虹櫧 */
    font-size 18px !important
    font-weight normal !important
    padding 0 !important
    margin 0 !important
    line-height 1.7 !important
    font-family SimSun, "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    overflow visible !important
    page-break-inside avoid !important

  /* 涓嬫柟鍖哄煙鍘嬬缉锛屾姷娑堟爣棰樹笅绉诲鑷寸殑鍒嗛〉鍘嬪姏 */
  .info-block
    margin-bottom 3px !important
    font-size 17px !important

  .info-grid
    font-size 17px !important

  /* 淇℃伅鍖猴細鏍囩鍒楀浐瀹氬搴︼紝鍐掑彿绔栫嚎瀵归綈锛堟墦鍗板瓧鍙锋洿澶ф椂鐣ュ姞瀹斤級 */
  .info-label--l1
    flex-basis 6.0em !important
    max-width 6.0em !important

  .info-label--l2
    flex-basis 10.2em !important
    max-width 10.2em !important

  /* info-grid 涓嬪彇娑堝浐瀹氭爣绛惧搴︼紝閬垮厤鈥滃啋鍙峰埌鍐呭鈥濊鎷夊紑 */
  .info-grid .info-label
    flex-basis auto !important
    max-width none !important
    margin-right 0 !important
    text-align left !important

  .info-grid .info-label::after
    content ':' !important
    margin-right 2px !important

  .detail-table
    margin-bottom 6px !important

  .detail-table th,
  .detail-table td
    padding 4px 6px !important

  .total-row
    margin-bottom 8px !important
    font-size 17px !important

  /* 绛惧瓧鍖轰笂绉讳竴鐐癸紝閬垮紑閽堝紡鏈哄簳閮ㄤ笉鍙墦鍗板尯鍩?*/
  .sign-block
    margin-top 2px !important
    padding-bottom 3mm !important
    font-size 17px !important
    display grid !important
    grid-template-columns 1fr 1fr 1fr !important
    column-gap 12px !important

  .sign-item
    min-width 0 !important

  .detail-table
    width 100% !important
    table-layout fixed
    border-collapse collapse
    /* 瑕嗙洊琛屽唴 style锛氬悗鍙伴厤缃殑瀛楀彿/瀛椾綋瀵圭偣闃垫満瀹规槗瑙﹀彂妯＄硦/瑁佸垏 */
    font-family "Courier New", Consolas, "SimSun", "宋体", "NSimSun", "STSong", "Songti SC", serif !important
    font-size 14px !important

  .detail-table th,
  .detail-table td
    border 1px solid #000
    overflow visible
    word-wrap break-word
    word-break break-word
    line-height 1.45 !important

  .detail-table th
    font-weight normal !important

  .detail-table th
    background transparent !important
    -webkit-print-color-adjust economy
    print-color-adjust economy

  /* 鍒楀悕缁熶竴灞呬腑 */
  .detail-table th
    text-align center !important

  /* 琛ㄦ牸鍒楁爣棰樹笉鍔犲啋鍙?*/
  .detail-table th .th-text
    display inline-flex !important
    align-items center !important
    justify-content center !important
    max-width 100% !important
    white-space nowrap !important

  .detail-table td.cell-textual
    text-align left !important
    vertical-align top !important
    white-space normal !important
    word-break break-word !important

  .detail-table td.cell-textual .cell-text
    display block !important
    overflow visible !important
    word-break break-word !important
    white-space normal !important
    line-height 1.35 !important

  .detail-table td:nth-child(4),
  .detail-table td:nth-child(5),
  .detail-table td:nth-child(6)
    text-align right !important
</style>
