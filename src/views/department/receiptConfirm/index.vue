<template>
  <div class="app-container list-page receipt-confirm-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="出库单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.materialName"
              placeholder="耗材名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" placeholder="仓库"/>
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.departmentId" field-placeholder="科室" />
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
                v-model="queryParams.auditBeginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.auditEndDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="receiptConfirmStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.receiptConfirmStatus" placeholder="收货状态"
                         clearable class="apply-query-field">
                <el-option label="未确认" :value="0" />
                <el-option label="已确认" :value="1" />
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
          :disabled="multiple"
          @click="handleBatchConfirm"
          v-hasPermi="['department:receiptConfirm:confirm']"
        >确认收货</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:receiptConfirm:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="receiptList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="出库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="createrName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
        <template slot-scope="scope">
          <span>{{ scope.row.createrName || scope.row.createrNickName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="收货状态" align="center" prop="receiptConfirmStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.receiptConfirmStatus == 1" type="success">已确认</el-tag>
          <el-tag v-else type="primary">未确认</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="收货人" align="center" prop="updateByUserName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByReceiverName">
        <template slot-scope="scope">
          <span>{{ scope.row.updateByUserName || scope.row.updateByNickName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="确认日期" align="center" prop="updateTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="100">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleView(scope.row)"
            style="padding: 0 5px; margin: 0;"
          >查看</el-button>
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

    <!-- 收货确认对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="modal-form-wrapper">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="出库单号" prop="billNo" label-width="100px">
                      <el-input v-model="form.billNo" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="收货状态" prop="receiptConfirmStatus" label-width="100px">
                      <el-input v-model="receiptStatusText" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="createrName" label-width="100px">
                      <el-input :value="form.createrName || form.createrNickName || '--'" :disabled="true" placeholder="制单人" style="width: 150px"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="billDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="form.billDate"
                                      type="date"
                                      style="width: 150px"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" prop="totalAmount" label-width="100px">
                      <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" style="width: 150px"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="收货人" prop="updateByUserName" label-width="100px">
                      <el-input :value="form.updateByUserName || form.updateByNickName || '--'" :disabled="true" placeholder="收货人" style="width: 150px"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark" label-width="100px">
                      <el-input v-model="form.remark" placeholder="备注" style="width: 150px" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>出库明细信息</span>
                </el-col>
              </el-row>

              <div class="table-wrapper">
              <el-table :data="receiptEntryList" :row-class-name="rowReceiptEntryIndex" ref="receiptEntry" border>
                <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.code) || scope.row.materialCode || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材" align="center" prop="materialName" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="materialSpec" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.materialSpec || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unit || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice | formatPrice }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.amt">¥{{ scope.row.amt | formatCurrency }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplierName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplierName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { listReceiptConfirm, getReceiptConfirm, confirmReceipt } from "@/api/department/receiptConfirm";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import { parseTime } from '@/utils/ruoyi';

function buildListDefaultDateRange() {
  const today = new Date();
  const auditEndDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const auditBeginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { auditBeginDate, auditEndDate };
}

export default {
  name: "receiptConfirm",
  dicts: [],
  components: {SelectWarehouse, SelectDepartment, SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      // 总条数
      total: 0,
      // 收货单表格数据
      receiptList: [],
      // 出库单明细表格数据
      receiptEntryList: [],
      // 收货状态文本显示
      receiptStatusText: '',
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialName: null,
        ...buildListDefaultDateRange(),
        warehouseId: null,
        departmentId: null,
        userId: null,
        receiptConfirmStatus: 0, // 默认未确认（0=未确认，1=已确认）
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {}
    };
  },
  created() {
    this.mergeRouteQueryIntoSearch();
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  activated() {
    this.mergeRouteQueryIntoSearch();
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
    },
    '$route.query.billNo'(val) {
      if (val) {
        this.queryParams.billNo = String(val);
        this.queryParams.pageNum = 1;
        this.getList();
      }
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
        if (table && table.doLayout) {
          table.doLayout();
        }
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
      if (!path) {
        return '';
      }
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
      }
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) {
        return;
      }
      if (nav.tick === this._lastSidebarNavTick) {
        return;
      }
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreaterName(a, b) {
      const va = (a && (a.createrName || a.createrNickName)) || '';
      const vb = (b && (b.createrName || b.createrNickName)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByReceiverName(a, b) {
      const va = (a && (a.updateByUserName || a.updateByNickName)) || '';
      const vb = (b && (b.updateByUserName || b.updateByNickName)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.receiptList || !this.receiptList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.receiptList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    /** 从路由 query 带入出库单号（消息提醒双击跳转等） */
    mergeRouteQueryIntoSearch() {
      const q = this.$route && this.$route.query ? this.$route.query : {}
      if (q.billNo != null && String(q.billNo).trim() !== '') {
        this.queryParams.billNo = String(q.billNo).trim()
        if (this.queryParams.receiptConfirmStatus === null || this.queryParams.receiptConfirmStatus === '') {
          this.queryParams.receiptConfirmStatus = 0
        }
      }
    },
    /** 查询出库单列表（支持全部、未确认、已确认） */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      if (params.receiptConfirmStatus === null || params.receiptConfirmStatus === '') {
        delete params.receiptConfirmStatus;
      }
      listReceiptConfirm(params).then(response => {
        this.receiptList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        billNo: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        createrName: null,
        receiptConfirmStatus: null,
        totalAmount: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.receiptEntryList = [];
      this.receiptStatusText = '';
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
      this.queryParams.billNo = null;
      this.queryParams.materialName = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.receiptConfirmStatus = 0;
      Object.assign(this.queryParams, buildListDefaultDateRange());
      this.mergeRouteQueryIntoSearch();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.receiptList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.$forceUpdate) {
          table.$forceUpdate();
        }
      });
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getReceiptConfirm(id).then(response => {
        this.form = response.data;
        this.receiptEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;

        // 设置收货状态文本显示
        this.setReceiptStatusText(response.data.receiptConfirmStatus);

        this.title = "收货确认";
      });
    },
    /** 批量确认收货 */
    handleBatchConfirm() {
      if (this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要确认的出库单");
        return;
      }
      // 检查选中的出库单是否都是未确认状态
      const selectedRows = Object.values(this.selectedRowMap || {});
      const hasConfirmed = selectedRows.some(row => row.receiptConfirmStatus === 1);
      if (hasConfirmed) {
        this.$modal.msgWarning("选中的出库单中包含已确认的单据，请重新选择");
        return;
      }
      this.$modal.confirm('确定要确认选中的' + this.ids.length + '条出库单吗？').then(() => {
        const userId = this.$store.state.user.userId;
        confirmReceipt({
          ids: this.ids.join(','),
          confirmBy: String(userId)
        }).then(() => {
          this.$modal.msgSuccess("确认成功");
          this.getList();
        });
      }).catch(() => {});
    },
    /** 出库单明细序号 */
    rowReceiptEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 设置收货状态文本显示 */
    setReceiptStatusText(receiptConfirmStatus) {
      if (receiptConfirmStatus === 1) {
        this.receiptStatusText = '已确认';
      } else {
        this.receiptStatusText = '未确认';
      }
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = { ...this.queryParams };
      // 如果receiptConfirmStatus为null，则不传该参数，导出全部状态
      if (params.receiptConfirmStatus === null || params.receiptConfirmStatus === '') {
        delete params.receiptConfirmStatus;
      }
      this.download('department/receiptConfirm/export', {
        ...params
      }, `receiptConfirm_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
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
  min-height: 95vh !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: 1px solid #DCDFE6;
  background: #fff;
  padding: 7px 15px;
}

.close-btn:hover {
  background: #F5F7FA;
  border-color: #C0C4CC;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 10px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 弹窗内表单字段容器 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
}

.local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担 */
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

.list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 200px;
}

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

/* 按钮行样式（仅弹窗内，勿影响主列表 list-toolbar 与搜索区间的全局留白） */
.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

</style>


<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.receipt-confirm-page {
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


.app-container.receipt-confirm-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}



.app-container.receipt-confirm-page .list-query-panel,
.app-container.receipt-confirm-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.receipt-confirm-page .apply-table-panel {
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

.app-container.receipt-confirm-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.receipt-confirm-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.receipt-confirm-page .apply-pagination-wrap .pagination-container {
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

.app-container.receipt-confirm-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__header-wrapper th,
.app-container.receipt-confirm-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.receipt-confirm-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.receipt-confirm-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.receipt-confirm-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.receipt-confirm-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.receipt-confirm-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.receipt-confirm-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.receipt-confirm-page .apply-main-table.el-table {
  position: relative;
}

.app-container.receipt-confirm-page .apply-main-table th.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table th.el-table-column--selection,
.app-container.receipt-confirm-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.receipt-confirm-page .apply-main-table td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.receipt-confirm-page .apply-main-table th.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.receipt-confirm-page .apply-main-table th.apply-action-col,
.app-container.receipt-confirm-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.receipt-confirm-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.receipt-confirm-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr > td,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr:hover > td,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.receipt-confirm-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.receipt-confirm-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

.app-container.receipt-confirm-page.is-modal-open .apply-table-panel {
  visibility: hidden;
}
</style>
