<template>
  <div class="app-container list-page d-apply-audit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.applyBillNo"
              placeholder="单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
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
            <el-form-item prop="applyBillStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.applyBillStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
                <el-option label="已驳回" :value="3" />
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
          v-hasPermi="['department:dApplyAudit:audit']"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:dApplyAudit:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="applyList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="applyBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ (scope.row.creater && scope.row.creater.nickName) || scope.row.createrNmae || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-tag v-if="getApplyStatusValue(scope.row) === 3 || getApplyStatusValue(scope.row) === '3'" type="danger" size="small">已驳回</el-tag>
          <dict-tag v-else :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ (scope.row.auditPerson && scope.row.auditPerson.nickName) || scope.row.auditPersonName || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="getApplyStatusValue(scope.row) === 3 || getApplyStatusValue(scope.row) === '3'">{{ scope.row.rejectReason || '--' }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="310">
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
              v-hasPermi="['department:dApplyAudit:export']"
              style="padding: 0 5px; margin: 0;"
            >导出明细</el-button>
            <el-button
              size="small"
              type="text"
             
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:dApplyAudit:audit']"
              v-if="canShowAuditReject(scope.row)"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleReject(scope.row)"
              v-hasPermi="['department:dApplyAudit:reject']"
              v-if="canShowAuditReject(scope.row)"
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

    <!-- 查看/审核科室申领对话框（布局对齐到货验收 apply-modal） -->
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
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单号" prop="applyBillNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.applyBillNo" :disabled="true" :title="form.applyBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="申领状态" prop="billStatus" class="head-label-nowrap">
                      <el-select :value="detailApplyStatusSelectValue" placeholder="请选择申领状态" :disabled="true">
                        <el-option label="未审核" value="1" />
                        <el-option label="已审核" value="2" />
                        <el-option label="已驳回" value="3" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="head-label-nowrap">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="申请日期" prop="applyBillDate" class="head-label-nowrap">
                      <el-date-picker
                        clearable
                        v-model="form.applyBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择申请日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="操作人" prop="userId" class="head-label-nowrap">
                      <SelectUser v-model="form.userId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row v-if="isDetailRejected" :gutter="8" class="apply-modal-form-row apply-modal-row-third apply-modal-row-reject" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="驳回原因" prop="rejectReason" class="form-item-reject-reason">
                      <el-input
                        v-model="form.rejectReason"
                        type="textarea"
                        :rows="2"
                        :disabled="true"
                        placeholder="—"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">科室申领明细信息</span>
                  <el-button
                    v-if="isDetailUnAuditAndNotRejected"
                    type="primary"
                    icon="el-icon-check"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="handleAuditSubmit"
                  >审 核</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="basApplyEntryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                ref="basApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getSummaries"
                show-summary
                @selection-change="handleBasApplyEntrySelectionChange"
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="仓库" align="center" width="120" min-width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
                <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')" />
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="剩余可用库存" prop="availableStockQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.availableStockQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
              </div>
              </div>
              <!-- 审核操作按钮（底部仅在审核模式下显示取消、驳回；审核按钮已移动到“科室申领明细信息”标题后面） -->
              <div class="modal-footer apply-modal-audit-footer" v-if="dialogMode === 'audit' && isDetailUnAuditAndNotRejected">
                <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
                <el-button type="danger" class="spd-btn spd-btn--danger" @click="handleRejectSubmit">驳 回</el-button>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 驳回原因小窗（列表页点击“驳回”时弹出） -->
    <el-dialog
      title="驳回原因"
      :visible.sync="rejectDialogVisible"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectDialogReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="rejectDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRejectDialog">确 定</el-button>
      </span>
    </el-dialog>


  </div>
</template>

<script>
import { listApplyAudit, getApplyAudit, auditApply, rejectApply } from "@/api/department/applyAudit";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import { parseTime } from '@/utils/ruoyi';

function buildListDefaultDateRange() {
  const today = new Date();
  const endDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const beginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { beginDate, endDate };
}

export default {
  name: "dApplyAudit",
  dicts: ['biz_status','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      selectedRows: [],
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
      // 科室申领表格数据
      applyList: [],
      // 科室申领明细表格数据
      basApplyEntryList: [],
      // 弹窗内明细表勾选
      basApplyEntrySelection: [],
      detailSelectedRowMap: {},
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 审核弹窗模式：'view' 查看，'audit' 审核
      dialogMode: 'view',
      /** 列表页驳回原因小窗 */
      rejectDialogVisible: false,
      rejectDialogReason: '',
      rejectDialogRow: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        ...buildListDefaultDateRange(),
        dateQueryType: 'bill',
        warehouseId: null,
        departmentId: null,
        userId: null,
        applyBillStatus: null, // 默认显示全部状态（未审核和已审核）
        billType: 1, // 只查询申领单类型，排除转科申请（billType=3）
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验（查看/审核弹窗无必填录入项）
      rules: {}
    };
  },
  computed: {
    /** 详情弹窗：状态显示值（与列表一致：未审核但有驳回原因也视为已驳回） */
    detailApplyStatusValue() {
      return this.getApplyStatusValue(this.form);
    },
    /** 详情弹窗内：仅未审核且未驳回时显示审核按钮、驳回原因输入、底部取消/驳回 */
    isDetailUnAuditAndNotRejected() {
      if (this.form.applyBillStatus != 1) return false;
      if (this.form.rejectReason != null && String(this.form.rejectReason).trim() !== '') return false;
      return true;
    },
    /** 详情弹窗：已驳回单据展示驳回原因区域 */
    isDetailRejected() {
      const s = this.detailApplyStatusValue;
      return s === 3 || s === '3';
    },
    /** 详情弹窗：申领状态下拉展示值（与 dApply 一致，含已驳回） */
    detailApplyStatusSelectValue() {
      const v = this.detailApplyStatusValue;
      if (v === 3 || v === '3') return '3';
      if (v === 2 || v === '2') return '2';
      return '1';
    },
    /** 弹窗明细表高度：按额外表单行与审核底栏动态扣减，避免合计行被裁切 */
    detailTableHeight() {
      let offset = 384;
      if (this.isDetailRejected) {
        offset += 68;
      }
      if (this.dialogMode === 'audit' && this.isDetailUnAuditAndNotRejected) {
        offset += 52;
      }
      return `max(240px, calc(100vh - ${offset}px))`;
    }
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
        this.layoutDetailTable();
      }
    },
    basApplyEntryList() {
      if (this.open) {
        this.layoutDetailTable();
      }
    },
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
      if (this.open) {
        this.layoutDetailTable();
      }
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
      if (!table || !this.applyList || !this.applyList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.applyList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    /** 申请状态显示值：已驳回(3) 或 未审核但有驳回原因 视为已驳回 */
    getApplyStatusValue(row) {
      if (!row) return null;
      if (row.applyBillStatus === 3) return 3;
      if (row.applyBillStatus === 1 && row.rejectReason && String(row.rejectReason).trim()) {
        return 3;
      }
      return row.applyBillStatus;
    },
    /** 查询申领单列表（支持全部、未审核、已审核） */
    getList() {
      this.loading = true;
      // 确保只查询申领单类型（billType=1），排除转科申请（billType=3）
      // applyBillStatus根据用户选择：null=全部，1=未审核，2=已审核，3=已驳回
      const params = { ...this.queryParams };
      params.billType = 1;
      // 如果applyBillStatus为null，则不传该参数，查询全部状态
      if (params.applyBillStatus === null || params.applyBillStatus === '') {
        delete params.applyBillStatus;
      }
      listApplyAudit(params).then(response => {
        const rawRows = response.rows || [];
        // 分页总数必须用服务端 total（PageHelper），不能用当前页过滤后的条数，否则「共 N 条」与页码错误
        const serverTotal = response.total != null ? Number(response.total) : 0;
        // 前端二次过滤：确保只显示SL开头的单号，排除ZK开头的转科申请
        if (rawRows.length > 0) {
          this.applyList = rawRows.filter(item => {
            const billNo = item.applyBillNo || '';
            // 只保留SL开头的申领单，排除ZK开头的转科申请
            return billNo.toUpperCase().startsWith('SL') && (item.billType === 1 || item.billType == null);
          });
          this.total = serverTotal;
        } else {
          this.applyList = [];
          this.total = 0;
        }
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
      this.detailSelectedRowMap = {};
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        applyBillNo: null,
        applyBillDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        applyBillStatus: null,
        rejectReason: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.basApplyEntryList = [];
      this.basApplyEntrySelection = [];
      this.detailSelectedRowMap = {};
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.basApplyEntryList.forEach(item => {
        if (item.qty && !isNaN(item.qty)) {
          totalQty += parseFloat(item.qty);
        }
        if (item.amt && !isNaN(item.amt)) {
          totalAmount += parseFloat(item.amt);
        }
      });
      
      this.totalQty = totalQty;
      this.totalAmount = totalAmount;
    },
    // 表格合计方法
    getSummaries(param) {
      const { columns, data } = param;
      const sums = columns.map(() => '');
      let summaryLabelPlaced = false;
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        const prop = column.property;
        if (!summaryLabelPlaced && (prop === 'index' || column.label === '序号')) {
          sums[index] = '合计';
          summaryLabelPlaced = true;
          return;
        }
        if (!prop) {
          return;
        }
        if (column.property === 'qty') {
          const values = data.map(row => {
            const v = row[prop];
            if (v === '' || v == null) return NaN;
            return Number(v);
          });
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = this.formatQty(total);
          }
          return;
        }
        if (column.property === 'amt') {
          const values = data.map(row => Number(row[prop]));
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = this.formatAmount(total);
          }
        }
      });
      return sums;
    },
    fmtQty(v) {
      if (v === null || v === undefined || v === '') {
        return '—';
      }
      const s = this.formatQty ? this.formatQty(v) : String(v)
      return s === '' || s === '-' ? '—' : s
    },

    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.applyBillStatus = null;
      this.queryParams.billType = 1;
      this.queryParams.applyBillNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.dateQueryType = 'bill';
      Object.assign(this.queryParams, buildListDefaultDateRange());
      this.handleQuery();
    },
    syncSelectedRowsFromMap() {
      this.selectedRows = Object.keys(this.selectedRowMap || {}).map((key) => this.selectedRowMap[key]);
    },
    // 多选框选中数据（跨页缓存）
    handleSelectionChange(selection) {
      const pageKeys = (this.applyList || [])
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
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 弹窗内明细表勾选 */
    handleBasApplyEntrySelectionChange(selection) {
      this.basApplyEntrySelection = selection || [];
      const map = {};
      (selection || []).forEach((row, idx) => {
        const key = row.index != null ? row.index : idx;
        map[key] = true;
      });
      this.detailSelectedRowMap = map;
    },
    /** 查看按钮操作 */
    handleView(row, options = {}) {
      if (!options.keepMode) {
        this.dialogMode = 'view';
      }
      const id = row.id
      getApplyAudit(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList || [];
        this.basApplyEntrySelection = [];
        this.open = true;
        this.calculateTotals();
        this.$nextTick(() => {
          if (this.$refs.basApplyEntry) {
            this.$refs.basApplyEntry.clearSelection();
          }
          this.layoutDetailTable();
        });

        // 保持与后端一致的状态值（1=未审核，2=已审核，3=已驳回）
        this.form.applyBillStatus = response.data.applyBillStatus;

        this.title = "申领单审核";
      });
    },
    /** 审核按钮操作（表格中） */
    handleAudit(row) {
      this.dialogMode = 'audit';
      this.handleView(row, { keepMode: true });
    },
    /** 弹窗明细表布局刷新（合计行、列宽） */
    layoutDetailTable() {
      const run = () => {
        const table = this.$refs.basApplyEntry;
        if (table && table.doLayout) {
          table.doLayout();
        }
      };
      this.$nextTick(() => {
        run();
        requestAnimationFrame(run);
        [50, 120, 300].forEach((ms) => setTimeout(run, ms));
      });
    },
    /** 仅未审核且未驳回的单据显示审核、驳回按钮 */
    canShowAuditReject(row) {
      if (!row) return false;
      if (row.applyBillStatus !== 1) return false;
      if (row.rejectReason && String(row.rejectReason).trim()) return false;
      return true;
    },
    /** 驳回按钮操作（表格中）：直接弹出驳回原因小窗 */
    handleReject(row) {
      if (!row || !row.id) {
        this.$modal.msgError("数据异常，无法驳回");
        return;
      }
      this.rejectDialogRow = row;
      this.rejectDialogReason = '';
      this.rejectDialogVisible = true;
    },
    /** 工具栏批量审核：支持选择多条未审核申领单 */
    handleBatchAudit() {
      if (!this.selectedRows || this.selectedRows.length === 0) {
        this.$modal.msgError('请先选择要审核的申领单');
        return;
      }
      const pendingList = this.selectedRows.filter(row => this.canShowAuditReject(row));
      if (pendingList.length === 0) {
        this.$modal.msgError('请选择未审核且未驳回的申领单进行审核');
        return;
      }
      const userId = this.$store.state.user.userId;
      this.$modal.confirm(`确认审核选中的 ${pendingList.length} 条申领单吗？`).then(() => {
        const validatePromises = pendingList.map(row =>
          getApplyAudit(row.id).then(resp => {
            const list = resp.data.basApplyEntryList || [];
            const billNo = resp.data.applyBillNo || row.id;
            if (!list.length) {
              return Promise.reject(new Error(billNo + '：无明细，不允许审核。'));
            }
            const invalidQty = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
            if (invalidQty.length > 0) {
              return Promise.reject(new Error(billNo + '：存在明细数量为空或0，不允许审核。'));
            }
            return Promise.resolve();
          })
        );
        Promise.all(validatePromises).then(() => {
          const requests = pendingList.map(row =>
            auditApply({ id: String(row.id), auditBy: userId })
          );
          return Promise.all(requests);
        }).then(() => {
          this.$modal.msgSuccess('审核成功');
          this.getList();
        }).catch(err => {
          this.$modal.msgError(err && err.message ? err.message : '审核失败');
        });
      }).catch(() => {});
    },
    /** 审核提交 */
    handleAuditSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要审核的申领单");
        return;
      }
      const list = this.basApplyEntryList || [];
      const invalidQty = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
      if (invalidQty.length > 0) {
        this.$modal.msgError("存在明细数量为空或0，不允许审核。请先修正数量后再审核。");
        return;
      }
      const userId = this.$store.state.user.userId;
      auditApply({
        id: String(this.form.id),
        auditBy: userId
      }).then(() => {
        this.$modal.msgSuccess("审核成功");
        this.open = false;
        this.getList();
      });
    },
    /** 大弹窗内「驳回」：打开驳回原因小窗（与列表页一致） */
    handleRejectSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要驳回的申领单");
        return;
      }
      this.rejectDialogRow = { id: this.form.id, applyBillNo: this.form.applyBillNo };
      this.rejectDialogReason = '';
      this.rejectDialogVisible = true;
    },
    /** 列表页驳回小窗确认 */
    confirmRejectDialog() {
      const row = this.rejectDialogRow;
      if (!row || !row.id) {
        this.$modal.msgError("数据异常，无法驳回");
        return;
      }
      const reason = (this.rejectDialogReason || '').trim();
      if (!reason) {
        this.$modal.msgError("请填写驳回原因");
        return;
      }
      const userId = this.$store.state.user.userId;
      rejectApply({
        id: String(row.id),
        rejectReason: reason,
        auditBy: userId
      }).then(() => {
        this.$modal.msgSuccess("驳回成功");
        this.rejectDialogVisible = false;
        this.rejectDialogRow = null;
        this.rejectDialogReason = '';
        this.open = false;
        this.getList();
      });
    },
	/** 科室申领明细序号 */
    rowBasApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowBasApplyEntryIndex({ row, rowIndex });
      const key = row.index;
      if (key != null && this.detailSelectedRowMap && this.detailSelectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/apply/export', {
        ...this.buildExportQueryParams(),
        exportBillIds: String(row.id)
      }, `applyAudit_${row.applyBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    handleExport() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先勾选要导出的单据')
        return
      }
      const params = this.buildExportQueryParams();
      params.exportBillIds = this.ids.join(',')
      this.download('department/apply/export', {
        ...params
      }, `applyAudit_${new Date().getTime()}.xlsx`)
    },
    buildExportQueryParams() {
      const params = { ...this.queryParams };
      params.billType = 1; // 只导出申领单类型
      if (params.applyBillStatus === null || params.applyBillStatus === '') {
        delete params.applyBillStatus;
      }
      return params;
    }
  }
};
</script>

<style scoped>
@import '../../caigou/jihua/styles/plan-modal-common.scss';

/* 内部弹窗样式保留 */
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
  box-sizing: border-box;
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
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
}

.local-modal-content.apply-modal-root-content .el-form {
  padding: 8px 0 8px !important;
  overflow: visible;
  box-sizing: border-box;
  justify-content: flex-start;
  align-content: flex-start;
}

.local-modal-content.apply-modal-root-content .modal-header {
  padding: 6px 8px;
}

.local-modal-content.apply-modal-root-content {
  padding-bottom: 8px;
}

/* 弹窗内三块区域：与到货验收 apply-modal 一致 */
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
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-date-editor {
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-textarea,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-modal-content .apply-modal-table-panel {
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.local-modal-content .apply-modal-toolbar {
  flex-shrink: 0;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0 !important;
  overflow: hidden;
  padding-bottom: 0;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel > .el-row {
  margin-bottom: 8px !important;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel > .el-row:last-child {
  margin-bottom: 0 !important;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

/* 弹窗内顶部字段区：非 apply-modal 的旧模板仍用下方卡片；apply-modal-query-panel 走 list-page 白卡片 */
.local-modal-content .form-fields-container:not(.apply-modal-query-panel) {
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

/* 弹窗内表单紧凑布局（与 inWarehouse/audit 到货验收弹窗一致） */
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
}

/* 驳回原因：全宽 textarea，与 apply-modal-row-reject 布局一致 */
.local-modal-content .modal-form-compact .form-item-reject-reason .el-textarea {
  width: 100%;
  max-width: none;
}

/* 弹窗内明细区：apply-modal-table-panel 由 plan-modal-common 接管边距 */
.local-modal-content .modal-detail-section:not(.apply-modal-table-panel) {
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

/* 明细区：外层不出纵向滚动条，仅表体滚动，表头与合计行固定、左右滚动与表体同步 */
.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0 !important;
  overflow: hidden;
  padding-bottom: 0;
}

.local-modal-content .modal-detail-section .table-wrapper {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  margin-top: 0;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

.local-modal-content .modal-detail-section .modal-footer {
  flex-shrink: 0;
  margin-top: 0;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  padding-bottom: 0;
  box-sizing: border-box;
  overflow-y: auto !important;
  overflow-x: auto !important;
  scrollbar-width: thin;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper td {
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
}

::v-deep .local-modal-content.apply-modal-root-content {
  min-height: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
}

::v-deep .local-modal-content:not(.apply-modal-root-content):not(.template-dialog-content):not(.select-material-filter-content) {
  min-height: 95vh !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table th.is-leaf {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细表行高：与到货验收一致（到货验收由 28px 输入框撑高，只读页用等高校内容） */
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

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep thead th.el-table__cell {
  padding: 6px 0 !important;
}

.app-container {
  position: relative;
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table:not(.apply-detail-table) .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table:not(.apply-detail-table) .cell {
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


.detail-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-header-title {
  font-weight: 500;
}

.status-text.status-rejected {
  color: #f56c6c;
  font-size: 14px;
}
</style>

<style>
/* 申领单审核：列表样式见 department-apply-list-align.scss；以下为弹窗/页内特例 */

.app-container.d-apply-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}

.app-container.d-apply-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.d-apply-audit-page.is-modal-open {
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding-top: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel.form-fields-container {
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

.app-container.d-apply-audit-page .local-modal-content .list-query-panel.apply-modal-query-panel > .el-row,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel > .apply-modal-form-row.el-row {
  margin-bottom: 8px;
}

.app-container.d-apply-audit-page .local-modal-content .list-query-panel.apply-modal-query-panel > .el-row:last-child,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel > .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-form-item {
  align-items: flex-start;
  white-space: normal;
  width: 100%;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-form-item__label {
  height: auto;
  line-height: 28px;
  padding-top: 4px;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-textarea,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-reject .el-textarea__inner {
  width: 100% !important;
  max-width: none !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item {
  width: 100%;
  max-width: 100%;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 28px !important;
  min-height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor,
.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-input {
  width: 150px !important;
  max-width: 150px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  box-sizing: border-box !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.d-apply-audit-page .local-modal-content .apply-modal-audit-footer {
  flex-shrink: 0;
  margin-top: 0;
  padding: 10px 14px;
  border-top: 1px solid #e8ecf1;
  background: #fff;
}

/* 明细表体行高：对齐到货验收（padding 4px + 内容区 28px，等同 small 输入框行） */
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

.app-container.d-apply-audit-page .apply-main-table thead th .cell,
.app-container.d-apply-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.d-apply-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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
}

.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.d-apply-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-apply-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-apply-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}
</style>
