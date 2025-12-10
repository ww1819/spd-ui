<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="计划单号" prop="planNo" class="query-item-inline">
            <el-input v-model="queryParams.planNo"
                      placeholder="请输入计划单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
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
          <el-form-item label="单据状态" prop="planStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.planStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="small"
          @click="handleBatchAudit"
          :disabled="multiple"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              :row-class-name="warehouseListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" 
              height="58vh" 
              border
              style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" width="200" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <div v-if="scope.row.auditOpinion && scope.row.auditOpinion.trim()">
            {{ scope.row.auditOpinion }}
          </div>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="planDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.planDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right" resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >查看</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-check"
            @click="handleAudit(scope.row)"
            v-if="scope.row.planStatus == '1' || scope.row.planStatus == 1"
          >审核</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
      class="table-pagination"
    />

    <!-- 审核意见对话框 -->
    <el-dialog
      title="审核意见"
      :visible.sync="auditDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="计划单号">
          <el-input v-model="auditForm.planNo" :disabled="true" />
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.auditOpinion"
            type="textarea"
            placeholder="请输入审核意见"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 添加或修改计划对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="单号" prop="planNo">
                    <el-input v-model="form.planNo" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <el-input :value="form.warehouse && form.warehouse.name" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item prop="planDate">
                    <template slot="label">
                      <span style="white-space: nowrap;">制单日期</span>
                    </template>
                    <el-date-picker clearable
                                    v-model="form.planDate"
                                    type="date"
                                    :disabled="true"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择制单日期"
                                    style="width: 100%">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="操作人" prop="createBy">
                    <el-input :value="operatorName" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="联系电话" prop="telephone">
                    <el-input v-model="form.telephone" :disabled="true" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="采购员" prop="proPerson">
                    <SelectUser v-model="form.proPerson" v-if="action"/>
                    <el-input :value="purchaserName" :disabled="true" v-else/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="总金额" prop="totalAmount">
                    <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>计划明细信息</span>
                </el-col>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="stkIoBillEntryList"
                          show-summary :summary-method="getSummaries"
                          border
                          height="48vh"
                >
          <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable />
                </el-table>
              </div>
            </el-form>
            <div class="modal-footer">
              <el-button @click="cancel">关 闭</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>


  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan, auditPurchasePlan } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';

