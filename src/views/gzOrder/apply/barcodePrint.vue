<template>
  <div
    class="barcode-print-container"
    :class="{ 'is-embed-preview': embedPreview }"
    ref="barcodePrintRef"
    v-bind="containerBindAttrs"
  >
    <div v-for="(barcode, index) in barcodeListForPrint" :key="index" class="barcode-item-wrap">
      <div class="barcode-page">
      <div class="container">
        <div class="title-block">
          <div class="title">高值备货码</div>
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
                <td class="label-cell">品&#12288;名：</td>
                <td class="value-cell">{{ barcode.materialName }}</td>
                <td class="label-cell">规&#12288;格：</td>
                <td class="value-cell">{{ barcode.speci }}</td>
              </tr>
              <tr class="row-two-pair">
                <td class="label-cell">批&#12288;号：</td>
                <td class="value-cell">{{ barcode.batchNumber }}</td>
                <td class="label-cell">单&#12288;价：</td>
                <td class="value-cell">{{ barcode.price }}</td>
              </tr>
              <tr>
                <td class="label-cell">有效期：</td>
                <td class="value-cell" colspan="3">{{ barcode.endTime }}</td>
              </tr>
              <tr>
                <td class="label-cell">厂&#12288;家：</td>
                <td class="value-cell" colspan="3">{{ barcode.factoryName }}</td>
              </tr>
            </table>
            <!-- 一维码 + 底部明文院内码 -->
            <div class="barcode-row">
              <div
                v-if="barcode.linearBarcodeSvg"
                class="linear-barcode-svg-wrap"
                :style="linearBarcodeImgStyle(barcode)"
                v-html="barcode.linearBarcodeSvg"
              />
              <img
                v-else-if="barcode.linearBarcodeUrl"
                :src="barcode.linearBarcodeUrl"
                alt="院内码条码"
                class="linear-barcode-img"
                :width="barcode.linearBarcodeWidthPx"
                :height="barcode.linearBarcodeHeightPx"
                :style="linearBarcodeImgStyle(barcode)"
                @error="handleBarcodeImageError"
                @load="handleBarcodeImageLoad"
              />
              <div v-if="(barcode.linearBarcodeSvg || barcode.linearBarcodeUrl) && barcode.inHospitalCode" class="barcode-code-text">
                {{ barcode.inHospitalCode }}
              </div>
              <div v-if="!barcode.linearBarcodeSvg && !barcode.linearBarcodeUrl" class="barcode-placeholder">
                <span v-if="!barcode.inHospitalCode">无院内码</span>
                <span v-else>条码未生成</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <!-- 预览页专用：标签外放大扫码区，不影响标签排版比例 -->
      <div v-if="embedPreview && barcode.linearBarcodeSvg" class="screen-scan-panel no-print">
        <div class="screen-scan-hint">屏幕扫码请扫下方放大条码（上方为实际打印效果）</div>
        <div
          class="screen-scan-barcode"
          :style="screenScanBarcodeStyle(barcode)"
          v-html="barcode.linearBarcodeSvg"
        />
        <div v-if="barcode.inHospitalCode" class="screen-scan-code">{{ barcode.inHospitalCode }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { buildCode128Label, normalizeBarcodePayload } from "@/utils/code128DataUrl";

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
        const label = codeNorm ? buildCode128Label(codeNorm) : { dataUrl: "", svgHtml: "", widthMm: 0, heightMm: 0, widthPx: 0, heightPx: 0 };
        return {
          ...barcode,
          inHospitalCode: codeNorm,
          linearBarcodeUrl: label.dataUrl,
          linearBarcodeSvg: label.svgHtml,
          linearBarcodeWidthMm: label.widthMm,
          linearBarcodeHeightMm: label.heightMm,
          linearBarcodeWidthPx: label.widthPx,
          linearBarcodeHeightPx: label.heightPx,
        };
      });
    }
  },
  methods: {
    linearBarcodeImgStyle(barcode) {
      if (!barcode.linearBarcodeWidthMm || !barcode.linearBarcodeHeightMm) {
        return {};
      }
      const wMm = barcode.linearBarcodeWidthMm;
      const hMm = barcode.linearBarcodeHeightMm;
      return {
        width: `${wMm}mm`,
        height: `${hMm}mm`,
      };
    },
    /** 标签外屏幕扫码区：放大显示，不改变标签内比例 */
    screenScanBarcodeStyle(barcode) {
      if (!barcode.linearBarcodeWidthMm || !barcode.linearBarcodeHeightMm) {
        return {};
      }
      const aspect = barcode.linearBarcodeHeightMm / barcode.linearBarcodeWidthMm;
      const scanWidthPx = 360;
      return {
        width: `${scanWidthPx}px`,
        height: `${Math.max(44, Math.round(scanWidthPx * aspect))}px`,
      };
    },
    start() {
      this.$nextTick(() => {
        const root = this.$refs.barcodePrintRef || this.$el;
        if (!root || !root.querySelectorAll) return;
        const images = root.querySelectorAll(".linear-barcode-img");
        const svgWraps = root.querySelectorAll(".linear-barcode-svg-wrap");
        let loadedCount = 0;
        const totalImages = images.length;
        const totalSvgs = svgWraps.length;

        const doPrint = () => {
          setTimeout(() => {
            this.$print(root, {}, "60mm 40mm");
          }, 100);
        };

        if (totalImages === 0 && totalSvgs > 0) {
          doPrint();
          return;
        }

        if (totalImages === 0) {
          this.$print(root, {}, "60mm 40mm");
          return;
        }

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            doPrint();
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
/* 宽×高：60×40 mm（横向标签） */
@page {
  size: 60mm 40mm;
  margin: 0;
}

@media print {
  * {
    color: #000 !important;
  }

  .barcode-print-container {
    width: 100% !important;
    background-color: #fff !important;
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif !important;
    font-weight: 400 !important;
    -webkit-font-smoothing: antialiased;
  }

  .barcode-page {
    width: 60mm;
    height: 40mm;
    max-height: 40mm;
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
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .title {
    display: block;
    width: 100%;
    margin: 0;
    text-align: center;
    font-weight: 600;
    font-size: 11px;
    line-height: 1.12;
    padding: 0.25mm 0 0.08mm;
    border: none;
    background-color: #fff;
    flex-shrink: 0;
    box-sizing: border-box;
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
    padding: 0 0.25mm;
    align-items: stretch;
    width: 100%;
    box-sizing: border-box;
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
    width: 15%;
  }

  .info-table col.col-val-wide {
    width: 37%;
  }

  .info-table col.col-val {
    width: 35%;
  }

  .info-table tr.row-two-pair .value-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }

  .info-table tr:not(.row-two-pair) .label-cell {
    width: 34%;
    padding-right: 0;
  }

  .info-table tr:not(.row-two-pair) .value-cell {
    width: 66%;
    padding-left: 0.1mm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: normal;
    overflow-wrap: normal;
  }

  .info-table td {
    border: none;
    padding: 0.42mm 0.35mm;
    font-size: 8.5px;
    line-height: 1.32;
    vertical-align: top;
    overflow: visible;
  }

  .info-table tr.row-two-pair td:nth-child(1) {
    padding-left: 0.15mm;
  }

  .info-table tr.row-two-pair:first-child td:nth-child(2) {
    padding-right: 0.35mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td:nth-child(2) {
    padding-right: 0.35mm;
  }

  .info-table tr.row-two-pair:first-child td:nth-child(3) {
    padding-left: 0.35mm;
    padding-right: 0.35mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td:nth-child(3) {
    padding-left: 0.35mm;
    padding-right: 0.35mm;
  }

  .info-table tr.row-two-pair td:nth-child(4) {
    padding-left: 0.1mm;
    padding-right: 0.15mm;
  }

  .info-table tr.row-two-pair:first-child td {
    padding-bottom: 0.82mm;
  }

  .info-table tr.row-two-pair:nth-child(2) td {
    padding-top: 0.82mm;
  }

  .label-cell {
    width: 34%;
    font-weight: 500;
    background-color: #f9f9f9;
    text-align: left;
    vertical-align: top;
    padding-left: 0.15mm;
    padding-right: 0;
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
    padding-left: 0.1mm;
    padding-right: 0.25mm;
  }

  .barcode-row {
    flex-shrink: 0;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0.15mm 0 0;
    box-sizing: border-box;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
  }

  .linear-barcode-svg-wrap {
    display: block;
    flex-shrink: 0;
    margin: 0 auto;
    overflow: hidden;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .linear-barcode-svg-wrap >>> svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .linear-barcode-img {
    display: block;
    flex-shrink: 0;
    margin: 0 auto;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .barcode-code-text {
    display: block;
    width: 100%;
    max-width: 58mm;
    margin: 0.6mm 0 0;
    padding: 0;
    box-sizing: border-box;
    font-size: 7.5px;
    font-weight: 400;
    line-height: 1.15;
    text-align: center;
    color: #000;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .barcode-placeholder {
    display: block;
    width: 100%;
    max-width: 58mm;
    margin: 0;
    font-size: 8px;
    color: #666;
    text-align: center;
    padding: 1mm 0;
    box-sizing: border-box;
  }
}
</style>

<style lang="stylus" scoped>
.barcode-print-container {
  padding: 0;
  line-height: 1.32;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
}

.barcode-page {
  width: 60mm;
  height: 40mm;
  max-height: 40mm;
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
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  display: block;
  width: 100%;
  margin: 0;
  text-align: center;
  font-weight: 600;
  font-size: 11px;
  line-height: 1.12;
  padding: 0.25mm 0 0.08mm;
  border: none;
  background-color: #fff;
  flex-shrink: 0;
  box-sizing: border-box;
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
  padding: 0 0.25mm;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
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
  width: 15%;
}

.info-table col.col-val-wide {
  width: 37%;
}

.info-table col.col-val {
  width: 35%;
}

.info-table tr.row-two-pair .value-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
}

.info-table tr:not(.row-two-pair) .label-cell {
  width: 34%;
  padding-right: 0;
}

.info-table tr:not(.row-two-pair) .value-cell {
  width: 66%;
  padding-left: 0.1mm;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: normal;
  overflow-wrap: normal;
}

.info-table td {
  border: none;
  padding: 0.42mm 0.35mm;
  font-size: 8.5px;
  line-height: 1.32;
  vertical-align: top;
  overflow: visible;
}

.info-table tr.row-two-pair td:nth-child(1) {
  padding-left: 0.15mm;
}

.info-table tr.row-two-pair:first-child td:nth-child(2) {
  padding-right: 0.35mm;
}

.info-table tr.row-two-pair:nth-child(2) td:nth-child(2) {
  padding-right: 0.35mm;
}

.info-table tr.row-two-pair:first-child td:nth-child(3) {
  padding-left: 0.35mm;
  padding-right: 0.35mm;
}

.info-table tr.row-two-pair:nth-child(2) td:nth-child(3) {
  padding-left: 0.35mm;
  padding-right: 0.35mm;
}

.info-table tr.row-two-pair td:nth-child(4) {
  padding-left: 0.1mm;
  padding-right: 0.15mm;
}

.info-table tr.row-two-pair:first-child td {
  padding-bottom: 0.82mm;
}

.info-table tr.row-two-pair:nth-child(2) td {
  padding-top: 0.82mm;
}

.label-cell {
  width: 34%;
  font-weight: 500;
  background-color: #f9f9f9;
  text-align: left;
  vertical-align: top;
  padding-left: 0.15mm;
  padding-right: 0;
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
  padding-left: 0.1mm;
  padding-right: 0.25mm;
}

.barcode-row {
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0.15mm 0 0;
  box-sizing: border-box;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
}

.linear-barcode-svg-wrap {
  display: block;
  flex-shrink: 0;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
}

.linear-barcode-svg-wrap >>> svg {
  display: block;
  width: 100%;
  height: 100%;
}

.linear-barcode-img {
  display: block;
  flex-shrink: 0;
  margin: 0 auto;
  border: none;
  outline: none;
  box-shadow: none;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.barcode-code-text {
  display: block;
  width: 100%;
  max-width: 58mm;
  margin: 0.6mm 0 0;
  padding: 0;
  box-sizing: border-box;
  font-size: 7.5px;
  font-weight: 400;
  line-height: 1.15;
  text-align: center;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.barcode-placeholder {
  display: block;
  width: 100%;
  max-width: 58mm;
  margin: 0;
  font-size: 8px;
  color: #666;
  text-align: center;
  padding: 1mm 0;
  box-sizing: border-box;
}

.barcode-item-wrap {
  box-sizing: border-box;
}

.screen-scan-panel {
  margin: 16px auto 24px;
  padding: 12px 16px 16px;
  max-width: 420px;
  text-align: center;
  background: #fafafa;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
}

.screen-scan-hint {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.screen-scan-barcode {
  display: block;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
}

.screen-scan-barcode >>> svg {
  display: block;
  width: 100%;
  height: 100%;
}

.screen-scan-code {
  margin-top: 8px;
  font-size: 15px;
  letter-spacing: 0.6px;
  color: #000;
}

@media print {
  .no-print {
    display: none !important;
  }
}
</style>
