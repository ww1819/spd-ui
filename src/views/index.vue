<template>
  <div class="app-container home home-workbench" :class="'is-' + homeView">
    <div class="home-toolbar">
      <div class="home-view-switch" role="tablist">
        <button
          v-for="item in viewOptions"
          :key="item.value"
          type="button"
          class="home-view-btn"
          :class="{ active: homeView === item.value }"
          @click="switchView(item.value)"
        >{{ item.label }}</button>
      </div>
      <el-button
        size="small"
        type="primary"
        plain
        class="home-save-default"
        :disabled="homeView === savedView"
        :loading="savingPref"
        @click="saveDefaultView"
      >{{ homeView === savedView ? '已是默认首页' : '保存为默认首页' }}</el-button>
    </div>

    <div class="home-todo-grid" :class="{ 'is-full': isFull }">
      <div
        v-for="todo in visibleTodos"
        :key="todo.key"
        class="home-todo-card"
        :class="{ warn: todo.count > 0 }"
        role="button"
        tabindex="0"
        @click="openTodo(todo)"
        @keyup.enter="openTodo(todo)"
      >
        <div class="home-todo-copy">
          <div class="home-todo-title">{{ todo.label }}</div>
          <div class="home-todo-hint">{{ todo.hint }}</div>
        </div>
        <div class="home-todo-badge" :class="{ 'is-num': todo.showCount }">
          <span v-if="todo.showCount">{{ formatStatQty(todo.count) }}</span>
          <i v-else :class="todo.icon" />
        </div>
      </div>
    </div>

    <div class="home-kpi-grid" :class="isFull ? 'cols-6' : 'cols-4'">
      <div v-for="kpi in visibleKpis" :key="kpi.key" class="home-kpi-card" :class="{ warn: kpi.deltaClass === 'is-down' }">
        <div class="home-kpi-copy">
          <div class="home-kpi-row">
            <span class="home-kpi-num">{{ formatStatQty(kpi.value) }}</span>
            <span v-if="kpi.icon" class="home-kpi-icon"><i :class="kpi.icon" /></span>
          </div>
          <div class="home-kpi-label">{{ kpi.label }}</div>
          <div class="home-kpi-delta" :class="kpi.deltaClass">{{ kpi.deltaText }}</div>
        </div>
        <div v-if="kpi.sideText" class="home-kpi-side" :class="kpi.deltaClass">{{ kpi.sideText }}</div>
      </div>
    </div>

    <div class="home-chart-row">
      <div class="home-board home-trend-board">
        <div class="home-board-head">
          <span>近七日耗材消耗趋势</span>
          <span class="home-board-sub">{{ trendDeltaHint }}</span>
        </div>
        <div v-if="trendEmptyHint" class="home-cabin-empty">
          <div class="home-cabin-empty-plot" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          <p class="home-cabin-empty-text">{{ trendEmptyHint }}</p>
        </div>
        <div v-show="!trendEmptyHint" ref="trendRef" class="home-trend-chart" />
      </div>
      <div class="home-board home-pie-board">
        <div class="home-board-head">
          <span>库存结构占比</span>
          <span class="home-board-sub">当月财务分类出退库</span>
        </div>
        <div v-if="outChartEmptyHint" class="home-cabin-empty home-cabin-empty--pie">
          <div class="home-cabin-empty-ring" aria-hidden="true" />
          <p class="home-cabin-empty-text">{{ outChartEmptyHint }}</p>
        </div>
        <div v-show="!outChartEmptyHint" ref="pieRef" class="home-pie-chart" />
      </div>
    </div>

    <template v-if="isFull">
      <div class="home-chart-row">
        <div class="home-board home-trend-board">
          <div class="home-board-head">
            <span>本年科室领用与消耗</span>
            <span class="home-board-sub">按月数量</span>
          </div>
          <div v-if="usageEmptyHint" class="home-cabin-empty">
            <div class="home-cabin-empty-plot" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
            <p class="home-cabin-empty-text">{{ usageEmptyHint }}</p>
          </div>
          <div v-show="!usageEmptyHint" ref="usageRef" class="home-trend-chart" />
        </div>
        <div class="home-board home-pie-board">
          <div class="home-board-head">
            <span>入库结构占比</span>
            <span class="home-board-sub">当月财务分类入退货</span>
          </div>
          <div v-if="inChartEmptyHint" class="home-cabin-empty home-cabin-empty--pie">
            <div class="home-cabin-empty-ring" aria-hidden="true" />
            <p class="home-cabin-empty-text">{{ inChartEmptyHint }}</p>
          </div>
          <div v-show="!inChartEmptyHint" ref="inPieRef" class="home-pie-chart" />
        </div>
      </div>
      <div class="home-chart-row home-table-row">
        <div class="home-board">
          <div class="home-board-head">
            <span>待办汇总</span>
            <span class="home-board-sub">点击行打开对应提醒</span>
          </div>
          <el-table
            :data="summaryRows"
            size="mini"
            class="home-data-table"
            :row-class-name="summaryRowClass"
            @row-click="openTodo"
          >
            <el-table-column prop="label" label="事项" min-width="110" show-overflow-tooltip />
            <el-table-column prop="scope" label="范围" width="70" />
            <el-table-column prop="count" label="数量" width="80" align="right">
              <template slot-scope="scope">{{ formatStatQty(scope.row.count) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="88">
              <template slot-scope="scope">
                <span class="home-tag" :class="scope.row.count > 0 ? 'is-warn' : 'is-ok'">{{ scope.row.status }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="home-board">
          <div class="home-board-head">
            <span>近效期库存</span>
            <span class="home-board-sub">仓库有效期≤30天，最多 8 条</span>
          </div>
          <el-table
            v-if="nearExpiryPreview.length"
            :data="nearExpiryPreview"
            size="mini"
            class="home-data-table"
            @row-click="openWarehouseNearExpiry"
          >
            <el-table-column prop="materialName" label="耗材" min-width="140" show-overflow-tooltip />
            <el-table-column prop="warehouseName" label="仓库" width="100" show-overflow-tooltip />
            <el-table-column label="数量" width="80" align="right">
              <template slot-scope="scope">{{ formatStatQty(scope.row.qty) }}</template>
            </el-table-column>
            <el-table-column label="效期" width="108">
              <template slot-scope="scope">{{ formatDay(scope.row.endTime) }}</template>
            </el-table-column>
            <el-table-column label="剩余" width="88">
              <template slot-scope="scope">
                <span class="home-tag" :class="remainDays(scope.row.endTime) <= 7 ? 'is-warn' : 'is-soon'">
                  {{ remainDays(scope.row.endTime) }}天
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="home-cabin-empty home-cabin-empty--menu">
            <p class="home-cabin-empty-text">{{ nearExpiryEmptyHint || '暂无近效期库存' }}</p>
          </div>
        </div>
      </div>
    </template>

    <div class="home-board home-menu-board">
      <div class="home-board-head">常用菜单</div>
      <div v-if="displayMenus.length" class="home-menu-grid">
        <button
          v-for="m in displayMenus"
          :key="m.path"
          type="button"
          class="home-menu-tile"
          @click="goMenu(m)"
        >
          <span class="home-menu-tile-icon">
            <svg-icon v-if="menuSvgName(m)" :icon-class="menuSvgName(m)" />
            <i v-else class="el-icon-menu" />
          </span>
          <span class="home-menu-tile-title">{{ m.title }}</span>
        </button>
      </div>
      <div v-else class="home-cabin-empty home-cabin-empty--menu">
        <p class="home-cabin-empty-text">暂无常用菜单，使用功能后按频率出现在这里</p>
      </div>
    </div>
  </div>
</template>
<style>
  a:hover {
    color: blue;
  }
</style>
<script>
  import * as echarts from "echarts";
  import {
    fetchHomeTodayStats,
    fetchHomeOutboundFinanceCategoryProportion,
    fetchHomeInboundFinanceCategoryProportion,
    fetchHomeWarehouseReminderCounts,
    fetchHomeWarehouseReminderNearExpiryList,
    fetchHomeDepartmentUsage,
    fetchHomePref,
    saveHomePref,
    fetchFrequentMenus,
    fetchHomeKpiTrend,
    fetchHomeDepartmentReminderCounts
  } from "@/api/dashboard/home";
  import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";
  import { collectLeafMenus } from "@/utils/nav-menu";

const HOME_VIEW_UI_KEY = "spd.homeView";
const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#38bdf8", "#818cf8"];

export default {
  name: "Index",
  data() {
    return {
      viewOptions: [
        { value: "simple", label: "简洁" },
        { value: "full", label: "完整" }
      ],
      homeView: "simple",
      savedView: "simple",
      savingPref: false,
      chartsReady: false,
      deptCounts: {
        unreceivedBillCount: 0,
        nearExpiryLineCount: 0,
        inventoryAlertLineCount: 0,
        consumeLineCount: 0
      },
      warehouseCounts: {
        pendingApplyBillCount: 0,
        pendingPurchaseBillCount: 0,
        nearExpiryInventoryLineCount: 0,
        inventoryAlertLineCount: 0
      },
      frequentMenus: [],
      todayStats: {
        inCount: 0,
        outCount: 0,
        returnCount: 0,
        applyCount: 0,
        purchaseCount: 0,
        inventoryQty: 0
      },
      kpiYesterday: {
        inCount: 0,
        outCount: 0,
        returnCount: 0,
        applyCount: 0,
        purchaseCount: 0
      },
      kpiSeries: {
        inCount: [0, 0, 0, 0, 0, 0, 0],
        outCount: [0, 0, 0, 0, 0, 0, 0],
        returnCount: [0, 0, 0, 0, 0, 0, 0],
        applyCount: [0, 0, 0, 0, 0, 0, 0],
        purchaseCount: [0, 0, 0, 0, 0, 0, 0]
      },
      kpiDays: [],
      trendChartInstance: null,
      trendResizeHandler: null,
      trendEmptyHint: "",
      pieChartInstance: null,
      pieResizeHandler: null,
      outChartSlices: [],
      outChartEmptyHint: "",
      fullExtrasLoaded: false,
      usageChartInstance: null,
      usageResizeHandler: null,
      usageEmptyHint: "",
      usageMonths: [],
      usageReceiveQty: [],
      usageConsumeQty: [],
      inPieChartInstance: null,
      inPieResizeHandler: null,
      inChartSlices: [],
      inChartEmptyHint: "",
      nearExpiryRows: [],
      nearExpiryEmptyHint: ""
    };
  },
  computed: {
    isFull() {
      return this.homeView === "full";
    },
    allTodos() {
      return [
        { key: "unreceived", label: "待收货确认", hint: "待处理单据", icon: "el-icon-bottom", showCount: false, count: this.deptCounts.unreceivedBillCount, open: { category: "department", subTab: "unreceivedConfirm" } },
        { key: "expiry", label: "近效期预警", hint: "临近效期耗材", icon: "el-icon-time", showCount: false, count: this.deptCounts.nearExpiryLineCount, open: { category: "department", subTab: "expiry" } },
        { key: "alert", label: "库存预警", hint: "偏离安全库存", icon: "el-icon-warning-outline", showCount: false, count: this.deptCounts.inventoryAlertLineCount, open: { category: "department", subTab: "inventory" } },
        { key: "consume", label: "待消耗核对", hint: "待核对记录", icon: "el-icon-finished", showCount: true, count: this.deptCounts.consumeLineCount, open: { category: "department", subTab: "consume" } },
        { key: "apply", label: "待审申领", hint: "待审核申领单", icon: "el-icon-s-order", showCount: true, count: this.warehouseCounts.pendingApplyBillCount, open: { category: "warehouse", subTab: "apply" } },
        { key: "purchase", label: "待审申购", hint: "待审核申购单", icon: "el-icon-s-goods", showCount: true, count: this.warehouseCounts.pendingPurchaseBillCount, open: { category: "warehouse", subTab: "purchase" } }
      ];
    },
    visibleTodos() {
      return this.isFull ? this.allTodos : this.allTodos.slice(0, 4);
    },
    visibleKpis() {
      const simple = [
        this.buildKpiCard("applyCount", "今日申领数量", "el-icon-s-claim"),
        this.buildKpiCard("purchaseCount", "今日申购数量", "el-icon-goods"),
        this.buildKpiCard("outCount", "今日出库数量", "el-icon-top"),
        this.buildKpiCard("inventoryQty", "实时库存总量", "el-icon-office-building", true)
      ];
      if (!this.isFull) {
        return simple;
      }
      return simple.concat([
        this.buildKpiCard("inCount", "今日入库数量", "el-icon-bottom"),
        this.buildKpiCard("returnCount", "今日退库数量", "el-icon-refresh-left")
      ]);
    },
    displayMenus() {
      const leaves = collectLeafMenus(this.$store.getters.sidebarRouters, 40);
      const iconMap = {};
      leaves.forEach((item) => {
        if (item && item.path) {
          iconMap[item.path] = item.icon;
        }
      });
      const source = this.frequentMenus.length ? this.frequentMenus.slice(0, 8) : leaves.slice(0, 8);
      return source.map((item) => ({
        path: item.path,
        title: item.title,
        icon: item.icon || iconMap[item.path] || ""
      }));
    },
    trendDeltaHint() {
      const delta = this.formatKpiDelta(this.todayStats.outCount, this.kpiYesterday.outCount);
      return delta.text;
    },
    summaryRows() {
      const extra = [
        { key: "wh-exp", label: "仓库近效期", hint: "仓库库存近效期", scope: "仓库", count: this.warehouseCounts.nearExpiryInventoryLineCount, open: { category: "warehouse", subTab: "nearExpiry" } },
        { key: "wh-alert", label: "仓库库存预警", hint: "仓库库存预警", scope: "仓库", count: this.warehouseCounts.inventoryAlertLineCount, open: { category: "warehouse", subTab: "inventory" } }
      ];
      return this.allTodos.concat(extra).map((item) => ({
        ...item,
        scope: item.scope || (item.open && item.open.category === "warehouse" ? "仓库" : "科室"),
        status: item.count > 0 ? "待处理" : "正常"
      }));
    },
    nearExpiryPreview() {
      return (this.nearExpiryRows || []).slice(0, 8);
    }
  },
  watch: {
    homeView(val) {
      this.$nextTick(() => {
        this.initTrendChart();
        this.initPieChart();
        if (val === "full") {
          this.ensureFullExtras();
        } else {
          this.disposeChart("usage");
          this.disposeChart("inPie");
        }
      });
    }
  },
  mounted() {
    this.bootstrapHome();
  },
  beforeDestroy() {
    this.disposeChart("trend");
    this.disposeChart("pie");
    this.disposeChart("usage");
    this.disposeChart("inPie");
  },
  methods: {
    async bootstrapHome() {
      const { day } = this.buildTodayRange();
      this.restoreTodayStatsFromCache(day);
      await this.loadPref();
      this.loadTodayStats();
      this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
      this.loadTodoCounts();
      this.loadFrequentMenus();
      this.loadOutboundProportionChart();
      if (this.homeView === "full") {
        this.ensureFullExtras();
      }
    },
    normalizeView(view) {
      const v = view ? String(view).toLowerCase() : "";
      if (v === "full" || v === "complete") {
        return "full";
      }
      return "simple";
    },
    async readUiHomeView() {
      try {
        const res = await getUserUiConfig(HOME_VIEW_UI_KEY);
        const raw = res && res.data && res.data.configValue;
        if (!raw) {
          return "";
        }
        return this.normalizeView(raw);
      } catch (e) {
        return "";
      }
    },
    async loadPref() {
      let prefView = "";
      let prefApiOk = false;
      try {
        const res = await fetchHomePref();
        if (res && res.data && typeof res.data.homeView === "string") {
          prefApiOk = true;
          prefView = this.normalizeView(res.data.homeView);
        }
      } catch (e) {
        prefApiOk = false;
      }
      const uiView = await this.readUiHomeView();
      let view = "simple";
      if (prefApiOk && prefView && prefView !== "simple") {
        view = prefView;
      } else if (uiView) {
        view = uiView;
        if (prefApiOk && prefView !== uiView) {
          saveHomePref(uiView).catch(() => {});
        }
      } else if (prefApiOk) {
        view = prefView || "simple";
      }
      this.homeView = view;
      this.savedView = view;
    },
    switchView(view) {
      this.homeView = this.normalizeView(view);
    },
    async saveDefaultView() {
      this.savingPref = true;
      const view = this.normalizeView(this.homeView);
      try {
        try {
          await saveHomePref(view);
        } catch (e) {
          // 运行中的后端若尚未加载 /pref，改走个人界面配置
        }
        await saveUserUiConfig({ configKey: HOME_VIEW_UI_KEY, configValue: view });
        this.homeView = view;
        this.savedView = view;
        this.$message.success("已保存为你的默认首页");
      } catch (e) {
        this.$message.error((e && (e.message || e.msg)) || "保存失败");
      } finally {
        this.savingPref = false;
      }
    },
    async loadTodoCounts() {
      try {
        const [deptRes, whRes] = await Promise.all([
          fetchHomeDepartmentReminderCounts().catch(() => null),
          fetchHomeWarehouseReminderCounts().catch(() => null)
        ]);
        const d = (deptRes && deptRes.data) || {};
        const w = (whRes && whRes.data) || {};
        this.deptCounts.unreceivedBillCount = Number(d.unreceivedBillCount) || 0;
        this.deptCounts.nearExpiryLineCount = Number(d.nearExpiryLineCount) || 0;
        this.deptCounts.inventoryAlertLineCount = Number(d.inventoryAlertLineCount) || 0;
        this.deptCounts.consumeLineCount = Number(d.consumeLineCount) || 0;
        this.warehouseCounts.pendingApplyBillCount = Number(w.pendingApplyBillCount) || 0;
        this.warehouseCounts.pendingPurchaseBillCount = Number(w.pendingPurchaseBillCount) || 0;
        this.warehouseCounts.nearExpiryInventoryLineCount = Number(w.nearExpiryInventoryLineCount) || 0;
        this.warehouseCounts.inventoryAlertLineCount = Number(w.inventoryAlertLineCount) || 0;
      } catch (e) {
        console.error("加载首页待办失败", e);
      }
    },
    async loadFrequentMenus() {
      try {
        const res = await fetchFrequentMenus(8);
        const list = (res && res.data) || [];
        this.frequentMenus = (Array.isArray(list) ? list : [])
          .map((item) => ({
            path: item.path || item.PATH,
            title: item.title || item.TITLE || item.path,
            icon: item.icon || item.ICON || "",
            hitCount: item.hitCount || item.hit_count || item.HITCOUNT
          }))
          .filter((item) => item.path);
      } catch (e) {
        this.frequentMenus = [];
      }
    },
    openWarehouseNearExpiry() {
      this.openTodo({ open: { category: "warehouse", subTab: "nearExpiry" } });
    },
    summaryRowClass({ row }) {
      return row && row.count > 0 ? "is-warn-row" : "";
    },
    formatDay(val) {
      if (!val) return "--";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) {
        const s = String(val);
        return s.length >= 10 ? s.slice(0, 10) : s;
      }
      return this.formatDate(d);
    },
    remainDays(endTime) {
      if (!endTime) return "--";
      const end = new Date(endTime);
      if (Number.isNaN(end.getTime())) return "--";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return Math.round((end.getTime() - today.getTime()) / 86400000);
    },
    ensureFullExtras() {
      if (!this.fullExtrasLoaded) {
        this.fullExtrasLoaded = true;
        this.loadDepartmentUsageChart();
        this.loadInboundProportionChart();
        this.loadNearExpiryPreview();
        return;
      }
      this.$nextTick(() => {
        this.initUsageChart();
        this.initInPieChart();
      });
    },
    async loadDepartmentUsageChart() {
      this.usageEmptyHint = "";
      try {
        const res = await fetchHomeDepartmentUsage(new Date().getFullYear());
        const d = (res && res.data) || {};
        this.usageMonths = Array.isArray(d.monthLabels) ? d.monthLabels : [];
        this.usageReceiveQty = this.parseNumList(d.receiveQty);
        this.usageConsumeQty = this.parseNumList(d.consumeQty);
        const empty = this.usageReceiveQty.every((v) => !Number(v)) && this.usageConsumeQty.every((v) => !Number(v));
        if (empty) {
          this.usageEmptyHint = "本年暂无领用消耗数据";
          this.disposeChart("usage");
          return;
        }
        this.$nextTick(() => this.initUsageChart());
      } catch (e) {
        console.error("加载科室领用消耗图失败", e);
        this.usageEmptyHint = "本年暂无领用消耗数据";
        this.disposeChart("usage");
      }
    },
    async loadInboundProportionChart() {
      this.inChartEmptyHint = "";
      try {
        const res = await fetchHomeInboundFinanceCategoryProportion();
        const rows = (res && res.data) || [];
        this.inChartSlices = this.buildFinancePieSlices(rows, "暂无当月入库");
        if (this.inChartSlices.length === 1 && this.inChartSlices[0].name === "暂无当月入库") {
          this.inChartEmptyHint = "本月暂无分类数据";
          this.disposeChart("inPie");
          return;
        }
        this.$nextTick(() => this.initInPieChart());
      } catch (e) {
        console.error("加载入库统计占比失败", e);
        this.inChartSlices = [];
        this.inChartEmptyHint = "本月暂无分类数据";
        this.disposeChart("inPie");
      }
    },
    async loadNearExpiryPreview() {
      this.nearExpiryEmptyHint = "";
      try {
        const res = await fetchHomeWarehouseReminderNearExpiryList();
        const list = (res && res.data) || [];
        this.nearExpiryRows = Array.isArray(list) ? list : [];
        if (!this.nearExpiryRows.length) {
          this.nearExpiryEmptyHint = "暂无近效期库存";
        }
      } catch (e) {
        this.nearExpiryRows = [];
        this.nearExpiryEmptyHint = "暂无近效期库存";
      }
    },
    openTodo(todo) {
      if (!todo || !todo.open) {
        return;
      }
      this.$store.dispatch("app/openWarehouseReminder", todo.open);
    },
    goMenu(item) {
      if (!item || !item.path) {
        return;
      }
      this.$router.push(item.path).catch(() => {});
    },
    menuSvgName(item) {
      const icon = (item && item.icon) || "";
      if (!icon || icon.indexOf("el-icon-") === 0) {
        return "";
      }
      return icon;
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
      return Number.isFinite(num) ? num.toLocaleString("zh-CN", { maximumFractionDigits: 3 }) : "0";
    },
    formatAmount(val) {
      const n = Number(val);
      if (!Number.isFinite(n)) {
        return "0.00";
      }
      return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    zeroSeries(len) {
      const n = Number(len) || 7;
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(0);
      }
      return out;
    },
    buildKpiCard(key, label, icon, stock) {
      const value = Number(this.todayStats[key]) || 0;
      if (stock) {
        return {
          key,
          label,
          value,
          icon,
          sideText: "",
          deltaText: "实时存量",
          deltaClass: "is-flat"
        };
      }
      const yesterday = Number((this.kpiYesterday && this.kpiYesterday[key]) || 0) || 0;
      const delta = this.formatKpiDelta(value, yesterday);
      const diff = value - yesterday;
      return {
        key,
        label,
        value,
        icon,
        sideText: this.formatStatQty(Math.abs(diff)),
        deltaText: delta.text,
        deltaClass: delta.cls
      };
    },
    formatKpiDelta(today, yesterday) {
      const t = Number(today) || 0;
      const y = Number(yesterday) || 0;
      if (t === 0 && y === 0) {
        return { text: "较昨日持平", cls: "is-flat" };
      }
      const d = t - y;
      if (d === 0) {
        return { text: "较昨日持平", cls: "is-flat" };
      }
      const sign = d > 0 ? "+" : "";
      return { text: "较昨日 " + sign + this.formatStatQty(d), cls: d > 0 ? "is-up" : "is-down" };
    },
    parseNumList(arr) {
      if (!Array.isArray(arr)) {
        return this.zeroSeries(7);
      }
      return arr.map((v) => Number(v) || 0);
    },
    applyKpiTrendPayload(d) {
      if (!d || typeof d !== "object") {
        return;
      }
      this.kpiSeries.inCount = this.parseNumList(d.inCount);
      this.kpiSeries.outCount = this.parseNumList(d.outCount);
      this.kpiSeries.returnCount = this.parseNumList(d.returnCount);
      this.kpiSeries.applyCount = this.parseNumList(d.applyCount);
      this.kpiSeries.purchaseCount = this.parseNumList(d.purchaseCount);
      this.kpiDays = Array.isArray(d.days) ? d.days.slice() : [];
      const y = d.yesterday || {};
      this.kpiYesterday.inCount = Number(y.inCount) || 0;
      this.kpiYesterday.outCount = Number(y.outCount) || 0;
      this.kpiYesterday.returnCount = Number(y.returnCount) || 0;
      this.kpiYesterday.applyCount = Number(y.applyCount) || 0;
      this.kpiYesterday.purchaseCount = Number(y.purchaseCount) || 0;
    },
    yesterdayDateStr() {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return this.formatDate(d);
    },
    async loadKpiTrend() {
      try {
        const res = await fetchHomeKpiTrend(7);
        this.applyKpiTrendPayload(res && res.data);
        return;
      } catch (e) {
        // 后端未加载新接口时，退化为昨日 todayStats
      }
      try {
        const res = await fetchHomeTodayStats(this.yesterdayDateStr());
        const y = (res && res.data) || {};
        this.kpiYesterday.inCount = Number(y.inCount) || 0;
        this.kpiYesterday.outCount = Number(y.outCount) || 0;
        this.kpiYesterday.returnCount = Number(y.returnCount) || 0;
        this.kpiYesterday.applyCount = Number(y.applyCount) || 0;
        this.kpiYesterday.purchaseCount = Number(y.purchaseCount) || 0;
      } catch (err) {
        // keep zeros
      }
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
        ["inCount", "outCount", "returnCount", "applyCount", "purchaseCount", "inventoryQty"].forEach((k) => {
          if (o[k] != null && Number.isFinite(Number(o[k]))) {
            this.todayStats[k] = Number(o[k]);
          }
        });
        return true;
      } catch (e) {
        return false;
      }
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
    trendLabels() {
      if (this.kpiDays.length) {
        return this.kpiDays.map((d) => {
          const s = String(d);
          return s.length >= 10 ? s.slice(5) : s;
        });
      }
      return ["D-6", "D-5", "D-4", "D-3", "D-2", "昨日", "今日"];
    },
    buildFinancePieSlices(rows, emptyLabel) {
      const list = (rows || [])
        .map((item) => {
          const name = item.financeCategoryName || item.finance_category_name || "未分类";
          const amt = Math.abs(parseFloat(item.totalAmt || item.total_amt || 0) || 0);
          return { name, value: amt };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);
      const topN = 6;
      const top = list.slice(0, topN);
      const otherSum = list.slice(topN).reduce((sum, item) => sum + item.value, 0);
      if (otherSum > 0) {
        top.push({ name: "其他", value: otherSum });
      }
      if (!top.length) {
        return [{ name: emptyLabel, value: 0 }];
      }
      return top;
    },
    async loadOutboundProportionChart() {
      this.outChartEmptyHint = "";
      try {
        const res = await fetchHomeOutboundFinanceCategoryProportion();
        const rows = (res && res.data) || [];
        this.outChartSlices = this.buildFinancePieSlices(rows, "暂无当月出库");
        if (this.outChartSlices.length === 1 && this.outChartSlices[0].name === "暂无当月出库") {
          this.outChartEmptyHint = "本月暂无分类数据";
          this.initPieChart();
          return;
        }
        this.$nextTick(() => this.initPieChart());
      } catch (e) {
        console.error("加载出库统计占比失败", e);
        this.outChartSlices = [];
        this.outChartEmptyHint = "本月暂无分类数据";
        this.initPieChart();
      }
    },
    disposeChart(kind) {
      const map = {
        trend: ["trendChartInstance", "trendResizeHandler"],
        pie: ["pieChartInstance", "pieResizeHandler"],
        usage: ["usageChartInstance", "usageResizeHandler"],
        inPie: ["inPieChartInstance", "inPieResizeHandler"]
      };
      const keys = map[kind];
      if (!keys) {
        return;
      }
      const instKey = keys[0];
      const resizeKey = keys[1];
      if (this[resizeKey]) {
        window.removeEventListener("resize", this[resizeKey]);
        this[resizeKey] = null;
      }
      if (this[instKey]) {
        this[instKey].dispose();
        this[instKey] = null;
      }
    },
    initTrendChart() {
      const series = this.kpiSeries.outCount || this.zeroSeries(7);
      const allZero = series.every((v) => !Number(v));
      this.trendEmptyHint = "";
      if (allZero && !this.kpiDays.length) {
        this.trendEmptyHint = "今日暂无业务流动";
        this.disposeChart("trend");
        return;
      }
      const el = this.$refs.trendRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        this.$nextTick(() => this.initTrendChart());
        return;
      }
      const labels = this.trendLabels();
      const applySeries = this.kpiSeries.applyCount || this.zeroSeries(series.length);
      const option = this.isFull
        ? {
            color: ["#3b82f6", "#94a3b8"],
            tooltip: { trigger: "axis" },
            legend: { data: ["消耗数量", "申领数量"], top: 0, right: 8, textStyle: { color: "#64748b", fontSize: 11 } },
            grid: { left: 36, right: 16, top: 36, bottom: 28 },
            xAxis: { type: "category", data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#94a3b8" } },
            yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
            series: [
              { name: "消耗数量", type: "bar", barWidth: 18, itemStyle: { color: "#3b82f6", borderRadius: [6, 6, 0, 0] }, data: series },
              { name: "申领数量", type: "line", smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 2, color: "#94a3b8" }, data: applySeries }
            ]
          }
        : {
            color: ["#2563eb"],
            tooltip: { trigger: "axis" },
            grid: { left: 36, right: 16, top: 24, bottom: 28 },
            xAxis: { type: "category", data: labels, boundaryGap: false, axisTick: { show: false }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#94a3b8" } },
            yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
            series: [
              {
                name: "消耗数量",
                type: "line",
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                lineStyle: { width: 3, color: "#2563eb" },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "rgba(37,99,235,0.28)" },
                    { offset: 1, color: "rgba(37,99,235,0.02)" }
                  ])
                },
                data: series
              }
            ]
          };
      try {
        if (!this.trendChartInstance) {
          this.trendChartInstance = echarts.init(el);
        }
        this.trendChartInstance.setOption(option, true);
        this.$nextTick(() => this.trendChartInstance && this.trendChartInstance.resize());
        if (!this.trendResizeHandler) {
          this.trendResizeHandler = () => this.trendChartInstance && this.trendChartInstance.resize();
          window.addEventListener("resize", this.trendResizeHandler);
        }
      } catch (e) {
        console.error("initTrendChart", e);
        this.trendEmptyHint = "今日暂无业务流动";
      }
    },
    initPieChart() {
      if (this.outChartEmptyHint) {
        this.disposeChart("pie");
        return;
      }
      const slices = this.outChartSlices;
      if (!Array.isArray(slices) || !slices.length) {
        return;
      }
      const el = this.$refs.pieRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        this.$nextTick(() => this.initPieChart());
        return;
      }
      const seriesData = slices.map((s) => ({
        name: s.name,
        value: s.value > 0 ? s.value : 1,
        realAmt: s.value > 0 ? s.value : 0
      }));
      const option = {
        color: PIE_COLORS,
        tooltip: {
          trigger: "item",
          formatter: (p) => {
            const d = p.data || {};
            const amt = d.realAmt != null ? Number(d.realAmt) : Number(p.value);
            const money = Number.isFinite(amt) ? "¥" + this.formatAmount(amt) : "¥0.00";
            return `${p.name}<br/>金额：${money}（${p.percent}%）`;
          }
        },
        legend: {
          type: "scroll",
          orient: "vertical",
          right: 8,
          top: "middle",
          textStyle: { fontSize: 12, color: "#64748b" }
        },
        series: [
          {
            name: "库存结构占比",
            type: "pie",
            radius: ["48%", "72%"],
            center: ["38%", "50%"],
            avoidLabelOverlap: true,
            label: { fontSize: 11, color: "#64748b", formatter: "{d}%" },
            data: seriesData
          }
        ]
      };
      try {
        if (!this.pieChartInstance) {
          this.pieChartInstance = echarts.init(el);
        }
        this.pieChartInstance.setOption(option, true);
        this.$nextTick(() => this.pieChartInstance && this.pieChartInstance.resize());
        if (!this.pieResizeHandler) {
          this.pieResizeHandler = () => this.pieChartInstance && this.pieChartInstance.resize();
          window.addEventListener("resize", this.pieResizeHandler);
        }
      } catch (e) {
        console.error("initPieChart", e);
        this.outChartEmptyHint = "本月暂无分类数据";
      }
    },
    initUsageChart() {
      if (!this.isFull || this.usageEmptyHint) {
        this.disposeChart("usage");
        return;
      }
      const el = this.$refs.usageRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        this.$nextTick(() => this.initUsageChart());
        return;
      }
      const labels = this.usageMonths.length ? this.usageMonths : ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
      const option = {
        color: ["#3b82f6", "#93c5fd"],
        tooltip: { trigger: "axis" },
        legend: { data: ["领用数量", "消耗数量"], top: 0, right: 8, textStyle: { color: "#64748b", fontSize: 11 } },
        grid: { left: 36, right: 16, top: 36, bottom: 28 },
        xAxis: { type: "category", data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#94a3b8" } },
        yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
        series: [
          { name: "领用数量", type: "bar", barWidth: 10, itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] }, data: this.usageReceiveQty },
          { name: "消耗数量", type: "bar", barWidth: 10, itemStyle: { color: "#93c5fd", borderRadius: [4, 4, 0, 0] }, data: this.usageConsumeQty }
        ]
      };
      try {
        if (!this.usageChartInstance) {
          this.usageChartInstance = echarts.init(el);
        }
        this.usageChartInstance.setOption(option, true);
        this.$nextTick(() => this.usageChartInstance && this.usageChartInstance.resize());
        if (!this.usageResizeHandler) {
          this.usageResizeHandler = () => this.usageChartInstance && this.usageChartInstance.resize();
          window.addEventListener("resize", this.usageResizeHandler);
        }
      } catch (e) {
        console.error("initUsageChart", e);
        this.usageEmptyHint = "本年暂无领用消耗数据";
      }
    },
    initInPieChart() {
      if (!this.isFull || this.inChartEmptyHint) {
        this.disposeChart("inPie");
        return;
      }
      const slices = this.inChartSlices;
      if (!Array.isArray(slices) || !slices.length) {
        return;
      }
      const el = this.$refs.inPieRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        this.$nextTick(() => this.initInPieChart());
        return;
      }
      const seriesData = slices.map((s) => ({
        name: s.name,
        value: s.value > 0 ? s.value : 1,
        realAmt: s.value > 0 ? s.value : 0
      }));
      const option = {
        color: PIE_COLORS,
        tooltip: {
          trigger: "item",
          formatter: (p) => {
            const d = p.data || {};
            const amt = d.realAmt != null ? Number(d.realAmt) : Number(p.value);
            const money = Number.isFinite(amt) ? "¥" + this.formatAmount(amt) : "¥0.00";
            return `${p.name}<br/>金额：${money}（${p.percent}%）`;
          }
        },
        legend: {
          type: "scroll",
          orient: "vertical",
          right: 8,
          top: "middle",
          textStyle: { fontSize: 12, color: "#64748b" }
        },
        series: [
          {
            name: "入库结构占比",
            type: "pie",
            radius: ["48%", "72%"],
            center: ["38%", "50%"],
            avoidLabelOverlap: true,
            label: { fontSize: 11, color: "#64748b", formatter: "{d}%" },
            data: seriesData
          }
        ]
      };
      try {
        if (!this.inPieChartInstance) {
          this.inPieChartInstance = echarts.init(el);
        }
        this.inPieChartInstance.setOption(option, true);
        this.$nextTick(() => this.inPieChartInstance && this.inPieChartInstance.resize());
        if (!this.inPieResizeHandler) {
          this.inPieResizeHandler = () => this.inPieChartInstance && this.inPieChartInstance.resize();
          window.addEventListener("resize", this.inPieResizeHandler);
        }
      } catch (e) {
        console.error("initInPieChart", e);
        this.inChartEmptyHint = "本月暂无分类数据";
      }
    }
  }
};
</script>

