<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="入库单号" prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="请输入入库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplerId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
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
          <el-form-item label="单据状态" prop="orderStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.orderStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option label="全部" value="" />
              <el-option label="未审核" value="1" />
              <el-option label="已审核" value="2" />
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
          v-hasPermi="['gzOrder:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['gzOrder:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="small"
          :disabled="multiple"
          @click="handleAudit"
          v-hasPermi="['gzOrder:apply:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="入库单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="入库日期" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <template v-if="scope.row.orderStatus == '2' || scope.row.orderStatus == 2">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrintBarcode(scope.row)"
            >打印条码</el-button>
          </template>
          <template v-else>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['gzOrder:apply:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['gzOrder:apply:remove']"
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
                  <el-form-item label="验收单号" prop="orderNo">
                    <el-input v-model="form.orderNo" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="供应商" prop="supplerId">
                    <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <SelectWarehouse v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" includeWarehouseType="高值"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单人" prop="createBy">
                    <el-input v-model="form.creatorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单日期" prop="orderDate">
                    <el-date-picker clearable
                                    v-model="form.orderDate"
                                    type="date"
                                    :disabled="true"
                                    value-format="yyyy-MM-dd"
                                    style="width: 140px"
                                    placeholder="请选择制单日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="审核人" prop="auditBy">
                    <el-input v-model="form.auditorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="UDI码" prop="ztm">
                    <el-input v-model="form.ztm"
                              placeholder="请扫描UDI码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="辅条码" prop="ftm">
                    <el-input v-model="form.ftm"
                              placeholder="请扫描辅条码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm2"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>高值备货入库明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry">删除</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border
                          height="48vh">
                  <el-table-column type="selection" width="60" align="center" />
                  <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材" prop="materialName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialName }}
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
                  <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.price ? parseFloat(scope.row.price).toFixed(2) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNumber" placeholder="请输入批号" />
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-date-picker clearable
                                      v-model="scope.row.beginTime"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :picker-options="pickerBeginTimeOptions"
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
                                      :picker-options="pickerEndTimeOptions"
                                      placeholder="请选择有效期">
                      </el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column label="UDI码" prop="masterBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.masterBarcode" :disabled="true" placeholder="请输入UDI码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" prop="secondaryBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.secondaryBarcode" :disabled="true" placeholder="请输入辅条码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
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

    <!-- 3、使用组件 -->
    <SelectGZMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGZMaterialFilter>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listMaterial,jxFtm,jxTm} from "@/api/foundation/material";
import { listUserAll } from "@/api/system/user";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter';
import item from "@/layout/components/Sidebar/Item.vue";

