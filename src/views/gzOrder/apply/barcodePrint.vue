<template>
  <div class="barcode-print-container" ref="barcodePrintRef" hidden="hidden">
    <div v-for="(barcode, index) in barcodeListWithQRCode" :key="index" class="barcode-page">
      <div class="container">
        <!-- 标题 -->
        <div class="title">高值院内码</div>
        
        <!-- 内容区域 -->
        <div class="content">
          <!-- 上半部分：前5行信息 + 二维码 -->
          <div class="top-section">
            <!-- 左侧信息（前5行） -->
            <div class="left-info">
              <table class="info-table">
                <tr>
                  <td class="label-cell">品名</td>
                  <td class="value-cell">{{ barcode.materialName }}</td>
                </tr>
                <tr>
                  <td class="label-cell">批号</td>
                  <td class="value-cell">{{ barcode.batchNumber }}</td>
                </tr>
                <tr>
                  <td class="label-cell">单价</td>
                  <td class="value-cell">{{ barcode.price }}</td>
                </tr>
                <tr>
                  <td class="label-cell">有效期</td>
                  <td class="value-cell">{{ barcode.endTime }}</td>
                </tr>
                <tr>
                  <td class="label-cell">规格</td>
                  <td class="value-cell">{{ barcode.speci }}</td>
                </tr>
              </table>
            </div>
            
            <!-- 右侧二维码 -->
            <div class="right-qrcode">
              <img v-if="barcode.qrCodeUrl" 
                   :src="barcode.qrCodeUrl" 
                   alt="二维码" 
                   class="qrcode-img"
                   loading="lazy"
                   decoding="async" />
              <div v-else class="qrcode-placeholder">二维码</div>
            </div>
          </div>
          
          <!-- 下半部分：厂家和院内码（两列布局） -->
          <div class="bottom-section">
            <!-- 左侧：厂家和院内码 -->
            <div class="bottom-left">
              <table class="bottom-table">
                <tr>
                  <td class="bottom-label">厂家</td>
                  <td class="bottom-value">{{ barcode.factoryName }}</td>
                </tr>
                <tr>
                  <td class="bottom-label">院内码</td>
                  <td class="bottom-value">{{ barcode.inHospitalCode }}</td>
                </tr>
              </table>
            </div>
            
            <!-- 右侧：空白区域（与二维码区域对齐） -->
            <div class="bottom-right"></div>
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
    }
  },
  computed: {
    // 预计算所有二维码URL，避免在模板中重复计算
    // 使用较小的尺寸（60x60）以提高加载速度
    barcodeListWithQRCode() {
      return this.barcodeList.map(barcode => ({
        ...barcode,
        qrCodeUrl: barcode.inHospitalCode 
          ? `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(barcode.inHospitalCode)}`
          : ''
      }))
    }
  },
  methods: {
    start() {
      // 立即显示预览，不等待图片加载
      // 浏览器会在打印时处理图片
      this.$nextTick(() => {
        this.$print(this.$refs.barcodePrintRef, {}, '6cm 4cm')
      })
    }
  }
}
</script>

