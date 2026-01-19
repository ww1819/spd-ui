<template>
  <div class="gz-order-print" :class="{'orientation-portrait': orientation === 'portrait', 'orientation-landscape': orientation === 'landscape'}" :data-orientation="orientation" ref="receiptOrderPrintRef" hidden="hidden">
    <div style="font-size: 22px;text-align: center;">
      <span v-if="hospitalName">{{ hospitalName }}</span><span v-if="printType === 'refund'">备货退货单</span><span v-else>高值入库单</span>
    </div>
    <div class="summary">
      <div class="col1" style="width:45%">单号: {{ row.orderNo }}</div>
      <div class="col1" style="width:30%">仓库: {{ row.warehouseName }}</div>
      <div class="col1" style="width:25%">供应商: {{ row.supplierName }}</div>

      <div class="col1" style="width:45%">申请时间: {{ row.orderDate }}</div>
      <div class="col1" style="width:30%">审核时间: {{ row.auditDate }}</div>
      <div class="col1" style="width:25%">单位: 元</div>
    </div>
    <table class="common-table">
      <tr>
        <th>耗材编码</th>
        <th>耗材名称</th>
        <th>规格</th>
<!--        <th>单位</th>-->
        <th>单价</th>
        <th>数量</th>
        <th>金额</th>
        <th>批号</th>
        <th>有效期</th>
        <th>厂家</th>
        <th>耗材分类</th>
      </tr>
      <tr v-for="(item, index) in (row.detailList || [])" :key="index">
        <td>{{ item.materialCode || '' }}</td>
        <td>{{ item.materialName || '' }}</td>
        <td>{{ item.materialSpeci || '' }}</td>
<!--        <td>{{ item.planQuantity }}</td>-->
        <td>{{ formatAmount(item.price) }}</td>
        <td>{{ item.qty || '' }}</td>
        <td>{{ formatAmount(item.amt) }}</td>
        <td>{{ item.batchNumber || '' }}</td>
        <td>{{ item.periodDate || '' }}</td>
        <td>{{ item.factoryName || '' }}</td>
        <td>{{ item.warehouseCategoryName || '' }}</td>
      </tr>
      <tr v-if="!row.detailList || row.detailList.length === 0">
        <td colspan="11" style="text-align: center; padding: 20px;">暂无数据</td>
      </tr>
      <tr>
        <td>本页小计：</td>
        <td colspan="3"></td>
        <td >{{ row.totalQty }}</td>
        <td >{{ formatAmount(row.totalAmt) }}</td>
        <td colspan="4"></td>
      </tr>
      <tr>
        <td colspan="4" style="text-align: left;">合计金额：（大写）：{{ row.totalAmtConverter }}</td>
        <td colspan="2">（小写）：</td>
        <td colspan="4">{{ formatAmount(row.totalAmt) }}</td>
      </tr>
    </table>
    <div class="foot" style="padding-top: 15px">
      <div class="content">
        <div class="col2" style="width:45%">制单人: </div>
        <div class="col2" style="width:30%">复核人: </div>
        <div class="col2" style="width:25%">验收人: </div>
      </div>
    </div>
  </div>

</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'

export default {
  mixins: [hospitalNameMixin],
  props: {
    printType: {
      type: String,
      default: ''
    },
    row: {
      type: Object,
      required: true
    },
    orientation: {
      type: String,
      default: 'landscape' // 默认横向
    }
  },
  computed: {
    pageSize() {
      return this.orientation === 'landscape' ? 'A4 landscape' : 'A4'
    },
    pageSizeStyle() {
      return this.orientation === 'landscape' ? 'A4 landscape' : 'A4'
    }
  },
  mounted() {
    // 组件挂载后，强制刷新样式以确保正确显示
    this.$nextTick(() => {
      if (this.$refs.receiptOrderPrintRef) {
        // 触发重排以确保样式正确应用
        this.$refs.receiptOrderPrintRef.offsetHeight;
        // 验证数据
        if (this.row && this.row.detailList) {
          console.log('打印组件已挂载，明细数量:', this.row.detailList.length);
        } else {
          console.warn('打印组件挂载时数据不完整:', this.row);
        }
      }
    });
  },
  watch: {
    // 监听 orientation 变化，强制重新渲染
    orientation() {
      this.$nextTick(() => {
        if (this.$refs.receiptOrderPrintRef) {
          this.$refs.receiptOrderPrintRef.offsetHeight;
        }
      });
    },
    // 监听 row 变化，确保数据更新后重新渲染
    row: {
      handler() {
        this.$nextTick(() => {
          if (this.$refs.receiptOrderPrintRef) {
            this.$refs.receiptOrderPrintRef.offsetHeight;
          }
        });
      },
      deep: true
    }
  },
  methods: {
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 使用双重nextTick确保DOM完全更新
        this.$nextTick(() => {
          this.$nextTick(() => {
            // 强制刷新样式
            if (this.$refs.receiptOrderPrintRef) {
              this.$refs.receiptOrderPrintRef.offsetHeight;
            }
            this.$print(this.$refs.receiptOrderPrintRef, {}, this.pageSize)
          })
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          this.$nextTick(() => {
            // 强制刷新样式
            if (this.$refs.receiptOrderPrintRef) {
              this.$refs.receiptOrderPrintRef.offsetHeight;
            }
            this.$print(this.$refs.receiptOrderPrintRef, {}, this.pageSize)
          })
        })
      })
    },
    formatAmount(value) {
      if (value === null || value === undefined || value === '') {
        return ''
      }
      const num = parseFloat(value)
      if (isNaN(num)) {
        return ''
      }
      return num.toFixed(2)
    }
  }
}
</script>


<style lang="stylus" media="print">
/* 默认横向 */
@page {
  size: A4 landscape;
  margin: 0;
}

/* 纵向布局 */
@media print {
  .gz-order-print.orientation-portrait {
    @page {
      size: A4;
      margin: 0;
    }
  }
  
  .gz-order-print.orientation-landscape {
    @page {
      size: A4 landscape;
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

  .gz-order-print {
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

.gz-order-print
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
