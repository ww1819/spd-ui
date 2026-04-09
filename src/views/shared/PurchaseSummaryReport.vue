<template>
  <div>
    <div v-if="inline" class="report-wrap inline-mode" v-loading="loading">
      <div class="report-title">{{ reportTitle }}</div>
      <div class="query-container">
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
            <SelectWarehouse v-model="searchForm.warehouseId" clearable />
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
          <el-button size="small" @click="handlePrint">打印</el-button>
        </div>
      </div>
      <div class="report-meta">
        <span>填报科室（章）：{{ tenantDisplayName }}</span>
        <span>填报日期：{{ reportDate }}</span>
      </div>
      <div class="table-scroll">
      <el-table :data="rows" border size="small" class="report-table" :height="tableHeight">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="配送单位名称" prop="supplierName" min-width="220" show-overflow-tooltip />
        <el-table-column label="上月结存" prop="lastMonthBalance" width="120" align="right">
          <template slot-scope="scope">{{ formatAmount(scope.row.lastMonthBalance) }}</template>
        </el-table-column>
        <el-table-column label="本月入库" prop="monthInAmount" width="120" align="right">
          <template slot-scope="scope">{{ formatAmount(scope.row.monthInAmount) }}</template>
        </el-table-column>
        <el-table-column label="总计" prop="totalAmount" width="120" align="right">
          <template slot-scope="scope">{{ formatAmount(scope.row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="SPD库存" prop="spdStockAmount" width="120" align="right">
          <template slot-scope="scope">{{ formatAmount(scope.row.spdStockAmount) }}</template>
        </el-table-column>
        <el-table-column label="本月出库" prop="monthOutAmount" width="120" align="right">
          <template slot-scope="scope">{{ formatAmount(scope.row.monthOutAmount) }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" />
      </el-table>
      </div>
      <div class="report-footer">
        <span>SPD：</span>
        <span>器械科室：</span>
        <span>财务签字：</span>
      </div>
    </div>
    <el-dialog
      v-else
      :visible.sync="visibleInner"
      width="1200px"
      title="采购汇总报表"
      append-to-body
      @open="loadReport"
      @close="handleClose"
    >
      <div class="report-wrap" v-loading="loading">
        <div class="report-title">{{ reportTitle }}</div>
        <div class="query-container">
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
              <SelectWarehouse v-model="searchForm.warehouseId" clearable />
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
            <el-button size="small" @click="handlePrint">打印</el-button>
          </div>
        </div>
        <div class="report-meta">
          <span>填报科室（章）：{{ tenantDisplayName }}</span>
          <span>填报日期：{{ reportDate }}</span>
        </div>
        <div class="table-scroll">
        <el-table :data="rows" border size="small" class="report-table" :height="tableHeight">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="配送单位名称" prop="supplierName" min-width="220" show-overflow-tooltip />
          <el-table-column label="上月结存" prop="lastMonthBalance" width="120" align="right">
            <template slot-scope="scope">{{ formatAmount(scope.row.lastMonthBalance) }}</template>
          </el-table-column>
          <el-table-column label="本月入库" prop="monthInAmount" width="120" align="right">
            <template slot-scope="scope">{{ formatAmount(scope.row.monthInAmount) }}</template>
          </el-table-column>
          <el-table-column label="总计" prop="totalAmount" width="120" align="right">
            <template slot-scope="scope">{{ formatAmount(scope.row.totalAmount) }}</template>
          </el-table-column>
          <el-table-column label="SPD库存" prop="spdStockAmount" width="120" align="right">
            <template slot-scope="scope">{{ formatAmount(scope.row.spdStockAmount) }}</template>
          </el-table-column>
          <el-table-column label="本月出库" prop="monthOutAmount" width="120" align="right">
            <template slot-scope="scope">{{ formatAmount(scope.row.monthOutAmount) }}</template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="120" />
        </el-table>
        </div>
        <div class="report-footer">
          <span>SPD：</span>
          <span>器械科室：</span>
          <span>财务签字：</span>
        </div>
      </div>
      <span slot="footer">
        <el-button type="warning" @click="handleExport">导出</el-button>
        <el-button @click="handlePrint">打印</el-button>
        <el-button type="primary" @click="visibleInner = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { listPurchaseSummaryBySupplier } from "@/api/warehouse/outWarehouse";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: "PurchaseSummaryReport",
  components: { SelectWarehouse },
  props: {
    visible: { type: Boolean, default: false },
    queryParams: { type: Object, default: () => ({}) },
    departmentLabel: { type: String, default: "器械科" },
    inline: { type: Boolean, default: false },
  },
  data() {
    return {
      visibleInner: false,
      loading: false,
      rows: [],
      reportDate: "",
      searchForm: {
        beginDate: "",
        endDate: "",
        warehouseId: null,
        supplierKeyword: "",
        excludeZeroNoBiz: false,
      },
    };
  },
  watch: {
    visible: {
      immediate: true,
      handler(v) { this.visibleInner = v; }
    },
    visibleInner(v) {
      this.$emit("update:visible", v);
    },
    queryParams: {
      deep: true,
      handler() {
        if (this.inline) this.loadReport();
      }
    }
  },
  computed: {
    tenantDisplayName() {
      const tenant = this.$store && this.$store.getters ? this.$store.getters.tenant : null;
      return (tenant && (tenant.customerName || tenant.customerCode || tenant.customerId)) || this.departmentLabel || "器械科";
    },
    reportTitle() {
      return `${this.tenantDisplayName}耗材采购汇总表`;
    },
    tableHeight() {
      // 内嵌模式给更多空间给查询区和页脚，避免底部内容被外层固定高度裁切
      return this.inline ? "calc(100vh - 430px)" : "56vh";
    }
  },
  mounted() {
    this.initSearchForm();
    if (this.inline) this.loadReport();
  },
  methods: {
    defaultBeginDateTime() {
      const now = new Date();
      const y = now.getFullYear();
      const m = `${now.getMonth() + 1}`.padStart(2, "0");
      return `${y}-${m}-01 00:00:00`;
    },
    defaultEndDateTime() {
      return `${this.fmtDate(new Date())} 23:59:59`;
    },
    initSearchForm() {
      const q = this.queryParams || {};
      this.searchForm.beginDate = q.beginDate ? String(q.beginDate) : this.defaultBeginDateTime();
      this.searchForm.endDate = q.endDate ? String(q.endDate) : this.defaultEndDateTime();
      this.searchForm.warehouseId = q.warehouseId != null ? q.warehouseId : null;
      this.searchForm.supplierKeyword = q.supplierKeyword ? String(q.supplierKeyword) : "";
      this.searchForm.excludeZeroNoBiz = q.excludeZeroNoBiz === 1 || q.excludeZeroNoBiz === true;
    },
    handleQuery() {
      this.loadReport();
    },
    resetQuery() {
      this.searchForm.beginDate = this.defaultBeginDateTime();
      this.searchForm.endDate = this.defaultEndDateTime();
      this.searchForm.warehouseId = null;
      this.searchForm.supplierKeyword = "";
      this.searchForm.excludeZeroNoBiz = false;
      this.loadReport();
    },
    toNum(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    },
    fmtDate(d) {
      const x = new Date(d);
      if (Number.isNaN(x.getTime())) return "";
      const y = x.getFullYear();
      const m = `${x.getMonth() + 1}`.padStart(2, "0");
      const day = `${x.getDate()}`.padStart(2, "0");
      return `${y}-${m}-${day}`;
    },
    prevDay(dateStr) {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      d.setDate(d.getDate() - 1);
      return this.fmtDate(d);
    },
    normalizeQuery() {
      const q = { ...(this.queryParams || {}) };
      q.beginDate = this.searchForm.beginDate || this.defaultBeginDateTime();
      q.endDate = this.searchForm.endDate || this.defaultEndDateTime();
      q.warehouseId = this.searchForm.warehouseId != null ? this.searchForm.warehouseId : null;
      q.supplerId = null;
      q.supplierKeyword = this.searchForm.supplierKeyword ? String(this.searchForm.supplierKeyword).trim() : null;
      q.excludeZeroNoBiz = this.searchForm.excludeZeroNoBiz ? 1 : 0;
      if (String(q.beginDate).length === 10) q.beginDate = `${q.beginDate} 00:00:00`;
      if (String(q.endDate).length === 10) q.endDate = `${q.endDate} 23:59:59`;
      Object.keys(q).forEach((k) => {
        if (q[k] === "") q[k] = null;
      });
      return q;
    },
    calcInAmt(row) {
      const amt = this.toNum(row.materialAmt);
      const t = this.toNum(row.billType);
      if (t === 301) return -Math.abs(amt);
      if (t === 101) return Math.abs(amt);
      return amt;
    },
    calcOutAmt(row) {
      const amt = this.toNum(row.materialAmt);
      const t = this.toNum(row.billType);
      if (t === 401) return -Math.abs(amt);
      if (t === 201) return Math.abs(amt);
      return amt;
    },
    pickSupplier(row) {
      return (
        row.supplierName ||
        (row.supplier && row.supplier.name) ||
        "未维护供应商"
      );
    },
    async loadReport() {
      this.loading = true;
      try {
        const q = this.normalizeQuery();
        const backendRows = await listPurchaseSummaryBySupplier(q);
        const rows = (Array.isArray(backendRows) ? backendRows : []).map((r) => {
          const lastMonthBalance = this.toNum(r.lastMonthBalance);
          const monthInAmount = this.toNum(r.monthInAmount);
          const monthOutAmount = this.toNum(r.monthOutAmount);
          const spdStockAmount = this.toNum(r.spdStockAmount);
          return {
            supplierName: r.supplierName || "未维护供应商",
            lastMonthBalance,
            monthInAmount,
            totalAmount: lastMonthBalance + monthInAmount,
            spdStockAmount,
            monthOutAmount,
            remark: ""
          };
        });
        rows.sort((a, b) => b.totalAmount - a.totalAmount);

        const sum = rows.reduce(
          (acc, r) => {
            acc.lastMonthBalance += r.lastMonthBalance;
            acc.monthInAmount += r.monthInAmount;
            acc.totalAmount += r.totalAmount;
            acc.spdStockAmount += r.spdStockAmount;
            acc.monthOutAmount += r.monthOutAmount;
            return acc;
          },
          {
            supplierName: "合计",
            lastMonthBalance: 0,
            monthInAmount: 0,
            totalAmount: 0,
            spdStockAmount: 0,
            monthOutAmount: 0,
            remark: ""
          }
        );

        this.rows = [...rows, sum];
        this.reportDate = this.fmtDate(new Date());
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("采购汇总报表生成失败");
        this.rows = [];
      } finally {
        this.loading = false;
      }
    },
    formatAmount(v) {
      return this.toNum(v).toFixed(2);
    },
    handleClose() {
      this.$emit("close");
    },
    handlePrint() {
      window.print();
    },
    async handleExport() {
      try {
        if (!this.rows || this.rows.length === 0) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("采购汇总", { views: [{ showGridLines: true }] });

        ws.columns = [
          { width: 8 },  // 序号
          { width: 34 }, // 配送单位名称
          { width: 14 }, // 上月结存
          { width: 14 }, // 本月入库
          { width: 14 }, // 总计
          { width: 14 }, // SPD库存
          { width: 14 }, // 本月出库
          { width: 16 }, // 备注
        ];

        ws.mergeCells("A1:H1");
        ws.getCell("A1").value = this.reportTitle;
        ws.getCell("A1").font = { bold: true, size: 20, name: "Microsoft YaHei" };
        ws.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
        ws.getRow(1).height = 34;

        ws.mergeCells("A2:D2");
        ws.mergeCells("E2:H2");
        ws.getCell("A2").value = `填报科室（章）：${this.tenantDisplayName}`;
        ws.getCell("E2").value = `填报日期：${this.reportDate || this.fmtDate(new Date())}`;
        ws.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };
        ws.getCell("E2").alignment = { vertical: "middle", horizontal: "right" };

        const header = ["序号", "配送单位名称", "上月结存", "本月入库", "总计", "SPD库存", "本月出库", "备注"];
        ws.addRow([]);
        ws.addRow(header);
        const headerRow = ws.getRow(4);
        headerRow.font = { bold: true, name: "Microsoft YaHei" };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 24;

        this.rows.forEach((r, idx) => {
          ws.addRow([
            r.supplierName === "合计" ? "合计" : idx + 1,
            r.supplierName || "",
            this.toNum(r.lastMonthBalance),
            this.toNum(r.monthInAmount),
            this.toNum(r.totalAmount),
            this.toNum(r.spdStockAmount),
            this.toNum(r.monthOutAmount),
            r.remark || "",
          ]);
        });

        const start = 5;
        const end = 4 + this.rows.length;
        for (let i = start; i <= end; i += 1) {
          const row = ws.getRow(i);
          row.height = 22;
          row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
          row.getCell(2).alignment = { vertical: "middle", horizontal: "left" };
          for (let c = 3; c <= 7; c += 1) {
            row.getCell(c).numFmt = "#,##0.00";
            row.getCell(c).alignment = { vertical: "middle", horizontal: "right" };
          }
          row.getCell(8).alignment = { vertical: "middle", horizontal: "left" };
        }

        const border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
        ws.eachRow((row, rowNo) => {
          if (rowNo >= 4 && rowNo <= end) {
            row.eachCell((cell) => { cell.border = border; });
          }
        });

        const buf = await wb.xlsx.writeBuffer();
        const blob = new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const d = this.fmtDate(new Date()).replace(/-/g, "");
        saveAs(blob, `采购汇总报表_${d}.xlsx`);
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      }
    }
  }
};
</script>

<style scoped>
.report-wrap { padding: 8px 12px; }
.report-wrap.inline-mode {
  height: calc(100vh - 170px);
  display: flex;
  flex-direction: column;
  overflow: auto;
}
.report-title { text-align: center; font-size: 30px; font-weight: 700; margin-bottom: 10px; }
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
.report-meta { display: flex; justify-content: space-between; margin: 8px 4px 12px; font-size: 16px; }
.report-footer { display: flex; justify-content: space-between; margin-top: 10px; padding: 0 4px; font-size: 16px; flex-shrink: 0; }
.table-scroll { width: 100%; overflow-x: auto; overflow-y: auto; flex: 1; min-height: 280px; }
.report-table { width: 100%; min-width: 1150px; }
.table-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.table-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
.table-scroll::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 8px; }
.table-scroll::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
</style>
