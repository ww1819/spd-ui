<template>
  <div 
    class="order-print" 
    ref="receiptOrderPrintRef" 
    hidden="hidden"
    :class="{'orientation-portrait': printSetting.orientation === 'portrait', 'orientation-landscape': printSetting.orientation === 'landscape'}"
    :style="printStyle"
  >
    <div :style="{ fontSize: (printSetting.fontSize || 22) + 'px', textAlign: 'center' }">
      <span v-if="hospitalName">{{ hospitalName }}</span>入库单
    </div>
    <div class="summary">
      <div class="col1" style="width:45%">单号: {{ row.billNo }}</div>
      <div class="col1" style="width:30%">仓库: {{ row.warehouseName }}</div>
      <div class="col1" style="width:25%">供应商: {{ row.supplierName }}</div>

      <div class="col1" style="width:45%">申请时间: {{ row.billDate }}</div>
      <div class="col1" style="width:30%">审核时间: {{ row.auditDate }}</div>
      <div class="col1" style="width:25%">单位: 元</div>
    </div>
    <table class="common-table" :style="tableStyle">
      <tr>
        <th v-if="isColumnVisible('materialCode')" :style="getColumnStyle('materialCode')">耗材编码</th>
        <th v-if="isColumnVisible('materialName')" :style="getColumnStyle('materialName')">耗材名称</th>
        <th v-if="isColumnVisible('materialSpeci')" :style="getColumnStyle('materialSpeci')">规格</th>
        <th v-if="isColumnVisible('price')" :style="getColumnStyle('price')">单价</th>
        <th v-if="isColumnVisible('qty')" :style="getColumnStyle('qty')">数量</th>
        <th v-if="isColumnVisible('amt')" :style="getColumnStyle('amt')">金额</th>
        <th v-if="isColumnVisible('batchNumber')" :style="getColumnStyle('batchNumber')">批号</th>
        <th v-if="isColumnVisible('periodDate')" :style="getColumnStyle('periodDate')">有效期</th>
        <th v-if="isColumnVisible('factoryName')" :style="getColumnStyle('factoryName')">厂家</th>
        <th v-if="isColumnVisible('warehouseCategoryName')" :style="getColumnStyle('warehouseCategoryName')">耗材分类</th>
      </tr>
      <tr v-for="item in row.detailList">
        <td v-if="isColumnVisible('materialCode')" :style="getColumnStyle('materialCode')">{{ item.materialCode || '' }}</td>
        <td v-if="isColumnVisible('materialName')" :style="getColumnStyle('materialName')">{{ item.materialName || '' }}</td>
        <td v-if="isColumnVisible('materialSpeci')" :style="getColumnStyle('materialSpeci')">{{ item.materialSpeci || '' }}</td>
        <td v-if="isColumnVisible('price')" :style="getColumnStyle('price')">{{ item.price || '' }}</td>
        <td v-if="isColumnVisible('qty')" :style="getColumnStyle('qty')">{{ item.qty || '' }}</td>
        <td v-if="isColumnVisible('amt')" :style="getColumnStyle('amt')">{{ item.amt || '' }}</td>
        <td v-if="isColumnVisible('batchNumber')" :style="getColumnStyle('batchNumber')">{{ item.batchNumber || '' }}</td>
        <td v-if="isColumnVisible('periodDate')" :style="getColumnStyle('periodDate')">{{ item.periodDate || '' }}</td>
        <td v-if="isColumnVisible('factoryName')" :style="getColumnStyle('factoryName')">{{ item.factoryName || '' }}</td>
        <td v-if="isColumnVisible('warehouseCategoryName')" :style="getColumnStyle('warehouseCategoryName')">{{ item.warehouseCategoryName || '' }}</td>
      </tr>
      <tr>
        <td>本页小计：</td>
        <td colspan="3"></td>
        <td >{{ row.totalQty }}</td>
        <td >{{ row.totalAmt }}</td>
        <td colspan="4"></td>
      </tr>
      <tr>
        <td colspan="4" style="text-align: left;">合计金额：（大写）：{{ row.totalAmtConverter }}</td>
        <td colspan="2">（小写）：</td>
        <td colspan="4">{{ row.totalAmt }}</td>
      </tr>
    </table>
    <div class="foot" style="padding-top: 15px" v-if="hasFooterFields">
      <div class="content">
        <div class="col2" style="width:45%" v-if="printSetting.showPurchaser">
          {{ printSetting.purchaserLabel || '采购人' }}: 
        </div>
        <div class="col2" style="width:30%" v-if="printSetting.showCreator">
          {{ printSetting.creatorLabel || '制单人' }}: 
        </div>
        <div class="col2" style="width:25%" v-if="printSetting.showAuditor">
          {{ printSetting.auditorLabel || '复核人' }}: 
        </div>
        <div class="col2" style="width:25%" v-if="printSetting.showReceiver">
          {{ printSetting.receiverLabel || '验收人' }}: 
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'
import { getDefaultTemplate } from '@/api/system/printSetting'

