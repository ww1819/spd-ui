<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="退货单号" prop="goodsNo" class="query-item-inline">
            <el-input v-model="queryParams.goodsNo"
                      placeholder="请输入退货单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
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
          <el-form-item label="单据状态" prop="goodsStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.goodsStatus" placeholder="全部"
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['gzOrder:goodsApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['gzOrder:goodsApply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="small"
          @click="handleBatchAudit"
          v-hasPermi="['gzOrder:goodsApply:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="goodsList"
              :row-class-name="goodsListIndex"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="退货单号" align="center" prop="goodsNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.goodsNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="总金额" align="center" prop="totalAmt" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.totalAmt != null && scope.row.totalAmt !== undefined) ? parseFloat(scope.row.totalAmt).toFixed(2) : formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="goodsStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.goodsStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="退货日期" align="center" prop="goodsDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.goodsDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
            <el-button
            size="small"
            type="text"
            @click="handlePrint(scope.row,true)"
            v-if="scope.row.goodsStatus == 2"
          >打印</el-button>
          <template v-if="scope.row.goodsStatus != 2">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
                              v-hasPermi="['gzOrder:goodsApply:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
                              v-hasPermi="['gzOrder:goodsApply:remove']"
            >删除</el-button>
          </template>
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

    <!-- 添加或修改高值入库对话框 -->
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
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="!action" includeWarehouseType="高值"/>
            </el-form-item>
            <el-form-item label="总金额">
              <el-input :value="getTotalAmount()" :disabled="true" style="width: 140px; background-color: #fff;">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="goodsStatus">
              <el-select v-model="form.goodsStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 140px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="退货日期" prop="goodsDate">
              <el-date-picker clearable
                              v-model="form.goodsDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 140px"
                              placeholder="请选择退货日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" style="width: 140px" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="退货类型" prop="goodsType">
              <el-select v-model="form.goodsType" placeholder="请选择退货类型"
                         :disabled="true"
                         clearable style="width: 140px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>备货退货明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzRefundGoodsEntry">删除</el-button>
            </el-col>
          </div>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="gzRefundGoodsEntryList" :row-class-name="rowGzRefundGoodsEntryIndex" @selection-change="handleGzRefundGoodsEntrySelectionChange" ref="gzRefundGoodsEntry" border height="48vh">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialName" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <!-- 库存列已隐藏 -->
          <!-- <el-table-column label="库存" prop="stockQty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockQty || '--' }}</span>
            </template>
          </el-table-column> -->
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
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" prop="supplierName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || (scope.row.supplier && scope.row.supplier.name) || scope.row.supplierName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="院内码" prop="inHospitalCode" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="UDI码" prop="udiNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.udiNo || scope.row.masterBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="辅条码" prop="secondaryBarcode" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.secondaryBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
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

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width ">
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if=" modalObj.form.value === 2 || modalObj.component === 'window-print-preview' ">
        <gz-order-print :row=" modalObj.form.row " ref="receiptOrderPrintRef"></gz-order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="form.warehouseId"
      :gzOrderEntryList="gzRefundGoodsEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

  </div>
</template>

<script>
import { listGoods, getGoods, delGoods, addGoods, updateGoods, auditGoods } from "@/api/gz/goods";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import {STOCK_IN_TEMPLATE} from "@/utils/printData";
import RMBConverter from "@/utils/tools";
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";

export default {
  name: "RefundGoods",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectMaterialFilter,gzOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
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
      checkedGzRefundGoodsEntry: [],
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
      // 高值退货表格数据
      goodsList: [],
      // 高值退货明细表格数据
      gzRefundGoodsEntryList: [],
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
        goodsNo: null,
        warehouseId: null,
        goodsStatus: null,
        goodsType: null,
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        goodsDate: [
          { required: true, message: "退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    goodsListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 格式化总金额 */
    formatTotalAmt(row) {
      if (row.gzRefundGoodsEntryList && row.gzRefundGoodsEntryList.length > 0) {
        const total = row.gzRefundGoodsEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 计算明细总金额 */
    getTotalAmount() {
      if (this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0) {
        const total = this.gzRefundGoodsEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 查询高值退货列表 */
    getList() {
      this.loading = true;
      listGoods(this.queryParams).then(response => {
        this.goodsList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      // 检查是否选择了仓库
      if (!this.form.warehouseId) {
        this.$message.warning('请先选择仓库');
        return;
      }
      //打开"弹窗组件"
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据（重复检查已在弹窗组件中完成）
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};

        // 确保 materialId 正确获取：优先从 materialId 字段，其次从 material.id，最后从 materialId 属性
        obj.materialId = item.materialId || (item.material && item.material.id) || item.materialId;
        // 调试：打印选择的物料信息
        console.log('选择的物料:', {
          materialId: obj.materialId,
          materialName: (item.material && item.material.name) || item.materialName,
          item: item
        });
        // 优先从material对象获取名称，如果没有则从materialName字段获取
        obj.materialName = (item.material && item.material.name) || item.materialName || ""; // 保存耗材名称用于显示
        // 保存规格和型号
        obj.speci = (item.material && item.material.speci) || "";
        obj.model = (item.material && item.material.model) || "";
        // 保存生产厂家和供应商
        obj.factoryName = (item.material && item.material.fdFactory && item.material.fdFactory.factoryName) || "";
        obj.supplierName = (item.material && item.material.supplier && item.material.supplier.name) || (item.supplier && item.supplier.name) || "";
        obj.qty = item.qty || "";
        obj.stockQty = item.qty || 0; // 保存原始库存数量，用于验证
        obj.price = item.unitPrice || "";
        obj.amt = item.amt || "";
        obj.batchNo = item.batchNo || "";
        obj.batchNumber = item.materialNo || "";
        obj.beginTime = item.materialDate || "";
        obj.endTime = item.endTime || "";
        obj.remark = "";
        obj.masterBarcode = "";
        obj.secondaryBarcode = "";
        obj.inHospitalCode = item.inHospitalCode || "";
        // 保存UDI码，优先从material对象获取，如果没有则从udiNo字段获取
        obj.udiNo = (item.material && item.material.udiNo) || item.udiNo || "";
        this.gzRefundGoodsEntryList.push(obj);
      });
    },
    //当天日期
    getGoodsDate(){
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
        goodsNo: null,
        goodsDate: null,
        warehouseId: null,
        supplerId: null,
        goodsStatus: null,
        goodsType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.gzRefundGoodsEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      // 只计算金额，不做验证（验证在提交时进行）
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getGoods(id).then(response => {
        this.form = response.data;
        this.gzRefundGoodsEntryList = response.data.gzRefundGoodsEntryList || [];
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzRefundGoodsEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              const material = materialMap[entry.materialId];
              entry.materialName = material.name || "";
              entry.speci = material.speci || "";
              entry.model = material.model || "";
              entry.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
              entry.supplierName = (material.supplier && material.supplier.name) || "";
              entry.udiNo = material.udiNo || entry.udiNo || "";
            }
          });
        }
        this.open = true;
        this.action = false;
        this.title = "查看备货退货";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加备货退货";
      this.form.goodsStatus = 1;
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.goodsDate = this.getGoodsDate();
      this.action = true;
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditGoods({id: id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核退货成功！");
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError('请先选择要审核的数据');
        return;
      }
      this.$modal.confirm('确定要审核选中的' + this.ids.length + '条数据项？').then(() => {
        const promises = this.ids.map(id => auditGoods({id: id}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核退货成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getGoods(id).then(response => {
        this.form = response.data;
        this.form.goodsStatus = 1;
        this.gzRefundGoodsEntryList = response.data.gzRefundGoodsEntryList || [];
        // 调试：打印查询返回的数据，特别是院内码
        console.log('查询返回的数据（修改）:', {
          gzOrderEntryList: this.gzOrderEntryList.map(entry => ({
            id: entry.id,
            materialId: entry.materialId,
            batchNo: entry.batchNo,
            inHospitalCode: entry.inHospitalCode,
            materialName: entry.materialName,
            fullEntry: entry
          })),
          materialList: response.data.materialList,
          rawResponse: response.data
        });
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzRefundGoodsEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              const material = materialMap[entry.materialId];
              entry.materialName = material.name || "";
              entry.speci = material.speci || "";
              entry.model = material.model || "";
              entry.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
              entry.supplierName = (material.supplier && material.supplier.name) || "";
              entry.udiNo = material.udiNo || entry.udiNo || "";
            }
          });
        }
        this.open = true;
        this.title = "修改备货退货";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate((valid) => {
        if (valid) {
          // 验证数量必须大于0
          for (let i = 0; i < this.gzRefundGoodsEntryList.length; i++) {
            const item = this.gzRefundGoodsEntryList[i];
            const qty = parseFloat(item.qty) || 0;
            
            if (!item.qty || qty <= 0) {
              this.$message.error(`第${i + 1}行：退货数量必须大于0`);
              return;
            }
          }
          this.form.gzRefundGoodsEntryList = this.gzRefundGoodsEntryList;
          if (this.form.id != null) {
            updateGoods(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addGoods(this.form).then(response => {
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
      this.getOrderDetail(row).then(res => {
        if (print) {
          this.modalObj.form.row = res
          this.$nextTick(() => {
            this.$refs['receiptOrderPrintRef'].start()
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
      this.getOrderDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_IN_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_IN_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getOrderDetail(row) {
      //查询详情
      return getGoods(row.id).then(response => {
        const details = response.data.gzRefundGoodsEntryList
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
            price: item.price,
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
          orderNo: row.goodsNo,
          supplierName: row.supplier.name,
          warehouseName: row.warehouse.name,
          orderDate: row.goodsDate,
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
      const confirmText = '是否确认删除备货退货编号为"' + (row.goodsNo || ids) + '"的数据项？';
      this.$modal.confirm(confirmText).then(() => {
        return delGoods(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 高值退货明细序号 */
    rowGzRefundGoodsEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzRefundGoodsEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      this.gzRefundGoodsEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzRefundGoodsEntry() {
      if (this.checkedGzRefundGoodsEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzRefundGoodsEntryList = this.gzRefundGoodsEntryList;
        const checkedGzRefundGoodsEntry = this.checkedGzRefundGoodsEntry;
        this.gzRefundGoodsEntryList = gzRefundGoodsEntryList.filter(function(item) {
          return checkedGzRefundGoodsEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzRefundGoodsEntrySelectionChange(selection) {
      this.checkedGzRefundGoodsEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/goods/export', {
        ...this.queryParams
      }, `goods_${new Date().getTime()}.xlsx`)
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

.local-modal-content .modal-form-compact .el-date-editor.el-input {
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

.local-modal-content .el-table {
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
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
</style>
