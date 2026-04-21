<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="8" >
        <el-card class="update-log" style="height:42vh;">
          <div slot="header" class="clearfix">
            <span>仓库采购情况</span>
          </div>
          <div class="body">
              <div class="echart" id="ckchart" :style="myChartStyle"></div>
          </div>
        </el-card>

        <el-card class="update-log" style="height:43vh;margin-top: 2vh">
          <div slot="header" class="clearfix">
            <span>科室使用记录情况</span>
          </div>
          <div class="body">
              <div class="echart" id="kschart" :style="myChartStyle"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log" style="height: 87vh;">
          <div slot="header" class="clearfix">
            <span>今日统计</span>
          </div>
          <div class="body">
            <el-row>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">入库单</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">出库单</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">退库单</el-col>
            </el-row>
            <el-row class="tj-number">
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.inCount) }}</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.outCount) }}</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.returnCount) }}</el-col>
            </el-row>
            <el-row>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">申领单</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">申购单</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">库存数量</el-col>
            </el-row>
            <el-row class="tj-number">
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.applyCount) }}</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.purchaseCount) }}</el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8">{{ formatStatQty(todayStats.inventoryQty) }}</el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log" style="height: 30vh;">
          <div slot="header" class="clearfix">
            <span>备忘录</span>
            <a style="margin-left: 80%;font-size: 10px;">更多>></a>
          </div>
        </el-card>
        <el-card class="update-log" style="height:55vh;margin-top: 2vh;">
          <div slot="header" class="clearfix">
            <span>常用附件下载</span>
            <a style="margin-left: 72%;font-size: 10px;">更多>></a>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style>
  a:hover {
    color: blue;
  }
  .tj-number{
    font-size: 2rem;
    color: blue;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
</style>
<script>
  import * as echarts from "echarts";
  import { listRTHWarehouse } from "@/api/warehouse/warehouse";
  import { listOutWarehouse, getOutWarehouse, listCTKWarehouse } from "@/api/warehouse/outWarehouse";
  import { getOptionselect } from "@/api/foundation/warehouse";
  import { listConsumeSummary } from "@/api/department/consumeDetail";
  import { listApply } from "@/api/department/apply";
  import { listPurchase } from "@/api/department/purchase";
  import { getApply } from "@/api/department/apply";
  import { getPurchase } from "@/api/department/purchase";
  import { listInventory } from "@/api/warehouse/inventory";
export default {
  name: "Index",
  data() {
    return {
      // 版本号
      version: "3.8.6",
      CKtitle: [],
      CKxData: [],
      CKyData: [],
      ckQtyMap: {},
      ckChartInstance: null,
      ckResizeHandler: null,
      KStitle:['领用数量', '领用金额','消耗数量','消耗金额'],
      KSxData: [], //横坐标
      KSyData: [], //数据
      ksChartInstance: null,
      ksResizeHandler: null,
      myChartStyle: { float: "left", width: "100%", height: "30vh" }, //图表样式
      todayStats: {
        inCount: 0,
        outCount: 0,
        returnCount: 0,
        applyCount: 0,
        purchaseCount: 0,
        inventoryQty: 0
      }
    };
  },mounted() {
    this.loadWarehousePurchaseChart();
    this.loadDepartmentUsageChart();
    this.loadTodayStats();
  },
  beforeDestroy() {
    if (this.ckResizeHandler) {
      window.removeEventListener("resize", this.ckResizeHandler);
    }
    if (this.ckChartInstance) {
      this.ckChartInstance.dispose();
      this.ckChartInstance = null;
    }
    if (this.ksResizeHandler) {
      window.removeEventListener("resize", this.ksResizeHandler);
    }
    if (this.ksChartInstance) {
      this.ksChartInstance.dispose();
      this.ksChartInstance = null;
    }
  },
  methods: {
    monthDateRange(year, month) {
      const mm = String(month).padStart(2, "0");
      const beginDate = `${year}-${mm}-01 00:00:00`;
      const endDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${mm}-${String(endDay).padStart(2, "0")} 23:59:59`;
      return { beginDate, endDate, label: `${month}月` };
    },
    monthDateRangePureDate(year, month) {
      const mm = String(month).padStart(2, "0");
      const endDay = new Date(year, month, 0).getDate();
      return {
        beginDate: `${year}-${mm}-01`,
        endDate: `${year}-${mm}-${String(endDay).padStart(2, "0")}`,
        label: `${month}月`
      };
    },
    safeNumber(val) {
      const num = Number(val || 0);
      return Number.isFinite(num) ? num : 0;
    },
    async loadWarehousePurchaseChart() {
      try {
        const year = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, idx) => this.monthDateRangePureDate(year, idx + 1));
        this.CKxData = months.map(item => item.label);

        const warehouseResp = await getOptionselect();
        const warehouseRows = (warehouseResp && warehouseResp.data) || [];
        const warehouses = warehouseRows.filter(item => item && item.id && item.name);
        this.CKtitle = warehouses.map(item => item.name);

        const seriesList = [];
        const qtyMap = {};

        for (const wh of warehouses) {
          const monthAmtData = [];
          const monthQtyData = [];
          for (const monthInfo of months) {
            const [rthRes, ctkRes] = await Promise.all([
              listRTHWarehouse({
                pageNum: 1,
                pageSize: 1,
                warehouseId: wh.id,
                beginDate: monthInfo.beginDate,
                endDate: monthInfo.endDate
              }),
              listCTKWarehouse({
                pageNum: 1,
                pageSize: 1,
                warehouseId: wh.id,
                beginDate: monthInfo.beginDate,
                endDate: monthInfo.endDate
              })
            ]);

            const rthTotal = (rthRes && rthRes.totalInfo) || {};
            const ctkTotal = (ctkRes && ctkRes.totalInfo) || {};
            const amount = Math.abs(this.safeNumber(rthTotal.totalAmt)) + Math.abs(this.safeNumber(ctkTotal.totalAmt));
            const qty = Math.abs(this.safeNumber(rthTotal.totalQty)) + Math.abs(this.safeNumber(ctkTotal.totalQty));
            monthAmtData.push(Number(amount.toFixed(2)));
            monthQtyData.push(Number(qty.toFixed(2)));
          }
          seriesList.push({ name: wh.name, type: "line", data: monthAmtData });
          qtyMap[wh.name] = monthQtyData;
        }

        this.CKyData = seriesList;
        this.ckQtyMap = qtyMap;
        this.initCk();
      } catch (e) {
        console.error("加载仓库采购图失败", e);
        this.CKtitle = [];
        this.CKyData = [];
        this.ckQtyMap = {};
        this.initCk();
      }
    },
    async loadDepartmentUsageChart() {
      try {
        const year = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, idx) => this.monthDateRange(year, idx + 1));
        this.KSxData = months.map(item => item.label);
        const receiveQtyData = [];
        const receiveAmtData = [];
        const consumeQtyData = [];
        const consumeAmtData = [];

        for (const monthInfo of months) {
          const [ctkRes, consumeRes] = await Promise.all([
            listCTKWarehouse({
              pageNum: 1,
              pageSize: 1,
              beginDate: monthInfo.beginDate,
              endDate: monthInfo.endDate
            }),
            listConsumeSummary({
              pageNum: 1,
              pageSize: 1,
              beginDate: monthInfo.beginDate,
              endDate: monthInfo.endDate
            })
          ]);

          const ctkTotal = (ctkRes && ctkRes.totalInfo) || {};
          const consumeTotal = (consumeRes && consumeRes.totalInfo) || {};
          receiveQtyData.push(Number(Math.abs(this.safeNumber(ctkTotal.totalQty)).toFixed(2)));
          receiveAmtData.push(Number(Math.abs(this.safeNumber(ctkTotal.totalAmt)).toFixed(2)));
          consumeQtyData.push(Number(this.safeNumber(consumeTotal.totalQty).toFixed(2)));
          consumeAmtData.push(Number(this.safeNumber(consumeTotal.totalAmt).toFixed(2)));
        }

        this.KSyData = [
          { name: '领用数量', type: 'line', data: receiveQtyData },
          { name: '领用金额', type: 'line', data: receiveAmtData },
          { name: '消耗数量', type: 'line', data: consumeQtyData },
          { name: '消耗金额', type: 'line', data: consumeAmtData }
        ];
        this.initKs();
      } catch (e) {
        console.error("加载科室使用记录图失败", e);
        this.KSxData = Array.from({ length: 12 }, (_, idx) => `${idx + 1}月`);
        this.KSyData = [
          { name: '领用数量', type: 'line', data: new Array(12).fill(0) },
          { name: '领用金额', type: 'line', data: new Array(12).fill(0) },
          { name: '消耗数量', type: 'line', data: new Array(12).fill(0) },
          { name: '消耗金额', type: 'line', data: new Array(12).fill(0) }
        ];
        this.initKs();
      }
    },
    formatDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },
    buildTodayRange() {
      const today = this.formatDate(new Date());
      return {
        day: today,
        beginDateTime: `${today} 00:00:00`,
        endDateTime: `${today} 23:59:59`
      };
    },
    async fetchAllRows(listFn, baseQuery) {
      const pageSize = 200;
      let pageNum = 1;
      let total = 0;
      let rows = [];
      do {
        const resp = await listFn({ ...baseQuery, pageNum, pageSize });
        const pageRows = (resp && resp.rows) || [];
        total = Number((resp && resp.total) || 0);
        rows = rows.concat(pageRows);
        pageNum += 1;
        if (pageRows.length === 0) break;
      } while (rows.length < total);
      return rows;
    },
    sumQtyFromEntries(entries) {
      if (!Array.isArray(entries)) return 0;
      return entries.reduce((sum, item) => sum + Number((item && item.qty) || 0), 0);
    },
    formatStatQty(val) {
      const num = Number(val || 0);
      return Number.isFinite(num) ? num.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : "0";
    },
    async fetchDailyQtyByDetails({ listFn, getFn, listQuery, idField, entriesField }) {
      const rows = await this.fetchAllRows(listFn, listQuery);
      if (!rows.length) return 0;
      let totalQty = 0;
      for (const row of rows) {
        const id = row && row[idField];
        if (!id) continue;
        try {
          const detailResp = await getFn(id);
          const detail = detailResp && detailResp.data ? detailResp.data : detailResp;
          totalQty += this.sumQtyFromEntries(detail && detail[entriesField]);
        } catch (e) {
          // 单条失败不影响整体统计
          console.error("加载单据详情失败", id, e);
        }
      }
      return totalQty;
    },
    async loadTodayStats() {
      const { day, beginDateTime, endDateTime } = this.buildTodayRange();
      try {
        const [inDailyRes, outQty, tkDailyRes, applyQty, purchaseQty, inventoryRes] = await Promise.all([
          listRTHWarehouse({
            pageNum: 1,
            pageSize: 1,
            beginDate: beginDateTime,
            endDate: endDateTime,
            billType: 101
          }),
          this.fetchDailyQtyByDetails({
            listFn: listOutWarehouse,
            getFn: getOutWarehouse,
            listQuery: { beginDate: beginDateTime, endDate: endDateTime, billType: 201 },
            idField: "id",
            entriesField: "stkIoBillEntryList"
          }),
          listCTKWarehouse({
            pageNum: 1,
            pageSize: 1,
            beginDate: beginDateTime,
            endDate: endDateTime,
            billType: 401
          }),
          this.fetchDailyQtyByDetails({
            listFn: listApply,
            getFn: getApply,
            listQuery: {
              applyBillDate: day,
              billType: 1,
              applyBillStatus: 2
            },
            idField: "id",
            entriesField: "basApplyEntryList"
          }),
          this.fetchDailyQtyByDetails({
            listFn: listPurchase,
            getFn: getPurchase,
            listQuery: {
              purchaseBillDate: day,
              purchaseBillStatus: 2
            },
            idField: "id",
            entriesField: "depPurchaseApplyEntryList"
          }),
          listInventory({ pageNum: 1, pageSize: 1 })
        ]);

        const inQty = inDailyRes && inDailyRes.totalInfo ? inDailyRes.totalInfo.totalQty : 0;
        const tkQtyRaw = tkDailyRes && tkDailyRes.totalInfo ? tkDailyRes.totalInfo.totalQty : 0;
        const tkQty = Math.abs(Number(tkQtyRaw || 0));
        this.todayStats.inCount = Number(inQty || 0);
        this.todayStats.outCount = Number(outQty || 0);
        this.todayStats.returnCount = tkQty;
        this.todayStats.applyCount = Number(applyQty || 0);
        this.todayStats.purchaseCount = Number(purchaseQty || 0);
        const totalQty = inventoryRes && inventoryRes.totalInfo ? inventoryRes.totalInfo.totalQty : 0;
        this.todayStats.inventoryQty = Number(totalQty || 0);
      } catch (e) {
        console.error("加载今日统计失败", e);
      }
    },
    goTarget(href) {
      window.open(href, "_blank");
    },
    initCk() {
      // 基本柱状图
      const option={
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            if (!params || !params.length) return '';
            const monthLabel = params[0].axisValue || '';
            const lines = [monthLabel];
            params.forEach(p => {
              const name = p.seriesName;
              const amt = this.formatStatQty(p.data);
              const qtyArr = this.ckQtyMap[name] || [];
              const qtyVal = qtyArr[p.dataIndex] != null ? qtyArr[p.dataIndex] : 0;
              const qty = this.formatStatQty(qtyVal);
              lines.push(`${p.marker}${name} 金额: ${amt}，数量: ${qty}`);
            });
            return lines.join('<br/>');
          }
        },
        legend: {
          data:this.CKtitle
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data:this.CKxData
        },
        yAxis: {
          type: 'value'
        },
        series:this.CKyData,
      };
      if (!this.ckChartInstance) {
        this.ckChartInstance = echarts.init(document.getElementById("ckchart"));
      }
      this.ckChartInstance.setOption(option, true);
      //随着屏幕大小调节图表
      if (!this.ckResizeHandler) {
        this.ckResizeHandler = () => {
          if (this.ckChartInstance) {
            this.ckChartInstance.resize();
          }
        };
        window.addEventListener("resize", this.ckResizeHandler);
      }
    },initKs() {
      // 基本柱状图
      const option={
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data:this.KStitle
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLabel: {
            interval: 0
          },
          data:this.KSxData
        },
        yAxis: {
          type: 'value'
        },
        series:this.KSyData,
      };
      if (!this.ksChartInstance) {
        this.ksChartInstance = echarts.init(document.getElementById("kschart"));
      }
      this.ksChartInstance.setOption(option, true);
      //随着屏幕大小调节图表
      if (!this.ksResizeHandler) {
        this.ksResizeHandler = () => {
          if (this.ksChartInstance) {
            this.ksChartInstance.resize();
          }
        };
        window.addEventListener("resize", this.ksResizeHandler);
      }
    }
    }
};
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>

