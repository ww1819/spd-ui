<template>
  <div class="app-container list-page gzOrder-goodsApply-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.goodsNo"
              placeholder="退货单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库"/>
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-radio-group v-model="queryParams.timeField" size="small" class="apply-date-type-group">
                <el-radio-button label="createTime">制单日期</el-radio-button>
                <el-radio-button label="auditDate">审核日期</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item class="query-item-inline query-item-status">
              <el-select v-model="queryParams.goodsStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
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
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['gzOrder:goodsApply:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['gzOrder:goodsApply:export']"
        >导出</el-button>
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          :disabled="single"
          @click="handleAudit"
          v-hasPermi="['gzOrder:goodsApply:audit']"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="multiple"
          @click="handleBatchPrint"
        >批量打印</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="goodsList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="退货单号" align="center" prop="goodsNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.goodsNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')" />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="总金额" align="center" prop="totalAmt" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByTotalAmt">
        <template slot-scope="scope">
          <span>{{ formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="goodsDate" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByGoodsDate">
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.goodsDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="goodsStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.goodsStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          <span>{{ scope.row.auditBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span>{{ scope.row.auditDate ? formatDisplayDateTime(scope.row.auditDate) : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" class-name="apply-action-col small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.goodsStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['gzOrder:goodsApply:edit']"
              v-if="scope.row.goodsStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['gzOrder:goodsApply:remove']"
              v-if="scope.row.goodsStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="handlePagination"
    />
    </div>
    </div>

    <!-- 添加或修改高值退货对话框 -->
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
                <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseSupplierLocked" includeWarehouseType="高值"/>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="供应商" prop="supplerId">
                <SelectSupplier v-model="form.supplerId" :disabled="!action || warehouseSupplierLocked"/>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="单据状态" prop="goodsStatus">
                <dict-tag :options="dict.type.biz_status" :value="form.goodsStatus"/>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="制单时间" prop="goodsDate" class="form-item-goods-date-no-star">
                <el-date-picker clearable
                                v-model="form.goodsDate"
                                type="date"
                                :disabled="true"
                                value-format="yyyy-MM-dd"
                                style="width: 100%"
                                placeholder="请选择制单时间">
                </el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="制单人" prop="createBy">
                <el-input v-model="form.createBy" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="false" :gutter="8">
            <el-col :span="4">
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
          <el-row :gutter="8">
            <el-col :span="4">
              <el-form-item label="总金额">
                <el-input :value="getTotalAmount()" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12" v-show="action">
              <el-form-item label="扫院内码" label-width="80px">
                <el-input
                  v-model="scanCodeInput"
                  placeholder="请先选择仓库与供应商，在此回车扫描院内码添加明细"
                  :disabled="!action || scanThDisabled"
                  clearable
                  style="width: 100%; max-width: none"
                  @keyup.enter.native="onScanDepotInHospitalCode"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8" />
          </el-row>
        </div>

        <div class="modal-detail-section">
        <el-row :gutter="10" class="detail-toolbar-row">
          <el-col :span="1.5">
            <span>退货明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" plain icon="el-icon-link" size="small"
                         v-hasPermi="['gz:refDoc:query']"
                         @click="openRefAcceptanceTh">引用验收单</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button size="small" @click="cancel">取 消</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" icon="el-icon-finished" size="small" :disabled="isAuditedForm || hasDialogUnsavedChanges || !form.id" @click="handleDialogAudit">审 核</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-printer" size="small" :disabled="hasDialogUnsavedChanges || !form.id || !isAuditedForm" @click="handleDialogPrint">打 印</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" :disabled="isAuditedForm" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" :disabled="isAuditedForm" @click="handleDeleteGzRefundGoodsEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="gzRefundGoodsEntryList" :row-class-name="rowGzRefundGoodsEntryIndex"
                  @selection-change="handleGzRefundGoodsEntrySelectionChange"
                  ref="gzRefundGoodsEntry" border show-summary :summary-method="getSummaries" :height="detailTableHeight">
          <el-table-column type="selection" width="60" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
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
              <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
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
              <el-input v-model="scope.row.remark" placeholder="备注" />
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

    <el-dialog title="引用备货验收单（当前仓库有库存且供应商一致）" :visible.sync="refAccThOpen" width="800px" append-to-body>
      <el-table :data="refAccThList" v-loading="refAccThLoading" highlight-current-row
                @row-click="row => { refPickAccOrderId = row.id; refPickAccOrderNo = row.orderNo }" max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column prop="orderNo" label="验收单号" min-width="140" show-overflow-tooltip/>
        <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refAccThOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefAcceptanceTh">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" :printType="'refund'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>
  </div>
</template>

<script>
import { listGoods, getGoods, delGoods, addGoods, updateGoods, auditGoods } from "@/api/gz/goods";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listAuditedAcceptance, listAcceptanceDepotLines } from "@/api/gz/refDoc";
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
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      _lastSidebarNavTick: null,
      refAccThOpen: false,
      refAccThList: [],
      refAccThLoading: false,
      refPickAccOrderId: null,
      refPickAccOrderNo: null,
      // 总条数
      total: 0,
      // 高值退货表格数据
      goodsList: [],
      // 高值退货明细表格数据
      gzRefundGoodsEntryList: [],
      scanCodeInput: '',
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
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        timeField: "createTime",
        warehouseId: null,
        goodsStatus: null,
        goodsType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "请选择仓库", trigger: "change" }
        ],
        supplerId: [
          { required: true, message: "请选择供应商", trigger: "change" }
        ],
      },
      dialogSavedSnapshot: ''
    };
  },
  computed: {
    warehouseSupplierLocked() {
      return this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0;
    },
    scanThDisabled() {
      return !this.form.warehouseId || !this.form.supplerId;
    },
    /** 与到货验收 inWarehouse/audit 弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    isAuditedForm() {
      const status = this.form && this.form.goodsStatus;
      return status === '2' || status === 2;
    },
    hasDialogUnsavedChanges() {
      if (!this.open || !this.action) return false;
      if (!this.dialogSavedSnapshot) return true;
      return this.buildDialogSnapshot() !== this.dialogSavedSnapshot;
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    goodsList() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    'queryParams.pageSize'() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.gzRefundGoodsEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    gzRefundGoodsEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          const t = this.$refs.gzRefundGoodsEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      this.$nextTick(() => {
        this.updateMainTableHeight();
        requestAnimationFrame(() => this.updateMainTableHeight());
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) table.doLayout();
        this.$nextTick(() => {
          this.syncApplyTableSticky();
          requestAnimationFrame(() => this.syncApplyTableSticky());
        });
      });
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`);
    },
    normalizeRoutePath(path) {
      if (!path) return '';
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) return normalized.slice(0, -1);
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) return;
      if (nav.tick === this._lastSidebarNavTick) return;
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.goodsList || !this.goodsList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.goodsList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) table.toggleRowSelection(row, true);
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      void this.mainListSelectionTick;
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) return 'apply-row-selected';
      return '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) v = v && v[k];
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreatorName(a, b) {
      const va = (a && a.createBy) || '';
      const vb = (b && b.createBy) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditorName(a, b) {
      const va = (a && a.auditBy) || '';
      const vb = (b && b.auditBy) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByGoodsDate(a, b) {
      const pick = (row) => row && (row.goodsDate || row.createTime) || '';
      const va = pick(a);
      const vb = pick(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditDate(a, b) {
      const va = (a && a.auditDate) || '';
      const vb = (b && b.auditDate) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByTotalAmt(a, b) {
      const va = parseFloat(a && a.totalAmt);
      const vb = parseFloat(b && b.totalAmt);
      return (Number.isFinite(va) ? va : 0) - (Number.isFinite(vb) ? vb : 0);
    },
    handlePagination({ page, limit } = {}) {
      if (page != null) {
        this.queryParams.pageNum = page;
      }
      if (limit != null) {
        this.queryParams.pageSize = limit;
      }
      this.getList();
    },
    formatTotalAmt(row) {
      if (row.totalAmt != null && row.totalAmt !== undefined) {
        return this.formatAmount(row.totalAmt);
      }
      if (row.gzRefundGoodsEntryList && row.gzRefundGoodsEntryList.length > 0) {
        const total = row.gzRefundGoodsEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return this.formatAmount(total);
      }
      return '0.00';
    },
    getStatDate() {
      const myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      const year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      let day = myDate.getDate();
      day = day < 10 ? '0' + day : day;
      return `${year}-${month}-${day} 00:00:00`;
    },
    getEndDate() {
      const myDate = new Date();
      const year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      let day = myDate.getDate();
      day = day < 10 ? '0' + day : day;
      return `${year}-${month}-${day} 23:59:59`;
    },
    buildDialogSnapshot() {
      const form = this.form || {};
      return JSON.stringify({
        id: form.id || null,
        goodsNo: form.goodsNo || null,
        goodsDate: form.goodsDate || null,
        warehouseId: form.warehouseId || null,
        supplerId: form.supplerId || null,
        goodsStatus: form.goodsStatus || null,
        goodsType: form.goodsType || null,
        remark: form.remark || null,
        list: (this.gzRefundGoodsEntryList || []).map(item => ({
          id: item.id || null,
          materialId: item.materialId || null,
          qty: item.qty || null,
          remark: item.remark || null
        }))
      });
    },
    markDialogSnapshotSaved() {
      this.dialogSavedSnapshot = this.buildDialogSnapshot();
    },
    /** 明细合计（与到货验收弹窗表尾一致） */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const sumNum = (prop) => {
        let t = 0;
        data.forEach(item => {
          const v = item[prop];
          if (v != null && v !== '' && !isNaN(v)) {
            t += parseFloat(v);
          }
        });
        return t;
      };
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        if (column.property === 'index') {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          sums[index] = sumNum('qty');
          return;
        }
        if (column.property === 'amt') {
          const t = sumNum('amt');
          sums[index] = '￥' + this.formatAmount(t);
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    onScanDepotInHospitalCode() {
      if (!this.action) {
        return;
      }
      if (!this.form.warehouseId || !this.form.supplerId) {
        this.$message.warning("请先选择仓库和供应商");
        return;
      }
      const raw = (this.scanCodeInput || "").trim();
      if (!raw) {
        return;
      }
      listDepotInventory({
        pageNum: 1,
        pageSize: 30,
        inHospitalCode: raw,
        warehouseId: this.form.warehouseId,
        supplierId: this.form.supplerId,
      }).then((res) => {
        const rows = res.rows || [];
        const hit = rows.find((r) => r && r.inHospitalCode && String(r.inHospitalCode).trim() === raw);
        if (!hit) {
          this.$message.warning("当前仓库/供应商下无该院内码可用备货");
          return;
        }
        if (this.gzRefundGoodsEntryList.some((e) => e && e.inHospitalCode && String(e.inHospitalCode).trim() === raw)) {
          this.$message.warning("明细中已存在该院内码");
          this.scanCodeInput = "";
          return;
        }
        const qty = hit.qty != null && parseFloat(hit.qty) > 0 ? String(hit.qty) : "1";
        const price = hit.unitPrice != null ? hit.unitPrice : "";
        const obj = {
          materialId: hit.materialId,
          materialName: (hit.material && hit.material.name) || "",
          speci: (hit.material && hit.material.speci) || "",
          model: (hit.material && hit.material.model) || "",
          qty,
          price,
          amt: qty && price ? this.calcLineAmt(qty, price) : "",
          batchNo: hit.batchNo || "",
          batchNumber: hit.materialNo || "",
          beginTime: hit.materialDate || "",
          endTime: hit.endTime || "",
          inHospitalCode: raw,
          masterBarcode: hit.masterBarcode || "",
          secondaryBarcode: hit.secondaryBarcode || "",
          supplierId: this.form.supplerId || hit.supplierId || null,
          supplierName: (hit.material && hit.material.supplier && hit.material.supplier.name) || "",
          remark: "",
        };
        this.gzRefundGoodsEntryList.push(obj);
        this.scanCodeInput = "";
        this.$message.success("已添加院内码 " + raw);
      }).catch(() => {});
    },
    /** 查询高值退货列表 */
    getList() {
      this.loading = true;
      const params = {
        ...this.normalizeQueryDateTime(this.queryParams)
      };
      if (params.goodsNo && !params.goodsNo.startsWith('GZTH-')) {
        params.goodsNo = 'GZTH-' + params.goodsNo;
      }
      listGoods(params).then(response => {
        this.goodsList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch((error) => {
        console.error('查询失败:', error);
        this.goodsList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败：' + (error.message || '未知错误'));
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
        obj.amt = item.amt || (obj.qty && obj.price ? this.calcLineAmt(obj.qty, obj.price) : "");
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
        obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || (item.material && item.material.supplier && item.material.supplier.id) || null;

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
      this.scanCodeInput = "";
      this.dialogSavedSnapshot = '';
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
      row.amt = this.toMoneyStorage(totalAmt);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.goodsNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.timeField = 'createTime';
      this.queryParams.goodsStatus = null;
      this.handleQuery();
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || "createTime";
      params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      return params;
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) return value;
      if (typeof value !== "string") return value;
      const trimVal = value.trim();
      if (!trimVal) return trimVal;
      if (trimVal.length === 10 && trimVal.indexOf(" ") === -1) {
        return `${trimVal} ${isEnd ? "23:59:59" : "00:00:00"}`;
      }
      return trimVal;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      const pageKeys = (this.goodsList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key);
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) this.$set(this.selectedRowMap, key, row);
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
      this.mainListSelectionTick += 1;
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
        this.markDialogSnapshotSaved();
      });
    },
    openRefAcceptanceTh() {
      if (!this.form.warehouseId || !this.form.supplerId) {
        this.$message.warning('请先选择仓库与供应商');
        return;
      }
      if (this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0) {
        this.$message.warning('已有明细时请先清空再引用');
        return;
      }
      this.refPickAccOrderId = null;
      this.refPickAccOrderNo = null;
      this.refAccThOpen = true;
      this.refAccThLoading = true;
      listAuditedAcceptance({ pageNum: 1, pageSize: 100 }).then(res => {
        this.refAccThList = res.data || res.rows || [];
        this.refAccThLoading = false;
      }).catch(() => { this.refAccThLoading = false; });
    },
    confirmRefAcceptanceTh() {
      if (!this.refPickAccOrderId) {
        this.$message.warning('请选择验收单');
        return;
      }
      listAcceptanceDepotLines(this.refPickAccOrderId, this.form.warehouseId).then(res => {
        let rows = res.data || [];
        rows = rows.filter(r => r.supplierId && String(r.supplierId) === String(this.form.supplerId));
        if (!rows.length) {
          this.$message.warning('该验收单在当前仓库无与表头供应商一致的可用备货库存');
          return;
        }
        rows.forEach(r => this.gzRefundGoodsEntryList.push(this.mapDepotToThEntry(r)));
        this.refAccThOpen = false;
        this.$message.success('已带入 ' + rows.length + ' 条明细');
      });
    },
    mapDepotToThEntry(r) {
      const m = r.material || {};
      const qty = r.qty != null ? String(r.qty) : '1';
      const price = r.unitPrice != null ? r.unitPrice : '';
      let amt = r.amt;
      if (amt == null && price && qty) {
        amt = this.calcLineAmt(price, qty);
      }
      return {
        materialId: r.materialId,
        material: r.material,
        materialName: m.name || '',
        speci: m.speci || '',
        model: m.model || '',
        qty,
        price,
        amt,
        batchNo: r.batchNo,
        batchNumber: r.materialNo,
        beginTime: r.materialDate,
        endTime: r.endTime,
        inHospitalCode: r.inHospitalCode,
        masterBarcode: r.masterBarcode,
        secondaryBarcode: r.secondaryBarcode,
        supplierId: r.supplierId,
        refSrcAcceptanceId: String(r.orderId != null ? r.orderId : (this.refPickAccOrderId || '')),
        refSrcAcceptanceNo: r.orderNo || this.refPickAccOrderNo || '',
        refSrcOrderEntryId: r.orderEntryId != null ? String(r.orderEntryId) : '',
        refSrcBarcodeLineId: r.inhospitalcodeListId != null ? String(r.inhospitalcodeListId) : ''
      };
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
      this.dialogSavedSnapshot = '';
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
        this.markDialogSnapshotSaved();
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzRefundGoodsEntryList = this.gzRefundGoodsEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null,
            billNo: this.form.goodsNo || item.billNo || null
          }));
          if (this.form.id != null) {
            updateGoods(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
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
                this.markDialogSnapshotSaved();
              });
            });
          } else {
            addGoods(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
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
                  this.markDialogSnapshotSaved();
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
      getGoods(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.gzRefundGoodsEntryList, this, '高值退货')) {
          return;
        }
        this.$modal.confirm('确定要审核选中的数据项？').then(() => {
          return auditGoods({id: id});
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("审核成功");
        }).catch(() => {});
      }).catch(() => {});
    },
    handleBatchPrint() {
      const selected = this.goodsList.filter(item => this.ids.includes(item.id));
      const printable = selected.filter(item => item.goodsStatus === '2' || item.goodsStatus === 2);
      if (printable.length === 0) {
        this.$modal.msgWarning('请至少选择1条已审核单据');
        return;
      }
      this.$modal.confirm(`确定连续打印 ${printable.length} 条单据吗？`).then(async () => {
        for (let i = 0; i < printable.length; i++) {
          this.handlePrint(printable[i], true);
          if (i < printable.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        this.$modal.msgSuccess(`已触发连续打印，共 ${printable.length} 条`);
      }).catch(() => {});
    },
    handleDialogAudit() {
      if (!this.form.id) return this.$modal.msgWarning('请先保存单据后再审核');
      if (this.hasDialogUnsavedChanges) return this.$modal.msgWarning('当前有未保存修改，请先保存后再审核');
      if (this.isAuditedForm) return this.$modal.msgWarning('该单据已审核');
      if (!assertBillHasActiveEntriesForAudit(this.gzRefundGoodsEntryList, this, '高值退货')) {
        return;
      }
      this.$modal.confirm(`确定审核单据"${this.form.goodsNo || this.form.id}"吗？`).then(() => {
        return auditGoods({ id: this.form.id });
      }).then(() => {
        this.form.goodsStatus = 2;
        this.markDialogSnapshotSaved();
        this.getList();
        this.$modal.msgSuccess('审核成功');
      }).catch(() => {});
    },
    handleDialogPrint() {
      if (!this.form.id) return this.$modal.msgWarning('请先保存单据后再打印');
      if (this.hasDialogUnsavedChanges) return this.$modal.msgWarning('当前有未保存修改，请先保存后再打印');
      if (!this.isAuditedForm) return this.$modal.msgWarning('请先审核后再打印');
      this.handlePrint(this.form, true);
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
      return this.formatAmount(total);
    },
    formatDisplayDateTime(primaryTime, fallbackTime) {
      const primary = parseTime(primaryTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const fallback = parseTime(fallbackTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const primaryZeroClock = primary && / 00:00:00$/.test(primary);
      const fallbackHasRealTime = fallback && !/ 00:00:00$/.test(fallback);
      if (primaryZeroClock && fallbackHasRealTime) {
        return fallback;
      }
      return primary || fallback || '--';
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
      const params = this.normalizeQueryDateTime(this.queryParams);
      if (params.goodsNo && !params.goodsNo.startsWith('GZTH-')) {
        params.goodsNo = 'GZTH-' + params.goodsNo;
      }
      this.download('gz/goods/export', {
        ...params
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
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  min-height: 40px;
  flex-shrink: 0;
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

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
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

/* 弹窗内表单字段容器（与到货验收一致：全宽白底卡片） */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 制单日期：保留校验时隐藏必填星号 */
::v-deep .form-fields-container .form-item-goods-date-no-star.is-required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-goods-date-no-star.el-form-item--required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-goods-date-no-star.is-required .el-form-item__label-wrap > .el-form-item__label::before {
  display: none !important;
  content: none !important;
}

.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .detail-toolbar-row {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

::v-deep .local-modal-content .modal-detail-section .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
  scrollbar-width: thin;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper td {
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
}

::v-deep .local-modal-content {
  min-height: 95vh !important;
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
/* 列表样式见 department-apply-list-align.scss；以下为弹窗页内特例 */
.app-container.gzOrder-goodsApply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-goodsApply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-goodsApply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-goodsApply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-goodsApply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
