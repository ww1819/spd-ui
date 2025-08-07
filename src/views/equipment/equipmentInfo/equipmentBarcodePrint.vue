<template>
  <div class="out-order-print" ref="receiptOrderPrintRef" hidden="hidden">
<!--    <div class="title" style="padding-top: 15px">入库单</div>-->
    <div style="font-size: 22px;text-align: center;">设备标签</div>
    <div class="summary">
      <div class="col1" style="width:45%">id: {{ row.equipmentId }}</div>
      <div class="col1" style="width:30%">名称: {{ row.assetName }}</div>
      <div class="col1" style="width:25%">规格: {{ row.specification }}</div>

      <div class="col1" style="width:45%">型号: {{ row.model }}</div>
      <div class="col1" style="width:30%">品牌: {{ row.brand }}</div>
      <div class="col1" style="width:25%">供应商：{{ row.supplier }}</div>
    </div>

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

  .out-order-print {
    width: 100% !important;
    font-size: 14px;
  }

  table, table tr th, table tr td {
    border: 0.05rem solid #000;
    font-size: 12px;
  }

}

.out-order-print
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
