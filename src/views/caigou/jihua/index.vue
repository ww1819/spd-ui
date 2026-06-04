<template>
  <div class="app-container caigou-jihua-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="planNo" class="query-item-inline">
            <el-input v-model="queryParams.planNo"
                      placeholder="计划单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="设备"/>
            </div>
          </el-form-item>
          <el-form-item prop="isGz" class="query-item-inline">
            <el-select v-model="queryParams.isGz" placeholder="高值/低值" clearable style="width: 120px">
              <el-option label="高值" value="1" />
              <el-option label="低值" value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" class="query-status-col">
          <el-form-item prop="planStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.planStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.plan_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item prop="totalAmount" class="query-item-inline">
            <el-input v-model="queryParams.totalAmount"
                      placeholder="金额"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="planSource" class="query-item-inline">
            <el-select v-model="queryParams.planSource" placeholder="计划来源"
                       clearable style="width: 150px">
              <el-option label="手工制单" value="手工制单" />
              <el-option label="科室计划" value="科室计划" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['caigou:jihua:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['caigou:jihua:export']"
        >导出计划明细</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExportSummary"
          v-hasPermi="['caigou:jihua:export']"
        >导出汇总</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          :disabled="multiple"
          @click="handleBatchSubmit"
          v-hasPermi="['caigou:jihua:edit']"
        >提交</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              class="table-compact"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" stripe border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" show-overflow-tooltip resizable />
      <el-table-column label="高值/低值" align="center" width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatIsGzLabel(scope.row.isGz) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmount" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" width="110" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.plan_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="planDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : (scope.row.planDate ? parseTime(scope.row.planDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="提交人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="计划来源" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.planSource">{{ scope.row.planSource }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" prop="auditOpinion" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditOpinion">{{ scope.row.auditOpinion }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180" resizable>
        <template slot-scope="scope">
          <div style="display: flex; align-items: center; justify-content: center; white-space: nowrap; gap: 4px;">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['caigou:jihua:edit']"
              v-if="isPlanEditable(scope.row)"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="!isPlanEditable(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['caigou:jihua:remove']"
              v-if="isPlanEditable(scope.row)"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleProgress(scope.row)"
            >进度</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
      class="table-pagination"
    />


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
      :supplier-options="planDetailSupplierOptions"
      :supplier-loading="planDetailSupplierListLoading"
      :warehouse-locked="isPlanWarehouseLocked"
      :header-locked="isPlanWarehouseLocked"
      :plan-entry-mode-disabled="planEntryModeDisabled"
      :plan-source-display="planSourceDisplay"
      :table-height="detailTableHeight"
      :summary-method="getSummaries"
      :supplier-display-fn="entrySupplierDisplay"
      @cancel="cancel"
      :submit-loading="planSaveSubmitting"
      @submit="submitForm"
      @reference-purchase="handleReferencePurchase"
      @add-material="checkMaterialBtn"
      @delete-entries="handleDeleteStkIoBillEntry"
      @entry-selection-change="handleStkIoBillEntrySelectionChange"
      @qty-input="debounceQtyChange"
      @qty-blur="qtyChange"
      @view-apply-details="handleViewApplyDetails"
      @show-apply-bills="handleShowApplyBillNoList"
    />

    <SelectMMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      :warehouseValue="form.warehouseId"
      :isGzValue="form.isGz"
      @closeDialog="closeDialog"
      @selectData="selectData"
    />

    <ReferencePurchaseDialog
      v-if="referencePurchaseDialogVisible"
      :visible.sync="referencePurchaseDialogVisible"
      :warehouse-id="form.warehouseId"
      :is-gz="form.isGz"
      :plan-id="form.id"
      :plan-entry-mode="form.planEntryMode"
      :referenced-entry-id-set="planReferencedDepApplyEntryIdSet"
      @confirm="onReferencePurchaseConfirm"
    />

    <ApplyBillHeaderDialog :visible.sync="applyBillNoDialogVisible" :list="applyBillHeaderList" />
    <ApplyDetailDialog :visible.sync="applyDetailDialogVisible" :list="applyDetailList" />
    <PlanProgressDialog :visible.sync="progressDialogVisible" :row="currentProgressRow" />

  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan, delPurchasePlan, addPurchasePlan, updatePurchasePlan, auditPurchasePlan, getApplyDetails, getApplyBillNoList, getApplyBillHeaderList, getMaterialStockQty, getPlanEntryStockQty } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import { listSupplierAll } from '@/api/foundation/supplier';
import { assertBillHasMaterialEntries } from '@/utils/billEntryValidate';
import { concatListInChunks, fetchStockQtyMapBatched, yieldToMain, assignPlanEntryRowUid, buildLeanPlanEntryPayload, resolvePlanEntrySource, PLAN_SOURCE_DEPARTMENT } from './utils/planEntryUtils';
import { formatIsGzLabel } from '@/utils/purchaseAggEntry';

