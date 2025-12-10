<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="入库单号" prop="billNo" class="query-item-inline">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="入库单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入入库单号"
                      clearable
                      style="width: 180px"
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
            <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
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
          <el-form-item label="单据状态" prop="billStatus" class="query-item-status-aligned">
        <el-col :span="12" class="query-status-col">
          <el-form-item label="单据状态" prop="billStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.billStatus" placeholder="全部"
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['inWarehouse:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['inWarehouse:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              show-summary :summary-method="getTotalSummaries"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange" height="58vh" border>
<!--      <el-table-column type="selection" width="55" align="center" />-->
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="入库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
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
      <el-table-column label="引用单号" align="center" prop="refBillNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['inWarehouse:apply:edit']"
            v-if="scope.row.billStatus != 2"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['inWarehouse:apply:remove']"
            v-if="scope.row.billStatus != 2"
          >删除</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['inWarehouse:apply:view']"
          >查看</el-button>
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

    <!-- 添加或修改入库对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <el-row :gutter="8">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId">
              <SelectSupplier v-model="form.supplerId" :value2="stkIoBillEntryList.length > 0"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="请输入发票号" />
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="请输入发票号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" placeholder="请输入配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" placeholder="请输入发票金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="发票时间" prop="invoiceTime">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              style="width: 100%"
                              style="width: 100%"
                              placeholder="请输入发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

<!--        <el-divider content-position="left">入库明细信息</el-divider>-->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>入库明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="outline" icon="el-icon-ref" size="small" @click="refDingdan">引用采购订单</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                   height="48vh"
                   height="48vh"
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="left" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->

          <el-table-column label="名称" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="left" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="left" prop="material.fdUnit.unitName" width="90" show-overflow-tooltip resizable/>
          <el-table-column label="数量" prop="qty" width="60" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
              <!--                        @input="qtyChange(scope.row)"-->
              <!--                        placeholder="请输入数量" />-->
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="请输入数量"
                onkeyup="value=value.replace(/\D/g,'')"
                onafterpaste="value=value.replace(/\D/g,'')"
                @blur="form.result=$event.target.value"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" 
                        type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)"
                        placeholder="请输入价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber"  placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerEndTimeOptions"
                              placeholder="请选择入库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerBeginTimeOptions"
                              placeholder="请选择入库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
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
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
        </el-form>
        <div v-show="action" class="modal-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-show="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

    <SelectDingdan
      v-show="DialogDingdanComponentShow"
      :DialogComponentShow="DialogDingdanComponentShow"
      :warehouseValue="warehouseValue"
      :departmentValue="departmentValue"
      :supplierValue="supplierValue"
      :materialValue="materialValue"
      @closeDialog="closeDingdanDialog"
      @selectData="selectDingdanData"
    ></SelectDingdan>

  </div>
</template>

<script>
import { listWarehouse, getInWarehouse, delWarehouse, addWarehouse, updateWarehouse,createRkEntriesByDingdan } from "@/api/warehouse/warehouse";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import SelectDingdan from '@/components/SelectModel/SelectDingdan';

