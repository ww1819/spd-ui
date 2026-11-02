<template>
  <div class="app-container list-page caigou-shenhe-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="订单单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="orderStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-check"
          class="spd-btn spd-btn--primary"
          @click="handleBatchAudit"
          :disabled="multiple"
          v-hasPermi="['caigou:dingdan:audit']"
        >审核</el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
          v-hasPermi="['caigou:dingdan:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="orderList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              @row-dblclick="handleMainRowDblclick"
              @sort-change="handleSortChange"
              :height="mainTableHeight"
              stripe border>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="订单单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createByName || (scope.row.creater && scope.row.creater.nickName) || resolveUserName(scope.row.createBy) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.orderDate">{{ parseTime(scope.row.orderDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount != null && scope.row.totalAmount !== ''">{{ formatPrice4(scope.row.totalAmount) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" width="120" min-width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditBy">{{ getAuditorName(scope.row) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="apply-action-col small-padding fixed-width" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总金额: {{ listTotalAmtFormatted }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    </div>

    <PurchaseShenheEditDialog v-if="open" />
    <PurchaseShenheApplyBillDialog v-if="applyBillNoDialogVisible" />
    <PurchaseShenheApplyDetailDialog v-if="applyDetailDialogVisible" />
    <PurchaseShenhePlanViewDialog v-if="planViewDialogVisible" />

  </div>
</template>

<script>
import { listDingdan, getDingdan, auditDingdan } from "@/api/caigou/dingdan";
import { getApplyDetails, getApplyBillNoList, getApplyBillHeaderList, getPurchasePlan } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';

export default {
  name: "PurchaseOrderAudit",
  dicts: ['biz_status','bill_type'],
  components: {
    SelectSupplier,
    SelectWarehouse,
    PurchaseShenheEditDialog: () => import('./components/PurchaseShenheEditDialog'),
    PurchaseShenheApplyBillDialog: () => import('./components/PurchaseShenheApplyBillDialog'),
    PurchaseShenheApplyDetailDialog: () => import('./components/PurchaseShenheApplyDetailDialog'),
    PurchaseShenhePlanViewDialog: () => import('./components/PurchaseShenhePlanViewDialog')
  },
  data() {
    return {
      loading: true,
      isShow: true,
      ids: [],
      checkedPurchaseOrderEntry: [],
      single: true,
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      total: 0,
      totalInfo: { totalAmt: 0 },
      orderList: [],
      purchaseOrderEntryList: [],
      userOptions: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        userId: null,
        orderType: "1",
        dateQueryType: 'bill',
        beginDate: this.getStatDateTime(),
        endDate: this.getEndDateTime(),
        orderByColumn: 'po.create_time',
        isAsc: 'desc',
      },
      form: {},
      rules: {},
      applyBillNoDialogVisible: false,
      applyBillNoList: [],
      applyBillHeaderList: [],
      applyDetailDialogVisible: false,
      applyDetailList: [],
      planViewDialogVisible: false,
      planDetail: null,
      _lastSidebarNavTick: null
    };
  },
  computed: {
    listTotalAmtFormatted() {
      const v = this.totalInfo && this.totalInfo.totalAmt != null ? this.totalInfo.totalAmt : 0;
      return this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(v)
        : Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    pageTotalAmtFormatted() {
      const list = this.orderList || [];
      const s = list.reduce((acc, row) => acc + Number(row && row.totalAmount != null ? row.totalAmount : 0), 0);
      const v = Number.isFinite(s) ? s : 0;
      return this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(v)
        : v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    detailTableHeight() {
      return 'max(240px, calc(100vh - 360px))';
    },
    operatorName() {
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.createByName) {
        return this.form.createByName;
      }
      if (this.form.createBy) {
        return this.resolveUserName(this.form.createBy);
      }
      return '--';
    },
    purchaserName() {
      if (!this.form.contactPerson) return '--';
      const user = (this.userOptions || []).find(u =>
        u.userId === this.form.contactPerson || String(u.userId) === String(this.form.contactPerson)
      );
      return user ? (user.nickName || user.userName) : this.resolveUserName(this.form.contactPerson);
    }
  },
  created() {
    this.getList();
    this.getUserList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  activated() {
    this.$nextTick(() => this.scheduleApplyLayoutRefresh());
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    }
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) table.doLayout();
        this.$nextTick(() => {
          this.syncApplyTableSticky();
          requestAnimationFrame(() => this.syncApplyTableSticky());
        });
      });
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', sw + 'px');
    },
    normalizeRoutePath(path) {
      if (!path) return '';
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) return normalized.slice(0, -1);
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) return;
      if (nav.tick === this._lastSidebarNavTick) return;
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.orderList || !this.orderList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.orderList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) table.toggleRowSelection(row, true);
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      void this.mainListSelectionTick;
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) return 'apply-row-selected';
      return '';
    },
    formatPrice4(value) {
      return this.formatPrice(value, '0');
    },
    sortEntryByNested(a, b, nestedPath, fallbackProp) {
      const getVal = (obj) => {
        if (!obj) return '';
        let v = obj;
        const keys = String(nestedPath || '').split('.');
        for (const k of keys) {
          v = v && v[k];
        }
        if (v == null || v === '') {
          v = fallbackProp ? obj[fallbackProp] : '';
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = columns.map(() => '');
      let summaryLabelPlaced = false;
      const sumNum = (prop) => {
        let t = 0;
        (data || []).forEach(item => {
          const v = item[prop];
          if (v != null && v !== '' && !isNaN(v)) {
            t += parseFloat(v);
          }
        });
        return t;
      };
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        // 与到货验收一致：首列「序号」显示「合计」
        if (!summaryLabelPlaced && (column.label === '序号' || column.type === 'index' || column.property === 'index')) {
          sums[index] = '合计';
          summaryLabelPlaced = true;
          return;
        }
        const prop = column.property;
        if (!prop) return;
        // 订单数量合计
        if (prop === 'orderQty') {
          sums[index] = this.formatQty ? this.formatQty(sumNum('orderQty')) : sumNum('orderQty');
          return;
        }
        // 金额合计（与到货验收「金额」列一致）
        if (prop === 'totalAmount') {
          const amt = sumNum('totalAmount');
          sums[index] = this.formatAmount ? this.formatAmount(amt) : amt;
        }
      });
      return sums;
    },
    buildListQueryParams() {
      const queryParams = { ...this.queryParams };
      queryParams.orderType = queryParams.orderType || "1";
      if (queryParams.dateQueryType === 'audit') {
        queryParams.dateType = 'auditDate';
      } else {
        queryParams.dateType = 'createTime';
      }
      delete queryParams.dateQueryType;
      return queryParams;
    },
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listDingdan(queryParams).then(response => {
        this.orderList = response.rows || [];
        this.total = response.total;
        const ti = response.totalInfo || {};
        const raw = ti.totalAmt != null ? ti.totalAmt : 0;
        const amt = Number(raw);
        this.totalInfo = { totalAmt: Number.isFinite(amt) ? amt : 0 };
        this.loading = false;
        if ((!Number.isFinite(amt) || amt === 0) && this.total > 0) {
          this.fillListTotalAmtFallback(queryParams);
        }
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.orderList = [];
        this.total = 0;
        this.totalInfo = { totalAmt: 0 };
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    fillListTotalAmtFallback(queryParams) {
      const pageSize = Math.min(Number(this.total) || 0, 5000);
      if (pageSize <= 0) return;
      listDingdan({ ...queryParams, pageNum: 1, pageSize }).then(res => {
        const rows = (res && res.rows) || [];
        const sum = rows.reduce((acc, row) => acc + Number(row && row.totalAmount != null ? row.totalAmount : 0), 0);
        if (Number.isFinite(sum) && sum !== 0) {
          this.totalInfo = { totalAmt: sum };
        }
      }).catch(() => {});
    },
    getStatDateTime(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      return myDate.getFullYear().toString() + "-" + month + "-01 00:00:00";
    },
    getEndDateTime(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate();
      return myDate.getFullYear().toString() + "-" + month + "-" + dayEnd + " 23:59:59";
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    handleViewApplyDetails(row) {
      if (!row || !row.planEntryId) return;
      getApplyDetails(row.planEntryId).then(response => {
        const data = response && response.data;
        this.applyDetailList = (Array.isArray(data) ? data : (data && data.data) || []) || [];
        this.applyDetailDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购明细失败");
      });
    },
    handleShowApplyBillNoList() {
      if (!this.form.planId) {
        this.$modal.msgInfo("无关联采购计划");
        return;
      }
      getApplyBillHeaderList(this.form.planId).then(response => {
        const list = (response && response.data) ? (Array.isArray(response.data) ? response.data : (response.data.data || [])) : [];
        this.applyBillHeaderList = list.length > 0 ? list : [];
        this.applyBillNoDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购单列表失败");
      });
    },
    handleViewPlan() {
      if (!this.form.planId) {
        this.$modal.msgInfo("无关联采购计划");
        return;
      }
      getPurchasePlan(this.form.planId).then(response => {
        this.planDetail = response.data || null;
        this.planViewDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取采购计划失败");
      });
    },
    reset() {
      this.form = {
        id: null,
        orderNo: null,
        planId: null,
        planNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        userId: null,
        orderType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delPerson: null,
        contactPhone: null,
        totalAmount: null,
        invoiceAmount: null,
        invoiceTime: null,
        contactPerson: null,
        remark: null
      };
      this.purchaseOrderEntryList = [];
      this.resetForm("form");
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        orderNo: 'po.order_no',
        'supplier.name': 's.name',
        'warehouse.name': 'w.name'
      };
      if (!order) {
        this.queryParams.orderByColumn = 'po.create_time';
        this.queryParams.isAsc = 'desc';
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.orderNo = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.orderStatus = null;
      this.queryParams.dateQueryType = 'bill';
      this.queryParams.beginDate = this.getStatDateTime();
      this.queryParams.endDate = this.getEndDateTime();
      this.queryParams.orderByColumn = 'po.create_time';
      this.queryParams.isAsc = 'desc';
      this.handleQuery();
    },
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    resolveUserName(userKey) {
      if (!userKey) return '--';
      const user = (this.userOptions || []).find(u =>
        u.userId == userKey || String(u.userId) === String(userKey) ||
        u.userName === userKey || u.nickName === userKey
      );
      if (user) return user.nickName || user.userName;
      if (!/^\d+$/.test(String(userKey))) return userKey;
      return '--';
    },
    getAuditorName(row) {
      if (!row || !row.auditBy) return '--';
      const userById = (this.userOptions || []).find(u =>
        u.userId == row.auditBy ||
        u.userId === row.auditBy ||
        String(u.userId) === String(row.auditBy) ||
        u.userId === Number(row.auditBy)
      );
      if (userById) return userById.nickName || userById.userName;
      const userByName = (this.userOptions || []).find(u => u.userName === row.auditBy);
      if (userByName) return userByName.nickName || userByName.userName;
      const userByNickName = (this.userOptions || []).find(u => u.nickName === row.auditBy);
      if (userByNickName) return userByNickName.nickName || userByNickName.userName;
      if (!/^\d+$/.test(String(row.auditBy))) return row.auditBy;
      return '--';
    },
    handleSelectionChange(selection) {
      const map = {};
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) map[key] = true;
      });
      this.selectedRowMap = map;
      const ids = Object.keys(map).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
      this.mainListSelectionTick += 1;
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.$forceUpdate) table.$forceUpdate();
        if (table && table.doLayout) table.doLayout();
      });
    },
    handleMainRowDblclick(row, column) {
      if (!row) return;
      if (column && (column.type === 'selection' || column.label === '操作' || column.property === 'orderNo')) {
        return;
      }
      const table = this.$refs.applyMainTable;
      if (!table) return;
      const key = this.getApplyMainRowKey(row);
      const selected = !!(key && this.selectedRowMap && this.selectedRowMap[key]);
      table.toggleRowSelection(row, !selected);
    },
    handleView(row){
      const id = row.id
      getDingdan(id).then(response => {
        this.form = response.data;
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList;
        this.open = true;
        this.form.orderStatus = row.orderStatus;
        this.form.orderType = '1';
        this.title = "查看订单";
      });
    },
    handleAudit(row) {
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核订单编号为"' + row.orderNo + '"的数据项？').then(function() {
        return auditDingdan({id:id, auditBy:auditBy, auditOpinion:''});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功！");
      }).catch(() => {});
    },
    handleExport() {
      const queryParams = this.buildListQueryParams();
      this.download('caigou/dingdan/export', queryParams, 'purchase_order_' + new Date().getTime() + '.xlsx')
    },
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的订单！");
        return;
      }

      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '0' && item.orderStatus !== 0);

      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => order.orderNo + '(状态:' + order.orderStatus + ')').join(', ');
        this.$modal.msgError('只能审核待审核状态的订单！以下订单状态不正确：' + statusInfo);
        return;
      }

      const auditBy = this.$store.state.user.userId;
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');

      this.$modal.confirm('确定要审核选中的 ' + this.ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        const auditPromises = this.ids.map(id => auditDingdan({id: id, auditBy: auditBy, auditOpinion: ''}));
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    rowPurchaseOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    handlePurchaseOrderEntrySelectionChange(selection) {
      this.checkedPurchaseOrderEntry = selection.map(item => item.index)
    }
  }
};
</script>