export default {
  name: "CaigouJihua",
  dicts: ['biz_status','plan_status','bill_type','way_status'],
  components: {
    SelectSupplier,
    SelectWarehouse,
    PlanEditDialog: () => import('./components/PlanEditDialog'),
    ReferencePurchaseDialog: () => import('./components/ReferencePurchaseDialog'),
    PlanProgressDialog: () => import('./components/PlanProgressDialog'),
    ApplyBillHeaderDialog: () => import('./components/ApplyBillHeaderDialog'),
    ApplyDetailDialog: () => import('./components/ApplyDetailDialog'),
    SelectMMaterialFilter: () => import('@/components/SelectModel/SelectMMaterialFilter')
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 防抖定时器
      qtyChangeTimer: null,
      /** 添加明细后自动保存草稿 */
      planAutoSaveTimer: null,
      planDraftSaving: false,
      planSaveSubmitting: false,
      planSkipAutoSaveUntil: 0,
      /** 大批量合并明细时暂停表格 layout，避免卡死 */
      entryListBulkUpdating: false,
      _layoutEntryTimer: null,
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
      // 总条数
      total: 0,
      // 计划表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 计划明细表格数据
      stkIoBillEntryList: [],
      /** 编辑弹窗内计划明细：全量供应商只拉一次，明细行共用 */
      planDetailSupplierOptions: [],
      planDetailSupplierListLoading: false,
      planDetailSupplierLoadPromise: null,
      planDetailSupplierLoadAttempted: false,
      // 用户选项列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        isGz: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        totalAmount: null,
        planSource: null,
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
        isGz: [
          { required: true, message: "请选择高值/低值", trigger: "change" }
        ],
      },
      // 进度对话框
      progressDialogVisible: false,
      currentProgressRow: null,
      referencePurchaseDialogVisible: false,
      applyDetailDialogVisible: false,
      applyDetailList: [],
      applyBillNoDialogVisible: false,
      applyBillHeaderList: []
    };
  },
  created() {
    console.time('[Plan] created->getList');
    this.getList(true);
    this.getUserList();
    console.timeEnd('[Plan] created->getList');
  },
  mounted() {
    // 预绑定防抖搜索，避免频繁请求
    this.debouncedQuery = this.$_.debounce(() => {
      this.handleQuery();
    }, 300);
  },
  beforeDestroy() {
    // 清理定时器
    if (this.qtyChangeTimer) {
      clearTimeout(this.qtyChangeTimer);
    }
    if (this.planAutoSaveTimer) {
      clearTimeout(this.planAutoSaveTimer);
    }
    if (this._layoutEntryTimer) {
      clearTimeout(this._layoutEntryTimer);
    }
  },
  computed: {
    /** 当前计划明细已关联的科室申购明细 id */
    planReferencedDepApplyEntryIdSet() {
      const set = new Set();
      (this.stkIoBillEntryList || []).forEach((row) => {
        (row.depApplyEntryIds || []).forEach((id) => {
          if (id != null && id !== '') {
            set.add(String(id));
          }
        });
      });
      return set;
    },
    // 表头计划来源：由明细内计划来源去重后逗号拼接
    planSourceDisplay() {
      const list = this.stkIoBillEntryList || [];
      const set = new Set();
      list.forEach(r => {
        if (r.planSource && String(r.planSource).trim()) set.add(r.planSource);
      });
      return [...set].join('，') || '';
    },
    /** 计划明细生成方式：新增且未添加明细时可变更，添加明细或保存后不可变更 */
    planEntryModeDisabled() {
      if (this.form.id != null) return true;
      const list = this.stkIoBillEntryList || [];
      return list.length > 0;
    },
    /** 与到货验收 inWarehouse/audit 弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    /** 已有明细或已引用申购单时锁定仓库，避免跨仓混入明细 */
    isPlanWarehouseLocked() {
      const hasEntries = (this.stkIoBillEntryList || []).length > 0;
      const hasRef = this.form.referenceBillNo && String(this.form.referenceBillNo).trim();
      return hasEntries || !!hasRef;
    },
  },
  watch: {
    open(val) {
      if (val && this.action) {
        this.loadPlanDetailSupplierOptions();
      }
      if (val) {
        this.$nextTick(() => this.layoutPlanEntryTable());
      }
    },
    action(val) {
      if (val && this.open) {
        this.loadPlanDetailSupplierOptions();
      }
    },
    'stkIoBillEntryList.length'() {
      if (this.entryListBulkUpdating) return;
      if (this._layoutEntryTimer) clearTimeout(this._layoutEntryTimer);
      this._layoutEntryTimer = setTimeout(() => {
        this._layoutEntryTimer = null;
        this.layoutPlanEntryTable();
      }, 150);
    },
    'form.warehouseId'(val, oldVal) {
      if (!this.open || val == null || val === '' || val === oldVal) {
        return;
      }
      this.refreshPlanEntryStockQty();
    }
  },
  methods: {
    formatIsGzLabel,
    /** 仅未提交（0）状态允许修改 */
    isPlanEditable(row) {
      const status = row && row.planStatus;
      return status === '0' || status === 0;
    },
    /** 按当前计划仓库刷新明细「库存数量」 */
    refreshPlanEntryStockQty(onlyMaterialIds) {
      const warehouseId = this.form.warehouseId;
      const list = this.stkIoBillEntryList || [];
      if (!warehouseId || !list.length) {
        return Promise.resolve();
      }
      const materialIds = onlyMaterialIds && onlyMaterialIds.length
        ? [...new Set(onlyMaterialIds.filter((id) => id != null))]
        : [...new Set(list.map((e) => e.materialId).filter((id) => id != null))];
      if (!materialIds.length) {
        return Promise.resolve();
      }
      const idSet = new Set(materialIds.map((id) => String(id)));
      return fetchStockQtyMapBatched(warehouseId, materialIds, getPlanEntryStockQty).then((map) => {
        list.forEach((entry) => {
          if (entry.materialId == null || !idSet.has(String(entry.materialId))) {
            return;
          }
          const raw = map[String(entry.materialId)] != null
            ? map[String(entry.materialId)]
            : map[entry.materialId];
          const q = raw != null ? Number(raw) : 0;
          this.$set(entry, 'stockQty', Number.isFinite(q) ? q : 0);
        });
      }).catch(() => {});
    },
    purchasePlanRefTagType(status) {
      const s = status == null || status === '' ? 0 : Number(status);
      const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' };
      return map[s] || 'info';
    },
    outboundRefLabel(status) {
      const s = status == null || status === '' ? 0 : Number(status);
      const map = { 0: '未引用', 1: '部分引用', 2: '全部引用' };
      return map[s] != null ? map[s] : '--';
    },
    outboundRefTagType(status) {
      const s = status == null || status === '' ? 0 : Number(status);
      const map = { 0: 'info', 1: 'warning', 2: 'success' };
      return map[s] || 'info';
    },
    /** 从表头、明细行收集可能不在全量列表中的供应商（合并进下拉，避免已选显示为空） */
    collectPlanExtraSuppliers() {
      const out = [];
      const push = (s) => {
        if (s && s.id != null && s.name) {
          out.push({
            id: s.id,
            name: s.name,
            code: s.code,
            referredCode: s.referredCode
          });
        }
      };
      if (this.form && this.form.supplier) {
        push(this.form.supplier);
      }
      (this.stkIoBillEntryList || []).forEach((e) => {
        if (e.material && e.material.supplier) {
          push(e.material.supplier);
        }
      });
      return out;
    },
    mergeSupplierOptionLists(base, extras) {
      const m = new Map();
      (base || []).forEach((s) => {
        if (s != null && s.id != null) {
          m.set(Number(s.id), {
            id: s.id,
            name: s.name || '',
            code: s.code,
            referredCode: s.referredCode
          });
        }
      });
      (extras || []).forEach((s) => {
        if (s != null && s.id != null && !m.has(Number(s.id))) {
          m.set(Number(s.id), {
            id: s.id,
            name: s.name || '',
            code: s.code,
            referredCode: s.referredCode
          });
        }
      });
      return Array.from(m.values());
    },
    appendMissingPlanSuppliersFromForm() {
      const extras = this.collectPlanExtraSuppliers();
      if (!extras.length) {
        return;
      }
      this.planDetailSupplierOptions = this.mergeSupplierOptionLists(this.planDetailSupplierOptions, extras);
    },
    /** 编辑/新增弹窗打开时只请求一次 listAll，供所有明细行共用 */
    loadPlanDetailSupplierOptions() {
      if (!this.open || !this.action) {
        return Promise.resolve();
      }
      if (this.planDetailSupplierLoadPromise) {
        return this.planDetailSupplierLoadPromise;
      }
      if (this.planDetailSupplierLoadAttempted) {
        this.appendMissingPlanSuppliersFromForm();
        return Promise.resolve();
      }
      this.planDetailSupplierListLoading = true;
      this.planDetailSupplierLoadPromise = listSupplierAll()
        .then((res) => {
          const list = res || [];
          const extras = this.collectPlanExtraSuppliers();
          this.planDetailSupplierOptions = this.mergeSupplierOptionLists(list, extras);
          return this.planDetailSupplierOptions;
        })
        .catch(() => {
          this.planDetailSupplierOptions = [];
        })
        .finally(() => {
          this.planDetailSupplierListLoading = false;
          this.planDetailSupplierLoadPromise = null;
          this.planDetailSupplierLoadAttempted = true;
        });
      return this.planDetailSupplierLoadPromise;
    },
    // 为主表提供稳定的 row-key，减少 DOM 复用导致的抖动
    planRowKey(row) {
      return row.id || row.planNo;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const sumNum = (prop) => {
        let t = 0;
        data.forEach(item => {
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
          sums[index] = sumNum('qty').toFixed(2);
          return;
        }
        if (column.property === 'amt') {
          const t = sumNum('amt');
          sums[index] = '￥' + t.toFixed(2);
          if (this.form && this.action) {
            this.form.totalAmount = t.toFixed(2);
          }
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    /** 查询计划列表 */
    getList(allowWhenDialog) {
      console.time('[Plan] getList total');
      if (this.DialogComponentShow && !allowWhenDialog) {
        console.log('[Plan] getList skipped because dialog is open');
        console.timeEnd('[Plan] getList total');
        return;
      }
      this.loading = true;
      const t0 = performance.now();
      listPurchasePlan(this.queryParams).then(response => {
        const t1 = performance.now();
        // 预计算展示字段，减少模板计算
        const rows = response.rows || [];
        this.warehouseList = rows.map(item => ({
          ...item,
          planDateText: item.planDate ? this.parseTime(item.planDate, '{y}-{m}-{d}') : ''
        }));
        this.total = response.total;
        this.loading = false;
        const t2 = performance.now();
        console.log('[Plan] list size=', rows.length, 'network(ms)=', (t1 - t0).toFixed(1), 'assign(ms)=', (t2 - t1).toFixed(1));
        console.timeEnd('[Plan] getList total');
      });
    },
    // 查询按钮（支持外部调用防抖）
    handleQueryDebounced() {
      if (this.debouncedQuery) {
        this.debouncedQuery();
      } else {
        this.handleQuery();
      }
    },
    checkMaterialBtn() {
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      if (!this.form.isGz) {
        this.$modal.msgWarning("请先选择高值/低值");
        return;
      }
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      console.time('[Plan] closeDialog total');
      const t0 = performance.now();
      this.DialogComponentShow = false
      const t1 = performance.now();
      console.log('[Plan] closeDialog set DialogComponentShow=false ms=', (t1 - t0).toFixed(1));
      console.timeEnd('[Plan] closeDialog total');
    },
    selectData(lightRows) {
      console.time('[Plan] selectData total');
      const t0 = performance.now();
      const toAppend = [];
      const list = lightRows || [];
      list.forEach((item) => {
        const materialId = item && item.id != null ? item.id : null;
        if (!materialId) {
          return;
        }
        const supplierId = item.supplierId || (item.supplier && item.supplier.id) || null;
        const defQty = this.getDefaultPurchaseQtyFromMaterial(item);
        toAppend.push({
          materialId: item.id,
          supplierId,
          applyDepartmentId: null,
          applyQty: null,
          qty: String(defQty),
          price: item.price,
          amt: "",
          speci: item.speci,
          model: item.model,
          planSource: "手工新增",
          beginTime: "",
          endTime: "",
          remark: "",
          material: Object.freeze(item),
        });
      });
      const t1 = performance.now();
      console.log('[Plan] select rows=', list.length, 'build objects(ms)=', (t1 - t0).toFixed(1));
      if (!toAppend.length) {
        console.timeEnd('[Plan] selectData total');
        return;
      }
      assignPlanEntryRowUid(toAppend);

      this.appendPlanEntryRows(toAppend, {
        showLoading: toAppend.length > 50,
        afterMerged: async () => {
          toAppend.forEach((row) => this.qtyChange(row));
          this.debouncedAutoSavePlan();
          console.timeEnd('[Plan] selectData total');
        }
      }).catch(() => {
        console.timeEnd('[Plan] selectData total');
      });
    },
    /** 为明细行填充当前仓库库存数量 */
    fillStockQtyForEntryRows(rows) {
      if (!this.form.warehouseId || !rows || !rows.length) {
        return Promise.resolve();
      }
      const materialIds = [...new Set(rows.map((r) => r.materialId).filter((id) => id != null))];
      if (!materialIds.length) {
        return Promise.resolve();
      }
      return fetchStockQtyMapBatched(this.form.warehouseId, materialIds, getMaterialStockQty).then((map) => {
        rows.forEach((row) => {
          if (row.materialId == null) {
            return;
          }
          const v = map[row.materialId] != null ? map[row.materialId] : map[String(row.materialId)];
          row.stockQty = v != null ? v : 0;
        });
      }).catch(() => {});
    },
    /**
     * 从产品档案取默认采购数量：最小包装数量；为空/0/无效则 1。
     * 优先数值字段 minPackageQty 等；否则尝试 packageSpeci 中的首个正数。
     */
    getDefaultPurchaseQtyFromMaterial(m) {
      if (!m || typeof m !== "object") {
        return 1;
      }
      const tryPositiveInt = (v) => {
        if (v === null || v === undefined || v === "") {
          return null;
        }
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) {
          return null;
        }
        return Math.max(1, Math.floor(n));
      };
      for (const k of ["minPackageQty", "minPackQty", "minimumPackageQty", "min_package_qty"]) {
        const n = tryPositiveInt(m[k]);
        if (n != null) {
          return n;
        }
      }
      const ps = m.packageSpeci;
      if (ps != null && String(ps).trim() !== "") {
        const s = String(ps).trim();
        const pure = Number(s);
        if (Number.isFinite(pure) && pure > 0) {
          return Math.max(1, Math.floor(pure));
        }
        const mch = s.match(/\d+(?:\.\d+)?/);
        if (mch) {
          const n = Number(mch[0]);
          if (Number.isFinite(n) && n > 0) {
            return Math.max(1, Math.floor(n));
          }
        }
      }
      return 1;
    },
    /** 表头校验需要供应商时，用首条已选明细的供应商兜底 */
    syncHeaderSupplierForValidate() {
      const list = this.stkIoBillEntryList || [];
      if ((this.form.supplierId == null || this.form.supplierId === "") && list.length) {
        const row = list.find((r) => r.supplierId != null && r.supplierId !== "");
        if (row) {
          this.$set(this.form, "supplierId", row.supplierId);
        }
      }
    },
    debouncedAutoSavePlan() {
      if (!this.open || !this.action) {
        return;
      }
      const list = this.stkIoBillEntryList || [];
      if (list.length > 80 || Date.now() < this.planSkipAutoSaveUntil) {
        return;
      }
      if (this.planAutoSaveTimer) {
        clearTimeout(this.planAutoSaveTimer);
      }
      this.planAutoSaveTimer = setTimeout(() => {
        this.planAutoSaveTimer = null;
        this.savePlanDraftSilently();
      }, 2000);
    },
    /** 添加明细后静默落库，避免切换页面丢失（不关闭弹窗、不打断操作） */
    savePlanDraftSilently() {
      if (!this.open || !this.action || this.planDraftSaving) {
        return;
      }
      const list = this.stkIoBillEntryList || [];
      if (!list.length || !this.form.warehouseId) {
        return;
      }
      const invalidQty = list.filter(
        (e) => e.materialId && (e.qty == null || e.qty === "" || Number(e.qty) <= 0)
      );
      if (invalidQty.length) {
        return;
      }
      const noSupplier = list.filter(
        (e) => e.materialId && (e.supplierId == null || e.supplierId === "")
      );
      if (noSupplier.length) {
        return;
      }
      if (!this.$refs.planEditDialog) {
        return;
      }
      this.syncHeaderSupplierForValidate();
      this.$refs.planEditDialog.validate((valid) => {
        if (!valid) {
          return;
        }
        this.planDraftSaving = true;
        this.form.purchasePlanEntryList = buildLeanPlanEntryPayload(list);
        if (this.form.id == null && (this.form.planStatus == null || this.form.planStatus === "")) {
          this.form.planStatus = "0";
        }
        const ax = { headers: { repeatSubmit: false, hideError: true } };
        const done = () => {
          this.planDraftSaving = false;
        };
        if (this.form.id != null) {
          updatePurchasePlan(this.form, ax)
            .then(() => {})
            .catch(() => {})
            .finally(done);
        } else {
          addPurchasePlan(this.form, ax)
            .then((res) => {
              const d = res && res.data;
              const nid = d && typeof d === "object" ? d.id : d;
              const pno = d && typeof d === "object" ? d.planNo : null;
              if (nid != null) {
                this.$set(this.form, "id", Number(nid));
                if (pno) {
                  this.$set(this.form, "planNo", pno);
                }
                if (this.title === "添加计划") {
                  this.title = "修改计划";
                }
              }
            })
            .catch(() => {})
            .finally(done);
        }
      });
    },
    getStatDate(){
      // 当前日期往前推5天
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year + "-" + month + "-" + day;
      return statDate;
    },
    getEndDate(){
      // 当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year + "-" + month + "-" + day;
      return endDate;
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
    },
    // 取消按钮
    cancel() {
      console.time('[Plan] cancel total');
      const t0 = performance.now();
      this.open = false;
      const t1 = performance.now();
      this.reset();
      const t2 = performance.now();
      console.log('[Plan] cancel set open=false ms=', (t1 - t0).toFixed(1), 'reset(ms)=', (t2 - t1).toFixed(1));
      console.timeEnd('[Plan] cancel total');
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        isGz: null,
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
        planSource: null,
        referenceBillNo: null,
        planEntryMode: '1',
        auditBy: null,
        auditDate: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
      this.planDetailSupplierOptions = [];
      this.planDetailSupplierListLoading = false;
      this.planDetailSupplierLoadPromise = null;
      this.planDetailSupplierLoadAttempted = false;
      this.$nextTick(() => {
        const dlg = this.$refs.planEditDialog;
        const f = dlg && dlg.$refs && dlg.$refs.form;
        if (f && typeof f.clearValidate === 'function') {
          f.clearValidate();
        }
      });
    },
    //数量改变事件
    qtyChange(row){
      // 只允许输入数字
      if (row.qty && !/^\d+(\.\d+)?$/.test(row.qty)) {
        row.qty = row.qty.replace(/[^\d.]/g, '');
      }

      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    handleProgress(row) {
      this.currentProgressRow = row;
      this.progressDialogVisible = true;
    },
    /** 根据明细关联申购单信息填充计划来源（科室计划/手工新增） */
    fillPlanSourceForEntries() {
      (this.stkIoBillEntryList || []).forEach(row => {
        row.planSource = resolvePlanEntrySource(row);
      });
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = assignPlanEntryRowUid(response.data.purchasePlanEntryList || []);
        this.fillPlanSourceForEntries();
        this.open = true;
        this.action = false;
        this.title = "查看计划";
        this.$nextTick(() => this.refreshPlanEntryStockQty());
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.planStatus = '0'; // 未提交状态
      if (!this.form.planEntryMode) this.form.planEntryMode = '1'; // 默认按产品档案汇总
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.planDate = this.getBillDate();
      this.title = "添加计划";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      if (!this.isPlanEditable(row)) {
        this.$modal.msgWarning('已提交的计划不允许修改');
        return;
      }
      this.reset();
      const id = row.id || this.ids
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = assignPlanEntryRowUid(response.data.purchasePlanEntryList || []);
        this.fillPlanSourceForEntries();
        this.open = true;
        this.title = "修改计划";
        this.action = true;
        this.$nextTick(() => this.refreshPlanEntryStockQty());
      });
    },
    /** 提交按钮（保存表单） */
    submitForm() {
      this.$refs.planEditDialog.validate(valid => {
        if (valid) {
          if (!assertBillHasMaterialEntries(this.stkIoBillEntryList, this, '请至少添加一条采购计划明细')) {
            return;
          }
          const list = this.stkIoBillEntryList || [];
          const invalidQty = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
          if (invalidQty.length > 0) {
            this.$modal.msgError("存在明细数量为空或0，请填写有效采购数量后再保存。");
            return;
          }
          const noSupplier = list.filter(e => e.materialId && (e.supplierId == null || e.supplierId === ''));
          if (noSupplier.length > 0) {
            this.$modal.msgError("请为每条计划明细指定供应商后再保存。存在 " + noSupplier.length + " 条明细未选择供应商。");
            return;
          }
          const leanEntries = buildLeanPlanEntryPayload(list);
          this.form.purchasePlanEntryList = leanEntries;
          if (this.form.id == null && (this.form.planStatus == null || this.form.planStatus === '')) {
            this.form.planStatus = '0';
          }
          this.planSaveSubmitting = true;
          const saveAx = { timeout: 120000 };
          const saveReq = this.form.id != null
            ? updatePurchasePlan(this.form, saveAx)
            : addPurchasePlan(this.form, saveAx);
          saveReq.then(() => {
            this.$modal.msgSuccess(this.form.id != null ? '修改成功' : '新增成功');
            this.open = false;
            this.getList();
          }).finally(() => {
            this.planSaveSubmitting = false;
          });
        }
      });
    },
    /** 批量提交按钮操作 */
    handleBatchSubmit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要提交的计划！");
        return;
      }

      // 检查选中的计划是否都是"未提交"状态
      const selectedPlans = this.warehouseList.filter(item => this.ids.includes(item.id));
      const nonUnsubmittedPlans = selectedPlans.filter(item => item.planStatus !== '0' && item.planStatus !== 0);

      if (nonUnsubmittedPlans.length > 0) {
        const statusInfo = nonUnsubmittedPlans.map(plan => `${plan.planNo}(状态:${plan.planStatus})`).join(', ');
        this.$modal.msgError(`只能提交未提交状态的计划！以下计划状态不正确：${statusInfo}`);
        return;
      }

      const planNos = selectedPlans.map(item => item.planNo).join('、');

      this.$modal.confirm('确定要提交选中的 ' + this.ids.length + ' 个计划吗？\n计划编号：' + planNos).then(() => {
        // 批量提交：将状态从"未提交"（0）改为"未提交"（1，已提交但未审核）
        // 先获取每个计划的完整数据，然后更新状态
        const submitPromises = this.ids.map(id => {
          return getPurchasePlan(id).then(response => {
            const plan = response.data;
            plan.planStatus = '1'; // 未提交状态（已提交但未审核）
            return updatePurchasePlan(plan);
          });
        });

        Promise.all(submitPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量提交成功！共提交 " + this.ids.length + " 个计划");
        }).catch(() => {
          this.$modal.msgError("批量提交失败！");
        });
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    async handleDelete(row) {
      if (row && !this.isPlanEditable(row)) {
        this.$modal.msgWarning('已提交的计划不允许删除');
        return;
      }
      const ids = row.id || this.ids;
      const planLabel = (row && row.planNo) ? row.planNo : ids;
      const idList = Array.isArray(ids)
        ? ids.map(String)
        : String(ids).split(',').map(s => s.trim()).filter(Boolean);
      let hasDepApplyRefs = false;
      try {
        for (const planId of idList) {
          const res = await getApplyBillNoList(planId);
          const list = (res && res.data) ? res.data : [];
          if (list.length > 0) {
            hasDepApplyRefs = true;
            break;
          }
        }
      } catch (e) {
        this.$modal.msgError('检查计划引用申购单失败，请稍后重试');
        return;
      }
      const doDelete = (restoreDepApplyPlanRefStatus) => {
        return delPurchasePlan(ids, restoreDepApplyPlanRefStatus).then(() => {
          this.getList();
          this.$modal.msgSuccess(restoreDepApplyPlanRefStatus
            ? '删除成功，相关申购单计划引用状态已恢复'
            : '删除成功');
        });
      };
      if (hasDepApplyRefs) {
        this.$confirm(
          `确认删除采购计划「${planLabel}」？\n\n本计划曾引用科室申购单。删除后请选择：\n·「恢复申购单状态」：将相关申购单的「计划引用」按当前实际情况重算（无其它计划引用时为未引用）\n·「保持原状态」：申购单上的计划引用状态不变`,
          '删除采购计划',
          {
            distinguishCancelAndClose: true,
            confirmButtonText: '删除并恢复申购单状态',
            cancelButtonText: '删除且保持原状态',
            type: 'warning'
          }
        ).then(() => doDelete(true)).catch(action => {
          if (action === 'cancel') {
            return doDelete(false);
          }
        });
      } else {
        this.$modal.confirm(`是否确认删除计划编号为「${planLabel}」的数据项？`).then(() => doDelete(false)).catch(() => {});
      }
    },
    /** 明细行供应商展示：优先行上名称，再按 supplierId 从全量下拉选项解析 */
    entrySupplierDisplay(row) {
      if (!row) return '--';
      if (row.supplierName) return row.supplierName;
      const rid = row.supplierId != null && row.supplierId !== '' ? Number(row.supplierId) : null;
      if (rid != null) {
        const opts = this.planDetailSupplierOptions || [];
        const hit = opts.find((s) => s != null && Number(s.id) === rid);
        if (hit && hit.name) return hit.name;
        if (row.supplier && Number(row.supplier.id) === rid && row.supplier.name) {
          return row.supplier.name;
        }
      }
      const ms = row.material && row.material.supplier;
      if (ms && ms.name) return ms.name;
      return '--';
    },
    /** 计划明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.supplierId = null;
      obj.applyQty = null;
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.planSource = "手工新增";
      obj.batchNo = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 计划明细删除按钮操作 */
    planEntryRowKey(row) {
      if (!row) return '';
      if (row.id != null) return `e-${row.id}`;
      if (row._entryUid) return `u-${row._entryUid}`;
      return `m-${row.materialId != null ? row.materialId : ''}`;
    },
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的计划明细数据");
      } else {
        const checked = new Set(this.checkedStkIoBillEntry);
        this.stkIoBillEntryList = (this.stkIoBillEntryList || []).filter(
          (item) => !checked.has(this.planEntryRowKey(item))
        );
        this.checkedStkIoBillEntry = [];
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = (selection || []).map((item) => this.planEntryRowKey(item));
    },
    /** 导出计划明细（供货清单）：有勾选时仅导出所选计划；否则按当前筛选导出全部匹配明细 */
    handleExport() {
      const params = { ...this.queryParams }
      delete params.pageNum
      delete params.pageSize
      if (this.ids && this.ids.length > 0) {
        params.planIds = this.ids.join(',')
      }
      this.download('caigou/jihua/export', params, `采购计划明细_${new Date().getTime()}.xlsx`)
    },
    /** 导出汇总：选择导出当前页或全部查询结果 */
    handleExportSummary() {
      const createParamsByScope = (scope) => {
        const params = { ...this.queryParams }
        params.exportScope = scope
        if (scope === 'all') {
          delete params.pageNum
          delete params.pageSize
        }
        return params
      }
      const doExport = (scope) => {
        const params = createParamsByScope(scope)
        this.download('caigou/jihua/exportSummary', params, `采购计划汇总_${new Date().getTime()}.xlsx`)
      }
      this.$confirm(
        '请选择导出范围：\n【当前页】仅导出当前分页数据；\n【所有查询结果】导出当前筛选条件下的全部数据。',
        '导出汇总',
        {
          confirmButtonText: '当前页',
          cancelButtonText: '所有查询结果',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      ).then(() => {
        doExport('current')
      }).catch((action) => {
        if (action === 'cancel') {
          doExport('all')
        }
      })
    },
    /** 防抖数量变化 */
    debounceQtyChange(row) {
      if (this.qtyChangeTimer) {
        clearTimeout(this.qtyChangeTimer);
      }
      this.qtyChangeTimer = setTimeout(() => {
        this.qtyChange(row);
      }, 300);
    },
    /** 获取行键 */
    getRowKey(row, index) {
      return row.id || index;
    },
    /** 计算总金额 */
    calculateTotalAmount() {
      let total = 0;
      this.stkIoBillEntryList.forEach(item => {
        if (item.amt) {
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = total.toFixed(2);
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
    },

    layoutPlanEntryTable() {
      const dlg = this.$refs.planEditDialog;
      if (dlg && typeof dlg.layoutEntryTable === 'function') {
        dlg.layoutEntryTable();
      }
    },
    handleReferencePurchase() {
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      if (!this.form.isGz) {
        this.$modal.msgWarning("请先选择高值/低值");
        return;
      }
      this.referencePurchaseDialogVisible = true;
    },
    async onReferencePurchaseConfirm({ newRows, referenceBillNo, planSource }) {
      this.form.planSource = planSource || PLAN_SOURCE_DEPARTMENT;
      this.form.referenceBillNo = referenceBillNo || '';
      try {
        await this.appendPlanEntryRows(newRows || [], { showLoading: true });
        this.$modal.msgSuccess('引用申购单成功');
      } catch (e) {
        this.$modal.msgError('合并明细失败，请减少勾选后重试');
      }
    },
    async appendPlanEntryRows(newRows, options = {}) {
      if (!newRows || !newRows.length) return;
      const showLoading = options.showLoading !== false && newRows.length > 50;
      this.entryListBulkUpdating = true;
      let loading = null;
      if (showLoading) {
        loading = this.$loading({
          lock: true,
          text: `正在合并 ${newRows.length} 条明细…`,
          background: 'rgba(0, 0, 0, 0.35)'
        });
      }
      try {
        const prev = this.stkIoBillEntryList || [];
        this.stkIoBillEntryList = assignPlanEntryRowUid(await concatListInChunks(prev, newRows, 200));
        this.planSkipAutoSaveUntil = Date.now() + 60000;
        await yieldToMain();
        const newMaterialIds = [...new Set(newRows.map((r) => r.materialId).filter((id) => id != null))];
        await this.fillStockQtyForEntryRows(newRows);
        await this.refreshPlanEntryStockQty(newMaterialIds);
        this.calculateTotalAmount();
        this.syncHeaderSupplierForValidate();
        this.fillPlanSourceForEntries();
        if (typeof options.afterMerged === 'function') {
          await options.afterMerged(newRows);
        }
      } finally {
        this.entryListBulkUpdating = false;
        if (loading) loading.close();
        this.$nextTick(() => this.layoutPlanEntryTable());
      }
    },
    /** 查看申购明细（采购计划明细行末按钮） */
    handleViewApplyDetails(row) {
      if (!row || !row.id) return;
      getApplyDetails(row.id).then(response => {
        const data = response && response.data;
        this.applyDetailList = (Array.isArray(data) ? data : (data && data.data) || []) || [];
        this.applyDetailDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购明细失败");
      });
    },
    /** 表头「查看申购单」：弹窗显示关联申购单表头（科室申购单号、仓库、制单人、制单时间、提交人、提交时间、审核人、审核时间） */
    handleShowApplyBillNoList() {
      if (this.form.id) {
        getApplyBillHeaderList(this.form.id).then(response => {
          const list = (response && response.data) ? (Array.isArray(response.data) ? response.data : (response.data.data || [])) : [];
          this.applyBillHeaderList = list.length > 0 ? list : [];
          this.applyBillNoDialogVisible = true;
        }).catch(() => {
          this.$modal.msgError("获取申购单列表失败");
        });
      } else {
        const ref = (this.form.referenceBillNo || '').trim();
        if (ref) {
          this.applyBillHeaderList = ref.split(/[,，]/).map(s => ({ applyBillNo: s.trim() })).filter(o => o.applyBillNo);
          this.applyBillNoDialogVisible = true;
        } else {
          this.$modal.msgInfo("无引用申购单号");
        }
      }
    }
  }
};
</script>

<style scoped>
/* 相对 .app-container 铺满主内容区，不盖住顶部导航栏与左侧菜单（勿用 fixed 全屏） */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
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
  position: relative;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #fff;
}

/* 分页容器样式 */
.pagination-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
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
  flex-wrap: wrap;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 4px;
}

/* 仅表体 .el-table__body-wrapper 横向滚动；根节点再 overflow-x 会出现合计下方第二条横滑条 */
.local-modal-content .modal-detail-section .el-table {
  width: 100%;
  overflow-x: hidden;
}

::v-deep .local-modal-content .modal-detail-section .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
  scrollbar-width: thin;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
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

::v-deep .local-modal-content {
  min-height: 95vh !important;
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
    display: flex;
    align-items: center;
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

  .app-container > .el-form .el-row {
    margin-bottom: 8px;
  }

  .app-container > .el-form .el-row:last-child {
    margin-bottom: 0;
  }

  .app-container > .el-form .el-form-item {
    margin-bottom: 0;
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
    margin-bottom: 6px;
    display: flex;
    flex-wrap: nowrap;
  }

  .local-modal-content .modal-detail-section .detail-toolbar-row {
    flex-wrap: wrap;
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

  /* 计划明细生成方式：标签较长，单独加宽避免被单选遮挡 */
  .local-modal-content .modal-form-compact .plan-entry-mode-item .el-form-item__label {
    width: 130px !important;
    min-width: 130px;
    overflow: visible;
    text-overflow: unset;
  }
  .local-modal-content .modal-form-compact .plan-entry-mode-item .el-form-item__content {
    margin-left: 130px !important;
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
  .local-modal-content .modal-form-compact .plan-entry-mode-item .el-form-item__label {
    width: 130px !important;
    min-width: 130px;
    overflow: visible;
  }
  .local-modal-content .modal-form-compact .plan-entry-mode-item .el-form-item__content {
    margin-left: 130px !important;
  }

  /* 表单字段容器（与到货验收弹窗一致） */
  .form-fields-container {
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

  .form-fields-container .el-row:last-child {
    margin-bottom: 0;
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
  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
    height: 14px !important;
    width: 14px !important;
  }

  /* 明细框表格水平滚动条 */
  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar {
    height: 14px !important;
    width: 14px !important;
  }

  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }
  .local-modal-content .el-table::-webkit-scrollbar,
  .local-modal-content .table-wrapper::-webkit-scrollbar {
    width: 10px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
  .local-modal-content .el-table::-webkit-scrollbar-track,
  .local-modal-content .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
  .local-modal-content .el-table::-webkit-scrollbar-thumb,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  .local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }

  /* 确保主表格可以水平滚动和垂直滚动 */
  ::v-deep .el-table__body-wrapper {
    overflow-x: auto !important;
    overflow-y: auto !important;
  }

  /* 主表格水平滚动条增粗 */
  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    width: 16px !important; /* 垂直滚动条宽度 */
    height: 8px !important;  /* 水平滚动条高度 */
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-track,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 确保操作列固定 */
  ::v-deep .el-table__fixed-right {
    right: 0 !important;
    z-index: 12 !important;
    position: absolute !important;
  }

  ::v-deep .el-table__fixed-header-wrapper {
    z-index: 11;
  }

  ::v-deep .el-table__fixed-right-patch {
    right: 0 !important;
    z-index: 12 !important;
  }

  /* 确保固定列头部和主体都有正确的z-index */
  ::v-deep .el-table__fixed-right .el-table__header-wrapper {
    z-index: 12 !important;
  }

  ::v-deep .el-table__fixed-right .el-table__body-wrapper {
    z-index: 12 !important;
  }

  /* 确保固定列在滚动时保持固定 */
  ::v-deep .el-table__fixed {
    position: absolute !important;
  }

  ::v-deep .el-table__fixed-right {
    position: absolute !important;
    right: 0 !important;
  }

  /* 表格样式优化 - 引用申购单弹窗 */
  .modal-body .el-table {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  .modal-body .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
  }

  .modal-body .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }

  .modal-body .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }

  /* 引用申购单弹窗布局样式 */
  .query-container-fixed {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
    flex-shrink: 0;
  }

  .query-container {
    background: #fff;
    padding: 2px 20px 4px 20px !important;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 0;
    width: calc(100% + 40px);
    margin-left: -20px;
    margin-right: -20px;
  }

  .query-container .el-form {
    margin-bottom: 0 !important;
  }

  .query-container ::v-deep .el-row {
    margin-bottom: 4px;
  }

  .query-container ::v-deep .el-row:last-child {
    margin-bottom: 0;
  }

  .query-container ::v-deep .el-form-item {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .query-container ::v-deep .el-form-item {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    padding-bottom: 0 !important;
    display: flex !important;
    align-items: center !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-form-item__label {
    padding-bottom: 0 !important;
    padding-top: 0 !important;
    line-height: 28px !important;
    height: 28px !important;
    width: 70px !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-form-item__content {
    line-height: 34px !important;
    margin-left: 0 !important;
    flex: 1 !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-input__icon {
    line-height: 34px !important;
  }

  .query-container ::v-deep .el-date-editor.el-input {
    width: 140px;
    height: 34px !important;
  }

  .query-container ::v-deep .el-date-editor .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-select {
    width: 150px;
  }

  .query-container ::v-deep .el-select .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-select .el-input__icon {
    line-height: 34px !important;
  }

  /* 按钮容器 - 放在查询条件和左右分栏之间 */
  .button-container {
    text-align: left;
    margin: 10px 0;
    padding: 0 20px;
  }

  .button-container .el-button {
    margin-right: 10px;
  }

  .modal-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ref-purchase-modal .modal-body {
    overflow: hidden;
  }

  .reference-purchase-layout {
    display: flex;
    gap: 16px;
    flex: 1 1 auto;
    min-height: 0;
    height: calc(100vh - 300px);
    max-height: calc(100vh - 300px);
    margin-left: -20px;
    margin-right: -20px;
    width: calc(100% + 40px);
    overflow: hidden;
  }

  .purchase-list-container {
    flex: 0 0 600px;
    display: flex;
    flex-direction: column;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
    margin-left: -20px;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    overflow: visible;
  }

  .purchase-list-table-wrap {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .purchase-list-container .el-table {
    margin-bottom: 0;
  }

  .purchase-list-container ::v-deep .el-table__body-wrapper {
    overflow-y: auto !important;
    overflow-x: auto !important;
  }

  .purchase-list-container ::v-deep .el-table__header-wrapper {
    flex-shrink: 0;
  }

  /* 确保选择框列可见 */
  .purchase-list-container ::v-deep .el-table__body-wrapper,
  .purchase-list-container ::v-deep .el-table__header-wrapper {
    min-width: 100%;
  }

  .purchase-list-container ::v-deep .el-table__fixed,
  .purchase-list-container ::v-deep .el-table__fixed-right {
    height: 100% !important;
  }

  /* 隐藏radio按钮中的文本，只显示圆圈 */
  .purchase-list-container ::v-deep .el-radio__label {
    display: none !important;
    padding-left: 0 !important;
  }

  .purchase-list-container ::v-deep .el-radio {
    margin-right: 0 !important;
  }

  /* 优化列间距 */
  .purchase-list-container ::v-deep .el-table td,
  .purchase-list-container ::v-deep .el-table th {
    padding: 8px 6px !important;
  }

  /* 单号和科室列之间的间距优化 */
  .purchase-list-container ::v-deep .el-table td:nth-child(4),
  .purchase-list-container ::v-deep .el-table th:nth-child(4) {
    padding-right: 10px !important;
  }

  .purchase-list-container ::v-deep .el-table td:nth-child(5),
  .purchase-list-container ::v-deep .el-table th:nth-child(5) {
    padding-left: 10px !important;
  }

  .purchase-detail-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
    overflow: hidden;
    min-height: 0;
    height: 100%;
    max-height: 100%;
  }

  .purchase-detail-container .el-table {
    flex: 1;
    margin-bottom: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .purchase-detail-container ::v-deep .el-table__body-wrapper {
    overflow-y: auto !important;
    overflow-x: auto !important;
  }

  .purchase-detail-container ::v-deep .el-table__header-wrapper {
    flex-shrink: 0;
  }

  /* 确保选择框列可见 */
  .purchase-detail-container ::v-deep .el-table__body-wrapper,
  .purchase-detail-container ::v-deep .el-table__header-wrapper {
    min-width: 100%;
  }

  .purchase-detail-container ::v-deep .el-table__fixed,
  .purchase-detail-container ::v-deep .el-table__fixed-right {
    height: 100% !important;
  }

  .ref-purchase-pagination-wrap {
    flex: 0 0 50px;
    height: 50px;
    min-height: 50px;
    box-sizing: border-box;
    border-top: 1px solid #EBEEF5;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 8px;
    overflow: visible;
    z-index: 2;
  }

  .ref-purchase-pagination-wrap ::v-deep .pagination-container {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    width: 100%;
    display: flex !important;
    justify-content: flex-end;
  }

  .ref-purchase-pagination-wrap ::v-deep .el-pagination {
    white-space: nowrap;
  }

  ::v-deep .purchase-apply-row-disabled {
    color: #c0c4cc;
    background-color: #f5f7fa !important;
  }

  .ref-purchase-selected-tip {
    margin: 0 12px;
    font-size: 13px;
    color: #409eff;
    line-height: 36px;
  }
</style>

<style>
/* 采购计划列表：与到货验收一致（非 scoped，确保白卡边框/主表样式穿透） */
.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.app-container.caigou-jihua-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.caigou-jihua-page > .el-form.query-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.app-container.caigou-jihua-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.caigou-jihua-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.caigou-jihua-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.caigou-jihua-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-second {
  position: relative;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.caigou-jihua-page > .el-form.query-form .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  align-items: center;
}

.app-container.caigou-jihua-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.caigou-jihua-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.caigou-jihua-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.caigou-jihua-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.caigou-jihua-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.caigou-jihua-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.caigou-jihua-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.caigou-jihua-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.caigou-jihua-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

.app-container.caigou-jihua-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.caigou-jihua-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
