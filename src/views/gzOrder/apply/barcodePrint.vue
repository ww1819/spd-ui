<template>
  <div class="barcode-print-container" ref="barcodePrintRef" v-bind="containerBindAttrs">
    <div v-for="(barcode, index) in barcodeListForPrint" :key="index" class="barcode-page">
      <div class="container">
        <div class="title-block">
          <div class="title">高值备货码</div>
          <div class="title-line" aria-hidden="true"></div>
        </div>

        <div class="content">
          <div class="main-info">
            <table class="info-table">
              <colgroup>
                <col class="col-lab" />
                <col class="col-val-wide" />
                <col class="col-lab" />
                <col class="col-val" />
              </colgroup>
              <tr class="row-two-pair">
                <td class="label-cell">品名</td>
                <td class="value-cell">{{ barcode.materialName }}</td>
                <td class="label-cell">规格</td>
                <td class="value-cell">{{ barcode.speci }}</td>
              </tr>
              <tr class="row-two-pair">
                <td class="label-cell">批号</td>
                <td class="value-cell">{{ barcode.batchNumber }}</td>
                <td class="label-cell">单价</td>
                <td class="value-cell">{{ barcode.price }}</td>
              </tr>
              <tr>
                <td class="label-cell">有效期</td>
                <td class="value-cell" colspan="3">{{ barcode.endTime }}</td>
              </tr>
              <tr>
                <td class="label-cell">厂家</td>
                <td class="value-cell" colspan="3">{{ barcode.factoryName }}</td>
              </tr>
            </table>
            <!-- 一维码 + 底部明文院内码 -->
            <div class="barcode-row">
              <img
                v-if="barcode.linearBarcodeUrl"
                :src="barcode.linearBarcodeUrl"
                alt="院内码条码"
                class="linear-barcode-img"
                @error="handleBarcodeImageError"
                @load="handleBarcodeImageLoad"
              />
              <div v-if="barcode.linearBarcodeUrl && barcode.inHospitalCode" class="barcode-code-text">
                {{ barcode.inHospitalCode }}
              </div>
              <div v-if="!barcode.linearBarcodeUrl" class="barcode-placeholder">
                <span v-if="!barcode.inHospitalCode">无院内码</span>
                <span v-else>条码未生成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildCode128DataUrl, normalizeBarcodePayload } from "@/utils/code128DataUrl";

export default {
  name: "BarcodePrint",
  props: {
    barcodeList: {
      type: Array,
      default: () => []
    },
    /** 预览页展示：为 true 时不隐藏根节点 */
    embedPreview: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    /** 预览页展示内容；列表页打印时保持 hidden 不占位 */
    containerBindAttrs() {
      return this.embedPreview ? {} : { hidden: "hidden" };
    },
    /** Code128 一维码图片（院内码内容） */
    barcodeListForPrint() {
      return this.barcodeList.map((barcode) => {
        const codeNorm = normalizeBarcodePayload(barcode.inHospitalCode);
        const linearBarcodeUrl = codeNorm ? buildCode128DataUrl(codeNorm) : "";
        return {
          ...barcode,
          inHospitalCode: codeNorm,
          linearBarcodeUrl
        };
      });
    }
  },
  methods: {
    start() {
      this.$nextTick(() => {
        const images = this.$refs.barcodePrintRef.querySelectorAll(".linear-barcode-img");
        let loadedCount = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
          this.$print(this.$refs.barcodePrintRef, {}, "40mm 60mm");
          return;
        }

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            setTimeout(() => {
              this.$print(this.$refs.barcodePrintRef, {}, "40mm 60mm");
            }, 100);
          }
        };

        images.forEach((img) => {
          if (img.complete) {
            checkAllLoaded();
          } else {
            img.addEventListener("load", checkAllLoaded);
            img.addEventListener("error", () => {
              console.error("一维码图片加载失败:", img.src);
              checkAllLoaded();
            });
          }
        });
      });
    },
    handleBarcodeImageError(event) {
      console.error("一维码图片加载失败:", event.target.src);
    },
    handleBarcodeImageLoad() {
      // 可选：调试时打开
    }
  }
};
</script>

