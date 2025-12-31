<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="请选择单据类型"
                         :disabled="true"
                         clearable
                         style="width: 180px">
                <el-option label="申领单" value="1" />
                <el-option label="申购单" value="2" />
                <el-option label="转科申请单" value="3" />
              </el-select>
            </el-form-item>
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
            <el-form-item label="单据状态" prop="applyBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.applyBillStatus" placeholder="全部"
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
      <el-col :span="6">
        <el-radio-group v-model="currentBillType" @change="handleBillTypeChange" size="small">
          <el-radio-button label="1">申领单</el-radio-button>
          <el-radio-button label="2">申购单</el-radio-button>
          <el-radio-button label="3">转科申请单</el-radio-button>
        </el-radio-group>
      </el-col>
      <el-col :span="1.5" style="margin-left: -10px;">
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
    </el-row>

    <el-table v-loading="loading" :data="applyList" :row-class-name="rowApplyIndex" @selection-change="handleSelectionChange"  height="56vh" border>
<!--      <el-table-column type="selection" width="55" align="center" />-->
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ getBillNo(scope.row) }}</span>
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
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="getTotalAmount(scope.row) && parseFloat(getTotalAmount(scope.row)) > 0">¥{{ parseFloat(getTotalAmount(scope.row)).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="申请状态" align="center" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="getBillStatus(scope.row)"/>
        </template>
      </el-table-column>
      <el-table-column label="单据类型" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ getBillTypeName(scope.row.billType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(getAuditDate(scope.row), '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-if="getBillStatus(scope.row) == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:dApply:edit']"
              v-if="getBillStatus(scope.row) != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:dApply:remove']"
              v-if="getBillStatus(scope.row) != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
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
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="申领状态" prop="billStatus" label-width="100px">
                      <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态"
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
                    <el-form-item label="科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId"/>
                    </el-form-item>
                  </el-col>
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
                      <SelectUser v-model="form.userId"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                      <SelectWarehouse v-model="form.warehouseId"/>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>


<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>科室申领明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
<!--              <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddBasApplyEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteBasApplyEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5" v-show="action">
              <el-button @click="cancel">取 消</el-button>
            </el-col>
            <el-col :span="1.5" v-show="action">
              <el-button type="primary" @click="submitForm">确 定</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" @selection-change="handleBasApplyEntrySelectionChange" ref="basApplyEntry" height="calc(42vh)" border :summary-method="getSummaries" show-summary>
          <el-table-column type="selection" width="60" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
          <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ parseFloat(scope.row.unitPrice).toFixed(2) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt && parseFloat(scope.row.amt) > 0">¥{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
              <span v-else>--</span>
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
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
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
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

  </div>
</template>

<script>
import { listApply, getApply, delApply, addApply, updateApply,auditApply } from "@/api/department/apply";
import { listPurchase, getPurchase, delPurchase, updatePurchase } from "@/api/department/purchase";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import {auditWarehouse, getWarehouse} from "@/api/warehouse/warehouse";

export default {
  name: "dAudit",
  dicts: ['biz_status','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      // 当前单据类型：1-申领单, 2-申购单, 3-转科申请单
      currentBillType: '1',
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedBasApplyEntry: [],
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
      selectRow: [],
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
      //是否显示
      action: true,
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
        applyBillStatus: null,
        billType: null,
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
  watch: {
    currentBillType(newVal) {
      // 当单选按钮组改变时，同步更新queryParams.billType
      this.queryParams.billType = newVal;
    }
  },
  created() {
    // 初始化单据类型，确保queryParams.billType与currentBillType同步
    this.queryParams.billType = this.currentBillType;
    this.getList();
  },
  methods: {
    /** 查询列表（根据当前单据类型） */
    getList() {
      this.loading = true;
      if (this.currentBillType === '1') {
        // 查询申领单
        const params = {
          ...this.queryParams,
          applyBillNo: this.queryParams.applyBillNo,
          applyBillStatus: this.queryParams.applyBillStatus,
        };
        listApply(params).then(response => {
          this.applyList = (response.rows || response.data || []).map(item => ({
            ...item,
            billType: 1
          }));
          this.total = response.total || 0;
          this.loading = false;
        }).catch(() => {
          this.loading = false;
        });
      } else if (this.currentBillType === '2') {
        // 查询申购单
        const params = {
          ...this.queryParams,
          purchaseBillNo: this.queryParams.applyBillNo, // 使用申领单号字段作为申购单号
          purchaseBillStatus: this.queryParams.applyBillStatus, // 使用申请状态字段
        };
        listPurchase(params).then(response => {
          this.applyList = (response.rows || response.data || []).map(item => ({
            ...item,
            billType: 2
          }));
          this.total = response.total || 0;
          this.loading = false;
        }).catch(() => {
          this.loading = false;
        });
      } else if (this.currentBillType === '3') {
        // 转科申请单（暂时使用空数据，等待后端接口）
        this.applyList = [];
        this.total = 0;
        this.loading = false;
        this.$modal.msgWarning("转科申请单功能待开发");
      }
    },
    /** 切换单据类型 */
    handleBillTypeChange(val) {
      // 切换类型时重置查询条件和数据
      this.queryParams.pageNum = 1;
      this.queryParams.billType = val;
      this.applyList = [];
      this.total = 0;
      this.getList();
    },
    nameBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
          this.basApplyEntryList.splice(this.basApplyEntryList.length, 0, JSON.parse(JSON.stringify(item)));
        });
        this.$nextTick(() => {
          this.calculateTotals();
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
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        applyBillDate: null,
        warehouseId: null,
        userId: null,
        applyBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.basApplyEntryList = [];
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
      const id = row.id;
      if (this.currentBillType === '1') {
        // 查看申领单
        getApply(id).then(response => {
          this.form = response.data;
          this.basApplyEntryList = response.data.basApplyEntryList || [];
          this.open = true;
          this.action = false;
          this.$nextTick(() => {
            this.calculateTotals();
          });

          if(response.data.applyBillStatus == 1){
            this.form.applyBillStatus = '1';
          }else{
            this.form.applyBillStatus = '2';
          }

          this.title = "查看科室申领";
        });
      } else if (this.currentBillType === '2') {
        // 查看申购单
        getPurchase(id).then(response => {
          this.form = response.data;
          this.basApplyEntryList = response.data.depPurchaseApplyEntryList || [];
          this.open = true;
          this.action = false;
          this.$nextTick(() => {
            this.calculateTotals();
          });
          this.title = "查看科室申购";
        });
      } else if (this.currentBillType === '3') {
        // 查看转科申请单
        this.$modal.msgWarning("转科申请单查看功能待开发");
      }
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function () {
        return auditApply({id: id,auditBy:auditBy});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核入库成功！");
      }).catch(() => {
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.applyBillStatus = '1';
      this.form.applyBillDate = this.getBillDate();
      this.title = "添加科室申领";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      if (this.currentBillType === '1') {
        // 修改申领单
        getApply(id).then(response => {
          this.form = response.data;
          this.basApplyEntryList = response.data.basApplyEntryList || [];
          this.open = true;
          this.action = true;
          this.$nextTick(() => {
            this.calculateTotals();
          });
          this.form.applyBillStatus = '1';
          this.title = "修改科室申领";
        });
      } else if (this.currentBillType === '2') {
        // 修改申购单
        getPurchase(id).then(response => {
          this.form = response.data;
          this.basApplyEntryList = response.data.depPurchaseApplyEntryList || [];
          this.open = true;
          this.action = true;
          this.$nextTick(() => {
            this.calculateTotals();
          });
          this.title = "修改科室申购";
        });
      } else if (this.currentBillType === '3') {
        this.$modal.msgWarning("转科申请单修改功能待开发");
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.basApplyEntryList = this.basApplyEntryList;
          var totalAmt = 0;
          this.basApplyEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateApply(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addApply(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const billNo = this.getBillNo(row);
      const billTypeName = this.currentBillType === '1' ? '申领单' : (this.currentBillType === '2' ? '申购单' : '转科申请单');
      
      this.$modal.confirm('你好！是否确认删除' + billTypeName + '，单号"' + billNo + '"的数据项？').then(() => {
        if (this.currentBillType === '1') {
          return delApply(ids);
        } else if (this.currentBillType === '2') {
          return delPurchase(ids);
        } else if (this.currentBillType === '3') {
          this.$modal.msgWarning("转科申请单删除功能待开发");
          return Promise.reject();
        }
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 科室申领明细序号 */
    rowBasApplyEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    rowApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 科室申领明细添加按钮操作 */
    handleAddBasApplyEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumer = "";
      obj.remark = "";
      this.basApplyEntryList.push(obj);
    },
    /** 科室申领明细删除按钮操作 */
    handleDeleteBasApplyEntry() {
      if (this.checkedBasApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室申领明细数据");
      } else {
        const basApplyEntryList = this.basApplyEntryList;
        const checkedBasApplyEntry = this.checkedBasApplyEntry;
        this.basApplyEntryList = basApplyEntryList.filter(function(item) {
          return checkedBasApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.basApplyEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleBasApplyEntrySelectionChange(selection) {
      this.checkedBasApplyEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/apply/export', {
        ...this.queryParams
      }, `apply_${new Date().getTime()}.xlsx`)
    },
    /** 获取单据类型名称 */
    getBillTypeName(billType) {
      if (!billType) {
        return this.currentBillType === '1' ? '申领单' : (this.currentBillType === '2' ? '申购单' : '转科申请单');
      }
      const typeMap = {
        '1': '申领单',
        '2': '申购单',
        '3': '转科申请单',
        1: '申领单',
        2: '申购单',
        3: '转科申请单',
      };
      return typeMap[billType] || (this.currentBillType === '1' ? '申领单' : (this.currentBillType === '2' ? '申购单' : '转科申请单'));
    },
    /** 获取单号（根据单据类型） */
    getBillNo(row) {
      if (this.currentBillType === '1') {
        return row.applyBillNo || '';
      } else if (this.currentBillType === '2') {
        return row.purchaseBillNo || '';
      } else if (this.currentBillType === '3') {
        return row.transferOrderCode || '';
      }
      return '';
    },
    /** 获取单据状态（根据单据类型） */
    getBillStatus(row) {
      if (this.currentBillType === '1') {
        return row.applyBillStatus;
      } else if (this.currentBillType === '2') {
        return row.purchaseBillStatus;
      } else if (this.currentBillType === '3') {
        return row.status;
      }
      return null;
    },
    /** 获取审核日期（根据单据类型） */
    getAuditDate(row) {
      if (this.currentBillType === '1') {
        return row.auditDate;
      } else if (this.currentBillType === '2') {
        return row.auditDate;
      } else if (this.currentBillType === '3') {
        return row.auditDate;
      }
      return null;
    },
    /** 获取总金额（根据单据类型） */
    getTotalAmount(row) {
      if (this.currentBillType === '1') {
        return row.totalAmount;
      } else if (this.currentBillType === '2') {
        return row.totalAmount;
      } else if (this.currentBillType === '3') {
        return row.totalAmount || 0;
      }
      return null;
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
  flex-direction: column;
  min-height: 95vh !important;
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
  border: 1px solid #DCDFE6;
  background: #fff;
  padding: 7px 15px;
}

.close-btn:hover {
  background: #F5F7FA;
  border-color: #C0C4CC;
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
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表单字段容器 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
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

/* 弹窗内表格固定列样式 */
::v-deep .local-modal-content .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .local-modal-content .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .local-modal-content .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .local-modal-content .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}
</style>
