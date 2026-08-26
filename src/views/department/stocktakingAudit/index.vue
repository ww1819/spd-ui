<template>
  <div class="app-container list-page stocktaking-audit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.stockNo"
              placeholder="业务单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
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
            <el-form-item prop="stockStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.stockStatus" placeholder="单据状态"
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
          v-hasPermi="['department:stocktakingAudit:audit']"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          @click="handleBatchReject"
          v-hasPermi="['department:stocktakingAudit:reject']"
        >驳回</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:stocktakingAudit:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="stocktakingList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="盘点单号" align="center" prop="stockNo" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" class="stock-no-link" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
        <template slot-scope="scope">
          <span>{{ scope.row.createUserNickName || scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column
        label="单据状态"
        align="center"
        prop="stockStatus"
        width="120"
        min-width="112"
        show-overflow-tooltip
        resizable
        sortable
        label-class-name="stocktaking-col-stock-status"
        class-name="stocktaking-col-stock-status"
      >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="updateBy" width="110" show-overflow-tooltip resizable sortable :sort-method="sortByAuditPerson">
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2">{{ scope.row.auditUserNickName || scope.row.updateBy || '--' }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2 && scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.stockStatus == 2 && scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmount">
        <template slot-scope="scope">
          <span>{{ formatStocktakingListAmount(scope.row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByProfitAmount">
        <template slot-scope="scope">
          <span>{{ formatStocktakingListProfitAmount(scope.row.profitAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="300">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              v-if="scope.row.stockStatus == 2"
              size="small"
              type="text"
              v-hasPermi="['department:stocktakingAudit:export', 'department:stocktaking:export']"
              @click="handleExportRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:stocktakingAudit:audit']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleReject(scope.row)"
              v-hasPermi="['department:stocktakingAudit:reject']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #F56C6C;"
            >驳回</el-button>
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

    <!-- 查看/审核科室盘点对话框（布局对齐到货验收 apply-modal） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="stockStatus">
                      <el-input v-model="stockStatusText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="盘点日期" prop="stockDate">
                      <el-date-picker
                        clearable
                        v-model="form.stockDate"
                        type="date"
                        :disabled="true"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择盘点日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input :value="deptFormCreatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="盘点单号" prop="stockNo" class="form-item-header-billno">
                      <el-input v-model="form.stockNo" :disabled="true" :title="form.stockNo || ''" class="input-stock-no-ellipsis" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单时间">
                      <el-input :value="deptFormCreateTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input :value="deptFormAuditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核时间">
                      <el-input :value="deptFormAuditTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额">
                      <el-input :value="totalAmountText" :disabled="true" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row
                  v-if="form.stockStatus == 1"
                  :gutter="0"
                  class="apply-modal-form-row apply-modal-row-third apply-modal-row-reject"
                  type="flex"
                >
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="驳回原因" prop="rejectReason" class="form-item-reject-reason">
                      <el-input
                        v-model="form.rejectReason"
                        type="textarea"
                        :rows="2"
                        placeholder="驳回原因（驳回时必填）"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">盘点明细信息</span>
                  <template v-if="form.stockStatus == 1">
                    <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
                    <el-button type="danger" icon="el-icon-close" size="small" @click="handleRejectSubmit">驳 回</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="handleAuditSubmit">审 核</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="stkIoStocktakingEntryList"
                class="apply-detail-table"
                :row-class-name="rowStkIoStocktakingEntryIndex"
                ref="stkIoStocktakingEntry"
                border
                :height="detailTableHeight"
              >
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材名称" prop="materialId" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.material">{{ scope.row.material.name || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.material">{{ scope.row.material.speci || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.model')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.material">{{ scope.row.material.model || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material && scope.row.material.fdUnit">{{ scope.row.material.fdUnit.unitName || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="明细账面数量" prop="qty" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')">
                  <template slot-scope="scope">
                    <span>{{ formatEntryQtyDisplay(scope.row, 'qty') }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="实盘数量" prop="stockQty" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'stockQty')">
                  <template slot-scope="scope">
                    <span>{{ formatEntryQtyDisplay(scope.row, 'stockQty') }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="当前库存数量" width="120" align="center" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatEntryCurrentInventoryQty(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="盈亏数量" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ getProfitQty(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="盈亏标志" align="center" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatProfitLossFlag(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="盈亏金额" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ getProfitAmount(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNo || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNumber || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.beginTime || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.endTime || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material && scope.row.material.fdFactory">{{ scope.row.material.fdFactory.factoryName || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="material.supplier.name" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material && scope.row.material.supplier">{{ scope.row.material.supplier.name || '--' }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
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
import { listStocktakingAudit, getStocktakingAudit, auditStocktaking, rejectStocktaking } from "@/api/department/stocktakingAudit";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listInventoryPick } from "@/api/department/depInventory";
import { listStocktakingExportRows } from "@/api/department/stocktaking";
import { exportDeptStocktakingDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "StocktakingAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectDepartment, RightToolbar},
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
      // 盘点表格数据
      stocktakingList: [],
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        departmentId: null,
        stockStatus: null,
        stockType: 502, // 盘点类型：502表示盘点
        beginDate: null,
        endDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        rejectReason: [
          { required: false, message: "驳回原因不能为空", trigger: "blur" }
        ]
      }
,
      _lastSidebarNavTick: null
    };
  },
  created() {
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
    open(val) {
      if (val) {
        this.$nextTick(() => this.scheduleApplyLayoutRefresh());
      }
    }
  },
  computed: {
    /** 弹窗明细表高度：与到货验收一致；待审核含驳回原因行时额外扣减 */
    detailTableHeight() {
      let offset = 384;
      if (this.form && this.form.stockStatus == 1) {
        offset += 56;
      }
      return `max(240px, calc(100vh - ${offset}px))`;
    },
    // 单据状态文本显示
    stockStatusText() {
      if (this.form.stockStatus == 1) {
        return '未审核';
      } else if (this.form.stockStatus == 2) {
        return '已审核';
      } else if (this.form.stockStatus == 3) {
        return '已驳回';
      } else {
        return '未审核';
      }
    },
    // 计算总金额（优先主单汇总字段，避免明细未映射时显示 0）
    totalAmountText() {
      const head = this.form && this.form.totalAmount;
      if (head != null && head !== '') {
        const n = parseFloat(head);
        if (Number.isFinite(n)) {
          return '￥' + this.formatAmount(n);
        }
      }
      let total = 0;
      if (this.stkIoStocktakingEntryList && this.stkIoStocktakingEntryList.length > 0) {
        this.stkIoStocktakingEntryList.forEach(item => {
          const amt = parseFloat(item.amt || 0);
          total += amt;
        });
      }
      return '￥' + this.formatAmount(total);
    },
    deptFormCreatorName() {
      const f = this.form || {};
      return f.createUserNickName || f.createBy || '--';
    },
    deptFormCreateTimeText() {
      const f = this.form || {};
      if (!f.createTime) return '--';
      return this.parseTime(f.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
    },
    deptFormAuditorName() {
      const f = this.form || {};
      if (f.stockStatus !== 2) return '--';
      return f.auditUserNickName || f.updateBy || '--';
    },
    deptFormAuditTimeText() {
      const f = this.form || {};
      if (f.stockStatus !== 2) return '--';
      if (f.auditDate) return this.parseTime(f.auditDate, '{y}-{m}-{d} {h}:{i}:{s}');
      if (f.updateTime) return this.parseTime(f.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return '--';
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
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.stocktakingList || !this.stocktakingList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.stocktakingList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
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
    sortByNestedNumber(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return NaN;
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        const n = Number(v);
        return isNaN(n) ? NaN : n;
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return -1;
      if (isNaN(vb)) return 1;
      return va - vb;
    },
    sortByCreaterName(a, b) {
      const va = (a && (a.createUserNickName || a.createBy)) || '';
      const vb = (b && (b.createUserNickName || b.createBy)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditPerson(a, b) {
      const va = (a && a.stockStatus == 2 && (a.auditUserNickName || a.updateBy)) || '';
      const vb = (b && b.stockStatus == 2 && (b.auditUserNickName || b.updateBy)) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditDate(a, b) {
      const getDate = (row) => {
        if (!row || row.stockStatus != 2) return '';
        return row.auditDate || row.updateTime || '';
      };
      const va = getDate(a);
      const vb = getDate(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAmount(a, b) {
      const va = parseFloat(a && a.totalAmount);
      const vb = parseFloat(b && b.totalAmount);
      const na = Number.isFinite(va) ? va : 0;
      const nb = Number.isFinite(vb) ? vb : 0;
      return na - nb;
    },
    sortByProfitAmount(a, b) {
      const va = parseFloat(a && a.profitAmount);
      const vb = parseFloat(b && b.profitAmount);
      const na = Number.isFinite(va) ? va : 0;
      const nb = Number.isFinite(vb) ? vb : 0;
      return na - nb;
    },
    /** 列表总金额展示（与科室盘点申请列表一致） */
    formatStocktakingListAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      return '￥' + this.formatAmount(n);
    },
    /** 列表盈亏金额展示（与科室盘点申请列表一致） */
    formatStocktakingListProfitAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      const prefix = n > 0 ? '+' : '';
      return prefix + '￥' + this.formatAmount(n);
    },
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      queryParams.stockType = 502;
      listStocktakingAudit(queryParams).then(response => {
        this.stocktakingList = (response && response.rows) || [];
        this.total = (response && response.total) || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.stocktakingList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.stockNo = null;
      this.queryParams.departmentId = null;
      this.queryParams.stockStatus = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
// 多选框选中数据
    handleSelectionChange(selection) {
      const pageKeys = (this.stocktakingList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
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
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getStocktakingAudit(id).then(response => {
        const data = response && response.data;
        if (!data) {
          this.$modal.msgError('获取盘点单失败');
          return;
        }
        this.form = data;
        this.stkIoStocktakingEntryList = this.normalizeAuditEntries(data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.form.stockType = 502;
        this.title = "查看科室盘点";
        this.$nextTick(() => {
          this.hydrateDeptEntryCurrentInventoryQty();
        });
      });
    },
    normalizeAuditEntries(list) {
      return (list || []).map((row) => {
        if (!row) return row;
        if (row.countedFlag == null || row.countedFlag === '') {
          row.countedFlag = 0;
        } else {
          row.countedFlag = Number(row.countedFlag) === 1 ? 1 : 0;
        }
        return row;
      });
    },
    formatEntryQtyDisplay(row, field) {
      if (!row) return '0';
      const v = row[field];
      if (v == null || v === '') return '0';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '0';
    },
    formatEntryCurrentInventoryQty(row) {
      if (!row) return '--';
      if (row._currentInventoryQtyLoading) return '加载中…';
      const v = row._currentInventoryQty;
      if (v == null || v === '') return '--';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '--';
    },
    async _fetchAllDeptInventoryPickForView(departmentId) {
      const pageSize = 500;
      const allRows = [];
      const fetchNext = async (pageNum) => {
        const res = await listInventoryPick({
          departmentId,
          pageNum,
          pageSize,
          receiptConfirmStatus: 1
        });
        const rows = (res && res.rows) || [];
        allRows.push(...rows);
        if (rows.length === 0 || rows.length < pageSize) {
          return allRows;
        }
        return fetchNext(pageNum + 1);
      };
      return fetchNext(1);
    },
    async hydrateDeptEntryCurrentInventoryQty() {
      const list = this.stkIoStocktakingEntryList || [];
      list.forEach((row) => {
        if (!row) return;
        this.$set(row, '_currentInventoryQty', null);
        this.$set(row, '_currentInventoryQtyLoading', true);
      });
      const deptId = this.form && this.form.departmentId;
      let invById = null;
      try {
        if (deptId != null && deptId !== '') {
          const invRows = await this._fetchAllDeptInventoryPickForView(deptId);
          invById = new Map();
          (invRows || []).forEach((inv) => {
            if (inv && inv.id != null) {
              invById.set(String(inv.id), inv);
            }
          });
        }
        for (const row of list) {
          if (!row) continue;
          let live = null;
          if (row.depInventoryId) {
            const idStr = String(row.depInventoryId).trim();
            if (invById && invById.has(idStr)) {
              const inv = invById.get(idStr);
              live = inv && inv.qty != null && inv.qty !== '' ? inv.qty : 0;
            } else if (!invById) {
              const idNum = parseInt(idStr, 10);
              if (Number.isFinite(idNum)) {
                try {
                  const res = await listInventoryPick({ id: idNum, pageNum: 1, pageSize: 1 });
                  const pickRows = (res && res.rows) || [];
                  if (pickRows[0] && pickRows[0].qty != null && pickRows[0].qty !== '') {
                    live = pickRows[0].qty;
                  }
                } catch (e) {
                  live = null;
                }
              }
            }
          }
          this.$set(row, '_currentInventoryQty', live);
          this.$set(row, '_currentInventoryQtyLoading', false);
        }
      } catch (e) {
        list.forEach((row) => {
          if (!row) return;
          this.$set(row, '_currentInventoryQty', null);
          this.$set(row, '_currentInventoryQtyLoading', false);
        });
      }
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids[0];
      this.runAuditWithQtyCheck(id, row.stockNo, false, row.updateTime || row.createTime);
    },
    /** 批量审核 */
    handleBatchAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据");
        return;
      }
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.stocktakingList.filter(item => ids.includes(item.id));
      const unAuditedRows = selectedRows.filter(row => row.stockStatus == 1);
      if (unAuditedRows.length === 0) {
        this.$modal.msgError("所选数据中没有未审核的记录");
        return;
      }
      if (unAuditedRows.length < selectedRows.length) {
        this.$modal.msgWarning("部分选中的数据不是未审核状态，将只审核未审核的记录");
      }
      const unAuditedIds = unAuditedRows.map(row => row.id);
      const validations = unAuditedRows.map(row =>
        getStocktakingAudit(row.id).then(res => {
          if (!assertBillHasActiveEntriesForAudit(res.data.stkIoStocktakingEntryList, this, '科室盘点')) {
            return Promise.reject(new Error('no active entries'));
          }
        })
      );
      Promise.all(validations).then(() => {
        this.$modal.confirm('是否确认审核选中的' + unAuditedIds.length + '条数据项？').then(() => {
          const auditTasks = unAuditedRows.map((row) =>
            auditStocktaking({ id: row.id, expectedUpdateTime: row.updateTime || row.createTime })
          );
          return Promise.all(auditTasks);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功");
        }).catch(() => {});
      }).catch(() => {});
    },
    /** 驳回按钮操作 */
    handleReject(row) {
      this.handleView(row);
      // 打开弹窗后，用户可以在弹窗中输入驳回原因并点击驳回按钮
    },
    /** 批量驳回 */
    handleBatchReject() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要驳回的数据");
        return;
      }
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.stocktakingList.filter(item => ids.includes(item.id));
      const unAuditedRows = selectedRows.filter(row => row.stockStatus == 1);
      if (unAuditedRows.length === 0) {
        this.$modal.msgError("所选数据中没有未审核的记录");
        return;
      }
      if (unAuditedRows.length < selectedRows.length) {
        this.$modal.msgWarning("部分选中的数据不是未审核状态，将只驳回未审核的记录");
      }
      // 批量驳回需要逐个处理，因为需要驳回原因
      this.$modal.msgWarning("批量驳回功能需要逐个输入驳回原因，请使用单条驳回功能");
    },
    /** 审核提交 */
    handleAuditSubmit() {
      const id = this.form.id;
      if (!id) {
        this.$modal.msgError("数据异常，无法审核");
        return;
      }
      this.runAuditWithQtyCheck(id, this.form.stockNo, true, this.form.updateTime || this.form.createTime);
    },
    runAuditWithQtyCheck(id, stockNo, closeOnSuccess, expectedUpdateTime) {
      const doAudit = () => {
        this.$modal.confirm('是否确认审核盘点编号为"' + stockNo + '"的数据项？').then(() => {
          return auditStocktaking({ id, expectedUpdateTime });
        }).then(() => {
          this.getList();
          if (closeOnSuccess) this.open = false;
          this.$modal.msgSuccess("审核成功");
        }).catch(() => {});
      };
      if (closeOnSuccess && !assertBillHasActiveEntriesForAudit(this.stkIoStocktakingEntryList, this, '科室盘点')) {
        return;
      }
      if (!closeOnSuccess) {
        getStocktakingAudit(id).then(res => {
          if (!assertBillHasActiveEntriesForAudit(res.data.stkIoStocktakingEntryList, this, '科室盘点')) {
            return;
          }
          doAudit();
        }).catch(() => {});
        return;
      }
      doAudit();
    },
    /** 驳回提交 */
    handleRejectSubmit() {
      if (!this.form.rejectReason || this.form.rejectReason.trim() === '') {
        this.$modal.msgError("驳回原因不能为空");
        return;
      }
      const id = this.form.id;
      if (!id) {
        this.$modal.msgError("数据异常，无法驳回");
        return;
      }
      this.$modal.confirm('是否确认驳回盘点编号为"' + this.form.stockNo + '"的数据项？').then(() => {
        return rejectStocktaking({
          id: id,
          rejectReason: this.form.rejectReason,
          expectedUpdateTime: this.form.updateTime || this.form.createTime
        });
      }).then(() => {
        this.getList();
        this.open = false;
        this.$modal.msgSuccess("驳回成功");
      }).catch(() => {});
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
        stockNo: null,
        stockDate: null,
        departmentId: null,
        stockStatus: null,
        stockType: null,
        createBy: null,
        rejectReason: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.resetForm("form");
    },
    // 计算盈亏数量
    getProfitQty(row) {
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      const profitQty = stockQty - qty;
      return profitQty > 0 ? '+' + profitQty.toFixed(2) : profitQty.toFixed(2);
    },
    // 计算盈亏金额
    getProfitAmount(row) {
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      const unitPrice = parseFloat(row.unitPrice || 0);
      const profitQty = stockQty - qty;
      const profitAmount = profitQty * unitPrice;
      const prefix = profitAmount > 0 ? '+' : '';
      return prefix + '￥' + this.formatAmount(profitAmount);
    },
    formatProfitLossFlag(row) {
      const flag = (row && row.profitLossFlag ? String(row.profitLossFlag) : '').toUpperCase();
      if (flag === 'PROFIT') return '盘盈';
      if (flag === 'LOSS') return '盘亏';
      if (flag === 'EQUAL') return '持平';
      const stockQty = parseFloat((row && row.stockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return '--';
      if (stockQty > qty) return '盘盈';
      if (stockQty < qty) return '盘亏';
      return '持平';
    },
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 单行导出（与科室盘点申请页同款 xlsx） */
    async handleExportRow(row) {
      this.loading = true;
      try {
        const response = await listStocktakingExportRows({
          stockNo: row.stockNo,
          stockType: this.queryParams.stockType || 502,
        });
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        await exportDeptStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `科室盘点明细表_${row.stockNo}_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 导出：与「库存查询 → 库存明细查询」同款版式 */
    async handleExport() {
      const exportQuery = { ...this.queryParams };
delete exportQuery.pageNum;
      delete exportQuery.pageSize;
      exportQuery.stockType = 502;
      this.loading = true;
      try {
        const response = await listStocktakingExportRows(exportQuery);
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDeptStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室盘点明细表_审核${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
@import '../../caigou/jihua/styles/plan-modal-common.scss';

/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
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
  padding-bottom: 8px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  min-height: 40px;
  flex-shrink: 0;
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

/* 弹窗内顶部字段区：与到货验收一致 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel,
.local-modal-content .apply-modal-toolbar.list-toolbar,
.local-modal-content .apply-modal-table-panel {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 12px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-query-panel .el-row {
  margin-bottom: 8px;
}

.local-modal-content .apply-modal-query-panel .el-row:last-child {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-textarea {
  width: 100% !important;
  max-width: 100% !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row.apply-modal-row-third.el-row {
  flex-wrap: nowrap;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 12px;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor {
  width: 150px !important;
  max-width: 150px !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: 100% !important;
}

.local-modal-content .input-stock-no-ellipsis >>> .el-input__inner {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.local-modal-content .input-total-amount-inline >>> .el-input__inner {
  font-weight: 600;
  color: #409eff;
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

.local-modal-content .modal-form-compact .form-item-reject-reason .el-form-item__content {
  margin-left: 0 !important;
  max-width: none;
}

.local-modal-content .modal-form-compact .form-item-reject-reason .el-input,
.local-modal-content .modal-form-compact .form-item-reject-reason .el-textarea {
  width: 100%;
}

.local-modal-content .modal-detail-section {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .table-wrapper {
  flex: 1 1 0;
  margin-top: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px;
  min-height: 28px;
  box-sizing: border-box;
}

.local-modal-content .el-form {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  box-sizing: border-box;
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

/* 表格样式优化（与到货验收 apply 列表一致） */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.el-table:not(.apply-detail-table) td {
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
.app-container.stocktaking-audit-page {
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

.app-container.stocktaking-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.stocktaking-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.stocktaking-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
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
.app-container.stocktaking-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.stocktaking-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.stocktaking-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.stocktaking-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
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
.app-container.stocktaking-audit-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.stocktaking-audit-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.stocktaking-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.stocktaking-audit-page .list-query-panel,
.app-container.stocktaking-audit-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.stocktaking-audit-page .apply-table-panel {
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

.app-container.stocktaking-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.stocktaking-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .apply-pagination-wrap .pagination-container {
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

.app-container.stocktaking-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.stocktaking-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.stocktaking-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.stocktaking-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.stocktaking-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.stocktaking-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.stocktaking-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.stocktaking-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 单据状态列：表头与内容不换行 */
.app-container.stocktaking-audit-page .apply-main-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-audit-page .apply-main-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.stocktaking-audit-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.stocktaking-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.stocktaking-audit-page .apply-main-table th.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table th.el-table-column--selection,
.app-container.stocktaking-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-audit-page .apply-main-table td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .apply-main-table th.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.stocktaking-audit-page .apply-main-table th.apply-action-col,
.app-container.stocktaking-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr > td,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr > td .cell,
.app-container.stocktaking-audit-page .apply-detail-table .el-table__body tr > td,
.app-container.stocktaking-audit-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.stocktaking-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.stocktaking-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-audit-page .apply-main-table .el-table__header th.gutter {
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
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.stocktaking-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* 查看/审核弹窗：查询区白卡片 + 工具栏 + 驳回行 + 明细行高（对齐到货验收 / 申购审核） */
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel.form-fields-container {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 12px 8px !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 28px !important;
  min-height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-form-item {
  align-items: flex-start;
  white-space: nowrap;
  width: 100%;
  display: inline-flex;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item {
  width: 100%;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-textarea,
.app-container.stocktaking-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: 100% !important;
}

.app-container.stocktaking-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-audit-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  line-height: 28px !important;
  min-height: 28px !important;
}

</style>