export default {
  name: "Order",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectGZMaterialFilter},
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
      checkedGzOrderEntry: [],
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
      // 高值入库表格数据
      orderList: [],
      // 高值退货明细表格数据
      gzOrderEntryList: [],
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
        supplerId: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 用户列表
      userOptions: [],
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        orderDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    // 设置订单类型为入库（备货验收），过滤掉出库单据
    this.queryParams.orderType = 101;
    this.getList();
    this.getUserList();
  },
  methods: {
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查询高值入库列表 */
    sm(){
      const obj=jxTm(this.form.ztm);
      const tmh=obj.ztm;
      const ph=obj.ph;
      const yxq=obj.yxq;
      const ftm=obj.ftm;
      const scrq=obj.scrq;
      const udiinfo={
          "udiNo":this.form.ztm
      }
      listMaterial(udiinfo).then(response => {
        response.rows.forEach((item, index) => {
          let obj = {};
          obj.materialId = item.id;
          obj.materialName = item.name || ""; // 保存耗材名称
          obj.qty = "";
          obj.price = item.price;
          obj.amt = "";
          obj.batchNo = "";
          obj.batchNumber = "";
          obj.beginTime = "";
          obj.endTime = "";
          obj.remark = "";
          obj.masterBarcode = item.udiNo;
          obj.secondaryBarcode = "";
          obj.udiNo = item.udiNo || ""; // 保存UDI码
          this.gzOrderEntryList.push(obj);
        });
      });
    }
    ,sm2(){
      const length = this.checkedGzOrderEntry.length
      if (length < 1){
        this.$modal.msgError("请先选择明细数据");
      } else {
        const obj=jxFtm(this.form.ftm);
        for (let i = 0; i < length; i++) {
          const index = this.checkedGzOrderEntry[i];
          this.gzOrderEntryList[index].batchNo = obj.batchNo;
          this.gzOrderEntryList[index].secondaryBarcode = obj.ftm;
          this.gzOrderEntryList[index].endTime = obj.yxq;
        }
      }
    }
    ,getList() {
      this.loading = true;
      // 确保只查询入库类型（备货验收），过滤掉出库类型（备货出库）
      this.queryParams.orderType = 101;
      listOrder(this.queryParams).then(response => {
        // 额外过滤：确保不显示GZCK开头的出库单号
        const filteredRows = response.rows.filter(row => {
          const orderNo = row.orderNo || '';
          // 过滤掉GZCK开头的出库单号
          return !orderNo.startsWith('GZCK');
        });
        this.orderList = filteredRows;
        this.total = filteredRows.length;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.id;
        obj.materialName = item.name || ""; // 保存耗材名称
        obj.qty = "1"; // 默认数量为1
        // 设置价格：优先使用item.price
        obj.price = item.price || 0;
        // 自动计算金额：数量 * 价格
        obj.amt = (obj.qty && obj.price) ? (parseFloat(obj.qty) * parseFloat(obj.price)).toFixed(2) : "0.00";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";
        obj.masterBarcode = item.udiNo || ""; // UDI码赋值给masterBarcode字段用于显示
        obj.secondaryBarcode = "";
        obj.udiNo = item.udiNo || ""; // 保存UDI码
        this.gzOrderEntryList.push(obj);
      });
    },
    //当天日期
    getOrderDate(){
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
        supplerId: null,
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null

      };
      this.gzOrderEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
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
      this.queryParams.orderStatus = null;
      // 重置后确保orderType为入库类型（备货验收）
      this.queryParams.orderType = 101;
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
      getOrder(id).then(response => {
        this.form = response.data;
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 如果有materialList，为每个entry添加materialName
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            materialMap[material.id] = material.name;
          });
          this.gzOrderEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              entry.materialName = materialMap[entry.materialId];
            }
            // 确保masterBarcode有值，优先使用masterBarcode，其次使用udiNo
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
            }
          });
        } else {
          // 即使没有materialList，也要确保masterBarcode有值
          this.gzOrderEntryList.forEach(entry => {
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
        }
          });
        }
        // 设置制单人和审核人姓名
        this.form.creatorName = this.getCreatorName(this.form);
        this.form.auditorName = this.getAuditorName(this.form);
        this.open = true;
        this.action = false;
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.title = "查看高值备货入库";
      });
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      if (row.createBy) {
        const user = this.userOptions.find(u => u.userName === row.createBy || u.userId === row.createBy);
        return user ? (user.nickName || user.userName) : row.createBy;
      }
      return '';
    },
    /** 获取审核人姓名 */
    getAuditorName(row) {
      if (row.updateBy) {
        // 审核人通常是updateBy（审核操作时更新）
        const user = this.userOptions.find(u => {
          return u.userName === row.updateBy || 
                 u.userId === row.updateBy ||
                 u.userId == row.updateBy ||
                 String(u.userId) === String(row.updateBy);
        });
        if (user) {
          return user.nickName || user.userName;
        }
        // 如果updateBy不是纯数字，可能是姓名，直接返回
        if (!/^\d+$/.test(String(row.updateBy))) {
          return row.updateBy;
        }
        return row.updateBy;
      }
      return '';
    },
    /** 打印条码按钮操作 */
    handlePrintBarcode(row) {
      const id = row.id;
      getOrder(id).then(response => {
        const orderData = response.data;
        const entryList = orderData.gzOrderEntryList || [];
        const materialList = orderData.materialList || [];
        const warehouseId = orderData.warehouseId;
        
        if (entryList.length === 0) {
          this.$modal.msgWarning("该订单没有明细数据，无法打印条码");
          return;
        }
        
        if (!warehouseId) {
          this.$modal.msgWarning("该订单没有仓库信息，无法打印条码");
          return;
        }
        
        // 构建物料映射
        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });
        
        // 查询库存信息，获取所有院内码
        // 通过订单号过滤，确保只获取该订单生成的库存记录
        const queryParams = {
          warehouseId: warehouseId,
          orderNo: orderData.orderNo, // 添加订单号过滤
          pageNum: 1,
          pageSize: 10000
        };
        
        console.log('查询库存参数:', queryParams);
        
        listDepotInventory(queryParams).then(invResponse => {
          const inventoryList = invResponse.rows || [];
          
          console.log('查询到的库存列表:', inventoryList);
          console.log('订单明细列表:', entryList);
          
          // 构建批次号和物料ID组合键到院内码列表的映射
          // 因为同一个批次号可能对应不同的物料，所以需要同时匹配批次号和物料ID
          const keyToInHospitalCodes = {};
          inventoryList.forEach(inv => {
            if (inv.batchNo && inv.inHospitalCode && inv.materialId) {
              // 使用批次号+物料ID作为键，确保精确匹配
              const key = `${inv.batchNo}_${inv.materialId}`;
              if (!keyToInHospitalCodes[key]) {
                keyToInHospitalCodes[key] = [];
              }
              keyToInHospitalCodes[key].push(inv.inHospitalCode);
            }
          });
          
          console.log('构建的院内码映射:', keyToInHospitalCodes);
          
          // 收集所有需要打印的条码数据
          const allBarcodesToPrint = [];
          entryList.forEach((item, entryIndex) => {
            const material = materialMap[item.materialId] || {};
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            
            console.log(`明细项 ${entryIndex + 1}:`, {
              batchNo: batchNo,
              materialId: materialId,
              qty: qty,
              item: item
            });
            
            // 使用批次号+物料ID作为键来获取院内码列表
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            
            console.log(`找到的院内码列表 (${key}):`, inHospitalCodes);
            
            // 根据数量生成条码，如果数量是10则生成10个条码
            const codesToPrint = inHospitalCodes.slice(0, qty);
            
            console.log(`需要打印的院内码数量: ${codesToPrint.length}, 明细数量: ${qty}`);
            
            if (codesToPrint.length === 0) {
              console.warn(`批次号 ${batchNo}, 物料ID ${materialId} 没有找到院内码，跳过打印`);
              this.$modal.msgWarning(`批次号 ${batchNo} 没有找到院内码，无法打印条码`);
              return;
            }
            
            if (codesToPrint.length < qty) {
              console.warn(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但明细数量是 ${qty}`);
              this.$modal.msgWarning(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但需要打印 ${qty} 个条码`);
            }
            
            // 为每个院内码收集打印数据
            codesToPrint.forEach((inHospitalCode, codeIndex) => {
              allBarcodesToPrint.push({
                inHospitalCode: inHospitalCode,
                item: item,
                material: material
              });
            });
          });
          
          console.log(`总共需要打印 ${allBarcodesToPrint.length} 个条码`);
          
          if (allBarcodesToPrint.length === 0) {
            this.$modal.msgWarning("没有找到可打印的条码");
            return;
          }
          
          // 构建单个打印页面，包含所有条码，每个条码占一页
          let printContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>打印条码</title>';
          printContent += '<style>';
          printContent += '@page {size: 6cm 4cm;margin: 0;}';
          printContent += '*{margin:0;padding:0;box-sizing:border-box;}';
          printContent += 'body{font-family:"Microsoft YaHei",Arial,SimSun,sans-serif;}';
          printContent += '.barcode-page{width:57mm;height:37mm;margin:0;padding:1.5mm;page-break-after:always;page-break-inside:avoid;}';
          printContent += '.barcode-page:last-child{page-break-after:auto;}';
          printContent += '.container{width:100%;height:100%;border:2px solid #000;display:flex;flex-direction:column;}';
          printContent += '.title{text-align:center;font-weight:bold;font-size:11px;padding:1.5mm 0;border-bottom:1px solid #000;background-color:#fff;}';
          printContent += '.content{flex:1;display:flex;flex-direction:column;height:calc(100% - 12px);}';
          printContent += '.top-section{display:flex;flex:1;}';
          printContent += '.left-info{width:70%;border-right:1px solid #000;padding:0;}';
          printContent += '.right-qrcode{width:30%;display:flex;align-items:center;justify-content:center;padding:0.5mm 2mm;border-right:0.1px solid #000;margin-right:-1px;position:relative;right:-1px;height:75%;align-self:flex-start;margin-top:2mm;}';
          printContent += '.bottom-section{width:100%;display:flex;}';
          printContent += '.bottom-left{width:70%;border-right:1px solid #000;padding:0;}';
          printContent += '.bottom-right{width:30%;padding:0;}';
          printContent += '.info-table{width:100%;border-collapse:collapse;height:100%;}';
          printContent += '.info-table td{border:none;padding:0.5mm 1.5mm;font-size:8px;line-height:1.1;}';
          printContent += '.label-cell{width:30%;font-weight:bold;background-color:#f9f9f9;text-align:left;vertical-align:middle;padding-left:1.5mm;white-space:nowrap;}';
          printContent += '.value-cell{width:70%;text-align:left;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:1.5mm;}';
          printContent += '.bottom-table{width:100%;border-collapse:collapse;}';
          printContent += '.bottom-table td{border:none;padding:0.5mm 1.5mm;font-size:8px;line-height:1.1;}';
          printContent += '.bottom-label{width:30%;font-weight:bold;background-color:#f9f9f9;text-align:left;vertical-align:middle;padding-left:1.5mm;white-space:nowrap;}';
          printContent += '.bottom-value{width:70%;text-align:left;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-left:1.5mm;}';
          printContent += '.qrcode-img{max-width:40%;max-height:40%;width:auto;height:auto;object-fit:contain;display:block;}';
          printContent += '.qrcode-placeholder{font-size:9px;color:#999;}';
          printContent += '@media print{body{margin:0;padding:0;}@page{margin:0;size:6cm 4cm;}';
          printContent += '.barcode-page{page-break-after:always;}}';
          printContent += '</style>';
          printContent += '</head><body>';
          
          // 为每个条码生成一页
          allBarcodesToPrint.forEach((barcodeData, index) => {
            const { inHospitalCode, item, material } = barcodeData;
            
            printContent += '<div class="barcode-page">';
            printContent += '<div class="container">';
            
            // 标题
            printContent += '<div class="title">高值院内码</div>';
            
            // 内容区域
            printContent += '<div class="content">';
            
            // 上半部分：前5行信息 + 二维码
            printContent += '<div class="top-section">';
            
            // 左侧信息（前5行）
            printContent += '<div class="left-info">';
            printContent += '<table class="info-table">';
            
            // 品名
            const materialName = item.materialName || material.name || '';
            printContent += '<tr><td class="label-cell">品名</td><td class="value-cell">' + materialName + '</td></tr>';
            // 批号
            printContent += '<tr><td class="label-cell">批号</td><td class="value-cell">' + (item.batchNumber || '') + '</td></tr>';
            // 单价
            printContent += '<tr><td class="label-cell">单价</td><td class="value-cell">' + (item.price ? parseFloat(item.price).toFixed(2) : '') + '</td></tr>';
            // 有效期
            printContent += '<tr><td class="label-cell">有效期</td><td class="value-cell">' + (item.endTime || '') + '</td></tr>';
            // 规格
            printContent += '<tr><td class="label-cell">规格</td><td class="value-cell">' + (material.speci || '') + '</td></tr>';
            
            printContent += '</table>';
            printContent += '</div>';
            
            // 右侧二维码
            printContent += '<div class="right-qrcode">';
            if (inHospitalCode) {
              // 生成120x120的二维码，通过CSS进一步缩小显示
              const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(inHospitalCode);
              printContent += '<img src="' + qrCodeUrl + '" alt="二维码" class="qrcode-img" />';
            } else {
              printContent += '<div class="qrcode-placeholder">二维码</div>';
            }
            printContent += '</div>';
            
            printContent += '</div>'; // top-section
            
            // 下半部分：厂家和院内码（两列布局）
            printContent += '<div class="bottom-section">';
            
            // 左侧：厂家和院内码
            printContent += '<div class="bottom-left">';
            printContent += '<table class="bottom-table">';
            
            // 厂家
            const factoryName = (material.fdFactory && material.fdFactory.factoryName) ? material.fdFactory.factoryName : '';
            printContent += '<tr><td class="bottom-label">厂家</td><td class="bottom-value">' + factoryName + '</td></tr>';
            // 院内码 - 显示从库存表查询到的院内码
            printContent += '<tr><td class="bottom-label">院内码</td><td class="bottom-value">' + (inHospitalCode || '') + '</td></tr>';
            
            printContent += '</table>';
            printContent += '</div>'; // bottom-left
            
            // 右侧：空白区域（与二维码区域对齐）
            printContent += '<div class="bottom-right"></div>';
            
            printContent += '</div>'; // bottom-section
            
            printContent += '</div>'; // content
            printContent += '</div>'; // container
            printContent += '</div>'; // barcode-page
          });
          
          printContent += '</body></html>';
          
          // 只打开一个打印窗口，包含所有条码
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onload = function() {
              printWindow.print();
            };
            console.log(`成功打开打印窗口，包含 ${allBarcodesToPrint.length} 个条码`);
            this.$modal.msgSuccess(`成功生成 ${allBarcodesToPrint.length} 个条码，请查看打印预览`);
          } else {
            console.error('打印窗口被浏览器阻止');
            this.$modal.msgError('打印窗口被浏览器阻止，请允许弹窗后重试');
          }
          
          // 统计总共需要打印的条码数量
          let totalBarcodes = 0;
          entryList.forEach((item) => {
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            const codesToPrint = inHospitalCodes.slice(0, qty);
            totalBarcodes += codesToPrint.length;
          });
          
          console.log(`总共需要打印 ${totalBarcodes} 个条码`);
          
          if (totalBarcodes > 0) {
            this.$modal.msgSuccess(`正在生成 ${totalBarcodes} 个条码，请允许浏览器弹窗`);
          } else {
            this.$modal.msgWarning("没有找到可打印的条码");
          }
        }).catch(() => {
          this.$modal.msgError("查询库存信息失败");
        });
      }).catch(() => {
        this.$modal.msgError("获取订单信息失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加高值备货入库";
      this.form.orderStatus = '1';
      this.form.orderType = '101';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.orderDate = this.getOrderDate();
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.gzOrderEntryList = response.data.gzOrderEntryList;
        this.open = true;
        this.title = "修改高值入库";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除高值入库编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据项");
        return;
      }
      // 检查选中的订单是否都是未审核状态
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '1' && item.orderStatus !== 1);
      
      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核未审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }
      
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$modal.confirm('确定要审核选中的 ' + ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = ids.map(id => auditOrder({id: id}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
	/** 高值退货明细序号 */
    rowGzOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzOrderEntry() {
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
      obj.masterBarcode = "";
      obj.secondaryBarcode = "";
      this.gzOrderEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzOrderEntry() {
      if (this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzOrderEntryList = this.gzOrderEntryList;
        const checkedGzOrderEntry = this.checkedGzOrderEntry;
        this.gzOrderEntryList = gzOrderEntryList.filter(function(item) {
          return checkedGzOrderEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      this.checkedGzOrderEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/order/export', {
        ...this.queryParams
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 确保页面容器有相对定位 */
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
</style>
