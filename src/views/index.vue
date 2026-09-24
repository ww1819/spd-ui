<template>
  <div class="app-container home home-workbench" :class="'is-' + homeView">
    <div v-if="isPlaceholderHome" class="home-placeholder-board">
      <p class="home-placeholder-title">{{ placeholderTitle }}</p>
      <p class="home-placeholder-hint">内容建设中，后续按角色逐步完善</p>
    </div>
    <template v-else>
    <div
      class="home-top-grid"
      :class="(isPurchaseHome || isWarehouseHome || isDepartmentHome) ? 'cols-5' : (isFull ? 'cols-12' : 'cols-8')"
    >
      <template v-if="isPurchaseHome">
        <div
          v-for="(card, idx) in purchaseCards"
          :key="card.key"
          class="home-todo-card home-purchase-card"
          :class="['tone-' + (idx % 6), { warn: card.warn }]"
          role="button"
          tabindex="0"
          @click="openPurchaseCard(card)"
          @keyup.enter="openPurchaseCard(card)"
        >
          <div class="home-todo-copy">
            <div class="home-todo-title">{{ card.label }}</div>
            <div class="home-todo-hint">{{ card.hint }}</div>
          </div>
          <div class="home-todo-badge" :class="{ 'is-num': card.showCount }">
            <span v-if="card.showCount">{{ card.display }}</span>
            <i v-else :class="card.icon" />
          </div>
        </div>
      </template>
      <template v-else-if="isWarehouseHome">
        <div
          v-for="(card, idx) in warehouseCards"
          :key="card.key"
          class="home-todo-card home-purchase-card"
          :class="['tone-' + (idx % 6), { warn: card.warn }]"
          role="button"
          tabindex="0"
          @click="openWarehouseCard(card)"
          @keyup.enter="openWarehouseCard(card)"
        >
          <div class="home-todo-copy">
            <div class="home-todo-title">{{ card.label }}</div>
            <div class="home-todo-hint">{{ card.hint }}</div>
          </div>
          <div class="home-todo-badge" :class="{ 'is-num': card.showCount }">
            <span v-if="card.showCount">{{ card.display }}</span>
            <i v-else :class="card.icon" />
          </div>
        </div>
      </template>
      <template v-else-if="isDepartmentHome">
        <div
          v-for="(card, idx) in departmentCards"
          :key="card.key"
          class="home-todo-card home-purchase-card"
          :class="['tone-' + (idx % 6), { warn: card.warn }]"
          role="button"
          tabindex="0"
          @click="openDepartmentCard(card)"
          @keyup.enter="openDepartmentCard(card)"
        >
          <div class="home-todo-copy">
            <div class="home-todo-title">{{ card.label }}</div>
            <div class="home-todo-hint">{{ card.hint }}</div>
          </div>
          <div class="home-todo-badge" :class="{ 'is-num': card.showCount }">
            <span v-if="card.showCount">{{ card.display }}</span>
            <i v-else :class="card.icon" />
          </div>
        </div>
      </template>
      <template v-else>
      <div
        v-for="(kpi, idx) in visibleKpis"
        :key="kpi.key"
        class="home-kpi-card"
        :class="['tone-' + (idx % 6), { warn: kpi.deltaClass === 'is-down' }]"
      >
        <div class="home-kpi-icon-box">
          <i :class="kpi.icon || 'el-icon-data-line'" />
        </div>
        <div class="home-kpi-copy">
          <div class="home-kpi-label">{{ kpi.label }}</div>
          <div class="home-kpi-delta" :class="kpi.deltaClass">{{ kpi.deltaText }}</div>
        </div>
        <div class="home-kpi-nums">
          <div class="home-kpi-num">{{ formatStatQty(kpi.value) }}</div>
          <div v-if="kpi.sideText" class="home-kpi-side" :class="kpi.deltaClass">{{ kpi.sideText }}</div>
        </div>
      </div>
      <div
        v-for="(todo, idx) in visibleTodos"
        :key="todo.key"
        class="home-todo-card"
        :class="['tone-' + (idx % 6), { warn: todo.count > 0 }]"
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
      </template>
    </div>

    <div class="home-chart-row">
      <div class="home-board home-trend-board">
        <div class="home-board-head">
          <span>{{ trendChartTitle }}</span>
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
          <span>{{ pieChartTitle }}</span>
          <span class="home-board-sub">{{ pieChartSub }}</span>
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
      <div class="home-board-head">
        <span>常用菜单</span>
        <button
          type="button"
          class="home-menu-edit-btn"
          title="设置常用菜单"
          @click="openMenuSetting"
        >
          <i class="el-icon-edit-outline" />
        </button>
      </div>
      <div v-if="displayMenus.length" class="home-menu-carousel-wrap">
        <el-carousel
          v-if="menuPages.length > 1"
          :interval="4000"
          :autoplay="true"
          arrow="hover"
          indicator-position="outside"
          height="196px"
          class="home-menu-carousel"
        >
          <el-carousel-item v-for="(page, pIdx) in menuPages" :key="'menu-page-' + pIdx">
            <div class="home-menu-grid">
              <button
                v-for="(m, idx) in page"
                :key="m.path"
                type="button"
                class="home-menu-tile"
                :class="'tone-' + ((pIdx * FREQUENT_MENU_PAGE_SIZE + idx) % FREQUENT_MENU_PAGE_SIZE)"
                @click="goMenu(m)"
              >
                <span class="home-menu-tile-icon">
                  <span class="home-menu-tile-icon-inner">
                    <svg-icon v-if="menuSvgName(m)" :icon-class="menuSvgName(m)" />
                    <i v-else class="el-icon-menu" />
                  </span>
                </span>
                <span class="home-menu-tile-title">{{ m.title }}</span>
              </button>
            </div>
          </el-carousel-item>
        </el-carousel>
        <div v-else class="home-menu-grid">
          <button
            v-for="(m, idx) in displayMenus"
            :key="m.path"
            type="button"
            class="home-menu-tile"
            :class="'tone-' + (idx % FREQUENT_MENU_PAGE_SIZE)"
            @click="goMenu(m)"
          >
            <span class="home-menu-tile-icon">
              <span class="home-menu-tile-icon-inner">
                <svg-icon v-if="menuSvgName(m)" :icon-class="menuSvgName(m)" />
                <i v-else class="el-icon-menu" />
              </span>
            </span>
            <span class="home-menu-tile-title">{{ m.title }}</span>
          </button>
        </div>
      </div>
      <div v-else class="home-cabin-empty home-cabin-empty--menu">
        <p class="home-cabin-empty-text">{{ menuEmptyHint }}</p>
      </div>
    </div>

    <el-dialog
      title="设置常用菜单"
      :visible.sync="menuSettingVisible"
      width="560px"
      append-to-body
      custom-class="home-menu-setting-dialog"
    >
      <p class="home-menu-setting-hint">仅列出当前账号有权限的菜单，最多选择 {{ FREQUENT_MENU_MAX }} 个；首页两行×8列，超出自动左右轮播</p>
      <el-checkbox-group
        v-if="permittedMenus.length"
        v-model="menuSettingChecked"
        class="home-menu-setting-list"
      >
        <el-checkbox
          v-for="m in permittedMenus"
          :key="m.path"
          :label="m.path"
          :disabled="menuSettingChecked.length >= FREQUENT_MENU_MAX && menuSettingChecked.indexOf(m.path) === -1"
        >{{ m.title }}</el-checkbox>
      </el-checkbox-group>
      <div v-else class="home-cabin-empty home-cabin-empty--menu">
        <p class="home-cabin-empty-text">当前账号暂无可设置的菜单权限</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button :disabled="menuSettingSaving" @click="resetMenuSetting">恢复自动</el-button>
        <el-button :disabled="menuSettingSaving" @click="menuSettingVisible = false">取消</el-button>
        <el-button type="primary" :loading="menuSettingSaving" @click="saveMenuSetting">确定</el-button>
      </div>
    </el-dialog>
    </template>
  </div>
