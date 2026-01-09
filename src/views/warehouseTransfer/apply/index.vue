<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="调拨单号" prop="transferOrderCode" class="query-item-inline">
            <el-input v-model="queryParams.transferOrderCode"
                      placeholder="请输入调拨单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="getTransferList"
            />
          </el-form-item>
          <el-form-item label="调出仓库" prop="fromWarehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.fromWarehouseId" placeholder="请选择调出仓库" :excludeWarehouseType="['设备', '高值']" clearable />
            </div>
          </el-form-item>
          <el-form-item label="调入仓库" prop="toWarehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.toWarehouseId" placeholder="请选择调入仓库" :excludeWarehouseType="['设备', '高值']" clearable />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.startDate"
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
          <el-form-item label="单据状态" prop="status" class="query-item-status-aligned">
            <el-select v-model="queryParams.status" placeholder="全部"
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

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="addTransfer"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="getTransferList"
          :loading="loading"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getTransferList"></right-toolbar>
    </el-row>

    <el-table :data="tableData" v-loading="loading" :row-class-name="rowTransferIndex" @selection-change="handleSelectionChange" height="58vh" border>
        <el-table-column type="selection" width="55" align="center" fixed="left" />
        <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
        <el-table-column label="调拨单号" align="center" prop="transferOrderCode" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-button type="text" @click="viewTransfer(scope.row)">
              <span>{{ scope.row.transferOrderCode }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="调出仓库" align="center" prop="fromWarehouseName" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.fromWarehouseName || (scope.row.warehouse && scope.row.warehouse.name) || (scope.row.fromWarehouse && scope.row.fromWarehouse.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调入仓库" align="center" prop="toWarehouseName" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.toWarehouseName || (scope.row.toWarehouse && scope.row.toWarehouse.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" align="center" prop="createrName" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.createrName || scope.row.createrNickName || scope.row.createrUserName || (scope.row.creater && (scope.row.creater.nickName || scope.row.creater.userName)) || (scope.row.createBy && (scope.row.createBy.nickName || scope.row.createBy.userName)) || (scope.row.user && (scope.row.user.nickName || scope.row.user.userName)) || (scope.row.creater && scope.row.creater.nickName) || (scope.row.creater && scope.row.creater.userName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else-if="scope.row.transferDate">{{ scope.row.transferDate }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount !== null && scope.row.totalAmount !== undefined && scope.row.totalAmount !== '' && !isNaN(scope.row.totalAmount) && parseFloat(scope.row.totalAmount) >= 0">
              {{ parseFloat(scope.row.totalAmount).toFixed(2) }}
            </span>
            <span v-else-if="scope.row.total_amount !== null && scope.row.total_amount !== undefined && scope.row.total_amount !== '' && !isNaN(scope.row.total_amount) && parseFloat(scope.row.total_amount) >= 0">
              {{ parseFloat(scope.row.total_amount).toFixed(2) }}
            </span>
            <span v-else-if="scope.row.totalAmt !== null && scope.row.totalAmt !== undefined && scope.row.totalAmt !== '' && !isNaN(scope.row.totalAmt) && parseFloat(scope.row.totalAmt) >= 0">
              {{ parseFloat(scope.row.totalAmt).toFixed(2) }}
            </span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.status == 2 || scope.row.status == '2'">已审核</span>
            <span v-else>未审核</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
          <template slot-scope="scope">
            <span style="white-space: nowrap; display: inline-block;">
              <el-button
                size="small"
                type="text"
                @click="handlePrint(scope.row,true)"
                v-if="scope.row.status == 2 || scope.row.status == '2'"
                style="padding: 0 5px; margin: 0;"
              >打印</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-edit"
                @click="editTransfer(scope.row)"
                :disabled="dialogLoading"
                v-if="scope.row.status != 2 && scope.row.status != '2'"
                style="padding: 0 5px; margin: 0;"
              >修改</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="deleteTransfer(scope.row)"
                :disabled="loading"
                v-if="scope.row.status != 2 && scope.row.status != '2'"
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
      @pagination="getTransferList"
    />

    <!-- 添加或修改调拨申请对话框 -->
    <transition name="modal-fade">
      <div v-if="dialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="dialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ dialogType === 'add' ? '新增调拨申请' : dialogType === 'edit' ? '修改调拨申请' : '调拨申请详情' }}</div>
              <el-button size="small" @click="closeDialog" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="transferForm" :model="transferForm" :rules="rules" label-width="80px" class="modal-form-wrapper">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="调拨单号" prop="transferOrderCode" label-width="100px">
                      <el-input v-model="transferForm.transferOrderCode" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="transferDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="transferForm.transferDate"
                                      type="date"
                                      style="width: 150px"
                                      value-format="yyyy-MM-dd"
                                      :disabled="dialogType === 'view'"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" label-width="100px">
                      <el-input :value="formTotalAmount" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单人" label-width="100px">
                      <el-input :value="createrDisplayName" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="调出仓库" prop="fromWarehouseId" label-width="100px">
                      <SelectWarehouse v-model="transferForm.fromWarehouseId" placeholder="请选择调出仓库" :excludeWarehouseType="['设备', '高值']" :disabled="dialogType === 'view'" @change="onWarehouseChange('from', $event)"></SelectWarehouse>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="调入仓库" prop="toWarehouseId" label-width="100px">
                      <SelectWarehouse v-model="transferForm.toWarehouseId" placeholder="请选择调入仓库" :excludeWarehouseType="['设备', '高值']" :disabled="dialogType === 'view'" @change="onWarehouseChange('to', $event)"></SelectWarehouse>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="状态" prop="status" label-width="100px" v-if="dialogType !== 'add'">
                      <el-input :value="transferForm.status == 2 || transferForm.status == '2' ? '已审核' : '未审核'" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark" label-width="100px">
                      <el-input v-model="transferForm.remark" placeholder="请输入备注" style="width: 150px" :disabled="dialogType === 'view'" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>调拨申请明细信息</span>
                </el-col>

                <div v-show="dialogType !== 'view'">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="medium" @click="addDetail" :disabled="!transferForm.fromWarehouseId">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteTransferDetail">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="medium" @click="closeDialog">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" size="medium" @click="submitTransfer" :loading="submitLoading">保 存</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="transferDetails" :row-class-name="rowTransferDetailIndex" @selection-change="handleTransferDetailSelectionChange" ref="transferDetail" height="100%" border :summary-method="getSummaries" show-summary>
                <el-table-column type="selection" width="50" align="center" resizable v-if="dialogType !== 'view'" />
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材名称" align="center" prop="materialName" width="180" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialName || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="规格" align="center" prop="specification" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.specification || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="型号" align="center" prop="model" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.model || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="调拨数量" prop="transferQuantity" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.transferQuantity" placeholder="请输入数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @input="qtyChange(scope.row)"
                              :disabled="dialogType === 'view'"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批号" align="center" prop="batchNumber" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNumber || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产日期" align="center" prop="productionDate" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.productionDate || (scope.row.material && scope.row.material.productionDate) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期至" align="center" prop="expireDate" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.expireDate || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批次号" align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNo || (scope.row.material && scope.row.material.batchNo) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.registerNo || (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="manufacturer" width="180" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.manufacturer || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="供应商" align="center" prop="supplier" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplier || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right" v-if="dialogType !== 'view'">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="deleteDetail(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 添加明细弹窗 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      :selectedDetails="transferDetails"
      @closeDialog="closeInventoryDialog"
      @selectData="selectInventoryData"
    ></SelectInventory>

    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <transfer-order-print v-if="printRowData" :row="printRowData" ref="receiptOrderPrintRefAuto"></transfer-order-print>
    </div>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectInventory from '@/components/SelectModel/SelectInventory';
import { listWarehouseTransfer, getWarehouseTransfer, addWarehouseTransfer, updateWarehouseTransfer, delWarehouseTransfer } from '@/api/warehouse/warehouseTransfer';
import TransferOrderPrint from '../audit/transferOrderPrint';
import RMBConverter from '@/utils/tools';
export default {
  name: 'WarehouseTransferApply',
  components: {
    SelectWarehouse,
    SelectInventory,
    TransferOrderPrint
  },
  dicts: ['biz_status'],
  data() {
    return {
      // 状态管理
      loading: false,
      dialogLoading: false,
      submitLoading: false,
      showSearch: true,

      // 弹窗状态
      dialogVisible: false,
      dialogType: 'add', // add, edit, view
      DialogComponentShow: false,
      warehouseValue: '',

      // 调拨单表单数据
      transferForm: {
        transferOrderCode: '',
        fromWarehouseId: '',
        fromWarehouseName: '',
        toWarehouseId: '',
        toWarehouseName: '',
        transferDate: '',
        status: '',
        remark: ''
      },

      // 调拨明细
      transferDetails: [],
      checkedTransferDetail: [],
      action: true,

      // 表格数据
      tableData: [],
      ids: [],
      single: true,
      multiple: true,

      // 查询条件
      queryParams: {
        transferOrderCode: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        status: '',
        startDate: '',
        endDate: '',
        pageNum: 1,
        pageSize: 10
      },

      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      total: 0,
      // 打印数据（用于隐藏的打印组件）
      printRowData: null,

      // 弹窗表单验证规则
      rules: {
        fromWarehouseId: [
          { required: true, message: '请选择调出仓库', trigger: 'blur' },
          { validator: this.validateWarehouse, trigger: 'change' }
        ],
        toWarehouseId: [
          { required: true, message: '请选择调入仓库', trigger: 'blur' },
          { validator: this.validateWarehouse, trigger: 'change' }
        ],
        transferDate: [{ required: true, message: '请选择制单日期', trigger: 'blur' }]
      },

      // 明细行验证规则
      detailRules: {
        materialId: [{ required: true, message: '请选择耗材', trigger: 'blur' }],
        transferQuantity: [{ required: true, message: '请输入调拨数量', trigger: 'blur' },
                          { type: 'number', min: 1, message: '调拨数量必须大于0', trigger: 'blur' }],
        unitPrice: [{ type: 'number', min: 0, message: '单价不能小于0', trigger: 'blur' }]
      },

      // 仓库列表
      // warehouseOptions已通过SelectWarehouse组件替代

      // 状态选项 - 已改为使用dict.type.biz_status
    };
  },
  computed: {
    // 表单总金额
    formTotalAmount() {
      let total = 0;
      if (this.transferDetails && this.transferDetails.length > 0) {
        this.transferDetails.forEach(item => {
          if (item.amt && !isNaN(item.amt)) {
            total += parseFloat(item.amt);
          }
        });
      }
      return total > 0 ? '￥' + total.toFixed(2) : '￥0.00';
    },
    // 制单人显示名称
    createrDisplayName() {
      // 优先使用表单中的制单人信息
      if (this.transferForm.createrName) {
        return this.transferForm.createrName;
      }
      if (this.transferForm.creater && this.transferForm.creater.nickName) {
        return this.transferForm.creater.nickName;
      }
      if (this.transferForm.creater && this.transferForm.creater.userName) {
        return this.transferForm.creater.userName;
      }
      // 如果没有制单人信息，使用当前登录用户
      const user = this.$store.state.user;
      if (user && user.name) {
        return user.name;
      }
      if (user && user.nickName) {
        return user.nickName;
      }
      return '';
    }
  },
  methods: {
    // 表格汇总计算
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 1) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'transferQuantity') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.transferQuantity && !isNaN(item.transferQuantity)) {
              totalQty += parseFloat(item.transferQuantity);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    

    // 获取默认起始日期（当前日期往前5天）
    getDefaultStartDate() {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 获取默认结束日期（当前日期）
    getDefaultEndDate() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 获取调拨单列表
    async getTransferList() {
      this.loading = true;
      try {
        // 映射查询参数到后端字段
        const params = {
          billNo: this.queryParams.transferOrderCode,
          fromWarehouseId: this.queryParams.fromWarehouseId,
          toWarehouseId: this.queryParams.toWarehouseId,
          billStatus: this.queryParams.status,
          beginDate: this.queryParams.startDate,
          endDate: this.queryParams.endDate,
          pageNum: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        };

        // 调用后端API获取数据
        const response = await listWarehouseTransfer(params);
        if (response && response.rows) {
          // 调试：打印第一条数据，查看实际返回的字段
          if (response.rows.length > 0) {
            console.log('调拨申请列表 - 原始数据示例:', JSON.stringify(response.rows[0], null, 2));
            console.log('制单人相关字段:', {
              createrName: response.rows[0].createrName,
              createrNickName: response.rows[0].createrNickName,
              createrUserName: response.rows[0].createrUserName,
              creater: response.rows[0].creater,
              createBy: response.rows[0].createBy
            });
            console.log('总金额相关字段:', {
              totalAmount: response.rows[0].totalAmount,
              total_amount: response.rows[0].total_amount,
              totalAmt: response.rows[0].totalAmt
            });
          }
          // 映射后端返回的数据到前端字段
          this.tableData = response.rows.map(row => {
            // 保留原始字段，同时添加映射字段
            const mappedRow = {
              ...row,
              transferOrderCode: row.billNo || row.transferOrderCode,
              // 调出仓库：使用warehouse.name
              fromWarehouseName: row.fromWarehouseName || (row.warehouse && row.warehouse.name) || (row.fromWarehouse && row.fromWarehouse.name) || (row.warehouseName) || '--',
              // 调入仓库：对于调拨单(billType=501)，departmentId存储的是调入仓库ID，需要显示仓库名称而不是科室名称
              // 后端SQL查询中已经关联了tw (toWarehouse)表，所以应该使用toWarehouseName
              toWarehouseName: row.toWarehouseName || (row.toWarehouse && row.toWarehouse.name) || '--',
              createTime: row.createTime || row.billDate,
              status: row.billStatus || row.status,
              // 制单人 - 从多个可能的字段获取，优先使用后端返回的 createrName（已映射自 createrUserName）
              createrName: row.createrName || row.createrNickName || row.createrUserName || 
                          (row.creater && (row.creater.nickName || row.creater.userName)) ||
                          (row.createBy && (row.createBy.nickName || row.createBy.userName)) ||
                          (row.user && (row.user.nickName || row.user.userName)) ||
                          '',
              // 保留原始字段以便表格列也能访问
              createrNickName: row.createrNickName,
              createrUserName: row.createrUserName,
              // 总金额 - 从多个可能的字段获取，优先使用后端返回的 totalAmount（已映射自 total_amount）
              totalAmount: (row.totalAmount !== undefined && row.totalAmount !== null && row.totalAmount !== '' && !isNaN(row.totalAmount) && parseFloat(row.totalAmount) >= 0) 
                          ? parseFloat(row.totalAmount) 
                          : ((row.total_amount !== undefined && row.total_amount !== null && row.total_amount !== '' && !isNaN(row.total_amount) && parseFloat(row.total_amount) >= 0) 
                            ? parseFloat(row.total_amount) 
                            : (row.totalAmt !== undefined && row.totalAmt !== null && row.totalAmt !== '' && !isNaN(row.totalAmt) && parseFloat(row.totalAmt) >= 0)
                              ? parseFloat(row.totalAmt)
                              : null),
              // 保留原始字段以便表格列也能访问
              total_amount: row.total_amount,
              auditPersonName: row.auditPersonName || row.auditNickName || row.auditUserName || (row.auditBy && (row.auditBy.nickName || row.auditBy.userName)),
              auditDate: row.auditDate
            };
            // 调试：打印映射后的数据
            if (response.rows.indexOf(row) === 0) {
              console.log('调拨申请列表 - 映射后数据示例:', mappedRow);
            }
            return mappedRow;
          });
          this.pagination.total = response.total;
          this.total = response.total;
        } else {
          this.tableData = [];
          this.pagination.total = 0;
          this.total = 0;
        }
      } catch (error) {
        this.$modal.msgError('获取调拨单列表失败：' + (error.message || '未知错误'));
        console.error('获取调拨单列表失败', error);
        this.tableData = [];
        this.pagination.total = 0;
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },

    // 查看调拨单详情
    async viewTransfer(row) {
      this.dialogLoading = true;
      try {
        // 调用后端API获取详情
        const response = await getWarehouseTransfer(row.id);
        if (response && response.data) {
          const data = response.data;
          this.dialogType = 'view';
          this.transferForm = {
            transferOrderCode: data.billNo || data.transferOrderCode,
            fromWarehouseId: data.warehouseId,
            fromWarehouseName: data.warehouse ? data.warehouse.name : '',
            toWarehouseId: data.departmentId, // 调入仓库ID存储在departmentId中
            toWarehouseName: data.toWarehouse ? data.toWarehouse.name : '',
            transferDate: data.billDate || data.transferDate,
            status: data.billStatus || data.status,
            remark: data.remark || '',
            createrName: data.createrName || (data.creater ? (data.creater.nickName || data.creater.userName) : ''),
            creater: data.creater
          };
          
          // 映射明细数据
          if (data.stkIoBillEntryList && data.stkIoBillEntryList.length > 0) {
            this.transferDetails = data.stkIoBillEntryList.map(entry => {
              const material = entry.material || {};
              return {
                id: entry.id,
                materialId: entry.materialId,
                materialCode: material.code || entry.materialCode || '',
                materialName: material.name || entry.materialName || '',
                specification: material.speci || entry.specification || '',
                model: material.model || entry.model || '',
                unit: (material.fdUnit && material.fdUnit.unitName) || entry.unit || '',
                transferQuantity: entry.qty || entry.transferQuantity || 0,
                unitPrice: entry.unitPrice || entry.price || 0,
                amt: entry.amt || 0,
                batchNumber: entry.batchNo || entry.batchNumber || '',
                batchNo: entry.batchNumber || entry.batchNo || '',
                productionDate: entry.beginTime ? this.parseTime(entry.beginTime, '{y}-{m}-{d}') : '',
                expireDate: entry.endTime ? this.parseTime(entry.endTime, '{y}-{m}-{d}') : '',
                registerNo: material.registerNo || entry.registerNo || '',
                manufacturer: (material.fdFactory && material.fdFactory.factoryName) || entry.manufacturer || '',
                supplier: (entry.supplier && entry.supplier.name) || entry.supplier || '',
                remark: entry.remark || '',
                material: material
              };
            });
          } else {
            this.transferDetails = [];
          }
          this.action = false;
          this.dialogVisible = true;
        } else {
          this.$modal.msgError('获取调拨单详情失败：数据为空');
        }
      } catch (error) {
        this.$modal.msgError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 修改调拨单
    async editTransfer(row) {
      if (row.status == 2 || row.status == '2') {
        this.$modal.msgError('只能修改未审核的调拨单');
        return;
      }

      this.dialogLoading = true;
      try {
        // 调用后端API获取详情
        const response = await getWarehouseTransfer(row.id);
        if (response && response.data) {
          const data = response.data;
          this.dialogType = 'edit';
          this.transferForm = {
            id: data.id,
            transferOrderCode: data.billNo || data.transferOrderCode,
            fromWarehouseId: data.warehouseId,
            fromWarehouseName: data.warehouse ? data.warehouse.name : '',
            toWarehouseId: data.departmentId, // 调入仓库ID存储在departmentId中
            toWarehouseName: data.toWarehouse ? data.toWarehouse.name : '',
            transferDate: data.billDate || data.transferDate,
            status: data.billStatus || data.status,
            remark: data.remark || '',
            createrName: data.createrName || (data.creater ? (data.creater.nickName || data.creater.userName) : ''),
            creater: data.creater
          };
          
          // 映射明细数据
          console.log('编辑调拨单 - 后端返回的数据:', data);
          console.log('编辑调拨单 - 明细列表:', data.stkIoBillEntryList);
          
          // 确保 transferDetails 被清空并重新初始化
          this.transferDetails = [];
          
          if (data.stkIoBillEntryList && data.stkIoBillEntryList.length > 0) {
            this.transferDetails = data.stkIoBillEntryList.map((entry, index) => {
              console.log(`处理明细项 ${index}:`, entry);
              const material = entry.material || {};
              console.log(`明细项 ${index} 的 material:`, material);
              
              const mappedEntry = {
                id: entry.id,
                materialId: entry.materialId,
                materialCode: material.code || '',
                materialName: material.name || '',
                specification: material.speci || '',
                model: material.model || '',
                unit: (material.fdUnit && material.fdUnit.unitName) || '',
                transferQuantity: entry.qty || 0,
                unitPrice: entry.unitPrice || 0,
                amt: entry.amt || 0,
                batchNumber: entry.batchNo || '',
                batchNo: entry.batchNumber || '',
                productionDate: entry.beginTime ? this.parseTime(entry.beginTime, '{y}-{m}-{d}') : '',
                expireDate: entry.endTime ? this.parseTime(entry.endTime, '{y}-{m}-{d}') : '',
                registerNo: material.registerNo || '',
                manufacturer: (material.fdFactory && material.fdFactory.factoryName) || '',
                supplier: (material.supplier && material.supplier.name) || '',
                remark: entry.remark || '',
                material: material
              };
              console.log(`映射后的明细项 ${index}:`, mappedEntry);
              return mappedEntry;
            });
            console.log('编辑调拨单 - 最终明细列表:', this.transferDetails);
            console.log('编辑调拨单 - 明细数量:', this.transferDetails.length);
          } else {
            console.warn('编辑调拨单 - 没有明细数据，stkIoBillEntryList:', data.stkIoBillEntryList);
            this.transferDetails = [];
          }
          
          // 强制更新视图
          this.$nextTick(() => {
            console.log('视图更新后的 transferDetails:', this.transferDetails);
          });
          this.action = true;
          this.dialogVisible = true;
        } else {
          this.$modal.msgError('获取调拨单详情失败：数据为空');
        }
      } catch (error) {
        this.$modal.msgError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 添加调拨单
    addTransfer() {
      this.dialogType = 'add';
      this.action = true;
      // 生成调拨单号 DB-开头
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const timestamp = Date.now().toString().substring(8);
      const transferOrderCode = `DB-${dateStr}${timestamp}`;
      
      this.transferForm = {
        transferOrderCode: transferOrderCode,
        fromWarehouseId: '',
        fromWarehouseName: '',
        toWarehouseId: '',
        toWarehouseName: '',
        transferDate: new Date().toISOString().split('T')[0],
        status: '1',
        remark: ''
      };
      this.transferDetails = [];
      this.checkedTransferDetail = [];
      this.dialogVisible = true;
    },

    // 序号生成
    rowTransferIndex({ row, rowIndex }) {
      row.index = (this.pagination.currentPage - 1) * this.pagination.pageSize + rowIndex + 1;
    },

    // 选择框变化
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },

    // 删除调拨单
    deleteTransfer(row) {
      if (row.status == 2 || row.status == '2') {
        this.$modal.msgError('只能删除未审核的调拨单');
        return;
      }

      const billNo = row.transferOrderCode;
      this.$modal.confirm('是否确认删除调拨申请单，单号"' + billNo + '"的数据项？').then(async () => {
        this.loading = true;
        try {
          // 调用后端API删除数据
          await delWarehouseTransfer(row.id);
          this.getTransferList();
          this.$modal.msgSuccess('删除成功');
        } catch (error) {
          this.$modal.msgError('删除失败：' + (error.message || '未知错误'));
          console.error('删除调拨单失败', error);
        } finally {
          this.loading = false;
        }
      }).catch(() => {
        // 取消删除
      });
    },

    // 提交调拨单
    async submitTransfer() {
      // 先验证仓库不能相同
      if (this.transferForm.fromWarehouseId && this.transferForm.toWarehouseId && 
          this.transferForm.fromWarehouseId === this.transferForm.toWarehouseId) {
        this.$message.error('调出仓库和调入仓库不能相同！');
        return;
      }

      this.$refs.transferForm.validate(async (valid) => {
        if (valid) {
          // 验证明细
          if (this.transferDetails.length === 0) {
            this.$modal.msgError('请添加调拨明细');
            return;
          }

          // 验证明细内容
          const hasError = this.transferDetails.some(detail => {
            return !detail.materialName || !detail.transferQuantity || detail.transferQuantity <= 0;
          });

          if (hasError) {
            this.$modal.msgError('请检查调拨明细，确保所有必填项都已填写且数量大于0');
            return;
          }

          this.submitLoading = true;
          try {
            // 计算总金额
            let totalAmount = 0;
            this.transferDetails.forEach(detail => {
              if (detail.amt && !isNaN(detail.amt)) {
                totalAmount += parseFloat(detail.amt);
              }
            });
            
            // 构建提交数据，映射字段名
            // 注意：StkIoBill表只有warehouseId字段，暂时使用warehouseId作为调出仓库
            // 调入仓库信息可能需要存储在remark或其他字段中，或需要扩展表结构
            const submitData = {
              id: this.transferForm.id, // 编辑时需要传递ID
              billNo: this.transferForm.transferOrderCode,
              billDate: this.transferForm.transferDate,
              billStatus: this.transferForm.status || '1',
              warehouseId: this.transferForm.fromWarehouseId, // 调出仓库
              departmentId: this.transferForm.toWarehouseId, // 暂时使用departmentId存储调入仓库ID
              totalAmount: totalAmount.toFixed(2), // 计算并传递总金额
              remark: this.transferForm.remark || '',
              stkIoBillEntryList: this.transferDetails.map(detail => {
                // 构建明细数据，确保所有必要字段都有值
                const entry = {
                  materialId: detail.materialId,
                  qty: detail.transferQuantity || 0,
                  unitPrice: detail.unitPrice || 0,
                  amt: detail.amt || 0,
                  batchNo: detail.batchNumber || detail.batchNo || '',
                  batchNumber: detail.batchNo || detail.batchNumber || '',
                  beginTime: detail.productionDate ? (detail.productionDate.includes(' ') ? detail.productionDate : detail.productionDate + ' 00:00:00') : null,
                  endTime: detail.expireDate ? (detail.expireDate.includes(' ') ? detail.expireDate : detail.expireDate + ' 00:00:00') : null,
                  remark: detail.remark || '',
                  delFlag: 0 // 确保删除标志为0
                };
                // 只有编辑时且明细有ID时才传递ID，新增的明细不传ID
                if (detail.id) {
                  entry.id = detail.id;
                }
                return entry;
              })
            };

            // 调用后端API保存数据
            let savedId = this.transferForm.id;
            console.log('保存前的明细数据:', this.transferDetails);
            console.log('提交的数据:', JSON.stringify(submitData, null, 2));
            
            if (this.dialogType === 'add') {
              const addResponse = await addWarehouseTransfer(submitData);
              // 新增成功后，获取返回的ID
              if (addResponse && addResponse.data && addResponse.data.id) {
                savedId = addResponse.data.id;
              }
            } else {
              const updateResponse = await updateWarehouseTransfer(submitData);
              console.log('更新响应:', updateResponse);
            }

            // 如果是编辑模式，保存后重新加载数据并保持对话框打开
            if (this.dialogType === 'edit' && savedId) {
              // 重新获取最新数据
              try {
                const response = await getWarehouseTransfer(savedId);
                if (response && response.data) {
                  const data = response.data;
                  // 更新表单数据
          this.transferForm = {
            id: data.id,
            transferOrderCode: data.billNo || data.transferOrderCode,
            fromWarehouseId: data.warehouseId,
            fromWarehouseName: data.warehouse ? data.warehouse.name : '',
            toWarehouseId: data.departmentId,
            toWarehouseName: data.toWarehouse ? data.toWarehouse.name : '',
            transferDate: data.billDate || data.transferDate,
            status: data.billStatus || data.status,
            remark: data.remark || '',
            createrName: data.createrName || (data.creater ? (data.creater.nickName || data.creater.userName) : ''),
            creater: data.creater
          };
                  
                  // 重新加载明细数据
                  if (data.stkIoBillEntryList && data.stkIoBillEntryList.length > 0) {
                    this.transferDetails = data.stkIoBillEntryList.map((entry, index) => {
                      const material = entry.material || {};
                      return {
                        id: entry.id,
                        materialId: entry.materialId,
                        materialCode: material.code || '',
                        materialName: material.name || '',
                        specification: material.speci || '',
                        model: material.model || '',
                        unit: (material.fdUnit && material.fdUnit.unitName) || '',
                        transferQuantity: entry.qty || 0,
                        unitPrice: entry.unitPrice || 0,
                        amt: entry.amt || 0,
                        batchNumber: entry.batchNo || '',
                        batchNo: entry.batchNumber || '',
                        productionDate: entry.beginTime ? this.parseTime(entry.beginTime, '{y}-{m}-{d}') : '',
                        expireDate: entry.endTime ? this.parseTime(entry.endTime, '{y}-{m}-{d}') : '',
                        registerNo: material.registerNo || '',
                        manufacturer: (material.fdFactory && material.fdFactory.factoryName) || '',
                        supplier: (material.supplier && material.supplier.name) || '',
                        remark: entry.remark || '',
                        material: material
                      };
                    });
                  } else {
                    this.transferDetails = [];
                  }
                  
                  // 强制更新视图
                  this.$nextTick(() => {
                    this.calculateTotals();
                  });
                }
              } catch (error) {
                console.error('重新加载数据失败', error);
              }
              
              // 刷新列表
              this.getTransferList();
              this.$modal.msgSuccess('修改成功');
              // 保持对话框打开
            } else {
              // 新增模式，保存后关闭对话框
              this.dialogVisible = false;
              this.getTransferList();
              this.$modal.msgSuccess('新增成功');
            }
          } catch (error) {
            this.$modal.msgError('提交失败：' + (error.message || '未知错误'));
            console.error('提交调拨单失败', error);
          } finally {
            this.submitLoading = false;
          }
        }
      });
    },

    // 添加明细
    addDetail() {
      if(!this.transferForm.fromWarehouseId) {
        this.$message({ message: '请先选择调出仓库', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.transferForm.fromWarehouseId;
    },
    // 关闭库存明细弹窗
    closeInventoryDialog() {
      this.DialogComponentShow = false
    },
    // 处理选择库存明细数据
    selectInventoryData(val) {
      //监听"弹窗组件"返回的数据
      const selectRow = val;
      let addedCount = 0;
      let skippedCount = 0;

      selectRow.forEach((item, index) => {
        // 检查是否已存在相同的明细（根据materialId和batchNo判断）
        const isDuplicate = this.transferDetails.some(detail => {
          return detail.materialId === item.materialId && 
                 detail.batchNo === item.batchNo;
        });
        
        if (isDuplicate) {
          skippedCount++;
          return; // 跳过已存在的明细
        }
        
        let obj = {};
        obj.materialId = item.materialId;
        obj.materialCode = item.material ? item.material.code : '';
        obj.materialName = item.material ? item.material.name : '';
        obj.specification = item.material ? item.material.speci : '';
        obj.model = item.material ? item.material.model : '';
        obj.unit = item.material && item.material.fdUnit ? item.material.fdUnit.unitName : '';
        obj.transferQuantity = item.qty || '';
        obj.unitPrice = item.unitPrice || '';
        obj.amt = item.amt || '';
        obj.batchNumber = item.materialNo || '';
        obj.productionDate = item.beginTime ? this.parseTime(item.beginTime, '{y}-{m}-{d}') : '';
        obj.expireDate = item.endTime ? this.parseTime(item.endTime, '{y}-{m}-{d}') : '';
        obj.batchNo = item.batchNo || '';
        obj.registerNo = item.material ? item.material.registerNo : '';
        obj.manufacturer = item.material && item.material.fdFactory ? item.material.fdFactory.factoryName : '';
        obj.supplier = item.supplier ? item.supplier.name : '';
        obj.remark = item.remark || '';
        obj.material = item.material;

        this.transferDetails.push(obj);
        addedCount++;
      });
      
      // 提示用户添加结果
      if (addedCount > 0) {
        this.$message.success(`成功添加 ${addedCount} 条明细`);
      }
      if (skippedCount > 0) {
        this.$message.warning(`跳过 ${skippedCount} 条已存在的明细`);
      }
      
      this.calculateTotals();
    },

    // 删除明细
    deleteDetail(index) {
      this.transferDetails.splice(index, 1);
      this.calculateTotals();
    },

    // 删除选中的明细
    handleDeleteTransferDetail() {
      if (this.checkedTransferDetail.length == 0) {
        this.$modal.msgError("请先选择要删除的调拨申请明细数据");
      } else {
        const transferDetails = this.transferDetails;
        const checkedTransferDetail = this.checkedTransferDetail;
        this.transferDetails = transferDetails.filter(function(item) {
          return checkedTransferDetail.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },

    // 明细选择变化
    handleTransferDetailSelectionChange(selection) {
      this.checkedTransferDetail = selection.map(item => item.index);
    },

    // 明细序号
    rowTransferDetailIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },

    // 数量变化计算金额
    qtyChange(row) {
      if (row.transferQuantity && row.unitPrice) {
        row.amt = (parseFloat(row.transferQuantity) * parseFloat(row.unitPrice)).toFixed(2);
      } else {
        row.amt = '';
      }
      this.calculateTotals();
    },

    // 计算合计
    calculateTotals() {
      // 合计计算在表格的summary-method中处理
    },

    // 重置查询条件
    resetQuery() {
      this.queryParams = {
        transferOrderCode: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        status: '',
        startDate: '',
        endDate: '',
        pageNum: 1,
        pageSize: 10
      };
      this.pagination.currentPage = 1;
      this.queryParams.pageNum = 1;
      this.getTransferList();
    },

    // 导出
    handleExport() {
      // TODO: 实现导出功能
      this.download('warehouseTransfer/apply/export', {
        ...this.queryParams
      }, `transfer_${new Date().getTime()}.xlsx`)
    },

    // 分页变更（通过pagination组件触发）
    handlePaginationChange() {
      this.pagination.currentPage = this.queryParams.pageNum;
      this.pagination.pageSize = this.queryParams.pageSize;
      this.getTransferList();
    },

    // 关闭弹窗
    closeDialog() {
      this.dialogVisible = false;
      this.$refs.transferForm && this.$refs.transferForm.resetFields();
      this.transferDetails = [];
      this.checkedTransferDetail = [];
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      // 直接获取数据并触发打印
      this.getTransferDetail(row).then(res => {
        // 设置打印数据
        this.printRowData = res
        // 等待组件渲染后调用 start()
        this.$nextTick(() => {
          if (this.$refs['receiptOrderPrintRefAuto']) {
            // start() 方法会直接触发浏览器打印对话框
            this.$refs['receiptOrderPrintRefAuto'].start()
          }
        })
      })
    },
    //组装打印信息
    getTransferDetail(row) {
      //查询详情
      return getWarehouseTransfer(row.id).then(response => {
        const details = response.data.stkIoBillEntryList || []
        const data = response.data

        let detailList = [], totalAmt = 0, totalQty = 0

        details && details.forEach(item => {
          const material = item.material || {}
          totalAmt += parseFloat(item.amt || 0)
          totalQty += parseFloat(item.qty || 0)

          detailList.push({
            materialCode: material.code || '',
            materialName: material.name || '',
            materialSpeci: material.speci || '',
            materialModel: material.model || '',
            unitPrice: item.unitPrice || 0,
            qty: item.qty || 0,
            amt: item.amt || 0,
            batchNumber: item.batchNumber || item.batchNo || '',
            periodDate: item.endTime ? this.parseTime(item.endTime, '{y}-{m}-{d}') : '',
            factoryName: (material.fdFactory && material.fdFactory.factoryName) || '',
            supplierName: (material.supplier && material.supplier.name) || ''
          })
        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        // 获取调出仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let fromWarehouseName = '';
        if (data.warehouse && data.warehouse.name) {
          fromWarehouseName = data.warehouse.name;
        } else if (data.fromWarehouseName) {
          fromWarehouseName = data.fromWarehouseName;
        } else if (row.warehouse && row.warehouse.name) {
          fromWarehouseName = row.warehouse.name;
        } else if (row.fromWarehouseName) {
          fromWarehouseName = row.fromWarehouseName;
        }

        // 获取调入仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let toWarehouseName = '';
        if (data.toWarehouse && data.toWarehouse.name) {
          toWarehouseName = data.toWarehouse.name;
        } else if (data.toWarehouseName) {
          toWarehouseName = data.toWarehouseName;
        } else if (row.toWarehouse && row.toWarehouse.name) {
          toWarehouseName = row.toWarehouse.name;
        } else if (row.toWarehouseName) {
          toWarehouseName = row.toWarehouseName;
        }

        return {
          billNo: data.billNo || row.billNo,
          fromWarehouseName: fromWarehouseName,
          toWarehouseName: toWarehouseName,
          billDate: data.billDate ? this.parseTime(data.billDate, '{y}-{m}-{d}') : (row.billDate ? this.parseTime(row.billDate, '{y}-{m}-{d}') : ''),
          auditDate: data.auditDate ? this.parseTime(data.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : (row.auditDate ? this.parseTime(row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : ''),
          createrName: (data.creater && (data.creater.nickName || data.creater.userName)) || 
                      (row.creater && (row.creater.nickName || row.creater.userName)) || 
                      row.createrName || '',
          auditPersonName: (data.auditPerson && (data.auditPerson.nickName || data.auditPerson.userName)) || 
                          (row.auditPerson && (row.auditPerson.nickName || row.auditPerson.userName)) || 
                          row.auditPersonName || '',
          totalAmt: totalAmt.toFixed(2),
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList: detailList
        }
      })
    },

    // 科室选择处理
    onWarehouseChange(type, warehouse) {
      if (type === 'from') {
        this.transferForm.fromWarehouseId = warehouse ? warehouse.id : '';
        this.transferForm.fromWarehouseName = warehouse ? warehouse.name : '';
      } else {
        this.transferForm.toWarehouseId = warehouse ? warehouse.id : '';
        this.transferForm.toWarehouseName = warehouse ? warehouse.name : '';
      }
      
      // 验证仓库不能相同
      if (this.transferForm.fromWarehouseId && this.transferForm.toWarehouseId && 
          this.transferForm.fromWarehouseId === this.transferForm.toWarehouseId) {
        this.$message.warning('调出仓库和调入仓库不能相同！');
        // 清空当前选择的仓库
        if (type === 'from') {
          this.transferForm.fromWarehouseId = '';
          this.transferForm.fromWarehouseName = '';
        } else {
          this.transferForm.toWarehouseId = '';
          this.transferForm.toWarehouseName = '';
        }
        // 触发表单验证
        this.$nextTick(() => {
          this.$refs.transferForm && this.$refs.transferForm.validateField(type === 'from' ? 'fromWarehouseId' : 'toWarehouseId');
        });
      }
    },
    
    // 自定义验证器：验证仓库不能相同
    validateWarehouse(rule, value, callback) {
      if (!value) {
        callback();
        return;
      }
      
      const otherWarehouseId = rule.field === 'fromWarehouseId' 
        ? this.transferForm.toWarehouseId 
        : this.transferForm.fromWarehouseId;
      
      if (otherWarehouseId && value === otherWarehouseId) {
        callback(new Error('调出仓库和调入仓库不能相同！'));
      } else {
        callback();
      }
    }
  },

  // 页面挂载时获取列表数据
  // 页面创建时初始化默认日期
  created() {
    // 初始化默认日期范围：起始日期为当前日期往前5天，结束日期为当前日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    this.queryParams.startDate = formatDate(startDate);
    this.queryParams.endDate = formatDate(endDate);
  },
  
  mounted() {
    this.getTransferList();
  }
};
</script>

<style scoped>
/* 表单容器样式 - 与出库申请页面保持一致 */
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

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
}

.detail-table-container {
  margin-top: 10px;
  width: 100%;
  min-height: 500px;
  max-height: 600px;
  overflow-x: auto;
  overflow-y: auto;
}

.detail-table-container .el-table {
  width: 100%;
  min-width: 1400px;
}

/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
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
  min-height: 95vh !important;
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

.local-modal-content .el-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.local-modal-content .form-fields-container {
  flex-shrink: 0;
}

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
}

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 防止表格列自动换行 */
::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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

/* 主表格水平滚动条增粗 - 与出库申请页面保持一致 */
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

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

/* 确保固定列头部和主体都有正确的z-index */
::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

/* 确保固定列在滚动时保持固定 */
::v-deep .el-table__fixed {
  position: absolute !important;
}

::v-deep .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

/* 确保表格可以水平滚动 */
::v-deep .el-table {
  overflow-x: auto;
}
</style>