<style scoped lang="scss">
.home {
  margin-top: 0;
  padding: 18px 20px 24px;
  box-sizing: border-box;
  background: #f3f7fc;
  min-height: calc(100vh - 94px);
  color: #334155;
  font-size: 13px;
  overflow-x: hidden;

  .home-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;
  }

  .home-view-switch {
    display: inline-flex;
    padding: 3px;
    background: #e8eef7;
    border-radius: 10px;
  }

  .home-view-btn {
    border: 0;
    background: transparent;
    height: 32px;
    padding: 0 18px;
    font-size: 13px;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    line-height: 32px;
  }

  .home-view-btn.active {
    background: #fff;
    color: var(--current-color, #2563eb);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  }

  .home-todo-grid,
  .home-kpi-grid {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }

  .home-todo-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-todo-grid.is-full {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .home-kpi-grid.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-kpi-grid.cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .home-todo-card,
  .home-kpi-card,
  .home-board {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 28px rgba(37, 99, 235, 0.06);
    border: 1px solid #eef2f7;
    box-sizing: border-box;
  }

  .home-todo-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 16px;
    min-height: 92px;
    cursor: pointer;
    min-width: 0;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .home-todo-card:hover {
    box-shadow: 0 10px 32px rgba(37, 99, 235, 0.12);
  }

  .home-todo-title {
    font-size: 15px;
    font-weight: 650;
    color: #0f172a;
  }

  .home-todo-hint {
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
  }

  .home-todo-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #edf4ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .home-todo-badge.is-num {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .home-todo-card.warn .home-todo-badge {
    background: #fff1f2;
    color: #e11d48;
  }

  .home-kpi-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 16px 14px;
    min-width: 0;
    min-height: 108px;
  }

  .home-kpi-row {
    display: flex;
    align-items: center;
  }

  .home-kpi-num {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .home-kpi-icon {
    margin-left: 8px;
    color: #93c5fd;
    font-size: 16px;
  }

  .home-kpi-label {
    margin-top: 8px;
    color: #64748b;
  }

  .home-kpi-delta {
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
  }
  .home-kpi-delta.is-up { color: #16a34a; }
  .home-kpi-delta.is-down { color: #e11d48; }

  .home-kpi-side {
    font-size: 22px;
    font-weight: 650;
    color: #2563eb;
    font-variant-numeric: tabular-nums;
    padding-top: 2px;
  }
  .home-kpi-side.is-down { color: #e11d48; }
  .home-kpi-side.is-flat { color: #94a3b8; }

  .home-chart-row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .home-board {
    padding: 16px 16px 12px;
    min-width: 0;
  }

  .home-board-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 15px;
    font-weight: 650;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .home-board-sub {
    font-size: 12px;
    font-weight: 400;
    color: #94a3b8;
  }

  .home-trend-chart {
    height: 280px;
  }

  .home-pie-chart {
    height: 280px;
  }

  .home-data-table {
    width: 100%;
  }

  ::v-deep .home-data-table {
    &::before { display: none; }
    th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
    }
    td, th {
      border-bottom: 1px solid #f1f5f9;
    }
    .el-table__row {
      cursor: pointer;
    }
    .is-warn-row td {
      background: #fff7f8;
    }
  }

  .home-tag {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 20px;
  }
  .home-tag.is-ok {
    background: #ecfdf3;
    color: #15803d;
  }
  .home-tag.is-warn {
    background: #fff1f2;
    color: #e11d48;
  }
  .home-tag.is-soon {
    background: #fff7ed;
    color: #c2410c;
  }

  .home-menu-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 8px;
    padding: 8px 0 6px;
  }

  .home-menu-tile {
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 10px 4px 8px;
    border-radius: 12px;
    color: #334155;
  }

  .home-menu-tile:hover {
    background: #f8fafc;
    color: var(--current-color, #2563eb);
  }

  .home-menu-tile-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    font-size: 22px;
    color: #2563eb;
  }

  .home-menu-tile-title {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.3;
  }

  .home-cabin-empty {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .home-cabin-empty--pie { min-height: 220px; }
  .home-cabin-empty--menu { min-height: 64px; padding: 8px 0; }

  .home-cabin-empty-plot {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 6px;
    width: 56%;
    max-width: 220px;
    height: 72px;
    opacity: 0.7;
  }

  .home-cabin-empty-plot i {
    display: block;
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(180deg, #93c5fd, #eff6ff);
  }
  .home-cabin-empty-plot i:nth-child(1) { height: 22%; }
  .home-cabin-empty-plot i:nth-child(2) { height: 38%; }
  .home-cabin-empty-plot i:nth-child(3) { height: 28%; }
  .home-cabin-empty-plot i:nth-child(4) { height: 52%; }
  .home-cabin-empty-plot i:nth-child(5) { height: 34%; }
  .home-cabin-empty-plot i:nth-child(6) { height: 44%; }
  .home-cabin-empty-plot i:nth-child(7) { height: 26%; }

  .home-cabin-empty-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 10px solid #e2e8f0;
    border-top-color: #3b82f6;
    box-sizing: border-box;
  }

  .home-cabin-empty-text {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
    text-align: center;
  }

  @media (max-width: 1400px) {
    .home-todo-grid,
    .home-todo-grid.is-full,
    .home-kpi-grid.cols-4,
    .home-kpi-grid.cols-6 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .home-chart-row {
      grid-template-columns: 1fr;
    }
    .home-menu-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
}
</style>