</template>
<style>
  a:hover {
    color: blue;
  }

  .home-menu-setting-dialog .home-menu-setting-hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }

  .home-menu-setting-dialog .home-menu-setting-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 16px;
    max-height: 360px;
    overflow: auto;
    padding: 4px 2px;
  }

  .home-menu-setting-dialog .home-menu-setting-list .el-checkbox {
    margin-right: 0;
    display: flex;
    align-items: flex-start;
    white-space: normal;
    line-height: 1.4;
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
    fetchPurchaseHomeStats,
    fetchWarehouseHomeStats,
    fetchDepartmentHomeStats,
    fetchHomeKpiTrend,
    fetchHomeDepartmentReminderCounts
  } from "@/api/dashboard/home";
  import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";
  import { collectLeafMenus } from "@/utils/nav-menu";

const HOME_VIEW_UI_KEY = "spd.homeView";
const FREQUENT_MENU_UI_KEY = "spd.homeFrequentMenus";
/** 可选上限：两行×8列一页，多页轮播 */
const FREQUENT_MENU_MAX = 48;
const FREQUENT_MENU_COLS = 8;
const FREQUENT_MENU_ROWS = 2;
const FREQUENT_MENU_PAGE_SIZE = FREQUENT_MENU_COLS * FREQUENT_MENU_ROWS;
const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#38bdf8", "#818cf8"];
const ROLE_HOME_VIEWS = [];
const ALL_HOME_VIEW_OPTIONS = [
  { value: "simple", label: "默认" },
  { value: "full", label: "完整" },
  { value: "purchase", label: "采购" },
  { value: "warehouse", label: "库房" },
  { value: "department", label: "科室" }
];
const HOME_VIEW_ALLOW = ALL_HOME_VIEW_OPTIONS.map(o => o.value);

