<template>
  <div class="barcode-print-container" ref="barcodePrintRef" hidden="hidden">
    <div v-for="(barcode, index) in barcodeListWithQRCode" :key="index" class="barcode-page">
      <div class="container">
        <!-- 标题 -->
        <div class="title">高值院内码</div>
        
        <!-- 内容区域 -->
        <div class="content">
          <!-- 左侧信息区域 -->
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
              <tr>
                <td class="label-cell">厂家</td>
                <td class="value-cell">{{ barcode.factoryName }}</td>
              </tr>
              <tr>
                <td class="label-cell">院内码</td>
                <td class="value-cell">{{ barcode.inHospitalCode }}</td>
              </tr>
            </table>
          </div>
          
          <!-- 右侧二维码区域 -->
          <div class="right-qrcode">
            <img v-if="barcode.qrCodeUrl" 
                 :src="barcode.qrCodeUrl" 
                 alt="二维码" 
                 class="qrcode-img"
                 @error="handleQRCodeError"
                 @load="handleQRCodeLoad" />
            <div v-else class="qrcode-placeholder">
              <div v-if="!barcode.inHospitalCode">无院内码: {{ barcode.inHospitalCode }}</div>
              <div v-else>二维码生成失败</div>
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
    }
  },
  computed: {
    // 预计算所有二维码URL，避免在模板中重复计算
    // 使用较大的尺寸（200x200）以确保打印清晰度
    barcodeListWithQRCode() {
      return this.barcodeList.map(barcode => {
        const qrCodeUrl = barcode.inHospitalCode 
          ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(barcode.inHospitalCode)}`
          : '';
        console.log('生成二维码:', {
          inHospitalCode: barcode.inHospitalCode,
          qrCodeUrl: qrCodeUrl,
          hasQRCode: !!qrCodeUrl
        });
        return {
          ...barcode,
          qrCodeUrl: qrCodeUrl
        };
      });
    }
  },
  methods: {
    start() {
      // 等待二维码图片加载完成后再打印
      this.$nextTick(() => {
        // 检查所有二维码是否已加载
        const images = this.$refs.barcodePrintRef.querySelectorAll('.qrcode-img');
        let loadedCount = 0;
        const totalImages = images.length;
        
        if (totalImages === 0) {
          // 没有二维码图片，直接打印
          this.$print(this.$refs.barcodePrintRef, {}, '6cm 4cm');
          return;
        }
        
        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= totalImages) {
            // 所有图片加载完成，延迟一点时间确保渲染完成
            setTimeout(() => {
              this.$print(this.$refs.barcodePrintRef, {}, '6cm 4cm');
            }, 100);
          }
        };
        
        images.forEach(img => {
          if (img.complete) {
            checkAllLoaded();
          } else {
            img.addEventListener('load', checkAllLoaded);
            img.addEventListener('error', () => {
              console.error('二维码图片加载失败:', img.src);
              checkAllLoaded(); // 即使失败也继续
            });
          }
        });
      });
    },
    handleQRCodeError(event) {
      console.error('二维码图片加载失败:', event.target.src);
      console.error('院内码:', this.barcodeList.find(b => b.qrCodeUrl === event.target.src)?.inHospitalCode);
    },
    handleQRCodeLoad(event) {
      console.log('二维码图片加载成功:', event.target.src);
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
    flex-direction: row;
    height: calc(100% - 12px);
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
    padding: 2mm;
    height: 100%;
    min-height: 100px;
    border-left: 1px solid #000;
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

  .qrcode-img {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    min-width: 50px;
    min-height: 50px;
    object-fit: contain;
    display: block;
    margin: auto;
  }

  .qrcode-placeholder {
    font-size: 9px;
    color: #999;
    text-align: center;
    padding: 10px;
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
  flex-direction: row;
  height: calc(100% - 12px);
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
  padding: 2mm;
  height: 100%;
  min-height: 100px;
  border-left: 1px solid #000;
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

.qrcode-img {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  min-width: 50px;
  min-height: 50px;
  object-fit: contain;
  display: block;
  margin: auto;
}

.qrcode-placeholder {
  font-size: 9px;
  color: #999;
  text-align: center;
  padding: 10px;
}
</style>