<style lang="stylus" media="print">
@page {
  size: 6cm 4cm;
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
    width: 57mm;
    height: 37mm;
    margin: 0;
    padding: 1.5mm;
    page-break-after: always;
    page-break-inside: avoid;
  }

  .barcode-page:last-child {
    page-break-after: auto;
  }

  .container {
    width: 100%;
    height: 100%;
    border: 2px solid #000;
    display: flex;
    flex-direction: column;
  }

  .title {
    text-align: center;
    font-weight: bold;
    font-size: 11px;
    padding: 1.5mm 0;
    border-bottom: 1px solid #000;
    background-color: #fff;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: calc(100% - 12px);
  }

  .top-section {
    display: flex;
    flex: 1;
  }

  .left-info {
    width: 70%;
    border-right: 1px solid #000;
    padding: 0;
  }

  .right-qrcode {
    width: 30%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5mm 2mm;
    border-right: 0.1px solid #000;
    margin-right: -1px;
    position: relative;
    right: -1px;
    height: 75%;
    align-self: flex-start;
    margin-top: 2mm;
  }

  .bottom-section {
    width: 100%;
    display: flex;
  }

  .bottom-left {
    width: 70%;
    border-right: 1px solid #000;
    padding: 0;
  }

  .bottom-right {
    width: 30%;
    padding: 0;
  }

  .info-table {
    width: 100%;
    border-collapse: collapse;
    height: 100%;
  }

  .info-table td {
    border: none;
    padding: 0.5mm 1.5mm;
    font-size: 8px;
    line-height: 1.1;
  }

  .label-cell {
    width: 30%;
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: left;
    vertical-align: middle;
    padding-left: 1.5mm;
    white-space: nowrap;
  }

  .value-cell {
    width: 70%;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 1.5mm;
  }

  .bottom-table {
    width: 100%;
    border-collapse: collapse;
  }

  .bottom-table td {
    border: none;
    padding: 0.5mm 1.5mm;
    font-size: 8px;
    line-height: 1.1;
  }

  .bottom-label {
    width: 30%;
    font-weight: bold;
    background-color: #f9f9f9;
    text-align: left;
    vertical-align: middle;
    padding-left: 1.5mm;
    white-space: nowrap;
  }

  .bottom-value {
    width: 70%;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 1.5mm;
  }

  .qrcode-img {
    max-width: 40%;
    max-height: 40%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
  }

  .qrcode-placeholder {
    font-size: 9px;
    color: #999;
  }
}
</style>

<style lang="stylus" scoped>
.barcode-print-container {
  padding: 0;
  line-height: 1.6;
}

.barcode-page {
  width: 57mm;
  height: 37mm;
  margin: 0;
  padding: 1.5mm;
  page-break-after: always;
  page-break-inside: avoid;
}

.barcode-page:last-child {
  page-break-after: auto;
}

.container {
  width: 100%;
  height: 100%;
  border: 2px solid #000;
  display: flex;
  flex-direction: column;
}

.title {
  text-align: center;
  font-weight: bold;
  font-size: 11px;
  padding: 1.5mm 0;
  border-bottom: 1px solid #000;
  background-color: #fff;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 12px);
}

.top-section {
  display: flex;
  flex: 1;
}

.left-info {
  width: 70%;
  border-right: 1px solid #000;
  padding: 0;
}

.right-qrcode {
  width: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5mm 2mm;
  border-right: 0.1px solid #000;
  margin-right: -1px;
  position: relative;
  right: -1px;
  height: 75%;
  align-self: flex-start;
  margin-top: 2mm;
}

.bottom-section {
  width: 100%;
  display: flex;
}

.bottom-left {
  width: 70%;
  border-right: 1px solid #000;
  padding: 0;
}

.bottom-right {
  width: 30%;
  padding: 0;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  height: 100%;
}

.info-table td {
  border: none;
  padding: 0.5mm 1.5mm;
  font-size: 8px;
  line-height: 1.1;
}

.label-cell {
  width: 30%;
  font-weight: bold;
  background-color: #f9f9f9;
  text-align: left;
  vertical-align: middle;
  padding-left: 1.5mm;
  white-space: nowrap;
}

.value-cell {
  width: 70%;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 1.5mm;
}

.bottom-table {
  width: 100%;
  border-collapse: collapse;
}

.bottom-table td {
  border: none;
  padding: 0.5mm 1.5mm;
  font-size: 8px;
  line-height: 1.1;
}

.bottom-label {
  width: 30%;
  font-weight: bold;
  background-color: #f9f9f9;
  text-align: left;
  vertical-align: middle;
  padding-left: 1.5mm;
  white-space: nowrap;
}

.bottom-value {
  width: 70%;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 1.5mm;
}

.qrcode-img {
  max-width: 40%;
  max-height: 40%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.qrcode-placeholder {
  font-size: 9px;
  color: #999;
}
</style>