<style lang="stylus" media="print">
/* 宽×高：40×60 为纵向标签页，避免预览/打印机按 60×40 走横向 */
@page {
  size: 40mm 60mm;
  margin: 0;
}

@media print {
  * {
    color: #000 !important;
  }

  .barcode-print-container {
    width: 100% !important;
    background-color: #fff !important;
  }

  .barcode-page {
    width: 40mm;
    height: 60mm;
    max-height: 60mm;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
    background-color: #fff;
    page-break-after: always;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .barcode-page:last-child {
    page-break-after: auto;
  }

  .container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    background-color: #fff;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .title-block {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    flex-shrink: 0;
    box-sizing: border-box;
    align-self: stretch;
  }

  .title {
    text-align: center;
    font-weight: bold;
    font-size: 13px;
    line-height: 1.12;
    padding: 0.35mm 0 0.12mm;
    border: none;
    background-color: #fff;
    flex-shrink: 0;
  }

  /* pt 线宽对齐打印机栅格；略宽于纸内宽，减少两侧“缺一段”感 */
  .barcode-page .title-line {
    display: block;
    width: 100%;
    max-width: 100%;
    height: 0;
    margin: 0;
    padding: 0;
    border: none;
    border-top: 0.75pt solid #000 !important;
    background: none !important;
    flex-shrink: 0;
    box-sizing: content-box;
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #fff;
  }

  .main-info {
    flex: 0 0 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 1.4mm;
    align-items: center;
    background-color: #fff;
  }

  .info-table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    flex-shrink: 0;
  }

  .info-table col.col-lab {
    width: 14%;
  }

  .info-table col.col-val-wide {
    width: 38%;
  }

  .info-table col.col-val {
    width: 34%;
  }

  .info-table tr.row-two-pair .value-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }

  /* 有效期、厂家：标签列加宽，与值拉开 */
  .info-table tr:not(.row-two-pair) .label-cell {
    width: 34%;
    padding-right: 2.45mm;
  }

  .info-table tr:not(.row-two-pair) .value-cell {
    width: 66%;
    padding-left: 2.2mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: normal;
    overflow-wrap: normal;
  }

  .info-table td {
    border: none;
    padding: 0.68mm 0.55mm;
    font-size: 10px;
    line-height: 1.42;
    vertical-align: top;
    overflow: visible;
  }

  .info-table tr.row-two-pair td:nth-child(1) {
    padding-left: 0.25mm;
  }

  /* 第一行：品名值与「规格」中间留大缝；第二行：批号与「单价」间收紧，多给批号显示宽度 */
  .info-table tr.row-two-pair:first-child td:nth-child(2) {
    padding-right: 2.45mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td:nth-child(2) {
    padding-right: 0.85mm;
  }

  .info-table tr.row-two-pair:first-child td:nth-child(3) {
    padding-left: 2.35mm;
    padding-right: 0.85mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td:nth-child(3) {
    padding-left: 0.55mm;
    padding-right: 0.85mm;
  }

  .info-table tr.row-two-pair td:nth-child(4) {
    padding-left: 1.55mm;
    padding-right: 0.25mm;
  }

  .info-table tr.row-two-pair:first-child td {
    padding-bottom: 0.82mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td {
    padding-top: 0.82mm;
  }

  .label-cell {
    width: 34%;
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: left;
    vertical-align: top;
    padding-left: 0.6mm;
    padding-right: 1.35mm;
    white-space: nowrap;
  }

  .value-cell {
    width: 66%;
    text-align: left;
    vertical-align: top;
    white-space: normal;
    overflow: visible;
    word-break: break-all;
    overflow-wrap: anywhere;
    padding-left: 1mm;
    padding-right: 0.35mm;
  }

  .barcode-row {
    flex-shrink: 0;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    text-align: center;
    padding: 0.3mm 0 0;
    box-sizing: border-box;
    background-color: #fff;
  }

  .linear-barcode-img {
    display: block;
    margin: 0 auto;
    max-width: 35mm;
    width: auto;
    height: auto;
    max-height: 8.6mm;
    object-fit: contain;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .barcode-code-text {
    font-size: 9px;
    line-height: 1.2;
    text-align: center;
    margin-top: 0.3mm;
    padding: 0 0.8mm;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .barcode-placeholder {
    font-size: 10px;
    color: #666;
    text-align: center;
    padding: 1mm 0;
  }
}
</style>

<style lang="stylus" scoped>
.barcode-print-container {
  padding: 0;
  line-height: 1.4;
}

.barcode-page {
  width: 40mm;
  height: 60mm;
  max-height: 60mm;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #fff;
  page-break-after: always;
  page-break-inside: avoid;
  break-inside: avoid;
}

.barcode-page:last-child {
  page-break-after: auto;
}

.container {
  width: 100%;
  height: 100%;
  max-height: 100%;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  background-color: #fff;
}

.title-block {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
  align-self: stretch;
}

.title {
  text-align: center;
  font-weight: bold;
  font-size: 13px;
  line-height: 1.12;
  padding: 0.35mm 0 0.12mm;
  border: none;
  background-color: #fff;
  flex-shrink: 0;
}

.barcode-page .title-line {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-top: 0.75pt solid #000;
  background: none;
  flex-shrink: 0;
  box-sizing: content-box;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #fff;
}

.main-info {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 1.4mm;
  align-items: center;
  background-color: #fff;
}

.info-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  flex-shrink: 0;
}

.info-table col.col-lab {
  width: 14%;
}

.info-table col.col-val-wide {
  width: 38%;
}

.info-table col.col-val {
  width: 34%;
}

.info-table tr.row-two-pair .value-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
}

.info-table tr:not(.row-two-pair) .label-cell {
  width: 34%;
  padding-right: 2.45mm;
}

.info-table tr:not(.row-two-pair) .value-cell {
  width: 66%;
  padding-left: 2.2mm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: normal;
  overflow-wrap: normal;
}

.info-table td {
  border: none;
  padding: 0.68mm 0.55mm;
  font-size: 10px;
  line-height: 1.42;
  vertical-align: top;
  overflow: visible;
}

.info-table tr.row-two-pair td:nth-child(1) {
  padding-left: 0.25mm;
}

.info-table tr.row-two-pair:first-child td:nth-child(2) {
  padding-right: 2.45mm;
}

.info-table tr.row-two-pair:nth-child(2) td:nth-child(2) {
  padding-right: 0.85mm;
}

.info-table tr.row-two-pair:first-child td:nth-child(3) {
  padding-left: 2.35mm;
  padding-right: 0.85mm;
}

.info-table tr.row-two-pair:nth-child(2) td:nth-child(3) {
  padding-left: 0.55mm;
  padding-right: 0.85mm;
}

.info-table tr.row-two-pair td:nth-child(4) {
  padding-left: 1.55mm;
  padding-right: 0.25mm;
}

.info-table tr.row-two-pair:first-child td {
  padding-bottom: 0.82mm;
}

.info-table tr.row-two-pair:nth-child(2) td {
  padding-top: 0.82mm;
}

.label-cell {
  width: 34%;
  font-weight: bold;
  background-color: #f9f9f9;
  text-align: left;
  vertical-align: top;
  padding-left: 0.6mm;
  padding-right: 1.35mm;
  white-space: nowrap;
}

.value-cell {
  width: 66%;
  text-align: left;
  vertical-align: top;
  white-space: normal;
  overflow: visible;
  word-break: break-all;
  overflow-wrap: anywhere;
  padding-left: 1mm;
  padding-right: 0.35mm;
}

.barcode-row {
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  padding: 0.3mm 0 0;
  box-sizing: border-box;
  background-color: #fff;
}

.linear-barcode-img {
  display: block;
  margin: 0 auto;
  max-width: 35mm;
  width: auto;
  height: auto;
  max-height: 8.6mm;
  object-fit: contain;
  border: none;
  outline: none;
  box-shadow: none;
}

.barcode-code-text {
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  margin-top: 0.3mm;
  padding: 0 0.8mm;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.barcode-placeholder {
  font-size: 10px;
  color: #666;
  text-align: center;
  padding: 1mm 0;
}
</style>