export default {
  name: "InWarehouse",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMaterialFilter,SelectDingdan},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      DialogDingdanComponentShow: false,
      supplierValue: "",
      warehouseValue: "",
      departmentValue: "",
      materialValue: "",
      isShow: true,
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
      // 入库表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 入库明细表格数据
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
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "入库类型不能为空", trigger: "change" }
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
        if( index === 5){
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
    /** 查询入库列表 */
    getList() {
      this.loading = true;
      this.queryParams.billType = "101";
      listWarehouse(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开"弹窗组件"
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {

        let obj = {};

        obj.materialId = item.id;
        obj.qty = "";
        // 设置价格：优先使用item.price
        obj.unitPrice = item.price || item.unitPrice || 0;
        obj.amt = "";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";
        obj.material = item;

        this.stkIoBillEntryList.push(obj);
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
        delPerson: null,
        telephone: null,
        totalAmount: null,
        invoiceAmount: null,
        invoiceTime: null,
        proPerson: null,
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
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
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
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '2';
        this.form.billType = '101';
        this.title = "查看入库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '101';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
      this.form.createrName = userName;
      // 制单日期由后端自动设置为保存时间，无需前端设置
      this.title = "添加入库";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '101';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.title = "修改入库";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 新增数量非空校验
          const hasEmptyQty = this.stkIoBillEntryList.some(item =>
            !item.qty || String(item.qty).trim() === ''
          );

          if (hasEmptyQty) {
            this.$modal.msgError("入库明细数量不能为空");
            return;
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
            updateWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addWarehouse(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除入库编号为"' + ids + '"的数据项？').then(function() {
        return delWarehouse(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 入库明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 入库明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.unitPrice = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 入库明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的入库明细数据");
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
    refDingdan() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开"弹窗组件"
      this.DialogDingdanComponentShow = true
      this.warehouseValue = this.form.warehouseId;
      this.departmentValue = this.form.departmentId;
      this.supplierValue = this.form.supplerId;
      this.materialValue = null; // 耗材筛选初始为空
    },
    selectDingdanData(val) {
      // 假设 val 是科室申请单对象或数组，取 id
      const dingdanId = Array.isArray(val) ? val[0].id : val.id;
      if (!dingdanId) return;

      const dingdanIdStr = String(dingdanId);
      var param = {
        dingdanId: dingdanIdStr
      };
      createRkEntriesByDingdan(param).then(response => {
        if (response && response.data) {
          this.form = response.data;
          this.stkIoBillEntryList = response.data.stkIoBillEntryList;
          this.form.billStatus = '1';
          this.form.billType = '101';
          this.DialogDingdanComponentShow = false;
        }
      }).catch(() => {
        this.$message.error("加载科室申请单明细失败");
      });
    },
    closeDingdanDialog() {
      //关闭订单选择界面
      this.DialogDingdanComponentShow = false
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
  min-height: 95vh;
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
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  display: flex;
  flex-direction: column;
}

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
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

/* 搜索区域样式 */
.app-container > .el-form {
  background: #fff;
  padding: 16px 20px;
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

/* 单据状态对齐到仓库下面 - 使用margin-left对齐到第三个位置 */
/* 计算：入库单号(80px label + 180px input + 16px margin) + 供应商(80px label + 180px input + 16px margin) = 552px */
.app-container > .el-form .query-row-left .query-item-aligned {
  margin-left: 552px;
}

/* 按钮对齐到仓库下面 - 按钮没有label，所以对齐到仓库input的开始位置 */
/* 仓库起始位置 552px + label 80px = 632px */
.app-container > .el-form .query-row-left .query-button-aligned {
  margin-left: 632px;
  display: inline-block;
}

/* 确保第三行的按钮单独显示 */
.app-container > .el-form .query-row-left:last-child {
  min-height: 32px;
}

.app-container > .el-form .query-row-left:last-child .el-col {
  flex-wrap: nowrap;
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

.local-modal-content .modal-form-compact image.png.el-date-editor.el-input {
  height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
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

/* 针对Element UI表格滚动条的通用样式 */
.local-modal-content .el-table .el-scrollbar__bar {
  opacity: 1 !important;
}

.local-modal-content .el-table .el-scrollbar__thumb {
  background-color: #c1c1c1 !important;
  border-radius: 5px !important;
  min-height: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__thumb:hover {
  background-color: #a8a8a8 !important;
}

/* 全局滚动条样式 - 确保表格滚动条更粗 */
.local-modal-content *::-webkit-scrollbar,
.local-modal-mask *::-webkit-scrollbar,
.app-container *::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

.local-modal-content *::-webkit-scrollbar-track,
.local-modal-mask *::-webkit-scrollbar-track,
.app-container *::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb,
.local-modal-mask *::-webkit-scrollbar-thumb,
.app-container *::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb:hover,
.local-modal-mask *::-webkit-scrollbar-thumb:hover,
.app-container *::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对弹窗内所有表格的滚动条 */
.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 12px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
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

/* 针对Element UI表格滚动条的通用样式 */
.local-modal-content .el-table .el-scrollbar__bar {
  opacity: 1 !important;
}

.local-modal-content .el-table .el-scrollbar__thumb {
  background-color: #c1c1c1 !important;
  border-radius: 5px !important;
  min-height: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__thumb:hover {
  background-color: #a8a8a8 !important;
}

/* 全局滚动条样式 - 确保表格滚动条更粗 */
.local-modal-content *::-webkit-scrollbar,
.local-modal-mask *::-webkit-scrollbar,
.app-container *::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

.local-modal-content *::-webkit-scrollbar-track,
.local-modal-mask *::-webkit-scrollbar-track,
.app-container *::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb,
.local-modal-mask *::-webkit-scrollbar-thumb,
.app-container *::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb:hover,
.local-modal-mask *::-webkit-scrollbar-thumb:hover,
.app-container *::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对弹窗内所有表格的滚动条 */
.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 12px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
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

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 覆盖弹窗组件的高度 - 调高添加弹窗中的弹窗高度 */
::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .purchase-modal-content {
  min-height: 95vh !important;
}

/* 弹窗内所有表格的滚动条加粗 - 统一使用和主弹窗相同的宽度 */
::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 10px !important;
  min-height: 10px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 覆盖弹窗组件的高度 - 调高添加弹窗中的弹窗高度 */
::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .purchase-modal-content {
  min-height: 95vh !important;
}

/* 弹窗内所有表格的滚动条加粗 - 统一使用和主弹窗相同的宽度 */
::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 10px !important;
  min-height: 10px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}
</style>
