<template>
  <div class="app-container departmentTransfer-apply-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="transferBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.transferBillNo"
                placeholder="单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item prop="outDepartmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.outDepartmentId"/>
              </div>
            </el-form-item>
            <el-form-item prop="inDepartmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.inDepartmentId" />
              </div>
            </el-form-item>
            <el-form-item prop="transferBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.transferBillStatus" placeholder="单据状态"
                         :disabled="false"
                         clearable
                         style="width: 180px">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
                           :key="dict.value"
                           :label="dict.label"
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
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['departmentTransfer:apply:export']"
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

    <el-table v-loading="loading" :data="transferList" :row-class-name="rowTransferIndex" @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe class="table-compact">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="transferBillNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.transferBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调出科室" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.outDepartment && scope.row.outDepartment.name) || (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调入科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable />
      <el-table-column label="申请状态" align="center" prop="transferBillStatus" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.transferBillStatus"/>
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.transferBillStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['departmentTransfer:apply:edit']"
              v-if="scope.row.transferBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['departmentTransfer:apply:remove']"
              v-if="scope.row.transferBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改转科申请对话框 -->
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
                    <el-form-item label="单号" prop="transferBillNo">
                      <el-input v-model="form.transferBillNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="转科状态" prop="transferBillStatus">
                      <el-select v-model="form.transferBillStatus" placeholder="请选择转科状态"
                                 :disabled="true"
                                 clearable>
                        <el-option v-for="dict in dict.type.biz_status"
                                   :key="dict.value"
                                   :label="dict.label"
                                   :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="调出科室" prop="outDepartmentId" class="transfer-dept-label-item">
                      <SelectDepartment v-model="form.outDepartmentId" :value2="transferDeptSelectDisabled"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="调入科室" prop="inDepartmentId" class="transfer-dept-label-item">
                      <SelectDepartment v-model="form.inDepartmentId" :value2="transferDeptSelectDisabled"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="申请日期" prop="transferBillDate">
                      <el-date-picker clearable
                                      v-model="form.transferBillDate"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      style="width: 100%"
                                      placeholder="请选择申请日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="操作人" prop="userId">
                      <SelectUser v-model="form.userId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
                <el-row :gutter="10" class="detail-toolbar-row">
                  <el-col :span="1.5">
                    <span>转科申请明细信息</span>
                  </el-col>
                  <div v-show="action">
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteTransferEntry">删除</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
                    </el-col>
                  </div>
                </el-row>
                <div class="table-wrapper">
              <el-table :data="transferEntryList" :row-class-name="rowTransferEntryIndex"
                        @selection-change="handleTransferEntrySelectionChange" ref="transferEntry"
                        border
                        :summary-method="getSummaries" show-summary
                        :height="detailTableHeight">
                <el-table-column type="selection" width="50" align="center" resizable />
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
                    <el-input clearable v-model="scope.row.qty" placeholder="数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @blur="form.result=$event.target.value"
                              @input="qtyChange(scope.row)"
                    />
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
                    <el-input v-model="scope.row.remark" placeholder="备注" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right">
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

    <!-- 使用科室库存选择组件 -->
    <SelectDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

  </div>
</template>

<script>
import { listDepartmentTransfer, getDepartmentTransfer, delDepartmentTransfer, addDepartmentTransfer, updateDepartmentTransfer } from "@/api/department/departmentTransfer";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import { buildDefaultDateRange } from '@/utils/defaultDateRange';

export default {
  name: "departmentTransfer",
  dicts: ['biz_status','way_status'],
  components: {SelectDepartment,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedTransferEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 转科申请表格数据
      transferList: [],
      selectRow: [],
      // 转科申请明细表格数据
      transferEntryList: [],
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
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
        transferBillNo: null,
        ...buildDefaultDateRange(),
        outDepartmentId: null,
        inDepartmentId: null,
        userId: null,
        transferBillStatus: null,
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        outDepartmentId: [
          { required: true, message: "调出科室不能为空", trigger: "blur" }
        ],
        inDepartmentId: [
          { required: true, message: "调入科室不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    /** 已有明细（含已保存的耗材行）时禁止改调出/调入科室；查看模式始终禁用 */
    transferDeptSelectDisabled() {
      if (!this.action) {
        return true;
      }
      const list = this.transferEntryList || [];
      return list.some(row => row && (row.materialId != null || (row.material && row.material.id)));
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询转科申请列表 */
    getList() {
      this.loading = true;
      // 字段映射：outDepartmentId -> warehouseId, inDepartmentId -> departmentId
      const params = {
        ...this.queryParams,
        warehouseId: this.queryParams.outDepartmentId,
        departmentId: this.queryParams.inDepartmentId,
        applyBillNo: this.queryParams.transferBillNo,
        applyBillStatus: this.queryParams.transferBillStatus,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      };
      listDepartmentTransfer(params).then(response => {
        // 字段映射：applyBillNo -> transferBillNo, warehouseId -> outDepartmentId, departmentId -> inDepartmentId
        this.transferList = (response.rows || []).map(item => ({
          ...item,
          transferBillNo: item.applyBillNo,
          transferBillStatus: item.applyBillStatus
        }));
        this.total = response.total;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.outDepartmentId) {
        this.$message({ message: '请先选择调出科室', type: 'warning' })
        return
      }
      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.departmentValue = this.form.outDepartmentId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        this.transferEntryList.splice(this.transferEntryList.length, 0, JSON.parse(JSON.stringify(item)));
      });
      this.calculateTotals();
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
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        transferBillDate: null,
        outDepartmentId: null,
        inDepartmentId: null,
        userId: null,
        transferBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.transferEntryList = [];
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.transferEntryList.forEach(item => {
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
        if (index === 0) {
          sums[index] = '';
          return;
        }
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
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.calculateTotals();
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
      this.calculateTotals();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      Object.assign(this.queryParams, buildDefaultDateRange());
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
      getDepartmentTransfer(id).then(response => {
        // 字段映射：warehouseId -> outDepartmentId, departmentId -> inDepartmentId
        this.form = {
          ...response.data,
          outDepartmentId: response.data.warehouseId,
          inDepartmentId: response.data.departmentId,
          transferBillNo: response.data.applyBillNo,
          transferBillStatus: response.data.applyBillStatus,
          transferBillDate: response.data.applyBillDate
        };
        this.transferEntryList = response.data.basApplyEntryList || response.data.transferEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.applyBillStatus == 1){
          this.form.transferBillStatus = '1';
        }else{
          this.form.transferBillStatus = '2';
        }

        this.title = "查看转科申请";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.transferBillStatus = '1';
      this.form.transferBillDate = this.getBillDate();
      this.title = "添加转科申请";
      this.action = true;
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getDepartmentTransfer(id).then(response => {
        // 字段映射：warehouseId -> outDepartmentId, departmentId -> inDepartmentId
        this.form = {
          ...response.data,
          outDepartmentId: response.data.warehouseId,
          inDepartmentId: response.data.departmentId,
          transferBillNo: response.data.applyBillNo,
          transferBillStatus: response.data.applyBillStatus,
          transferBillDate: response.data.applyBillDate
        };
        this.transferEntryList = response.data.basApplyEntryList || response.data.transferEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.transferBillStatus = '1';
        this.title = "修改转科申请";
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证调出科室是否选择
      if (!this.form.outDepartmentId) {
        this.$modal.msgError("请先选择调出科室");
        return;
      }
      // 验证调入科室是否选择
      if (!this.form.inDepartmentId) {
        this.$modal.msgError("请先选择调入科室");
        return;
      }
      // 验证明细是否添加
      if (!this.transferEntryList || this.transferEntryList.length === 0) {
        this.$modal.msgError("请添加明细！");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 字段映射：outDepartmentId -> warehouseId, inDepartmentId -> departmentId
          const submitData = {
            ...this.form,
            warehouseId: this.form.outDepartmentId,
            departmentId: this.form.inDepartmentId,
            applyBillNo: this.form.transferBillNo,
            applyBillStatus: this.form.transferBillStatus,
            applyBillDate: this.form.transferBillDate,
            basApplyEntryList: this.transferEntryList
          };
          var totalAmt = 0;
          this.transferEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          submitData.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateDepartmentTransfer(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDepartmentTransfer(submitData).then(response => {
              this.$modal.msgSuccess("新增成功");
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.applyBillNo) {
                  this.form.transferBillNo = response.data.applyBillNo;
                }
                this.title = "修改转科申请";
              }
              this.open = false;
              this.getList();
            }).catch(error => {
              console.error("新增失败:", error);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const billNo = row.transferBillNo || '';
      this.$modal.confirm('你好！是否确认删除转科申请单，单号"' + billNo + '"的数据项？').then(function() {
        return delDepartmentTransfer(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 转科申请明细序号 */
    rowTransferEntryIndex({ row, rowIndex }) {
    row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    rowTransferIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 转科申请明细删除按钮操作 */
    handleDeleteTransferEntry() {
      if (this.checkedTransferEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的转科申请明细数据");
      } else {
        const transferEntryList = this.transferEntryList;
        const checkedTransferEntry = this.checkedTransferEntry;
        this.transferEntryList = transferEntryList.filter(function(item) {
          return checkedTransferEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.transferEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleTransferEntrySelectionChange(selection) {
      this.checkedTransferEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/transfer/export', {
        ...this.queryParams
      }, `transfer_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗：与到货验收 inWarehouse/audit 弹窗一致 */
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

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
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
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
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

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
}

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  /* 仅由表体 .el-table__body-wrapper 承担横向滚动，避免与合计行下方再出现一条重复滚动条 */
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
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
}

/* 调出/调入科室：标签红色且不显示必填星号（Element 表单项 DOM 在子组件内，需 ::v-deep 穿透 scoped） */
.local-modal-content .transfer-dept-label-item.is-required ::v-deep .el-form-item__label::before,
.local-modal-content .transfer-dept-label-item.is-required ::v-deep .el-form-item__label:before {
  display: none !important;
  content: '' !important;
  margin-right: 0 !important;
}

.local-modal-content .transfer-dept-label-item ::v-deep .el-form-item__label {
  color: #f56c6c !important;
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

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
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

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__cell {
  white-space: nowrap !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .cell {
  white-space: nowrap !important;
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

/* 列表查询区（非弹窗） */
.query-item-inline {
  display: inline-block;
  margin-right: 16px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
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

::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

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

::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed {
  position: absolute !important;
}

::v-deep .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

::v-deep .el-table.table-compact {
  overflow-x: auto;
}
</style>

<style>
/* 转科申请：与「到货验收」一致的搜索区 + 主表 + 翻页常驻（非 scoped） */
.app-container.departmentTransfer-apply-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* 搜索白卡：与科室申领 dApply 一致（内边距 16×20、行间 8px） */
.app-container.departmentTransfer-apply-page > .el-form.query-form {
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

.app-container.departmentTransfer-apply-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.departmentTransfer-apply-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.departmentTransfer-apply-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.departmentTransfer-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

/* 弹窗遮罩与列表区左右 padding 对齐（与到货验收一致） */
.app-container.departmentTransfer-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
}

/* 弹窗内调出/调入科室标签（非 scoped，确保覆盖 Element 默认样式） */
.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item.is-required .el-form-item__label::before,
.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item.is-required .el-form-item__label:before {
  display: none !important;
  content: none !important;
  margin-right: 0 !important;
}

.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item .el-form-item__label {
  color: #f56c6c !important;
}
</style>

