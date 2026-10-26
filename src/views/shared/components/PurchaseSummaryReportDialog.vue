<template>
    <el-dialog
      :visible.sync="visibleInner"
      width="780px"
      title="采购汇总报表"
      custom-class="purchase-summary-report-dialog"
      append-to-body
      @open="loadReport"
      @close="handleClose"
    >
      <div class="report-wrap" v-loading="loading">
        <div class="query-container no-print">
          <el-form :model="searchForm" :inline="true" size="small" class="query-form">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="searchForm.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="开始时间"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="searchForm.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="结束时间"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="仓库">
              <SelectWarehouse v-model="searchForm.warehouseIds" :multiple="true" clearable style="width: 240px" />
            </el-form-item>
            <el-form-item label="供应商">
              <el-input
                v-model="searchForm.supplierKeyword"
                clearable
                placeholder="名称/编码/简码"
                style="width: 220px"
              />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="searchForm.excludeZeroNoBiz">过滤上期=0且无入出库</el-checkbox>
            </el-form-item>
          </el-form>
          <div class="query-actions">
            <el-button size="small" type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
            <el-button size="small" icon="el-icon-refresh" @click="resetQuery">重置</el-button>
            <el-button size="small" type="warning" icon="el-icon-download" @click="handleExport">导出</el-button>
          </div>
        </div>
        <div class="purchase-summary-print-surface">
          <div class="report-print-title">{{ reportTitle }}</div>
          <div class="report-print-meta">
            <div class="report-print-meta-line report-print-meta-time">统计时间：{{ statTimeRangeDisplay }}</div>
          </div>
          <div class="report-print-gap" aria-hidden="true" />
          <div class="table-scroll">
            <el-table :data="rows" border size="small" class="report-table" :height="tableHeight">
              <el-table-column label="序号" width="7%" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.supplierName === '合计'">合计</span>
                  <span v-else>{{ scope.$index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column
                label="配送单位名称"
                prop="supplierName"
                width="31%"
                align="left"
                header-align="center"
                class-name="purchase-summary-supplier-col"
              />
              <el-table-column label="上月结存" prop="lastMonthBalance" width="10%" align="right">
                <template slot-scope="scope">{{ formatAmount(scope.row.lastMonthBalance) }}</template>
              </el-table-column>
              <el-table-column label="本月入库" prop="monthInAmount" width="10%" align="right">
                <template slot-scope="scope">{{ formatAmount(scope.row.monthInAmount) }}</template>
              </el-table-column>
              <el-table-column label="总计" prop="totalAmount" width="10%" align="right">
                <template slot-scope="scope">{{ formatAmount(scope.row.totalAmount) }}</template>
              </el-table-column>
              <el-table-column label="SPD库存" prop="spdStockAmount" width="10%" align="right">
                <template slot-scope="scope">{{ formatAmount(scope.row.spdStockAmount) }}</template>
              </el-table-column>
              <el-table-column label="本月出库" prop="monthOutAmount" width="10%" align="right">
                <template slot-scope="scope">{{ formatAmount(scope.row.monthOutAmount) }}</template>
              </el-table-column>
              <el-table-column label="备注" prop="remark" width="12%" align="left" header-align="center" class-name="purchase-summary-remark-col" />
            </el-table>
          </div>
          <div class="report-footer report-print-footer">
            <span>SPD：</span>
            <span>器械科室：</span>
            <span>财务签字：</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="no-print">
        <el-button type="warning" @click="handleExport">导出</el-button>
        <el-button type="primary" @click="visibleInner = false">关闭</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: 'PurchaseSummaryReportDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PurchaseSummaryReport')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>

<style scoped>
.report-wrap { padding: 8px 12px; }
.report-wrap.inline-mode {
  height: calc(100vh - 170px);
  display: flex;
  flex-direction: column;
  overflow: auto;
}
/* 整块报表居中、宽度不超过 A4 横向正文，避免左右溢出 */
.purchase-summary-print-surface {
  max-width: 270mm;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}
/* 屏上与导出 Excel 层次一致：大标题、填报行、间隔、表头列名（表格内） */
.report-print-title { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 8px; font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif; }
.report-print-meta {
  display: block;
  margin: 6px 4px 10px;
  font-size: 15px;
  font-family: "Microsoft YaHei", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.report-print-meta-line {
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: break-word;
}
.report-print-meta-time {
  text-align: right;
}
.report-print-gap { height: 8px; }
.query-container {
  display: block !important;
  visibility: visible !important;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
}
.query-form { margin-bottom: 6px; }
.query-actions { display: flex !important; gap: 8px; align-items: center; }
.report-footer { display: flex; justify-content: space-between; margin-top: 10px; padding: 0 4px; font-size: 16px; flex-shrink: 0; }
.table-scroll {
  width: 100%;
  margin: 0;
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
  min-height: 280px;
  box-sizing: border-box;
}
.report-table { width: 100% !important; min-width: 0; table-layout: fixed; }
.report-table >>> .el-table__body-wrapper .el-table__body,
.report-table >>> .el-table__header-wrapper .el-table__header {
  width: 100% !important;
}
/* 覆盖 el-table 默认 nowrap/ellipsis，配送单位名称：左上、换行、不截断 */
.report-table >>> td.purchase-summary-supplier-col {
  vertical-align: top !important;
}
.report-table >>> td.purchase-summary-supplier-col .cell {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  text-align: left !important;
  vertical-align: top !important;
  white-space: normal !important;
  word-break: break-word;
  overflow-wrap: break-word;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 1.45;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.report-table >>> td.purchase-summary-remark-col {
  vertical-align: top !important;
}
.report-table >>> td.purchase-summary-remark-col .cell {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  text-align: left !important;
  white-space: normal !important;
  word-break: break-word;
  overflow-wrap: break-word;
  overflow: visible !important;
  text-overflow: clip !important;
  line-height: 1.45;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.table-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.table-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
.table-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 8px; }
.table-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
</style>

<style>
/* 打印：仅保留报表主体（与导出 xlsx 同一套标题/填报信息/列名），并美化表格边框 */
@media print {
  @page { size: A4 landscape; margin: 10mm; }

  html,
  body {
    height: auto !important;
    max-width: 100%;
    overflow-x: hidden !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body * {
    visibility: hidden;
  }

  .purchase-summary-print-surface,
  .purchase-summary-print-surface * {
    visibility: visible;
  }

  /* 横向 A4 版心居中、限宽，避免表格撑出纸张 */
  .purchase-summary-print-surface {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 277mm;
    box-sizing: border-box;
    padding: 0;
    font-family: "Microsoft YaHei", SimSun, "Songti SC", serif;
  }

  .v-modal {
    display: none !important;
  }

  .el-dialog__wrapper {
    position: static !important;
    height: auto !important;
    overflow: visible !important;
  }

  .purchase-summary-report-dialog {
    position: static !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .purchase-summary-report-dialog .el-dialog__header {
    display: none !important;
  }

  .purchase-summary-report-dialog .el-dialog__body {
    padding: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .purchase-summary-report-dialog .el-dialog__footer,
  .no-print {
    display: none !important;
  }

  .el-loading-mask {
    display: none !important;
  }

  /* 与 export（ExcelJS）一致：第 1 行大标题；第 2 行统计时间；第 3 行空行；自第 4 行起才有边框 */
  .purchase-summary-print-surface .report-print-title {
    display: block;
    text-align: center;
    font-family: "Microsoft YaHei", SimHei, sans-serif;
    font-size: 20pt;
    font-weight: bold;
    line-height: 1.25;
    margin: 0 0 2px;
    padding: 4px 8px;
    min-height: 34pt;
    box-sizing: border-box;
    border: none;
  }

  .purchase-summary-print-surface .report-print-meta {
    display: block;
    font-family: "Microsoft YaHei", SimSun, "Songti SC", serif;
    font-size: 11pt;
    font-weight: normal;
    margin: 0 0 0;
    padding: 2px 4px 6px;
    box-sizing: border-box;
    border: none;
  }

  .purchase-summary-print-surface .report-print-meta-line {
    line-height: 1.45;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .purchase-summary-print-surface .report-print-meta-time {
    text-align: right;
  }

  .purchase-summary-print-surface .report-print-gap {
    height: 10px;
    min-height: 10px;
  }

  .purchase-summary-print-surface .table-scroll {
    max-width: 100% !important;
    width: 100% !important;
    overflow: visible !important;
    margin: 0 !important;
  }

  .purchase-summary-print-surface .report-table.el-table {
    width: 100% !important;
    min-width: 0 !important;
    table-layout: fixed !important;
    font-family: "Microsoft YaHei", SimSun, "Songti SC", serif;
    font-size: 11pt;
  }

  .purchase-summary-print-surface .report-table .el-table__header-wrapper,
  .purchase-summary-print-surface .report-table .el-table__body-wrapper {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .purchase-summary-print-surface .report-table .el-table__body,
  .purchase-summary-print-surface .report-table .el-table__header {
    width: 100% !important;
  }

  .purchase-summary-print-surface .report-table th > .cell {
    font-family: "Microsoft YaHei", SimSun, "Songti SC", serif;
    font-weight: bold !important;
    text-align: center !important;
    color: #000 !important;
    vertical-align: middle !important;
  }

  /* 导出 xlsx 表头未设填充色，为白底 */
  .purchase-summary-print-surface .report-table th {
    background: #fff !important;
    background-color: #fff !important;
    border: 1px solid #000 !important;
    color: #000 !important;
  }

  .purchase-summary-print-surface .report-table th .cell {
    line-height: 1.35;
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  .purchase-summary-print-surface .report-table td {
    border: 1px solid #000 !important;
    border-color: #000 !important;
    color: #000 !important;
    vertical-align: top !important;
  }

  .purchase-summary-print-surface .report-table .el-table__border-line {
    display: none;
  }

  /* 导出文件中无签字栏，打印与 Excel 一致不印页脚 */
  .purchase-summary-print-surface .report-print-footer {
    display: none !important;
  }

  /* 列对齐与导出单元格 alignment 一致：序号中、配送单位左、本月出库右、备注左 */
  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(1) .cell {
    text-align: center !important;
  }

  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(3) .cell,
  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(4) .cell,
  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(5) .cell,
  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(6) .cell,
  .purchase-summary-print-surface .report-table .el-table__body td:nth-child(7) .cell {
    text-align: right !important;
  }

  .purchase-summary-print-surface .report-table .el-table__header th:nth-child(3) .cell,
  .purchase-summary-print-surface .report-table .el-table__header th:nth-child(4) .cell,
  .purchase-summary-print-surface .report-table .el-table__header th:nth-child(5) .cell,
  .purchase-summary-print-surface .report-table .el-table__header th:nth-child(6) .cell,
  .purchase-summary-print-surface .report-table .el-table__header th:nth-child(7) .cell {
    text-align: center !important;
  }

  .purchase-summary-print-surface .report-table .el-table__body td.purchase-summary-supplier-col,
  .purchase-summary-print-surface .report-table .el-table__body td.purchase-summary-remark-col {
    vertical-align: top !important;
  }

  .purchase-summary-print-surface td.purchase-summary-supplier-col .cell {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box;
    text-align: left !important;
    white-space: normal !important;
    word-break: break-word;
    overflow-wrap: break-word;
    overflow: visible !important;
    text-overflow: clip !important;
    line-height: 1.45;
  }

  .purchase-summary-print-surface td.purchase-summary-remark-col .cell {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box;
    text-align: left !important;
    white-space: normal !important;
    word-break: break-word;
    overflow-wrap: break-word;
    overflow: visible !important;
    text-overflow: clip !important;
    line-height: 1.45;
  }

}
</style>
