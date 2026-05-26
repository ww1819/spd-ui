<template>
  <div class="app-container d-purchase-agg-page" :class="{ 'is-modal-open': open }">
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
          <span>{{ parseTime(scope.row.purchaseBillDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="拆分状态" align="center" prop="splitStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.splitStatus == 1" type="success" size="small">已拆分</el-tag>
          <el-tag v-else type="info" size="small">未拆分</el-tag>
        </template>
      </el-table-column>
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

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改汇总申购对话框 -->
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
                      <el-input v-model="form.userName" :disabled="true" placeholder="—" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
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
                  <span>汇总申购明细信息</span>
                </el-col>
                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="addMaterialRow" :disabled="!form.departmentId">添加耗材</el-button>
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
              <el-table :data="entryList" :row-class-name="rowDepPurchaseApplyEntryIndex" @selection-change="handleDepPurchaseApplyEntrySelectionChange" ref="depPurchaseApplyEntry" :height="detailTableHeight" border :summary-method="getPurchaseSummaries" show-summary>
                <el-table-column type="selection" width="60" align="center" fixed="left" resizable />
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
        beginDate: null,
        endDate: null,
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
    /** 明细表固定高度：表体滚动，合计固定在表格最底部 */
    detailTableHeight() {
      return 'max(300px, calc(100vh - 320px))';
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
  methods: {
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
      listPurchaseAgg(this.queryParams).then(response => {
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
      this.entryList.forEach(item => {
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
    /** 汇总申购序号 */
    rowPurchaseIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
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
    /** 汇总申购明细序号 */
    rowDepPurchaseApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
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
    /** 复选框选中数据 */
    handleDepPurchaseApplyEntrySelectionChange(selection) {
      this.checkedDepPurchaseApplyEntry = selection.map(item => item.index)
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/purchaseAgg/export', {
        ...this.queryParams,
        exportBillIds: String(row.id)
      }, `purchase_agg_${row.purchaseBillNo || row.id}_${new Date().getTime()}.xlsx`)
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
          reportTitle: '汇总申购',
          dateRangeKeys: { start: 'beginDate', end: 'endDate' },
          query: { ...this.queryParams },
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
.app-container.d-purchase-agg-page > .el-form.query-form {
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

.app-container.d-purchase-agg-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.d-purchase-agg-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-purchase-agg-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-row-second {
  position: relative;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.d-purchase-agg-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页：贴近表格；下方不留白（与科室申领一致） */
.d-purchase-agg-page .pagination-bottom-wrap {
  margin-top: 0 !important;
  margin-bottom: 0;
  padding-bottom: 0;
  transform: translateY(-8px);
}

::v-deep .d-purchase-agg-page .pagination-bottom-wrap .pagination-container {
  padding: 0 !important;
  margin-top: 0 !important;
}

/* 仅列表主表滚动条（勿作用于弹窗内表） */
::v-deep .d-purchase-agg-page > .el-table .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .d-purchase-agg-page > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .d-purchase-agg-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25) !important;
}

::v-deep .d-purchase-agg-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
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

::v-deep .d-purchase-agg-page > .el-table {
  overflow-x: auto;
}
</style>

<style>
/* 与科室申领 d-apply-page 非 scoped 块一致（勿加 overflow-x/max-width，避免搜索区与标签栏间距表现不一致） */
.app-container.d-purchase-agg-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  /* 确保弹窗遮罩（absolute）能覆盖到底部，避免露出底层条 */
  min-height: calc(100vh - 84px);
}

.app-container.d-purchase-agg-page > .el-table {
  margin-bottom: 1px;
}

.app-container.d-purchase-agg-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-purchase-agg-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.d-purchase-agg-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.d-purchase-agg-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 与科室申领：抵消页面主体内边距，遮罩与白底与列表同宽 */
.app-container.d-purchase-agg-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* 弹窗打开时，隐藏底层分页/横向滚动区域，避免半透明遮罩下透出“蓝色条” */
.app-container.d-purchase-agg-page.is-modal-open .pagination-bottom-wrap {
  display: none;
}
</style>

