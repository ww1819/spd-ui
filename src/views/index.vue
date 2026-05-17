<template>
  <div class="app-container home">
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="12" :lg="8" >
        <el-card class="update-log" style="height:42vh;">
          <div slot="header" class="clearfix">
            <span>仓库采购情况</span>
          </div>
          <div class="body">
              <div v-if="ckChartEmptyHint" class="home-chart-empty">{{ ckChartEmptyHint }}</div>
              <div v-show="!ckChartEmptyHint" ref="ckChartRef" class="echart" :style="myChartStyle"></div>
          </div>
        </el-card>

        <el-card class="update-log" style="height:43vh;margin-top: 2vh">
          <div slot="header" class="clearfix">
            <span>科室使用记录情况</span>
          </div>
          <div class="body">
              <div v-if="ksChartEmptyHint" class="home-chart-empty">{{ ksChartEmptyHint }}</div>
              <div v-show="!ksChartEmptyHint" ref="ksChartRef" class="echart" :style="myChartStyle"></div>
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
  import {
    fetchHomeWarehousePurchase,
    fetchHomeDepartmentUsage,
    fetchHomeTodayStats
  } from "@/api/dashboard/home";
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
      /** 仓库图 ref 未就绪时的 nextTick 重试次数（防止死循环） */
      _ckInitRetries: 0,
      KStitle:['领用数量', '领用金额','消耗数量','消耗金额'],
      KSxData: [], //横坐标
      KSyData: [], //数据
      ksChartInstance: null,
      ksResizeHandler: null,
      /** 科室使用图 ref 未就绪时的 nextTick 重试次数 */
      _ksInitRetries: 0,
      myChartStyle: { float: "left", width: "100%", height: "30vh" }, //图表样式
      todayStats: {
        inCount: 0,
        outCount: 0,
        returnCount: 0,
        applyCount: 0,
        purchaseCount: 0,
        inventoryQty: 0
      },
      /** 仓库采购图无仓库或无系列时的提示 */
      ckChartEmptyHint: "",
      /** 科室使用图加载失败或无数据时的提示 */
      ksChartEmptyHint: ""
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
    padSeriesToMonths(arr, monthLen) {
      const n = Number(monthLen) || 12;
      const src = Array.isArray(arr) ? arr.map((v) => Number(v)) : [];
      const out = src.slice(0, n);
      while (out.length < n) out.push(0);
      return out;
    },
    chartCacheKeyCk(year) {
      return `spd_index_ck_v5_${year}`;
    },
    chartCacheKeyKs(year) {
      // v4：科室图后端改为全年聚合 SQL，与旧缓存区分
      return `spd_index_ks_v4_${year}`;
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
        this.ckChartEmptyHint = "";
        const res = await fetchHomeWarehousePurchase(year);
        const d = res && res.data;
        if (!d) {
          this.CKtitle = [];
          this.CKyData = [];
          this.ckQtyMap = {};
          this.ckChartEmptyHint = "暂无仓库采购数据（接口无返回）";
          this.initCk();
          return;
        }
        this.CKxData = d.monthLabels || [];
        const warehouses = (d.warehouses || []).filter(item => item && item.id && item.name);
        if (!warehouses.length) {
          this.CKtitle = [];
          this.CKyData = [];
          this.ckQtyMap = {};
          this.ckChartEmptyHint = "当前租户下无可用仓库，无法展示仓库采购情况";
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
        const monthLen = (this.CKxData && this.CKxData.length) || 12;
        const seriesList = d.series || [];
        const byWhId = new Map(
          seriesList
            .filter((s) => s && s.warehouseId != null && s.warehouseId !== "")
            .map((s) => [String(s.warehouseId), s])
        );
        this.CKtitle = warehouses.map((w) => w.name);
        this.CKyData = warehouses.map((w) => {
          const s = byWhId.get(String(w.id)) || {};
          const amounts = this.padSeriesToMonths(s.amounts, monthLen);
          return { name: w.name, type: "line", data: amounts };
        });
        const qtyMap = {};
        warehouses.forEach((w) => {
          const s = byWhId.get(String(w.id)) || {};
          qtyMap[w.name] = this.padSeriesToMonths(s.qtys, monthLen);
        });
        this.ckQtyMap = qtyMap;
        this.ckChartEmptyHint = "";
        this.$nextTick(() => {
          this.initCk();
        });
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
        this.ckChartEmptyHint = "加载仓库采购图失败，请检查网络或联系管理员";
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
        this.ksChartEmptyHint = "";
        const res = await fetchHomeDepartmentUsage(year);
        const d = res && res.data;
        if (!d) {
          this.primeKsShell(year);
          this.ksChartEmptyHint = "暂无科室使用数据（接口无返回）";
          this.$nextTick(() => this.initKs());
          return;
        }
        this.KSxData = d.monthLabels || [];
        const monthLen = (this.KSxData && this.KSxData.length) || 12;
        const rq = this.padSeriesToMonths(d.receiveQty || [], monthLen);
        const ra = this.padSeriesToMonths(d.receiveAmt || [], monthLen);
        const cq = this.padSeriesToMonths(d.consumeQty || [], monthLen);
        const ca = this.padSeriesToMonths(d.consumeAmt || [], monthLen);
        this.KSyData = [
          { name: "领用数量", type: "line", data: rq },
          { name: "领用金额", type: "line", data: ra },
          { name: "消耗数量", type: "line", data: cq },
          { name: "消耗金额", type: "line", data: ca }
        ];
        this.ksChartEmptyHint = "";
        this.$nextTick(() => {
          this.initKs();
        });
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
        this.ksChartEmptyHint = "加载科室使用记录图失败，请检查网络或联系管理员";
        this.$nextTick(() => this.initKs());
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
    formatStatQty(val) {
      const num = Number(val || 0);
      return Number.isFinite(num) ? num.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) : "0";
    },
    async loadTodayStats() {
      const { day } = this.buildTodayRange();
      try {
        const res = await fetchHomeTodayStats(day);
        const d = res && res.data;
        if (!d) {
          return;
        }
        this.todayStats.inCount = Number(d.inCount) || 0;
        this.todayStats.outCount = Number(d.outCount) || 0;
        this.todayStats.returnCount = Number(d.returnCount) || 0;
        this.todayStats.applyCount = Number(d.applyCount) || 0;
        this.todayStats.purchaseCount = Number(d.purchaseCount) || 0;
        this.todayStats.inventoryQty = Number(d.inventoryQty) || 0;
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
      if (this.ckChartEmptyHint) {
        if (this.ckChartInstance) {
          this.ckChartInstance.dispose();
          this.ckChartInstance = null;
        }
        this._ckInitRetries = 0;
        return;
      }
      if (!Array.isArray(this.CKyData) || !this.CKyData.length) {
        return;
      }
      const el = this.$refs.ckChartRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        if (this._ckInitRetries < 10) {
          this._ckInitRetries += 1;
          this.$nextTick(() => this.initCk());
        }
        return;
      }
      this._ckInitRetries = 0;
      try {
        const option = {
          title: {
            text: ""
          },
          tooltip: {
            trigger: "axis",
            formatter: (params) => {
              if (!params || !params.length) return "";
              const monthLabel = params[0].axisValue || "";
              const lines = [monthLabel];
              params.forEach((p) => {
                const name = p.seriesName;
                const amt = this.formatStatQty(p.data);
                const qtyArr = this.ckQtyMap[name] || [];
                const qtyVal = qtyArr[p.dataIndex] != null ? qtyArr[p.dataIndex] : 0;
                const qty = this.formatStatQty(qtyVal);
                lines.push(`${p.marker}${name} 金额: ${amt}，数量: ${qty}`);
              });
              return lines.join("<br/>");
            }
          },
          legend: {
            data: this.CKtitle
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            containLabel: true
          },
          toolbox: {
            feature: {
              saveAsImage: {}
            }
          },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: this.CKxData
          },
          yAxis: {
            type: "value"
          },
          series: this.CKyData
        };
        if (!this.ckChartInstance) {
          this.ckChartInstance = echarts.init(el);
        }
        this.ckChartInstance.setOption(option, true);
        this.$nextTick(() => {
          if (this.ckChartInstance) {
            this.ckChartInstance.resize();
          }
        });
        if (!this.ckResizeHandler) {
          this.ckResizeHandler = () => {
            if (this.ckChartInstance) {
              this.ckChartInstance.resize();
            }
          };
          window.addEventListener("resize", this.ckResizeHandler);
        }
      } catch (err) {
        console.error("initCk", err);
        this.ckChartEmptyHint = "仓库采购图表渲染失败，请刷新页面重试";
      }
    },
    initKs() {
      if (this.ksChartEmptyHint) {
        if (this.ksChartInstance) {
          this.ksChartInstance.dispose();
          this.ksChartInstance = null;
        }
        this._ksInitRetries = 0;
        return;
      }
      if (!Array.isArray(this.KSyData) || !this.KSyData.length) {
        return;
      }
      const el = this.$refs.ksChartRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        if (this._ksInitRetries < 10) {
          this._ksInitRetries += 1;
          this.$nextTick(() => this.initKs());
        }
        return;
      }
      this._ksInitRetries = 0;
      try {
        const option = {
          title: {
            text: ""
          },
          tooltip: {
            trigger: "axis"
          },
          legend: {
            data: this.KStitle
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            containLabel: true
          },
          toolbox: {
            feature: {
              saveAsImage: {}
            }
          },
          xAxis: {
            type: "category",
            boundaryGap: false,
            axisLabel: {
              interval: 0
            },
            data: this.KSxData
          },
          yAxis: {
            type: "value"
          },
          series: this.KSyData
        };
        if (!this.ksChartInstance) {
          this.ksChartInstance = echarts.init(el);
        }
        this.ksChartInstance.setOption(option, true);
        this.$nextTick(() => {
          if (this.ksChartInstance) {
            this.ksChartInstance.resize();
          }
        });
        if (!this.ksResizeHandler) {
          this.ksResizeHandler = () => {
            if (this.ksChartInstance) {
              this.ksChartInstance.resize();
            }
          };
          window.addEventListener("resize", this.ksResizeHandler);
        }
      } catch (err) {
        console.error("initKs", err);
        this.ksChartEmptyHint = "科室使用记录图表渲染失败，请刷新页面重试";
      }
    }
  }
};
</script>

<style scoped lang="scss">
.home {
  /* 首页：顶栏/标签下沿与首卡顶部、侧栏与首卡左侧留白一致（略收紧顶距） */
  margin-top: 0;
  padding: 10px 20px 20px 10px;

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

  .home-chart-empty {
    padding: 2rem 1rem;
    text-align: center;
    color: #909399;
    font-size: 13px;
    min-height: 28vh;
    line-height: 1.6;
  }
}
</style>

