<template>
  <div class="app-container home home-workbench">
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

    <!-- 科室工作台 -->
    <div v-show="homeView === 'dept'" class="home-panel">
      <div class="home-todo-grid">
        <div
          v-for="todo in deptTodos"
          :key="todo.key"
          class="home-todo-card"
          :class="{ warn: todo.count > 0, calm: !todo.count }"
          role="button"
          tabindex="0"
          @click="openTodo(todo)"
          @keyup.enter="openTodo(todo)"
        >
          <div class="home-todo-num">{{ formatStatQty(todo.count) }}</div>
          <div class="home-todo-label">{{ todo.label }}</div>
          <div class="home-todo-hint">{{ todo.hint }}</div>
        </div>
      </div>
      <div class="home-kpi-grid home-kpi-grid--3">
        <div v-for="kpi in deptKpiCards" :key="kpi.key" class="home-kpi-card" :class="{ stock: kpi.stock }">
          <div class="home-kpi-top">
            <div class="home-kpi-label">{{ kpi.label }}</div>
            <div class="home-kpi-delta" :class="kpi.deltaClass">{{ kpi.deltaText }}</div>
          </div>
          <div class="home-kpi-num">{{ formatStatQty(kpi.value) }}</div>
          <svg v-if="kpi.spark" class="home-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <polyline :points="kpi.spark" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
      <el-card class="home-menu-card" shadow="never">
        <div slot="header" class="clearfix">常用菜单</div>
        <div v-if="displayMenus.length" class="home-freq-list">
          <button
            v-for="m in displayMenus"
            :key="m.path"
            type="button"
            class="home-freq-item"
            @click="goMenu(m)"
          ><span class="home-freq-dot" /><span>{{ m.title }}</span></button>
        </div>
        <div v-else class="home-cabin-empty home-cabin-empty--menu">
          <p class="home-cabin-empty-text">暂无常用菜单，使用功能后按频率出现在这里</p>
        </div>
      </el-card>
    </div>

    <!-- 仓库工作台 -->
    <div v-show="homeView === 'warehouse'" class="home-panel">
      <div class="home-todo-grid">
        <div
          v-for="todo in warehouseTodos"
          :key="todo.key"
          class="home-todo-card"
          :class="{ warn: todo.count > 0, calm: !todo.count }"
          role="button"
          tabindex="0"
          @click="openTodo(todo)"
          @keyup.enter="openTodo(todo)"
        >
          <div class="home-todo-num">{{ formatStatQty(todo.count) }}</div>
          <div class="home-todo-label">{{ todo.label }}</div>
          <div class="home-todo-hint">{{ todo.hint }}</div>
        </div>
      </div>
      <div class="home-kpi-grid home-kpi-grid--4">
        <div v-for="kpi in warehouseKpiCards" :key="'wh-' + kpi.key" class="home-kpi-card" :class="{ stock: kpi.stock }">
          <div class="home-kpi-top">
            <div class="home-kpi-label">{{ kpi.label }}</div>
            <div class="home-kpi-delta" :class="kpi.deltaClass">{{ kpi.deltaText }}</div>
          </div>
          <div class="home-kpi-num">{{ formatStatQty(kpi.value) }}</div>
          <svg v-if="kpi.spark" class="home-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <polyline :points="kpi.spark" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
      <el-card class="home-menu-card" shadow="never">
        <div slot="header" class="clearfix">常用菜单</div>
        <div v-if="displayMenus.length" class="home-freq-list">
          <button
            v-for="m in displayMenus"
            :key="'wh-' + m.path"
            type="button"
            class="home-freq-item"
            @click="goMenu(m)"
          ><span class="home-freq-dot" /><span>{{ m.title }}</span></button>
        </div>
        <div v-else class="home-cabin-empty home-cabin-empty--menu">
          <p class="home-cabin-empty-text">暂无常用菜单，使用功能后按频率出现在这里</p>
        </div>
      </el-card>
    </div>

    <!-- 全局驾驶舱 -->
    <div v-if="homeView === 'global'" class="home-panel">
      <div class="home-todo-grid home-todo-grid--compact">
        <div
          v-for="todo in globalTodos"
          :key="'g-' + todo.key"
          class="home-todo-card home-todo-card--compact"
          :class="{ warn: todo.count > 0, calm: !todo.count }"
          role="button"
          tabindex="0"
          @click="openTodo(todo)"
          @keyup.enter="openTodo(todo)"
        >
          <div class="home-todo-num">{{ formatStatQty(todo.count) }}</div>
          <div class="home-todo-label">{{ todo.label }}</div>
        </div>
      </div>
      <el-row :gutter="homeLayoutGap" class="home-dashboard-row">
        <el-col :xs="24" :sm="24" :md="12" :lg="8">
          <el-card class="update-log" style="height:42vh;">
            <div slot="header" class="clearfix"><span>仓库采购情况</span></div>
            <div class="body">
              <div v-if="ckChartEmptyHint" class="home-cabin-empty">
                <div class="home-cabin-empty-plot" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
                <p class="home-cabin-empty-text">{{ ckChartEmptyHint }}</p>
              </div>
              <div v-show="!ckChartEmptyHint" ref="ckChartRef" class="echart" :style="myChartStyle"></div>
            </div>
          </el-card>
          <el-card class="update-log" style="height:43vh;margin-top: 2vh">
            <div slot="header" class="clearfix"><span>科室使用记录情况</span></div>
            <div class="body">
              <div v-if="ksChartEmptyHint" class="home-cabin-empty">
                <div class="home-cabin-empty-plot" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
                <p class="home-cabin-empty-text">{{ ksChartEmptyHint }}</p>
              </div>
              <div v-show="!ksChartEmptyHint" ref="ksChartRef" class="echart" :style="myChartStyle"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="9">
          <el-card class="update-log home-today-stats-card">
            <div slot="header" class="clearfix"><span>今日统计</span></div>
            <div class="body home-today-stats-body">
              <div class="home-kpi-grid home-kpi-grid--3 home-kpi-grid--global">
                <div v-for="kpi in globalKpiCards" :key="'g-' + kpi.key" class="home-kpi-card" :class="{ stock: kpi.stock }">
                  <div class="home-kpi-top">
                    <div class="home-kpi-label">{{ kpi.label }}</div>
                    <div class="home-kpi-delta" :class="kpi.deltaClass">{{ kpi.deltaText }}</div>
                  </div>
                  <div class="home-kpi-num">{{ formatStatQty(kpi.value) }}</div>
                  <svg v-if="kpi.spark" class="home-spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
                    <polyline :points="kpi.spark" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </el-card>
          <el-card class="update-log home-proportion-card home-outbound-only-card">
            <div slot="header" class="clearfix">
              <span>出库统计占比</span>
              <span class="home-chart-subtitle">当月财务分类出退库</span>
            </div>
            <div class="body">
              <div v-if="outChartEmptyHint" class="home-cabin-empty home-cabin-empty--pie">
                <div class="home-cabin-empty-ring" aria-hidden="true" />
                <p class="home-cabin-empty-text">{{ outChartEmptyHint }}</p>
              </div>
              <div v-show="!outChartEmptyHint" ref="outChartRef" class="echart home-proportion-pie"></div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="7" class="home-right-col">
          <el-card class="update-log home-menu-card home-global-menu-card" shadow="never">
            <div slot="header" class="clearfix">常用菜单</div>
            <div v-if="displayMenus.length" class="home-freq-list">
              <button
                v-for="m in displayMenus"
                :key="'g-' + m.path"
                type="button"
                class="home-freq-item"
                @click="goMenu(m)"
              ><span class="home-freq-dot" /><span>{{ m.title }}</span></button>
            </div>
            <div v-else class="home-cabin-empty home-cabin-empty--menu">
              <p class="home-cabin-empty-text">暂无常用菜单</p>
            </div>
          </el-card>
          <el-card class="update-log home-proportion-card home-inbound-card">
            <div slot="header" class="clearfix">
              <span>入库统计占比</span>
              <span class="home-chart-subtitle">当月财务分类入退货</span>
            </div>
            <div class="body">
              <div v-if="inChartEmptyHint" class="home-cabin-empty home-cabin-empty--pie">
                <div class="home-cabin-empty-ring" aria-hidden="true" />
                <p class="home-cabin-empty-text">{{ inChartEmptyHint }}</p>
              </div>
              <div v-show="!inChartEmptyHint" ref="inChartRef" class="echart home-proportion-pie"></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
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
    fetchHomeWarehousePurchase,
    fetchHomeDepartmentUsage,
    fetchHomeTodayStats,
    fetchHomeOutboundFinanceCategoryProportion,
    fetchHomeInboundFinanceCategoryProportion,
    fetchHomeWarehouseReminderCounts,
    fetchHomeDepartmentReminderCounts,
    fetchHomePref,
    saveHomePref,
    fetchFrequentMenus,
    fetchHomeKpiTrend
  } from "@/api/dashboard/home";
  import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";
  import { collectLeafMenus } from "@/utils/nav-menu";

