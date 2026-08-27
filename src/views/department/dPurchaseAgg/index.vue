<template>
  <div class="app-container list-page d-purchase-agg-page" :class="{ 'is-modal-open': open }">
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
              <el-select v-model="queryParams.purchaseBillStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.purchase_status"
                           :key="dict.value"
                           :label="dict.value == '1' || dict.value == 1 ? '未审核' : dict.label"
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
          @click="handleAdd"
          v-hasPermi="['department:purchase:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:purchase:export']"
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
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="230">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="isViewOnlyPurchase(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRowDetail(scope.row)"
              v-hasPermi="['department:purchase:export']"
              style="padding: 0 5px; margin: 0;"
            >导出明细</el-button>
            <el-button
              size="small"
              type="text"
              
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:purchase:edit']"
              v-if="isEditablePurchase(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:purchase:remove']"
              v-if="isEditablePurchase(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
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

    <!-- 添加或修改汇总申购对话框（布局对齐到货验收 apply-modal） -->
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
                    <el-form-item label="单号" prop="purchaseBillNo" class="form-item-header-billno">
                      <el-input v-model="form.purchaseBillNo" :disabled="true" :title="form.purchaseBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="申购状态" prop="purchaseBillStatus">
                      <el-select
                        v-model="form.purchaseBillStatus"
                        placeholder="请选择申购状态"
                        :disabled="true"
                        clearable
                      >
                        <el-option
                          v-for="dict in dict.type.purchase_status"
                          :key="dict.value"
                          :label="dict.value == '1' || dict.value == 1 ? '未审核' : dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || isDeptWhLocked" filterable/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="userId">
                      <el-input v-model="form.userName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="purchaseBillDate">
                      <el-date-picker
                        clearable
                        v-model="form.purchaseBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择制单日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="紧急程度" prop="urgencyLevel" class="form-item-urgency">
                      <el-select
                        v-if="action"
                        v-model="form.urgencyLevel"
                        placeholder="请选择紧急程度"
                        clearable
                      >
                        <el-option
                          v-for="dict in dict.type.urgency_level"
                          :key="dict.value"
                          :label="dict.label"
                          :value="String(dict.value)"
                        />
                      </el-select>
                      <el-input v-else v-model="urgencyLevelText" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="期望到货" prop="expectedDeliveryDate">
                      <el-date-picker
                        clearable
                        v-model="form.expectedDeliveryDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="!action"
                        placeholder="请选择期望到货日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">汇总申购明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="addMaterialRow" :disabled="!form.departmentId">添加耗材</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteDepPurchaseApplyEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="entryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                @selection-change="handleDepPurchaseApplyEntrySelectionChange"
                ref="depPurchaseApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getPurchaseSummaries"
                show-summary
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByEntryMaterialCode">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || scope.row.code || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材" align="center" prop="materialName" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'materialName')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'warehouseName')">
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
                <el-table-column label="规格" align="center" prop="materialSpec" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'materialSpec')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialSpec || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByEntryText(a,b,'unit')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')">
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      v-model="scope.row.qty"
                      placeholder="数量"
                      size="small"
                      onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.unitPrice">¥{{ scope.row.unitPrice | formatPrice }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.amt">¥{{ scope.row.amt | formatCurrency }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand || (scope.row.material && scope.row.material.brand) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplierName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplierName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" size="small" />
                    <span v-else>{{ scope.row.remark || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteDetailRow(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
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

    <!-- 耗材选择组件 -->
    <SelectMaterialForPurchaseAgg
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :excludePickKeys="entryPickKeys"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialForPurchaseAgg>
  </div>
</template>

<script>
import { listPurchaseAgg, getPurchaseAgg, delPurchaseAgg, addPurchaseAgg, updatePurchaseAgg } from "@/api/department/purchaseAgg";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialForPurchaseAgg from '@/components/SelectModel/SelectMaterialForPurchaseAgg';
import { buildAggEntryPickKey, fillAggEntryFromFixedNumber, formatIsGzLabel } from '@/utils/purchaseAggEntry';
import { assertBillHasMaterialEntries, normalizeBillMaterialLineQtyDefaultOne } from '@/utils/billEntryValidate';
import { runConfiguredTableExport } from '@/utils/tableExportRunner'
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
  name: "dPurchaseAgg",
  dicts: ['purchase_status', 'urgency_level'],
  components: {SelectWarehouse, SelectDepartment, SelectMaterialForPurchaseAgg},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      currentRow: null, // 当前选择耗材的行
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedDepPurchaseApplyEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      detailSelectedRowMap: {},
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
      //是否显示
      action: true,
      // 新增明细后静默自动保存
      purchaseAutoSaveTimer: null,
      purchaseDraftSaving: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        purchaseBillNo: null,
        ...buildListDefaultDateRange(),
        warehouseId: null,
        departmentId: null,
        userId: null,
        purchaseBillStatus: null,
        urgencyLevel: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "change" }
        ],
        urgencyLevel: [
          { required: true, message: "紧急程度不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 弹窗明细表高度：与到货验收 apply-modal 一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    /** 新增明细后（或弹窗打开中）锁定科室，避免跨科室混入明细 */
    isDeptWhLocked() {
      return this.DialogComponentShow || (this.entryList && this.entryList.length > 0);
    },
    /** 当前明细已选 materialId_warehouseId，用于选品弹窗去重 */
    entryPickKeys() {
      return (this.entryList || [])
        .map(item => buildAggEntryPickKey(item))
        .filter(k => k);
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
    entryList() {
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
    sortByEntryText(a, b, field) {
      const pick = (row) => {
        const v = row && row[field];
        return v != null && String(v).trim() !== '' ? String(v) : '';
      };
      return pick(a).localeCompare(pick(b), 'zh-CN');
    },
    sortByEntryMaterialCode(a, b) {
      const pick = (row) => {
        if (!row) return '';
        return row.materialCode || (row.material && row.material.code) || row.code || '';
      };
      return String(pick(a)).localeCompare(String(pick(b)), 'zh-CN');
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
    formatIsGzLabel,
    formatCreatorName(row) {
      if (!row) return '--';
      const name = row.createrPersonName
        || (row.user && (row.user.nickName || row.user.userName));
      return name || '--';
    },
    formatAuditPersonName(row) {
      if (!row || !this.isAuditedPurchase(row)) return '--';
      return row.auditPersonName || '--';
    },
    isAuditedPurchase(row) {
      const s = row && row.purchaseBillStatus;
      return s === 2 || s === '2';
    },
    isRejectedPurchase(row) {
      const s = row && row.purchaseBillStatus;
      return s === 3 || s === '3';
    },
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
    /** 已审核或已驳回：仅查看，不可改 */
    isViewOnlyPurchase(row) {
      return this.isAuditedPurchase(row) || this.isRejectedPurchase(row);
    },
    /** 仅待审核且未拆分可编辑 */
    isEditablePurchase(row) {
      if (!row) {
        return false;
      }
      const s = row.purchaseBillStatus;
      const pending = s === 1 || s === '1';
      const split = row.splitStatus;
      const notSplit = split == null || split === 0 || split === '0';
      return pending && notSplit;
    },
    normalizePurchaseBillStatus(status) {
      if (status == 1 || status === '1') {
        return '1';
      }
      if (status == 2 || status === '2') {
        return '2';
      }
      if (status == 3 || status === '3') {
        return '3';
      }
      return status != null ? String(status) : null;
    },
    /** 查询汇总申购列表 */
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      listPurchaseAgg(queryParams).then(response => {
        this.purchaseList = response.rows;
        this.total = response.total;
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
      if (this.purchaseAutoSaveTimer) {
        clearTimeout(this.purchaseAutoSaveTimer);
        this.purchaseAutoSaveTimer = null;
      }
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        purchaseBillNo: null,
        purchaseBillDate: null,
        departmentId: null,
        userId: null,
        userName: null,
        purchaseBillStatus: null,
        totalAmount: null,
        urgencyLevel: null,
        expectedDeliveryDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.entryList = [];
      this.detailSelectedRowMap = {};
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
      this.calculateTotalAmount();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
      this.calculateTotalAmount();
    },
    //计算总金额
    calculateTotalAmount(){
      let total = 0;
      this.entryList.forEach(item => {
        if(item.amt){
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = this.toMoneyStorage(total);
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
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 明细表合计（合计标签在序号列，与到货验收弹窗一致） */
    getPurchaseSummaries(param) {
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
        if (prop === 'qty') {
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
        if (prop === 'amt') {
          const values = data.map(row => Number(row[prop]));
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = '¥' + this.formatAmount(total);
          }
        }
      });
      return sums;
    },
    /** 弹窗明细表布局刷新 */
    layoutDetailTable() {
      const run = () => {
        const table = this.$refs.depPurchaseApplyEntry;
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
    /** 汇总申购明细行样式（序号 + 勾选高亮） */
    applyDetailRowClassName({ row, rowIndex }) {
      row.index = rowIndex + 1;
      const key = row.index != null ? row.index : rowIndex + 1;
      const classes = [];
      if (key != null && this.detailSelectedRowMap && this.detailSelectedRowMap[key]) {
        classes.push('apply-row-selected');
      }
      return classes.join(' ');
    },
    /** 汇总申购序号（弹窗明细用） */
    rowPurchaseEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchaseAgg(id).then(response => {
        this.form = response.data;
        this.entryList = response.data.entryList || [];
        this.open = true;
        this.action = false;

        this.form.purchaseBillStatus = this.normalizePurchaseBillStatus(response.data.purchaseBillStatus);
        // 设置紧急程度文本显示
        this.setUrgencyLevelText(response.data.urgencyLevel);
        // 确保紧急程度下拉框使用字符串值，避免显示纯数字
        this.form.urgencyLevel = response.data.urgencyLevel != null ? String(response.data.urgencyLevel) : '';

        this.title = "查看汇总申购";
        this.$nextTick(() => this.layoutDetailTable());
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      // 设置制单人为当前用户
      const currentUser = this.$store.state.user;
      if (currentUser) {
        this.form.userId = currentUser.userId;
        // 优先显示中文姓名（nickName），避免显示登录名 admin
        this.form.userName = currentUser.nickName || currentUser.name || currentUser.userName || '';
      }
      this.open = true;
      this.form.purchaseBillStatus = '1';
      this.form.purchaseBillDate = this.getBillDate();
      this.form.urgencyLevel = '1';
      this.title = "添加汇总申购";
      this.action = true;
      this.$nextTick(() => this.layoutDetailTable());
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      if (row && !this.isEditablePurchase(row)) {
        if (this.isRejectedPurchase(row)) {
          this.$modal.msgWarning('已驳回的汇总申购单不可修改');
        } else if (this.isAuditedPurchase(row)) {
          this.$modal.msgWarning('已审核的汇总申购单不可修改');
        } else {
          this.$modal.msgWarning('当前状态的汇总申购单不可修改');
        }
        return;
      }
      this.reset();
      const id = row.id || this.ids
      getPurchaseAgg(id).then(response => {
        const data = response.data || {};
        if (!this.isEditablePurchase(data)) {
          if (this.isRejectedPurchase(data)) {
            this.$modal.msgWarning('已驳回的汇总申购单不可修改');
          } else {
            this.$modal.msgWarning('当前状态的汇总申购单不可修改');
          }
          return;
        }
        this.form = response.data;
        // 优先使用后端返回的用户中文姓名，其次使用当前登录用户信息
        if (response.data.user) {
          this.form.userName =
            response.data.user.nickName ||
            response.data.user.name ||
            response.data.user.userName ||
            this.form.userName;
        } else if (!this.form.userName && this.form.userId) {
          const currentUser = this.$store.state.user;
          if (currentUser && currentUser.userId == this.form.userId) {
            this.form.userName = currentUser.nickName || currentUser.name || currentUser.userName || '';
          }
        }
        this.entryList = response.data.entryList || [];
        // 设置紧急程度文本显示
        this.setUrgencyLevelText(response.data.urgencyLevel);
        // 确保紧急程度下拉框使用字符串值，避免显示纯数字
        this.form.urgencyLevel = response.data.urgencyLevel != null ? String(response.data.urgencyLevel) : '';

        this.form.purchaseBillStatus = this.normalizePurchaseBillStatus(data.purchaseBillStatus);
        this.open = true;
        this.action = true;
        this.title = "修改汇总申购";
        this.$nextTick(() => this.layoutDetailTable());
      });
    },
    /** 提交按钮 */
    submitForm() {
      if (this.form.id != null && !this.isEditablePurchase(this.form)) {
        if (this.isRejectedPurchase(this.form)) {
          this.$modal.msgError('已驳回的汇总申购单不可保存');
        } else {
          this.$modal.msgError('当前状态的汇总申购单不可保存');
        }
        return;
      }
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!assertBillHasMaterialEntries(this.entryList, this)) {
            return;
          }
          normalizeBillMaterialLineQtyDefaultOne(this.entryList);
          this.calculateTotalAmount();
          const validEntries = this.entryList.filter(item => item.materialId);
          const missingWh = validEntries.filter(item => !item.warehouseId);
          if (missingWh.length > 0) {
            this.$modal.msgError("存在明细未关联仓库，请从仓库定数重新选品。");
            return;
          }
          const missingGz = validEntries.filter(item => !item.isGz);
          if (missingGz.length > 0) {
            this.$modal.msgError("存在明细缺少高值/低值标志，请重新从定数选品。");
            return;
          }
          this.form.entryList = this.entryList;
          if (this.form.id != null) {
            updatePurchaseAgg(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // this.open = false; // 保存后不关闭页面
              this.getList();
            });
          } else {
            addPurchaseAgg(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 保存成功后，更新表单ID，以便后续修改
              if (response.data) {
                this.form.id = response.data.id;
                this.form.purchaseBillNo = response.data.purchaseBillNo || this.form.purchaseBillNo;
              }
              // this.open = false; // 保存后不关闭页面
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id != null ? row.id : this.ids;
      this.$modal.confirm('是否确认删除所选汇总申购数据？').then(() => {
        return delPurchaseAgg(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 汇总申购明细添加按钮操作 */
    handleAddDepPurchaseApplyEntry() {
      let obj = {};
      obj.materialId = null;
      obj.materialCode = "";
      obj.materialName = "";
      obj.materialSpec = "";
      obj.unit = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.amt = "";
      obj.reason = "";
      obj.supplierName = "";
      obj.brand = "";
      obj.model = "";
      obj.producer = "";
      obj.remark = "";
      this.entryList.push(obj);
    },
    /** 添加耗材行 */
    addMaterialRow() {
      if (!this.form.departmentId) {
        this.$modal.msgWarning("请先选择科室");
        return;
      }
      this.currentRow = null; // 标记为批量添加
      this.DialogComponentShow = true;
    },
    /** 选择耗材 */
    selectMaterial(row) {
      this.currentRow = row;
      this.DialogComponentShow = true;
    },
    /** 清除耗材 */
    clearMaterial(row) {
      row.materialId = null;
      row.materialCode = "";
      row.materialName = "";
      row.materialSpec = "";
      row.unit = "";
      row.unitPrice = "";
      row.brand = "";
      row.supplierName = "";
      row.model = "";
      row.qty = "";
      row.amt = "";
      this.calculateTotalAmount();
    },
    /** 关闭选择耗材弹窗 */
    closeDialog() {
      this.DialogComponentShow = false;
      this.currentRow = null;
    },
    /** 处理选择的耗材数据 */
    selectData(val) {
      let addedCount = 0;
      if (val && val.length > 0) {
        const exist = new Set((this.entryList || []).map(i => buildAggEntryPickKey(i)).filter(Boolean));
        if (this.currentRow) {
          const material = val[0];
          const pickKey = buildAggEntryPickKey({
            materialId: material.materialId != null ? material.materialId : material.id,
            warehouseId: material.warehouseId,
            isGz: material.isGz
          });
          if (pickKey && exist.has(pickKey)) {
            this.$modal.msgWarning("该耗材在该仓库已存在，请勿重复添加");
            this.closeDialog();
            return;
          }
          fillAggEntryFromFixedNumber(this.currentRow, material);
          addedCount = 1;
        } else {
          let skip = 0;
          val.forEach(material => {
            if (!material) {
              skip++;
              return;
            }
            const pickKey = buildAggEntryPickKey({
              materialId: material.materialId != null ? material.materialId : material.id,
              warehouseId: material.warehouseId,
              isGz: material.isGz
            });
            if (!pickKey || exist.has(pickKey)) {
              skip++;
              return;
            }
            const obj = {};
            fillAggEntryFromFixedNumber(obj, material);
            this.entryList.push(obj);
            exist.add(pickKey);
            addedCount++;
          });
          if (skip > 0) {
            this.$modal.msgWarning(`已自动过滤 ${skip} 条重复明细`);
          }
        }
      }
      if (addedCount > 0) {
        this.debouncedAutoSavePurchase();
      }
      this.closeDialog();
    },
    // 新增明细后防抖自动保存草稿，避免频繁请求
    debouncedAutoSavePurchase() {
      if (this.purchaseAutoSaveTimer) {
        clearTimeout(this.purchaseAutoSaveTimer);
      }
      this.purchaseAutoSaveTimer = setTimeout(() => {
        this.purchaseAutoSaveTimer = null;
        this.savePurchaseDraftSilently();
      }, 500);
    },
    // 汇总申购静默保存（不关闭页面，不弹成功提示）
    savePurchaseDraftSilently() {
      if (!this.open || !this.action || this.purchaseDraftSaving) {
        return;
      }
      if (this.form.id != null && !this.isEditablePurchase(this.form)) {
        return;
      }
      const list = (this.entryList || []).filter(item => item && item.materialId);
      if (!list.length || !this.form.departmentId) {
        return;
      }
          if (list.some(item => !item.warehouseId)) {
            return;
          }
          if (list.some(item => !item.isGz)) {
            return;
          }
      normalizeBillMaterialLineQtyDefaultOne(this.entryList);
      this.calculateTotalAmount();
      this.purchaseDraftSaving = true;
      this.form.entryList = this.entryList;
      const ax = { headers: { repeatSubmit: false, hideError: true } };
      const done = () => {
        this.purchaseDraftSaving = false;
      };
      if (this.form.id != null) {
        updatePurchaseAgg(this.form, ax).then(() => {}).catch(() => {}).finally(done);
      } else {
        addPurchaseAgg(this.form, ax).then((response) => {
          if (response && response.data) {
            if (response.data.id) {
              this.form.id = response.data.id;
            }
            if (response.data.purchaseBillNo) {
              this.form.purchaseBillNo = response.data.purchaseBillNo;
            }
            if (this.title === "添加汇总申购") {
              this.title = "修改汇总申购";
            }
          }
        }).catch(() => {}).finally(done);
      }
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
    /** 汇总申购明细删除按钮操作 */
    handleDeleteDepPurchaseApplyEntry() {
      if (this.checkedDepPurchaseApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的汇总申购明细数据");
      } else {
        const entryList = this.entryList;
        const checkedDepPurchaseApplyEntry = this.checkedDepPurchaseApplyEntry;
        this.entryList = entryList.filter(function(item) {
          return checkedDepPurchaseApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotalAmount();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.entryList.splice(index, 1);
      this.calculateTotalAmount();
    },
    /** 复选框选中数据 */
    handleDepPurchaseApplyEntrySelectionChange(selection) {
      this.checkedDepPurchaseApplyEntry = (selection || []).map(item => item.index);
      const map = {};
      (selection || []).forEach((row, idx) => {
        const key = row.index != null ? row.index : idx + 1;
        map[key] = true;
      });
      this.detailSelectedRowMap = map;
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/purchaseAgg/export', {
        ...this.buildExportQueryParams(),
        exportBillIds: String(row.id)
      }, `purchase_agg_${row.purchaseBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    async handleExport() {
      const urgencyDict = (this.dict && this.dict.type && this.dict.type.urgency_level) || []
      const statusDict = (this.dict && this.dict.type && this.dict.type.purchase_status) || []
      const idSet = this.ids && this.ids.length ? new Set(this.ids.map(id => String(id))) : null
      const query = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(query);

      const dictLabel = (options, value) => {
        const v = value == null ? '' : String(value)
        const hit = (options || []).find(d => String(d.value) === v)
        return hit ? hit.label : v
      }
      const fmtDate = (v) => {
        if (!v) return ''
        const d = new Date(v)
        if (Number.isNaN(d.getTime())) return v
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      try {
        const result = await runConfiguredTableExport({
          reportTitle: '汇总申购',
          dateRangeKeys: { start: 'beginDate', end: 'endDate' },
          query: query,
          pageSize: 500,
          mode: 'all',
          fetchPage: (params) => listPurchaseAgg(params),
          rowFilter: idSet ? (row) => row && idSet.has(String(row.id)) : null,
          sheetName: '汇总申购',
          summaryRow: ({ rawRows, headers }) => {
            const row = {}
            headers.forEach((h) => { row[h] = '' })
            row['申购单号'] = '合计'
            const sum = (rawRows || []).reduce((s, r) => {
              const n = Number(r && r.totalAmount)
              return s + (Number.isFinite(n) ? n : 0)
            }, 0)
            row['总金额'] = sum > 0 ? `¥${this.formatAmount(sum)}` : '--'
            return row
          },
          columns: [
            {
              label: '序号',
              valueGetter: (_, index) => index + 1
            },
            { label: '申购单号', prop: 'purchaseBillNo' },
            {
              label: '制单日期',
              valueGetter: (row) => fmtDate(row && row.purchaseBillDate)
            },
            { label: '科室', prop: 'department.name' },
            {
              label: '拆分状态',
              valueGetter: (row) => (row && row.splitStatus == 1 ? '已拆分' : '未拆分')
            },
            { label: '制单人', prop: 'user.userName' },
            {
              label: '申购状态',
              valueGetter: (row) => {
                const s = row && row.purchaseBillStatus
                if (String(s) === '1') return '未审核'
                return dictLabel(statusDict, s)
              }
            },
            {
              label: '紧急程度',
              valueGetter: (row) => dictLabel(urgencyDict, row && row.urgencyLevel)
            },
            {
              label: '总金额',
              valueGetter: (row) => {
                const n = Number(row && row.totalAmount)
                return Number.isFinite(n) && n > 0 ? `¥${this.formatAmount(n)}` : '--'
              }
            },
            {
              label: '期望到货日期',
              valueGetter: (row) => fmtDate(row && row.expectedDeliveryDate)
            },
            { label: '备注', prop: 'remark' }
          ]
        })
        if (idSet && result.rowCount === 0) {
          this.$modal.msgWarning('当前筛选条件下未找到勾选单据')
          return
        }
        this.$modal.msgSuccess(`已导出 ${result.rowCount} 条`)
      } catch (e) {
        this.$modal.msgWarning(e && e.message ? e.message : '导出失败')
      }
    },
    buildExportQueryParams() {
      return { ...this.queryParams };
    }
  }
};
</script>

<style scoped>
@import '../../caigou/jihua/styles/plan-modal-common.scss';

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
  padding: 6px 8px;
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item.apply-modal-label-required .el-form-item__label,
.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
  margin-right: 0 !important;
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗内明细表区：与到货验收 apply-modal 一致 */
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

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
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

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel > .el-row {
  margin-bottom: 8px !important;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel > .el-row:last-child {
  margin-bottom: 0 !important;
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

.local-modal-content .modal-form-compact .form-item-header-billno .el-input {
  width: 162px !important;
  max-width: 162px !important;
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
  line-height: 28px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-form-item__content {
  white-space: nowrap;
}

::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-form-item__label:before {
  display: none !important;
  content: '' !important;
}

::v-deep .local-modal-content .modal-form-compact .form-item-urgency .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

::v-deep .local-modal-content.apply-modal-root-content {
  min-height: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
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

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
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
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

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
</style>

<style>
/* 列表样式见 department-apply-list-align.scss；以下为弹窗特例 */
.app-container.d-purchase-agg-page.is-modal-open {
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding-top: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
}

.app-container.d-purchase-agg-page.is-modal-open > .el-table,
.app-container.d-purchase-agg-page.is-modal-open .pagination-bottom-wrap,
.app-container.d-purchase-agg-page.is-modal-open .apply-table-panel {
  display: none;
}

.app-container.d-purchase-agg-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}

.app-container.d-purchase-agg-page .apply-main-table thead th.col-expected-delivery-header .cell {
  white-space: nowrap !important;
}

.app-container.d-purchase-agg-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗内查询区：list-page 卡片容器 form-fields-container list-query-panel（与到货验收一致） */
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel.form-fields-container {
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

.app-container.d-purchase-agg-page .local-modal-content .list-query-panel.apply-modal-query-panel > .el-row,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel > .apply-modal-form-row.el-row {
  margin-bottom: 8px;
}

.app-container.d-purchase-agg-page .local-modal-content .list-query-panel.apply-modal-query-panel > .el-row:last-child,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel > .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

/* 表头区：inline-flex 保证标签与输入框同一行（与到货验收一致） */
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .delivery-ref-form-item .el-form-item__label,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .detail-scan-form-item .el-form-item__label {
  white-space: nowrap;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

/* 弹窗内表头输入：28px 高度（覆盖 list-page 32px），边框沿用 list-page */
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.d-purchase-agg-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 28px !important;
  min-height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-table-panel {
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

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell {
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

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 8px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}

/* 明细表体行高：对齐到货验收（padding 4px + 内容区 28px，等同 small 输入框行） */
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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

.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.d-purchase-agg-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-purchase-agg-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}
</style>