export default {
  mixins: [hospitalNameMixin],
  props: ['row', 'billType'],
  data() {
    return {
      printSetting: {
        orientation: 'portrait',
        fontSize: 22,
        tableFontSize: 12,
        pageWidth: 210,
        pageHeight: 297,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        columnSpacing: 0,
        showPurchaser: 0,
        showCreator: 1,
        showAuditor: 1,
        showReceiver: 0,
        purchaserLabel: '采购人',
        creatorLabel: '制单人',
        auditorLabel: '复核人',
        receiverLabel: '验收人',
        columnConfig: null
      },
      columnConfig: []
    }
  },
  computed: {
    printStyle() {
      const margin = `${this.printSetting.marginTop || 0}mm ${this.printSetting.marginRight || 0}mm ${this.printSetting.marginBottom || 0}mm ${this.printSetting.marginLeft || 0}mm`
      return {
        padding: margin,
        fontSize: (this.printSetting.fontSize || 14) + 'px'
      }
    },
    tableStyle() {
      return {
        fontSize: (this.printSetting.tableFontSize || 12) + 'px',
        borderSpacing: (this.printSetting.columnSpacing || 0) + 'mm'
      }
    },
    hasFooterFields() {
      return this.printSetting.showPurchaser || this.printSetting.showCreator || 
             this.printSetting.showAuditor || this.printSetting.showReceiver
    }
  },
  created() {
    this.loadPrintSetting()
  },
  methods: {
    loadPrintSetting() {
      const billType = this.billType || this.row.billType || 101
      getDefaultTemplate(billType).then(response => {
        if (response.data) {
          this.printSetting = response.data
          if (this.printSetting.columnConfig) {
            try {
              const config = JSON.parse(this.printSetting.columnConfig)
              this.columnConfig = config.columns || []
            } catch (e) {
              this.columnConfig = []
            }
          }
        }
      }).catch(() => {
        // 加载失败使用默认设置
      })
    },
    isColumnVisible(field) {
      if (!this.columnConfig || this.columnConfig.length === 0) {
        return true // 默认显示所有列
      }
      const column = this.columnConfig.find(col => col.field === field)
      return column ? column.visible !== false : true
    },
    getColumnStyle(field) {
      if (!this.columnConfig || this.columnConfig.length === 0) {
        return {}
      }
      const column = this.columnConfig.find(col => col.field === field)
      if (column && column.width) {
        return { width: column.width + 'px' }
      }
      return {}
    },
    start() {
      // 确保医院名称和打印设置已加载完成后再打印
      Promise.all([
        this.ensureHospitalNameLoaded(),
        this.loadPrintSetting()
      ]).then(() => {
        // 等待Vue更新DOM
        this.$nextTick(() => {
          const pageSize = this.printSetting.orientation === 'landscape' ? 'A4 landscape' : 'A4'
          this.$print(this.$refs.receiptOrderPrintRef, {}, pageSize)
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          const pageSize = this.printSetting.orientation === 'landscape' ? 'A4 landscape' : 'A4'
          this.$print(this.$refs.receiptOrderPrintRef, {}, pageSize)
        })
      })
    }
  }
}
</script>


<style lang="stylus" media="print">
/* 默认纵向 */
@page {
  size: A4;
  margin: 0;
}

/* 横向布局 */
@media print {
  .order-print.orientation-landscape {
    @page {
      size: A4 landscape;
      margin: 0;
    }
  }
  
  .order-print.orientation-portrait {
    @page {
      size: A4;
      margin: 0;
    }
  }
}

@media print {
  * {
    color: #000 !important;
  }

  table {
    width 100%
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
    text-align: center;
  }

  table, tbody, thead {
    width: 100% !important;
  }

  .order-print {
    width: 100% !important;
    font-size: 14px;
  }

  table, table tr th, table tr td {
    border: 0.05rem solid #000;
    font-size: 12px;
    overflow: hidden;
    word-wrap: break-word;
    word-break: break-all;
  }

}

.order-print
  padding 12px
  line-height 1.6

  .summary
    display flex
    flex-wrap wrap

    //.col1
    //  width 33%

  .title
    font-size 22px
    text-align center

  .common-table
    td, th
      border-color black
      overflow: hidden !important
      word-wrap: break-word
      word-break: break-all

  .content
    display flex
    flex-wrap wrap

    //.col2
    //  width 33%
</style>