const HOME_VIEW_UI_KEY = "spd.homeView";
export default {
  name: "Index",
  data() {
    return {
      /** 与 .home 内边距一致：列间距 = 顶部留白 = 左右卡片间距 */
      homeLayoutGap: 16,
      viewOptions: [
        { value: "dept", label: "科室视角" },
        { value: "warehouse", label: "仓库视角" },
        { value: "global", label: "全局驾驶舱" }
      ],
      homeView: "dept",
      savedView: "dept",
      savingPref: false,
      globalChartsLoaded: false,
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
      /** 仓库采购图无仓库或无系列时的提示 */
      ckChartEmptyHint: "",
      /** 科室使用图加载失败或无数据时的提示 */
      ksChartEmptyHint: "",
      outChartInstance: null,
      outResizeHandler: null,
      _outInitRetries: 0,
      outChartSlices: [],
      /** 出库占比图无数据或加载失败时的提示 */
      outChartEmptyHint: "",
      inChartInstance: null,
      inResizeHandler: null,
      _inInitRetries: 0,
      inChartSlices: [],
      /** 入库占比图无数据或加载失败时的提示 */
      inChartEmptyHint: ""
    };
  },
  computed: {
    deptTodos() {
      return [
        { key: "unreceived", label: "待收货确认", hint: "已出库未确认", count: this.deptCounts.unreceivedBillCount, open: { category: "department", subTab: "unreceivedConfirm" } },
        { key: "expiry", label: "近效期", hint: "科室库存近效期", count: this.deptCounts.nearExpiryLineCount, open: { category: "department", subTab: "expiry" } },
        { key: "alert", label: "库存预警", hint: "低于下限或超上限", count: this.deptCounts.inventoryAlertLineCount, open: { category: "department", subTab: "inventory" } },
        { key: "consume", label: "待消耗", hint: "HIS待处理消耗", count: this.deptCounts.consumeLineCount, open: { category: "department", subTab: "consume" } }
      ];
    },
    warehouseTodos() {
      return [
        { key: "apply", label: "待审申领", hint: "待审核申领单", count: this.warehouseCounts.pendingApplyBillCount, open: { category: "warehouse", subTab: "apply" } },
        { key: "purchase", label: "待审申购", hint: "待审核申购单", count: this.warehouseCounts.pendingPurchaseBillCount, open: { category: "warehouse", subTab: "purchase" } },
        { key: "nearExpiry", label: "近效期", hint: "仓库近效期库存", count: this.warehouseCounts.nearExpiryInventoryLineCount, open: { category: "warehouse", subTab: "nearExpiry" } },
        { key: "inventory", label: "库存预警", hint: "仓库库存预警", count: this.warehouseCounts.inventoryAlertLineCount, open: { category: "warehouse", subTab: "inventory" } }
      ];
    },
    globalTodos() {
      return [
        { key: "g-apply", label: "待审申领", count: this.warehouseCounts.pendingApplyBillCount, open: { category: "warehouse", subTab: "apply" } },
        { key: "g-purchase", label: "待审申购", count: this.warehouseCounts.pendingPurchaseBillCount, open: { category: "warehouse", subTab: "purchase" } },
        { key: "g-recv", label: "待收货", count: this.deptCounts.unreceivedBillCount, open: { category: "department", subTab: "unreceivedConfirm" } },
        { key: "g-wh-exp", label: "仓库近效期", count: this.warehouseCounts.nearExpiryInventoryLineCount, open: { category: "warehouse", subTab: "nearExpiry" } },
        { key: "g-dep-exp", label: "科室近效期", count: this.deptCounts.nearExpiryLineCount, open: { category: "department", subTab: "expiry" } },
        { key: "g-consume", label: "待消耗", count: this.deptCounts.consumeLineCount, open: { category: "department", subTab: "consume" } }
      ];
    },
    displayMenus() {
      if (this.frequentMenus.length) {
        return this.frequentMenus.slice(0, 8);
      }
      return collectLeafMenus(this.$store.getters.sidebarRouters, 8);
    },
    deptKpiCards() {
      return [
        this.buildKpiCard("applyCount", "今日申领数量"),
        this.buildKpiCard("purchaseCount", "今日申购数量"),
        this.buildKpiCard("inventoryQty", "库存数量", true)
      ];
    },
    warehouseKpiCards() {
      return [
        this.buildKpiCard("inCount", "今日入库"),
        this.buildKpiCard("outCount", "今日出库"),
        this.buildKpiCard("returnCount", "今日退库"),
        this.buildKpiCard("inventoryQty", "库存数量", true)
      ];
    },
    globalKpiCards() {
      return [
        this.buildKpiCard("inCount", "入库"),
        this.buildKpiCard("outCount", "出库"),
        this.buildKpiCard("returnCount", "退库"),
        this.buildKpiCard("applyCount", "申领"),
        this.buildKpiCard("purchaseCount", "申购"),
        this.buildKpiCard("inventoryQty", "库存", true)
      ];
    }
  },
  watch: {
    homeView(val) {
      if (val === "global") {
        this.$nextTick(() => this.ensureGlobalCharts());
      }
    }
  },
  mounted() {
    this.bootstrapHome();
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
    if (this.outResizeHandler) {
      window.removeEventListener("resize", this.outResizeHandler);
    }
    if (this.outChartInstance) {
      this.outChartInstance.dispose();
      this.outChartInstance = null;
    }
    if (this.inResizeHandler) {
      window.removeEventListener("resize", this.inResizeHandler);
    }
    if (this.inChartInstance) {
      this.inChartInstance.dispose();
      this.inChartInstance = null;
    }
  },
  methods: {
    async bootstrapHome() {
      const { day } = this.buildTodayRange();
      this.restoreTodayStatsFromCache(day);
      await this.loadPref();
      this.loadTodayStats();
      this.loadKpiTrend();
      this.loadTodoCounts();
      this.loadFrequentMenus();
      if (this.homeView === "global") {
        this.$nextTick(() => this.ensureGlobalCharts());
      }
    },
    normalizeView(view) {
      const v = view ? String(view).toLowerCase() : "";
      if (v === "dept" || v === "warehouse" || v === "global") {
        return v;
      }
      return "dept";
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
      let view = "dept";
      if (prefApiOk && prefView && prefView !== "dept") {
        view = prefView;
      } else if (uiView) {
        view = uiView;
        if (prefApiOk && prefView !== uiView) {
          saveHomePref(uiView).catch(() => {});
        }
      } else if (prefApiOk) {
        view = prefView || "dept";
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
            hitCount: item.hitCount || item.hit_count || item.HITCOUNT
          }))
          .filter((item) => item.path);
      } catch (e) {
        this.frequentMenus = [];
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
    ensureGlobalCharts() {
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
      if (!this.globalChartsLoaded) {
        this.globalChartsLoaded = true;
        this.loadWarehousePurchaseChart();
        this.loadDepartmentUsageChart();
        this.loadOutboundProportionChart();
        this.loadInboundProportionChart();
      } else {
        this.$nextTick(() => {
          if (this.ckChartInstance) this.ckChartInstance.resize();
          if (this.ksChartInstance) this.ksChartInstance.resize();
          if (this.outChartInstance) this.outChartInstance.resize();
          if (this.inChartInstance) this.inChartInstance.resize();
        });
      }
    },
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
          this.ckChartEmptyHint = "今日暂无业务流动";
          this.initCk();
          return;
        }
        this.CKxData = d.monthLabels || [];
        const warehouses = (d.warehouses || []).filter(item => item && item.id && item.name);
        if (!warehouses.length) {
          this.CKtitle = [];
          this.CKyData = [];
          this.ckQtyMap = {};
          this.ckChartEmptyHint = "今日暂无业务流动";
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
        this.ckChartEmptyHint = "今日暂无业务流动";
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
          this.ksChartEmptyHint = "今日暂无业务流动";
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
        this.ksChartEmptyHint = "今日暂无业务流动";
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
      return Number.isFinite(num) ? num.toLocaleString("zh-CN", { maximumFractionDigits: 3 }) : "0";
    },
    zeroSeries(len) {
      const n = Number(len) || 7;
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(0);
      }
      return out;
    },
    buildKpiCard(key, label, stock) {
      const value = Number(this.todayStats[key]) || 0;
      if (stock) {
        return { key, label, value, stock: true, spark: "", deltaText: "实时存量", deltaClass: "is-flat" };
      }
      const yesterday = Number((this.kpiYesterday && this.kpiYesterday[key]) || 0) || 0;
      const src = Array.isArray(this.kpiSeries[key]) ? this.kpiSeries[key].slice() : this.zeroSeries(7);
      if (src.length) {
        src[src.length - 1] = value;
      }
      const delta = this.formatKpiDelta(value, yesterday);
      return {
        key,
        label,
        value,
        stock: false,
        spark: this.sparklinePoints(src),
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
    sparklinePoints(arr) {
      const src = Array.isArray(arr) && arr.length ? arr.map((v) => Number(v) || 0) : [0, 0, 0, 0, 0, 0, 0];
      const w = 100;
      const h = 28;
      const pad = 3;
      const max = Math.max.apply(null, src);
      const min = Math.min.apply(null, src);
      const span = max - min;
      return src.map((v, i) => {
        const x = src.length === 1 ? w / 2 : (i / (src.length - 1)) * w;
        const y = span <= 0 ? h * 0.68 : pad + (1 - (v - min) / span) * (h - pad * 2);
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
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
        // 后端未加载新接口时，退化为昨日 todayStats + 末点为今日
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
          this.initFinancePieChart("out");
          return;
        }
        this.$nextTick(() => this.initFinancePieChart("out"));
      } catch (e) {
        console.error("加载出库统计占比失败", e);
        this.outChartSlices = [];
        this.outChartEmptyHint = "本月暂无分类数据";
        this.initFinancePieChart("out");
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
          this.initFinancePieChart("in");
          return;
        }
        this.$nextTick(() => this.initFinancePieChart("in"));
      } catch (e) {
        console.error("加载入库统计占比失败", e);
        this.inChartSlices = [];
        this.inChartEmptyHint = "本月暂无分类数据";
        this.initFinancePieChart("in");
      }
    },
    initFinancePieChart(kind) {
      const isOut = kind === "out";
      const emptyHint = isOut ? this.outChartEmptyHint : this.inChartEmptyHint;
      const slices = isOut ? this.outChartSlices : this.inChartSlices;
      const refName = isOut ? "outChartRef" : "inChartRef";
      const instanceKey = isOut ? "outChartInstance" : "inChartInstance";
      const resizeKey = isOut ? "outResizeHandler" : "inResizeHandler";
      const retryKey = isOut ? "_outInitRetries" : "_inInitRetries";
      const seriesName = isOut ? "出库统计占比" : "入库统计占比";

      if (emptyHint) {
        if (this[instanceKey]) {
          this[instanceKey].dispose();
          this[instanceKey] = null;
        }
        this[retryKey] = 0;
        return;
      }
      if (!Array.isArray(slices) || !slices.length) {
        return;
      }
      const el = this.$refs[refName];
      if (!el || typeof el.getBoundingClientRect !== "function") {
        if (this[retryKey] < 10) {
          this[retryKey] += 1;
          this.$nextTick(() => this.initFinancePieChart(kind));
        }
        return;
      }
      this[retryKey] = 0;
      try {
        const colors = ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc"];
        const seriesData = slices.map((s) => ({
          name: s.name,
          value: s.value > 0 ? s.value : 1,
          realAmt: s.value > 0 ? s.value : 0
        }));
        const option = {
          color: colors,
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
            orient: "horizontal",
            bottom: 0,
            left: "center",
            data: seriesData.map((d) => d.name),
            textStyle: { fontSize: 11 }
          },
          series: [
            {
              name: seriesName,
              type: "pie",
              radius: ["32%", "56%"],
              center: ["50%", "42%"],
              avoidLabelOverlap: true,
              label: {
                fontSize: 10,
                formatter: "{d}%"
              },
              data: seriesData
            }
          ]
        };
        if (!this[instanceKey]) {
          this[instanceKey] = echarts.init(el);
        }
        this[instanceKey].setOption(option, true);
        this.$nextTick(() => {
          if (this[instanceKey]) {
            this[instanceKey].resize();
          }
        });
        if (!this[resizeKey]) {
          this[resizeKey] = () => {
            if (this[instanceKey]) {
              this[instanceKey].resize();
            }
          };
          window.addEventListener("resize", this[resizeKey]);
        }
      } catch (err) {
        console.error("initFinancePieChart", kind, err);
        if (isOut) {
          this.outChartEmptyHint = "本月暂无分类数据";
        } else {
          this.inChartEmptyHint = "本月暂无分类数据";
        }
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
          title: { text: "" },
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
          legend: { data: this.CKtitle },
          grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
          toolbox: { feature: { saveAsImage: {} } },
          xAxis: { type: "category", boundaryGap: false, data: this.CKxData },
          yAxis: { type: "value" },
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
        this.ckChartEmptyHint = "今日暂无业务流动";
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
          title: { text: "" },
          tooltip: { trigger: "axis" },
          legend: { data: this.KStitle },
          grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
          toolbox: { feature: { saveAsImage: {} } },
          xAxis: {
            type: "category",
            boundaryGap: false,
            axisLabel: { interval: 0 },
            data: this.KSxData
          },
          yAxis: { type: "value" },
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
        this.ksChartEmptyHint = "今日暂无业务流动";
      }
    }
  }
};
</script>