export default {
  name: "Index",
  data() {
    return {
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
      /** null=按点击频率自动；数组=用户自定义（仅展示仍有权限的项） */
      customMenuPaths: null,
      menuSettingVisible: false,
      menuSettingChecked: [],
      menuSettingSaving: false,
      FREQUENT_MENU_MAX,
      FREQUENT_MENU_PAGE_SIZE,
      purchaseStats: {
        pendingIssuePurchaseApplyCount: 0,
        inTransitPurchaseOrderCount: 0,
        overdueSupplierDeliveryCount: 0,
        arrivalOnTimeRateText: "--",
        pendingPriceCompareCount: 0
      },
      warehouseStats: {
        pendingStocktakingTaskCount: 0,
        stocktakingDiffLineCount: 0,
        pendingTransferBillCount: 0,
        pendingReturnAcceptQty: 0,
        overstockMaterialCount: 0
      },
      departmentStats: {
        pendingApplyAuditBillCount: 0,
        unreceivedOutboundBillCount: 0,
        nearExpiryLineCount: 0,
        departmentInventoryQty: 0,
        recentConsumeEntryCount: 0
      },
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
        purchaseCount: [0, 0, 0, 0, 0, 0, 0],
        outAmt: [0, 0, 0, 0, 0, 0, 0],
        inAmt: [0, 0, 0, 0, 0, 0, 0]
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
    /** 授权可用首页：未配置/空 → 仅「默认」 */
    allowedHomeViews() {
      const raw = this.$store.getters.homePageKeys;
      if (raw == null || !Array.isArray(raw) || raw.length === 0) {
        return ["simple"];
      }
      const allow = raw
        .map(k => String(k).toLowerCase())
        .map(k => (k === "complete" ? "full" : k))
        .filter(k => HOME_VIEW_ALLOW.includes(k));
      return allow.length ? allow : ["simple"];
    },
    viewOptions() {
      return ALL_HOME_VIEW_OPTIONS.filter(o => this.allowedHomeViews.includes(o.value));
    },
    isFull() {
      return this.homeView === "full";
    },
    isPurchaseHome() {
      return this.homeView === "purchase";
    },
    isWarehouseHome() {
      return this.homeView === "warehouse";
    },
    isDepartmentHome() {
      return this.homeView === "department";
    },
    isPlaceholderHome() {
      return ROLE_HOME_VIEWS.includes(this.homeView);
    },
    placeholderTitle() {
      const hit = ALL_HOME_VIEW_OPTIONS.find(o => o.value === this.homeView);
      return hit ? `${hit.label}首页` : "首页";
    },
    purchaseCards() {
      const s = this.purchaseStats || {};
      return [
        {
          key: "pendingIssue",
          label: "待下达采购申请",
          hint: "已审未完全编入计划",
          icon: "el-icon-s-order",
          showCount: true,
          display: this.formatStatQty(s.pendingIssuePurchaseApplyCount),
          warn: Number(s.pendingIssuePurchaseApplyCount) > 0,
          pathKeys: ["jihua"]
        },
        {
          key: "inTransit",
          label: "在途采购订单",
          hint: "已审尚未按单入库",
          icon: "el-icon-s-promotion",
          showCount: true,
          display: this.formatStatQty(s.inTransitPurchaseOrderCount),
          warn: Number(s.inTransitPurchaseOrderCount) > 0,
          pathKeys: ["dingdan"]
        },
        {
          key: "overdue",
          label: "供应商逾期到货预警",
          hint: "约定到货日已过",
          icon: "el-icon-warning-outline",
          showCount: true,
          display: this.formatStatQty(s.overdueSupplierDeliveryCount),
          warn: Number(s.overdueSupplierDeliveryCount) > 0,
          pathKeys: ["dingdan"]
        },
        {
          key: "onTimeRate",
          label: "采购到货及时率",
          hint: "近90天约定到货样本",
          icon: "el-icon-data-analysis",
          showCount: true,
          display: s.arrivalOnTimeRateText || "--",
          warn: false,
          pathKeys: ["purchaseReport"]
        },
        {
          key: "priceCompare",
          label: "待比价单据",
          hint: "比价业务待建设",
          icon: "el-icon-s-finance",
          showCount: true,
          display: this.formatStatQty(s.pendingPriceCompareCount),
          warn: false,
          pathKeys: []
        }
      ];
    },
    warehouseCards() {
      const s = this.warehouseStats || {};
      return [
        {
          key: "pendingStocktaking",
          label: "待盘点任务数量",
          hint: "仓库盘点未审核",
          icon: "el-icon-notebook-2",
          showCount: true,
          display: this.formatStatQty(s.pendingStocktakingTaskCount),
          warn: Number(s.pendingStocktakingTaskCount) > 0,
          pathKeys: ["stkIn"],
          titleKeys: ["仓库盘点", "盘点入库"]
        },
        {
          key: "stocktakingDiff",
          label: "盘点差异条目数",
          hint: "待盈亏处理明细",
          icon: "el-icon-s-data",
          showCount: true,
          display: this.formatStatQty(s.stocktakingDiffLineCount),
          warn: Number(s.stocktakingDiffLineCount) > 0,
          pathKeys: ["profitLoss", "profitLossPending"],
          titleKeys: ["盈亏单", "盘盈待入账"]
        },
        {
          key: "pendingTransfer",
          label: "移库待处理单据",
          hint: "调拨未审核",
          icon: "el-icon-sort",
          showCount: true,
          display: this.formatStatQty(s.pendingTransferBillCount),
          warn: Number(s.pendingTransferBillCount) > 0,
          pathKeys: [],
          titleKeys: ["调拨审核", "移库审核", "调拨申请"]
        },
        {
          key: "pendingReturn",
          label: "退货待验收数量",
          hint: "退货未审核数量",
          icon: "el-icon-refresh-left",
          showCount: true,
          display: this.formatStatQty(s.pendingReturnAcceptQty),
          warn: Number(s.pendingReturnAcceptQty) > 0,
          pathKeys: ["refundGoodsApply", "refundGoodsAudit"],
          titleKeys: ["入退货申请", "退货审核"]
        },
        {
          key: "overstock",
          label: "库区超储物资数量",
          hint: "高于定数上限",
          icon: "el-icon-warning-outline",
          showCount: true,
          display: this.formatStatQty(s.overstockMaterialCount),
          warn: Number(s.overstockMaterialCount) > 0,
          pathKeys: [],
          titleKeys: ["库存查询"],
          query: { tab: "alert" }
        }
      ];
    },
    departmentCards() {
      const s = this.departmentStats || {};
      return [
        {
          key: "pendingApply",
          label: "科室待申领审批",
          hint: "申领单待审核",
          icon: "el-icon-s-order",
          showCount: true,
          display: this.formatStatQty(s.pendingApplyAuditBillCount),
          warn: Number(s.pendingApplyAuditBillCount) > 0,
          pathKeys: ["dApplyAudit", "dApply"],
          titleKeys: ["科室申领审核", "科室申领"]
        },
        {
          key: "unreceived",
          label: "科室申领在途物资",
          hint: "出库待收货确认",
          icon: "el-icon-s-promotion",
          showCount: true,
          display: this.formatStatQty(s.unreceivedOutboundBillCount),
          warn: Number(s.unreceivedOutboundBillCount) > 0,
          pathKeys: ["receiptConfirm"],
          titleKeys: ["收货确认"]
        },
        {
          key: "nearExpiry",
          label: "科室耗材近效期",
          hint: "30天内近效期行",
          icon: "el-icon-time",
          showCount: true,
          display: this.formatStatQty(s.nearExpiryLineCount),
          warn: Number(s.nearExpiryLineCount) > 0,
          pathKeys: ["depInventory"],
          titleKeys: ["科室库存查询"],
          query: { tab: "nearExpiry" }
        },
        {
          key: "inventoryQty",
          label: "科室库存余量",
          hint: "当前库存数量合计",
          icon: "el-icon-office-building",
          showCount: true,
          display: this.formatStatQty(s.departmentInventoryQty),
          warn: false,
          pathKeys: ["depInventory"],
          titleKeys: ["科室库存查询"],
          query: { tab: "detail" }
        },
        {
          key: "recentConsume",
          label: "科室近期消耗条数",
          hint: "近7日已审明细",
          icon: "el-icon-finished",
          showCount: true,
          display: this.formatStatQty(s.recentConsumeEntryCount),
          warn: Number(s.recentConsumeEntryCount) > 0,
          pathKeys: ["batchConsume"],
          titleKeys: ["科室批量消耗", "批量消耗"]
        }
      ];
    },
    allTodos() {
      return [
        {
          key: "unreceived",
          label: "待收货确认",
          hint: "待处理单据",
          icon: "el-icon-bottom",
          showCount: false,
          count: this.deptCounts.unreceivedBillCount,
          pathKeys: ["receiptConfirm"],
          titleKeys: ["收货确认"],
          fallbackPath: "/department/receiptConfirm/index"
        },
        {
          key: "expiry",
          label: "近效期预警",
          hint: "临近效期耗材",
          icon: "el-icon-time",
          showCount: false,
          count: this.deptCounts.nearExpiryLineCount,
          pathKeys: ["depInventory"],
          titleKeys: ["科室库存查询"],
          query: { tab: "nearExpiry" },
          fallbackPath: "/department/depInventory/index"
        },
        {
          key: "alert",
          label: "库存预警",
          hint: "偏离安全库存",
          icon: "el-icon-warning-outline",
          showCount: false,
          count: this.deptCounts.inventoryAlertLineCount,
          pathKeys: ["depInventory"],
          titleKeys: ["科室库存查询"],
          query: { tab: "alert" },
          fallbackPath: "/department/depInventory/index"
        },
        {
          key: "consume",
          label: "待消耗核对",
          hint: "待核对记录",
          icon: "el-icon-finished",
          showCount: true,
          count: this.deptCounts.consumeLineCount,
          pathKeys: ["patientCharge"],
          titleKeys: ["患者收费查询"],
          fallbackPath: "/department/patientCharge/index"
        },
        {
          key: "apply",
          label: "待审申领",
          hint: "待审核申领单",
          icon: "el-icon-s-order",
          showCount: true,
          count: this.warehouseCounts.pendingApplyBillCount,
          pathKeys: ["dApplyAudit"],
          titleKeys: ["科室申领审核"],
          fallbackPath: "/department/dApplyAudit/index"
        },
        {
          key: "purchase",
          label: "待审申购",
          hint: "待审核申购单",
          icon: "el-icon-s-goods",
          showCount: true,
          count: this.warehouseCounts.pendingPurchaseBillCount,
          pathKeys: ["dPurchaseAggAudit", "dPurchaseAudit", "purchaseAudit"],
          titleKeys: ["科室请购审核", "科室申购审核"],
          fallbackPath: "/department/dPurchaseAggAudit/index"
        }
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
    permittedMenus() {
      return collectLeafMenus(this.$store.getters.sidebarRouters, 200);
    },
    displayMenus() {
      const leaves = this.permittedMenus;
      const byPath = {};
      leaves.forEach((item) => {
        if (item && item.path) {
          byPath[item.path] = item;
        }
      });
      let source = [];
      if (Array.isArray(this.customMenuPaths)) {
        source = this.customMenuPaths
          .map((path) => byPath[path])
          .filter(Boolean)
          .slice(0, FREQUENT_MENU_MAX);
      } else if (this.frequentMenus.length) {
        source = this.frequentMenus
          .filter((item) => item && item.path && byPath[item.path])
          .slice(0, FREQUENT_MENU_MAX)
          .map((item) => ({
            path: item.path,
            title: byPath[item.path].title || item.title,
            icon: item.icon || byPath[item.path].icon || ""
          }));
      } else {
        source = leaves.slice(0, FREQUENT_MENU_PAGE_SIZE);
      }
      return source.map((item) => ({
        path: item.path,
        title: item.title,
        icon: item.icon || (byPath[item.path] && byPath[item.path].icon) || ""
      }));
    },
    menuPages() {
      const list = this.displayMenus;
      const size = FREQUENT_MENU_PAGE_SIZE;
      if (!list.length) {
        return [];
      }
      const pages = [];
      for (let i = 0; i < list.length; i += size) {
        pages.push(list.slice(i, i + size));
      }
      return pages;
    },
    menuEmptyHint() {
      if (Array.isArray(this.customMenuPaths)) {
        return "暂无可用常用菜单，请点击右上角编辑重新设置";
      }
      return "暂无常用菜单，使用功能后按频率出现在这里，也可点击右上角编辑设置";
    },
    trendChartTitle() {
      return this.isPurchaseHome ? "近7日采购到货趋势" : "近七日耗材出库趋势";
    },
    pieChartTitle() {
      return this.isPurchaseHome ? "当月采购分类金额占比" : "库存结构占比";
    },
    pieChartSub() {
      return this.isPurchaseHome ? "当月财务分类入退货" : "当月财务分类出退库";
    },
    trendDeltaHint() {
      if (this.isPurchaseHome) {
        const series = this.kpiSeries.inCount || [];
        const today = series.length ? Number(series[series.length - 1]) || 0 : Number(this.todayStats.inCount) || 0;
        const yesterday = series.length > 1
          ? Number(series[series.length - 2]) || 0
          : Number(this.kpiYesterday.inCount) || 0;
        return this.formatKpiDelta(today, yesterday).text;
      }
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
        if (ROLE_HOME_VIEWS.includes(val)) {
          this.disposeChart("trend");
          this.disposeChart("pie");
          this.disposeChart("usage");
          this.disposeChart("inPie");
          return;
        }
        this.initTrendChart();
        this.initPieChart();
        if (val === "full") {
          this.ensureFullExtras();
        } else {
          this.disposeChart("usage");
          this.disposeChart("inPie");
        }
      });
    },
    allowedHomeViews() {
      this.ensureHomeViewAllowed();
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
      if (this.isPlaceholderHome) {
        return;
      }
      if (this.isPurchaseHome) {
        this.loadPurchaseHomeStats();
      } else if (this.isWarehouseHome) {
        this.loadWarehouseHomeStats();
      } else if (this.isDepartmentHome) {
        this.loadDepartmentHomeStats();
      } else {
        this.loadTodayStats();
        this.loadTodoCounts();
      }
      this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
      this.loadFrequentMenus();
      this.loadCustomMenus();
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
      if (v === "purchase") {
        return "purchase";
      }
      if (v === "warehouse") {
        return "warehouse";
      }
      if (v === "department") {
        return "department";
      }
      if (ROLE_HOME_VIEWS.includes(v)) {
        return v;
      }
      return "simple";
    },
    /** 当前视图不在授权范围内时回落到「默认」（或首个可用） */
    ensureHomeViewAllowed() {
      const allow = this.allowedHomeViews;
      if (!allow.includes(this.homeView)) {
        const next = allow.includes("simple") ? "simple" : allow[0];
        this.homeView = next || "simple";
      }
      if (!allow.includes(this.savedView)) {
        this.savedView = allow.includes("simple") ? "simple" : (allow[0] || "simple");
      }
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
      // 未单独授权时默认「默认」首页；有授权则优先个人偏好（须在授权范围内）
      let view = this.allowedHomeViews.includes("simple") ? "simple" : (this.allowedHomeViews[0] || "simple");
      if (prefApiOk && prefView && this.allowedHomeViews.includes(prefView)) {
        view = prefView;
      } else if (uiView && this.allowedHomeViews.includes(uiView)) {
        view = uiView;
        if (prefApiOk && prefView !== uiView) {
          saveHomePref(uiView).catch(() => {});
        }
      }
      this.homeView = view;
      this.savedView = view;
      this.ensureHomeViewAllowed();
    },
    switchView(view) {
      const next = this.normalizeView(view);
      if (!this.allowedHomeViews.includes(next)) {
        return;
      }
      const prev = this.homeView;
      this.homeView = next;
      if (ROLE_HOME_VIEWS.includes(next)) {
        return;
      }
      if (prev === next) {
        return;
      }
      if (next === "purchase") {
        this.loadPurchaseHomeStats();
        this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
        this.loadFrequentMenus();
        this.loadCustomMenus();
        this.loadOutboundProportionChart();
        this.disposeChart("usage");
        this.disposeChart("inPie");
        return;
      }
      if (next === "warehouse") {
        this.loadWarehouseHomeStats();
        this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
        this.loadFrequentMenus();
        this.loadCustomMenus();
        this.loadOutboundProportionChart();
        this.disposeChart("usage");
        this.disposeChart("inPie");
        return;
      }
      if (next === "department") {
        this.loadDepartmentHomeStats();
        this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
        this.loadFrequentMenus();
        this.loadCustomMenus();
        this.loadOutboundProportionChart();
        this.disposeChart("usage");
        this.disposeChart("inPie");
        return;
      }
      this.loadTodayStats();
      this.loadKpiTrend().then(() => this.$nextTick(() => this.initTrendChart()));
      this.loadTodoCounts();
      this.loadFrequentMenus();
      this.loadCustomMenus();
      this.loadOutboundProportionChart();
      if (next === "full") {
        this.ensureFullExtras();
      } else {
        this.disposeChart("usage");
        this.disposeChart("inPie");
      }
    },
    async saveDefaultView() {
      this.savingPref = true;
      const view = this.normalizeView(this.homeView);
      if (!this.allowedHomeViews.includes(view)) {
        this.savingPref = false;
        return;
      }
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
    async loadPurchaseHomeStats() {
      try {
        const res = await fetchPurchaseHomeStats();
        const d = (res && res.data) || {};
        this.purchaseStats = {
          pendingIssuePurchaseApplyCount: Number(d.pendingIssuePurchaseApplyCount) || 0,
          inTransitPurchaseOrderCount: Number(d.inTransitPurchaseOrderCount) || 0,
          overdueSupplierDeliveryCount: Number(d.overdueSupplierDeliveryCount) || 0,
          arrivalOnTimeRateText: d.arrivalOnTimeRateText || "--",
          pendingPriceCompareCount: Number(d.pendingPriceCompareCount) || 0
        };
      } catch (e) {
        console.error("加载采购首页指标失败", e);
      }
    },
    async loadWarehouseHomeStats() {
      try {
        const res = await fetchWarehouseHomeStats();
        const d = (res && res.data) || {};
        this.warehouseStats = {
          pendingStocktakingTaskCount: Number(d.pendingStocktakingTaskCount) || 0,
          stocktakingDiffLineCount: Number(d.stocktakingDiffLineCount) || 0,
          pendingTransferBillCount: Number(d.pendingTransferBillCount) || 0,
          pendingReturnAcceptQty: Number(d.pendingReturnAcceptQty) || 0,
          overstockMaterialCount: Number(d.overstockMaterialCount) || 0
        };
      } catch (e) {
        console.error("加载库房首页指标失败", e);
      }
    },
    async loadDepartmentHomeStats() {
      try {
        const res = await fetchDepartmentHomeStats();
        const d = (res && res.data) || {};
        this.departmentStats = {
          pendingApplyAuditBillCount: Number(d.pendingApplyAuditBillCount) || 0,
          unreceivedOutboundBillCount: Number(d.unreceivedOutboundBillCount) || 0,
          nearExpiryLineCount: Number(d.nearExpiryLineCount) || 0,
          departmentInventoryQty: Number(d.departmentInventoryQty) || 0,
          recentConsumeEntryCount: Number(d.recentConsumeEntryCount) || 0
        };
      } catch (e) {
        console.error("加载科室首页指标失败", e);
      }
    },
    findMenuPathByKeys(pathKeys, titleKeys) {
      const keys = Array.isArray(pathKeys) ? pathKeys : [];
      const titles = Array.isArray(titleKeys) ? titleKeys : [];
      const leaves = this.permittedMenus || [];
      for (let i = 0; i < keys.length; i++) {
        const key = String(keys[i] || "").replace(/^\/+|\/+$/g, "");
        if (!key) continue;
        const hit = leaves.find((m) => {
          if (!m || !m.path) return false;
          const p = String(m.path);
          return p === key || p === "/" + key || p.endsWith("/" + key);
        });
        if (hit) {
          return hit.path;
        }
      }
      for (let i = 0; i < titles.length; i++) {
        const title = String(titles[i] || "").trim();
        if (!title) continue;
        const hit = leaves.find((m) => m && m.title === title);
        if (hit && hit.path) {
          return hit.path;
        }
      }
      return "";
    },
    openPurchaseCard(card) {
      if (!card) {
        return;
      }
      if (!card.pathKeys || !card.pathKeys.length) {
        this.$message.info("待比价业务建设中");
        return;
      }
      const path = this.findMenuPathByKeys(card.pathKeys, card.titleKeys);
      if (!path) {
        this.$message.warning("未找到对应菜单权限，请联系管理员授权");
        return;
      }
      this.$router.push(path).catch(() => {});
    },
    openWarehouseCard(card) {
      if (!card) {
        return;
      }
      const path = this.findMenuPathByKeys(card.pathKeys, card.titleKeys);
      if (!path) {
        this.$message.warning("未找到对应菜单权限，请联系管理员授权");
        return;
      }
      if (card.query) {
        this.$router.push({ path, query: card.query }).catch(() => {});
        return;
      }
      this.$router.push(path).catch(() => {});
    },
    openDepartmentCard(card) {
      if (!card) {
        return;
      }
      const path = this.findMenuPathByKeys(card.pathKeys, card.titleKeys);
      if (!path) {
        this.$message.warning("未找到对应菜单权限，请联系管理员授权");
        return;
      }
      if (card.query) {
        this.$router.push({ path, query: card.query }).catch(() => {});
        return;
      }
      this.$router.push(path).catch(() => {});
    },
    async loadFrequentMenus() {
      try {
        const res = await fetchFrequentMenus(FREQUENT_MENU_MAX);
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
    async loadCustomMenus() {
      try {
        const res = await getUserUiConfig(FREQUENT_MENU_UI_KEY);
        const raw = res && res.data && res.data.configValue;
        if (!raw) {
          this.customMenuPaths = null;
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          this.customMenuPaths = null;
          return;
        }
        this.customMenuPaths = parsed
          .map((item) => (typeof item === "string" ? item : (item && item.path)))
          .filter((path) => path && typeof path === "string")
          .slice(0, FREQUENT_MENU_MAX);
      } catch (e) {
        this.customMenuPaths = null;
      }
    },
    openMenuSetting() {
      const selected = Array.isArray(this.customMenuPaths) && this.customMenuPaths.length
        ? this.customMenuPaths.filter((path) => this.permittedMenus.some((m) => m.path === path))
        : this.displayMenus.map((m) => m.path);
      this.menuSettingChecked = selected.slice(0, FREQUENT_MENU_MAX);
      this.menuSettingVisible = true;
    },
    async saveMenuSetting() {
      const allowed = new Set(this.permittedMenus.map((m) => m.path));
      const paths = (this.menuSettingChecked || [])
        .filter((path) => allowed.has(path))
        .slice(0, FREQUENT_MENU_MAX);
      this.menuSettingSaving = true;
      try {
        await saveUserUiConfig({
          configKey: FREQUENT_MENU_UI_KEY,
          configValue: JSON.stringify(paths)
        });
        this.customMenuPaths = paths;
        this.menuSettingVisible = false;
        this.$message.success("常用菜单已保存");
      } catch (e) {
        this.$message.error("保存常用菜单失败");
      } finally {
        this.menuSettingSaving = false;
      }
    },
    async resetMenuSetting() {
      this.menuSettingSaving = true;
      try {
        await saveUserUiConfig({
          configKey: FREQUENT_MENU_UI_KEY,
          configValue: ""
        });
        this.customMenuPaths = null;
        this.menuSettingVisible = false;
        this.$message.success("已恢复为按使用频率自动展示");
      } catch (e) {
        this.$message.error("恢复失败");
      } finally {
        this.menuSettingSaving = false;
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
      if (!todo) {
        return;
      }
      if (todo.pathKeys || todo.titleKeys || todo.fallbackPath) {
        const path = this.findMenuPathByKeys(todo.pathKeys, todo.titleKeys) || todo.fallbackPath || "";
        if (!path) {
          this.$message.warning("未找到对应菜单权限，请联系管理员授权");
          return;
        }
        if (todo.query) {
          this.$router.push({ path, query: todo.query }).catch(() => {});
          return;
        }
        this.$router.push(path).catch(() => {});
        return;
      }
      if (!todo.open) {
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
      this.kpiSeries.outAmt = this.parseNumList(d.outAmt);
      this.kpiSeries.inAmt = this.parseNumList(d.inAmt);
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
          const name = this.pickMapVal(item, ["financeCategoryName", "finance_category_name", "financecategoryname"]) || "未分类";
          const amtRaw = this.pickMapVal(item, ["totalAmt", "total_amt", "totalamt"]);
          const amt = Math.abs(parseFloat(amtRaw != null ? amtRaw : 0) || 0);
          return { name: String(name), value: amt };
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
    pickMapVal(obj, keys) {
      if (!obj || typeof obj !== "object" || !Array.isArray(keys)) {
        return null;
      }
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null && obj[k] !== "") {
          return obj[k];
        }
      }
      const lowerMap = {};
      Object.keys(obj).forEach((k) => {
        lowerMap[String(k).toLowerCase()] = obj[k];
      });
      for (let i = 0; i < keys.length; i++) {
        const hit = lowerMap[String(keys[i]).toLowerCase()];
        if (hit != null && hit !== "") {
          return hit;
        }
      }
      return null;
    },
    async loadOutboundProportionChart() {
      this.outChartEmptyHint = "";
      const purchase = this.isPurchaseHome;
      try {
        const res = purchase
          ? await fetchHomeInboundFinanceCategoryProportion()
          : await fetchHomeOutboundFinanceCategoryProportion();
        const rows = (res && res.data) || [];
        const emptyLabel = purchase ? "暂无当月采购" : "暂无当月出库";
        this.outChartSlices = this.buildFinancePieSlices(rows, emptyLabel);
        if (this.outChartSlices.length === 1 && this.outChartSlices[0].name === emptyLabel) {
          this.outChartEmptyHint = "本月暂无分类数据";
          this.initPieChart();
          return;
        }
        this.$nextTick(() => this.initPieChart());
      } catch (e) {
        console.error(purchase ? "加载采购分类占比失败" : "加载出库统计占比失败", e);
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
      const purchase = this.isPurchaseHome;
      const qtySeries = purchase
        ? (this.kpiSeries.inCount || this.zeroSeries(7))
        : (this.kpiSeries.outCount || this.zeroSeries(7));
      const amtSeries = purchase
        ? (this.kpiSeries.inAmt || this.zeroSeries(qtySeries.length))
        : (this.kpiSeries.outAmt || this.zeroSeries(qtySeries.length));
      const qtyAllZero = qtySeries.every((v) => !Number(v));
      const amtAllZero = amtSeries.every((v) => !Number(v));
      this.trendEmptyHint = "";
      if (qtyAllZero && (purchase || amtAllZero)) {
        this.trendEmptyHint = purchase ? "近7日暂无到货入库" : "近7日暂无出库";
        this.disposeChart("trend");
        return;
      }
      const el = this.$refs.trendRef;
      if (!el || typeof el.getBoundingClientRect !== "function") {
        this.$nextTick(() => this.initTrendChart());
        return;
      }
      const labels = this.trendLabels();
      const qtyName = purchase ? "到货数量" : "出库数量";
      const amtName = purchase ? "到货金额" : "出库金额";
      const applySeries = this.kpiSeries.applyCount || this.zeroSeries(qtySeries.length);
      const option = this.isFull
        ? {
            color: ["#3b82f6", "#94a3b8"],
            tooltip: { trigger: "axis" },
            legend: { data: [qtyName, "申领数量"], top: 0, right: 8, textStyle: { color: "#64748b", fontSize: 11 } },
            grid: { left: 36, right: 16, top: 36, bottom: 28 },
            xAxis: { type: "category", data: labels, axisTick: { show: false }, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { color: "#94a3b8" } },
            yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8" } },
            series: [
              { name: qtyName, type: "bar", barWidth: 18, itemStyle: { color: "#3b82f6", borderRadius: [6, 6, 0, 0] }, data: qtySeries },
              { name: "申领数量", type: "line", smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 2, color: "#94a3b8" }, data: applySeries }
            ]
          }
        : {
            color: ["#2563eb", "#ea580c"],
            tooltip: {
              trigger: "axis",
              formatter: (params) => {
                const list = Array.isArray(params) ? params : [params];
                if (!list.length) {
                  return "";
                }
                let html = `${list[0].axisValue}<br/>`;
                list.forEach((p) => {
                  const val = Number(p.value) || 0;
                  const text = p.seriesName && p.seriesName.indexOf("金额") >= 0
                    ? ("¥" + this.formatAmount(val))
                    : this.formatStatQty(val);
                  html += `${p.marker}${p.seriesName} ${text}<br/>`;
                });
                return html;
              }
            },
            legend: {
              data: [qtyName, amtName],
              top: 0,
              left: "center",
              itemGap: 20,
              textStyle: { color: "#64748b", fontSize: 11 }
            },
            grid: { left: 52, right: 56, top: 40, bottom: 28 },
            xAxis: {
              type: "category",
              data: labels,
              boundaryGap: false,
              axisTick: { show: false },
              axisLine: { lineStyle: { color: "#e2e8f0" } },
              axisLabel: { color: "#94a3b8" }
            },
            yAxis: [
              {
                type: "value",
                splitLine: { lineStyle: { color: "#f1f5f9" } },
                axisLabel: { color: "#94a3b8" }
              },
              {
                type: "value",
                splitLine: { show: false },
                axisLabel: {
                  color: "#94a3b8",
                  formatter: (v) => {
                    const n = Number(v) || 0;
                    if (Math.abs(n) >= 10000) {
                      return (n / 10000).toFixed(1) + "万";
                    }
                    return String(n);
                  }
                }
              }
            ],
            series: [
              {
                name: qtyName,
                type: "line",
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                yAxisIndex: 0,
                lineStyle: { width: 3, color: "#2563eb" },
                itemStyle: { color: "#2563eb" },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: "rgba(37,99,235,0.22)" },
                    { offset: 1, color: "rgba(37,99,235,0.02)" }
                  ])
                },
                data: qtySeries
              },
              {
                name: amtName,
                type: "line",
                smooth: true,
                symbol: "circle",
                symbolSize: 7,
                yAxisIndex: 1,
                lineStyle: { width: 3, color: "#ea580c" },
                itemStyle: { color: "#ea580c" },
                data: amtSeries
              }
            ]
          };
      try {
        if (!this.trendChartInstance) {
          this.trendChartInstance = echarts.init(el);
        }
        this.trendChartInstance.setOption(option, true);
        this.$nextTick(() => {
          if (this.trendChartInstance) {
            this.trendChartInstance.resize();
          }
        });
        setTimeout(() => {
          if (this.trendChartInstance) {
            this.trendChartInstance.resize();
          }
        }, 80);
        if (!this.trendResizeHandler) {
          this.trendResizeHandler = () => this.trendChartInstance && this.trendChartInstance.resize();
          window.addEventListener("resize", this.trendResizeHandler);
        }
      } catch (e) {
        console.error("initTrendChart", e);
        this.trendEmptyHint = purchase ? "近7日暂无到货入库" : "近7日暂无出库";
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
        this.$nextTick(() => {
          if (this.pieChartInstance) {
            this.pieChartInstance.resize();
          }
        });
        setTimeout(() => {
          if (this.pieChartInstance) {
            this.pieChartInstance.resize();
          }
        }, 80);
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

  .home-top-grid {
    display: grid;
    gap: 12px;
    margin-bottom: 14px;
  }

  .home-top-grid.cols-8 {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }

  .home-top-grid.cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .home-top-grid.cols-12 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .home-purchase-card .home-todo-badge.is-num {
    min-width: 52px;
    padding: 0 6px;
    border-radius: 12px;
    font-size: 16px;
  }

  .home-todo-card,
  .home-kpi-card,
  .home-board {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
    border: 1px solid #eef2f7;
    box-sizing: border-box;
  }

  .home-todo-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 18px 14px;
    min-height: 112px;
    cursor: pointer;
    min-width: 0;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .home-todo-card:hover {
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
    transform: translateY(-1px);
  }

  .home-todo-copy {
    min-width: 0;
    flex: 1;
  }

  .home-todo-title {
    font-size: 13px;
    font-weight: 650;
    color: #0f172a;
    line-height: 1.3;
  }

  .home-todo-hint {
    margin-top: 4px;
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.3;
  }

  .home-todo-badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #eff6ff;
    color: #2563eb;
    border: 1.5px solid rgba(37, 99, 235, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
  }

  .home-todo-badge.is-num {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .home-todo-card.tone-0 .home-todo-badge {
    background: #eff6ff;
    color: #2563eb;
    border-color: rgba(37, 99, 235, 0.28);
  }
  .home-todo-card.tone-1 .home-todo-badge {
    background: #fff7ed;
    color: #ea580c;
    border-color: rgba(234, 88, 12, 0.28);
  }
  .home-todo-card.tone-2 .home-todo-badge {
    background: #eef2ff;
    color: #4f46e5;
    border-color: rgba(79, 70, 229, 0.28);
  }
  .home-todo-card.tone-3 .home-todo-badge {
    background: #fff1f2;
    color: #e11d48;
    border-color: rgba(225, 29, 72, 0.28);
  }
  .home-todo-card.tone-4 .home-todo-badge {
    background: #ecfeff;
    color: #0891b2;
    border-color: rgba(8, 145, 178, 0.28);
  }
  .home-todo-card.tone-5 .home-todo-badge {
    background: #f0fdf4;
    color: #16a34a;
    border-color: rgba(22, 163, 74, 0.28);
  }

  .home-todo-card.warn .home-todo-badge.is-num {
    background: #fff1f2;
    color: #e11d48;
    border-color: rgba(225, 29, 72, 0.35);
  }

  .home-kpi-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    min-width: 0;
    min-height: 112px;
  }

  .home-kpi-icon-box {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 15px;
    background: #eff6ff;
    color: #2563eb;
  }

  .home-kpi-card.tone-0 .home-kpi-icon-box {
    background: #eff6ff;
    color: #2563eb;
  }
  .home-kpi-card.tone-1 .home-kpi-icon-box {
    background: #fff7ed;
    color: #ea580c;
  }
  .home-kpi-card.tone-2 .home-kpi-icon-box {
    background: #fff1f2;
    color: #e11d48;
  }
  .home-kpi-card.tone-3 .home-kpi-icon-box {
    background: #eef2ff;
    color: #4f46e5;
  }
  .home-kpi-card.tone-4 .home-kpi-icon-box {
    background: #ecfeff;
    color: #0891b2;
  }
  .home-kpi-card.tone-5 .home-kpi-icon-box {
    background: #f0fdf4;
    color: #16a34a;
  }

  .home-kpi-copy {
    min-width: 0;
    flex: 1;
  }

  .home-kpi-label {
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.3;
  }

  .home-kpi-delta {
    margin-top: 4px;
    font-size: 12px;
    color: #94a3b8;
  }
  .home-kpi-delta.is-up { color: #16a34a; }
  .home-kpi-delta.is-down { color: #e11d48; }

  .home-kpi-nums {
    text-align: right;
    flex-shrink: 0;
  }

  .home-kpi-num {
    font-size: 18px;
    font-weight: 700;
    color: #1e3a8a;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  .home-kpi-card.tone-1 .home-kpi-num { color: #c2410c; }
  .home-kpi-card.tone-2 .home-kpi-num { color: #be123c; }
  .home-kpi-card.warn .home-kpi-num { color: #e11d48; }

  .home-kpi-side {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    font-variant-numeric: tabular-nums;
  }
  .home-kpi-side.is-down { color: #e11d48; }
  .home-kpi-side.is-flat { color: #94a3b8; }
  .home-kpi-card.tone-1 .home-kpi-side { color: #ea580c; }

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
    align-items: center;
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

  .home-menu-edit-btn {
    border: 0;
    background: transparent;
    color: #94a3b8;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .home-menu-edit-btn:hover {
    color: #2563eb;
    background: #eff6ff;
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

  .home-menu-carousel-wrap {
    min-height: 196px;
  }

  .home-menu-carousel {
    width: 100%;
  }

  ::v-deep .home-menu-carousel {
    .el-carousel__indicators--outside {
      margin-top: 2px;
    }
    .el-carousel__button {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94a3b8;
      opacity: 0.45;
    }
    .el-carousel__indicator.is-active .el-carousel__button {
      opacity: 1;
      background: #2563eb;
    }
    .el-carousel__arrow {
      width: 28px;
      height: 28px;
      background: rgba(15, 23, 42, 0.35);
    }
  }

  .home-menu-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 4px 12px;
    padding: 4px 4px 2px;
    min-height: 188px;
    align-content: start;
  }

  .home-menu-tile {
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: 8px 4px 6px;
    border-radius: 12px;
    color: #334155;
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .home-menu-tile:hover {
    background: #f8fafc;
    transform: translateY(-1px);
  }

  .home-menu-tile:hover .home-menu-tile-title {
    color: #0f172a;
  }

  .home-menu-tile-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin: 0 auto;
    border-radius: 14px;
    background: linear-gradient(145deg, #38bdf8, #2563eb);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.18);
  }

  .home-menu-tile-icon-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.28);
    color: #fff;
    font-size: 16px;
  }

  .home-menu-tile-icon-inner .svg-icon {
    width: 1.15em;
    height: 1.15em;
    color: #fff;
    fill: currentColor;
  }

  .home-menu-tile.tone-0 .home-menu-tile-icon {
    background: linear-gradient(145deg, #38bdf8, #2563eb);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
  }
  .home-menu-tile.tone-1 .home-menu-tile-icon {
    background: linear-gradient(145deg, #a3e635, #16a34a);
    box-shadow: 0 4px 10px rgba(22, 163, 74, 0.2);
  }
  .home-menu-tile.tone-2 .home-menu-tile-icon {
    background: linear-gradient(145deg, #fb923c, #f43f5e);
    box-shadow: 0 4px 10px rgba(244, 63, 94, 0.2);
  }
  .home-menu-tile.tone-3 .home-menu-tile-icon {
    background: linear-gradient(145deg, #facc15, #f97316);
    box-shadow: 0 4px 10px rgba(249, 115, 22, 0.2);
  }
  .home-menu-tile.tone-4 .home-menu-tile-icon {
    background: linear-gradient(145deg, #22d3ee, #1d4ed8);
    box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2);
  }
  .home-menu-tile.tone-5 .home-menu-tile-icon {
    background: linear-gradient(145deg, #86efac, #059669);
    box-shadow: 0 4px 10px rgba(5, 150, 105, 0.2);
  }
  .home-menu-tile.tone-6 .home-menu-tile-icon {
    background: linear-gradient(145deg, #fb7185, #e11d48);
    box-shadow: 0 4px 10px rgba(225, 29, 72, 0.2);
  }
  .home-menu-tile.tone-7 .home-menu-tile-icon {
    background: linear-gradient(145deg, #fde047, #ea580c);
    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2);
  }
  .home-menu-tile.tone-8 .home-menu-tile-icon {
    background: linear-gradient(145deg, #c084fc, #7c3aed);
    box-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
  }
  .home-menu-tile.tone-9 .home-menu-tile-icon {
    background: linear-gradient(145deg, #818cf8, #4338ca);
    box-shadow: 0 4px 10px rgba(67, 56, 202, 0.2);
  }
  .home-menu-tile.tone-10 .home-menu-tile-icon {
    background: linear-gradient(145deg, #2dd4bf, #0f766e);
    box-shadow: 0 4px 10px rgba(15, 118, 110, 0.2);
  }
  .home-menu-tile.tone-11 .home-menu-tile-icon {
    background: linear-gradient(145deg, #fbbf24, #b45309);
    box-shadow: 0 4px 10px rgba(180, 83, 9, 0.2);
  }
  .home-menu-tile.tone-12 .home-menu-tile-icon {
    background: linear-gradient(145deg, #e879f9, #a21caf);
    box-shadow: 0 4px 10px rgba(162, 28, 175, 0.2);
  }
  .home-menu-tile.tone-13 .home-menu-tile-icon {
    background: linear-gradient(145deg, #94a3b8, #334155);
    box-shadow: 0 4px 10px rgba(51, 65, 85, 0.22);
  }
  .home-menu-tile.tone-14 .home-menu-tile-icon {
    background: linear-gradient(145deg, #34d399, #047857);
    box-shadow: 0 4px 10px rgba(4, 120, 87, 0.2);
  }
  .home-menu-tile.tone-15 .home-menu-tile-icon {
    background: linear-gradient(145deg, #fdba74, #c2410c);
    box-shadow: 0 4px 10px rgba(194, 65, 12, 0.2);
  }

  .home-menu-tile-title {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.35;
    color: #334155;
    text-align: center;
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

  .home-placeholder-board {
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .home-placeholder-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #334155;
  }

  .home-placeholder-hint {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }

  @media (max-width: 1360px) {
    .home-top-grid.cols-8 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .home-top-grid.cols-5 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .home-top-grid.cols-12 {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }

  @media (max-width: 1100px) {
    .home-top-grid.cols-8,
    .home-top-grid.cols-5,
    .home-top-grid.cols-12 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .home-chart-row {
      grid-template-columns: 1fr;
    }
    .home-menu-grid {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }
  }
}
</style>
