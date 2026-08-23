<template>
  <div class="app-container list-page d-purchase-agg-audit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.purchaseBillNo"
              placeholder="申购单号"
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
            <el-form-item prop="purchaseBillStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.purchaseBillStatus" placeholder="状态"
                         clearable class="apply-query-field">
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
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
          v-hasPermi="['department:purchaseAudit:audit']"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          @click="handleToolbarReject"
          v-hasPermi="['department:purchaseAudit:reject']"
        >驳回</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:purchaseAudit:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="purchaseList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="申购单号" align="center" prop="purchaseBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.purchaseBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="拆分状态" align="center" prop="splitStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.splitStatus == 1" type="success" size="small">已拆分</el-tag>
          <el-tag v-else type="info" size="small">未拆分</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrPersonName" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ formatCreatorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申购状态" align="center" prop="purchaseBillStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag v-if="scope.row.purchaseBillStatus != '1' && scope.row.purchaseBillStatus != 1" :options="dict.type.purchase_status" :value="scope.row.purchaseBillStatus"/>
          <el-tag v-else type="primary">未审核</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" align="center" prop="urgencyLevel" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.urgency_level" :value="scope.row.urgencyLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="期望到货日期" align="center" prop="expectedDeliveryDate" width="160" min-width="160" label-class-name="col-expected-delivery-header" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.expectedDeliveryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ formatAuditPersonName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="isAuditedPurchase(scope.row) && scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ formatRejectReason(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="230">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRowDetail(scope.row)"
              v-hasPermi="['department:purchaseAudit:export']"
              style="padding: 0 5px; margin: 0;"
            >导出明细</el-button>
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

    <!-- 申购单审核对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact modal-form-wrapper">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="申购单号" prop="purchaseBillNo">
                      <el-input v-model="form.purchaseBillNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申购状态" prop="purchaseBillStatus">
                      <el-select v-model="form.purchaseBillStatus" placeholder="请选择申购状态"
                                 :disabled="true"
                                 clearable>
                        <el-option v-for="dict in dict.type.purchase_status"
                                   :key="dict.value"
                                   :label="dict.label"
                                   :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark" class="form-item-remark">
                      <el-input v-model="form.remark" placeholder="备注" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'" :span="4">
                    <el-form-item
                      label="驳回原因"
                      prop="rejectReason"
                      class="form-item-reject-reason"
                    >
                      <el-input
                        v-model="form.rejectReason"
                        clearable
                        placeholder="驳回原因（驳回时必填）"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="purchaseBillDate">
                      <el-date-picker clearable
                                      v-model="form.purchaseBillDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="userId">
                      <el-input v-model="form.userName" :disabled="true" placeholder="—" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="紧急程度" prop="urgencyLevel" class="form-item-urgency">
                      <el-input v-model="urgencyLevelText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="期望到货" prop="expectedDeliveryDate">
                      <el-date-picker clearable
                                      v-model="form.expectedDeliveryDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择期望到货日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="24">
                  <div class="detail-header-row">
                    <span class="detail-header-title">汇总申购明细信息</span>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      size="small"
                      class="detail-action-btn"
                      @click="cancel"
                    >取 消</el-button>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      type="danger"
                      size="small"
                      class="detail-action-btn"
                      @click="handleRejectSubmit"
                    >驳 回</el-button>
                    <el-button
                      v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
                      type="primary"
                      icon="el-icon-check"
                      size="small"
                      class="detail-action-btn"
                      @click="handleAuditSubmit"
                    >审 核</el-button>
                  </div>
                </el-col>
              </el-row>

              <div class="table-wrapper">
              <el-table :data="entryList" :row-class-name="rowDepPurchaseApplyEntryIndex" ref="depPurchaseApplyEntry" height="100%" border :summary-method="getPurchaseSummaries" show-summary>
                <el-table-column type="selection" width="55" align="center" fixed="left" resizable />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || scope.row.code || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材" align="center" prop="materialName" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.warehouseName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="高值/低值" align="center" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatIsGzLabel(scope.row.isGz) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="拆分科室申购单号" align="center" prop="splitDepPurchaseBillNo" min-width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.splitDepPurchaseBillNo || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="materialSpec" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialSpec || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit || '--' }}</span>
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
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { listPurchaseAggAudit, getPurchaseAggAudit, auditPurchaseAgg, rejectPurchaseAgg } from "@/api/department/purchaseAggAudit";
import { assertBillEntriesReadyForAudit } from '@/utils/billEntryValidate';
import { formatIsGzLabel } from '@/utils/purchaseAggEntry';
import { parseTime } from '@/utils/ruoyi';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';

function buildListDefaultDateRange() {
  const today = new Date();
  const endDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const beginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { beginDate, endDate };
}

export default {
  name: "dPurchaseAggAudit",
  dicts: ['purchase_status', 'urgency_level'],
  components: {SelectWarehouse, SelectDepartment},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 当前勾选的行数据
      selectedRows: [],
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      // 总条数
      total: 0,
      // 汇总申购表格数据
      purchaseList: [],
      // 汇总申购明细表格数据
      entryList: [],
      // 紧急程度文本显示
      urgencyLevelText: '',
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        purchaseBillNo: null,
        ...buildListDefaultDateRange(),
        warehouseId: null,
        departmentId: null,
        userId: null,
        purchaseBillStatus: null, // 默认显示全部状态（未审核和已审核）
        urgencyLevel: null,
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
    this.applyRoutePurchaseBillQuery();
    this.getList();
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
    },
    '$route.query.purchaseBillNo'(val) {
      if (val) {
        this.queryParams.purchaseBillNo = String(val);
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
      if (!table || !this.purchaseList || !this.purchaseList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.purchaseList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    formatCreatorName(row) {
      if (!row) return '--';
      const name = row.createrPersonName
        || (row.user && (row.user.nickName || row.user.userName || row.user.name));
      return name || row.userName || '--';
    },
    formatAuditPersonName(row) {
      if (!row || !this.isAuditedPurchase(row)) return '--';
      return row.auditPersonName || '--';
    },
    isAuditedPurchase(row) {
      const s = row && row.purchaseBillStatus;
      return s === 2 || s === '2';
    },
    syncSelectedRowsFromMap() {
      this.selectedRows = Object.keys(this.selectedRowMap || {}).map((key) => this.selectedRowMap[key]);
    },
    formatIsGzLabel,
    formatRejectReason(row) {
      if (!row) return '--';
      const parts = [];
      if (row.rejectReason && String(row.rejectReason).trim()) {
        parts.push(String(row.rejectReason).trim());
      }
      if (row.splitPlanRejectReason && String(row.splitPlanRejectReason).trim()) {
        parts.push(String(row.splitPlanRejectReason).trim());
      }
      return parts.length ? parts.join('；') : '--';
    },
    /** 消息提醒双击等：路由带入申购单号 */
    applyRoutePurchaseBillQuery() {
      const ref = this.$route.query && this.$route.query.purchaseBillNo;
      if (!ref) return;
      this.queryParams.purchaseBillNo = String(ref);
      this.queryParams.pageNum = 1;
    },
    /** 查询申购单列表（支持全部、未审核、已审核） */
    getList() {
      this.loading = true;
      // applyBillStatus根据用户选择：null=全部，1=未审核，2=已审核
      const params = { ...this.queryParams };
      // 如果purchaseBillStatus为null，则不传该参数，查询全部状态
      if (params.purchaseBillStatus === null || params.purchaseBillStatus === '') {
        delete params.purchaseBillStatus;
      }
      listPurchaseAggAudit(params).then(response => {
        this.purchaseList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.syncSelectedRowsFromMap();
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
        purchaseBillNo: null,
        purchaseBillDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        userName: null,
        purchaseBillStatus: null,
        totalAmount: null,
        urgencyLevel: null,
        expectedDeliveryDate: null,
        rejectReason: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.entryList = [];
      this.urgencyLevelText = '';
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
      this.queryParams.purchaseBillNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.purchaseBillStatus = null;
      Object.assign(this.queryParams, buildListDefaultDateRange());
      this.applyRoutePurchaseBillQuery();
      this.handleQuery();
    },
    // 多选框选中数据（跨页缓存）
    handleSelectionChange(selection) {
      const pageKeys = (this.purchaseList || [])
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
      this.syncSelectedRowsFromMap();
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchaseAggAudit(id).then(response => {
        this.form = response.data;
        this.entryList = response.data.entryList || [];
        this.open = true;

        if(response.data.purchaseBillStatus == 1){
          this.form.purchaseBillStatus = '1';
        }else if(response.data.purchaseBillStatus == 2){
          this.form.purchaseBillStatus = '2';
        }else{
          this.form.purchaseBillStatus = '3';
        }
        
        // 设置紧急程度文本显示
        this.setUrgencyLevelText(response.data.urgencyLevel);

        this.title = "申购单审核";
      });
    },
    /** 审核按钮操作（表格中，已废弃，保留兼容） */
    handleAudit(row) {
      this.handleView(row);
    },
    /** 驳回按钮操作（表格中，已废弃，保留兼容） */
    handleReject(row) {
      this.handleView(row);
    },
    /** 审核提交 */
    handleAuditSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要审核的申购单");
        return;
      }
      if (!assertBillEntriesReadyForAudit(this.entryList, this, '汇总申购单')) {
        return;
      }
      const list = this.entryList || [];
      const missingWh = list.filter(e => e.materialId && !e.warehouseId);
      if (missingWh.length > 0) {
        this.$modal.msgError("存在明细未关联仓库，不允许审核。");
        return;
      }
      const userId = this.$store.state.user.userId;
      auditPurchaseAgg({
        id: String(this.form.id),
        auditBy: userId
      }).then(() => {
        this.$modal.msgSuccess("审核成功");
        this.open = false;
        this.getList();
      });
    },
    /** 驳回提交 */
    handleRejectSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要驳回的申购单");
        return;
      }
      if (!this.form.rejectReason || this.form.rejectReason.trim() === '') {
        this.$modal.msgError("请填写驳回原因");
        return;
      }
      const userId = this.$store.state.user.userId;
      rejectPurchaseAgg({
        id: String(this.form.id),
        rejectReason: this.form.rejectReason
      }).then(() => {
        this.$modal.msgSuccess("驳回成功");
        this.open = false;
        this.getList();
      });
    },
    /** 工具栏批量审核：支持选择多条未审核申购单 */
    handleBatchAudit() {
      if (!this.selectedRows || this.selectedRows.length === 0) {
        this.$modal.msgError("请先选择要审核的申购单");
        return;
      }
      const pendingList = this.selectedRows.filter(
        row => row.purchaseBillStatus == 1 || row.purchaseBillStatus === '1'
      );
      if (pendingList.length === 0) {
        this.$modal.msgError("请选择未审核的申购单进行审核");
        return;
      }
      const userId = this.$store.state.user.userId;
      this.$modal.confirm(`确认审核选中的 ${pendingList.length} 条申购单吗？`).then(() => {
        const validatePromises = pendingList.map(row =>
          getPurchaseAggAudit(row.id).then(resp => {
            const list = resp.data.entryList || [];
            const billNo = resp.data.purchaseBillNo || row.id;
            if (!list.length) {
              return Promise.reject(new Error(billNo + '：无明细，不允许审核。'));
            }
            for (let i = 0; i < list.length; i++) {
              const e = list[i];
              const lineLabel = (e && (e.materialName || e.materialCode)) || `第${i + 1}行`;
              if (!e || e.materialId == null || e.materialId === '') {
                return Promise.reject(new Error(billNo + '：明细【' + lineLabel + '】产品档案不能为空，不允许审核。'));
              }
              const n = Number(e.qty);
              if (e.qty == null || e.qty === '' || !Number.isFinite(n) || n <= 0) {
                return Promise.reject(new Error(billNo + '：明细【' + lineLabel + '】申购数量不能为空且必须大于0，不允许审核。'));
              }
              if (!e.warehouseId) {
                return Promise.reject(new Error(billNo + '：明细【' + lineLabel + '】未关联仓库，不允许审核。'));
              }
            }
            return Promise.resolve();
          })
        );
        Promise.all(validatePromises).then(() => {
          const requests = pendingList.map(row =>
            auditPurchaseAgg({ id: String(row.id), auditBy: userId })
          );
          return Promise.all(requests);
        }).then(() => {
          this.$modal.msgSuccess("审核成功");
          this.getList();
        }).catch(err => {
          this.$modal.msgError(err && err.message ? err.message : "审核失败");
        });
      }).catch(() => {});
    },
    /** 工具栏驳回：只允许单条，弹出详情弹窗填写驳回原因 */
    handleToolbarReject() {
      if (!this.selectedRows || this.selectedRows.length === 0) {
        this.$modal.msgError("请先选择要驳回的申购单");
        return;
      }
      if (this.selectedRows.length > 1) {
        this.$modal.msgError("驳回操作一次只能选择一条申购单");
        return;
      }
      const row = this.selectedRows[0];
      if (!(row.purchaseBillStatus == 1 || row.purchaseBillStatus === '1')) {
        this.$modal.msgError("只能驳回未审核的申购单");
        return;
      }
      // 复用现有查看逻辑，打开弹窗并填写驳回原因后点击“驳回提交”
      this.handleView(row);
    },
    /** 明细表合计（与科室申领审核弹窗一致） */
    getPurchaseSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const sumNumProp = (prop) => {
        let t = 0;
        data.forEach((item) => {
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
        if (column.property === 'index') {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          sums[index] = sumNumProp('qty');
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach((item) => {
            if (item.amt != null && item.amt !== '' && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '¥' + this.formatAmount(totalAmount);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 汇总申购明细序号 */
    rowDepPurchaseApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 设置紧急程度文本显示 */
    setUrgencyLevelText(urgencyLevel) {
      if (urgencyLevel !== null && urgencyLevel !== undefined) {
        const dict = this.dict.type.urgency_level.find(d => d.value == urgencyLevel || d.value === String(urgencyLevel));
        this.urgencyLevelText = dict ? dict.label : '--';
      } else {
        this.urgencyLevelText = '--';
      }
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/purchaseAgg/export', {
        ...this.buildExportQueryParams(),
        exportBillIds: String(row.id)
      }, `purchase_agg_audit_${row.purchaseBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    handleExport() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先勾选要导出的单据')
        return
      }
      const params = this.buildExportQueryParams();
      params.exportBillIds = this.ids.join(',')
      this.download('department/purchaseAgg/export', {
        ...params
      }, `purchase_agg_audit_${new Date().getTime()}.xlsx`)
    },
    buildExportQueryParams() {
      const params = { ...this.queryParams };
      if (params.purchaseBillStatus === null || params.purchaseBillStatus === '') {
        delete params.purchaseBillStatus;
      }
      return params;
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 与科室申领 dApply / dApplyAudit 弹窗一致 */
/* 与科室申领审核：遮罩仅在主内容区内，不盖住侧栏 */
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
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
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
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

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
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

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
  white-space: nowrap;
}

/* 紧急程度：保持与“申购状态”同款对齐（不改 Element 默认布局），仅保证不换行 */
::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-form-item__content {
  white-space: nowrap;
}

/* 仅隐藏“紧急程度”的必填星号（不影响其它必填项），且不改变布局对齐 */
::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-form-item__label:before {
  display: none !important;
  content: '' !important;
}

::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-modal-content .modal-form-compact .form-item-reject-reason .el-form-item__content {
  margin-left: 0 !important;
  max-width: none;
}

.local-modal-content .modal-form-compact .form-item-reject-reason .el-input {
  width: 100%;
}

.detail-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-header-title {
  font-weight: 500;
}

.detail-action-btn {
  min-width: 80px;
}

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
  flex-shrink: 0;
}

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .table-wrapper {
  /* 1 1 0：在弹窗 flex 布局内按剩余空间收缩，避免子表用 100vh 高度把合计挤出裁切区 */
  flex: 1 1 0;
  margin-top: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

.local-modal-content .modal-detail-section .modal-footer {
  flex-shrink: 0;
  margin-top: 0;
}

::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 0;
  box-sizing: border-box;
  overflow-y: auto !important;
  overflow-x: auto !important;
  scrollbar-width: thin;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
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

::v-deep .local-modal-content:not(.template-dialog-content) {
  min-height: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
}

::v-deep .local-modal-content .el-table .el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.25) rgba(0, 0, 0, 0.06);
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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
.app-container.d-purchase-agg-audit-page {
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


.app-container.d-purchase-agg-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}



.app-container.d-purchase-agg-audit-page .list-query-panel,
.app-container.d-purchase-agg-audit-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.d-purchase-agg-audit-page .apply-table-panel {
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

.app-container.d-purchase-agg-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.d-purchase-agg-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-audit-page .apply-pagination-wrap .pagination-container {
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

.app-container.d-purchase-agg-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-purchase-agg-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-purchase-agg-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.d-purchase-agg-audit-page .apply-main-table th.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table th.el-table-column--selection,
.app-container.d-purchase-agg-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-audit-page .apply-main-table th.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table th.apply-action-col,
.app-container.d-purchase-agg-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr > td,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.d-purchase-agg-audit-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}
</style>

.app-container.d-purchase-agg-audit-page.is-modal-open .apply-table-panel {
  visibility: hidden;
}

.app-container.d-purchase-agg-audit-page .apply-main-table thead th.col-expected-delivery-header .cell {
  white-space: nowrap !important;
}
</style>

.app-container.d-purchase-agg-audit-page.is-modal-open .apply-table-panel {
  visibility: hidden;
}

.app-container.d-purchase-agg-audit-page .apply-main-table thead th.col-expected-delivery-header .cell {
  white-space: nowrap !important;
}
</style>