<style scoped>
.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.list-query-panel .el-form .el-row {
  margin-bottom: 8px;
}

.list-query-panel .el-form .el-row:last-child {
  margin-bottom: 0;
}

.list-query-panel .el-form .el-form-item {
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first {
  margin-bottom: 10px;
}

.list-query-panel .el-form .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.list-query-panel .el-form .apply-query-field,
.list-query-panel .el-form .query-row-first-inner .apply-query-input {
  width: 170px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .more-search-select-wrap.apply-query-field > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-second .apply-query-field.el-select {
  width: 170px;
}

.list-query-panel .el-form .query-row-first-inner .query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .query-actions .el-button + .el-button {
  margin-left: 0;
}

.list-query-panel .el-form .query-row-second {
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.list-query-panel .el-form .apply-date-type-group {
  margin-right: 10px;
}

.list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 200px;
}

.list-query-panel .el-form .query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.list-query-panel .el-form .query-row-second > .query-row-second-inner > .el-form-item {
  display: inline-flex !important;
  width: auto !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  vertical-align: middle;
}

.list-query-panel .el-form .query-row-second-inner .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}
</style>

<style>
/* 本页主容器：顶部与标签栏留 8px 细缝，左右 8px；纵向 flex 铺满视口 */
.app-container.caigou-shenhe-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 14px !important;
}

