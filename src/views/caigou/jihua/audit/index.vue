<template>
  <div class="app-container list-page caigou-jihua-audit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.planNo"
              placeholder="计划单号"
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
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item class="query-item-inline query-item-status">
              <el-select v-model="queryParams.planStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in planStatusFilterOptions"
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
          class="spd-btn spd-btn--primary"
          @click="handleBatchAudit"
          :disabled="multiple"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['caigou:jihua:export']"
        >导出计划明细</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExportPurchaseRecord"
        >导出采购记录</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="warehouseList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" min-width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmount">
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount != null && scope.row.totalAmount !== ''">{{ formatPrice4(scope.row.totalAmount) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByCreateTime">
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : (scope.row.planDate ? parseTime(scope.row.planDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable label-class-name="plan-col-status" class-name="plan-col-status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.plan_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" prop="auditOpinion" width="160" min-width="140" show-overflow-tooltip resizable sortable />
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="140">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button size="small" type="text" @click="handleView(scope.row)" style="padding: 0 5px; margin: 0;">查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-if="scope.row.planStatus == '1' || scope.row.planStatus == 1"
              style="padding: 0 5px; margin: 0;"
            >审核</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
    </div>
    </div>

<!-- 审核意见对话框 -->
    <el-dialog
      title="审核意见"
      :visible.sync="auditDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="计划单号">
          <el-input v-model="auditForm.planNo" :disabled="true" />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.auditOpinion"
            type="textarea"
            placeholder="审核意见"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitAudit">确定</el-button>
      </div>
    </el-dialog>

    <PlanEditDialog
      v-if="open"
      ref="planEditDialog"
      :visible.sync="open"
      :title="title"
      :form="form"
      :rules="rules"
      :editable="action"
      :entry-list="stkIoBillEntryList"
      :user-options="userOptions"
      :supplier-options="[]"
      :warehouse-locked="true"
      :header-locked="true"
      :plan-entry-mode-disabled="true"
      :plan-source-display="planSourceDisplay"
      :table-height="detailTableHeight"
      :summary-method="getSummaries"
      :detail-selected-row-map="detailSelectedRowMap"
      :supplier-display-fn="entrySupplierDisplay"
      @cancel="cancel"
      @view-apply-details="handleViewApplyDetails"
      @show-apply-bills="handleShowApplyBillNoList"
    />

    <!-- 引用申购单号列表弹窗 -->
    <el-dialog title="引用申购单号" :visible.sync="applyBillNoDialogVisible" width="500px" append-to-body>
      <el-table :data="applyBillNoList" border max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="申购单号" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyBillNoDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 查看申购明细弹窗 -->
    <el-dialog title="申购明细" :visible.sync="applyDetailDialogVisible" width="900px" append-to-body>
      <el-table :data="applyDetailList" border max-height="400">
        <el-table-column label="科室申购单单号" prop="applyBillNo" width="140" show-overflow-tooltip />
        <el-table-column label="申购科室" prop="departmentName" width="120" show-overflow-tooltip />
        <el-table-column label="申购数量" prop="qty" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.qty != null ? Number(scope.row.qty) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
        <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditByName" width="100" show-overflow-tooltip />
        <el-table-column label="审核时间" prop="auditTime" width="160" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyDetailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan, auditPurchasePlan, getApplyBillNoList, getApplyDetails } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import { resolvePlanEntrySource, resolvePlanEntrySupplierName } from '../utils/planEntryUtils';

export default {
  name: "PurchasePlanAudit",
  dicts: ['biz_status','plan_status','bill_type','way_status'],
  components: {
    SelectSupplier,
    SelectWarehouse,
    PlanEditDialog: () => import('../components/PlanEditDialog'),
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      pickerBeginTimeOptions: {
        disabledDate(time) {
            return time.getTime() > Date.now();
        },
      },
      pickerEndTimeOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now();
        },
      },
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      // 总条数
      total: 0,
      // 计划表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 计划明细表格数据
      stkIoBillEntryList: [],
      // 用户选项列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示（审核页面只读）
      action: false,
      // 审核意见弹窗
      auditDialogVisible: false,
      auditForm: {
        planNo: '',
        auditOpinion: ''
      },
      currentAuditRow: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: '1', // 默认查询未提交状态（已提交但未审核）
        proPerson: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        planDate: [
          { required: true, message: "制单时间不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      },
      applyBillNoList: [],
      applyBillNoDialogVisible: false,
      applyDetailList: [],
      applyDetailDialogVisible: false,
      detailSelectedRowMap: {},
      _lastSidebarNavTick: null
    };
  },
  created() {
    this.getList();
    this.getUserList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
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
  computed: {
    planSourceDisplay() {
      const list = this.stkIoBillEntryList || [];
      const set = new Set();
      list.forEach(r => {
        if (r.planSource && String(r.planSource).trim()) set.add(r.planSource);
      });
      return [...set].join('，') || '';
    },
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    /** 采购计划状态筛选项：仅未提交、待审核、已审核 */
    planStatusFilterOptions() {
      const allowed = ['0', '1', '2'];
      return (this.dict.type.plan_status || []).filter((d) => allowed.includes(String(d.value)));
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
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`);
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
      if (!table || !this.warehouseList || !this.warehouseList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.warehouseList.forEach((row) => {
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
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) v = v && v[k];
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAmount(a, b) {
      const va = parseFloat(a && a.totalAmount);
      const vb = parseFloat(b && b.totalAmount);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    sortByCreatorName(a, b) {
      const va = this.getCreatorName(a) || '';
      const vb = this.getCreatorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditorName(a, b) {
      const va = this.getAuditorName(a) || '';
      const vb = this.getAuditorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreateTime(a, b) {
      const pick = (row) => row && (row.createTime || row.planDate) || '';
      const va = pick(a);
      const vb = pick(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditDate(a, b) {
      const va = (a && a.auditDate) || '';
      const vb = (b && b.auditDate) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    /** 单价/金额展示：最多三位小数，末尾 0 不补齐 */
    formatPrice4(value) {
      return this.formatPrice(value, '0');
    },
    // 为主表提供稳定的 row-key，减少 DOM 复用导致的抖动
    planRowKey(row) {
      return row.id || row.planNo;
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
        if (!summaryLabelPlaced && (column.label === '序号' || column.property === 'index')) {
          sums[index] = '合计';
          summaryLabelPlaced = true;
          return;
        }
        if (column.property === 'qty') {
          sums[index] = this.formatQty(sumNum('qty'));
          return;
        }
        if (column.property === 'amt') {
          const t = sumNum('amt');
          sums[index] = '￥' + this.formatAmount(t);
        }
      });
      return sums;
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = this.formatSumByProp(sums[index], column.property);
          }
        }
      });
      return sums;
    },
    /** 查询计划列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listPurchasePlan(params).then(response => {
        this.warehouseList = response.rows || [];
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.warehouseList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    getStatDate(){
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return this.formatQueryDate(d);
    },
    getEndDate(){
      return this.formatQueryDate(new Date());
    },
    formatQueryDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },
    //当天日期
    getBillDate(){
      return this.formatQueryDate(new Date());
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.detailSelectedRowMap = {};
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        telephone: null,
        totalAmount: null,
        auditBy: null,
        auditDate: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.planNo = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.planStatus = '1';
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      const pageKeys = (this.warehouseList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key);
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) this.$set(this.selectedRowMap, key, row);
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
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
    /** 查看按钮操作（与采购计划处单据查看一致） */
    handleView(row){
      const id = row.id;
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.purchasePlanEntryList || [];
        this.detailSelectedRowMap = {};
        this.fillPlanSourceForEntries();
        this.open = true;
        this.action = false;
        this.title = "查看计划";
        this.$nextTick(() => {
          const dlg = this.$refs.planEditDialog;
          if (dlg && typeof dlg.layoutEntryTable === 'function') {
            dlg.layoutEntryTable();
          }
        });
      });
    },
    /** 明细行供应商展示（与采购计划页一致，含产品档案供应商） */
    entrySupplierDisplay(row) {
      return resolvePlanEntrySupplierName(row, {
        planSupplier: this.form && this.form.supplier
      })
    },
    /** 根据明细关联申购单信息填充计划来源（科室计划/手工新增） */
    fillPlanSourceForEntries() {
      (this.stkIoBillEntryList || []).forEach(row => {
        row.planSource = resolvePlanEntrySource(row);
      });
    },
    /** 查看引用申购单号列表 */
    handleShowApplyBillNoList() {
      if (!this.form.id) return;
      getApplyBillNoList(this.form.id).then(response => {
        const list = (response && response.data) ? (Array.isArray(response.data) ? response.data : (response.data.data || [])) : [];
        this.applyBillNoList = list.length > 0 ? list : (this.form.referenceBillNo ? (this.form.referenceBillNo + '').split(/[,，]/).map(s => (s || '').trim()).filter(Boolean) : []);
        this.applyBillNoDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取引用申购单号失败");
      });
    },
    /** 查看申购明细（计划明细行） */
    handleViewApplyDetails(row) {
      if (!row.id) return;
      getApplyDetails(row.id).then(response => {
        const data = response && response.data;
        this.applyDetailList = (Array.isArray(data) ? data : (data && data.data) || []) || [];
        this.applyDetailDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购明细失败");
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.currentAuditRow = row;
      this.auditForm.planNo = row.planNo;
      this.auditForm.auditOpinion = '同意';
      this.auditDialogVisible = true;
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的计划！");
        return;
      }

      // 检查选中的计划是否都是未提交状态（状态值1）
      const selectedPlans = this.warehouseList.filter(item => this.ids.includes(item.id));
      const nonPendingPlans = selectedPlans.filter(item => item.planStatus !== '1' && item.planStatus !== 1);

      if (nonPendingPlans.length > 0) {
        const statusInfo = nonPendingPlans.map(plan => `${plan.planNo}(状态:${plan.planStatus})`).join(', ');
        this.$modal.msgError(`只能审核未提交状态的计划！以下计划状态不正确：${statusInfo}`);
        return;
      }

      // 批量审核也使用弹窗输入审核意见
      const planNos = selectedPlans.map(item => item.planNo).join('、');
      this.currentAuditRow = { id: null, planNo: planNos, isBatch: true };
      this.auditForm.planNo = `批量审核（${this.ids.length}个计划）`;
      this.auditForm.auditOpinion = '同意';
      this.auditDialogVisible = true;
    },
    /** 至少一条未删除明细 */
    validatePlanEntriesActive(planId) {
      return getPurchasePlan(planId).then(response => {
        const list = response.data.purchasePlanEntryList || [];
        const active = list.filter(e => e && (e.delFlag == null || e.delFlag === '' || String(e.delFlag) !== '1'));
        if (active.length === 0) {
          return Promise.reject(new Error(response.data.planNo + '：无有效明细，不允许审核。'));
        }
        return Promise.resolve();
      });
    },
    /** 校验计划明细是否全部指定供应商，返回 Promise，不通过时 reject */
    validatePlanEntriesSupplier(planId) {
      return getPurchasePlan(planId).then(response => {
        const list = response.data.purchasePlanEntryList || [];
        const noSupplier = list.filter(e => e.materialId && (e.supplierId == null || e.supplierId === ''));
        if (noSupplier.length > 0) {
          return Promise.reject(new Error(response.data.planNo + '：存在 ' + noSupplier.length + ' 条明细未指定供应商，请先为每条明细指定供应商后再审核。'));
        }
        return Promise.resolve();
      });
    },
    /** 校验计划明细数量均大于0，返回 Promise，不通过时 reject */
    validatePlanEntriesQty(planId) {
      return getPurchasePlan(planId).then(response => {
        const list = response.data.purchasePlanEntryList || [];
        const invalidQty = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
        if (invalidQty.length > 0) {
          return Promise.reject(new Error(response.data.planNo + '：存在明细数量为空或0，不允许审核。'));
        }
        return Promise.resolve();
      });
    },
    /** 提交审核 */
    submitAudit() {
      if (!this.currentAuditRow) {
        return;
      }
      const currentUser = this.$store.state.user;
      const auditBy = currentUser.nickName || currentUser.userName || currentUser.userId;
      const auditOpinion = this.auditForm.auditOpinion || '';

      if (this.currentAuditRow.isBatch) {
        // 批量审核：先校验每个计划的明细供应商与数量
        const validateActive = this.ids.map(id => this.validatePlanEntriesActive(id));
        const validateSupplier = this.ids.map(id => this.validatePlanEntriesSupplier(id));
        const validateQty = this.ids.map(id => this.validatePlanEntriesQty(id));
        Promise.all([...validateActive, ...validateSupplier, ...validateQty]).then(() => {
          const auditPromises = this.ids.map(id => auditPurchasePlan({id: id, auditBy: auditBy, auditOpinion: auditOpinion}));
          return Promise.all(auditPromises);
        }).then(() => {
          this.auditDialogVisible = false;
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个计划");
          this.currentAuditRow = null;
          this.auditForm.planNo = '';
          this.auditForm.auditOpinion = '';
        }).catch(err => {
          this.$modal.msgError(err && err.message ? err.message : "批量审核失败！");
        });
      } else {
        const id = this.currentAuditRow.id;
        Promise.all([
          this.validatePlanEntriesActive(id),
          this.validatePlanEntriesSupplier(id),
          this.validatePlanEntriesQty(id)
        ]).then(() => {
          return auditPurchasePlan({id: id, auditBy: auditBy, auditOpinion: auditOpinion});
        }).then(() => {
          this.auditDialogVisible = false;
          this.getList();
          this.$modal.msgSuccess("审核成功！");
          this.currentAuditRow = null;
          this.auditForm.planNo = '';
          this.auditForm.auditOpinion = '';
        }).catch(err => {
          this.$modal.msgError(err && err.message ? err.message : "审核失败！");
        });
      }
    },
    /** 导出计划明细（供货清单）：有勾选时仅导出所选计划；否则按当前筛选导出 */
    handleExport() {
      const params = { ...this.queryParams }
      delete params.pageNum
      delete params.pageSize
      if (this.ids && this.ids.length > 0) {
        params.planIds = this.ids.join(',')
      }
      this.download('caigou/jihua/export', params, `采购计划明细_${new Date().getTime()}.xlsx`)
    },
    /** 导出采购记录：按选中的计划单汇总，生成「年份月份耗材采购记录」Excel，首行为标题 */
    handleExportPurchaseRecord() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先选择要导出的采购计划')
        return
      }
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth() + 1
      const fileName = `${y}年${m < 10 ? '0' + m : m}月耗材采购记录.xlsx`
      this.download('caigou/jihua/exportPurchaseRecord', { ids: this.ids.join(',') }, fileName)
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      // 优先使用 creater.nickName
      if (row.creater && row.creater.nickName) {
        return row.creater.nickName;
      }
      // 如果没有 creater 对象，根据 createBy 查找用户姓名
      if (row.createBy) {
        const user = this.userOptions.find(u => u.userName === row.createBy || u.userId === row.createBy);
        return user ? (user.nickName || user.userName) : row.createBy;
      }
      return '';
    },
    /** 获取审核人姓名 */
    getAuditorName(row) {
      if (row.auditBy) {
        // 先尝试通过userId查找用户（支持数字和字符串类型）
        const userById = this.userOptions.find(u => {
          return u.userId == row.auditBy || 
                 u.userId === row.auditBy || 
                 String(u.userId) === String(row.auditBy) ||
                 u.userId === Number(row.auditBy);
        });
        if (userById) {
          return userById.nickName || userById.userName;
        }
        // 再尝试通过userName查找用户
        const userByName = this.userOptions.find(u => u.userName === row.auditBy);
        if (userByName) {
          return userByName.nickName || userByName.userName;
        }
        // 再尝试通过nickName查找用户
        const userByNickName = this.userOptions.find(u => u.nickName === row.auditBy);
        if (userByNickName) {
          return userByNickName.nickName || userByNickName.userName;
        }
        // 如果auditBy不是纯数字，可能是姓名，直接返回
        if (!/^\d+$/.test(String(row.auditBy))) {
          return row.auditBy;
        }
        // 如果auditBy是纯数字但找不到用户，返回"--"而不是空字符串
        return '--';
      }
      return '--';
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  min-height: 40px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内顶部字段区：与到货验收查看入库一致 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 弹窗内明细区：与到货验收查看入库一致 */
.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .detail-toolbar-row {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  box-sizing: border-box;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-input,
.local-modal-content .modal-form-compact .el-select,
.local-modal-content .modal-form-compact .el-date-picker {
  width: 140px;
  max-width: 140px;
}

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper td {
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
}

.modal-footer .el-button {
  margin-left: 8px;
}

/* 弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(-50px);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

  /* 查询条件紧凑布局 */
  .app-container > .el-form .el-row {
    margin-bottom: 8px;
  }

  .app-container > .el-form .el-row:last-child {
    margin-bottom: 0;
  }

  .app-container > .el-form .el-form-item {
    margin-bottom: 0;
  }

  /* 第一行查询条件左对齐紧凑布局 */
  .app-container > .el-form .query-row-left .el-col {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .app-container > .el-form .query-row-left .query-item-inline {
    display: inline-block;
    margin-right: 16px;
    margin-bottom: 0;
    vertical-align: top;
  }

  .app-container > .el-form .query-row-left .query-item-inline:last-child {
    margin-right: 0;
  }

  /* 统一控制查询条件输入框宽度 */
  .app-container > .el-form .query-row-left .query-item-inline .el-input {
    width: 180px;
  }

  .app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
    width: 180px;
    display: inline-block;
  }

  .app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
    width: 100%;
  }

  .app-container > .el-form .query-row-left .query-item-inline .el-select {
    width: 150px;
  }

  /* 第二行单据状态对齐到仓库位置 */
  .app-container > .el-form .query-row-second {
    position: relative;
  }

  /* 确保制单日期的两个日期选择器在同一行 */
  .app-container > .el-form .query-row-second .el-form-item {
    white-space: nowrap;
  }

  .app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
  }

  .app-container > .el-form .query-row-second .query-status-col {
    position: absolute;
    left: 552px;
    width: auto;
    padding-left: 0;
    padding-right: 0;
  }

  .query-item-status-aligned .el-form-item__label {
    width: 80px !important;
  }

  /* 搜索区域样式 */
  .app-container > .el-form {
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
  }

  .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }

  .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }

  /* 按钮样式 */
  .el-button--text {
    padding: 0 4px;
  }

  .el-button--text:hover {
    color: #409EFF;
  }

  /* 弹窗内表单紧凑布局 */
  .local-modal-content .modal-form-compact .el-row {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: nowrap;
  }

  .local-modal-content .modal-form-compact .el-row .el-col {
    flex-shrink: 0;
  }

  .local-modal-content .modal-form-compact .el-form-item {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .local-modal-content .modal-form-compact .el-input,
  .local-modal-content .modal-form-compact .el-select,
  .local-modal-content .modal-form-compact .el-date-picker {
    width: 140px;
    max-width: 140px;
  }

  .local-modal-content .modal-form-compact .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
    font-size: 13px !important;
  }

  .local-modal-content .modal-form-compact .el-input__icon {
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-select .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor.el-input {
    height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-form-item__content {
    margin-left: 0 !important;
    line-height: 28px;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    text-align: left;
    padding-right: 6px;
    line-height: 28px;
    height: 28px;
    font-size: 13px;
  }

  /* 分页组件样式 */
  .table-pagination {
    margin-top: 16px;
  }

  /* 缩小所有输入框高度 */
  .local-modal-content .modal-form-compact .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
    font-size: 13px !important;
  }

  .local-modal-content .modal-form-compact .el-input__icon {
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-select .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor.el-input {
    height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-form-item__content {
    margin-left: 0 !important;
    line-height: 28px;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    text-align: left;
    padding-right: 6px;
    line-height: 28px;
    height: 28px;
    font-size: 13px;
  }

  /* 加粗滚动条 - 覆盖所有表格滚动条 */
  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
  .local-modal-content .el-table::-webkit-scrollbar,
  .local-modal-content .table-wrapper::-webkit-scrollbar {
    width: 10px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
  .local-modal-content .el-table::-webkit-scrollbar-track,
  .local-modal-content .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
  .local-modal-content .el-table::-webkit-scrollbar-thumb,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  .local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }

/* 表格样式优化（弹窗内表格，勿影响主列表 apply-main-table） */
.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担，内层 el-form 不再重复包一层 */
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

/* 第一行查询条件左对齐紧凑布局 */
.list-query-panel .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.list-query-panel .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.list-query-panel .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 单据状态对齐到仓库下面 - 使用margin-left对齐到第三个位置 */
/* 计算：入库单号(80px label + 180px input + 16px margin) + 供应商(80px label + 180px input + 16px margin) = 552px */
.list-query-panel .el-form .query-row-left .query-item-aligned {
  margin-left: 552px;
}

/* 按钮对齐到仓库下面 - 按钮没有label，所以对齐到仓库input的开始位置 */
/* 仓库起始位置 552px + label 80px = 632px */
.list-query-panel .el-form .query-row-left .query-button-aligned {
  margin-left: 632px;
  display: inline-block;
}

/* 确保第三行的按钮单独显示 */
.list-query-panel .el-form .query-row-left:last-child {
  min-height: 32px;
}

.list-query-panel .el-form .query-row-left:last-child .el-col {
  flex-wrap: nowrap;
}

/* 第二行：inline 表单下列内强制块级，避免日期区溢出盖住「单据状态」 */
.list-query-panel .el-form .query-row-second > .el-col > .el-form-item {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) {
  white-space: nowrap;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item {
  white-space: normal;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  max-width: 100%;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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
.app-container.caigou-jihua-audit-page {
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

.app-container.caigou-jihua-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.caigou-jihua-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.caigou-jihua-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}

/* RK-添加明细：标题栏与修改入库一致 */
.app-container.caigou-jihua-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.caigou-jihua-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.caigou-jihua-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.caigou-jihua-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
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
.app-container.caigou-jihua-audit-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.caigou-jihua-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.caigou-jihua-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.caigou-jihua-audit-page .list-query-panel,
.app-container.caigou-jihua-audit-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.caigou-jihua-audit-page > .form-fields-container.list-query-panel {
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

.app-container.caigou-jihua-audit-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.caigou-jihua-audit-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.caigou-jihua-audit-page .apply-table-panel {
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

.app-container.caigou-jihua-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.caigou-jihua-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .apply-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 52px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
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

.app-container.caigou-jihua-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.caigou-jihua-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.caigou-jihua-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.caigou-jihua-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.caigou-jihua-audit-page .apply-main-table thead th .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table th.plan-col-status .cell,
.app-container.caigou-jihua-audit-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.caigou-jihua-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.caigou-jihua-audit-page .apply-main-table th.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table th.el-table-column--selection,
.app-container.caigou-jihua-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .apply-main-table th.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table th.apply-action-col,
.app-container.caigou-jihua-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr > td,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr > td .cell,
.app-container.caigou-jihua-audit-page .apply-detail-table .el-table__body tr > td,
.app-container.caigou-jihua-audit-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.caigou-jihua-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.caigou-jihua-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.caigou-jihua-audit-page .apply-main-table .el-table__header th.gutter {
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
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.caigou-jihua-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.caigou-jihua-audit-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-jihua-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
