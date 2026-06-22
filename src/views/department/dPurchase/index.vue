<template>
  <div class="app-container d-purchase-page" :class="{ 'is-modal-open': open }">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="purchaseBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.purchaseBillNo"
                placeholder="申购单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId"/>
              </div>
            </el-form-item>
            <el-form-item prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item prop="purchaseBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.purchaseBillStatus" placeholder="单据状态"
                         :disabled="false"
                         clearable
                         style="width: 180px">
                <el-option v-for="dict in dict.type.purchase_status"
                           :key="dict.value"
                           :label="dict.value == '1' || dict.value == 1 ? '未审核' : dict.label"
                           :value="dict.value"
                />
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
        </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['department:purchase:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:purchase:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="purchaseList" :row-class-name="rowPurchaseIndex" @selection-change="handleSelectionChange" height="64vh" border stripe>
      <el-table-column type="selection" width="60" align="center" resizable />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="申购单号" align="center" prop="purchaseBillNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.purchaseBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="purchaseBillDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.purchaseBillDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="高值/低值" align="center" width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatIsGzLabel(scope.row.isGz) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="制单人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatCreatorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申购状态" align="center" prop="purchaseBillStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag v-if="scope.row.purchaseBillStatus != '1' && scope.row.purchaseBillStatus != 1" :options="dict.type.purchase_status" :value="scope.row.purchaseBillStatus"/>
          <el-tag v-else type="primary">未审核</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="计划引用" align="center" prop="purchasePlanRefStatus" width="96" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag :type="purchasePlanRefTagType(scope.row.purchasePlanRefStatus)" size="small">
            {{ purchasePlanRefLabel(scope.row.purchasePlanRefStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="出库引用" align="center" prop="outboundRefStatus" width="96" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag :type="outboundRefTagType(scope.row.outboundRefStatus)" size="small">
            {{ outboundRefLabel(scope.row.outboundRefStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" align="center" prop="urgencyLevel" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.urgency_level" :value="scope.row.urgencyLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="期望到货日期" align="center" prop="expectedDeliveryDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.expectedDeliveryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatAuditPersonName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="isAuditedPurchase(scope.row) && scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="230" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.purchaseBillStatus == 2"
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
              v-if="scope.row.purchaseBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:purchase:remove']"
              v-if="scope.row.purchaseBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改科室申购对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || isDeptWhLocked" filterable/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
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
                      <el-input :value="creatorDisplayName" :disabled="true" placeholder="—" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8" v-if="isAuditedPurchase(form)">
                  <el-col :span="4">
                    <el-form-item label="审核人">
                      <el-input :value="formatAuditPersonName(form)" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="审核时间">
                      <el-input :value="form.auditDate ? parseTime(form.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--'" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="!action || isDeptWhLocked" exclude-warehouse-type="设备"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="高值/低值" prop="isGz">
                      <el-select v-model="form.isGz" placeholder="请选择" clearable :disabled="!action || isDeptWhLocked" style="width: 100%;">
                        <el-option label="高值" value="1" />
                        <el-option label="低值" value="2" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
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
                  <el-col :span="4">
                    <el-form-item label="期望到货" prop="expectedDeliveryDate">
                      <el-date-picker clearable
                                      v-model="form.expectedDeliveryDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="!action"
                                      placeholder="请选择期望到货日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="1.5">
                  <span>科室申购明细信息</span>
                </el-col>
                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="addMaterialRow" :disabled="!form.warehouseId || !form.departmentId || !form.isGz">添加耗材</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteDepPurchaseApplyEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="small" @click="cancel">取消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
                  </el-col>
                </div>
              </el-row>

              <div class="table-wrapper">
              <el-table :data="depPurchaseApplyEntryList" :row-class-name="rowDepPurchaseApplyEntryIndex" @selection-change="handleDepPurchaseApplyEntrySelectionChange" ref="depPurchaseApplyEntry" :height="detailTableHeight" border :summary-method="getPurchaseSummaries" show-summary>
                <el-table-column type="selection" width="60" align="center" fixed="left" resizable />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="申购单号" align="center" prop="purchaseBillNo" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.purchaseBillNo || (form && form.purchaseBillNo) || '--' }}</span>
                  </template>
                </el-table-column>
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
                    <el-input
                      v-if="action"
                      v-model="scope.row.qty"
                      placeholder="数量"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.unitPrice">¥{{ parseFloat(scope.row.unitPrice).toFixed(2) }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.amt">¥{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand }}</span>
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
                    <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" />
                    <span v-else>{{ scope.row.remark || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100" fixed="right">
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
    <SelectMaterialForPurchase
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="form.warehouseId"
      :isGzValue="form.isGz"
      :excludeMaterialIds="selectedMaterialIds"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialForPurchase>
  </div>
</template>

<script>
import { listPurchase, getPurchase, delPurchase, addPurchase, updatePurchase } from "@/api/department/purchase";
import { assertBillHasMaterialEntries, normalizeBillMaterialLineQtyDefaultOne } from '@/utils/billEntryValidate';
import { assertMinPackageQtyOnSave } from '@/utils/minPackageQty';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectMaterialForPurchase from '@/components/SelectModel/SelectMaterialForPurchase';
import { runConfiguredTableExport } from '@/utils/tableExportRunner'
import { formatIsGzLabel } from '@/utils/purchaseAggEntry';

export default {
  name: "dPurchase",
  dicts: ['purchase_status', 'urgency_level'],
  components: {SelectWarehouse, SelectDepartment, SelectUser, SelectMaterialForPurchase},
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
      // 总条数
      total: 0,
      // 科室申购表格数据
      purchaseList: [],
      // 科室申购明细表格数据
      depPurchaseApplyEntryList: [],
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
        beginDate: null,
        endDate: null,
        warehouseId: null,
        isGz: null,
        departmentId: null,
        userId: null,
        purchaseBillStatus: null,
        urgencyLevel: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        isGz: [
          { required: true, message: "请选择高值/低值", trigger: "change" }
        ],
        urgencyLevel: [
          { required: true, message: "紧急程度不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 明细表固定高度：表体滚动，合计固定在表格最底部 */
    detailTableHeight() {
      return 'max(300px, calc(100vh - 320px))';
    },
    /** 新增明细后（或弹窗打开中）锁定仓库、科室，避免跨仓库/科室混入明细 */
    isDeptWhLocked() {
      return this.DialogComponentShow || (this.depPurchaseApplyEntryList && this.depPurchaseApplyEntryList.length > 0);
    },
    /** 当前明细已选耗材ID，用于选择弹窗过滤重复 */
    selectedMaterialIds() {
      return (this.depPurchaseApplyEntryList || [])
        .map(item => item && item.materialId)
        .filter(id => id !== null && id !== undefined && id !== '');
    },
    /** 制单人展示：优先中文姓名 */
    creatorDisplayName() {
      if (this.form.createrPersonName) {
        return this.form.createrPersonName;
      }
      if (this.form.user) {
        return this.form.user.nickName || this.form.user.userName || '';
      }
      return this.form.userName || '';
    }
  },
  created() {
    this.getList();
  },
  methods: {
    formatIsGzLabel,
    formatCreatorName(row) {
      if (!row) return '--';
      const name = row.createrPersonName
        || (row.user && (row.user.nickName || row.user.userName));
      return name || '--';
    },
    purchasePlanRefLabel(status) {
      const s = status == null || status === '' ? 0 : Number(status);
      const map = { 0: '未引用', 1: '部分引用', 2: '全部引用', 3: '计划驳回' };
      return map[s] != null ? map[s] : '--';
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
    formatAuditPersonName(row) {
      if (!row || !this.isAuditedPurchase(row)) return '--';
      return row.auditPersonName || '--';
    },
    isAuditedPurchase(row) {
      const s = row && row.purchaseBillStatus;
      return s === 2 || s === '2';
    },
    ensureFormCreatorUserId() {
      const uid = this.$store.state.user && this.$store.state.user.userId;
      if (uid != null && uid !== '') {
        this.form.userId = uid;
      }
    },
    /** 同步制单人/审核人展示字段 */
    syncCreatorAndAuditDisplay(data) {
      if (!data) return;
      if (data.createrPersonName) {
        this.form.userName = data.createrPersonName;
      } else if (data.user) {
        this.form.userName =
          data.user.nickName || data.user.name || data.user.userName || this.form.userName;
      } else if (!this.form.userName && data.userId) {
        const currentUser = this.$store.state.user;
        if (currentUser && currentUser.userId == data.userId) {
          this.form.userName = currentUser.nickName || currentUser.name || currentUser.userName || '';
        }
      }
    },
    /** 查询科室申购列表 */
    getList() {
      this.loading = true;
      listPurchase(this.queryParams).then(response => {
        this.purchaseList = response.rows;
        this.total = response.total;
        this.loading = false;
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
        warehouseId: null,
        isGz: null,
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
      this.depPurchaseApplyEntryList = [];
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
      row.amt = totalAmt.toFixed(2);
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
      row.amt = totalAmt.toFixed(2);
      this.calculateTotalAmount();
    },
    //计算总金额
    calculateTotalAmount(){
      let total = 0;
      this.depPurchaseApplyEntryList.forEach(item => {
        if(item.amt){
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = total.toFixed(2);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 明细表合计（与科室申领弹窗一致） */
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
        if (index === 1) {
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
          sums[index] = '¥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 科室申购序号 */
    rowPurchaseIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchase(id).then(response => {
        this.form = response.data;
        this.syncCreatorAndAuditDisplay(response.data);
        this.depPurchaseApplyEntryList = response.data.depPurchaseApplyEntryList || [];
        this.open = true;
        this.action = false;

        if (response.data.purchaseBillStatus == 1) {
          this.form.purchaseBillStatus = '1';
        }else if(response.data.purchaseBillStatus == 2){
          this.form.purchaseBillStatus = '2';
        }else{
          this.form.purchaseBillStatus = '3';
        }
        // 设置紧急程度文本显示
        this.setUrgencyLevelText(response.data.urgencyLevel);
        // 确保紧急程度下拉框使用字符串值，避免显示纯数字
        this.form.urgencyLevel = response.data.urgencyLevel != null ? String(response.data.urgencyLevel) : '';

        this.title = "查看科室申购";
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
      this.title = "添加科室申购";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPurchase(id).then(response => {
        this.form = response.data;
        this.syncCreatorAndAuditDisplay(response.data);
        this.depPurchaseApplyEntryList = response.data.depPurchaseApplyEntryList || [];
        // 设置紧急程度文本显示
        this.setUrgencyLevelText(response.data.urgencyLevel);
        // 确保紧急程度下拉框使用字符串值，避免显示纯数字
        this.form.urgencyLevel = response.data.urgencyLevel != null ? String(response.data.urgencyLevel) : '';

        this.open = true;
        this.action = true;
        this.form.purchaseBillStatus = '1';
        this.title = "修改科室申购";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!assertBillHasMaterialEntries(this.depPurchaseApplyEntryList, this, '请至少添加一条有效明细（选择耗材）')) {
            return;
          }
          const materialLines = (this.depPurchaseApplyEntryList || []).filter(item => item && item.materialId);
          if (!assertMinPackageQtyOnSave(this, materialLines, '科室申购')) {
            return;
          }
          normalizeBillMaterialLineQtyDefaultOne(this.depPurchaseApplyEntryList);
          this.calculateTotalAmount();
          this.form.depPurchaseApplyEntryList = this.depPurchaseApplyEntryList;
          if (!this.form.id) {
            this.ensureFormCreatorUserId();
          }
          if (this.form.id != null) {
            updatePurchase(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // this.open = false; // 保存后不关闭页面
              this.getList();
            });
          } else {
            addPurchase(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除所选科室申购数据？').then(() => {
        return delPurchase(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 科室申购明细序号 */
    rowDepPurchaseApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 科室申购明细添加按钮操作 */
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
      obj.purchaseBillNo = (this.form && this.form.purchaseBillNo) || "";
      this.depPurchaseApplyEntryList.push(obj);
    },
    /** 添加耗材行 */
    addMaterialRow() {
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      if (!this.form.isGz) {
        this.$modal.msgWarning("请先选择高值/低值");
        return;
      }
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
        const exist = new Set((this.depPurchaseApplyEntryList || []).map(i => String(i.materialId)).filter(Boolean));
        if (this.currentRow) {
          // 单行修改模式
          const material = val[0]; // 只取第一个选择的耗材
          if (material && material.id != null && exist.has(String(material.id))) {
            this.$modal.msgWarning("该耗材已存在于申购明细中，请勿重复添加");
            this.closeDialog();
            return;
          }
          this.fillMaterialData(this.currentRow, material);
          addedCount = 1;
        } else {
          // 批量添加模式
          let skip = 0;
          val.forEach(material => {
            if (!material || material.id == null || exist.has(String(material.id))) {
              skip++;
              return;
            }
            let obj = {};
            this.fillMaterialData(obj, material);
            this.depPurchaseApplyEntryList.push(obj);
            exist.add(String(material.id));
            addedCount++;
          });
          if (skip > 0) {
            this.$modal.msgWarning(`已自动过滤 ${skip} 条重复耗材明细`);
          }
        }
      }
      if (addedCount > 0) {
        this.debouncedAutoSavePurchase();
      }
      this.closeDialog();
    },
    /** 填充耗材数据到行 */
    fillMaterialData(row, material) {
      row.materialId = material.id;
      row.materialCode = material.code || '';
      row.materialName = material.name;
      row.minPackageQty = material.minPackageQty != null ? material.minPackageQty : null;
      row.material = material;
      row.materialSpec = material.speci || '';
      // 单位：支持多种字段路径
      row.unit = (material.fdUnit && material.fdUnit.unitName) ||
                 (material.unit && (material.unit.unitName || material.unit.name)) ||
                 '';
      // 单价：优先使用price，其次使用prince
      row.unitPrice = material.price || material.prince || '';
      row.brand = material.brand || '';
      row.supplierName = material.supplier ? material.supplier.name : '';
      row.model = material.model || '';
      // 生产厂家：支持多种字段路径
      row.producer = (material.fdFactory && material.fdFactory.factoryName) ||
                     material.producer ||
                     '';
      // 申购数量默认按最小包装数回填；为空/空白/0/无效时回填 1
      if (row.qty == null || row.qty === '') {
        row.qty = String(this.getDefaultPurchaseQtyFromMaterial(material));
      }
      row.amt = row.amt || '';
      row.reason = row.reason || '';
      row.remark = row.remark || '';
      row.purchaseBillNo = (this.form && this.form.purchaseBillNo) || row.purchaseBillNo || '';

      // 如果有数量，自动计算金额
      if (row.qty && row.unitPrice) {
        this.qtyChange(row);
      }
    },
    /**
     * 科室申购默认数量：优先最小包装数；为空/空白/0/无效时返回 1。
     * 兼容常见字段名和 packageSpeci 中首个数字（如 "10支/盒" -> 10）。
     */
    getDefaultPurchaseQtyFromMaterial(material) {
      if (!material || typeof material !== "object") {
        return 1;
      }
      const toPositiveInt = (v) => {
        if (v == null || String(v).trim() === "") {
          return null;
        }
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) {
          return null;
        }
        return Math.max(1, Math.floor(n));
      };
      for (const key of ["minPackageQty", "minPackQty", "minimumPackageQty", "min_package_qty"]) {
        const n = toPositiveInt(material[key]);
        if (n != null) {
          return n;
        }
      }
      const ps = material.packageSpeci;
      if (ps != null && String(ps).trim() !== "") {
        const txt = String(ps).trim();
        const pure = toPositiveInt(txt);
        if (pure != null) {
          return pure;
        }
        const mch = txt.match(/\d+(?:\.\d+)?/);
        if (mch) {
          const n = toPositiveInt(mch[0]);
          if (n != null) {
            return n;
          }
        }
      }
      return 1;
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
    // 科室申购静默保存（不关闭页面，不弹成功提示）
    savePurchaseDraftSilently() {
      if (!this.open || !this.action || this.purchaseDraftSaving) {
        return;
      }
      const list = (this.depPurchaseApplyEntryList || []).filter(item => item && item.materialId);
      if (!list.length || !this.form.warehouseId || !this.form.departmentId) {
        return;
      }
      if (!assertMinPackageQtyOnSave(this, list, '科室申购')) {
        return;
      }
      normalizeBillMaterialLineQtyDefaultOne(this.depPurchaseApplyEntryList);
      this.calculateTotalAmount();
      this.purchaseDraftSaving = true;
      this.form.depPurchaseApplyEntryList = this.depPurchaseApplyEntryList;
      const ax = { headers: { repeatSubmit: false, hideError: true } };
      const done = () => {
        this.purchaseDraftSaving = false;
      };
      if (this.form.id != null) {
        updatePurchase(this.form, ax).then(() => {}).catch(() => {}).finally(done);
      } else {
        addPurchase(this.form, ax).then((response) => {
          if (response && response.data) {
            if (response.data.id) {
              this.form.id = response.data.id;
            }
            if (response.data.purchaseBillNo) {
              this.form.purchaseBillNo = response.data.purchaseBillNo;
            }
            if (this.title === "添加科室申购") {
              this.title = "修改科室申购";
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
    /** 科室申购明细删除按钮操作 */
    handleDeleteDepPurchaseApplyEntry() {
      if (this.checkedDepPurchaseApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室申购明细数据");
      } else {
        const depPurchaseApplyEntryList = this.depPurchaseApplyEntryList;
        const checkedDepPurchaseApplyEntry = this.checkedDepPurchaseApplyEntry;
        this.depPurchaseApplyEntryList = depPurchaseApplyEntryList.filter(function(item) {
          return checkedDepPurchaseApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotalAmount();
      }
    },
    /** 复选框选中数据 */
    handleDepPurchaseApplyEntrySelectionChange(selection) {
      this.checkedDepPurchaseApplyEntry = selection.map(item => item.index)
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/purchase/export', {
        ...this.queryParams,
        exportBillIds: String(row.id)
      }, `purchase_${row.purchaseBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    async handleExport() {
      const urgencyDict = (this.dict && this.dict.type && this.dict.type.urgency_level) || []
      const statusDict = (this.dict && this.dict.type && this.dict.type.purchase_status) || []
      const idSet = this.ids && this.ids.length ? new Set(this.ids.map(id => String(id))) : null

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
          reportTitle: '科室申购',
          dateRangeKeys: { start: 'beginDate', end: 'endDate' },
          query: { ...this.queryParams },
          pageSize: 500,
          mode: 'all',
          fetchPage: (params) => listPurchase(params),
          rowFilter: idSet ? (row) => row && idSet.has(String(row.id)) : null,
          sheetName: '科室申购',
          summaryRow: ({ rawRows, headers }) => {
            const row = {}
            headers.forEach((h) => { row[h] = '' })
            row['申购单号'] = '合计'
            const sum = (rawRows || []).reduce((s, r) => {
              const n = Number(r && r.totalAmount)
              return s + (Number.isFinite(n) ? n : 0)
            }, 0)
            row['总金额'] = sum > 0 ? `¥${sum.toFixed(2)}` : '--'
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
            { label: '仓库', prop: 'warehouse.name' },
            { label: '科室', prop: 'department.name' },
            { label: '制单人', prop: 'createrPersonName' },
            { label: '审核人', prop: 'auditPersonName' },
            { label: '审核时间', prop: 'auditDate' },
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
                return Number.isFinite(n) && n > 0 ? `¥${n.toFixed(2)}` : '--'
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
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 与科室申领 dApply 弹窗一致 */
/* 与科室申领 dApply：遮罩相对 .app-container 铺满主内容区，不盖住侧栏 */
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

/* 弹窗内顶部字段区 */
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

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
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

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266 !important;
  font-weight: 600 !important;
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

/* 搜索区域：与科室申领一致 */
.app-container.d-purchase-page > .el-form.query-form {
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

.app-container.d-purchase-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.d-purchase-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-purchase-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-row-second {
  position: relative;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.d-purchase-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页：贴近表格；下方不留白（与科室申领一致） */
.d-purchase-page .pagination-bottom-wrap {
  margin-top: 0 !important;
  margin-bottom: 0;
  padding-bottom: 0;
  transform: translateY(-8px);
}

::v-deep .d-purchase-page .pagination-bottom-wrap .pagination-container {
  padding: 0 !important;
  margin-top: 0 !important;
}

/* 仅列表主表滚动条（勿作用于弹窗内表） */
::v-deep .d-purchase-page > .el-table .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .d-purchase-page > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .d-purchase-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25) !important;
}

::v-deep .d-purchase-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06) !important;
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

::v-deep .d-purchase-page > .el-table {
  overflow-x: auto;
}
</style>

<style>
/* 与科室申领 d-apply-page 非 scoped 块一致（勿加 overflow-x/max-width，避免搜索区与标签栏间距表现不一致） */
.app-container.d-purchase-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  /* 确保弹窗遮罩（absolute）能覆盖到底部，避免露出底层条 */
  min-height: calc(100vh - 84px);
}

.app-container.d-purchase-page > .el-table {
  margin-bottom: 1px;
}

.app-container.d-purchase-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-purchase-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.d-purchase-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.d-purchase-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 与科室申领：抵消页面主体内边距，遮罩与白底与列表同宽 */
.app-container.d-purchase-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* 弹窗打开时，隐藏底层分页/横向滚动区域，避免半透明遮罩下透出“蓝色条” */
.app-container.d-purchase-page.is-modal-open .pagination-bottom-wrap {
  display: none;
}
</style>
