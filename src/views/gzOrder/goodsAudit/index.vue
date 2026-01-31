<template>
  <div class="app-container refund-goods-audit-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="退库单号" prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="请输入退库单号"
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
          <el-form-item label="单据状态" prop="orderStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.orderStatus" placeholder="全部"
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

    <el-row :gutter="10" class="mb8 button-row-compact">
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
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['gzOrder:goodsAudit:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['gzOrder:goodsAudit:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="medium"
          @click="handleBatchAudit"
          v-hasPermi="['gzOrder:goodsAudit:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" class="table-compact"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="退库单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.totalAmt != null && scope.row.totalAmt !== undefined) ? parseFloat(scope.row.totalAmt).toFixed(2) : formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handlePrint(scope.row,true)"
            v-if="scope.row.orderStatus == 2"
          >打印</el-button>
          <template v-if="scope.row.orderStatus != 2">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['gzOrder:goodsAudit:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['gzOrder:goodsAudit:remove']"
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

    <!-- 添加或修改高值退货对话框 -->
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
            <el-form-item label="科室" prop="departmentId">
              <!-- 修改时科室字段禁用，保留之前的科室 -->
              <!-- 如果是修改模式（有ID），则禁用科室字段 -->
              <SelectDepartment v-model="form.departmentId" :value2="form.id != null"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="orderStatus">
              <el-select v-model="form.orderStatus" placeholder="请选择单据状态"
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
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" style="width: 140px" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="退库类型" prop="orderType">
              <el-select v-model="form.orderType" placeholder="请选择退库类型"
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
            <span>备货退库明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
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
                  border height="48vh">
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

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="form.departmentId"
      :useDepInventory="true"
      :gzOrderEntryList="gzOrderEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>
  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder} from "@/api/gz/order";
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';

export default {
  name: "GoodsAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzOrderEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 高值退货表格数据
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
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        auditDate: null,
        beginDate: null,
        endDate: null,
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
      // 设置退库类型
      this.queryParams.orderType = 301;
      listOrder(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    formatTotalAmt(row) {
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        const total = row.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    getTotalAmount() {
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        const total = this.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    handleBatchAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgWarning('请选择要审核的数据');
        return;
      }
      this.$modal.confirm('确定要审核选中的数据项？').then(() => {
        return auditOrder({ids: ids, orderType: 301});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功！");
      }).catch(() => {});
    },
    handlePrint(row, flag) {
      // 打印功能待实现
      this.$message.info('打印功能待实现');
    },
    checkMaterialBtn() {
      // 检查是否选择了科室
      if (!this.form.departmentId) {
        this.$message.warning('请先选择科室');
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
        orderDate: null,
        warehouseId: null,
        departmentId: null,
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
      // 重置后保持orderType
      this.queryParams.orderType = 301;
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
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, 301).then(response => {
        this.form = response.data;
        // 确保科室ID正确设置
        if (response.data.departmentId) {
          this.form.departmentId = response.data.departmentId;
        }
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzOrderEntryList.forEach(entry => {
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
        this.form.orderStatus = '1';
        this.form.orderType = '301';
        this.title = "查看高值退库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加高值退库";
      this.form.orderStatus = '1';
      this.form.orderType = '301';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.orderDate = this.getOrderDate();
      this.action = true;
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditOrder({id: id, orderType: 301});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核退库成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, 301).then(response => {
        console.log('获取退库单详情 - 原始响应:', response.data);
        this.form = response.data;
        // 确保科室ID正确设置（支持多种可能的字段名）
        if (response.data.departmentId) {
          // 确保科室ID是数字类型（SelectDepartment组件需要）
          this.form.departmentId = typeof response.data.departmentId === 'string' 
            ? parseInt(response.data.departmentId) 
            : response.data.departmentId;
        } else if (response.data.department && response.data.department.id) {
          this.form.departmentId = typeof response.data.department.id === 'string'
            ? parseInt(response.data.department.id)
            : response.data.department.id;
        }
        console.log('设置后的科室ID:', this.form.departmentId, '类型:', typeof this.form.departmentId);
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        console.log('明细列表数量:', this.gzOrderEntryList.length);
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzOrderEntryList.forEach(entry => {
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
        // 调试：打印关键信息
        console.log('修改退库单 - 科室ID:', this.form.departmentId);
        console.log('修改退库单 - 明细列表:', this.gzOrderEntryList.map(e => ({
          id: e.id,
          materialId: e.materialId,
          batchNo: e.batchNo,
          inHospitalCode: e.inHospitalCode
        })));
        
        // 如果是退库单，从科室库存中查询院内码
        console.log('准备查询院内码 - 科室ID:', this.form.departmentId, '明细数量:', this.gzOrderEntryList.length);
        if (this.form.departmentId && this.gzOrderEntryList.length > 0) {
          // 先查询所有科室库存数据
          listGzDepInventory({
            departmentId: this.form.departmentId,
            pageNum: 1,
            pageSize: 1000
          }).then(invResponse => {
            console.log('查询科室库存结果 - 总数:', invResponse.total);
            console.log('查询科室库存结果 - 数据行数:', invResponse.rows ? invResponse.rows.length : 0);
            console.log('查询科室库存结果 - 前5条数据:', invResponse.rows ? invResponse.rows.slice(0, 5) : []);
            
            // 构建院内码映射：使用 materialId_batchNo 作为键，存储所有匹配的院内码
            const inHospitalCodeMap = {};
            if (invResponse.rows && invResponse.rows.length > 0) {
              invResponse.rows.forEach((inv, invIndex) => {
                // 确保数据正确获取，统一转换为字符串进行比较
                const materialId = inv.materialId || (inv.material && inv.material.id);
                const batchNo = inv.batchNo ? String(inv.batchNo).trim() : null;
                const inHospitalCode = inv.inHospitalCode ? String(inv.inHospitalCode).trim() : null;
                
                if (invIndex < 5) {
                  console.log(`科室库存项 ${invIndex}:`, { 
                    materialId, 
                    batchNo, 
                    inHospitalCode,
                    rawMaterialId: inv.materialId,
                    rawBatchNo: inv.batchNo,
                    rawInHospitalCode: inv.inHospitalCode
                  });
                }
                
                if (materialId && batchNo && inHospitalCode && inHospitalCode !== '') {
                  // 统一使用字符串类型作为键，确保匹配
                  const materialIdStr = String(materialId);
                  const codeKey = `${materialIdStr}_${batchNo}`;
                  if (!inHospitalCodeMap[codeKey]) {
                    inHospitalCodeMap[codeKey] = [];
                  }
                  inHospitalCodeMap[codeKey].push(inHospitalCode);
                }
              });
            }
            console.log('院内码映射表（前10个键）:', Object.keys(inHospitalCodeMap).slice(0, 10).reduce((obj, key) => {
              obj[key] = inHospitalCodeMap[key];
              return obj;
            }, {}));
            
            // 为每个entry设置院内码
            let matchedCount = 0;
            this.gzOrderEntryList.forEach((entry, entryIndex) => {
              const entryMaterialId = entry.materialId ? String(entry.materialId) : null;
              const entryBatchNo = entry.batchNo ? String(entry.batchNo).trim() : null;
              
              console.log(`处理明细项 ${entryIndex}:`, {
                materialId: entryMaterialId,
                batchNo: entryBatchNo,
                currentInHospitalCode: entry.inHospitalCode,
                rawMaterialId: entry.materialId,
                rawBatchNo: entry.batchNo
              });
              
              // 如果已经有院内码，保留它
              if (entry.inHospitalCode && String(entry.inHospitalCode).trim() !== '' && entry.inHospitalCode !== '--') {
                console.log(`明细项 ${entryIndex} - 保留已有院内码: ${entry.inHospitalCode}`);
                return;
              }
              
              // 如果没有院内码，从科室库存中查找
              if (entryMaterialId && entryBatchNo) {
                const codeKey = `${entryMaterialId}_${entryBatchNo}`;
                console.log(`明细项 ${entryIndex} - 查找键: ${codeKey}`);
                console.log(`明细项 ${entryIndex} - 映射表中是否有数据:`, inHospitalCodeMap[codeKey]);
                
                if (inHospitalCodeMap[codeKey] && inHospitalCodeMap[codeKey].length > 0) {
                  // 取第一个匹配的院内码
                  entry.inHospitalCode = inHospitalCodeMap[codeKey][0];
                  matchedCount++;
                  console.log(`明细项 ${entryIndex} - 设置院内码成功: ${entry.inHospitalCode}`);
                } else {
                  console.log(`明细项 ${entryIndex} - 未找到匹配的院内码 (materialId: ${entryMaterialId}, batchNo: ${entryBatchNo})`);
                  // 尝试模糊匹配（去掉前后空格）
                  const fuzzyKey = Object.keys(inHospitalCodeMap).find(key => {
                    const [matId, batNo] = key.split('_');
                    return matId === entryMaterialId && batNo && batNo.trim() === entryBatchNo;
                  });
                  if (fuzzyKey && inHospitalCodeMap[fuzzyKey] && inHospitalCodeMap[fuzzyKey].length > 0) {
                    entry.inHospitalCode = inHospitalCodeMap[fuzzyKey][0];
                    matchedCount++;
                    console.log(`明细项 ${entryIndex} - 模糊匹配成功: ${entry.inHospitalCode}`);
                  }
                }
              } else {
                console.log(`明细项 ${entryIndex} - 缺少必要字段 (materialId: ${entryMaterialId}, batchNo: ${entryBatchNo})`);
              }
            });
            console.log(`院内码匹配完成 - 成功匹配 ${matchedCount} 条`);
            
            // 打开对话框并更新视图
            this.$nextTick(() => {
              this.open = true;
              this.title = "修改高值退库";
              this.form.orderStatus = '1';
              this.form.orderType = '301';
              this.action = true;
              // 强制更新视图
              this.$forceUpdate();
            });
          }).catch(error => {
            console.error('查询科室库存失败:', error);
            console.error('错误详情:', error.response || error.message);
            // 即使查询失败，也要打开对话框
            this.$nextTick(() => {
              this.open = true;
              this.title = "修改高值退库";
              this.form.orderStatus = '1';
              this.form.orderType = '301';
              this.action = true;
              console.log('打开对话框（查询失败） - 科室ID:', this.form.departmentId);
              this.$forceUpdate();
            });
          });
        } else {
          // 如果没有科室ID或明细列表为空，直接打开对话框
          console.warn('跳过院内码查询 - 科室ID:', this.form.departmentId, '明细数量:', this.gzOrderEntryList.length);
          if (!this.form.departmentId) {
            console.warn('警告：科室ID为空，无法查询院内码！');
          }
          this.$nextTick(() => {
            this.open = true;
            this.title = "修改高值退库";
            this.form.orderStatus = '1';
            this.form.orderType = '301';
            this.action = true;
            console.log('打开对话框（跳过查询） - 科室ID:', this.form.departmentId);
            this.$forceUpdate();
          });
        }
        // 使用 $nextTick 确保 SelectDepartment 组件正确更新
        this.$nextTick(() => {
          // 强制更新 SelectDepartment 组件
          if (this.form.departmentId) {
            this.$forceUpdate();
          }
        });
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          this.form.orderType = 301; // 确保设置退库类型
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
      this.$modal.confirm('是否确认删除高值退库编号为"' + ids + '"的数据项？').then(() => {
        return delOrder(ids, 301);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
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
      this.gzOrderEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzOrderEntry() {
      if (this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退库明细数据");
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
        ...this.queryParams,
        orderType: 301
      }, `order_${new Date().getTime()}.xlsx`)
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
  overflow-y: auto;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
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

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
  /* 隐藏右侧滚动条，固定页面布局 */
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 隐藏整个页面的水平滚动条 */
body {
  overflow-x: hidden !important;
}

/* 隐藏右侧滚动条 - Webkit浏览器 */
::-webkit-scrollbar:horizontal {
  display: none !important;
  height: 0 !important;
}

/* 隐藏所有水平滚动条 - Firefox */
* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important; /* IE and Edge */
}

*::-webkit-scrollbar:horizontal {
  display: none !important;
  height: 0 !important;
}

/* 禁止页面上下滚动，固定页面高度 */
html, body {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
  height: 100vh;
  max-height: 100vh;
}

/* 确保主容器不超出视口 */
.app-container {
  height: calc(100vh - 60px);
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
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
  /* 移除绝对定位，让三个字段正常排列 */
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

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.refund-goods-audit-page {
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.refund-goods-audit-page > .el-form.query-form-compact {
  margin-top: -8px !important;
}

.app-container.refund-goods-audit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.refund-goods-audit-page > .el-table.table-compact {
  margin-top: 0;
}

/* 主表格表头样式：与到货验收一致 */
.app-container.refund-goods-audit-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.refund-goods-audit-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

/* 单据状态列表头不换行 */
.app-container.refund-goods-audit-page > .el-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}
</style>
