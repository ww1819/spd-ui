<template>
  <div class="app-container refund-depot-apply-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="退库单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入退库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="耗材" prop="materialId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectMaterial v-model="queryParams.materialId" />
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="退库日期" style="display: flex; align-items: center;">
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
          <el-form-item label="单据状态" prop="billStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.billStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
                         v-if="dict.label !== '待审核'"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['outWarehouse:refundDepotApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['outWarehouse:refundDepotApply:export']"
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

    <el-table v-loading="loading" :data="warehouseList" class="table-compact"
              :row-class-name="warehouseListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="退库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="打印状态" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.printDate" type="success" size="small">已打印</el-tag>
          <el-tag v-else type="info" size="small">未打印</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="打印人" align="center" prop="printPerson" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.printPerson || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="打印日期" align="center" prop="printDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.printDate">{{ parseTime(scope.row.printDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="引用单号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.refBillNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
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
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['outWarehouse:refundDepotApply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['outWarehouse:refundDepotApply:remove']"
              v-if="scope.row.billStatus != 2"
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

    <!-- 添加或修改退库对话框 -->
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
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="退库类型" prop="billType">
              <el-select v-model="form.billType" placeholder="请选择退库类型"
                         :disabled="true"
                         clearable style="width: 100%">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="退库原因" prop="returnReason">
              <el-input v-model="form.returnReason" placeholder="请输入退库原因" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>退库明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="outline" icon="el-icon-ref" size="small" @click="refCkApply">引用出库单</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button size="small" @click="cancel">取 消</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" size="small" @click="submitForm">确 定</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  height="59vh"
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column> -->
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.unitPrice"
                :disabled="true"
                type="number"
                @input="priceChange(scope.row)"
                placeholder="自动带出单价"/>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
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
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.batchNumber"
                :disabled="true"
                placeholder="自动带出批号"/>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.beginTime"
                :disabled="true"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择生产日期"/>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.endTime"
                :disabled="true"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择有效期"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

    <SelectCkApply
      v-if="DialogCkApplyComponentShow"
      :DialogComponentShow="DialogCkApplyComponentShow"
      :departmentValue="departmentValue"
      :warehouseValue="warehouseValue"
      @closeDialog="closeCkApplyDialog"
      @selectData="selectCkApplyData"
    >

    </SelectCkApply>

  </div>
</template>

<script>
import {
  listTkInventory,
  getTkInventory,
  delTkInventory,
  addTkInventory,
  updateTkInventory,
  createTkEntriesByCkApply
} from "@/api/warehouse/tkInventory";
import {createEntriesByDApply, listCTKWarehouse} from '@/api/warehouse/outWarehouse'; // 新增引用
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';
import SelectCkApply from "@/components/SelectModel/SelectCkApply";

export default {
  name: "OutWarehouseRefund",
  dicts: ['biz_status','bill_type','way_status'],
  components: {
    SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectDepInventory,SelectCkApply},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      DialogCkApplyComponentShow: false,
      departmentValue: "",
      warehouseValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 退库表格数据
      warehouseList: [],
      selectRow: [],
      // 退库明细表格数据
      stkIoBillEntryList: [],
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
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "退库类型不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 3 || index === 4 || index === 5){
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

          if(index === 5){
            let res = parseFloat(sums[index]);
            if(!isNaN(res)){
              let parRes = res.toFixed(2);
              this.form.totalAmount = parRes;
            }
          }
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
    /** 查询退库列表 */
    getList() {
      this.loading = true;
      this.queryParams.billType = "401";
      listTkInventory(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    closeCkApplyDialog() {
      //关闭“弹窗组件”
      this.DialogCkApplyComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item) => {
        let obj = {};
        obj.materialId = item.materialId;
        obj.qty = item.qty;
        obj.unitPrice = item.unitPrice;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.materialNo;
        obj.beginTime = item.beginTime;
        obj.endTime = item.endTime;
        obj.remark = item.remark;
        obj.material = item.material;
        this.stkIoBillEntryList.push(obj);
        // this.stkIoBillEntryList.splice(this.stkIoBillEntryList.length, 0, JSON.parse(JSON.stringify(item)));
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
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        billNo: null,
        refBillNo: null,
        returnReason: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        totalAmount: null,
        remark: null,
        auditBy: null,
        createrName:null,
        auditPersonName:null,
        auditDate:null
      };
      this.stkIoBillEntryList = [];
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
      getTkInventory(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '1';
        this.form.billType = '401';
        this.title = "查看退库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '401';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
      this.form.createrName = userName;
      this.title = "添加退库";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getTkInventory(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '401';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改退库";
      });
    },
    /** 提交按钮 */
    async submitForm() {
      this.$refs["form"].validate(async (valid) => {
        if (valid) {
          // 新增/修改退库校验逻辑：存在未审核退库单则提示（修改时排除当前单据）
          for (const [index, entry] of this.stkIoBillEntryList.entries()) {
            if (entry.materialId) {
              try {
                const res = await listCTKWarehouse({
                  materialId: entry.materialId,
                  warehouseId: this.form.warehouseId,
                  billNo: 'TK',
                  billStatus: 1
                });
                let list = res && Array.isArray(res) ? res : [];
                if (this.form.id != null) {
                  list = list.filter(item => item.id != null && String(item.id) !== String(this.form.id));
                }
                if (list.length > 0) {
                  this.$modal.msgError(`第${index + 1}行耗材存在未审核退库单，请先审核后再退库`);
                  return;
                }
              } catch (error) {
                console.error("校验请求失败:", error);
              }
            }
          }

          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          var totalAmt = 0;
          this.stkIoBillEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateTkInventory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTkInventory(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除退库编号为"' + ids + '"的数据项？').then(function() {
        return delTkInventory(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 打印按钮操作 */
    handlePrint(row, print) {
      this.$modal.msgWarning("打印功能开发中");
    },
    /** 退库明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 退库明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 退库明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的退库明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    },
    selectCkApplyData(val) {
      console.log('selectCkApplyData called with:', val);
      // 假设 val 是出库单对象或数组，取 id
      const ckApplyId = Array.isArray(val) ? val[0].id : val.id;
      console.log('ckApplyId:', ckApplyId);
      if (!ckApplyId) return;

      const ckApplyIdStr = String(ckApplyId);
      var param = {
        ckApplyId: ckApplyIdStr
      };
      console.log('calling createTkEntriesByCkApply with param:', param);
      createTkEntriesByCkApply(param).then(response => {
        console.log('createTkEntriesByCkApply response:', response);
        if (response && response.data) {
          this.form = response.data;
          this.stkIoBillEntryList = response.data.stkIoBillEntryList;
          this.form.billStatus = '1';
          this.form.billType = '401';
          this.DialogCkApplyComponentShow = false;
          console.log('form updated:', this.form);
          console.log('stkIoBillEntryList updated:', this.stkIoBillEntryList);
        }
      }).catch((error) => {
        console.error('createTkEntriesByCkApply error:', error);
        this.$message.error("加载出库单明细失败");
      });
    },
    refCkApply() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogCkApplyComponentShow = true
      this.warehouseValue = this.form.warehouseId;
      this.departmentValue = this.form.departmentId;
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
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
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
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表格样式 */
.local-modal-content .el-table {
  max-height: calc(42vh);
  min-height: 300px;
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
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 600;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 表单样式优化 */
.el-form {
  background: #fff;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

/* 查询条件样式 */
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

.query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  align-items: center;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
}

/* 弹窗表单紧凑样式 */
.modal-form-compact {
  padding: 20px;
  flex: 1;
  overflow: auto;
}

.modal-form-compact .el-form-item {
  margin-bottom: 12px;
}

.modal-form-compact .el-form-item__label {
  width: 70px !important;
  padding-right: 8px;
}

.modal-form-compact .el-input,
.modal-form-compact .el-select,
.modal-form-compact .el-date-picker {
  width: 100%;
}

.modal-form-compact .el-input__inner {
  height: 28px;
  line-height: 28px;
  font-size: 12px;
}

.modal-form-compact .el-select .el-input__inner {
  height: 28px;
  line-height: 28px;
}

.modal-form-compact .el-date-editor.el-input {
  width: 100%;
}

.modal-form-compact .el-date-editor .el-input__inner {
  height: 28px;
  line-height: 28px;
}

/* 表格包装器样式 */
.table-wrapper {
  margin-top: 10px;
  margin-bottom: 10px;
}

.local-modal-content .el-table {
  height: 59vh;
  max-height: 59vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(59vh - 48px);
  overflow-y: auto;
}

/* 表格滚动条样式 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 搜索区域样式（与到货验收一致） */
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

/* 弹窗内表单字段容器样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

/* 覆盖弹窗组件的高度 - 调高添加弹窗中的弹窗高度 */
::v-deep .local-modal-content {
  min-height: 95vh !important;
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

/* 确保退库日期的两个日期选择器在同一行 */
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

/* 主表格水平滚动条样式 */
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
</style>

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.refund-depot-apply-page {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.refund-depot-apply-page > .el-form.query-form-compact {
  margin-top: -8px !important;
}

.app-container.refund-depot-apply-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.refund-depot-apply-page > .el-table.table-compact {
  margin-top: 0;
}

/* 主表格表头样式：与到货验收一致 */
.app-container.refund-depot-apply-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.refund-depot-apply-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}
</style>
