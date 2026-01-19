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
              v-model="queryParams.goodsDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="制单日期"
              clearable
              style="width: 180px; margin-right: 8px;"
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
                         v-if="dict.value != 1"
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
          size="medium"
          @click="handleAdd"
          v-hasPermi="['gzOrder:goodsApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['gzOrder:goodsApply:export']"
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
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-check"
          size="medium"
          :disabled="single"
          @click="handleAudit"
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
      <el-table-column label="供应商" align="center" prop="supplier.name" show-overflow-tooltip resizable />
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="goodsDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.goodsDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.totalAmt != null && scope.row.totalAmt !== undefined) ? parseFloat(scope.row.totalAmt).toFixed(2) : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="goodsStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.goodsStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="审核人" align="center" prop="auditBy" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.goodsStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['gzOrder:goodsApply:edit']"
              v-if="scope.row.goodsStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['gzOrder:goodsApply:remove']"
              v-if="scope.row.goodsStatus != 2"
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

    <!-- 添加或修改高值退货对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <div class="form-fields-container">
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
              <el-form-item label="供应商" prop="supplerId">
                <SelectSupplier v-model="form.supplerId" :disabled="!action"/>
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
              <el-form-item label="制单日期" prop="goodsDate">
                <el-date-picker clearable
                                v-model="form.goodsDate"
                                type="date"
                                :disabled="true"
                                value-format="yyyy-MM-dd"
                                style="width: 140px"
                                placeholder="请选择制单日期">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="制单人" prop="createBy">
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
        </div>

        <div class="modal-body">
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>退货明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzRefundGoodsEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" icon="el-icon-check" size="small" @click="submitForm">保存</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="gzRefundGoodsEntryList" :row-class-name="rowGzRefundGoodsEntryIndex"
                  @selection-change="handleGzRefundGoodsEntrySelectionChange"
                  ref="gzRefundGoodsEntry" border height="calc(95vh - 380px)">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || scope.row.materialCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材名称" prop="materialName" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unitName || (scope.row.unit && scope.row.unit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="院内码" align="center" prop="inHospitalCode" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="UDI码" align="center" prop="udiNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.udiNo) || scope.row.udiNo || scope.row.masterBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="certificateNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.certificateNo) || scope.row.certificateNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号有效期" align="center" prop="certificateExpiryDate" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.expiryDate">{{ parseTime(scope.row.material.fdCertificate.expiryDate, '{y}-{m}-{d}') }}</span>
              <span v-else-if="scope.row.certificateExpiryDate">{{ parseTime(scope.row.certificateExpiryDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
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

    <!-- 3、使用组件 -->
    <SelectGzDepotInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGzDepotInventory>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" :printType="'refund'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>
  </div>
</template>

<script>
import { listGoods, getGoods, delGoods, addGoods, updateGoods, auditGoods } from "@/api/gz/goods";
import { parseTime } from "@/utils/ruoyi";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectGzDepotInventory from '@/components/SelectModel/SelectGzDepotInventory';
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";
import RMBConverter from "@/utils/tools";

export default {
  name: "Goods",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectGzDepotInventory,gzOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      supplierValue: "",
      isShow: true,
      // 打印数据（用于隐藏的打印组件）
      printRowData: null,
      // 打印方向，默认横向
      printOrientation: 'landscape',
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzRefundGoodsEntry: [],
      // 非单个禁用
      single: true,
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
        supplerId: null,
        goodsDate: null,
        warehouseId: null,
        goodsStatus: null,
        goodsType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询高值退货列表 */
    getList() {
      this.loading = true;
      // 备货退货页面：只显示GZTH-开头的单号
      const params = {
        ...this.queryParams
      };
      // 如果用户输入了单号，确保以GZTH-开头
      if (params.goodsNo && !params.goodsNo.startsWith('GZTH-')) {
        params.goodsNo = 'GZTH-' + params.goodsNo;
      } else if (!params.goodsNo) {
        // 如果没有输入单号，默认搜索GZTH-开头的
        params.goodsNo = 'GZTH-';
      }
      listGoods(params).then(response => {
        // 过滤结果，只显示GZTH-开头的单号
        if (response.rows) {
          response.rows = response.rows.filter(row => row.goodsNo && row.goodsNo.startsWith('GZTH-'));
          response.total = response.rows.length;
        }
        this.goodsList = response.rows;
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
      //监听"弹窗组件"返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.materialId || (item.material && item.material.id);
        obj.material = item.material; // 保存完整的material对象
        obj.materialName = (item.material && item.material.name) || item.materialName || "";
        obj.materialCode = (item.material && item.material.code) || item.materialCode || "";
        obj.speci = (item.material && item.material.speci) || item.speci || "";
        obj.model = (item.material && item.material.model) || item.model || "";
        obj.unitName = (item.material && item.material.fdUnit && item.material.fdUnit.unitName) || item.unitName || "";
        obj.qty = item.qty || "";
        obj.price = item.unitPrice || item.price || "";
        obj.amt = item.amt || (obj.qty && obj.price ? (parseFloat(obj.qty) * parseFloat(obj.price)).toFixed(2) : "");
        obj.batchNo = item.batchNo || "";
        obj.batchNumber = item.materialNo || item.batchNumber || "";
        obj.beginTime = item.materialDate || item.beginTime || "";
        obj.endTime = item.endTime || "";
        obj.inHospitalCode = item.inHospitalCode || "";
        obj.udiNo = (item.material && item.material.udiNo) || item.udiNo || item.masterBarcode || "";
        obj.factoryName = (item.material && item.material.fdFactory && item.material.fdFactory.factoryName) || item.factoryName || "";
        obj.certificateNo = (item.material && item.material.fdCertificate && item.material.fdCertificate.certificateNo) || item.certificateNo || "";
        obj.certificateExpiryDate = (item.material && item.material.fdCertificate && item.material.fdCertificate.expiryDate) || item.certificateExpiryDate || "";
        obj.remark = "";

        this.gzRefundGoodsEntryList.push(obj);
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
        goodsNo: null,
        supplerId: null,
        goodsDate: null,
        warehouseId: null,
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
      getGoods(id).then(response => {
        this.form = response.data;
        this.gzRefundGoodsEntryList = response.data.gzRefundGoodsEntryList || [];
        // 映射material对象到每个entry
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzRefundGoodsEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              entry.material = materialMap[entry.materialId];
            }
          });
        }
        this.open = true;
        this.action = false;
        this.form.goodsStatus = '1';
        this.form.goodsType = '301';
        this.title = "查看高值退货";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加高值退货";
      this.form.goodsStatus = '1';
      this.form.goodsType = '301';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.goodsDate = this.getBillDate();
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getGoods(id).then(response => {
        this.form = response.data;
        this.gzRefundGoodsEntryList = response.data.gzRefundGoodsEntryList || [];
        // 映射material对象到每个entry
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzRefundGoodsEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              entry.material = materialMap[entry.materialId];
            }
          });
        }
        this.open = true;
        this.title = "修改高值退货";
        this.form.goodsStatus = '1';
        this.form.goodsType = '301';
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzRefundGoodsEntryList = this.gzRefundGoodsEntryList;
          if (this.form.id != null) {
            updateGoods(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // 不关闭弹窗，刷新列表数据
              this.getList();
              // 重新获取最新数据以更新表单
              getGoods(this.form.id).then(res => {
                this.form = res.data;
                this.gzRefundGoodsEntryList = res.data.gzRefundGoodsEntryList || [];
                // 映射material对象到每个entry
                if (res.data.materialList && res.data.materialList.length > 0) {
                  const materialMap = {};
                  res.data.materialList.forEach(material => {
                    if (material.id) {
                      materialMap[material.id] = material;
                    }
                  });
                  this.gzRefundGoodsEntryList.forEach(entry => {
                    if (entry.materialId && materialMap[entry.materialId]) {
                      entry.material = materialMap[entry.materialId];
                    }
                  });
                }
              });
            });
          } else {
            addGoods(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 不关闭弹窗，刷新列表数据
              this.getList();
              // 如果是新增，保存后获取新创建的ID并更新表单
              if (response.data && response.data.id) {
                getGoods(response.data.id).then(res => {
                  this.form = res.data;
                  this.form.id = res.data.id;
                  this.gzRefundGoodsEntryList = res.data.gzRefundGoodsEntryList || [];
                  // 映射material对象到每个entry
                  if (res.data.materialList && res.data.materialList.length > 0) {
                    const materialMap = {};
                    res.data.materialList.forEach(material => {
                      if (material.id) {
                        materialMap[material.id] = material;
                      }
                    });
                    this.gzRefundGoodsEntryList.forEach(entry => {
                      if (entry.materialId && materialMap[entry.materialId]) {
                        entry.material = materialMap[entry.materialId];
                      }
                    });
                  }
                  // 更新标题为修改
                  this.title = "修改高值退货";
                });
              }
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除高值退货编号为"' + ids + '"的数据项？').then(function() {
        return delGoods(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const id = this.ids.length > 0 ? this.ids[0] : null;
      if (!id) {
        this.$modal.msgError('请先选择要审核的数据');
        return;
      }
      this.$modal.confirm('确定要审核选中的数据项？').then(() => {
        return auditGoods({id: id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {});
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      // 如果传入 print 参数为 true，直接执行打印
      if (print === true) {
        // 直接获取数据并触发打印
        this.getOrderDetail(row).then(res => {
          // 验证数据完整性
          if (!res || !res.detailList || res.detailList.length === 0) {
            this.$modal.msgWarning('打印数据不完整，请重试');
            return;
          }
          // 设置打印数据
          this.printRowData = res;
          // 设置默认方向为横向
          this.printOrientation = 'landscape';
          // 等待组件渲染后调用 start()
          this.$nextTick(() => {
            this.$nextTick(() => {
              if (this.$refs['receiptOrderPrintRefAuto']) {
                // start() 方法会直接触发浏览器打印对话框
                this.$refs['receiptOrderPrintRefAuto'].start();
              } else {
                this.$modal.msgError('打印组件未找到，请刷新页面重试');
              }
            });
          });
        }).catch(error => {
          this.$modal.msgError('获取打印数据失败：' + (error.message || '未知错误'));
        });
        return;
      }
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
            batchNumber: item.batchNumber || item.batchNo,
            amt: item.amt,
            qty: item.qty,
            price: item.price,
            materialCode: prod ? prod.code : '',
            materialName: prod ? prod.name : '',
            materialSpeci: prod ? prod.speci : '',
            periodDate: prod ? prod.periodDate : '',
            factoryName: prod && prod.fdFactory ? prod.fdFactory.factoryName : '',
            warehouseCategoryName: prod && prod.fdWarehouseCategory ? prod.fdWarehouseCategory.warehouseCategoryName : '',
          })

        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        return {
          orderNo: row.goodsNo,
          supplierName: row.supplier ? row.supplier.name : '',
          warehouseName: row.warehouse ? row.warehouse.name : '',
          orderDate: row.goodsDate,
          auditDate: row.auditDate,
          totalAmt: totalAmt,
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList: detailList
        }
      })
    },
    /** 高值退货列表序号 */
    goodsListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
	/** 高值退货明细序号 */
    rowGzRefundGoodsEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 计算总金额 */
    getTotalAmount() {
      let total = 0;
      if (this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0) {
        this.gzRefundGoodsEntryList.forEach(item => {
          if (item.amt) {
            total += parseFloat(item.amt) || 0;
          }
        });
      }
      return total.toFixed(2);
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

<style scoped lang="scss">
/* 弹窗遮罩层 */
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
  height: 95vh;
  max-height: 95vh;
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
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  border: none;
  background: transparent;
  color: #909399;
  padding: 5px 15px;
}

.close-btn:hover {
  color: #303133;
  background: #E4E7ED;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s;
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active,
.modal-zoom-leave-active {
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

/* 弹窗内表单字段容器 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: calc(95vh - 380px);
  max-height: calc(95vh - 380px);
  min-height: 400px;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
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
