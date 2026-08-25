<template>
  <div class="app-container list-page outWarehouse-refundDepotApply-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="退库单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.departmentId" />
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </div>
            <el-input
              v-model="queryParams.refBillNo"
              placeholder="引用单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
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
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                           v-if="dict.label !== '待审核'"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="被引用状态" label-width="88px" class="query-item-inline query-item-doc-ref">
              <el-select v-model="queryParams.params.docRefStatus" clearable placeholder="全部" class="apply-query-field">
                <el-option v-for="o in docRefStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
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
          v-hasPermi="['outWarehouse:refundDepotApply:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['outWarehouse:refundDepotApply:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="warehouseList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="退库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span style="white-space: nowrap;">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
          </span>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="打印状态" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.printDate" type="success" size="small">已打印</el-tag>
          <el-tag v-else type="info" size="small">未打印</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="打印人" align="center" prop="printPerson" width="120" show-overflow-tooltip resizable>
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
      <el-table-column label="引用单号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.refBillNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="被引用" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="220">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['outWarehouse:refundDepotApply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['outWarehouse:refundDepotApply:remove']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row)"
              v-if="scope.row.billStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleShowEntryChangeLog(scope.row)"
              style="padding: 0 5px; margin: 0;"
              v-hasPermi="['outWarehouse:refundDepotApply:query']"
            >变更记录</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
    </div>
    </div>

    <!-- 添加或修改退库对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>

        <div class="form-fields-container list-query-panel apply-modal-query-panel">
        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
              <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
              <SelectDepartment v-model="form.departmentId" :value2="stkIoBillEntryList.length > 0"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col v-show="false" class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="退库类型" prop="billType">
              <el-select v-model="form.billType" placeholder="请选择退库类型"
                         :disabled="true"
                         clearable style="width: 100%">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="退库原因" prop="returnReason">
              <el-input v-model="form.returnReason" placeholder="退库原因" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--grow" style="flex: 1 1 auto; min-width: 200px;">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" style="width: 100%; max-width: none;" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">退库明细信息</span>
            <template v-if="action">
              <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="nameBtn">添加</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-ref" :disabled="stkIoBillEntryList.length > 0" @click="refCkApply">引用出库单</el-button>
              <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDeleteStkIoBillEntry">删除</el-button>
              <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
            </template>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="applyDetailRowClassName"
                  class="apply-detail-table"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <!-- <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column> -->
          <el-table-column
            label="名称"
            align="left"
            header-align="center"
            width="180"
            min-width="140"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.name) || '--'"
              >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="规格"
            align="left"
            header-align="center"
            width="130"
            min-width="110"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.speci) || '--'"
              >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="型号"
            align="left"
            header-align="center"
            width="130"
            min-width="110"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="70" min-width="56" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="100" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" prop="srcRefedQty" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="可引用" prop="srcRefableQty" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="数量" size="small" class="detail-input-compact"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="100" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" align="center" class-name="detail-col-batch-no" :show-overflow-tooltip="false" resizable>
            <template slot-scope="scope">
              <span class="detail-batch-no-cell" :title="scope.row.batchNo || ''">{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.batchNumber"
                size="small"
                class="detail-input-compact"
                :disabled="true"
                placeholder="自动带出批号"/>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="130" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.beginTime"
                :disabled="true"
                type="date"
                size="small"
                class="detail-input-compact"
                value-format="yyyy-MM-dd"
                placeholder="请选择生产日期"/>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="130" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.endTime"
                :disabled="true"
                type="date"
                size="small"
                class="detail-input-compact"
                value-format="yyyy-MM-dd"
                placeholder="请选择有效期"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" size="small" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="140" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
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
    <SelectDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      :warehouseValue="form.warehouseId"
      :selectedDetails="stkIoBillEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

    <SelectCkApply
      v-if="DialogCkApplyComponentShow"
      :DialogComponentShow="DialogCkApplyComponentShow"
      :departmentValue="departmentValue"
      :warehouseValue="warehouseValue"
      @closeDialog="closeCkApplyDialog"
      @selectData="selectCkApplyData"
    >

    </SelectCkApply>

    <el-dialog title="明细变更记录" :visible.sync="entryChangeLogDialog.visible" width="980px" append-to-body>
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.list" border stripe max-height="460">
        <el-table-column label="变更时间" prop="changeTime" width="180" />
        <el-table-column label="操作人" prop="operator" width="120" />
        <el-table-column label="动作" prop="actionType" width="90" />
        <el-table-column label="变更前" min-width="240">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button type="text" size="mini" @click="showJsonDetail('变更前 JSON', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="240">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button type="text" size="mini" @click="showJsonDetail('变更后 JSON', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="760px" append-to-body>
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
    </el-dialog>
  </div>
</template>

<script>
import {
  listTkInventory,
  getTkInventory,
  delTkInventory,
  addTkInventory,
  updateTkInventory,
  createTkEntriesByCkApply
} from "@/api/warehouse/tkInventory";
import {createEntriesByDApply, listCTKWarehouse, listEntryChangeLog} from '@/api/warehouse/outWarehouse'; // 新增引用
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';
import SelectCkApply from "@/components/SelectModel/SelectCkApply";
import refundDepotOrderPrint from "@/views/outWarehouse/refundDepotAudit/refundDepotOrderPrint.vue";
import { buildRefundDepotPrintRowFromDetail } from '@/views/warehouse/print/refundDepotPrintRow'
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'

export default {
  name: "RefundDepotApply",
  dicts: ['biz_status','bill_type','way_status'],
  components: {
    SelectWarehouse,SelectDepartment,SelectUser,SelectDepInventory,SelectCkApply, refundDepotOrderPrint},
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      DialogCkApplyComponentShow: false,
      departmentValue: "",
      warehouseValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      selectedRowMap: {},
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 明细勾选行高亮（与到货验收一致）
      detailSelectedRowMap: {},
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      mainTableHeight: 400,
      // 退库表格数据
      warehouseList: [],
      selectRow: [],
      // 退库明细表格数据
      stkIoBillEntryList: [],
      // 打印数据（用于隐藏打印组件）
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        list: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        refBillNo: null,
        materialId: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        dateQueryType: 'bill',
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        params: {}
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "退库类型不能为空", trigger: "change" }
        ],
      },
      _lastSidebarNavTick: null
    };
  },
  computed: {
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    }
  },
  created() {
    this.getList(true);
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    }
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
        if (table && table.doLayout) {
          table.doLayout();
        }
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
      if (!path) {
        return '';
      }
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
      }
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) {
        return;
      }
      if (nav.tick === this._lastSidebarNavTick) {
        return;
      }
      this._lastSidebarNavTick = nav.tick;
      this.resetPageFromSidebar();
    },
    resetPageFromSidebar() {
      this.DialogComponentShow = false;
      this.DialogCkApplyComponentShow = false;
      this.entryChangeLogDialog.visible = false;
      this.jsonViewer.visible = false;
      this.open = false;
      this.action = true;
      this.reset();
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = columns.map(() => '');
      let summaryLabelPlaced = false;
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        const prop = column.property;
        if (!summaryLabelPlaced && (prop === 'index' || column.label === '序号')) {
          sums[index] = '合计';
          summaryLabelPlaced = true;
          return;
        }
        if (!prop) {
          return;
        }
        if (prop === 'qty') {
          const values = data.map(row => {
            const v = row[prop];
            if (v === '' || v == null) return NaN;
            return Number(v);
          });
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = Number.isInteger(total) ? String(total) : total.toFixed(2);
          }
          return;
        }
        if (prop === 'unitPrice' || prop === 'amt') {
          const values = data.map(row => Number(row[prop]));
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = prop === 'unitPrice'
              ? (typeof this.formatPrice === 'function' ? this.formatPrice(total) : total.toFixed(2))
              : (typeof this.formatAmount === 'function' ? this.formatAmount(total) : total.toFixed(2));
            if (prop === 'amt') {
              this.form.totalAmount = this.toMoneyStorage(total);
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
    /** 查询退库列表；弹窗打开时默认不刷新（顶部标签切回保留当前编辑） */
    getList(allowWhenDialog) {
      if (this.open && !allowWhenDialog) {
        return;
      }
      this.loading = true;
      this.queryParams.billType = "401";
      const queryParams = { ...this.queryParams };
      listTkInventory(queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => {
          this.updateMainTableHeight();
          this.restoreMainPageSelection();
        });
      }).catch(() => {
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    resolveChangeLogBillType() {
      return 'STK_IO_BILL_401';
    },
    jsonPreview(value) {
      if (!value) return '-';
      const s = String(value);
      return s.length > 80 ? s.slice(0, 80) + '...' : s;
    },
    prettyJson(value) {
      if (!value) return '';
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch (e) {
        return String(value);
      }
    },
    showJsonDetail(title, value) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(value);
      this.jsonViewer.visible = true;
    },
    handleShowEntryChangeLog(row) {
      const billId = row && row.id ? row.id : this.form.id;
      if (!billId) {
        this.$message.warning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      listEntryChangeLog(this.resolveChangeLogBillType(), billId).then(res => {
        this.entryChangeLogDialog.list = (res && res.data) ? res.data : [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    nameBtn() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      if (!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    closeCkApplyDialog() {
      //关闭“弹窗组件”
      this.DialogCkApplyComponentShow = false
    },
    selectData(val) {
      // 按科室库存 id（kcNo）去重；无 id 时回退按批次号（兼容旧明细）
      const rows = Array.isArray(val) ? val : (val ? [val] : []);
      if (!rows.length) return;
      const existedKc = new Set(
        this.stkIoBillEntryList
          .map(e => e && e.kcNo)
          .filter(id => id != null && id !== '')
          .map(id => String(id))
      );
      const existedBatchNos = new Set(
        this.stkIoBillEntryList
          .filter(e => e && (e.kcNo == null || e.kcNo === ''))
          .map(e => e.batchNo)
          .filter(b => b != null && String(b).trim() !== '')
      );

      rows.forEach((item) => {
        if (!item) return;
        if (item.id != null && existedKc.has(String(item.id))) {
          return;
        }
        if ((item.id == null || item.id === '') && item.batchNo && existedBatchNos.has(item.batchNo)) {
          return;
        }
        let obj = {};
        obj.materialId = item.materialId;
        obj.qty = item.qty;
        obj.unitPrice = item.unitPrice;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.batchNumber || item.materialNo || "";
        obj.beginTime = item.beginTime;
        obj.endTime = item.endTime;
        obj.remark = item.remark;
        obj.material = item.material;
        obj.kcNo = item.id != null ? item.id : null;
        this.stkIoBillEntryList.push(obj);
      });
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01 00:00:00"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let day = dayEnd < 10 ? "0" + dayEnd : dayEnd;
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + day + " 23:59:59"; //月末
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
        refBillNo: null,
        returnReason: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
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
      this.checkedStkIoBillEntry = [];
      this.detailSelectedRowMap = {};
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
      row.amt = this.toMoneyStorage(totalAmt);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
    },
    /** 嵌套字段排序：按 path 如 'warehouse.name' 取值后比较 */
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.dateQueryType = 'bill';
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.params = this.queryParams.params || {};
      this.queryParams.params.docRefStatus = null;
      this.handleQuery();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    applyMainRowClassName({ row, rowIndex }) {
      this.warehouseListIndex({ row, rowIndex });
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.warehouseList || !this.warehouseList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.warehouseList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    // 多选框选中数据（跨页缓存 + 行高亮）
    handleSelectionChange(selection) {
      const pageKeys = (this.warehouseList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getTkInventory(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '1';
        this.form.billType = '401';
        this.title = "查看退库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '401';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
      this.form.createrName = userName;
      this.title = "添加退库";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getTkInventory(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '401';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改退库";
      });
    },
    /** 提交按钮 */
    async submitForm() {
      this.$refs["form"].validate(async (valid) => {
        if (valid) {
          // 校验：有科室库存 id 时按 id 判重；否则按批次号判重（兼容旧数据）
          const kcMap = new Map();
          const batchMap = new Map();
          for (const [index, entry] of this.stkIoBillEntryList.entries()) {
            if (!entry) continue;
            if (entry.kcNo != null && entry.kcNo !== '') {
              const kid = String(entry.kcNo);
              if (kcMap.has(kid)) {
                this.$modal.msgError(`明细第${kcMap.get(kid)}行与第${index + 1}行指向同一科室库存，请检查后再保存`);
                return;
              }
              kcMap.set(kid, index + 1);
              continue;
            }
            const key = entry.batchNo && String(entry.batchNo).trim();
            if (!key) continue;
            if (batchMap.has(key)) {
              this.$modal.msgError(`明细第${batchMap.get(key)}行与第${index + 1}行批次号重复，请检查后再保存`);
              return;
            }
            batchMap.set(key, index + 1);
          }
          // 新增/修改退库校验逻辑：存在未审核退库单则提示（修改时排除当前单据）
          for (const [index, entry] of this.stkIoBillEntryList.entries()) {
            if (entry.materialId) {
              try {
                const res = await listCTKWarehouse({
                  materialId: entry.materialId,
                  warehouseId: this.form.warehouseId,
                  billNo: 'TK',
                  billStatus: 1
                });
                let list = res && Array.isArray(res) ? res : [];
                if (this.form.id != null) {
                  list = list.filter(item => item.id != null && String(item.id) !== String(this.form.id));
                }
                if (list.length > 0) {
                  this.$modal.msgError(`第${index + 1}行耗材存在未审核退库单，请先审核后再退库`);
                  return;
                }
              } catch (error) {
                console.error("校验请求失败:", error);
              }
            }
          }

          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          var totalAmt = 0;
          this.stkIoBillEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = this.toMoneyStorage(totalAmt);
          if (this.form.id != null) {
            updateTkInventory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addTkInventory(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除退库编号为"' + ids + '"的数据项？').then(function() {
        return delTkInventory(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      if (!row || row.id == null) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      this.$router.push({
        path: '/print/refund-depot',
        query: {
          id: String(row.id),
          from: encodeURIComponent(this.$route.fullPath)
        }
      })
    },
    // 组装打印信息
    getRefundDepotDetail(row) {
      return getTkInventory(row.id).then(response => {
        return buildRefundDepotPrintRowFromDetail(row, response.data)
      })
    },
    /** 退库明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 明细表行 class：序号 + 勾选高亮（与到货验收一致） */
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowStkIoBillEntryIndex({ row, rowIndex });
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 退库明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      obj.kcNo = null;

      this.stkIoBillEntryList.push(obj);
    },
    /** 退库明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的退库明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
        this.checkedStkIoBillEntry = [];
        this.detailSelectedRowMap = {};
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index);
      const pageIndices = (this.stkIoBillEntryList || []).map((row, idx) => idx);
      pageIndices.forEach((idx) => {
        if (this.detailSelectedRowMap[idx]) {
          this.$delete(this.detailSelectedRowMap, idx);
        }
      });
      (selection || []).forEach((row) => {
        const idx = this.stkIoBillEntryList.indexOf(row);
        if (idx >= 0) {
          this.$set(this.detailSelectedRowMap, idx, true);
        }
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    },
    selectCkApplyData(val) {
      const ckApplyId = Array.isArray(val) ? val[0].id : val.id;
      if (!ckApplyId) return;

      const keepCreater = this.form.createrName;
      const keepCreateBy = this.form.createBy;
      createTkEntriesByCkApply({ ckApplyId: String(ckApplyId) }).then(response => {
        if (response && response.data) {
          this.form = response.data;
          if (!this.form.createrName && keepCreater) {
            this.form.createrName = keepCreater;
          }
          if (!this.form.createBy && keepCreateBy) {
            this.form.createBy = keepCreateBy;
          }
          this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
          this.form.billStatus = '1';
          this.form.billType = '401';
          this.DialogCkApplyComponentShow = false;
        }
      }).catch(() => {
        this.$message.error("加载出库单明细失败");
      });
    },
    refCkApply() {
      if (this.stkIoBillEntryList.length > 0) {
        this.$message({ message: '已有退库明细时不能引用单据', type: 'warning' });
        return;
      }
      this.DialogCkApplyComponentShow = true;
      this.warehouseValue = this.form.warehouseId;
      this.departmentValue = this.form.departmentId;
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
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
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
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  box-sizing: border-box;
}

/* 弹窗内三块区域：与到货验收一致（标题栏同宽铺满） */
.local-modal-content .apply-modal-query-panel,
.local-modal-content .apply-modal-toolbar.list-toolbar,
.local-modal-content .apply-modal-table-panel {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 12px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-query-panel .el-row {
  margin-bottom: 8px;
}

.local-modal-content .apply-modal-query-panel .el-row:last-child {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 12px;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item.apply-modal-label-required .el-form-item__label,
.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
  margin-right: 0 !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: none !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.local-modal-content .apply-modal-table-panel {
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.local-modal-content .apply-modal-toolbar {
  flex-shrink: 0;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 0;
}

.local-modal-content .apply-modal-table-panel .apply-detail-table {
  margin-bottom: 0 !important;
  box-shadow: none;
}

.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 98px !important;
  max-width: 98px;
}

.local-modal-content .modal-detail-section .el-table .detail-input-compact.el-date-editor.el-input {
  width: 98px !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 1.35;
}

.local-modal-content .modal-detail-section .el-table ::v-deep thead th.el-table__cell {
  padding: 6px 0 !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .apply-modal-query-panel .el-input,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-select,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-picker,
.local-modal-content .modal-form-compact .apply-modal-query-panel .el-date-editor {
  width: 140px;
  max-width: 140px;
}

.local-modal-content .modal-form-compact .modal-detail-section .el-input,
.local-modal-content .modal-form-compact .modal-detail-section .el-select,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-picker,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor,
.local-modal-content .modal-form-compact .modal-detail-section .el-input.el-input--small,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor.el-input {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}

.local-modal-content .modal-form-compact .form-item-header-billno .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.local-modal-content .modal-form-compact .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 弹窗内表格：高度由 el-table :height 控制 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table th.is-leaf {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table th .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table thead th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

/* 明细表横向滚动条：12px，固定粗细（须覆盖下方 thin 通配） */
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 合计行：与到货验收同高同色（灰蓝底 #f1f5f9） */
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  position: relative;
  z-index: 30 !important;
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__footer-wrapper tr,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
}

::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  scrollbar-width: thin;
}

.app-container {
  position: relative;
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

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
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

/* 弹窗明细表悬停由下方非 scoped 的 #D6EBFF 规则接管，避免被本处灰色覆盖 */

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
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

/* 弹窗样式已在上方统一为到货验收 apply-modal 结构，此处不再重复旧布局规则 */

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非scoped确保生效） */
.app-container.outWarehouse-refundDepotApply-page {
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

.app-container.outWarehouse-refundDepotApply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.outWarehouse-refundDepotApply-page .list-query-panel,
.app-container.outWarehouse-refundDepotApply-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.outWarehouse-refundDepotApply-page .apply-table-panel {
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

.app-container.outWarehouse-refundDepotApply-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-pagination-wrap .pagination-container {
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

.app-container.outWarehouse-refundDepotApply-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table.el-table {
  position: relative;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.apply-action-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr > td,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr:hover > td,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-refundDepotApply-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/* 弹窗明细框：与到货验收 apply-modal-table-panel 一致（铺满、无左右圆角边框） */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

/* 弹窗明细表头：与到货验收主列表一致 */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表滚动条：与到货验收一致（横向 12px，无两端箭头） */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

/* 明细表勾选列 sticky */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

/* 弹窗明细表：悬停 / 勾选行高亮（与到货验收、退货申请一致） */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected:hover > td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

/* 合计行始终显示，样式与到货验收一致（表头同色灰蓝底） */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative;
  z-index: 30 !important;
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
  border-bottom: none !important;
  overflow: visible !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:first-child,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:first-child {
  border-left: 1px solid #e2e8f0 !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:last-child,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:last-child {
  border-right: 1px solid #e2e8f0 !important;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell:empty,
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell:empty {
  padding: 0;
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table-column--selection .cell {
  font-size: 0;
}

/* 修改退库弹窗明细：名称/规格/型号最多两行，行高随内容；悬停 title 看全文 */
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}

.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 6px;
  padding-bottom: 6px;
}
.app-container.outWarehouse-refundDepotApply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.45;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
}
</style>

<style>
.json-viewer-pre {
  max-height: 520px;
  overflow: auto;
  margin: 0;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}
</style>
