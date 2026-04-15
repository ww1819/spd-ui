<template>
  <div class="app-container d-purchase-audit-page" :class="{ 'is-modal-open': open }">
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
              <el-select v-model="queryParams.purchaseBillStatus" placeholder="状态"
                         clearable
                         style="width: 180px">
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
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
          @click="handleBatchAudit"
          v-hasPermi="['department:purchaseAudit:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleToolbarReject"
          v-hasPermi="['department:purchaseAudit:reject']"
        >驳回</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:purchaseAudit:export']"
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
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="制单人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>
            {{ (scope.row.user && (scope.row.user.nickName || scope.row.user.name || scope.row.user.userName))
               || scope.row.userName
               || '--' }}
          </span>
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
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.rejectReason || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220" fixed="right">
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

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
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
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
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
                  <el-col :span="8">
                    <div class="modal-form-right-col">
                      <el-form-item label="备注" prop="remark" class="form-item-remark">
                        <el-input v-model="form.remark" placeholder="备注" :disabled="true" />
                      </el-form-item>
                      <el-form-item
                        v-if="form.purchaseBillStatus == 1 || form.purchaseBillStatus === '1'"
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
                    </div>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="24">
                  <div class="detail-header-row">
                    <span class="detail-header-title">科室申购明细信息</span>
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
              <el-table :data="depPurchaseApplyEntryList" :row-class-name="rowDepPurchaseApplyEntryIndex" ref="depPurchaseApplyEntry" :height="detailTableHeight" border :summary-method="getPurchaseSummaries" show-summary>
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
import { listPurchaseAudit, getPurchaseAudit, auditPurchase, rejectPurchase } from "@/api/department/purchaseAudit";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

export default {
  name: "dPurchaseAudit",
  dicts: ['purchase_status', 'urgency_level'],
  components: {SelectWarehouse, SelectDepartment, SelectUser},
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
  computed: {
    /** 明细表固定高度：表体滚动，合计固定在表格最底部 */
    detailTableHeight() {
      return 'max(300px, calc(100vh - 320px))';
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询申购单列表（支持全部、未审核、已审核） */
    getList() {
      this.loading = true;
      // applyBillStatus根据用户选择：null=全部，1=未审核，2=已审核
      const params = { ...this.queryParams };
      // 如果purchaseBillStatus为null，则不传该参数，查询全部状态
      if (params.purchaseBillStatus === null || params.purchaseBillStatus === '') {
        delete params.purchaseBillStatus;
      }
      listPurchaseAudit(params).then(response => {
        this.purchaseList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
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
      this.depPurchaseApplyEntryList = [];
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
      this.queryParams.purchaseBillStatus = null; // 重置后显示全部状态
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.selectedRows = selection;
    },
    /** 科室申购序号 */
    rowPurchaseIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchaseAudit(id).then(response => {
        this.form = response.data;
        this.depPurchaseApplyEntryList = response.data.depPurchaseApplyEntryList || [];
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
      const list = this.depPurchaseApplyEntryList || [];
      const invalidQty = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
      if (invalidQty.length > 0) {
        this.$modal.msgError("存在明细数量为空或0，不允许审核。请先修正数量后再审核。");
        return;
      }
      const userId = this.$store.state.user.userId;
      auditPurchase({
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
      rejectPurchase({
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
          getPurchaseAudit(row.id).then(resp => {
            const list = resp.data.depPurchaseApplyEntryList || [];
            const invalid = list.filter(e => e.materialId && (e.qty == null || e.qty === '' || Number(e.qty) <= 0));
            if (invalid.length > 0) {
              return Promise.reject(new Error((resp.data.purchaseBillNo || row.id) + '：存在明细数量为空或0，不允许审核。'));
            }
            return Promise.resolve();
          })
        );
        Promise.all(validatePromises).then(() => {
          const requests = pendingList.map(row =>
            auditPurchase({ id: String(row.id), auditBy: userId })
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
        if (index === 0) {
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
    /** 科室申购明细序号 */
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
      this.download('department/purchase/export', {
        ...this.queryParams,
        exportBillIds: String(row.id)
      }, `purchaseAudit_${row.purchaseBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    handleExport() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先勾选要导出的单据')
        return
      }
      const params = { ...this.queryParams };
      // 如果purchaseBillStatus为null，则不传该参数，导出全部状态
      if (params.purchaseBillStatus === null || params.purchaseBillStatus === '') {
        delete params.purchaseBillStatus;
      }
      params.exportBillIds = this.ids.join(',')
      this.download('department/purchase/export', {
        ...params
      }, `purchaseAudit_${new Date().getTime()}.xlsx`)
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
  max-width: 260px;
}

.modal-form-right-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal-form-right-col .el-form-item {
  margin-bottom: 0;
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
.app-container.d-purchase-audit-page > .el-form.query-form {
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

.app-container.d-purchase-audit-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.d-purchase-audit-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-purchase-audit-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-row-second {
  position: relative;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.d-purchase-audit-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页：贴近表格；下方不留白（与科室申购列表一致） */
.d-purchase-audit-page .pagination-bottom-wrap {
  margin-top: 0 !important;
  margin-bottom: 0;
  padding-bottom: 0;
  transform: translateY(-8px);
}

/* 弹窗打开时，隐藏底层分页区域，避免半透明遮罩下透出底部“蓝色条” */
.app-container.d-purchase-audit-page.is-modal-open .pagination-bottom-wrap {
  display: none;
}

::v-deep .d-purchase-audit-page .pagination-bottom-wrap .pagination-container {
  padding: 0 !important;
  margin-top: 0 !important;
}

/* 仅列表主表（勿作用于弹窗内表） */
::v-deep .d-purchase-audit-page > .el-table .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .d-purchase-audit-page > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .d-purchase-audit-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25) !important;
}

::v-deep .d-purchase-audit-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
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

::v-deep .d-purchase-audit-page > .el-table {
  overflow-x: auto;
}
</style>

<style>
/* 与科室申领 d-apply-page 顶部间距一致 */
.app-container.d-purchase-audit-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0 !important;
  /* 确保弹窗遮罩（absolute）能覆盖到底部，避免露出底层条 */
  min-height: calc(100vh - 84px);
}

.app-container.d-purchase-audit-page > .el-table {
  margin-bottom: 1px;
}

.app-container.d-purchase-audit-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-purchase-audit-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.d-purchase-audit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.d-purchase-audit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.d-purchase-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}
</style>
