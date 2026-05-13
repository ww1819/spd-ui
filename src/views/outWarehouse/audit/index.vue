<template>
  <div class="app-container outWarehouse-audit-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="出库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="departmentId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectDepartment v-model="queryParams.departmentId" />
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item style="display: flex; align-items: center; flex-wrap: wrap;">
            <el-radio-group v-model="queryParams.dateQueryType" size="small" style="margin-right: 10px; margin-bottom: 4px;">
              <el-radio-button label="bill">制单日期</el-radio-button>
              <el-radio-button label="audit">审核日期</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="queryParams.beginDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="起始日期"
              clearable
              style="width: 220px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="截止日期"
              clearable
              style="width: 220px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6" class="query-status-col">
          <el-form-item prop="billStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.billStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option :label="'未审核'" :value="1" />
              <el-option :label="'已审核'" :value="2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="被引用状态" label-width="88px">
            <el-select v-model="queryParams.params.docRefStatus" clearable placeholder="全部" style="width: 150px">
              <el-option v-for="o in docRefStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['outWarehouse:apply:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          size="medium"
          @click="handleExport"
          v-hasPermi="['outWarehouse:audit:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList" class="table-compact"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" fixed="left" :selectable="selectableAuditRow" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="出库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable />
      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
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
      <el-table-column label="被引用" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
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
              @click="handleUpdate(scope.row)"
              v-hasPermi="['outWarehouse:apply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['outWarehouse:apply:remove']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleShowEntryChangeLog(scope.row)"
              style="padding: 0 5px; margin: 0;"
              v-hasPermi="['outWarehouse:apply:query']"
            >变更记录</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改出库对话框 -->
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
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :value2="true" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId" :value2="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="出库类型" prop="billType">
              <el-select v-model="form.billType" placeholder="请选择出库类型"
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

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-alert
          v-if="form.whWarehouseApplyId"
          type="warning"
          :closable="false"
          show-icon
          class="wh-apply-outbound-hint"
          title="引用库房申请单出库：同一申请明细在本单各行的「数量」合计不得大于「可引用」；「可引用」=申请数扣减明细作废与其它出库单已占用。"
        />

        <div class="modal-detail-section">
        <el-row :gutter="10" class="detail-toolbar-row">
          <el-col :span="1.5">
            <span>出库明细信息</span>
          </el-col>
          <el-col :span="1.5" v-if="form.id">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="small"
              @click="handleExportDetailPickList"
              v-hasPermi="['outWarehouse:audit:export']"
            >导出拣货单</el-button>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" fixed="left" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
          <el-table-column v-if="action" label="操作" width="188" align="center" resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyOutEntryRow(scope.$index)">复制</el-button>
              <el-button type="text" size="small" style="color:#f56c6c" @click="deleteOutEntryRow(scope.$index)">删除</el-button>
              <el-button type="text" size="small" @click="openPickBatchForRow(scope.$index)">选批次</el-button>
            </template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.model" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)" placeholder="单价" />
            </template>
          </el-table-column>
          <el-table-column label="已引用" prop="srcRefedQty" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="srcRefableQty" width="88" align="center" show-overflow-tooltip resizable>
            <template slot="header">
              <el-tooltip
                content="引用库房申请时：本单同一申请明细各行「数量」之和不得大于「可引用」；可引用=申请数−已作废−其它单已出库占用。"
                placement="top"
              >
                <span class="table-header-with-tip">可引用<i class="el-icon-question" /></span>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" :disabled="true" placeholder="数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="金额" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="320" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span class="batch-no-text">{{ scope.row.batchNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" :disabled="true" placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择生产日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择有效期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="true" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
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

    <el-dialog
      :visible.sync="modalObj.show"
      :width="modalObj.width"
      custom-class="out-warehouse-print-dialog"
      append-to-body
    >
      <template slot="title">
        <div class="print-dialog-title-row">
          <span class="print-dialog-title-text">{{ modalObj.title }}</span>
          <div v-if="showPrintOrientation" class="print-orientation-in-title">
            <span class="print-orientation-label">打印方向</span>
            <el-radio-group v-model="modalObj.form.printOrientation" size="small">
              <el-radio label="landscape">横向</el-radio>
              <el-radio label="portrait">纵向</el-radio>
            </el-radio-group>
          </div>
        </div>
      </template>
      <div v-if="modalObj.component === 'print-type'">
        <el-radio-group v-model="modalObj.form.value">
          <!--          <el-radio :label=" 1 ">lodop打印</el-radio>-->
          <el-radio :label="2">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 10px;">
          <span style="margin-right: 10px;">纸张</span>
          <el-radio-group v-model="modalObj.form.paperType" size="small">
            <el-radio label="a4">A4</el-radio>
            <el-radio label="third-split">三等分纸</el-radio>
          </el-radio-group>
        </div>
      </div>
      <div v-if="showPrintContent">
        <out-order-print
          :row="modalObj.form.row"
          :print-orientation="modalObj.form.printOrientation || 'portrait'"
          :paper-type="modalObj.form.paperType || 'a4'"
          :embed-preview="true"
          ref="receiptOrderPrintRef"
        ></out-order-print>
      </div>
      <template slot="footer" class="dialog-footer">
        <el-button @click="modalObj.cancel">取消</el-button>
        <el-button @click="modalObj.ok" type="primary">确认</el-button>
      </template>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      :lockedMaterialId="inventoryLockedMaterialId"
      :ignoreSelectedDetailRowIndex="inventoryPickRowIndex"
      :selectedDetails="stkIoBillEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

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
import { listOutWarehouse, getOutWarehouse,
  delOutWarehouse, updateOutWarehouse,auditOutWarehouse, listEntryChangeLog } from "@/api/warehouse/outWarehouse";
import { collectCkThScopeErrors } from '@/utils/auditBillScopeValidate';
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import outOrderPrint from "@/views/outWarehouse/audit/outOrderPrint";
import { buildOutboundPrintRowFromDetail } from '@/views/warehouse/print/outboundPrintRow'
import {
  cloneStkOutEntryForDuplicate,
  cloneDocRefRowForDuplicate,
  sumQtyByWhApplyEntryId,
  maxSrcRefableQtyByWhApplyEntryId
} from '@/utils/outWarehouseBillRow'
import {STOCK_OUT_TEMPLATE} from '@/utils/printData'

export default {
  name: "OutWarehouseAudit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,outOrderPrint},
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      inventoryPickRowIndex: null,
      inventoryLockedMaterialId: null,
      warehouseValue: "",
      isShow: true,
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
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: null,
          row: null,
          printOrientation: 'portrait',
          paperType: 'a4'
        },
        ok: () => {
        },
        cancel: () => {
        }
      },
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 出库表格数据
      warehouseList: [],
      selectRow: [],
      // 出库明细表格数据
      stkIoBillEntryList: [],
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
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        // 默认不选择单据状态
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
        billDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室ID不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 预览弹窗或已选「浏览器打印」时显示方向 */
    showPrintOrientation() {
      const m = this.modalObj
      if (!m || !m.form) return false
      return m.component === 'window-print-preview'
        || (m.component === 'print-type' && Number(m.form.value) === 2)
    },
    showPrintContent() {
      const m = this.modalObj
      if (!m || !m.form) return false
      return Number(m.form.value) === 2 || m.component === 'window-print-preview'
    },
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const prop = column.property;
        if (prop === 'unitPrice' || prop === 'qty' || prop === 'amt') {
          const values = data.map(item => Number(item[prop]));
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              }
              return prev;
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
          if (prop === 'amt') {
            const res = parseFloat(sums[index]);
            if (!isNaN(res)) {
              this.form.totalAmount = res.toFixed(2);
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
    /** 查询出库列表 */
    getList() {
      this.loading = true;
      const status = this.queryParams.billStatus
      const baseQuery = { ...this.queryParams, billType: "201" }
      // “未审核”兼容口径：兼容后端按 1 或 0 或 null 任一方案筛选
      if (String(status) === '1') {
        Promise.all([
          listOutWarehouse({ ...baseQuery, billStatus: 1 }),
          listOutWarehouse({ ...baseQuery, billStatus: 0 }),
          listOutWarehouse({ ...baseQuery, billStatus: null })
        ]).then((responses) => {
          const mergedMap = new Map()
          responses.forEach(res => {
            const rows = (res && res.rows) || []
            rows.forEach(row => {
              const key = row && row.id != null ? String(row.id) : JSON.stringify(row)
              if (!mergedMap.has(key)) mergedMap.set(key, row)
            })
          })
          const mergedRows = Array.from(mergedMap.values())
          this.warehouseList = mergedRows.filter(r => r.billStatus == null || Number(r.billStatus) === 0 || Number(r.billStatus) === 1)
          this.total = this.warehouseList.length
          this.loading = false
        }).catch(() => {
          this.loading = false
        })
        return
      }
      listOutWarehouse(baseQuery).then(response => {
        const rows = (response && response.rows) || []
        if (String(status) === '2') {
          this.warehouseList = rows.filter(r => Number(r.billStatus) === 2)
          this.total = this.warehouseList.length
        } else {
          this.warehouseList = rows
          this.total = response.total
        }
        this.loading = false;
      });
    },
    resolveChangeLogBillType() {
      return 'STK_IO_BILL_201';
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
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      this.inventoryPickRowIndex = null
      this.inventoryLockedMaterialId = null
      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    openPickBatchForRow(rowIndex) {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      const row = this.stkIoBillEntryList[rowIndex]
      const mid =
        row && row.materialId != null && String(row.materialId).trim() !== ''
          ? row.materialId
          : row && row.material && row.material.id != null
            ? row.material.id
            : null
      if (!row || mid == null || String(mid).trim() === '') {
        this.$message({ message: '该行缺少耗材档案，无法按产品筛选库存', type: 'warning' })
        return
      }
      this.inventoryPickRowIndex = rowIndex
      this.inventoryLockedMaterialId = mid
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
      this.inventoryPickRowIndex = null
      this.inventoryLockedMaterialId = null
    },
    selectData(val) {
      const rows = Array.isArray(val) ? val : (val ? [val] : [])
      if (!rows.length) return
      const pickIdx = this.inventoryPickRowIndex
      if (pickIdx != null && pickIdx >= 0) {
        const item = rows[0]
        if (!item) {
          this.inventoryPickRowIndex = null
          this.inventoryLockedMaterialId = null
          return
        }
        const target = this.stkIoBillEntryList[pickIdx]
        if (!target) {
          this.inventoryPickRowIndex = null
          this.inventoryLockedMaterialId = null
          return
        }
        const existedOther = new Set(
          this.stkIoBillEntryList
            .map((e, i) => (i !== pickIdx && e && e.batchNo ? String(e.batchNo).trim() : ''))
            .filter(Boolean)
        )
        if (item.batchNo && existedOther.has(String(item.batchNo).trim())) {
          this.$modal.msgError('该批次号已在其它明细行使用，请选择其它批次')
          return
        }
        target.materialId = item.materialId
        target.unitPrice = item.unitPrice
        if (target.qty == null || String(target.qty).trim() === '') {
          target.qty = item.qty
        }
        target.batchNo = item.batchNo
        target.batchNumber = item.batchNumber || item.materialNo || ''
        target.beginTime = item.beginTime
        target.endTime = item.endTime
        target.remark = item.remark
        target.material = item.material
        target.supplierId = item.supplierId
        target.supplerId = item.supplerId != null ? item.supplerId : item.supplierId
        if (item.id != null) {
          target.stkInventoryId = item.id
          target.kcNo = String(item.id)
        } else {
          target.stkInventoryId = null
          target.kcNo = null
        }
        if (item.warehouseId != null) {
          target.warehouseId = item.warehouseId
        }
        this.qtyChange(target)
        this.inventoryPickRowIndex = null
        this.inventoryLockedMaterialId = null
        return
      }
      this.selectRow = val;
      rows.forEach((item) => {
        if (!item) return
        let obj = {};
        obj.materialId = item.materialId;
        obj.unitPrice = item.unitPrice;
        obj.qty = item.qty;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.batchNumber || item.materialNo || "";
        obj.beginTime = item.beginTime;
        obj.endTime = item.endTime;
        obj.remark = item.remark;
        obj.material = item.material;
        obj.supplierId = item.supplierId;
        if (item.id != null) {
          obj.stkInventoryId = item.id
          obj.kcNo = String(item.id)
        }
        if (item.warehouseId != null) {
          obj.warehouseId = item.warehouseId
        }

        this.stkIoBillEntryList.push(obj);
        if (Array.isArray(this.form.docRefList)) {
          this.form.docRefList.push({ refType: null });
        }
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
        auditDate:null,
        docRefList: []
      };
      this.stkIoBillEntryList = [];
      this.inventoryPickRowIndex = null
      this.inventoryLockedMaterialId = null
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
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
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
      this.queryParams.dateQueryType = 'bill';
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.params = this.queryParams.params || {};
      this.queryParams.params.docRefStatus = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 仅待审核的单据可勾选，已审核的不可勾选 */
    selectableAuditRow(row) {
      return row.billStatus != 2
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getOutWarehouse(id).then(response => {
        this.form = response.data;
        this.$set(this.form, 'docRefList', Array.isArray(response.data.docRefList) ? response.data.docRefList : []);
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '2';
        this.form.billType = '201';
        this.title = "查看出库";
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;
      getOutWarehouse(id).then(async res => {
        const data = res.data
        const errs = await collectCkThScopeErrors(data, data.stkIoBillEntryList, data.billType)
        if (errs.length) {
          this.$modal.msgError(errs.join('；'))
          return
        }
        this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
          return auditOutWarehouse({ id: id, auditBy: auditBy })
        }).then(() => {
          this.getList()
          this.$modal.msgSuccess('审核出库成功！')
        }).catch(() => {})
      }).catch(() => {})
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要审核的数据");
        return;
      }
      const auditBy = this.$store.state.user.userId;
      this.$modal.confirm('确定要审核选中的"' + ids.length + '"条数据项？').then(() => {
        // 批量审核：循环调用审核接口
        const promises = ids.map(id => auditOutWarehouse({id: id, auditBy: auditBy}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOutWarehouse(id).then(response => {
        this.form = response.data;
        this.$set(this.form, 'docRefList', Array.isArray(response.data.docRefList) ? response.data.docRefList : []);
        this.form.billStatus = '1';
        this.form.billType = '201';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改出库";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(async valid => {
        if (!valid) return
        for (const [index, entry] of this.stkIoBillEntryList.entries()) {
          const bn = entry && entry.batchNo != null ? String(entry.batchNo).trim() : ''
          if (!bn) {
            this.$modal.msgError(`第${index + 1}行未选择批次，请点击「选批次」或通过「添加」选择库存`)
            return
          }
          if (entry.kcNo == null || String(entry.kcNo).trim() === '') {
            this.$modal.msgError(`第${index + 1}行缺少库存行标识，请重新选择批次`)
            return
          }
        }
        if (this.form.whWarehouseApplyId) {
          const sums = sumQtyByWhApplyEntryId(this.stkIoBillEntryList)
          const maxRef = maxSrcRefableQtyByWhApplyEntryId(this.stkIoBillEntryList)
          for (const [whEid, sum] of sums.entries()) {
            const cap = maxRef.get(whEid)
            if (cap != null && sum > cap) {
              this.$modal.msgError(
                `引用库房申请单出库：同一申请明细本单「数量」合计不得大于可申请（界面「可引用」）${cap}，当前合计 ${sum}。请调小数量或删除多余行后再保存。`
              )
              return
            }
          }
        }
        const batchMap = new Map()
        for (const [index, entry] of this.stkIoBillEntryList.entries()) {
          const key = entry && entry.batchNo && String(entry.batchNo).trim()
          if (!key) continue
          if (batchMap.has(key)) {
            this.$modal.msgError(`明细第${batchMap.get(key)}行与第${index + 1}行批次号重复，请检查后再保存`)
            return
          }
          batchMap.set(key, index + 1)
        }
        this.form.stkIoBillEntryList = this.stkIoBillEntryList
        if (!Array.isArray(this.form.docRefList)) {
          this.$set(this.form, 'docRefList', []);
        }
        const scopeErrs = await collectCkThScopeErrors(this.form, this.stkIoBillEntryList, this.form.billType)
        if (scopeErrs.length) {
          this.$modal.msgError(scopeErrs.join('；'))
          return
        }
        var totalAmt = 0
        this.stkIoBillEntryList.forEach(item => {
          if (item.amt) {
            totalAmt += parseFloat(item.amt)
          }
        })
        this.form.totalAmount = totalAmt.toFixed(2)
        if (this.form.id != null) {
          updateOutWarehouse(this.form).then(response => {
            this.$modal.msgSuccess('修改成功')
            this.open = false
            this.getList()
          })
        }
      })
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      if (!row || row.id == null) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      this.$router.push({
        path: '/print/outbound',
        query: {
          id: String(row.id),
          from: encodeURIComponent(this.$route.fullPath)
        }
      })
    },
    doPrintOut(row, print) {
      this.getOutWarehouseDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_OUT_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_OUT_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getOutWarehouseDetail(row) {
      return getOutWarehouse(row.id).then(response => {
        return buildOutboundPrintRowFromDetail(row, response.data)
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除出库编号为"' + ids + '"的数据项？').then(function() {
        return delOutWarehouse(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 出库明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 出库明细添加按钮操作 */
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
      obj.supplierId = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 出库明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的出库明细数据");
        return;
      }
      const removeSet = new Set(this.checkedStkIoBillEntry);
      const refs = Array.isArray(this.form.docRefList) ? this.form.docRefList : null;
      const nextEntries = [];
      const nextRefs = [];
      this.stkIoBillEntryList.forEach((item, idx) => {
        if (removeSet.has(item.index)) {
          return;
        }
        nextEntries.push(item);
        if (refs && idx < refs.length) {
          nextRefs.push(refs[idx]);
        }
      });
      this.stkIoBillEntryList = nextEntries;
      if (refs) {
        this.$set(this.form, 'docRefList', nextRefs);
      }
    },
    copyOutEntryRow(rowIndex) {
      const src = this.stkIoBillEntryList[rowIndex];
      if (!src) {
        return;
      }
      const clone = cloneStkOutEntryForDuplicate(src);
      this.stkIoBillEntryList.splice(rowIndex + 1, 0, clone);
      if (!Array.isArray(this.form.docRefList)) {
        this.$set(this.form, 'docRefList', []);
      }
      const refs = this.form.docRefList;
      const refRow = rowIndex < refs.length ? cloneDocRefRowForDuplicate(refs[rowIndex]) : { refType: null };
      refs.splice(rowIndex + 1, 0, refRow);
    },
    deleteOutEntryRow(rowIndex) {
      this.stkIoBillEntryList.splice(rowIndex, 1);
      if (Array.isArray(this.form.docRefList) && rowIndex < this.form.docRefList.length) {
        this.form.docRefList.splice(rowIndex, 1);
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作：按单据隔离（单据号、科室名称 + 明细） */
    handleExport() {
      const params = { ...this.queryParams, billType: this.queryParams.billType || '201' }
      if (this.ids && this.ids.length > 0) {
        params.exportBillIds = this.ids.join(',')
      }
      this.download('warehouse/outWarehouse/auditExportGroupedByBill', params, `出库单导出_${new Date().getTime()}.xlsx`)
    },
    /** 明细区：导出当前单据拣货单 */
    handleExportDetailPickList() {
      if (!this.form || !this.form.id) {
        this.$modal.msgWarning('单据未加载完成')
        return
      }
      const params = {
        billType: '201',
        exportBillIds: String(this.form.id),
        dateQueryType: this.queryParams.dateQueryType,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      }
      const name = (this.form.billNo || this.form.id) + '_拣货单'
      this.download('warehouse/outWarehouse/auditExportGroupedByBill', params, `${name}_${new Date().getTime()}.xlsx`)
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
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内顶部字段区：与到货验收一致 */
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
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

.wh-apply-outbound-hint {
  margin: 0 0 8px;
  flex-shrink: 0;
}

.table-header-with-tip {
  cursor: help;
}

.table-header-with-tip .el-icon-question {
  margin-left: 2px;
  font-size: 12px;
  color: #909399;
}

/* 弹窗内明细区：与到货验收一致 */
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
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
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

.batch-no-text {
  display: inline-block;
  width: 100%;
  white-space: normal;
  word-break: break-all;
  line-height: 18px;
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
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
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

::v-deep .local-modal-content .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
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

::v-deep .local-modal-content .el-table .el-table__body-wrapper {
  scrollbar-width: thin;
}

.app-container {
  position: relative;
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  align-items: center;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
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

/* 表格水平滚动条样式 */
.el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto;
}

/* 水平滚动条样式 */
.el-table__body-wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 10px;
}

.el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 10px;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 确保表格底部水平滚动条可见 */
.el-table .el-table__body-wrapper {
  overflow-x: auto !important;
}

/* 表格头部和底部都显示滚动条占位，确保对齐 */
.el-table__header-wrapper,
.el-table__footer-wrapper {
  overflow-x: hidden;
}

/* 确保固定列不影响滚动条 */
.el-table__fixed-right,
.el-table__fixed {
  height: 100%;
}

/* 表单样式优化 */
.el-form {
  background: #fff;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

/* 搜索区域：外层白底容器（宽度铺满、边框与阴影略加强） */
.app-container > .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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

/* 主表格水平滚动条样式 */
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

/* 出库打印弹窗：标题栏内「打印方向」 */
.print-dialog-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding-right: 36px;
  box-sizing: border-box;
}
.print-dialog-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.print-orientation-in-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-weight: normal;
  font-size: 14px;
}
.print-orientation-label {
  color: #606266;
}
</style>

<style>
/* 打印弹窗 append-to-body，标题行样式需非 scoped */
.out-warehouse-print-dialog .print-dialog-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding-right: 36px;
  box-sizing: border-box;
}
.out-warehouse-print-dialog .print-dialog-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.out-warehouse-print-dialog .print-orientation-in-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-weight: normal;
  font-size: 14px;
}
.out-warehouse-print-dialog .print-orientation-label {
  color: #606266;
}

/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.outWarehouse-audit-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
}

.app-container.outWarehouse-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
}

.app-container.outWarehouse-audit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.outWarehouse-audit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.outWarehouse-audit-page > .el-table.table-compact {
  margin-top: 0;
  border: 1px solid #EBEEF5 !important;
}

.app-container.outWarehouse-audit-page > .el-table.table-compact::before,
.app-container.outWarehouse-audit-page > .el-table.table-compact::after {
  background-color: #EBEEF5 !important;
}

/* 主表格表头样式：与到货验收一致 */
.app-container.outWarehouse-audit-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.outWarehouse-audit-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

/* 单据状态列不换行，宽度不足时自动增加 */
.app-container.outWarehouse-audit-page > .el-table .col-bill-status .cell {
  white-space: nowrap !important;
}

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
