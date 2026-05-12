<template>
  <div class="app-container d-apply-audit-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="applyBillNo" class="query-item-inline">
            <el-input
              v-model="queryParams.applyBillNo"
              placeholder="单号"
              clearable
              style="width: 180px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
          <el-form-item prop="departmentId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectDepartment v-model="queryParams.departmentId" />
            </div>
          </el-form-item>
          <el-form-item prop="applyBillStatus" class="query-item-inline">
            <el-select v-model="queryParams.applyBillStatus" placeholder="状态"
                       clearable
                       style="width: 180px">
              <el-option label="未审核" :value="1" />
              <el-option label="已审核" :value="2" />
              <el-option label="已驳回" :value="3" />
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
          @click="handleExport"
          v-hasPermi="['department:dApplyAudit:export']"
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

    <el-table v-loading="loading" :data="applyList" :row-class-name="rowApplyIndex" @selection-change="handleSelectionChange" height="64vh" border stripe>
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
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.creater && scope.row.creater.nickName) || scope.row.createrNmae || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-tag v-if="getApplyStatusValue(scope.row) === 3 || getApplyStatusValue(scope.row) === '3'" type="danger" size="small">已驳回</el-tag>
          <dict-tag v-else :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.auditPerson && scope.row.auditPerson.nickName) || scope.row.auditPersonName || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="getApplyStatusValue(scope.row) === 3 || getApplyStatusValue(scope.row) === '3'">{{ scope.row.rejectReason || '--' }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="310" fixed="right">
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

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改科室申领对话框 -->
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
              <!-- 表头信息：两行四列（第4列预留空位，避免布局跳动） -->
              <el-row :gutter="8">
                <el-col :span="6">
                  <el-form-item label="单号" prop="applyBillNo">
                    <el-input v-model="form.applyBillNo" :disabled="true" />
                  </el-form-item>
                </el-col>
                <!-- 科室放到申领状态左边 -->
                <el-col :span="6">
                  <el-form-item label="科室" prop="departmentId">
                    <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="申领状态" prop="billStatus">
                    <span v-if="detailApplyStatusValue === 3 || detailApplyStatusValue === '3'" class="status-text status-rejected">已驳回</span>
                    <dict-tag v-else :options="dict.type.biz_status" :value="detailApplyStatusValue"/>
                  </el-form-item>
                </el-col>
                <el-col :span="6" />
              </el-row>
              <el-row :gutter="8">
                <el-col :span="6">
                  <el-form-item label="申请日期" prop="applyBillDate">
                    <el-date-picker
                      clearable
                      v-model="form.applyBillDate"
                      type="date"
                      style="width: 100%"
                      value-format="yyyy-MM-dd"
                      :disabled="true"
                      placeholder="请选择申请日期"
                    />
                  </el-form-item>
                </el-col>

                <el-col :span="6">
                  <el-form-item label="操作人" prop="userId">
                    <SelectUser v-model="form.userId" :disabled="true"/>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" placeholder="备注" :disabled="true" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="6" />
              </el-row>
              <!-- 驳回原因：仅单据状态为已驳回时展示 -->
              <el-row :gutter="8" v-if="isDetailRejected">
                <el-col :span="24">
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

              <div class="modal-detail-section">
<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="24">
                  <div class="detail-header-row">
                    <span class="detail-header-title">科室申领明细信息</span>
                    <el-button
                      v-if="isDetailUnAuditAndNotRejected"
                      type="primary"
                      icon="el-icon-check"
                      size="small"
                      @click="handleAuditSubmit"
                    >审 核</el-button>
                  </div>
                </el-col>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" ref="basApplyEntry" :height="detailTableHeight" border :summary-method="getSummaries" show-summary @selection-change="handleBasApplyEntrySelectionChange">
                <el-table-column type="selection" width="55" align="center" fixed="left" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="仓库" align="center" width="120" min-width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || '—' }}</span>
                  </template>
                </el-table-column>
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
              <!-- 审核操作按钮（底部仅在审核模式下显示取消、驳回；审核按钮已移动到“科室申领明细信息”标题后面） -->
              <div class="modal-footer" v-if="dialogMode === 'audit' && isDetailUnAuditAndNotRejected">
                <el-button @click="cancel">取 消</el-button>
                <el-button type="danger" @click="handleRejectSubmit">驳 回</el-button>
              </div>
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
      // 弹窗内明细表勾选
      basApplyEntrySelection: [],
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
    /** 与科室申领 dApply 弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(300px, calc(100vh - 320px))';
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
      this.basApplyEntrySelection = [];
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
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        if (column.property === 'index') {
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
    fmtQty(v) {
      if (v === null || v === undefined || v === '') {
        return '—';
      }
      return v;
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
    /** 弹窗内明细表勾选 */
    handleBasApplyEntrySelectionChange(selection) {
      this.basApplyEntrySelection = selection || [];
    },
    /** 查看按钮操作 */
    handleView(row){
      this.dialogMode = 'view';
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
        });

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
    rowApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/apply/export', {
        ...this.queryParams,
        exportBillIds: String(row.id)
      }, `applyAudit_${row.applyBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    handleExport() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先勾选要导出的单据')
        return
      }
      const params = { ...this.queryParams };
      params.billType = 1; // 只导出申领单类型
      // 如果applyBillStatus为null，则不传该参数，导出全部状态
      if (params.applyBillStatus === null || params.applyBillStatus === '') {
        delete params.applyBillStatus;
      }
      params.exportBillIds = this.ids.join(',')
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
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  /* 弹窗整体再矮一点（宽度不变），并再往上移动一点 */
  padding: 0 0 64px;
  box-sizing: border-box;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
  /* 隐藏最右侧滚动条（仅隐藏，不影响明细区滚动） */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.local-modal-content::-webkit-scrollbar {
  width: 0;
  height: 0;
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

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

/* 弹窗内顶部字段区：与到货验收一致 */
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

/* 驳回原因：单行输入，与弹窗内其它 el-input 宽度一致 */
.local-modal-content .modal-form-compact .form-item-reject-reason .el-form-item__content {
  margin-left: 0 !important;
  max-width: none;
}

.local-modal-content .modal-form-compact .form-item-reject-reason .el-input {
  width: 100%;
  max-width: 420px;
}

/* 弹窗内明细区 */
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

/* 明细区：外层不出纵向滚动条，仅表体滚动，表头与合计行固定、左右滚动与表体同步 */
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

::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
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

.app-container {
  position: relative;
}

/* 防止表格列自动换行 */
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

/* 搜索区域：与科室申领 dApply 列表页一致（顶层 el-form 白底、边框与阴影） */
.app-container.d-apply-audit-page > .el-form.query-form {
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

.app-container.d-apply-audit-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.d-apply-audit-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-apply-audit-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
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

.query-row-second {
  position: relative;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.d-apply-audit-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 按钮行：与科室申领一致 */
.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页：贴近表格；下方不留白（与科室申领 dApply 一致） */
.d-apply-audit-page .pagination-bottom-wrap {
  margin-top: 0 !important;
  margin-bottom: 0;
  padding-bottom: 0;
  transform: translateY(-8px);
}

::v-deep .d-apply-audit-page .pagination-bottom-wrap .pagination-container {
  padding: 0 !important;
}

/* 仅列表主表（勿作用于弹窗内表，避免白屏修复后仍出现整页/弹窗双横向条） */
::v-deep .d-apply-audit-page > .el-table .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .d-apply-audit-page > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .d-apply-audit-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
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

::v-deep .d-apply-audit-page > .el-table {
  overflow-x: auto;
}

</style>

<style>
/* 与到货验收 inWarehouse-audit-page 非 scoped 块保持一致（避免多出的 overflow/max-width 等影响首屏负 margin 表现） */
.app-container.d-apply-audit-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.d-apply-audit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.d-apply-audit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.d-apply-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* 主表与翻页间距、表头：与科室申领列表一致 */
.app-container.d-apply-audit-page > .el-table {
  margin-bottom: 1px;
}

.app-container.d-apply-audit-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-apply-audit-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}
</style>
