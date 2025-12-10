<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="出库单号" prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="请输入出库单号"
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
          @click="handleBatchAudit"
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
      <el-table-column label="出库单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
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
                              v-hasPermi="['gzOrder:apply:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
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
              <SelectDepartment v-model="form.departmentId" :disabled="!action"/>
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
            <el-form-item label="出库类型" prop="orderType">
              <el-select v-model="form.orderType" placeholder="请选择出库类型"
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
            <span>{{ isOutbound ? '备货出库明细信息' : '高值备货入库明细信息' }}</span>
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
        <el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex" @selection-change="handleGzOrderEntrySelectionChange" ref="gzOrderEntry" border height="48vh">
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
      :gzOrderEntryList="gzOrderEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder,auditOrder, checkInHospitalCode } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import {STOCK_IN_TEMPLATE} from "@/utils/printData";
import RMBConverter from "@/utils/tools";
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";

export default {
  name: "OrderAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectMaterialFilter,gzOrderPrint},
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
      // 是否为出库
      isOutbound: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
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
    // 根据路由meta.title判断是出库还是入库
    // 如果菜单标题包含"出库"，则设置为出库类型（102）
    // 否则为入库类型（101）
    this.setOrderTypeByRoute();
    this.getList();
  },
  methods: {
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 格式化总金额 */
    formatTotalAmt(row) {
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        const total = row.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 计算明细总金额 */
    getTotalAmount() {
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        const total = this.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 根据路由设置订单类型 */
    setOrderTypeByRoute() {
      const route = this.$route;
      // 多种方式判断：检查路由标题、路径、或者页面标题
      let isOutbound = false;
      
      // 方式1：检查路由 meta.title
      if (route && route.meta && route.meta.title) {
        isOutbound = route.meta.title.includes('出库');
      }
      
      // 方式2：如果方式1没判断出来，检查路由 path
      if (!isOutbound && route && route.path) {
        // 如果路径包含 outbound 或 出库相关的标识
        isOutbound = route.path.includes('outbound') || route.path.includes('出库');
      }
      
      // 方式3：检查页面标题（document.title 或面包屑）
      if (!isOutbound) {
        const pageTitle = document.title || '';
        const breadcrumb = document.querySelector('.el-breadcrumb__inner')?.textContent || '';
        isOutbound = pageTitle.includes('出库') || breadcrumb.includes('出库');
      }
      
      if (isOutbound) {
        // 出库类型
        this.queryParams.orderType = 102; // 确保是数字类型
        this.isOutbound = true;
      } else {
        // 入库类型（入库审核、备货验收）
        this.queryParams.orderType = 101; // 确保是数字类型
        this.isOutbound = false;
      }
      
      // 强制转换为数字类型，确保后端能正确接收
      this.queryParams.orderType = parseInt(this.queryParams.orderType) || 101;
    },
    /** 查询高值入库列表 */
    getList() {
      this.loading = true;
      // 每次查询前都重新设置 orderType，确保正确过滤
      this.setOrderTypeByRoute();
      
      // 确保 orderType 一定有值，如果没有则默认为入库（101）
      if (!this.queryParams.orderType) {
        this.queryParams.orderType = 101;
        this.isOutbound = false;
      }
      
      // 调试信息
      console.log('查询参数 orderType:', this.queryParams.orderType);
      console.log('当前路由信息:', {
        path: this.$route.path,
        name: this.$route.name,
        meta: this.$route.meta
      });
      
      listOrder(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
        console.log('查询结果数量:', response.rows.length);
        // 调试：打印总金额信息
        if (response.rows && response.rows.length > 0) {
          console.log('查询结果中的总金额:', response.rows.map(row => ({
            orderNo: row.orderNo,
            totalAmt: row.totalAmt,
            fullRow: row
          })));
        }
        // 检查结果中是否包含错误的类型
        const wrongType = response.rows.filter(row => {
          const orderNo = row.orderNo || '';
          const isOutboundOrder = orderNo.startsWith('GZCK');
          const shouldBeInbound = this.queryParams.orderType === 101;
          return shouldBeInbound && isOutboundOrder;
        });
        if (wrongType.length > 0) {
          console.warn('发现类型不匹配的数据:', wrongType);
        }
      });
    },
    checkMaterialBtn() {
      // 检查是否选择了仓库
      if (!this.form.warehouseId) {
        this.$message.warning('请先选择仓库');
        return;
      }
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
      // 重置后保持orderType，根据路由判断是出库还是入库
      this.setOrderTypeByRoute();
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
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, orderType).then(response => {
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
        // 如果是出库单，查询每个明细的库存数量和院内码
        if (isOutbound && this.form.warehouseId && this.gzOrderEntryList.length > 0) {
          // 收集所有需要查询的批次号和物料ID
          const batchNos = this.gzOrderEntryList.map(entry => entry.batchNo).filter(bn => bn);
          if (batchNos.length > 0) {
            listDepotInventory({
              warehouseId: this.form.warehouseId,
              pageNum: 1,
              pageSize: 1000
            }).then(invResponse => {
              const inventoryMap = {};
              // 使用 materialId_batchNo 作为键，精确匹配院内码
              const inHospitalCodeMap = {};
              if (invResponse.rows && invResponse.rows.length > 0) {
                invResponse.rows.forEach(inv => {
                  if (inv.batchNo) {
                    const key = inv.batchNo;
                    if (!inventoryMap[key]) {
                      inventoryMap[key] = 0;
                    }
                    inventoryMap[key] += parseFloat(inv.qty) || 0;
                    // 使用 materialId_batchNo 作为键，精确匹配院内码
                    if (inv.materialId && inv.batchNo && inv.inHospitalCode) {
                      const codeKey = `${inv.materialId}_${inv.batchNo}`;
                      if (!inHospitalCodeMap[codeKey]) {
                        inHospitalCodeMap[codeKey] = [];
                      }
                      inHospitalCodeMap[codeKey].push(inv.inHospitalCode);
                    }
                  }
                });
              }
              // 为每个entry设置库存数量和院内码
              // 注意：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
              console.log('查询库存前，明细列表的院内码:', this.gzOrderEntryList.map(e => ({
                id: e.id,
                inHospitalCode: e.inHospitalCode,
                materialId: e.materialId,
                batchNo: e.batchNo
              })));
              this.gzOrderEntryList.forEach((entry, entryIndex) => {
                if (entry.batchNo) {
                  if (inventoryMap[entry.batchNo]) {
                    entry.stockQty = inventoryMap[entry.batchNo];
                  } else {
                    entry.stockQty = 0;
                  }
                  // 使用 materialId_batchNo 精确匹配院内码
                  // 重要：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
                  // 只有在院内码为空或未定义时才从库存查询中设置
                  if (entry.materialId && entry.batchNo) {
                    // 检查院内码是否已存在（可能是从数据库加载的）
                    const hasInHospitalCode = entry.inHospitalCode && entry.inHospitalCode.trim() !== '';
                    console.log(`明细项 ${entryIndex} - id: ${entry.id}, 已有院内码: ${hasInHospitalCode}, 院内码值: ${entry.inHospitalCode}`);
                    if (!hasInHospitalCode) {
                      // 只有在没有院内码时才从库存查询中设置
                      const codeKey = `${entry.materialId}_${entry.batchNo}`;
                      if (inHospitalCodeMap[codeKey] && inHospitalCodeMap[codeKey].length > 0) {
                        // 取第一个院内码
                        entry.inHospitalCode = inHospitalCodeMap[codeKey][0];
                        console.log(`明细项 ${entryIndex} - 从库存查询设置院内码: ${entry.inHospitalCode}`);
                      }
                    } else {
                      console.log(`明细项 ${entryIndex} - 保留已有院内码，不覆盖: ${entry.inHospitalCode}`);
                    }
                  }
                } else {
                  entry.stockQty = 0;
                }
              });
              console.log('查询库存后，明细列表的院内码:', this.gzOrderEntryList.map(e => ({
                id: e.id,
                inHospitalCode: e.inHospitalCode,
                materialId: e.materialId,
                batchNo: e.batchNo
              })));
            });
          }
        }
        this.open = true;
        this.action = false;
        // 不要覆盖从后端获取的 orderStatus，保持原有状态
        // this.form.orderStatus = '1'; // 已注释，使用后端返回的实际状态
        // 确保 orderType 正确设置
        if (isOutbound) {
          this.form.orderType = '102';
          this.title = "查看备货出库";
        } else {
          this.form.orderType = '101';
          this.title = "查看高值备货入库";
        }
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      // 根据路由判断是出库还是入库
      const route = this.$route;
      if (route && route.meta && route.meta.title && route.meta.title.includes('出库')) {
        this.title = "添加备货出库";
        this.form.orderType = '102';
      } else {
      this.title = "添加高值备货入库";
      this.form.orderType = '101';
      }
      this.form.orderStatus = '1';
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
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditOrder({id: id, orderType: orderType});
      }).then(() => {
        this.getList();
        if (isOutbound) {
          this.$modal.msgSuccess("审核出库成功！");
        } else {
          this.$modal.msgSuccess("审核入库成功！");
        }
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError('请先选择要审核的数据');
        return;
      }
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      
      this.$modal.confirm('确定要审核选中的' + this.ids.length + '条数据项？').then(() => {
        const promises = this.ids.map(id => auditOrder({id: id, orderType: orderType}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        if (isOutbound) {
          this.$modal.msgSuccess("批量审核出库成功！");
        } else {
          this.$modal.msgSuccess("批量审核入库成功！");
        }
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, orderType).then(response => {
        this.form = response.data;
        this.form.orderStatus = '1';
        // 确保 orderType 正确设置
        if (isOutbound) {
          this.form.orderType = '102';
        } else {
          this.form.orderType = '101';
        }
        // 确保科室ID正确设置
        if (response.data.departmentId) {
          this.form.departmentId = response.data.departmentId;
        }
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
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
          // 调试：打印 materialMap
          console.log('materialMap:', materialMap);
          this.gzOrderEntryList.forEach(entry => {
            // 调试：打印每个明细的 materialId
            console.log('明细项 materialId:', entry.materialId, 'materialMap keys:', Object.keys(materialMap));
            if (entry.materialId && materialMap[entry.materialId]) {
              const material = materialMap[entry.materialId];
              entry.materialName = material.name || "";
              entry.speci = material.speci || "";
              entry.model = material.model || "";
              entry.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
              entry.supplierName = (material.supplier && material.supplier.name) || "";
              entry.udiNo = material.udiNo || entry.udiNo || "";
              // 调试：打印匹配到的物料信息
              console.log('匹配到的物料:', material.name);
            } else {
              // 调试：打印未匹配的情况
              console.warn('未找到对应的物料信息，materialId:', entry.materialId, 'entry:', entry);
            }
          });
        }
        // 如果是出库单，查询每个明细的库存数量和院内码（isOutbound 已在上面定义）
        if (isOutbound && this.form.warehouseId && this.gzOrderEntryList.length > 0) {
          // 收集所有需要查询的批次号和物料ID
          const batchNos = this.gzOrderEntryList.map(entry => entry.batchNo).filter(bn => bn);
          const materialIds = this.gzOrderEntryList.map(entry => entry.materialId).filter(mid => mid);
          if (batchNos.length > 0) {
            listDepotInventory({
              warehouseId: this.form.warehouseId,
              pageNum: 1,
              pageSize: 1000
            }).then(invResponse => {
              const inventoryMap = {};
              // 使用 materialId_batchNo 作为键，精确匹配院内码
              const inHospitalCodeMap = {};
              if (invResponse.rows && invResponse.rows.length > 0) {
                invResponse.rows.forEach(inv => {
                  if (inv.batchNo) {
                    const key = inv.batchNo;
                    if (!inventoryMap[key]) {
                      inventoryMap[key] = 0;
                    }
                    inventoryMap[key] += parseFloat(inv.qty) || 0;
                    // 使用 materialId_batchNo 作为键，精确匹配院内码
                    if (inv.materialId && inv.batchNo && inv.inHospitalCode) {
                      const codeKey = `${inv.materialId}_${inv.batchNo}`;
                      if (!inHospitalCodeMap[codeKey]) {
                        inHospitalCodeMap[codeKey] = [];
                      }
                      inHospitalCodeMap[codeKey].push(inv.inHospitalCode);
                    }
                  }
                });
              }
              // 为每个entry设置库存数量和院内码
              this.gzOrderEntryList.forEach(entry => {
                if (entry.batchNo) {
                  if (inventoryMap[entry.batchNo]) {
                    entry.stockQty = inventoryMap[entry.batchNo];
                  } else {
                    entry.stockQty = 0;
                  }
                  // 使用 materialId_batchNo 精确匹配院内码
                  // 重要：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
                  // 只有在院内码为空或未定义时才从库存查询中设置
                  if (entry.materialId && entry.batchNo) {
                    // 检查院内码是否已存在（可能是从数据库加载的）
                    const hasInHospitalCode = entry.inHospitalCode && entry.inHospitalCode.trim() !== '';
                    if (!hasInHospitalCode) {
                      // 只有在没有院内码时才从库存查询中设置
                      const codeKey = `${entry.materialId}_${entry.batchNo}`;
                      if (inHospitalCodeMap[codeKey] && inHospitalCodeMap[codeKey].length > 0) {
                        // 取第一个院内码
                        entry.inHospitalCode = inHospitalCodeMap[codeKey][0];
                      }
                    }
                  }
                } else {
                  entry.stockQty = 0;
                }
              });
            });
          }
        }
        this.open = true;
        // 根据路由判断是出库还是入库
        if (isOutbound) {
          this.title = "修改备货出库";
        } else {
        this.title = "修改高值入库";
        }
        this.action = true;
      });
    },
    /** 提交按钮 */
    async submitForm() {
      this.$refs["form"].validate(async (valid) => {
        if (valid) {
          // 如果是出库，验证数量不能大于库存数量
          if (this.isOutbound) {
            for (let i = 0; i < this.gzOrderEntryList.length; i++) {
              const item = this.gzOrderEntryList[i];
              const qty = parseFloat(item.qty) || 0;
              const stockQty = parseFloat(item.stockQty) || 0;
              
              // 验证数量必须大于0
              if (!item.qty || qty <= 0) {
                this.$message.error(`第${i + 1}行：出库数量必须大于0`);
                return;
              }
              
              // 验证数量不能大于库存数量
              if (stockQty > 0 && qty > stockQty) {
                this.$message.error(`第${i + 1}行：出库数量（${qty}）不能大于库存数量（${stockQty}）`);
                return;
              }
            }
          }
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          // 调试：打印提交前的数据，特别是院内码
          console.log('提交前的数据:', {
            form: this.form,
            gzOrderEntryList: this.gzOrderEntryList.map(entry => ({
              id: entry.id,
              materialId: entry.materialId,
              batchNo: entry.batchNo,
              inHospitalCode: entry.inHospitalCode,
              qty: entry.qty
            }))
          });
          // 确保 orderType 正确设置（根据路由判断）
          const route = this.$route;
          const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
          if (isOutbound) {
            this.form.orderType = '102';
          } else {
            this.form.orderType = '101';
          }
          // 如果是出库单，检查院内码是否被未审核的出库单占用
          if (isOutbound) {
            const checkPromises = [];
            const invalidItems = [];
            
            // 收集所有需要检查的院内码
            for (let i = 0; i < this.gzOrderEntryList.length; i++) {
              const entry = this.gzOrderEntryList[i];
              const inHospitalCode = entry.inHospitalCode;
              
              // 如果有院内码，检查是否被占用（排除当前单据）
              if (inHospitalCode) {
                checkPromises.push(
                  checkInHospitalCode({ inHospitalCode: inHospitalCode }).then(response => {
                    if (response.code === 200 && response.data && response.data.length > 0) {
                      // 过滤掉当前单据的出库单号（如果是修改操作）
                      const currentOrderNo = this.form.orderNo;
                      const occupiedOrderNos = response.data.filter(orderNo => {
                        // 如果是修改操作，排除当前单据
                        if (this.form.id && currentOrderNo && orderNo === currentOrderNo) {
                          return false;
                        }
                        return true;
                      });
                      
                      if (occupiedOrderNos.length > 0) {
                        invalidItems.push({
                          index: i + 1,
                          inHospitalCode: inHospitalCode,
                          materialName: entry.materialName || '未知',
                          orderNos: occupiedOrderNos
                        });
                      }
                    }
                  }).catch(error => {
                    console.error('检查院内码失败:', error);
                  })
                );
              }
            }
            
            // 等待所有检查完成
            if (checkPromises.length > 0) {
              await Promise.all(checkPromises);
              
              // 如果有被占用的院内码，显示提示并阻止提交
              if (invalidItems.length > 0) {
                let message = '以下明细的院内码已被未审核的备货出库单占用，请先处理被占用的出库单：\n\n';
                invalidItems.forEach(item => {
                  message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}）\n`;
                  message += `占用出库单号：${item.orderNos.join('、')}\n\n`;
                });
                message += '请先审核或删除被占用的出库单后，再提交当前单据。';
                this.$modal.msgError(message);
                return;
              }
            }
          }
          
          // 调试：打印提交的数据，特别是明细列表中的 materialId
          console.log('提交的表单数据:', {
            id: this.form.id,
            departmentId: this.form.departmentId,
            warehouseId: this.form.warehouseId,
            orderType: this.form.orderType,
            isOutbound: isOutbound,
            entryList: this.gzOrderEntryList.map(entry => ({
              materialId: entry.materialId,
              materialName: entry.materialName,
              qty: entry.qty,
              price: entry.price
            }))
          });
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
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
      return getOrder(row.id).then(response => {
        const details = response.data.gzOrderEntryList
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
          orderNo: row.orderNo,
          supplierName: row.supplier.name,
          warehouseName: row.warehouse.name,
          orderDate: row.orderDate,
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
      // 根据路由判断是出库还是入库
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      const confirmText = isOutbound ? '是否确认删除备货出库编号为"' + (row.orderNo || ids) + '"的数据项？' : '是否确认删除高值入库编号为"' + (row.orderNo || ids) + '"的数据项？';
      this.$modal.confirm(confirmText).then(() => {
        // 传递 orderType 参数，确保删除正确的表
        return delOrder(ids, orderType);
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
