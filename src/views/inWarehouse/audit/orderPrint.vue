<template>
  <div class="order-print" ref="receiptOrderPrintRef" hidden="hidden">
<!--    <div class="title" style="padding-top: 15px">入库单</div>-->
    <div style="font-size: 22px;text-align: center;">入库单</div>
    <div class="summary">
      <div class="col1" style="width:45%">单号: {{ row.billNo }}</div>
      <div class="col1" style="width:30%">仓库: {{ row.warehouseName }}</div>
      <div class="col1" style="width:25%">供应商: {{ row.supplierName }}</div>

      <div class="col1" style="width:45%">申请时间: {{ row.billDate }}</div>
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
      <tr v-for="item in row.detailList">
        <td>{{ item.materialCode || '' }}</td>
        <td>{{ item.materialName || '' }}</td>
        <td>{{ item.materialSpeci || '' }}</td>
<!--        <td>{{ item.planQuantity }}</td>-->
        <td>{{ item.price || '' }}</td>
        <td>{{ item.qty || '' }}</td>
        <td>{{ item.amt || '' }}</td>
        <td>{{ item.batchNumber || '' }}</td>
        <td>{{ item.periodDate || '' }}</td>
        <td>{{ item.factoryName || '' }}</td>
        <td>{{ item.warehouseCategoryName || '' }}</td>
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

export default {
  props: ['row'],
  methods: {
    start() {
      this.$print(this.$refs.receiptOrderPrintRef, {}, 'A4')
    },
  }
}
</script>


<style lang="stylus" media="print">
@page {
  size: auto;
  margin: 0;
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

  .content
    display flex
    flex-wrap wrap

    //.col2
    //  width 33%
</style>
