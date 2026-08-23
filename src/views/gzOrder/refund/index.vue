<template>
  <div class="app-container list-page gzOrder-refund-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.goodsNo"
              placeholder="退库单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
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
                <el-radio-button label="createTime">制单时间</el-radio-button>
                <el-radio-button label="auditDate">审核时间</el-radio-button>
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
          @click="handleBatchAudit"
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
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="退库单号" align="center" prop="goodsNo" width="180" min-width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.goodsNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="科室" align="center" prop="department.name" width="160" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')">
        <template slot-scope="scope">
          <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" width="150" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByTotalAmt">
        <template slot-scope="scope">
          <span>{{ formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          <span>{{ scope.row.auditBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.auditDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="goodsStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.goodsStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="goodsDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByGoodsDate">
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.goodsDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable />
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
                      <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseDeptLocked" includeWarehouseType="高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || warehouseDeptLocked"/>
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
                        placeholder="请先选择仓库与科室，在此回车扫描院内码添加明细"
                        :disabled="!action || scanCodeDisabled"
                        clearable
                        style="width: 100%; max-width: none"
                        @keyup.enter.native="onScanInHospitalCode"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8" />
                </el-row>
              </div>
              <div class="modal-detail-section">
                <el-row :gutter="10" class="detail-toolbar-row">
                  <el-col :span="1.5">
                    <span>备货退库明细信息</span>
                  </el-col>
                  <div v-show="action">
                    <el-col :span="1.5">
                      <el-button type="primary" plain icon="el-icon-link" size="small"
                                 v-hasPermi="['gz:refDoc:query']"
                                 @click="openRefShipment">引用出库单</el-button>
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
                  <el-table :data="gzRefundGoodsEntryList" :row-class-name="rowGzRefundGoodsEntryIndex" @selection-change="handleGzRefundGoodsEntrySelectionChange" ref="gzRefundGoodsEntry" border show-summary :summary-method="getSummaries" :height="detailTableHeight">
          <el-table-column type="selection" width="60" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
          <el-table-column label="产品名称" prop="materialName" min-width="160" show-overflow-tooltip resizable>
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
              <el-input clearable v-model="scope.row.qty" placeholder="数量"
                        :disabled="true"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
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
        <gz-order-print v-if=" modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0 " :key="`print-${modalObj.form.row.goodsNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row=" modalObj.form.row " :orientation=" modalObj.form.orientation || 'landscape' " :printType="'refundStock'" ref="receiptOrderPrintRef"></gz-order-print>
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
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" :printType="'refundStock'" ref="receiptOrderPrintRefAuto"></gz-order-print>
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

    <el-dialog title="引用备货出库单（仅带科室仍有库存的明细）" :visible.sync="refShipOpen" width="800px" append-to-body>
      <el-table :data="refShipList" v-loading="refShipLoading" highlight-current-row
                @row-click="row => { refPickShipmentId = row.id; refPickShipmentNo = row.shipmentNo }" max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column label="出库单号" prop="shipmentNo" min-width="140" show-overflow-tooltip/>
        <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.department && scope.row.department.name) || '--' }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refShipOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefShipment">确 定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listGoods, getGoods, delGoods, addGoods, updateGoods, auditGoods } from "@/api/gz/refundStock";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listAuditedShipment, listShipmentLinesForTk } from "@/api/gz/refDoc";
import { listGzDepInventoryPick } from "@/api/gzDepartment/gzDepInventory";
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
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      _lastSidebarNavTick: null,
      // 总条数
      total: 0,
      // 高值退货表格数据
      goodsList: [],
      // 高值退库明细表格数据
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
        warehouseId: null,
        goodsStatus: null,
        goodsType: 301,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      refShipOpen: false,
      refShipList: [],
      refShipLoading: false,
      refPickShipmentId: null,
      refPickShipmentNo: null,
      // 表单校验
      rules: {
        goodsDate: [
          { required: true, message: "退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "change" }
        ],
      },
      dialogSavedSnapshot: ''
    };
  },
  computed: {
    warehouseDeptLocked() {
      return this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0;
    },
    scanCodeDisabled() {
      return !this.form.warehouseId || !this.form.departmentId;
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
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
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
    buildDialogSnapshot() {
      const form = this.form || {};
      return JSON.stringify({
        id: form.id || null,
        goodsNo: form.goodsNo || null,
        goodsDate: form.goodsDate || null,
        warehouseId: form.warehouseId || null,
        departmentId: form.departmentId || null,
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
    onScanInHospitalCode() {
      if (!this.action) {
        return;
      }
      if (!this.form.warehouseId || !this.form.departmentId) {
        this.$message.warning("请先选择仓库和科室");
        return;
      }
      const raw = (this.scanCodeInput || "").trim();
      if (!raw) {
        return;
      }
      listGzDepInventoryPick({
        pageNum: 1,
        pageSize: 20,
        inHospitalCode: raw,
        departmentId: this.form.departmentId,
        showZeroStock: false,
      }).then((res) => {
        const rows = res.rows || [];
        const hit = rows.find((r) => r && r.inHospitalCode && String(r.inHospitalCode).trim() === raw);
        if (!hit) {
          this.$message.warning("当前科室无该院内码可用库存");
          return;
        }
        if (this.gzRefundGoodsEntryList.some((e) => e && e.inHospitalCode && String(e.inHospitalCode).trim() === raw)) {
          this.$message.warning("明细中已存在该院内码");
          this.scanCodeInput = "";
          return;
        }
        const qty = hit.qty != null && parseFloat(hit.qty) > 0 ? String(hit.qty) : "1";
        const price = hit.unitPrice != null ? hit.unitPrice : (hit.price != null ? hit.price : "");
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
          supplierId: hit.supplierId || null,
          supplierName: (hit.material && hit.material.supplier && hit.material.supplier.name) || "",
          remark: "",
        };
        this.gzRefundGoodsEntryList.push(obj);
        this.scanCodeInput = "";
        this.$message.success("已添加院内码 " + raw);
      }).catch(() => {});
    },
    formatTotalAmt(row) {
      // 优先使用totalAmt字段
      if (row.totalAmt != null && row.totalAmt !== undefined) {
        return this.formatAmount(row.totalAmt);
      }
      // 如果没有totalAmt，从明细列表计算
      if (row.gzRefundGoodsEntryList && row.gzRefundGoodsEntryList.length > 0) {
        const total = row.gzRefundGoodsEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return this.formatAmount(total);
      }
      return '0.00';
    },
    /** 计算明细总金额 */
    getTotalAmount() {
      if (this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0) {
        const total = this.gzRefundGoodsEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return this.formatAmount(total);
      }
      return '0.00';
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
    /** 查询高值退货列表 */
    getList() {
      this.loading = true;
      const params = {
        ...this.normalizeQueryDateTime(this.queryParams),
        goodsType: 301
      };
      if (params.goodsNo && !params.goodsNo.startsWith('GZTK-')) {
        params.goodsNo = 'GZTK-' + params.goodsNo;
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
          obj.amt = this.formatAmount(item.amt);
        } else if (obj.qty && obj.price) {
          obj.amt = this.calcLineAmt(obj.qty, obj.price);
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
        obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || (item.material && item.material.supplier && item.material.supplier.id) || null;
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
        goodsType: 301,
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
      // 只计算金额，不做验证（验证在提交时进行）
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
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
    getStatDate(){
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year.toString() + "-" + month + "-" + day + " 00:00:00";
    },
    getEndDate(){
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year.toString() + "-" + month + "-" + day + " 23:59:59";
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
        this.markDialogSnapshotSaved();
      });
    },
    openRefShipment() {
      if (!this.form.warehouseId || !this.form.departmentId) {
        this.$message.warning('请先选择仓库与科室');
        return;
      }
      if (this.gzRefundGoodsEntryList && this.gzRefundGoodsEntryList.length > 0) {
        this.$message.warning('已有明细时请先清空再引用');
        return;
      }
      this.refPickShipmentId = null;
      this.refPickShipmentNo = null;
      this.refShipOpen = true;
      this.refShipLoading = true;
      listAuditedShipment({ pageNum: 1, pageSize: 100 }).then(res => {
        this.refShipList = res.data || res.rows || [];
        this.refShipLoading = false;
      }).catch(() => { this.refShipLoading = false; });
    },
    confirmRefShipment() {
      if (!this.refPickShipmentId) {
        this.$message.warning('请单击表格选择出库单');
        return;
      }
      listShipmentLinesForTk(this.refPickShipmentId, this.form.departmentId).then(res => {
        const rows = res.data || [];
        if (!rows.length) {
          this.$message.warning('该出库单在当前科室无可用院内码库存');
          return;
        }
        rows.forEach(e => this.gzRefundGoodsEntryList.push(this.mapShEntryToTk(e)));
        this.refShipOpen = false;
        this.$message.success('已带入 ' + rows.length + ' 条明细');
      });
    },
    mapShEntryToTk(e) {
      const m = e.material || {};
      const qty = e.qty != null ? String(e.qty) : '1';
      const price = e.price != null ? e.price : '';
      let amt = e.amt;
      if (amt == null && price && qty) {
        amt = this.calcLineAmt(price, qty);
      }
      return {
        materialId: e.materialId,
        materialName: m.name || e.materialName || '',
        speci: m.speci || e.speci || '',
        model: m.model || e.model || '',
        factoryName: (m.fdFactory && m.fdFactory.factoryName) || e.factoryName || '',
        supplierName: (m.supplier && m.supplier.name) || e.supplierName || '',
        udiNo: m.udiNo || e.masterBarcode || e.udiNo || '',
        qty,
        price,
        amt,
        batchNo: e.batchNo || '',
        batchNumber: e.batchNumber || '',
        beginTime: e.beginTime || '',
        endTime: e.endTime || '',
        inHospitalCode: e.inHospitalCode || '',
        masterBarcode: e.masterBarcode || '',
        secondaryBarcode: e.secondaryBarcode || '',
        supplierId: e.supplierId,
        remark: '',
        refSrcShipmentId: this.refPickShipmentId != null ? String(this.refPickShipmentId) : '',
        refSrcShipmentNo: this.refPickShipmentNo || '',
        refSrcShipmentEntryId: e.id != null ? String(e.id) : ''
      };
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加备货退库";
      this.form.goodsStatus = 1;
      this.form.goodsType = 301;
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.goodsDate = this.getGoodsDate();
      this.action = true;
      this.dialogSavedSnapshot = '';
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      getGoods(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.gzRefundGoodsEntryList, this, '高值退库')) {
          return;
        }
        this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
          return auditGoods({id: id});
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("审核退库成功！");
        }).catch(() => {});
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError('请先选择要审核的数据');
        return;
      }
      const validations = this.ids.map(id =>
        getGoods(id).then(res => {
          if (!assertBillHasActiveEntriesForAudit(res.data.gzRefundGoodsEntryList, this, '高值退库')) {
            return Promise.reject(new Error('no active entries'));
          }
        })
      );
      Promise.all(validations).then(() => {
        this.$modal.confirm('确定要审核选中的' + this.ids.length + '条数据项？').then(() => {
          const promises = this.ids.map(id => auditGoods({id: id}));
          return Promise.all(promises);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核退库成功！");
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
        this.markDialogSnapshotSaved();
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
              this.$message.error(`第${i + 1}行：退库数量必须大于0`);
              return;
            }
          }
          this.form.gzRefundGoodsEntryList = this.gzRefundGoodsEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null,
            departmentId: this.form.departmentId || item.departmentId || null,
            billNo: this.form.goodsNo || item.billNo || null
          }));
          if (this.form.id != null) {
            updateGoods(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              // 保存成功后不关闭弹窗，刷新列表和表单数据
              this.getList();
              // 重新获取最新数据
              getGoods(this.form.id).then(res => {
                this.form = res.data;
                this.gzRefundGoodsEntryList = res.data.gzRefundGoodsEntryList || [];
                // 重新映射数据
                this.mapEntryData(res.data);
                this.markDialogSnapshotSaved();
              });
            });
          } else {
            addGoods(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
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
                  this.markDialogSnapshotSaved();
                });
              }
            });
          }
        }
      });
    },
    handleDialogAudit() {
      if (!this.form.id) return this.$modal.msgWarning('请先保存单据后再审核');
      if (this.hasDialogUnsavedChanges) return this.$modal.msgWarning('当前有未保存修改，请先保存后再审核');
      if (this.isAuditedForm) return this.$modal.msgWarning('该单据已审核');
      if (!assertBillHasActiveEntriesForAudit(this.gzRefundGoodsEntryList, this, '高值退库')) {
        return;
      }
      this.$modal.confirm(`确定审核单据"${this.form.goodsNo || this.form.id}"吗？`).then(() => {
        return auditGoods({ id: this.form.id });
      }).then(() => {
        this.form.goodsStatus = 2;
        this.markDialogSnapshotSaved();
        this.getList();
        this.$modal.msgSuccess('审核成功！');
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
          departmentName: (row.department && row.department.name)
            || row.departmentName
            || (response.data.department && response.data.department.name)
            || response.data.departmentName
            || '',
          supplierName: (row.supplier && row.supplier.name)
            || row.supplierName
            || (response.data.supplier && response.data.supplier.name)
            || '',
          warehouseName: (row.warehouse && row.warehouse.name)
            || row.warehouseName
            || (response.data.warehouse && response.data.warehouse.name)
            || '',
          orderDate: row.goodsDate || response.data.goodsDate,
          auditDate: row.auditDate || response.data.auditDate,
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
      const params = this.normalizeQueryDateTime(this.queryParams);
      this.applyMoreSearchToQueryParams(params);
      this.download('gz/goods/export', {
        ...params
      }, `goods_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗：与到货验收 inWarehouse/audit 弹窗一致 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
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
  flex-shrink: 0;
  min-height: 40px;
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
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

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

/* 制单日期：保留校验，隐藏必填星号 */
::v-deep .form-fields-container .form-item-goods-date-no-star.is-required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-goods-date-no-star.el-form-item--required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-goods-date-no-star.is-required .el-form-item__label-wrap > .el-form-item__label::before {
  display: none !important;
  content: none !important;
}

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

::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
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

</style>

<style>
/* 本页主容器：顶部与标签栏留 8px 细缝，左右 8px；纵向 flex 铺满视口 */
.app-container.gzOrder-refund-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 14px !important;
}

.app-container.gzOrder-refund-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.gzOrder-refund-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.gzOrder-refund-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}

/* RK-添加明细：标题栏与修改入库一致 */
.app-container.gzOrder-refund-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.gzOrder-refund-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.gzOrder-refund-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.gzOrder-refund-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* RK-添加明细：标题栏下、查询区与按钮行留白（与修改入库一致） */
.app-container.gzOrder-refund-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

/* RK-添加明细：明细框与到货验收主列表 apply-table-panel 完全一致 */
.app-container.gzOrder-refund-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.gzOrder-refund-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.gzOrder-refund-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.gzOrder-refund-page .list-query-panel,
.app-container.gzOrder-refund-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.gzOrder-refund-page > .form-fields-container.list-query-panel {
  background: #fff !important;
  padding: 12px 14px 14px !important;
  border-radius: 10px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  border: 1px solid #e2e8f0 !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.gzOrder-refund-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.gzOrder-refund-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.gzOrder-refund-page .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.app-container.gzOrder-refund-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gzOrder-refund-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .apply-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 52px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding: 10px 14px 14px !important;
  background: #fff;
  border: none;
  border-top: 1px solid #eef2f7;
  border-radius: 0 0 10px 10px;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.app-container.gzOrder-refund-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.gzOrder-refund-page .apply-main-table .el-table__header-wrapper th,
.app-container.gzOrder-refund-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
  font-family: inherit !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.gzOrder-refund-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.gzOrder-refund-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.gzOrder-refund-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.gzOrder-refund-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.gzOrder-refund-page .apply-main-table thead th .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.gzOrder-refund-page .apply-main-table th.plan-col-status .cell,
.app-container.gzOrder-refund-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gzOrder-refund-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.gzOrder-refund-page .apply-main-table.el-table {
  position: relative;
}

.app-container.gzOrder-refund-page .apply-main-table th.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table th.el-table-column--selection,
.app-container.gzOrder-refund-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-refund-page .apply-main-table td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .apply-main-table th.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.gzOrder-refund-page .apply-main-table th.apply-action-col,
.app-container.gzOrder-refund-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-refund-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr > td,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr > td .cell,
.app-container.gzOrder-refund-page .apply-detail-table .el-table__body tr > td,
.app-container.gzOrder-refund-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr:hover > td,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gzOrder-refund-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.gzOrder-refund-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-refund-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/*
 * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏，滚动条易与合计行错位。
 * 强制显示表尾，横向滚动条固定在表体与合计之间。
 */
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.gzOrder-refund-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gzOrder-refund-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gzOrder-refund-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-refund-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>

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

.local-modal-content /* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

.json-viewer-pre {
  margin: 0;
  max-height: 520px;
  overflow: auto;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 表格样式优化（弹窗内表格，勿影响主列表 apply-main-table） */
.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担，内层 el-form 不再重复包一层 */
.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.list-query-panel .el-form .el-row {
  margin-bottom: 8px;
}

.list-query-panel .el-form .el-row:last-child {
  margin-bottom: 0;
}

.list-query-panel .el-form .el-form-item {
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first {
  margin-bottom: 10px;
}

.list-query-panel .el-form .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.list-query-panel .el-form .apply-query-field,
.list-query-panel .el-form .query-row-first-inner .apply-query-input {
  width: 170px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .more-search-select-wrap.apply-query-field > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-second .apply-query-field.el-select {
  width: 170px;
}

.list-query-panel .el-form .query-row-first-inner .query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .query-actions .el-button + .el-button {
  margin-left: 0;
}

.list-query-panel .el-form .query-row-second {
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.list-query-panel .el-form .apply-date-type-group {
  margin-right: 10px;
}

.list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 200px;
}

/* 第一行查询条件左对齐紧凑布局 */
.list-query-panel .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.list-query-panel .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.list-query-panel .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 单据状态对齐到仓库下面 - 使用margin-left对齐到第三个位置 */
/* 计算：入库单号(80px label + 180px input + 16px margin) + 供应商(80px label + 180px input + 16px margin) = 552px */
.list-query-panel .el-form .query-row-left .query-item-aligned {
  margin-left: 552px;
}

/* 按钮对齐到仓库下面 - 按钮没有label，所以对齐到仓库input的开始位置 */
/* 仓库起始位置 552px + label 80px = 632px */
.list-query-panel .el-form .query-row-left .query-button-aligned {
  margin-left: 632px;
  display: inline-block;
}

/* 确保第三行的按钮单独显示 */
.list-query-panel .el-form .query-row-left:last-child {
  min-height: 32px;
}

.list-query-panel .el-form .query-row-left:last-child .el-col {
  flex-wrap: nowrap;
}

/* 第二行：inline 表单下列内强制块级，避免日期区溢出盖住「单据状态」 */
.list-query-panel .el-form .query-row-second > .el-col > .el-form-item {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) {
  white-space: nowrap;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item {
  white-space: normal;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  max-width: 100%;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.list-query-panel .el-form .query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.list-query-panel .el-form .query-row-second > .query-row-second-inner > .el-form-item {
  display: inline-flex !important;
  width: auto !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  vertical-align: middle;
}

.list-query-panel .el-form .query-row-second-inner .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}
</style>

