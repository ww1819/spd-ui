<template>
  <div class="barcode-print-container" ref="barcodePrintRef" hidden="hidden">
    <div v-for="(barcode, index) in barcodeListForPrint" :key="index" class="barcode-page">
      <div class="container">
        <div class="title">高值院内码</div>

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
          ? `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
              String(barcode.inHospitalCode)
            )}&code=Code128&dpi=72&imagewidth=200&imageheight=56`
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
          this.$print(this.$refs.barcodePrintRef, {}, "60mm 40mm");
          return;
        }

        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            setTimeout(() => {
              this.$print(this.$refs.barcodePrintRef, {}, "60mm 40mm");
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
  }

  .barcode-page {
    width: 60mm;
    height: 40mm;
    max-height: 40mm;
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
    border: 2px solid #000;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .title {
    text-align: center;
    font-weight: bold;
    font-size: 10px;
    padding: 1mm 0;
    border-bottom: 1px solid #000;
    background-color: #fff;
    flex-shrink: 0;
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
    padding: 0 3.5mm;
    align-items: center;
  }

  .info-table {
    width: 100%;
    max-width: 50mm;
    border-collapse: collapse;
    table-layout: fixed;
    flex-shrink: 0;
  }

  /* 品名+规格、批号+单价：四列并排 */
  .info-table tr.row-two-pair .label-cell {
    width: 11%;
  }

  .info-table tr.row-two-pair .value-cell {
    width: 39%;
  }

  .info-table td {
    border: none;
    padding: 1.15mm 1mm;
    font-size: 7px;
    line-height: 1.72;
    vertical-align: top;
    overflow: visible;
  }

  .label-cell {
    width: 28%;
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: left;
    vertical-align: top;
    padding-left: 1mm;
    white-space: nowrap;
  }

  .value-cell {
    width: 72%;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 1mm;
  }

  .barcode-row {
    flex-shrink: 0;
    width: 100%;
    max-width: 50mm;
    margin: 0 auto;
    text-align: center;
    padding: 0.3mm 0 0;
    box-sizing: border-box;
  }

  .linear-barcode-img {
    display: block;
    margin: 0 auto;
    max-width: 38mm;
    width: auto;
    height: auto;
    max-height: 7mm;
    object-fit: contain;
  }

  .barcode-placeholder {
    font-size: 7px;
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
  width: 60mm;
  height: 40mm;
  max-height: 40mm;
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
  border: 2px solid #000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.title {
  text-align: center;
  font-weight: bold;
  font-size: 10px;
  padding: 1mm 0;
  border-bottom: 1px solid #000;
  background-color: #fff;
  flex-shrink: 0;
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
  padding: 0 3.5mm;
  align-items: center;
}

.info-table {
  width: 100%;
  max-width: 50mm;
  border-collapse: collapse;
  table-layout: fixed;
  flex-shrink: 0;
}

.info-table tr.row-two-pair .label-cell {
  width: 11%;
}

.info-table tr.row-two-pair .value-cell {
  width: 39%;
}

.info-table td {
  border: none;
  padding: 1.15mm 1mm;
  font-size: 7px;
  line-height: 1.72;
  vertical-align: top;
  overflow: visible;
}

.label-cell {
  width: 28%;
  font-weight: bold;
  background-color: #f9f9f9;
  text-align: left;
  vertical-align: top;
  padding-left: 1mm;
  white-space: nowrap;
}

.value-cell {
  width: 72%;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 1mm;
}

.barcode-row {
  flex-shrink: 0;
  width: 100%;
  max-width: 50mm;
  margin: 0 auto;
  text-align: center;
  padding: 0.3mm 0 0;
  box-sizing: border-box;
}

.linear-barcode-img {
  display: block;
  margin: 0 auto;
  max-width: 38mm;
  width: auto;
  height: auto;
  max-height: 7mm;
  object-fit: contain;
}

.barcode-placeholder {
  font-size: 7px;
  color: #666;
  text-align: center;
  padding: 1mm 0;
}
</style>
