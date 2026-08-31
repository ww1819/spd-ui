<template>
  <div class="app-container list-page gz-order-audit-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="出库单号"
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
              <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
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
          v-hasPermi="['gzOrder:apply:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['gzOrder:apply:export']"
        >导出</el-button>
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleBatchAudit"
          v-hasPermi="['gzOrder:apply:audit']"
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
    <el-table ref="applyMainTable" v-loading="loading" :data="orderList"
              class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange" :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="出库单号" align="center" prop="orderNo" width="180" min-width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
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
          <span>{{ getAuditorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.auditDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          <span>{{ getCreatorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="orderDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByOrderDate">
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.orderDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" class-name="apply-action-col small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row)"
              v-if="scope.row.orderStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['gzOrder:apply:edit']"
              v-if="scope.row.orderStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['gzOrder:apply:remove']"
              v-if="scope.row.orderStatus != 2"
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
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item :label="isOutbound ? '出库单号' : '入库单号'" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :disabled="headerWhDeptLocked" includeWarehouseType="高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="headerWhDeptLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额">
                      <el-input :value="getTotalAmount()" :disabled="true" placeholder="总金额" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="orderStatus">
                      <el-select v-model="form.orderStatus" placeholder="单据状态" :disabled="true" clearable>
                        <el-option v-for="dict in dict.type.biz_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单时间" prop="orderDate" class="apply-modal-label-required">
                      <el-date-picker clearable v-model="form.orderDate" type="date" :disabled="true" value-format="yyyy-MM-dd" placeholder="制单时间" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                  <el-col v-if="isOutbound && action" class="apply-modal-field apply-modal-field--udi-scan in-hospital-scan-field">
                    <el-form-item label="院内码" prop="scanInHospitalCode" class="detail-scan-form-item">
                      <el-input
                        v-model="form.scanInHospitalCode"
                        :placeholder="scanInHospitalPlaceholder"
                        clearable
                        size="small"
                        class="scan-barcode-input"
                        :disabled="scanInputDisabled"
                        @keyup.enter.native="handleScanInHospitalCode"
                      >
                        <template slot="prepend">
                          <i class="el-icon-s-operation"></i>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action || isAuditedForm" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">{{ isOutbound ? '备货出库明细信息' : '高值备货入库明细信息' }}</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm || !canScanOrAdd" @click="checkMaterialBtn">添加</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" :disabled="isAuditedForm" @click="handleDeleteGzOrderEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm" @click="submitForm">保 存</el-button>
                    <el-button
                      v-if="isOutbound"
                      type="primary"
                      size="small"
                      class="spd-btn spd-btn--secondary"
                      :disabled="!canOpenRefAcceptance"
                      v-hasPermi="['gz:refDoc:query']"
                      @click="openRefAcceptance"
                    >引用验收单</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="isAuditedForm || hasDialogUnsavedChanges || !form.id" @click="handleDialogAudit">审 核</el-button>
                    <el-button type="primary" icon="el-icon-printer" size="small" class="spd-btn spd-btn--secondary" :disabled="hasDialogUnsavedChanges || !form.id || !isAuditedForm" @click="handleDialogPrint">打 印</el-button>
                    <el-button size="small" class="spd-btn spd-btn--secondary" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                  </template>
                  <el-button v-if="!action" size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                <el-table :data="gzOrderEntryList" :row-class-name="applyGzOrderDetailRowClassName"
                  class="apply-detail-table"
                  @selection-change="handleGzOrderEntrySelectionChange"
                  ref="gzOrderEntry"
                  border
                  show-summary
                  :summary-method="getSummariesWithRefresh"
                  :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
                  <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
                  <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="名称"
                    align="left"
                    header-align="center"
                    prop="materialName"
                    width="150"
                    min-width="140"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                    sortable
                    :sort-method="sortByDetailMaterialName"
                  >
                    <template slot-scope="scope">
                      <span
                        class="detail-text-cell-2line"
                        :title="scope.row.materialName || (scope.row.material && scope.row.material.name) || '--'"
                      >{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="规格"
                    align="left"
                    header-align="center"
                    prop="speci"
                    width="130"
                    min-width="110"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                    sortable
                    :sort-method="sortByDetailSpeci"
                  >
                    <template slot-scope="scope">
                      <span
                        class="detail-text-cell-2line"
                        :title="(scope.row.material && scope.row.material.speci) || scope.row.speci || '--'"
                      >{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" align="center" prop="unit" width="80" min-width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unit">{{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}</span>
                      <span v-else-if="scope.row.material">{{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'qty')">
                    <template slot-scope="scope">
                      <div class="detail-cell-focus-wrap" :data-detail-row="scope.$index" data-detail-col="qty">
                        <el-input
                          v-if="!isAuditedForm && action && !refMode"
                          clearable
                          v-model="scope.row.qty"
                          placeholder="数量"
                          size="small"
                          class="detail-input-compact"
                          onkeyup="value=value.replace(/\D/g,'')"
                          onafterpaste="value=value.replace(/\D/g,'')"
                          @input="qtyChange(scope.row)"
                        />
                        <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" align="center" prop="price" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'price')">
                    <template slot-scope="scope">
                      <div style="text-align: center;">
                        <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByDetailNumber(a,b,'amt')">
                    <template slot-scope="scope">
                      <div style="text-align: center;">
                        <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" align="center" prop="batchNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.batchNo || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" align="center" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.batchNumber || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" align="center" prop="endTime" width="128" min-width="128" show-overflow-tooltip resizable sortable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column
                    label="生产厂家"
                    align="left"
                    header-align="center"
                    prop="factoryName"
                    width="160"
                    min-width="140"
                    :show-overflow-tooltip="false"
                    class-name="detail-col-text-wrap"
                    resizable
                  >
                    <template slot-scope="scope">
                      <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--'">
                        {{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.inHospitalCode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="UDI码" align="center" prop="udiNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.udiNo || scope.row.masterBarcode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.secondaryBarcode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" :disabled="isAuditedForm" placeholder="备注" size="small" class="detail-input-compact" />
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
        <gz-order-print v-if=" modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0 " :key="`print-${modalObj.form.row.orderNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row=" modalObj.form.row " :orientation=" modalObj.form.orientation || 'landscape' " ref="receiptOrderPrintRef"></gz-order-print>
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
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="form.warehouseId"
      :gzOrderEntryList="gzOrderEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

    <el-dialog title="引用备货验收单" :visible.sync="refAcceptOpen" width="900px" append-to-body @close="onRefAcceptDialogClose">
      <p style="margin:0 0 8px;color:#909399;font-size:13px">
        出库仓库：已锁定为表头仓库；<span v-if="form.departmentId">申请科室已锁定为表头科室</span><span v-else>未选科室时不按科室过滤</span>。
      </p>
      <el-tabs v-model="refTabStatus" @tab-click="loadRefAcceptList">
        <el-tab-pane label="未引用" name="0" />
        <el-tab-pane label="部分引用" name="1" />
        <el-tab-pane label="已引用" name="2" />
      </el-tabs>
      <el-table :data="refAcceptList" v-loading="refLoading" highlight-current-row
                @current-change="onRefAcceptRowChange"
                max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column prop="orderNo" label="验收单号" min-width="140" show-overflow-tooltip/>
        <el-table-column label="申请科室" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.applyDepartment && scope.row.applyDepartment.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="可引条码数" width="100" align="center" prop="refAvailableCount"/>
        <el-table-column label="引用状态" width="90" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.shipmentRefStatus === 2">已引用</span>
            <span v-else-if="scope.row.shipmentRefStatus === 1">部分引用</span>
            <span v-else>未引用</span>
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="110" align="center">
          <template slot-scope="scope">{{ formatDisplayDateTime(scope.row.auditDate, scope.row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refAcceptOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefAcceptance">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="请先选择科室"
      :visible.sync="refDeptPickOpen"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
      @closed="refPendingDepartmentId = null"
    >
      <p style="margin:0 0 12px;color:#909399;font-size:13px">引用验收单带出明细前，需要先选择出库科室；取消则不增加明细。</p>
      <el-form label-width="70px" size="small">
        <el-form-item label="科室" required>
          <SelectDepartment v-model="refPendingDepartmentId" :disabled="refDeptPickLocked" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="refDeptPickOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRefDeptPick">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="明细变更记录"
      :visible.sync="entryChangeLogDialog.visible"
      width="1000px"
    >
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.rows" border size="small" max-height="460">
        <el-table-column label="变更时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ parseTime(scope.row.changeTime, '{y}-{m}-{d} {h}:{i}:{s}') || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="动作" width="90" align="center" />
        <el-table-column prop="entryId" label="明细ID" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="变更前" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button v-if="scope.row.beforeJson" type="text" size="mini" @click="showJsonDetail('变更前', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button v-if="scope.row.afterJson" type="text" size="mini" @click="showJsonDetail('变更后', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="860px">
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonViewer.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder, checkInHospitalCode, getDepotByInHospitalCodeForOutbound, listEntryChangeLog } from "@/api/gz/shipment";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listAuditedAcceptance, previewAcceptanceRef } from "@/api/gz/refDoc";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import { parseTime } from "@/utils/ruoyi";
import { listUserAll } from "@/api/system/user";
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
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      // 总条数
      total: 0,
      // 高值入库表格数据
      orderList: [],
      userOptions: [],
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
      refAcceptOpen: false,
      refAcceptList: [],
      refLoading: false,
      refPickOrderId: null,
      refPickOrderNo: null,
      refPickOrder: null,
      refTabStatus: '0',
      /** 引用验收单：表头无科室时先弹窗选科室 */
      refDeptPickOpen: false,
      refPendingDepartmentId: null,
      refDeptPickLocked: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        orderDate: [
          { required: true, message: "制单时间不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        departmentId: [
          {
            validator: (rule, value, callback) => {
              if (this.isOutbound && (value === null || value === undefined || value === '')) {
                callback(new Error('科室不能为空'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
      },
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      },
      dialogSavedSnapshot: '',
      _lastSidebarNavTick: null,
      detailSelectedRowMap: {},
      detailSelectionTick: 0,
      detailSummaryTick: 0
    };
  },
  computed: {
    refMode() {
      return !!(this.form && this.form.refAcceptanceId);
    },
    headerWhDeptLocked() {
      return !this.action || this.isAuditedForm || this.refMode
        || (this.gzOrderEntryList && this.gzOrderEntryList.length > 0);
    },
    canOpenRefAcceptance() {
      return this.isOutbound && this.action && !this.isAuditedForm
        && this.form && this.form.warehouseId
        && (!this.gzOrderEntryList || this.gzOrderEntryList.length === 0)
        && !this.form.refAcceptanceId;
    },
    refAcceptDisabledTip() {
      if (!this.form || !this.form.warehouseId) return '请先选择出库仓库';
      if (this.form.refAcceptanceId) return '已绑定验收单，不可再次引用';
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) return '已有明细时不可引用，请删除整单后重试';
      return '';
    },
    canScanOrAdd() {
      return !this.refMode && this.form && this.form.warehouseId && this.form.departmentId;
    },
    scanInputDisabled() {
      return !this.canScanOrAdd || !this.action || this.isAuditedForm;
    },
    scanInHospitalPlaceholder() {
      if (this.refMode) return '引用模式下不可扫码';
      if (!this.form || !this.form.warehouseId) return '请先选择仓库';
      if (!this.form.departmentId) return '请先选择科室';
      return '扫描院内码后回车';
    },
    isAuditedForm() {
      const status = this.form && this.form.orderStatus;
      return status === '2' || status === 2;
    },
    hasDialogUnsavedChanges() {
      if (!this.open || !this.action) {
        return false;
      }
      if (!this.dialogSavedSnapshot) {
        return true;
      }
      return this.buildDialogSnapshot() !== this.dialogSavedSnapshot;
    },
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    orderList() {
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
        this.$nextTick(() => this.refreshDetailSummary());
      }
    },
    gzOrderEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => this.refreshDetailSummary());
      }
    }
  },
  created() {
    this.setOrderTypeByRoute();
    this.loadUserOptions();
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
      if (!table || !this.orderList || !this.orderList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.orderList.forEach((row) => {
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
      const va = this.getCreatorName(a) || '';
      const vb = this.getCreatorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditorName(a, b) {
      const va = this.getAuditorName(a) || '';
      const vb = this.getAuditorName(b) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByOrderDate(a, b) {
      const pick = (row) => row && (row.orderDate || row.createTime) || '';
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
    sortByDetailMaterialName(a, b) {
      const va = (a.materialName || (a.material && a.material.name) || '').toString();
      const vb = (b.materialName || (b.material && b.material.name) || '').toString();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByDetailSpeci(a, b) {
      const va = (a.speci || (a.material && a.material.speci) || '').toString();
      const vb = (b.speci || (b.material && b.material.speci) || '').toString();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByDetailNumber(a, b, field) {
      const na = parseFloat(a && a[field]) || 0;
      const nb = parseFloat(b && b[field]) || 0;
      return na - nb;
    },
    getSummariesWithRefresh(param) {
      void this.detailSummaryTick;
      return this.getSummaries(param);
    },
    refreshDetailSummary() {
      this.detailSummaryTick++;
      this.$nextTick(() => {
        const t = this.$refs.gzOrderEntry;
        if (t && typeof t.doLayout === 'function') {
          t.doLayout();
        }
      });
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = columns.map(() => '');
      let summaryLabelPlaced = false;
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
          const total = sumNum('qty');
          sums[index] = Number.isInteger(total) ? String(total) : total.toFixed(2);
          return;
        }
        if (prop === 'price') {
          sums[index] = this.formatPrice(sumNum('price'));
          return;
        }
        if (prop === 'amt') {
          sums[index] = '￥' + this.formatAmount(sumNum('amt'));
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || this.queryParams.orderType || '101');
      if (orderType === '102') return 'GZ_SHIPMENT';
      if (orderType === '103') return 'GZ_REFUND_DEPOT';
      if (orderType === '104') return 'GZ_REFUND_GOODS';
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(this.resolveBillTypeByOrderType(), this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    jsonPreview(jsonText) {
      if (!jsonText) return '--';
      const pretty = this.prettyJson(jsonText);
      return pretty.length > 60 ? `${pretty.slice(0, 60)}...` : pretty;
    },
    prettyJson(jsonText) {
      if (!jsonText) return '';
      try {
        return JSON.stringify(JSON.parse(jsonText), null, 2);
      } catch (e) {
        return String(jsonText);
      }
    },
    showJsonDetail(title, jsonText) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(jsonText) || '--';
      this.jsonViewer.visible = true;
    },
    buildDialogSnapshot() {
      const form = this.form || {};
      const entryList = (this.gzOrderEntryList || []).map(item => ({
        id: item.id || null,
        materialId: item.materialId || null,
        qty: item.qty || null,
        price: item.price || null,
        amt: item.amt || null,
        batchNo: item.batchNo || null,
        batchNumber: item.batchNumber || null,
        inHospitalCode: item.inHospitalCode || null,
        remark: item.remark || null,
        supplierId: item.supplierId || (item.supplier && item.supplier.id) || null
      }));
      return JSON.stringify({
        id: form.id || null,
        orderNo: form.orderNo || null,
        orderDate: form.orderDate || null,
        warehouseId: form.warehouseId || null,
        departmentId: form.departmentId || null,
        refAcceptanceId: form.refAcceptanceId || null,
        orderStatus: form.orderStatus || null,
        orderType: form.orderType || null,
        remark: form.remark || null,
        entryList
      });
    },
    markDialogSnapshotSaved() {
      this.dialogSavedSnapshot = this.buildDialogSnapshot();
    },
    toHalfWidth(str) {
      if (!str || typeof str !== 'string') {
        return str;
      }
      return str.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');
    },
    handleScanInHospitalCode() {
      if (!this.isOutbound || !this.action || this.refMode) {
        return;
      }
      const wid = this.form.warehouseId;
      if (wid === null || wid === undefined || String(wid).trim() === '') {
        this.$modal.msgWarning('请先选择仓库，再扫描院内码');
        return;
      }
      const did = this.form.departmentId;
      if (did === null || did === undefined || String(did).trim() === '') {
        this.$modal.msgWarning('请先选择科室，再扫描院内码');
        return;
      }
      let code = (this.form.scanInHospitalCode || '').trim();
      if (!code) {
        this.$modal.msgWarning('请输入院内码');
        return;
      }
      code = this.toHalfWidth(code);
      getDepotByInHospitalCodeForOutbound(code, wid).then(res => {
        if (res.code !== 200 || !res.data) {
          this.$modal.msgWarning('未找到该院内码在当前仓库下的可用库存');
          return;
        }
        const inv = res.data;
        const dup = this.gzOrderEntryList.some(e => e.inHospitalCode && inv.inHospitalCode && e.inHospitalCode === inv.inHospitalCode);
        if (dup) {
          this.$modal.msgWarning('该院内码已在明细中');
          this.form.scanInHospitalCode = '';
          return;
        }
        const m = inv.material || {};
        const stockQty = parseFloat(inv.qty) || 0;
        const price = inv.unitPrice != null ? inv.unitPrice : 0;
        const qty = 1;
        const obj = {
          materialId: inv.materialId,
          materialName: m.name || inv.materialName || '',
          speci: m.speci || '',
          model: m.model || '',
          factoryName: (m.fdFactory && m.fdFactory.factoryName) || '',
          supplierName: (inv.supplier && inv.supplier.name) || (m.supplier && m.supplier.name) || '',
          qty: qty,
          stockQty: stockQty,
          price: price,
          amt: this.calcLineAmt(qty, price || 0),
          batchNo: inv.batchNo || '',
          batchNumber: inv.materialNo || '',
          beginTime: inv.materialDate || '',
          endTime: inv.endTime || '',
          remark: '',
          masterBarcode: inv.masterBarcode || '',
          secondaryBarcode: inv.secondaryBarcode || '',
          inHospitalCode: inv.inHospitalCode || code,
          udiNo: m.udiNo || '',
          supplierId: inv.supplierId || (m.supplier && m.supplier.id) || null,
          warehouseId: this.form.warehouseId,
          departmentId: this.form.departmentId,
          billNo: this.form.orderNo || null
        };
        this.gzOrderEntryList.push(obj);
        this.form.scanInHospitalCode = '';
      });
    },
/** 格式化总金额 */
    formatTotalAmt(row) {
      if (row.totalAmt !== undefined && row.totalAmt !== null && row.totalAmt !== '') {
        return this.formatAmount(row.totalAmt);
      }
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        const total = row.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return this.formatAmount(total);
      }
      return '0.00';
    },
    /** 计算明细总金额 */
    getTotalAmount() {
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        const total = this.gzOrderEntryList.reduce((sum, entry) => {
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
    loadUserOptions() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      }).catch(() => {
        this.userOptions = [];
      });
    },
    resolveSysUserDisplayName(rawKey) {
      if (rawKey == null || String(rawKey).trim() === '') {
        return '';
      }
      const key = String(rawKey).trim();
      const list = this.userOptions || [];
      const isNumericId = /^\d+$/.test(key);
      let user = null;
      if (isNumericId) {
        user = list.find(u => String(u.userId) === key || u.userId == key);
      }
      if (!user) {
        user = list.find(u =>
          String(u.userName) === key ||
          (u.nickName != null && String(u.nickName) === key)
        );
      }
      if (user) {
        return user.nickName || user.userName || key;
      }
      return key;
    },
    getCreatorName(row) {
      if (!row) return '';
      if (row.creater && (row.creater.nickName || row.creater.userName)) {
        return row.creater.nickName || row.creater.userName;
      }
      if (!row.createBy) return '';
      return this.resolveSysUserDisplayName(row.createBy);
    },
    normalizeHeaderDisplayFields(fallbackRow) {
      const row = fallbackRow || {};
      const currentWarehouseId = this.form.warehouseId || row.warehouseId || (row.warehouse && row.warehouse.id);
      if (currentWarehouseId) {
        this.form.warehouseId = String(currentWarehouseId);
      }
      const creatorName = this.getCreatorName(this.form);
      this.$set(this.form, 'creatorName', creatorName || (this.form.createBy != null && String(this.form.createBy).trim() !== '' ? String(this.form.createBy) : '--'));
      this.$set(this.form, 'auditorName', this.getAuditorName(this.form) || '');
    },
    getAuditorName(row) {
      if (!row || row.orderStatus != 2) {
        return '';
      }
      const auditKey =
        row.auditBy != null && String(row.auditBy).trim() !== '' ? row.auditBy : row.updateBy;
      if (!auditKey) {
        return '';
      }
      return this.resolveSysUserDisplayName(auditKey);
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
    /** 翻页：先同步 pageNum/pageSize 再查询，避免 size-change 时 limit 未写入 queryParams */
    handlePagination({ page, limit } = {}) {
      if (page != null) {
        this.queryParams.pageNum = page;
      }
      if (limit != null) {
        this.queryParams.pageSize = limit;
      }
      this.getList();
    },
    /** 查询高值入库列表 */
    getList() {
      this.loading = true;
      this.setOrderTypeByRoute();
      if (!this.queryParams.orderType) {
        this.queryParams.orderType = 101;
        this.isOutbound = false;
      }
      const query = { ...this.queryParams };
      const params = this.normalizeQueryDateTime(query);
      listOrder(params).then(response => {
        this.orderList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        if (this.total > 0 && this.orderList.length === 0) {
          console.warn('备货出库列表：总条数为', this.total, '但当前页 rows 为空，请检查分页或筛选条件');
        }
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(error => {
        console.error('查询失败:', error);
        this.orderList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败：' + (error.message || '未知错误'));
      });
    },
    checkMaterialBtn() {
      if (this.refMode) {
        this.$message.warning('引用模式下不可手工添加明细');
        return;
      }
      // 检查是否选择了仓库
      if (!this.form.warehouseId) {
        this.$message.warning('请先选择仓库');
        return;
      }
      // 出库必须选科室后再选明细
      if (this.isOutbound && !this.form.departmentId) {
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
        obj.supplierId = item.supplierId || (item.supplier && item.supplier.id) || (item.material && item.material.supplier && item.material.supplier.id) || null;
        this.gzOrderEntryList.push(obj);
      });
    },
    /** 当天日期，须为 yyyy-MM-dd（月日补零），否则后端 Jackson 无法反序列化为 Date */
    getOrderDate() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    /** 提交前将 orderDate 规范为 yyyy-MM-dd，兼容历史未补零字符串 */
    normalizeOrderDateForApi(val) {
      if (val == null || val === '') return val;
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const s = String(val);
      const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) {
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      }
      return val;
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
        secondaryBarcode: null,
        scanInHospitalCode: null,
        refAcceptanceId: null
      };
      this.gzOrderEntryList = [];
      this.refPickOrderId = null;
      this.refPickOrderNo = null;
      this.refPickOrder = null;
      this.dialogSavedSnapshot = '';
      this.detailSelectedRowMap = {};
      this.detailSelectionTick = 0;
      this.detailSummaryTick = 0;
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
      row.amt = this.toMoneyStorage(totalAmt);
      this.refreshDetailSummary();
    },
/** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.orderNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.timeField = 'createTime';
      this.queryParams.orderStatus = null;
      this.setOrderTypeByRoute();
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
      const pageKeys = (this.orderList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
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
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.$forceUpdate) table.$forceUpdate();
        if (table && table.doLayout) table.doLayout();
      });
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
              entry.materialCode = material.code || entry.materialCode || "";
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
        this.normalizeHeaderDisplayFields(response.data);
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
        this.markDialogSnapshotSaved();
      });
    },
    onRefAcceptDialogClose() {
      this.refDeptPickOpen = false;
      this.refPendingDepartmentId = null;
    },
    onRefAcceptRowChange(row) {
      if (row) {
        this.refPickOrder = row;
        this.refPickOrderId = row.id;
        this.refPickOrderNo = row.orderNo;
      }
    },
    loadRefAcceptList() {
      if (!this.form.warehouseId) return;
      this.refLoading = true;
      const params = {
        refWarehouseId: this.form.warehouseId,
        shipmentRefStatus: parseInt(this.refTabStatus, 10)
      };
      if (this.form.departmentId) {
        params.applyDepartmentId = this.form.departmentId;
      }
      listAuditedAcceptance(params).then(res => {
        this.refAcceptList = res.data || res.rows || [];
        this.refLoading = false;
      }).catch(() => { this.refLoading = false; });
    },
    openRefAcceptance() {
      if (!this.canOpenRefAcceptance) {
        this.$message.warning(this.refAcceptDisabledTip || '当前不可引用验收单');
        return;
      }
      this.refPickOrderId = null;
      this.refPickOrderNo = null;
      this.refPickOrder = null;
      this.refTabStatus = '0';
      this.refAcceptOpen = true;
      this.loadRefAcceptList();
    },
    confirmRefAcceptance() {
      if (!this.refPickOrderId) {
        this.$message.warning('请选择一条验收单');
        return;
      }
      const pick = this.refPickOrder || {};
      if (this.form.departmentId) {
        this.applyRefAcceptanceAfterDeptReady();
        return;
      }
      const ad = pick.applyDepartmentId;
      if (ad) {
        this.form.departmentId = ad;
        this.applyRefAcceptanceAfterDeptReady();
        return;
      }
      this.refPendingDepartmentId = null;
      this.refDeptPickLocked = false;
      this.refDeptPickOpen = true;
    },
    confirmRefDeptPick() {
      if (this.refPendingDepartmentId === null || this.refPendingDepartmentId === undefined || this.refPendingDepartmentId === '') {
        this.$message.warning('请选择科室');
        return;
      }
      this.form.departmentId = this.refPendingDepartmentId;
      this.refDeptPickOpen = false;
      this.applyRefAcceptanceAfterDeptReady();
    },
    applyRefAcceptanceAfterDeptReady() {
      if (!this.refPickOrderId || !this.form.warehouseId) return;
      const excludeId = this.form.id || undefined;
      previewAcceptanceRef(this.refPickOrderId, this.form.warehouseId, excludeId).then(res => {
        const preview = res.data || {};
        const available = preview.availableLines || [];
        const missing = preview.missingBarcodes || [];
        if (!available.length) {
          const missCodes = (missing || []).map(m => m.inHospitalCode || m.materialName).filter(Boolean).join('、');
          this.$message.warning(missCodes ? `以下条码在当前仓库无库存或未占用：${missCodes}` : '该验收单在当前仓库无可引用明细');
          return;
        }
        const applyLines = () => {
          this.gzOrderEntryList = [];
          available.forEach(r => this.gzOrderEntryList.push(this.mapDepotToOutboundEntry(r)));
          this.form.refAcceptanceId = this.refPickOrderId != null ? String(this.refPickOrderId) : null;
          this.refAcceptOpen = false;
          this.$message.success('已带入 ' + available.length + ' 条明细');
        };
        if (missing.length) {
          const lines = missing.map(m => `${m.inHospitalCode || ''}${m.materialName ? '（' + m.materialName + '）' : ''}`).join('\n');
          this.$confirm(
            `以下 ${missing.length} 个院内码在当前仓库无库存或未占用，不会带入：\n${lines}\n\n是否继续带入其余 ${available.length} 条？`,
            '部分条码无法带入',
            { type: 'warning' }
          ).then(() => applyLines()).catch(() => {});
        } else {
          applyLines();
        }
      });
    },
    mapDepotToOutboundEntry(r) {
      const m = r.material || {};
      const qty = r.qty != null ? r.qty : 1;
      const price = r.unitPrice != null ? r.unitPrice : 0;
      let amt = r.amt;
      if (amt == null && price != null) {
        amt = this.calcLineAmt(price, qty);
      }
      return {
        materialId: r.materialId,
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
        stockQty: qty,
        factoryName: m.fdFactory && m.fdFactory.factoryName,
        supplierName: r.supplier && r.supplier.name,
        material: r.material,
        refSrcAcceptanceId: String(r.orderId != null ? r.orderId : (this.refPickOrderId || '')),
        refSrcAcceptanceNo: r.orderNo || this.refPickOrderNo || '',
        refSrcOrderEntryId: r.orderEntryId != null ? String(r.orderEntryId) : '',
        refSrcBarcodeLineId: r.inhospitalcodeListId != null ? String(r.inhospitalcodeListId) : ''
      };
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
      const uid = this.$store.state.user.userId;
      this.form.createBy = uid != null && uid !== '' ? String(uid) : (this.$store.state.user.name || '');
      this.form.orderDate = this.getOrderDate();
      this.normalizeHeaderDisplayFields();
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
      const docLabel = isOutbound ? '高值出库' : '高值入库';

      getOrder(id, orderType).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.gzOrderEntryList, this, docLabel)) {
          return;
        }
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
      const docLabel = isOutbound ? '高值出库' : '高值入库';

      const validations = this.ids.map(id =>
        getOrder(id, orderType).then(res => {
          if (!assertBillHasActiveEntriesForAudit(res.data.gzOrderEntryList, this, docLabel)) {
            return Promise.reject(new Error('no active entries'));
          }
        })
      );
      Promise.all(validations).then(() => {
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
      }).catch(() => {});
    },
    /** 批量打印按钮操作（仅打印已审核单据） */
    async handleBatchPrint() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先选择要打印的数据');
        return;
      }
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const printableOrders = selectedOrders.filter(item => item.orderStatus === '2' || item.orderStatus === 2);
      if (printableOrders.length === 0) {
        this.$modal.msgWarning('仅已审核单据支持打印，请重新选择');
        return;
      }
      const skippedCount = selectedOrders.length - printableOrders.length;
      const orderNos = printableOrders.map(item => item.orderNo).join('、');
      const tip = skippedCount > 0
        ? `已选择 ${selectedOrders.length} 条，符合打印条件 ${printableOrders.length} 条（已忽略 ${skippedCount} 条未审核单据）。\n是否开始连续打印？\n单号：${orderNos}`
        : `确定连续打印选中的 ${printableOrders.length} 条单据吗？\n单号：${orderNos}`;
      try {
        await this.$modal.confirm(tip);
        for (let i = 0; i < printableOrders.length; i++) {
          this.handlePrint(printableOrders[i], true);
          if (i < printableOrders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        this.$modal.msgSuccess(`已触发连续打印，共 ${printableOrders.length} 条`);
      } catch (e) {
        // 用户取消确认时静默结束
      }
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
              entry.materialCode = material.code || entry.materialCode || "";
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
        this.normalizeHeaderDisplayFields(response.data);
        this.markDialogSnapshotSaved();
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
          this.form.gzOrderEntryList = this.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: item.supplierId || (item.supplier && item.supplier.id) || null,
            warehouseId: this.isOutbound ? this.form.warehouseId : item.warehouseId,
            departmentId: this.isOutbound ? this.form.departmentId : item.departmentId,
            billNo: this.isOutbound ? this.form.orderNo : item.billNo
          }));
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
          this.form.orderDate = this.normalizeOrderDateForApi(this.form.orderDate);
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
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              this.markDialogSnapshotSaved();
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              if (response && response.data && response.data.id) {
                this.form.id = response.data.id;
              }
              this.markDialogSnapshotSaved();
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
              this.getList();
            });
          }
        }
      });
    },
    /** 弹窗内审核按钮 */
    handleDialogAudit() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再审核');
        return;
      }
      if (this.hasDialogUnsavedChanges) {
        this.$modal.msgWarning('当前有未保存修改，请先保存后再审核');
        return;
      }
      if (this.isAuditedForm) {
        this.$modal.msgWarning('该单据已审核');
        return;
      }
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      const docLabel = isOutbound ? '高值出库' : '高值入库';
      if (!assertBillHasActiveEntriesForAudit(this.gzOrderEntryList, this, docLabel)) {
        return;
      }
      this.$modal.confirm(`确定要审核单据"${this.form.orderNo || this.form.id}"吗？`).then(() => {
        return auditOrder({ id: this.form.id, orderType: orderType });
      }).then(() => {
        this.form.orderStatus = '2';
        this.form.auditDate = new Date();
        this.markDialogSnapshotSaved();
        this.getList();
        this.$modal.msgSuccess(isOutbound ? '审核出库成功！' : '审核入库成功！');
      }).catch(() => {});
    },
    /** 弹窗内打印按钮 */
    handleDialogPrint() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再打印');
        return;
      }
      if (this.hasDialogUnsavedChanges) {
        this.$modal.msgWarning('当前有未保存修改，请先保存后再打印');
        return;
      }
      if (!this.isAuditedForm) {
        this.$modal.msgWarning('请先审核后再打印');
        return;
      }
      this.handlePrint(this.form, true);
    },
    /** 打印按钮操作：跳转到独立预览页（与普通耗材入库单一致） */
    handlePrint(row){
      if (!row || !row.id) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      const target = {
        path: '/print/gz-acceptance',
        query: {
          id: String(row.id),
          api: 'shipment',
          warehouseName: (row.warehouse && row.warehouse.name) || row.warehouseName || '',
          departmentName: (row.department && row.department.name) || row.departmentName || '',
          from: encodeURIComponent(this.$route.fullPath)
        }
      }
      const resolved = this.$router.resolve(target)
      this.$router.push(target).catch(() => {
        if (resolved && resolved.href) {
          window.location.href = resolved.href
        }
      })
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
          orderNo: row.orderNo,
          supplierName: row.supplier ? row.supplier.name : '',
          warehouseName: row.warehouse ? row.warehouse.name : '',
          orderDate: row.orderDate,
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
    /** 高值备货明细：序号 + 勾选高亮 */
    applyGzOrderDetailRowClassName({ row, rowIndex }) {
      void this.detailSelectionTick;
      row.index = rowIndex + 1;
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** @deprecated 保留兼容，请使用 applyGzOrderDetailRowClassName */
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
      if (!this.checkedGzOrderEntry || this.checkedGzOrderEntry.length === 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const selectedRows = this.checkedGzOrderEntry;
        this.gzOrderEntryList = this.gzOrderEntryList.filter(item => !selectedRows.includes(item));
        this.checkedGzOrderEntry = [];
        this.detailSelectedRowMap = {};
        this.detailSelectionTick++;
        if (this.$refs.gzOrderEntry) {
          this.$refs.gzOrderEntry.clearSelection();
        }
        this.refreshDetailSummary();
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      this.checkedGzOrderEntry = selection;
      const pageIndices = (this.gzOrderEntryList || []).map((row, idx) => idx);
      pageIndices.forEach((idx) => {
        if (this.detailSelectedRowMap[idx]) {
          this.$delete(this.detailSelectedRowMap, idx);
        }
      });
      (selection || []).forEach((row) => {
        const idx = this.gzOrderEntryList.indexOf(row);
        if (idx >= 0) {
          this.$set(this.detailSelectedRowMap, idx, true);
        }
      });
      this.detailSelectionTick++;
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = this.normalizeQueryDateTime({ ...this.queryParams });
      this.download('gz/order/export', params, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style>
/* 本页主容器：顶部与标签栏留 8px 细缝，左右 8px；纵向 flex 铺满视口 */
.app-container.gz-order-audit-page {
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

.app-container.gz-order-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.gz-order-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.gz-order-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
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
.app-container.gz-order-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.gz-order-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.gz-order-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.gz-order-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
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
.app-container.gz-order-audit-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.gz-order-audit-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.gz-order-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.gz-order-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.gz-order-audit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.gz-order-audit-page .list-query-panel,
.app-container.gz-order-audit-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.gz-order-audit-page > .form-fields-container.list-query-panel {
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

.app-container.gz-order-audit-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.gz-order-audit-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.gz-order-audit-page .apply-table-panel {
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

.app-container.gz-order-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gz-order-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .apply-pagination-wrap .pagination-container {
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

.app-container.gz-order-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.gz-order-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.gz-order-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.gz-order-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.gz-order-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.gz-order-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.gz-order-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.gz-order-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.gz-order-audit-page .apply-main-table thead th .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.gz-order-audit-page .apply-main-table th.plan-col-status .cell,
.app-container.gz-order-audit-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gz-order-audit-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.gz-order-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.gz-order-audit-page .apply-main-table th.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table th.el-table-column--selection,
.app-container.gz-order-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-audit-page .apply-main-table td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .apply-main-table th.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.gz-order-audit-page .apply-main-table th.apply-action-col,
.app-container.gz-order-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr > td,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr > td .cell,
.app-container.gz-order-audit-page .apply-detail-table .el-table__body tr > td,
.app-container.gz-order-audit-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gz-order-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.gz-order-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-audit-page .apply-main-table .el-table__header th.gutter {
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
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.gz-order-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gz-order-audit-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

/* 弹窗查询区白卡片 + 表头 inline-flex + 明细行高（对齐到货验收） */
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel.form-fields-container {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 12px 8px !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 32px;
  height: 32px;
  font-size: 13px;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 32px;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .detail-scan-form-item .el-form-item__label {
  white-space: nowrap;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-field--udi-scan.in-hospital-scan-field {
  flex: 0 0 auto !important;
  min-width: 0;
  max-width: 320px !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-field--udi-scan.in-hospital-scan-field .el-form-item {
  width: 100%;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 240px;
  max-width: none !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item {
  width: 100%;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content {
  flex: 1 1 auto !important;
  min-width: 0;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input {
  width: 100% !important;
  max-width: none !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

/* 弹窗表头控件：与到货验收一致，使用 list-page 标准高度 32px */
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-input,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-select,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-select .el-input,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-autocomplete,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-date-editor,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-date-editor.el-input {
  height: 32px !important;
  min-height: 32px !important;
  line-height: 32px !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 32px !important;
  min-height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-query-panel .el-input__icon {
  line-height: 32px !important;
  height: 32px !important;
}

.app-container.gz-order-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.app-container.gz-order-audit-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
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

/* 弹窗内旧版 form-fields-container 卡片样式不作用于 apply-modal-query-panel */
.local-modal-content .form-fields-container:not(.apply-modal-query-panel) {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
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

/* 表头输入框高度：与到货验收一致，使用 list-page 标准 32px */
.local-modal-content .modal-form-compact .el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-input__icon {
  line-height: 32px !important;
}

.local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
}

.local-modal-content .modal-form-compact .el-date-editor.el-input {
  height: 32px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 32px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 32px;
  height: 32px;
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

/* 弹窗内三块区域：与到货验收 inWarehouse/apply 一致 */
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

.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-date-editor {
  width: 100% !important;
  max-width: 100% !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row.apply-modal-row-third.el-row {
  flex-wrap: nowrap;
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
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 32px;
  height: 32px;
  font-size: 13px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 32px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-row-third .detail-scan-form-item .el-form-item__label {
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor {
  width: 150px !important;
  max-width: 150px !important;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
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
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
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

.local-modal-content .apply-modal-row-third .scan-barcode-input .el-input-group__prepend {
  padding: 0 8px;
}

.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 100%;
}

.local-modal-content .modal-detail-section .el-table .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  word-break: break-all;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell > .cell {
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .el-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  min-height: 28px !important;
}
</style>
