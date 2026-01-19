<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="退库单号" prop="goodsNo" class="query-item-inline">
            <el-input v-model="queryParams.goodsNo"
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
          plain
          icon="el-icon-check"
          size="medium"
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
      <el-table-column label="退库单号" align="center" prop="goodsNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.goodsNo }}</span>
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
      <el-table-column label="单据状态" align="center" prop="goodsStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.goodsStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.auditBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="goodsDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.goodsDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
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

    <!-- 添加或修改高值入库对话框 -->
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
                    <el-form-item label="单据状态" prop="goodsStatus">
                      <dict-tag :options="dict.type.biz_status" :value="form.goodsStatus"/>
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
                    <span>备货退库明细信息</span>
                  </el-col>

                  <div v-show="action" style="display: flex; align-items: center; gap: 10px;">
                    <el-col :span="1.5">
                      <el-button @click="cancel">取 消</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" @click="submitForm">保 存</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-plus" @click="checkMaterialBtn">添加</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="danger" icon="el-icon-delete" @click="handleDeleteGzRefundGoodsEntry">删除</el-button>
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
              <span>{{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}</span>
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
              <span>{{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" prop="supplierName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.supplierName || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
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
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width " @close="handlePrintDialogClose">
      <!-- 打印方式选择（包含布局选择） -->
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 20px;">
          <el-form-item label="页面方向：">
            <el-radio-group v-model=" modalObj.form.orientation ">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </template>
      <!-- 打印预览 -->
      <template v-else-if=" modalObj.component === 'window-print-preview' ">
        <gz-order-print v-if=" modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0 " :key="`print-${modalObj.form.row.goodsNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row=" modalObj.form.row " :orientation=" modalObj.form.orientation || 'landscape' " :printType="'refund'" ref="receiptOrderPrintRef"></gz-order-print>
        <div v-else-if=" modalObj.form.row " style="padding: 20px; text-align: center; color: #999;">
          <p>正在加载打印数据...</p>
        </div>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" :printType="'refund'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="form.warehouseId"
      :departmentValue="form.departmentId"
      :gzOrderEntryList="gzRefundGoodsEntryList"
      :useDepInventory="true"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

  </div>
</template>

<script>
import { listGoods, getGoods, delGoods, addGoods, updateGoods, auditGoods } from "@/api/gz/goods";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import {STOCK_IN_TEMPLATE} from "@/utils/printData";
import RMBConverter from "@/utils/tools";
import { parseTime } from "@/utils/ruoyi";
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";

export default {
  name: "RefundGoods",
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
          value: 2,
          orientation: 'landscape', // 默认横向
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        },
        show: false
      },
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
      // 优先使用totalAmt字段
      if (row.totalAmt != null && row.totalAmt !== undefined) {
        return parseFloat(row.totalAmt).toFixed(2);
      }
      // 如果没有totalAmt，从明细列表计算
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
      // 备货退库页面：只显示GZTK-开头的单号
      const params = {
        ...this.queryParams
      };
      // 如果用户输入了单号，确保以GZTK-开头
      if (params.goodsNo && !params.goodsNo.startsWith('GZTK-')) {
        params.goodsNo = 'GZTK-' + params.goodsNo;
      } else if (!params.goodsNo) {
        // 如果没有输入单号，默认搜索GZTK-开头的
        params.goodsNo = 'GZTK-';
      }
      listGoods(params).then(response => {
        // 过滤结果，只显示GZTK-开头的单号
        if (response.rows) {
          response.rows = response.rows.filter(row => row.goodsNo && row.goodsNo.startsWith('GZTK-'));
          response.total = response.rows.length;
        }
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
        obj.price = item.unitPrice || item.price || "";
        // 计算金额：如果item.amt为空，则计算qty * price
        if (item.amt) {
          obj.amt = parseFloat(item.amt).toFixed(2);
        } else if (obj.qty && obj.price) {
          obj.amt = (parseFloat(obj.qty) * parseFloat(obj.price)).toFixed(2);
        } else {
          obj.amt = "";
        }
        // 批次号：从batchNo获取
        obj.batchNo = item.batchNo || "";
        // 批号：优先从materialNo获取（后端字段名），其次从batchNumber获取
        obj.batchNumber = item.materialNo || item.batchNumber || "";
        obj.beginTime = item.materialDate || item.beginTime || "";
        obj.endTime = item.endTime || "";
        obj.remark = "";
        obj.masterBarcode = item.masterBarcode || "";
        // 辅助条码：从secondaryBarcode获取
        obj.secondaryBarcode = item.secondaryBarcode || "";
        // 院内码：从多个可能的位置获取
        obj.inHospitalCode = item.inHospitalCode || "";
        // 保存UDI码，优先从material对象获取，如果没有则从udiNo字段获取
        obj.udiNo = (item.material && item.material.udiNo) || item.udiNo || item.masterBarcode || "";
        // 确保materialId正确设置
        obj.materialId = obj.materialId || item.materialId || (item.material && item.material.id);
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
        departmentId: null,
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
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
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
    /** 映射明细数据 */
    mapEntryData(responseData) {
      this.gzRefundGoodsEntryList = responseData.gzRefundGoodsEntryList || [];
      
      console.log('mapEntryData - 原始数据:', {
        gzRefundGoodsEntryList: this.gzRefundGoodsEntryList,
        materialList: responseData.materialList,
        firstEntry: this.gzRefundGoodsEntryList[0]
      });
      
      // 构建materialMap
      const materialMap = {};
      if (responseData.materialList && responseData.materialList.length > 0) {
        responseData.materialList.forEach(material => {
          if (material && material.id) {
            materialMap[material.id] = material;
          }
        });
      }
      
      this.gzRefundGoodsEntryList.forEach(entry => {
        // 优先从entry.material对象获取，其次从materialMap获取，最后保持entry原有值
        let material = entry.material;
        if (!material && entry.materialId && materialMap[entry.materialId]) {
          material = materialMap[entry.materialId];
        }
        
        // 优先使用entry中已有的字段值，如果没有则从material对象获取
        // 如果找到了material对象，使用它来填充缺失的字段
        if (material) {
          if (!entry.materialName && material.name) {
            entry.materialName = material.name;
          }
          if (!entry.speci && material.speci) {
            entry.speci = material.speci;
          }
          if (!entry.model && material.model) {
            entry.model = material.model;
          }
          if (!entry.factoryName && material.fdFactory && material.fdFactory.factoryName) {
            entry.factoryName = material.fdFactory.factoryName;
          }
          if (!entry.supplierName && material.supplier && material.supplier.name) {
            entry.supplierName = material.supplier.name;
          }
          if (!entry.udiNo && material.udiNo) {
            entry.udiNo = material.udiNo;
          }
        }
        
        // 如果entry中已经有这些字段的值，保持它们（不覆盖）
        // 如果没有值，尝试从entry.material获取
        if (!entry.materialName && entry.material && entry.material.name) {
          entry.materialName = entry.material.name;
        }
        if (!entry.speci && entry.material && entry.material.speci) {
          entry.speci = entry.material.speci;
        }
        if (!entry.model && entry.material && entry.material.model) {
          entry.model = entry.material.model;
        }
        if (!entry.factoryName && entry.material && entry.material.fdFactory && entry.material.fdFactory.factoryName) {
          entry.factoryName = entry.material.fdFactory.factoryName;
        }
        if (!entry.supplierName && entry.material && entry.material.supplier && entry.material.supplier.name) {
          entry.supplierName = entry.material.supplier.name;
        }
        if (!entry.udiNo && entry.material && entry.material.udiNo) {
          entry.udiNo = entry.material.udiNo;
        }
        
        // 处理其他字段，保持原有值或从其他字段获取
        if (!entry.batchNumber && entry.materialNo) {
          entry.batchNumber = entry.materialNo;
        }
        if (!entry.beginTime && entry.materialDate) {
          entry.beginTime = entry.materialDate;
        }
        if (!entry.price && entry.unitPrice) {
          entry.price = entry.unitPrice;
        }
        
        console.log('处理后的entry:', entry);
      });
      
      console.log('mapEntryData - 最终数据:', this.gzRefundGoodsEntryList);
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getGoods(id).then(response => {
        this.form = response.data;
        this.mapEntryData(response.data);
        this.open = true;
        this.action = false;
        this.title = "查看备货退库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加备货退库";
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
        this.mapEntryData(response.data);
        this.open = true;
        this.title = "修改备货退库";
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
              // 保存成功后不关闭弹窗，刷新列表和表单数据
              this.getList();
              // 重新获取最新数据
              getGoods(this.form.id).then(res => {
                this.form = res.data;
                this.gzRefundGoodsEntryList = res.data.gzRefundGoodsEntryList || [];
                // 重新映射数据
                this.mapEntryData(res.data);
              });
            });
          } else {
            addGoods(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 保存成功后不关闭弹窗，刷新列表
              this.getList();
              // 如果是新增，重置表单但保持弹窗打开
              this.form.id = response.data.id || response.data;
              // 重新获取最新数据
              if (this.form.id) {
                getGoods(this.form.id).then(res => {
                  this.form = res.data;
                  this.gzRefundGoodsEntryList = res.data.gzRefundGoodsEntryList || [];
                  // 重新映射数据
                  this.mapEntryData(res.data);
                });
              }
            });
          }
        }
      });
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      console.log('handlePrint called with:', { row, print });
      // 如果传入 print 参数为 true，直接执行打印
      if (print === true) {
        // 直接获取数据并触发打印
        this.getOrderDetail(row).then(res => {
          console.log('getOrderDetail result:', res);
          // 验证数据完整性
          if (!res || !res.detailList || res.detailList.length === 0) {
            console.warn('打印数据不完整:', res);
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
              console.log('Checking receiptOrderPrintRefAuto:', this.$refs['receiptOrderPrintRefAuto']);
              if (this.$refs['receiptOrderPrintRefAuto']) {
                // start() 方法会直接触发浏览器打印对话框
                console.log('Calling start() on print component');
                this.$refs['receiptOrderPrintRefAuto'].start();
              } else {
                console.error('receiptOrderPrintRefAuto not found');
                this.$modal.msgError('打印组件未找到，请刷新页面重试');
              }
            });
          });
        }).catch(error => {
          console.error('getOrderDetail error:', error);
          this.$modal.msgError('获取打印数据失败：' + (error.message || '未知错误'));
        });
        return;
      }
      // 否则显示选择打印方式的对话框
      this.$nextTick(() => {
        this.modalObj = {
          show: true,
          title: '选择打印方式',
          width: '520px',
          component: 'print-type',
          form: {
            value: 2,
            orientation: 'landscape', // 默认横向
            row: null
          },
          ok: () => {
            this.modalObj.show = false;
            if (this.modalObj.form.value === 2) {
              this.windowPrintOut(row, false);
            }
          },
          cancel: () => {
            this.modalObj.show = false;
          }
        };
      });
    },
    handlePrintDialogClose() {
      this.modalObj.show = false;
      // 重置 modalObj，清空打印数据以强制重新渲染
      this.modalObj = {
        show: false,
        title: '',
        width: '',
        component: null,
        form: {
          value: 2,
          orientation: 'landscape',
          row: null
        },
        ok: () => {},
        cancel: () => {}
      };
    },
    windowPrintOut(row, print) {
      this.getOrderDetail(row).then(res => {
        if (print) {
          // 与入库验收页面完全一致：只更新 modalObj.form.row，然后直接调用打印
          // 注意：对话框已经在 handlePrint 中打开了
          this.modalObj.form.row = res;
          // 确保有方向设置
          if (!this.modalObj.form.orientation) {
            this.modalObj.form.orientation = 'landscape';
          }
          this.$nextTick(() => {
            if (this.$refs['receiptOrderPrintRef']) {
              // start() 方法会直接触发浏览器打印对话框，不需要显示预览对话框
              this.$refs['receiptOrderPrintRef'].start();
            }
          });
        } else {
          // 先清空row，强制组件重新渲染
          this.modalObj.form.row = null;
          // 确保有方向设置
          if (!this.modalObj.form.orientation) {
            this.modalObj.form.orientation = 'landscape';
          }
          // 等待组件销毁后再设置新数据
          this.$nextTick(() => {
            this.$nextTick(() => {
              // 验证数据完整性
              if (!res || !res.detailList || res.detailList.length === 0) {
                console.warn('打印数据不完整:', res);
                this.$modal.msgWarning('打印数据不完整，请重试');
                return;
              }
              // 更新 modalObj.form.row 以显示预览
              this.modalObj.form.row = res;
              // 等待组件完全渲染后再显示预览
              this.$nextTick(() => {
                this.$nextTick(() => {
                  // 再次验证组件是否已正确渲染
                  if (this.$refs['receiptOrderPrintRef']) {
                    this.modalObj.component = 'window-print-preview';
                  } else {
                    // 如果组件还未渲染，再等待一次
                    setTimeout(() => {
                      this.modalObj.component = 'window-print-preview';
                    }, 100);
                  }
                });
              });
            });
          });
        }
      });
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

/* 查询条件容器框样式 */
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
  height: 55vh;
  max-height: 55vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(55vh - 48px);
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* 表格滚动条样式 - 隐藏滚动条 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  display: none;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  display: none;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  display: none;
}

/* 主表格滚动条隐藏 */
.el-table__body-wrapper {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.el-table__body-wrapper::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
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

/* 确保按钮大小生效 - 与备货出库页面保持一致 */
.app-container > .mb8 .el-col .el-button,
.app-container > .mb8 .el-col .el-button--medium,
.app-container > .mb8 .el-col .el-button.is-plain {
  height: 36px !important;
  padding: 9px 15px !important;
  font-size: 14px !important;
  line-height: 18px !important;
  min-width: auto !important;
}

.app-container > .mb8 .el-col .el-button [class*="el-icon"] {
  font-size: 14px !important;
}
</style>
