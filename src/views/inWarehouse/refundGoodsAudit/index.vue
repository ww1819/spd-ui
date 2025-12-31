<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="退货单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入退货单号"
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
              <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="退货日期" style="display: flex; align-items: center;">
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
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-check"
          size="small"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['inWarehouse:refundGoodsAudit:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              :row-class-name="warehouseListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
      <el-table-column label="退货单号" align="center" prop="billNo" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="退货日期" align="center" prop="billDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="退货人" align="center" prop="creater.nickName" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="100" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="打印状态" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.printDate" type="success" size="small">已打印</el-tag>
          <el-tag v-else type="info" size="small">未打印</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="打印人" align="center" prop="printPerson" width="100" show-overflow-tooltip resizable>
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
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.billStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['inWarehouse:refundGoodsApply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['inWarehouse:refundGoodsApply:remove']"
              v-if="scope.row.billStatus != 2"
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

    <!-- 添加或修改退货对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <div class="modal-content-wrapper">
            <div class="modal-form-wrapper">
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <!-- 顶部输入框容器 -->
        <div class="form-fields-container">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId">
              <SelectSupplier v-model="form.supplerId" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" :disabled="true" placeholder="请输入发票号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson" :disabled="true"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" :disabled="true" placeholder="请输入配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" :disabled="true" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" :disabled="true" placeholder="请输入发票金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              style="width: 100%"
                              placeholder="请输入发票时间">
              </el-date-picker>
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
        </el-row>
        </div>
            </el-form>
            </div>

            <!-- 表格区域 - 可滚动 -->
            <div class="modal-table-wrapper">
        <!--        <el-divider content-position="left">退货明细信息</el-divider>-->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>退货明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" size="small" @click="submitForm">确 定</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button size="small" @click="cancel">取 消</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column> -->
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入价格" />
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
              <el-input v-model="scope.row.batchNumber" :disabled="true" placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              placeholder="请选择生产日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              placeholder="请选择有效期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="true" placeholder="请输入备注" />
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
            </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width ">
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <!--          <el-radio :label=" 1 ">lodop打印</el-radio>-->
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if=" modalObj.form.value === 2 || modalObj.component === 'window-print-preview' ">
        <refund-goods-order-print :row=" modalObj.form.row " ref="receiptRefundGoodsPrintRef"></refund-goods-order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

  </div>
</template>

<script>
import { listThInventory, getThInventory, delThInventory, addThInventory, updateThInventory,auditThInventory } from "@/api/warehouse/thInventory";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectInventory from "@/components/SelectModel/SelectInventory";
import refundGoodsOrderPrint from "@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrint.vue";
import RMBConverter from "@/utils/tools";
import {STOCK_IN_TEMPLATE} from '@/utils/printData'
import OrderPrint from "@/views/inWarehouse/audit/orderPrint.vue";

export default {
  name: "InWarehouseGoodsAudit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {
    OrderPrint,
    refundGoodsOrderPrint, SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      supplierValue: "",
      isShow: true,
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: null,
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        }
      },
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
      // 退货表格数据
      warehouseList: [],
      // 退货明细表格数据
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
          { required: true, message: "供应商ID不能为空", trigger: "blur" }
        ],
        billDate: [
          { required: true, message: "退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "退货类型不能为空", trigger: "change" }
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
    /** 查询退货列表 */
    getList() {
      this.loading = true;

      this.queryParams.billType = "301";
      listThInventory(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请选择仓库', type: 'warning' })
        return
      }

      if(!this.form.supplerId) {
        this.$message({ message: '请选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
      this.supplierValue = this.form.supplerId;
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
        obj.materialId = item.materialId;
        obj.qty = item.qty;
        obj.unitPrice = item.unitPrice;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.materialNo;
        obj.beginTime = item.beginTime;
        obj.endTime = item.endTime;
        obj.remark = item.remark;
        obj.material = item;
        obj.material = item.material;

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
        supplerId: null,
        billDate: null,
        warehouseId: null,
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
      getThInventory(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '1';
        this.form.billType = '301';
        this.title = "查看退货";
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function() {
        return auditThInventory({id:id,auditBy:auditBy});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核退货成功！");
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要审核的数据");
        return;
      }
      const auditBy = this.$store.state.user.userId;
      this.$modal.confirm('确定要审核选中的"' + ids.length + '"条数据项？').then(() => {
        // 批量审核：循环调用审核接口
        const promises = ids.map(id => auditThInventory({id: id, auditBy: auditBy}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getThInventory(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '301';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改退货";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          var totalAmt = 0;
          this.stkIoBillEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateThInventory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addThInventory(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      this.modalObj = {
        show: true,
        title: '选择打印方式',
        width: '520px',
        component: 'print-type',
        form: {
          value: 1,
          row
        },
        ok: () => {
          this.modalObj.show = false
          if (this.modalObj.form.value === 1) {
            this.doPrintOut(row, false)
          } else {
            this.windowPrintOut(row, print)
          }
        },
        cancel: () => {
          this.modalObj.show = false
        }
      }
    },
    windowPrintOut(row, print) {
      this.getRefundGoodsDetail(row).then(res => {
        if (print) {
          this.modalObj.form.row = res
          this.$nextTick(() => {
            this.$refs['receiptRefundGoodsPrintRef'].start()
          })
          return
        }
        this.$nextTick(() => {
          this.modalObj = {
            show: true,
            title: '浏览器打印预览',
            width: '800px',
            component: 'window-print-preview',
            form: {
              value: 1,
              row,
              print
            },
            ok: () => {
              this.modalObj.show = false
            },
            cancel: () => {
              this.modalObj.show = false
            }
          }
        })
      })
    },
    doPrintOut(row, print) {
      this.getRefundGoodsDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_IN_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_IN_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getRefundGoodsDetail(row) {
      //查询详情
      return getThInventory(row.id).then(response => {
        const details = response.data.stkIoBillEntryList
        const materiaDetails = response.data.materialList
        const map = {};

        (materiaDetails || []).forEach(it => {
          map[it.id] = it
        })

        let detailList = [], totalAmt = 0, totalQty = 0

        details && details.forEach(item => {
          totalAmt += item.amt
          totalQty += item.qty

          const prod = map[item.materialId]

          detailList.push({
            batchNumber: item.batchNumber,
            amt: item.amt,
            qty: item.qty,
            unitPrice: item.unitPrice,
            materialCode: prod.code,
            materialName: prod.name,
            materialSpeci: prod.speci,
            periodDate: prod.periodDate,
            factoryName: prod.fdFactory.factoryName,
            warehouseCategoryName: prod.fdWarehouseCategory.warehouseCategoryName,
          })

        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        return {
          billNo: row.billNo,
          supplierName: row.supplier.name,
          warehouseName: row.warehouse.name,
          billDate: row.billDate,
          auditDate: row.auditDate,
          totalAmt: totalAmt,
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList:detailList
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除退货编号为"' + ids + '"的数据项？').then(function() {
        return delThInventory(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 退货明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 退货明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      // obj.unitPrice = "";
      obj.qty = "";
      obj.unitPrice = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 退货明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的退货明细数据");
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

/* 弹窗内容包装器 - 固定顶部，表格区域可滚动 */
.modal-content-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 表单区域 - 固定不滚动 */
.modal-form-wrapper {
  flex-shrink: 0;
  overflow: visible;
  padding: 20px;
  background: #fff;
}

/* 表格区域 - 可滚动 */
.modal-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: 0 20px 20px 20px;
  min-height: 0;
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
  background: transparent;
  border: none;
  color: #909399;
}

.close-btn:hover {
  color: #409EFF;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
}

.modal-footer .el-button {
  margin-left: 10px;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-30px);
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
}

.query-status-col {
  display: flex;
  align-items: center;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
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
  overflow-x: auto;
  overflow-y: auto;
}

/* 隐藏弹窗右侧滚动条 */
.local-modal-content {
  overflow: hidden !important;
}

/* 表格区域可以滚动 */
.modal-table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}

.modal-table-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.modal-table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.modal-table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.modal-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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

/* 搜索区域样式 */
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

/* 确保退货日期的两个日期选择器在同一行 */
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
</style>
