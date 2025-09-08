<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="订单单号" prop="orderNo" label-width="100px">
            <el-input v-model="queryParams.orderNo"
                      placeholder="请输入订单单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="供应商" prop="supplierId" label-width="100px">
            <SelectSupplier v-model="queryParams.supplierId"/>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="单据状态" prop="orderStatus" label-width="100px">
            <el-select v-model="queryParams.orderStatus" placeholder="请选择单据状态" clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="6" label-width="100px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>

      </el-row>

      <el-row>
        <el-col :span="6">
          <div style="display: inline">
            <span>起</span>
            <el-date-picker clearable
                            v-model="queryParams.beginDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择起始日期"
                            style="width: 150px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 150px"
            >
            </el-date-picker>
          </div>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['caigou:dingdan:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['caigou:dingdan:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange"
              height="54vh"
              border>
<!--      <el-table-column type="selection" width="55" align="center" />-->
      <el-table-column label="订单单号" align="center" prop="orderNo" width="180">
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180"/>
      <el-table-column label="订单日期" align="center" prop="orderDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" />
      <el-table-column label="金额" align="center" prop="totalAmount" >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >查看</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.orderStatus == '0'"
            v-hasPermi="['caigou:dingdan:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-if="scope.row.orderStatus == '0'"
            v-hasPermi="['caigou:dingdan:remove']"
          >删除</el-button>
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

    <!-- 添加或修改订单对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="mini" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-row>
          <el-col :span="4">
            <el-form-item label="订单状态" prop="orderStatus" label-width="100px">
              <el-select v-model="form.orderStatus" placeholder="请选择订单状态"
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
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="订单日期" prop="orderDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.orderDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择订单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
             <!-- <SelectUser v-model="form.userId"/> -->
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="联系电话" prop="contactPhone" label-width="100px">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>

        </el-row>

        <el-row>

          <el-col :span="4">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectSupplier v-model="form.supplierId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount" label-width="100px">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
        </el-row>

<!--        <el-divider content-position="left">订单明细信息</el-divider>-->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>订单明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeletePurchaseOrderEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="purchaseOrderEntryList" :row-class-name="rowPurchaseOrderEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handlePurchaseOrderEntrySelectionChange"
                  ref="purchaseOrderEntry"
                  height="calc(42vh)"
                  border
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="耗材" prop="materialId" width="120">
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="materialSpec" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialSpec" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="materialName" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialName" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="orderQty" width="120">
            <template slot-scope="scope">
<!--              <el-input v-model="scope.row.orderQty" type='number' :min="1"-->
<!--                        @input="qtyChange(scope.row)"-->
<!--                        placeholder="请输入数量" />-->
              <el-input
                clearable
                v-model="scope.row.orderQty"
                placeholder="请输入数量"
                onkeyup="value=value.replace(/\D/g,'')"
                onafterpaste="value=value.replace(/\D/g,'')"
                @blur="form.result=$event.target.value"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="totalAmount" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.totalAmount" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
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
    <SelectMMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMMaterialFilter>

  </div>
</template>

<script>
import { listDingdan, getDingdan, delDingdan, addDingdan, updateDingdan } from "@/api/caigou/dingdan";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMMaterialFilter from '@/components/SelectModel/SelectMMaterialFilter';

export default {
  name: "PurchaseOrder",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedPurchaseOrderEntry: [],
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
      // 订单表格数据
      orderList: [],
      stkMaterialList: [],
      // 订单明细表格数据
      purchaseOrderEntryList: [],
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
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        orderType: null,
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
        orderDate: [
          { required: true, message: "订单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        orderType: [
          { required: true, message: "订单类型不能为空", trigger: "change" }
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
    /** 查询订单列表 */
    getList() {
      this.loading = true;
      // 设置默认的订单类型为采购订单
      if (!this.queryParams.orderType) {
        this.queryParams.orderType = "1";
      }
      listDingdan(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      //打开“弹窗组件”
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;
        this.selectRow.forEach((item, index) => {

        let obj = {};
        obj.materialId = item.id;
        obj.orderQty = "";
        obj.unitPrice = item.price;
        obj.totalAmount = "";
        obj.materialSpec = item.speci;
        obj.materialName = item.name;
        obj.materialCode = item.code;
        obj.materialUnit = item.unit;
        obj.expectedDeliveryDate = "";
        obj.qualityStatus = "0";
        obj.remark = "";
        this.purchaseOrderEntryList.push(obj);
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
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        orderType: null,
        urgencyLevel: null,
        totalAmount: null,
        paidAmount: null,
        unpaidAmount: null,
        expectedDeliveryDate: null,
        actualDeliveryDate: null,
        paymentTerms: null,
        deliveryAddress: null,
        contactPerson: null,
        contactPhone: null,
        auditBy: null,
        auditDate: null,
        auditOpinion: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.purchaseOrderEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.orderQty && row.unitPrice){
        totalAmt = row.orderQty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.totalAmount = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.orderQty && row.unitPrice){
        totalAmt = row.orderQty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.totalAmount = totalAmt.toFixed(2);
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
      getDingdan(id).then(response => {
        this.form = response.data;
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList;
        this.open = true;
        this.action = false;
        this.form.orderStatus = '0';
        this.form.orderType = '1';
        this.title = "查看订单";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.orderStatus = '0';
      this.form.orderType = '1';
      this.form.urgencyLevel = '2';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userName;
      this.form.orderDate = this.getBillDate();
      this.title = "添加订单";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getDingdan(id).then(response => {
        this.form = response.data;
        this.form.orderStatus = '0';
        this.form.orderType = '1';
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList;
        this.open = true;
        this.title = "修改订单";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.purchaseOrderEntryList = this.purchaseOrderEntryList;
          if (this.form.id != null) {
            updateDingdan(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDingdan(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除订单编号为"' + ids + '"的数据项？').then(function() {
        return delDingdan(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 订单明细序号 */
    rowPurchaseOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 订单明细添加按钮操作 */
    handleAddPurchaseOrderEntry() {
      let obj = {};
      obj.materialId = "";
      obj.orderQty = "";
      obj.unitPrice = "";
      obj.totalAmount = "";
      obj.materialCode = "";
      obj.materialName = "";
      obj.materialSpec = "";
      obj.materialUnit = "";
      obj.expectedDeliveryDate = "";
      obj.qualityStatus = "0";
      obj.remark = "";

      this.purchaseOrderEntryList.push(obj);
    },
    /** 订单明细删除按钮操作 */
    handleDeletePurchaseOrderEntry() {
      if (this.checkedPurchaseOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的订单明细数据");
      } else {
        const purchaseOrderEntryList = this.purchaseOrderEntryList;
        const checkedPurchaseOrderEntry = this.checkedPurchaseOrderEntry;
        this.purchaseOrderEntryList = purchaseOrderEntryList.filter(function(item) {
          return checkedPurchaseOrderEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handlePurchaseOrderEntrySelectionChange(selection) {
      this.checkedPurchaseOrderEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/dingdan/export', {
        ...this.queryParams
      }, `purchase_order_${new Date().getTime()}.xlsx`)
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
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
  flex-shrink: 0;
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

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  padding: 12px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.modal-footer .el-button {
  margin-left: 12px;
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
</style>