export default {
  name: "PurchasePlanAudit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectWarehouse,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
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
      // 用户选项列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示（审核页面只读）
      action: false,
      // 审核意见弹窗
      auditDialogVisible: false,
      auditForm: {
        planNo: '',
        auditOpinion: ''
      },
      currentAuditRow: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: '1', // 默认查询未提交状态（已提交但未审核）
        proPerson: null,
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
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
    this.getUserList();
  },
  computed: {
    // 操作人姓名
    operatorName() {
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.createBy) {
        const user = this.userOptions.find(u => u.userName === this.form.createBy || u.userId === this.form.createBy);
        return user ? user.nickName || user.userName : this.form.createBy;
      }
      return '';
    },
    // 采购员姓名
    purchaserName() {
      if (this.form.proPerson) {
        const user = this.userOptions.find(u => u.userId === this.form.proPerson || u.userId === String(this.form.proPerson));
        return user ? user.nickName || user.userName : '';
      }
      return '';
    }
  },
  methods: {
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
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }

        // 只对数量、金额列进行汇总，使用列属性名判断（价格列不汇总）
        if (column.property === 'qty' || column.property === 'amt') {
          const values = data.map(item => {
            const value = item[column.property];
            return isNaN(Number(value)) ? 0 : Number(value);
          });

          if (values.length > 0) {
            sums[index] = values.reduce((prev, curr) => prev + curr, 0).toFixed(2);
          } else {
            sums[index] = '0.00';
          }

          // 更新总金额
          if (column.property === 'amt') {
            this.form.totalAmount = sums[index];
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
        }
      });
      return sums;
    },
    /** 查询计划列表 */
    getList() {
      this.loading = true;
      listPurchasePlan(this.queryParams).then(response => {
        this.warehouseList = response.rows || [];
        this.total = response.total;
        this.loading = false;
      });
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
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
        auditBy: null,
        auditDate: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
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
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.planStatus = '1'; // 重置后保持未提交状态（已提交但未审核）
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
      const id = row.id
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.purchasePlanEntryList;
        this.open = true;
        this.action = false;
        this.title = "查看计划";
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.currentAuditRow = row;
      this.auditForm.planNo = row.planNo;
      this.auditForm.auditOpinion = '同意';
      this.auditDialogVisible = true;
    },
    /** 提交审核 */
    submitAudit() {
      if (!this.currentAuditRow) {
        return;
      }
      const id = this.currentAuditRow.id;
      const auditBy = this.$store.state.user.userId;
      const auditOpinion = this.auditForm.auditOpinion || '';

      auditPurchasePlan({id: id, auditBy: auditBy, auditOpinion: auditOpinion}).then(() => {
        this.auditDialogVisible = false;
        this.getList();
        this.$modal.msgSuccess("审核成功！");
        this.currentAuditRow = null;
        this.auditForm.planNo = '';
        this.auditForm.auditOpinion = '';
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的计划！");
        return;
      }

      // 检查选中的计划是否都是未提交状态（状态值1）
      const selectedPlans = this.warehouseList.filter(item => this.ids.includes(item.id));
      const nonPendingPlans = selectedPlans.filter(item => item.planStatus !== '1' && item.planStatus !== 1);

      if (nonPendingPlans.length > 0) {
        const statusInfo = nonPendingPlans.map(plan => `${plan.planNo}(状态:${plan.planStatus})`).join(', ');
        this.$modal.msgError(`只能审核未提交状态的计划！以下计划状态不正确：${statusInfo}`);
        return;
      }

      // 批量审核也使用弹窗输入审核意见
      const planNos = selectedPlans.map(item => item.planNo).join('、');
      this.currentAuditRow = { id: null, planNo: planNos, isBatch: true };
      this.auditForm.planNo = `批量审核（${this.ids.length}个计划）`;
      this.auditForm.auditOpinion = '同意';
      this.auditDialogVisible = true;
    },
    /** 提交审核 */
    submitAudit() {
      if (!this.currentAuditRow) {
        return;
      }
      // 获取当前登录用户的姓名（优先使用nickName，否则使用userName）
      const currentUser = this.$store.state.user;
      const auditBy = currentUser.nickName || currentUser.userName || currentUser.userId;
      const auditOpinion = this.auditForm.auditOpinion || '';

      if (this.currentAuditRow.isBatch) {
        // 批量审核
        const auditPromises = this.ids.map(id => auditPurchasePlan({id: id, auditBy: auditBy, auditOpinion: auditOpinion}));
        
        Promise.all(auditPromises).then(() => {
          this.auditDialogVisible = false;
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个计划");
          this.currentAuditRow = null;
          this.auditForm.planNo = '';
          this.auditForm.auditOpinion = '';
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      } else {
        // 单个审核
        const id = this.currentAuditRow.id;
        auditPurchasePlan({id: id, auditBy: auditBy, auditOpinion: auditOpinion}).then(() => {
          this.auditDialogVisible = false;
          this.getList();
          this.$modal.msgSuccess("审核成功！");
          this.currentAuditRow = null;
          this.auditForm.planNo = '';
          this.auditForm.auditOpinion = '';
        }).catch(() => {});
      }
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/jihua/export', {
        ...this.queryParams
      }, `purchase_plan_${new Date().getTime()}.xlsx`)
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
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
.local-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
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
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
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

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
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

  /* 表格样式优化 */
  .el-table {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  /* 确保表格滚动条正常显示 */
  .el-table__body-wrapper {
    overflow-x: auto;
    overflow-y: auto;
  }

  .el-table__header-wrapper {
    overflow-x: auto;
  }

  .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
  }

  .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }

  .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
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
    margin-bottom: 10px;
    display: flex;
    flex-wrap: nowrap;
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
  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
  .local-modal-content .el-table::-webkit-scrollbar,
  .local-modal-content .table-wrapper::-webkit-scrollbar {
    width: 10px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
  .local-modal-content .el-table::-webkit-scrollbar-track,
  .local-modal-content .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
  .local-modal-content .el-table::-webkit-scrollbar-thumb,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  .local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }
</style>
