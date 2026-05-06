<template>
  <div class="barcode-print-container" ref="barcodePrintRef" hidden="hidden">
    <div v-for="(barcode, index) in barcodeListForPrint" :key="index" class="barcode-page">
      <div class="container">
        <div class="title-block">
          <div class="title">高值备货码</div>
          <div class="title-line" aria-hidden="true"></div>
        </div>

        <div class="content">
          <div class="main-info">
            <table class="info-table">
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
            <!-- 一维码：院内码文字行不展示，仅条码 -->
            <div class="barcode-row">
              <img
                v-if="barcode.linearBarcodeUrl"
                :src="barcode.linearBarcodeUrl"
                alt="院内码条码"
                class="linear-barcode-img"
                @error="handleBarcodeImageError"
                @load="handleBarcodeImageLoad"
              />
              <div v-else class="barcode-placeholder">
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
import { buildCode128DataUrl } from "@/utils/code128DataUrl";

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
    /** Code128 一维码图片（院内码内容） */
    barcodeListForPrint() {
      return this.barcodeList.map((barcode) => {
        const linearBarcodeUrl = barcode.inHospitalCode
          ? buildCode128DataUrl(String(barcode.inHospitalCode))
          : "";
        return {
          ...barcode,
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
  }

  .barcode-page {
    width: 40mm;
    height: 60mm;
    max-height: 60mm;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
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
    padding: 1mm 0 0.6mm;
    border: none;
    background-color: #fff;
    flex-shrink: 0;
  }

  /* 与标签纸同宽 40mm，避免预览/打印时左右露白 */
  .barcode-page .title-line {
    display: block;
    width: 40mm;
    max-width: 40mm;
    height: 0;
    margin: 0;
    padding: 0;
    border: none;
    border-top: 1px solid #000;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .main-info {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 2.5mm;
    align-items: center;
  }

  .info-table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    flex-shrink: 0;
  }

  /* 品名+规格、批号+单价：四列并排 */
  .info-table tr.row-two-pair .label-cell {
    width: 22%;
  }

  .info-table tr.row-two-pair .value-cell {
    width: 28%;
    white-space: nowrap;
  }

  /* 有效期、厂家：标签列加宽，与值拉开 */
  .info-table tr:not(.row-two-pair) .label-cell {
    width: 34%;
  }

  .info-table tr:not(.row-two-pair) .value-cell {
    width: 66%;
  }

  .info-table td {
    border: none;
    padding: 0.68mm 0.55mm;
    font-size: 8px;
    line-height: 1.48;
    vertical-align: top;
    overflow: visible;
  }

  /* 品名值 与 「规格」列 之间留空 */
  .info-table tr.row-two-pair td:nth-child(2) {
    padding-right: 1.25mm;
  }

  .info-table tr.row-two-pair td:nth-child(3) {
    padding-left: 1.05mm;
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
  }

  .linear-barcode-img {
    display: block;
    margin: 0 auto;
    max-width: 35mm;
    width: auto;
    height: auto;
    max-height: 9.5mm;
    object-fit: contain;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  .barcode-placeholder {
    font-size: 8px;
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
  padding: 1mm 0 0.6mm;
  border: none;
  background-color: #fff;
  flex-shrink: 0;
}

.barcode-page .title-line {
  display: block;
  width: 40mm;
  max-width: 40mm;
  height: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-top: 1px solid #000;
  flex-shrink: 0;
  box-sizing: border-box;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-info {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 2.5mm;
  align-items: center;
}

.info-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  flex-shrink: 0;
}

.info-table tr.row-two-pair .label-cell {
  width: 22%;
}

.info-table tr.row-two-pair .value-cell {
  width: 28%;
  white-space: nowrap;
}

.info-table tr:not(.row-two-pair) .label-cell {
  width: 34%;
}

.info-table tr:not(.row-two-pair) .value-cell {
  width: 66%;
}

.info-table td {
  border: none;
  padding: 0.68mm 0.55mm;
  font-size: 8px;
  line-height: 1.48;
  vertical-align: top;
  overflow: visible;
}

.info-table tr.row-two-pair td:nth-child(2) {
  padding-right: 1.25mm;
}

.info-table tr.row-two-pair td:nth-child(3) {
  padding-left: 1.05mm;
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
}

.linear-barcode-img {
  display: block;
  margin: 0 auto;
  max-width: 35mm;
  width: auto;
  height: auto;
  max-height: 9.5mm;
  object-fit: contain;
  border: none;
  outline: none;
  box-shadow: none;
}

.barcode-placeholder {
  font-size: 8px;
  color: #666;
  text-align: center;
  padding: 1mm 0;
}
</style>
