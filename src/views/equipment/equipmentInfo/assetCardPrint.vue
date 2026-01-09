<template>
  <div class="asset-card-print-container" ref="assetCardPrintRef" hidden="hidden">
    <!-- 单个卡片 -->
    <div
      v-for="(item, index) in cardList"
      :key="index"
      class="asset-card-print"
      :class="{ 'page-break': index > 0 }"
    >
      <!-- 资产名称（顶部） -->
      <div class="asset-name-row">
        <div class="asset-name-label">资产名称：</div>
        <div class="asset-name-value">{{ item.assetName || '--' }}</div>
      </div>

      <!-- 卡片内容区域 -->
      <div class="card-content">
        <!-- 左侧信息区域 -->
        <div class="card-info">
          <div class="info-row">
            <div class="info-label">卡片编号：</div>
            <div class="info-value">{{ item.barcode || '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">原值(元)：</div>
            <div class="info-value">{{ item.originalPrice ? parseFloat(item.originalPrice).toFixed(2) : '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">使用科室：</div>
            <div class="info-value">{{ getDepartmentName(item.useDepartment) || '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">规格型号：</div>
            <div class="info-value">{{ (item.specification || '') + (item.model ? '/' + item.model : '') || '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">购置日期：</div>
            <div class="info-value">{{ formatDate(item.purchaseDate) || '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">存放地点：</div>
            <div class="info-value">{{ item.storageLocation || '--' }}</div>
          </div>
          <div class="info-row">
            <div class="info-label">管理部门：</div>
            <div class="info-value">{{ getDepartmentName(item.manageDepartment) || '--' }}</div>
          </div>
        </div>

        <!-- 右侧二维码区域 -->
        <div class="card-qrcode">
          <img
            v-if="item.barcode"
            :src="getQRCodeUrl(item.barcode)"
            alt="二维码"
            class="qrcode-img"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { listdepart } from '@/api/foundation/depart'

export default {
  mixins: [hospitalNameMixin],
  props: ['row'],
  data() {
    return {
      departmentOptions: []
    }
  },
  computed: {
    // 处理单个或多个卡片数据
    cardList() {
      if (!this.row) {
        return []
      }
      // 如果是批量打印（包含multiple和list属性）
      if (this.row.multiple && this.row.list && Array.isArray(this.row.list)) {
        return this.row.list
      }
      // 单个卡片
      return [this.row]
    }
  },
  created() {
    this.loadDepartmentOptions()
  },
  methods: {
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        this.$nextTick(() => {
          // 打印，尺寸通过CSS @page规则设置
          this.$print(this.$refs.assetCardPrintRef, {}, 'A4')
        })
      }).catch(() => {
        this.$nextTick(() => {
          this.$print(this.$refs.assetCardPrintRef, {}, 'A4')
        })
      })
    },
    formatDate(dateStr) {
      if (!dateStr) return '--'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '--'
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    getQRCodeUrl(data) {
      if (!data) return ''
      // 使用在线QR码生成服务，尺寸稍大一些以便打印清晰
      return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`
    },
    getDepartmentName(departmentId) {
      if (!departmentId) return ''
      const department = this.departmentOptions.find(dept => dept.id === departmentId || dept.deptId === departmentId)
      return department ? (department.deptName || department.name) : ''
    },
    loadDepartmentOptions() {
      listdepart({}).then(response => {
        const allDepartments = response.rows || response.data || []
        this.departmentOptions = allDepartments.map(dept => ({
          id: dept.id,
          deptId: dept.id,
          name: dept.name,
          deptName: dept.name
        }))
      }).catch(() => {
        this.departmentOptions = []
      })
    }
  }
}
</script>

<style lang="stylus" media="print">
@page {
  size: 8cm 6cm;
  margin: 2mm;
}

@media print {
  * {
    color: #000 !important;
  }

  .asset-card-print-container {
    width: 100% !important;
  }

  .asset-card-print {
    width: 100% !important;
    height: 100% !important;
    font-size: 10px;
    line-height: 1.4;
    padding: 2mm;
    box-sizing: border-box;
    page-break-after: always;
  }

  .asset-card-print:last-child {
    page-break-after: auto;
  }
}
</style>

<style lang="stylus" scoped>
.asset-card-print-container {
  width: 100%;
}

.asset-card-print {
  width: 8cm;
  height: 6cm;
  padding: 2mm;
  box-sizing: border-box;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 10px;
  line-height: 1.4;
  color: #000;
  display: flex;
  flex-direction: column;
  margin-bottom: 10mm;
}

.asset-card-print.page-break {
  margin-top: 10mm;
}

.asset-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 3mm;
  border-bottom: 1px solid #000;
  padding-bottom: 1mm;
}

.asset-name-label {
  font-weight: bold;
  margin-right: 2mm;
  white-space: nowrap;
}

.asset-name-value {
  flex: 1;
  font-weight: bold;
  font-size: 11px;
}

.card-content {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: flex-start;
}

.card-info {
  flex: 1;
  padding-right: 2mm;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5mm;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-weight: 500;
  min-width: 20mm;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  word-break: break-word;
}

.card-qrcode {
  width: 25mm;
  height: 25mm;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
}

.qrcode-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
