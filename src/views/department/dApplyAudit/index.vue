<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="applyBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.applyBillNo"
                placeholder="请输入单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId"/>
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="状态" prop="applyBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.applyBillStatus" placeholder="全部"
                         clearable
                         style="width: 180px">
                <el-option label="全部" :value="null" />
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
                <el-option label="已驳回" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="12">
            <el-form-item label="日期" style="display: flex; align-items: center;">
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
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:dApplyAudit:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="applyList" :row-class-name="rowApplyIndex" @selection-change="handleSelectionChange" height="54vh" border>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="applyBillNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable />
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-tag v-if="getApplyStatusValue(scope.row) === 3 || getApplyStatusValue(scope.row) === '3'" type="danger" size="small">已驳回</el-tag>
          <dict-tag v-else :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-check"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:dApplyAudit:audit']"
              v-if="canShowAuditReject(scope.row)"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-close"
              @click="handleReject(scope.row)"
              v-hasPermi="['department:dApplyAudit:reject']"
              v-if="canShowAuditReject(scope.row)"
              style="padding: 0 5px; margin: 0; color: #F56C6C;"
            >驳回</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改科室申领对话框 -->
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
                  <el-form-item label="单号" prop="applyBillNo" label-width="100px">
                    <el-input v-model="form.applyBillNo" :disabled="true" style="width: 150px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申领状态" prop="billStatus" label-width="100px">
                    <span v-if="form.applyBillStatus === 3 || form.applyBillStatus === '3'" class="status-text status-rejected">已驳回</span>
                    <el-select v-else v-model="form.applyBillStatus" placeholder="请选择申领状态"
                               :disabled="true"
                               clearable style="width: 150px">
                      <el-option v-for="dict in dict.type.biz_status"
                                 :key="dict.value"
                                 :label="dict.label"
                                 :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="form.applyBillDate"
                                    type="date"
                                    style="width: 150px"
                                    value-format="yyyy-MM-dd"
                                    :disabled="true"
                                    placeholder="请选择申请日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="操作人" prop="userId" label-width="100px">
                    <SelectUser v-model="form.userId" :disabled="true"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="备注" prop="remark" label-width="100px">
                    <el-input v-model="form.remark" placeholder="请输入备注" style="width: 150px" :disabled="true" />
                  </el-form-item>
                </el-col>
                <!-- 驳回原因：与备注同一行，仅未审核且未驳回时显示可编辑 -->
                <el-col :span="4" v-if="isDetailUnAuditAndNotRejected">
                  <el-form-item label="驳回原因" prop="rejectReason" label-width="100px">
                    <el-input
                      v-model="form.rejectReason"
                      placeholder="请输入驳回原因"
                      style="width: 150px"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
              <el-row :gutter="10" class="mb8">
                <el-col :span="24">
                  <div class="detail-header-row">
                    <span class="detail-header-title">科室申领明细信息</span>
                    <el-button
                      v-if="isDetailUnAuditAndNotRejected"
                      type="primary"
                      size="medium"
                      @click="handleAuditSubmit"
                    >审 核</el-button>
                  </div>
                </el-col>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" ref="basApplyEntry" height="100%" border :summary-method="getSummaries" show-summary>
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt || '--' }}</span>
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
              <!-- 审核操作按钮（底部仅在审核模式下显示取消、驳回；审核按钮已移动到“科室申领明细信息”标题后面） -->
              <div class="modal-footer" v-if="dialogMode === 'audit' && isDetailUnAuditAndNotRejected">
                <el-button @click="cancel">取 消</el-button>
                <el-button type="danger" @click="handleRejectSubmit">驳 回</el-button>
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
        <el-button @click="rejectDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmRejectDialog">确 定</el-button>
      </span>
    </el-dialog>


  </div>
</template>

<script>
import { listApplyAudit, getApplyAudit, auditApply, rejectApply } from "@/api/department/applyAudit";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

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
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 科室申领表格数据
      applyList: [],
      // 科室申领明细表格数据
      basApplyEntryList: [],
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
        beginDate: null,
        endDate: null,
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
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 详情弹窗内：仅未审核且未驳回时显示审核按钮、驳回原因输入、底部取消/驳回 */
    isDetailUnAuditAndNotRejected() {
      if (this.form.applyBillStatus != 1) return false;
      if (this.form.rejectReason != null && String(this.form.rejectReason).trim() !== '') return false;
      return true;
    }
  },
  created() {
    this.getList();
  },
  methods: {
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
        // 前端二次过滤：确保只显示SL开头的单号，排除ZK开头的转科申请
        if (response.rows && response.rows.length > 0) {
          this.applyList = response.rows.filter(item => {
            const billNo = item.applyBillNo || '';
            // 只保留SL开头的申领单，排除ZK开头的转科申请
            return billNo.toUpperCase().startsWith('SL') && (item.billType === 1 || item.billType == null);
          });
          this.total = this.applyList.length;
        } else {
          this.applyList = [];
          this.total = 0;
        }
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
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 1) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.applyBillStatus = null; // 重置后显示全部状态
      this.queryParams.billType = 1; // 重置后仍只查询申领单类型
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      this.dialogMode = 'view';
      const id = row.id
      getApplyAudit(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList || [];
        this.open = true;
        this.calculateTotals();

        // 保持与后端一致的状态值（1=未审核，2=已审核，3=已驳回）
        this.form.applyBillStatus = response.data.applyBillStatus;

        this.title = "申领单审核";
      });
    },
    /** 审核按钮操作（表格中） */
    handleAudit(row) {
      this.dialogMode = 'audit';
      this.handleView(row);
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
    /** 审核提交 */
    handleAuditSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要审核的申领单");
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
    /** 驳回提交（大弹窗内按钮，兼容保留） */
    handleRejectSubmit() {
      if (!this.form.id) {
        this.$modal.msgError("请先选择要驳回的申领单");
        return;
      }
      if (!this.form.rejectReason || this.form.rejectReason.trim() === '') {
        this.$modal.msgError("请填写驳回原因");
        return;
      }
      const userId = this.$store.state.user.userId;
      rejectApply({
        id: String(this.form.id),
        rejectReason: this.form.rejectReason,
        auditBy: userId
      }).then(() => {
        this.$modal.msgSuccess("驳回成功");
        this.open = false;
        this.getList();
      });
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
        this.getList();
      });
    },
	/** 科室申领明细序号 */
    rowBasApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    rowApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = { ...this.queryParams };
      params.billType = 1; // 只导出申领单类型
      // 如果applyBillStatus为null，则不传该参数，导出全部状态
      if (params.applyBillStatus === null || params.applyBillStatus === '') {
        delete params.applyBillStatus;
      }
      this.download('department/apply/export', {
        ...params
      }, `applyAudit_${new Date().getTime()}.xlsx`)
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
  overflow: hidden;
  display: flex;
  min-height: 95vh !important;
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
  padding: 24px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.local-modal-content .form-fields-container {
  flex-shrink: 0;
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

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 防止表格列自动换行 */
::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
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

/* 搜索条件容器样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

/* 弹窗内表单字段容器 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
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

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 确保表格可以水平滚动和垂直滚动 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 增大底部滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
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

/* 确保表格可以水平滚动 */
::v-deep .el-table {
  overflow-x: auto;
}

/* 确保明细表格可以水平滚动 */
::v-deep .local-modal-content .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}
</style>
