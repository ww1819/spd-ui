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
  import { listCTKWarehouse } from "@/api/warehouse/outWarehouse";
  import { getOptionselect } from "@/api/foundation/warehouse";
  import { getAuditedConsumeReportTotal } from "@/api/department/batchConsume";
  import { sumApplyEntryQty } from "@/api/department/apply";
  import { sumPurchaseEntryQty } from "@/api/department/purchase";
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
    const { day } = this.buildTodayRange();
    this.restoreTodayStatsFromCache(day);
    const year = new Date().getFullYear();
    if (!this.restoreKsFromCache(year)) {
      this.primeKsShell(year);
    }
    this.restoreCkFromCache(year);
    this.$nextTick(() => {
      this.initKs();
      if (this.CKyData && this.CKyData.length) {
        this.initCk();
      }
    });
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
    chartCacheKeyCk(year) {
      return `spd_index_ck_${year}`;
    },
    chartCacheKeyKs(year) {
      // v3：科室图领用/消耗分请求容错，与旧缓存区分
      return `spd_index_ks_v3_${year}`;
    },
    todayStatsCacheKey(day) {
      return `spd_index_today_v4_${day}`;
    },
    restoreTodayStatsFromCache(day) {
      try {
        const raw = sessionStorage.getItem(this.todayStatsCacheKey(day));
        if (!raw) return false;
        const o = JSON.parse(raw);
        if (!o || typeof o !== "object") return false;
        ["inCount", "outCount", "returnCount", "applyCount", "purchaseCount", "inventoryQty"].forEach(k => {
          if (o[k] != null && Number.isFinite(Number(o[k]))) {
            this.todayStats[k] = Number(o[k]);
          }
        });
        return true;
      } catch (e) {
        return false;
      }
    },
    restoreKsFromCache(year) {
      try {
        const raw = sessionStorage.getItem(this.chartCacheKeyKs(year));
        if (!raw) return false;
        const o = JSON.parse(raw);
        if (!o || !Array.isArray(o.KSyData) || !Array.isArray(o.KSxData)) return false;
        this.KSxData = o.KSxData;
        this.KSyData = o.KSyData;
        return true;
      } catch (e) {
        return false;
      }
    },
    restoreCkFromCache(year) {
      try {
        const raw = sessionStorage.getItem(this.chartCacheKeyCk(year));
        if (!raw) return false;
        const o = JSON.parse(raw);
        if (!o || !Array.isArray(o.CKyData) || !Array.isArray(o.CKtitle) || !o.CKyData.length) return false;
        this.CKxData = o.CKxData || [];
        this.CKtitle = o.CKtitle;
        this.CKyData = o.CKyData;
        this.ckQtyMap = o.ckQtyMap && typeof o.ckQtyMap === "object" ? o.ckQtyMap : {};
        return true;
      } catch (e) {
        return false;
      }
    },
    primeKsShell(year) {
      const months = Array.from({ length: 12 }, (_, idx) => this.monthDateRange(year, idx + 1));
      this.KSxData = months.map(item => item.label);
      const z = new Array(12).fill(0);
      this.KSyData = [
        { name: "领用数量", type: "line", data: [...z] },
        { name: "领用金额", type: "line", data: [...z] },
        { name: "消耗数量", type: "line", data: [...z] },
        { name: "消耗金额", type: "line", data: [...z] }
      ];
    },
    async pooledMap(array, concurrency, mapper) {
      const results = new Array(array.length);
      let cursor = 0;
      const worker = async () => {
        while (true) {
          const i = cursor++;
          if (i >= array.length) break;
          results[i] = await mapper(array[i], i);
        }
      };
      const n = Math.min(Math.max(1, concurrency), Math.max(1, array.length));
      await Promise.all(Array.from({ length: n }, () => worker()));
      return results;
    },
    paintCkZeroShell(warehouses) {
      const z = new Array(12).fill(0);
      this.CKtitle = warehouses.map(w => w.name);
      this.CKyData = warehouses.map(w => ({ name: w.name, type: "line", data: [...z] }));
      const qtyMap = {};
      warehouses.forEach(w => {
        qtyMap[w.name] = [...z];
      });
      this.ckQtyMap = qtyMap;
      this.$nextTick(() => this.initCk());
    },
    async loadWarehousePurchaseChart() {
      try {
        const year = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, idx) => this.monthDateRangePureDate(year, idx + 1));
        this.CKxData = months.map(item => item.label);

        const warehouseResp = await getOptionselect();
        const warehouseRows = (warehouseResp && warehouseResp.data) || [];
        const warehouses = warehouseRows.filter(item => item && item.id && item.name);
        if (!warehouses.length) {
          this.CKtitle = [];
          this.CKyData = [];
          this.ckQtyMap = {};
          this.initCk();
          return;
        }

        const cachedIds = this.readCkWarehouseIdsFromCache(year);
        const currentIds = warehouses.map(w => w.id).join(",");
        const hadChart = Array.isArray(this.CKyData) && this.CKyData.length > 0;
        const cacheStaleByIds = hadChart && cachedIds && cachedIds !== currentIds;
        const needCkPlaceholder = !hadChart || cacheStaleByIds;
        if (needCkPlaceholder) {
          this.paintCkZeroShell(warehouses);
        }

        const whCount = warehouses.length;
        const monthAmtMatrix = Array.from({ length: whCount }, () => new Array(12).fill(0));
        const monthQtyMatrix = Array.from({ length: whCount }, () => new Array(12).fill(0));

        const tasks = [];
        for (let mi = 0; mi < 12; mi++) {
          for (let wi = 0; wi < whCount; wi++) {
            tasks.push({ mi, wi, wh: warehouses[wi], monthInfo: months[mi] });
          }
        }

        const flat = await this.pooledMap(tasks, 24, async t => {
          const [rthRes, ctkRes] = await Promise.all([
            listRTHWarehouse({
              pageNum: 1,
              pageSize: 1,
              warehouseId: t.wh.id,
              beginDate: t.monthInfo.beginDate,
              endDate: t.monthInfo.endDate
            }),
            listCTKWarehouse({
              pageNum: 1,
              pageSize: 1,
              warehouseId: t.wh.id,
              beginDate: t.monthInfo.beginDate,
              endDate: t.monthInfo.endDate
            })
          ]);
          const rthTotal = (rthRes && rthRes.totalInfo) || {};
          const ctkTotal = (ctkRes && ctkRes.totalInfo) || {};
          const amount =
            Math.abs(this.safeNumber(rthTotal.totalAmt)) + Math.abs(this.safeNumber(ctkTotal.totalAmt));
          const qty =
            Math.abs(this.safeNumber(rthTotal.totalQty)) + Math.abs(this.safeNumber(ctkTotal.totalQty));
          return {
            mi: t.mi,
            wi: t.wi,
            amount: Number(amount.toFixed(2)),
            qty: Number(qty.toFixed(2))
          };
        });
        flat.forEach(r => {
          monthAmtMatrix[r.wi][r.mi] = r.amount;
          monthQtyMatrix[r.wi][r.mi] = r.qty;
        });

        const seriesList = warehouses.map((wh, wi) => ({
          name: wh.name,
          type: "line",
          data: monthAmtMatrix[wi]
        }));
        const qtyMap = {};
        warehouses.forEach((wh, wi) => {
          qtyMap[wh.name] = monthQtyMatrix[wi];
        });

        this.CKyData = seriesList;
        this.ckQtyMap = qtyMap;
        this.initCk();
        try {
          sessionStorage.setItem(
            this.chartCacheKeyCk(year),
            JSON.stringify({
              CKxData: this.CKxData,
              CKtitle: this.CKtitle,
              CKyData: this.CKyData,
              ckQtyMap: this.ckQtyMap,
              warehouseIds: currentIds
            })
          );
        } catch (err) {
          // 缓存失败不影响图表
        }
      } catch (e) {
        console.error("加载仓库采购图失败", e);
        this.CKtitle = [];
        this.CKyData = [];
        this.ckQtyMap = {};
        this.initCk();
      }
    },
    readCkWarehouseIdsFromCache(year) {
      try {
        const raw = sessionStorage.getItem(this.chartCacheKeyCk(year));
        if (!raw) return "";
        const o = JSON.parse(raw);
        return typeof o.warehouseIds === "string" ? o.warehouseIds : "";
      } catch (e) {
        return "";
      }
    },
    async loadDepartmentUsageChart() {
      try {
        const year = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, idx) => this.monthDateRange(year, idx + 1));
        const monthsPure = Array.from({ length: 12 }, (_, idx) => this.monthDateRangePureDate(year, idx + 1));
        this.KSxData = months.map(item => item.label);

        // 12 个月并行请求，避免逐月串行
        // 领用：出库至科室（listCTKWarehouse）；消耗：已审核科室批量消耗（与「科室消耗追溯」同一 totalInfo 口径，按 consume_bill_date）
        const monthRows = await Promise.all(
          months.map(async (monthInfo, index) => {
            const pure = monthsPure[index];
            let ctkRes = {};
            let consumeRes = {};
            try {
              ctkRes = (await listCTKWarehouse({
                pageNum: 1,
                pageSize: 1,
                beginDate: monthInfo.beginDate,
                endDate: monthInfo.endDate
              })) || {};
            } catch (err) {
              console.warn("科室图领用请求失败", index + 1, err);
            }
            try {
              const raw = await getAuditedConsumeReportTotal({
                beginDate: pure.beginDate,
                endDate: pure.endDate
              });
              const body = raw && raw.data != null ? raw.data : raw;
              consumeRes = body && (body.totalQty != null || body.totalAmt != null) ? { totalInfo: body } : {};
            } catch (err) {
              console.warn("科室图消耗合计请求失败", index + 1, err);
            }
            const ctkTotal = (ctkRes && ctkRes.totalInfo) || {};
            const consumeTotal = (consumeRes && consumeRes.totalInfo) || {};
            return {
              index,
              receiveQty: Number(Math.abs(this.safeNumber(ctkTotal.totalQty)).toFixed(2)),
              receiveAmt: Number(Math.abs(this.safeNumber(ctkTotal.totalAmt)).toFixed(2)),
              consumeQty: Number(this.safeNumber(consumeTotal.totalQty).toFixed(2)),
              consumeAmt: Number(this.safeNumber(consumeTotal.totalAmt).toFixed(2))
            };
          })
        );
        monthRows.sort((a, b) => a.index - b.index);
        const receiveQtyData = monthRows.map(r => r.receiveQty);
        const receiveAmtData = monthRows.map(r => r.receiveAmt);
        const consumeQtyData = monthRows.map(r => r.consumeQty);
        const consumeAmtData = monthRows.map(r => r.consumeAmt);

        this.KSyData = [
          { name: '领用数量', type: 'line', data: receiveQtyData },
          { name: '领用金额', type: 'line', data: receiveAmtData },
          { name: '消耗数量', type: 'line', data: consumeQtyData },
          { name: '消耗金额', type: 'line', data: consumeAmtData }
        ];
        this.initKs();
        try {
          sessionStorage.setItem(
            this.chartCacheKeyKs(year),
            JSON.stringify({
              KSxData: this.KSxData,
              KSyData: this.KSyData
            })
          );
        } catch (err) {
          // ignore
        }
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
    /** AjaxResult 数字汇总接口返回值 */
    parseEntryQtySumResponse(res) {
      if (!res) return 0;
      if (typeof res === "number") return Number.isFinite(res) ? res : 0;
      const raw = res.data != null ? res.data : res;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    },
    /** TableDataInfo：totalInfo 总数量（兼容 totalQty / subTotalQty） */
    tableTotalQtyFromResponse(resp) {
      if (!resp || !resp.totalInfo) return 0;
      const ti = resp.totalInfo;
      const raw = ti.totalQty != null && ti.totalQty !== "" ? ti.totalQty : ti.subTotalQty;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    },
    formatStatQty(val) {
      const num = Number(val || 0);
      return Number.isFinite(num) ? num.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : "0";
    },
    async loadTodayStats() {
      const { day, beginDateTime, endDateTime } = this.buildTodayRange();
      try {
        const settled = await Promise.allSettled([
          listRTHWarehouse({
            pageNum: 1,
            pageSize: 1,
            beginDate: beginDateTime,
            endDate: endDateTime,
            billType: 101
          }),
          listCTKWarehouse({
            pageNum: 1,
            pageSize: 1,
            beginDate: beginDateTime,
            endDate: endDateTime,
            billType: 201
          }),
          listCTKWarehouse({
            pageNum: 1,
            pageSize: 1,
            beginDate: beginDateTime,
            endDate: endDateTime,
            billType: 401
          }),
          sumApplyEntryQty({
            applyBillDate: day,
            billType: 1,
            applyBillStatus: 2
          }),
          sumPurchaseEntryQty({
            purchaseBillDate: day,
            purchaseBillStatus: 2
          }),
          listInventory({ pageNum: 1, pageSize: 1 })
        ]);
        const pick = i =>
          settled[i] && settled[i].status === "fulfilled" ? settled[i].value : null;
        if (settled.some(s => s.status === "rejected")) {
          console.warn(
            "今日统计部分接口失败（仍展示已成功项）",
            settled.map((s, i) => (s.status === "rejected" ? { index: i, reason: s.reason } : null)).filter(Boolean)
          );
        }
        this.todayStats.inCount = this.tableTotalQtyFromResponse(pick(0));
        this.todayStats.outCount = this.tableTotalQtyFromResponse(pick(1));
        this.todayStats.returnCount = Math.abs(this.tableTotalQtyFromResponse(pick(2)));
        this.todayStats.applyCount = this.parseEntryQtySumResponse(pick(3));
        this.todayStats.purchaseCount = this.parseEntryQtySumResponse(pick(4));
        this.todayStats.inventoryQty = this.tableTotalQtyFromResponse(pick(5));
        try {
          sessionStorage.setItem(
            this.todayStatsCacheKey(day),
            JSON.stringify({
              inCount: this.todayStats.inCount,
              outCount: this.todayStats.outCount,
              returnCount: this.todayStats.returnCount,
              applyCount: this.todayStats.applyCount,
              purchaseCount: this.todayStats.purchaseCount,
              inventoryQty: this.todayStats.inventoryQty
            })
          );
        } catch (err) {
          // ignore
        }
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