<style scoped lang="scss">
.home {
  margin-top: 0;
  padding: 16px;
  box-sizing: border-box;
  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

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
    background: #f1f5f9;
    border-radius: 8px;
  }

  .home-view-btn {
    border: 0;
    background: transparent;
    height: 32px;
    padding: 0 16px;
    font-size: 13px;
    color: #64748b;
    border-radius: 6px;
    cursor: pointer;
    line-height: 32px;
  }

  .home-view-btn.active {
    background: #fff;
    color: var(--current-color, #2563eb);
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  }

  .home-save-default {
    flex-shrink: 0;
  }

  .home-todo-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
    width: 100%;
    box-sizing: border-box;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-todo-grid--compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1600px) {
    .home-todo-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .home-todo-grid--compact {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .home-kpi-grid--3,
    .home-kpi-grid--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 992px) {
    .home-todo-grid,
    .home-todo-grid--compact,
    .home-kpi-grid--3,
    .home-kpi-grid--4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .home-todo-card {
    background: #fff;
    border: 1px solid #e8ecf1;
    border-radius: 8px;
    padding: 16px 14px 14px;
    cursor: pointer;
    min-height: 108px;
    min-width: 0;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .home-todo-card:hover {
    border-color: var(--current-color, #2563eb);
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
  }

  .home-todo-card.calm .home-todo-num {
    color: #94a3b8;
  }

  .home-todo-card.warn {
    border-color: #fecaca;
  }

  .home-todo-card.warn .home-todo-num {
    color: #dc2626;
  }

  .home-todo-card--compact {
    min-height: 88px;
    padding: 12px;
  }

  .home-todo-num {
    font-size: 28px;
    line-height: 1.1;
    font-weight: 650;
    color: var(--current-color, #2563eb);
    font-variant-numeric: tabular-nums;
  }

  .home-todo-label {
    margin-top: 8px;
    font-size: 14px;
    color: #0f172a;
    font-weight: 600;
  }

  .home-todo-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #94a3b8;
  }

  .home-kpi-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
  }

  .home-kpi-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-kpi-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .home-kpi-grid--global {
    margin: 0;
    width: 100%;
    gap: 10px;
  }

  .home-kpi-card {
    background: #fff;
    border: 1px solid #e8ecf1;
    border-radius: 8px;
    padding: 14px 14px 10px;
    min-width: 0;
  }

  .home-kpi-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .home-kpi-label {
    font-size: 13px;
    color: #64748b;
  }

  .home-kpi-delta {
    font-size: 11px;
    white-space: nowrap;
    color: #94a3b8;
  }
  .home-kpi-delta.is-up { color: #16a34a; }
  .home-kpi-delta.is-down { color: #dc2626; }
  .home-kpi-delta.is-flat { color: #94a3b8; }

  .home-kpi-num {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 650;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .home-spark {
    display: block;
    width: 100%;
    height: 28px;
    margin-top: 8px;
    color: var(--current-color, #2563eb);
    opacity: 0.85;
  }

  .home-kpi-card.stock .home-spark {
    display: none;
  }

  .home-menu-card {
    border: 1px solid #e8ecf1;
  }

  .home-freq-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .home-freq-item {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #334155;
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    line-height: 1.4;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .home-freq-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--current-color, #2563eb);
    flex-shrink: 0;
  }

  .home-freq-item:hover {
    border-color: var(--current-color, #2563eb);
    color: var(--current-color, #2563eb);
    background: #fff;
  }

  .home-empty-tip {
    color: #94a3b8;
    font-size: 13px;
    padding: 8px 0 4px;
  }

  .home-cabin-empty {
    min-height: 28vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px;
    box-sizing: border-box;
  }

  .home-cabin-empty--pie {
    min-height: 20vh;
  }

  .home-cabin-empty--menu {
    min-height: 64px;
    padding: 8px 0;
  }

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
    background: linear-gradient(180deg, #cbd5e1, #f1f5f9);
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
    border-top-color: #94a3b8;
    box-sizing: border-box;
  }

  .home-cabin-empty-text {
    margin: 0;
    color: #94a3b8;
    font-size: 13px;
    text-align: center;
    line-height: 1.6;
  }

  .home-alert-row {
    margin-bottom: 4px;
  }

  .home-global-menu-card {
    margin-bottom: 2vh;
  }

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

  .home-today-stats-card {
    height: 42vh;

    ::v-deep .el-card__body {
      height: calc(42vh - 52px);
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      box-sizing: border-box;
      overflow: auto;
    }
  }

  .home-today-stats-body {
    width: 100%;
    text-align: left;
  }

  .home-today-stats-row {
    text-align: center;

    .el-col {
      text-align: center;
      font-size: 15px;
      line-height: 1.5;
    }

    &.tj-number .el-col {
      font-size: 1.85rem;
      color: #0000ff;
      font-weight: 500;
      line-height: 1.35;
      padding-top: 0.45rem;
      padding-bottom: 0.45rem;
    }
  }

  .home-proportion-row {
    margin-top: 2vh;
  }

  .home-outbound-only-card {
    margin-top: 2vh;
  }

  .home-proportion-card {
    height: 43vh;
  }

  .home-proportion-pie {
    width: 100%;
    height: 34vh;
  }

  .home-proportion-empty {
    min-height: 20vh;
  }

  .home-right-col {
    display: flex;
    flex-direction: column;
  }

  .home-right-top-block {
    height: 42vh;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .home-attachment-card {
    height: 16vh;
    flex-shrink: 0;
  }

  .home-memo-card {
    margin-top: 2vh;
    flex: 1;
    min-height: 0;
  }

  .home-inbound-card {
    margin-top: 2vh;
    flex-shrink: 0;
  }

  .home-card-more-link {
    float: right;
    font-size: 10px;
  }

  .home-chart-subtitle {
    float: right;
    font-size: 11px;
    color: #909399;
    font-weight: normal;
    max-width: 55%;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