.app-container.caigou-shenhe-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.caigou-shenhe-page.is-modal-open {
  padding-bottom: 0 !important;
}

.app-container.caigou-shenhe-page .local-modal-mask:not(.material-filter-mask--nested) {
  left: -8px;
  right: -8px;
  top: -8px;
  bottom: -8px;
  width: auto;
  position: absolute;
  align-items: stretch;
  justify-content: stretch;
  padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

.app-container.caigou-shenhe-page .local-modal-mask > .local-modal-content,
.app-container.caigou-shenhe-page .local-modal-mask .local-modal-content.apply-modal-root-content {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-form-compact {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 0 12px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 8px;
  padding-left: 12px;
  box-sizing: border-box;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-input {
  width: 170px !important;
  max-width: 170px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-form-compact .el-input__icon {
  line-height: 28px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-table-panel .apply-detail-table {
  margin-bottom: 0 !important;
  box-shadow: none;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  min-height: 40px;
  flex-shrink: 0;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;
}

.app-container.caigou-shenhe-page .local-modal-content .close-btn {
  border: none;
  background: transparent;
}

.app-container.caigou-shenhe-page .local-modal-content .close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.app-container.caigou-shenhe-page .local-modal-content.apply-modal-root-content {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}

/* 弹窗表头：inline-flex 保证标签与输入框同一行（与到货验收一致） */
.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
  color: #606266;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.caigou-shenhe-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}

/* RK-添加明细：标题栏与修改入库一致 */
.app-container.caigou-shenhe-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.caigou-shenhe-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.caigou-shenhe-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.caigou-shenhe-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* RK-添加明细：标题栏下、查询区与按钮行留白（与修改入库一致） */
.app-container.caigou-shenhe-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* JH-添加明细：搜索条件靠左横向排列 */
.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel {
  padding: 6px 8px 6px 14px !important;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: flex-start !important;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto !important;
  max-width: none !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  float: none !important;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  display: inline-flex !important;
  align-items: center;
  margin-bottom: 0;
  white-space: nowrap;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none !important;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left !important;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

/* RK-添加明细：明细框与到货验收主列表 apply-table-panel 完全一致 */
.app-container.caigou-shenhe-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.caigou-shenhe-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
/* 采购数量输入框随列宽铺满 */
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .plan-qty-input.el-input,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .plan-qty-input {
  width: 100% !important;
  max-width: none !important;
}
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .plan-qty-input .el-input__inner {
  width: 100% !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 6px 8px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
  background: #fff;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-bottom: none;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  display: flex;
  align-items: center;
  padding: 4px 14px;
  box-sizing: border-box;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-toolbar .list-toolbar-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-top: 0;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  box-sizing: border-box;
}

.app-container.caigou-shenhe-page .list-query-panel,
.app-container.caigou-shenhe-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.caigou-shenhe-page > .form-fields-container.list-query-panel {
  background: #fff !important;
  padding: 12px 14px 14px !important;
  border-radius: 10px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  border: 1px solid #e2e8f0 !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.caigou-shenhe-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.caigou-shenhe-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.caigou-shenhe-page .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.app-container.caigou-shenhe-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.caigou-shenhe-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.app-container.caigou-shenhe-page .apply-pagination-wrap .pagination-summary {
  margin-left: 14px;
  padding-left: 2px;
  font-size: 13px;
  color: #606266;
  line-height: 28px;
  flex: 1 1 auto;
  min-width: 180px;
}

.app-container.caigou-shenhe-page .apply-pagination-wrap .pagination-summary .summary-label {
  font-weight: 600;
  color: #303133;
}

.app-container.caigou-shenhe-page .apply-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 52px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto;
  padding: 10px 14px 14px !important;
  background: #fff;
  border: none;
  border-top: 1px solid #eef2f7;
  border-radius: 0 0 10px 10px;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.app-container.caigou-shenhe-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.caigou-shenhe-page .apply-main-table .el-table__header-wrapper th,
.app-container.caigou-shenhe-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
  font-family: inherit !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.caigou-shenhe-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.caigou-shenhe-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.caigou-shenhe-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.caigou-shenhe-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.caigou-shenhe-page .apply-main-table thead th .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.caigou-shenhe-page .apply-main-table th.plan-col-status .cell,
.app-container.caigou-shenhe-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.caigou-shenhe-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.caigou-shenhe-page .apply-main-table.el-table {
  position: relative;
}

.app-container.caigou-shenhe-page .apply-main-table th.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table th.el-table-column--selection,
.app-container.caigou-shenhe-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-shenhe-page .apply-main-table td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .apply-main-table th.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.caigou-shenhe-page .apply-main-table th.apply-action-col,
.app-container.caigou-shenhe-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-shenhe-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr > td,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr > td .cell,
.app-container.caigou-shenhe-page .apply-detail-table .el-table__body tr > td,
.app-container.caigou-shenhe-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr:hover > td,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.caigou-shenhe-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.caigou-shenhe-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.caigou-shenhe-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/*
 * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏，滚动条易与合计行错位。
 * 强制显示表尾，横向滚动条固定在表体与合计之间。
 */
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.caigou-shenhe-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

/* 明细表合计行：与到货验收一致（序号列「合计」，订单数量/金额列汇总） */
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}

.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.caigou-shenhe-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}
</style>