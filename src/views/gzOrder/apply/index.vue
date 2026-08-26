<template>
  <div class="app-container list-page gz-order-apply-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="入库单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
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
                <el-option label="未审核" value="1" />
                <el-option label="已审核" value="2" />
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
          :disabled="multiple"
          @click="handleAudit"
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
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" width="60" min-width="60" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="orderNo" width="180" min-width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" min-width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="供应商" align="center" prop="supplier.name" width="220" min-width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')" />
      <el-table-column label="制单人" align="center" width="120" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          <span>{{ getCreatorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="orderDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByOrderDate">
        <template slot-scope="scope">
          <span>{{ formatOrderDate(scope.row.orderDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" width="150" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByTotalAmt">
        <template slot-scope="scope">
          <span>{{ formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditorName">
        <template slot-scope="scope">
          <span>{{ getAuditorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByAuditDate">
        <template slot-scope="scope">
          <span>{{ formatOrderDate(scope.row.auditDate, scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" class-name="apply-action-col small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <template v-if="scope.row.orderStatus == '2' || scope.row.orderStatus == 2">
            <el-button
              size="small"
              type="text"
              @click="handlePrintBarcode(scope.row)"
            >打印条码</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
          </template>
          <template v-else>
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

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
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
                    <el-form-item label="验收单号" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse ref="formWarehouseSelect" v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" :disabled="warehouseAutoFilled || isAudited" includeWarehouseType="高值" blockDisabledForInbound disabledWarehouseMessage="该仓库已经停用，不能进行备货入库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="供应商" prop="supplerId" class="apply-modal-label-required">
                      <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0" :disabled="isAudited"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="orderDate" class="apply-modal-label-required">
                      <el-date-picker
                        clearable
                        v-model="form.orderDate"
                        type="date"
                        :disabled="true"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择制单日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input v-model="form.auditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--udi-scan udi-scan-field">
                    <el-form-item label="UDI码" prop="ztm" class="detail-scan-form-item">
                      <div class="udi-scan-inline">
                        <el-input
                          v-model="form.ztm"
                          class="udi-scan-inline-input"
                          :placeholder="form.warehouseId ? '请扫描UDI码' : '请先选择仓库'"
                          clearable
                          :disabled="!form.warehouseId || isAudited"
                          @input="onZtmInput"
                          @paste.native="onZtmPaste"
                          @keyup.enter.native="openUdiScanDialog"
                        />
                        <el-button
                          type="primary"
                          icon="el-icon-full-screen"
                          size="small"
                          :disabled="!form.warehouseId || isAudited"
                          @click="openUdiScanDialog"
                        >扫描</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="辅条码" prop="ftm">
                      <el-input
                        v-model="form.ftm"
                        placeholder="请扫描辅条码"
                        clearable
                        :disabled="isAudited"
                        @keydown.enter.native.prevent="sm2"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input :value="getTotalAmount()" :disabled="true" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        clearable
                        v-model="form.auditDate"
                        type="datetime"
                        :disabled="true"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        placeholder="请选择审核日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="isAudited" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">高值备货明细</span>
                    <template v-if="action">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId || isAudited">添加</el-button>
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry" :disabled="isAudited">删除</el-button>
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm" :disabled="isAudited">保 存</el-button>
                      <el-button type="primary" size="small" @click="handleAuditOnly" :disabled="isAudited">审 核</el-button>
                      <el-button type="primary" icon="el-icon-printer" size="small" @click="handlePrintOnly">打 印</el-button>
                      <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                      <el-button size="small" @click="cancel" :disabled="isAudited">取 消</el-button>
                    </template>
                    <el-button
                      v-if="!action"
                      type="primary"
                      icon="el-icon-printer"
                      size="small"
                      class="detail-print-barcode-btn"
                      @click="handlePrintBarcodeFromDetail"
                    >打印条码</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                <el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          class="apply-detail-table"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border
                          show-summary
                          :summary-method="getSummaries"
                          :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable fixed="left" />
                  <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="耗材名称" align="center" prop="materialName" width="150" resizable sortable :sort-method="sortByDetailMaterialName">
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="(scope.row.materialName || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.materialName }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByDetailSpeci">
                    <template slot-scope="scope">
                      {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unit">
                        {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                      </span>
                      <span v-else-if="scope.row.material">
                        {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material.unit && (typeof scope.row.material.unit === 'string' ? scope.row.material.unit : scope.row.material.unit.name)) || '--' }}
                      </span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" align="center" prop="qty" width="80" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.qty != null ? scope.row.qty : '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.qty"
                            class="gz-qty-cell-input"
                            :disabled="isAudited"
                            placeholder=""
                            @input="onQtyCellInput(scope.row, $event)"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ getTotalAmount() }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" align="center" prop="batchNumber" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.batchNumber"
                            :disabled="isAudited"
                            placeholder="批号"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" align="center" prop="beginTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.beginTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.beginTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerBeginTimeOptions"
                                          placeholder="请选择生产日期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" align="center" prop="endTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.endTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.endTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerEndTimeOptions"
                                          placeholder="请选择有效期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="主条码" align="center" prop="masterBarcode" width="240" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.masterBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.masterBarcode"
                            :disabled="isAudited"
                            placeholder="主条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.secondaryBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.secondaryBarcode"
                            :disabled="isAudited"
                            placeholder="辅条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="序列号" align="center" prop="serialNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.serialNo || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" align="center" prop="batchNo" width="260" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNo || scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.batchNo || scope.row.batchNumber || '--' }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" align="center" prop="certificateNo" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.certificateNo || (scope.row.material && scope.row.material.certificateNo) || (scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.certificateNo) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.warehouseCategoryName || (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.financeCategoryName || (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" align="center" prop="remark" width="150" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.remark || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.remark"
                            class="gz-detail-cell-input"
                            :disabled="isAudited"
                            placeholder="备注"
                          />
                        </span>
                      </el-tooltip>
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

    <!-- 打印对话框 -->
    <el-dialog :visible.sync="modalObj.show" :title="modalObj.title" :width="modalObj.width" @close="handlePrintDialogClose">
      <!-- 打印方式选择（包含布局选择） -->
      <template v-if="modalObj.component === 'print-type'">
        <el-radio-group v-model="modalObj.form.value">
          <el-radio :label="2">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 20px;">
          <el-form-item label="页面方向：">
            <el-radio-group v-model="modalObj.form.orientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </template>
      <!-- 打印预览 -->
      <template v-else-if="modalObj.component === 'window-print-preview'">
        <gz-order-print v-if="modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0" :key="`print-${modalObj.form.row.orderNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row="modalObj.form.row" :orientation="modalObj.form.orientation || 'landscape'" ref="receiptOrderPrintRef"></gz-order-print>
        <div v-else-if="modalObj.form.row" style="padding: 20px; text-align: center; color: #999;">
          <p>正在加载打印数据...</p>
        </div>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click="handlePrintDialogClose">取消</el-button>
        <el-button @click="modalObj.ok" type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>

    <!-- 3、使用组件 -->
    <SelectGZMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      :warehouseValue="form.warehouseId"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGZMaterialFilter>

    <!-- 仓库选择弹窗 -->
    <el-dialog
      title="请选择仓库"
      :visible.sync="warehouseSelectDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-select v-model="selectedWarehouseId" placeholder="请选择仓库" style="width: 100%">
        <el-option
          v-for="warehouse in availableWarehouses"
          :key="warehouse.id"
          :label="warehouse.name"
          :value="warehouse.id"
        />
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="cancelWarehouseSelect">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="handleWarehouseSelect(selectedWarehouseId)">确 定</el-button>
      </span>
    </el-dialog>

    <!-- UDI 扫描核对 -->
    <el-dialog
      title="UDI 扫描核对"
      :visible.sync="udiScanDialog.visible"
      width="96%"
      top="4vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="udi-scan-verify-dialog"
      @closed="onUdiScanDialogClosed"
    >
      <el-form label-width="88px" size="small" v-loading="udiScanDialog.loading">
        <el-form-item label="扫描结果">
          <el-input
            v-model="udiScanDialog.scanResult"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="请扫描或粘贴完整条码"
            class="udi-scan-mono"
            @input="onUdiScanResultInput"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" :loading="udiScanDialog.loading" @click="parseUdiScanDialog">解析</el-button>
        </el-form-item>
        <el-form-item label="主条码">
          <el-input
            v-model="udiScanDialog.masterBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="GTIN / 主条码，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="辅条码">
          <el-input
            v-model="udiScanDialog.secondaryBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="生产日期、批号、序列号等段，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="耗材信息" class="udi-scan-preview-form-item">
          <el-table
            :data="udiScanPreviewTableData"
            border
            size="small"
            empty-text="请点击「解析」自动检索产品；列与单据明细一致，批号/生产日期/有效期可编辑"
            class="udi-scan-preview-table"
          >
            <el-table-column label="耗材编码" align="center" prop="materialCode" width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="耗材名称" align="center" prop="materialName" width="130" show-overflow-tooltip>
              <template slot-scope="scope">{{ scope.row.materialName || '--' }}</template>
            </el-table-column>
            <el-table-column label="规格" align="center" prop="speci" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="model" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip>
              <template slot-scope="scope">
                <span v-if="scope.row.unit">
                  {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                </span>
                <span v-else-if="scope.row.material">
                  {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}
                </span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="数量" align="center" prop="qty" width="70">
              <template slot-scope="scope">{{ scope.row.qty != null ? scope.row.qty : '1' }}</template>
            </el-table-column>
            <el-table-column label="价格" align="center" prop="price" width="88">
              <template slot-scope="scope">
                {{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}
              </template>
            </el-table-column>
            <el-table-column label="金额" align="center" prop="amt" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="总金额" align="center" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="批号" align="center" prop="batchNumber" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.batchNumber" placeholder="批号" size="small" class="gz-detail-cell-input" />
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.beginTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerBeginTimeOptions"
                  placeholder="生产日期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
            <el-table-column label="有效期" align="center" prop="endTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.endTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerEndTimeOptions"
                  placeholder="有效期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <div v-if="udiScanDialog.lookupHint" class="udi-scan-hint udi-scan-hint-block">{{ udiScanDialog.lookupHint }}</div>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="udiScanDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="udiScanDialog.loading" @click="confirmUdiScanAddToEntry">添加到明细</el-button>
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
        <el-table-column prop="beforeJson" label="变更前" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.beforeJson || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="afterJson" label="变更后" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.afterJson || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, listOrderInhospitalcode, delOrder, addOrder, updateOrder, auditOrder, listEntryChangeLog } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listMaterial,jxFtm,jxTm} from "@/api/foundation/material";
import { listUserAll } from "@/api/system/user";
import { listFixedNumber } from "@/api/monitoring/fixedNumber";
import { listWarehouse } from "@/api/foundation/warehouse";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter';
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";
import { GZ_BARCODE_SESSION_KEY } from '@/views/gzOrder/apply/GzBarcodePrintPage'
import { assertBillHasEntries } from '@/utils/billEntryValidate'
import { assertWarehouseStockInboundEnabled } from '@/utils/warehouseInboundGuard'
import { checkWarehouseInboundEnabled } from '@/api/foundation/warehouse'
import RMBConverter from "@/utils/tools";
import { parseTime } from "@/utils/ruoyi";
import { normalizeUdiScanInput, parseGs1UdiScan, buildUdiQueryVariants } from '@/utils/udi';
import item from "@/layout/components/Sidebar/Item.vue";

export default {
  name: "Order",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectGZMaterialFilter,gzOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
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
        supplerId: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(), // 初始化为当前日期前5天
        endDate: this.getEndDate(), // 初始化为当前日期
      },
      // 表单参数
      form: {},
      // 用户列表
      userOptions: [],
      // 打印对话框（与入库验收页面初始化一致）
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
      // 打印条码数据（用于隐藏的打印组件）
      // 打印方向，默认横向
      printOrientation: 'landscape',
      // 仓库是否被自动填充（如果是，则禁用仓库选择）
      warehouseAutoFilled: false,
      // 仓库选择弹窗显示
      warehouseSelectDialogVisible: false,
      // 可选的仓库列表
      availableWarehouses: [],
      // 待添加的产品数据（等待选择仓库）
      pendingMaterialData: null,
      // 选中的仓库ID（用于弹窗）
      selectedWarehouseId: null,
      // 保存快照（用于判断是否有未保存修改）
      savedSnapshot: '',
      _lastSidebarNavTick: null,
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      udiScanDialog: {
        visible: false,
        loading: false,
        scanResult: '',
        masterBarcode: '',
        secondaryBarcode: '',
        previewEntry: null,
        materialRow: null,
        lookupHint: ''
      },
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        orderDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 与到货验收弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    isAudited() {
      return this.form.orderStatus == 2 || this.form.orderStatus == '2';
    },
    udiScanPreviewTableData() {
      return this.udiScanDialog.previewEntry ? [this.udiScanDialog.previewEntry] : [];
    }
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
    },
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    gzOrderEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    }
  },
  created() {
    this.setOrderTypeByRoute();
    this.getList();
    this.getUserList();
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  beforeRouteLeave(to, from, next) {
    if (this.open && this.action && this.hasUnsavedChanges()) {
      this.$confirm('当前修改尚未保存，请先保存再操作。', '提示', {
        confirmButtonText: '我知道了',
        showCancelButton: false,
        type: 'warning'
      }).then(() => next(false)).catch(() => next(false));
      return;
    }
    next();
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
    buildSnapshot() {
      const formSnapshot = {
        id: this.form.id || null,
        orderNo: this.form.orderNo || '',
        supplerId: this.form.supplerId || null,
        warehouseId: this.form.warehouseId || null,
        ztm: this.form.ztm || '',
        ftm: this.form.ftm || '',
        remark: this.form.remark || ''
      };
      const detailsSnapshot = (this.gzOrderEntryList || []).map(item => ({
        id: item.id || null,
        materialId: item.materialId || null,
        qty: item.qty || '',
        price: item.price || '',
        amt: item.amt || '',
        batchNo: item.batchNo || '',
        batchNumber: item.batchNumber || '',
        beginTime: item.beginTime || '',
        endTime: item.endTime || '',
        masterBarcode: item.masterBarcode || '',
        secondaryBarcode: item.secondaryBarcode || '',
        serialNo: item.serialNo || '',
        remark: item.remark || ''
      }));
      return JSON.stringify({ form: formSnapshot, details: detailsSnapshot });
    },
    markSnapshotSaved() {
      this.savedSnapshot = this.buildSnapshot();
    },
    hasUnsavedChanges() {
      if (!this.open || !this.action) {
        return false;
      }
      // 新增且无任何明细：允许直接关闭/取消（表头控件异步回填常与快照不一致，会误报「未保存」）
      if (!this.form.id && (!this.gzOrderEntryList || this.gzOrderEntryList.length === 0)) {
        return false;
      }
      return this.savedSnapshot !== this.buildSnapshot();
    },
    guardUnsavedThenStop() {
      if (this.hasUnsavedChanges()) {
        this.$modal.msgWarning('当前修改尚未保存，请先保存再操作。');
        return true;
      }
      return false;
    },
    handleBeforeUnload(e) {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || '101');
      if (orderType === '101') {
        return 'GZ_ORDER';
      }
      if (orderType === '102') {
        return 'GZ_SHIPMENT';
      }
      if (orderType === '103') {
        return 'GZ_REFUND_DEPOT';
      }
      if (orderType === '104') {
        return 'GZ_REFUND_GOODS';
      }
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      const billType = this.resolveBillTypeByOrderType();
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(billType, this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    normalizeHeaderDisplayFields(fallbackRow) {
      const row = fallbackRow || {};
      const currentWarehouseId = this.form.warehouseId || row.warehouseId || (row.warehouse && row.warehouse.id);
      if (currentWarehouseId) {
        this.form.warehouseId = String(currentWarehouseId);
      }
      // 始终以 createBy 解析，避免 { ...form, ...接口 } 合并后残留旧的 creatorName 与当前用户不一致
      const creatorName = this.getCreatorName(this.form);
      this.$set(this.form, 'creatorName', creatorName || (this.form.createBy != null && String(this.form.createBy).trim() !== '' ? String(this.form.createBy) : '--'));
      this.$set(this.form, 'auditorName', this.getAuditorName(this.form) || '');
    },
    /** 将 getOrder 返回的 materialList 合并到 this.gzOrderEntryList（后端明细表无耗材名称/编码等展示字段） */
    applyMaterialListToGzOrderEntries(orderData) {
      const materialList = orderData && orderData.materialList;
      const entries = this.gzOrderEntryList || [];
      if (materialList && materialList.length > 0) {
        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });
        entries.forEach(entry => {
          if (entry.materialId && materialMap[entry.materialId]) {
            const material = materialMap[entry.materialId];
            entry.material = material;
            entry.materialName = material.name || entry.materialName || '';
            entry.materialCode = material.code || entry.materialCode || '';
            entry.speci = material.speci || entry.speci || '';
            entry.model = material.model || entry.model || '';
            if (material.fdUnit && material.fdUnit.unitName) {
              entry.unit = material.fdUnit;
            } else if (material.unit) {
              entry.unit = material.unit;
            }
          }
          if (!entry.masterBarcode && entry.udiNo) {
            entry.masterBarcode = entry.udiNo;
          }
        });
      } else {
        entries.forEach(entry => {
          if (!entry.masterBarcode && entry.udiNo) {
            entry.masterBarcode = entry.udiNo;
          }
        });
      }
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
        if (column.property === 'totalAmount') {
          sums[index] = '￥' + (this.getTotalAmount() || '0.00');
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    /** 全角转半角（数字/字母/符号/空格） */
    toHalfWidth(input) {
      if (input === null || input === undefined) {
        return "";
      }
      return String(input)
        .replace(/\u3000/g, " ")
        .replace(/[\uFF01-\uFF5E]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
    },
    setOrderTypeByRoute() {
      // 备货入库页面固定为入库类型（101）
      this.queryParams.orderType = 101;
      this.isOutbound = false;
      
      // 强制转换为数字类型，确保后端能正确接收
      this.queryParams.orderType = parseInt(this.queryParams.orderType) || 101;
    },
/** 解析 UDI（扫码/粘贴已去括号，支持 01+GTIN 紧凑 GS1） */
    parseUDIString(udiString) {
      return parseGs1UdiScan(udiString);
    },
    onZtmInput() {
      const normalized = normalizeUdiScanInput(this.form.ztm);
      if (normalized !== this.form.ztm) {
        this.form.ztm = normalized;
      }
    },
    onZtmPaste() {
      this.$nextTick(() => {
        this.form.ztm = normalizeUdiScanInput(this.form.ztm);
      });
    },
    /** 打开 UDI 扫描核对窗（表头 UDI 框回车 / 扫描按钮） */
    openUdiScanDialog() {
      const wid = this.form.warehouseId;
      if (wid === null || wid === undefined || String(wid).trim() === '') {
        this.$modal.msgWarning('请先选择仓库，再扫描UDI码');
        return;
      }
      if (this.isAudited) {
        this.$modal.msgWarning('单据已审核，不能扫码入库');
        return;
      }
      this.udiScanDialog.scanResult = normalizeUdiScanInput(this.form.ztm || '');
      this.udiScanDialog.masterBarcode = '';
      this.udiScanDialog.secondaryBarcode = '';
      this.udiScanDialog.previewEntry = null;
      this.udiScanDialog.materialRow = null;
      this.udiScanDialog.lookupHint = '';
      this.udiScanDialog.visible = true;
      if (this.udiScanDialog.scanResult) {
        this.$nextTick(() => this.parseUdiScanDialog());
      }
    },
    onUdiScanDialogClosed() {
      this.udiScanDialog.loading = false;
      this.udiScanDialog.lookupHint = '';
    },
    onUdiScanResultInput() {
      this.udiScanDialog.scanResult = normalizeUdiScanInput(this.udiScanDialog.scanResult);
    },
    /** 解析条码并自动检索产品字典 */
    parseUdiScanDialog() {
      const parsed = this.reparseUdiScanDialog(true);
      if (!parsed) {
        this.udiScanDialog.previewEntry = null;
        this.udiScanDialog.materialRow = null;
        return Promise.resolve();
      }
      return this.lookupUdiScanMaterial();
    },
    reparseUdiScanDialog(showHint) {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      if (!raw) {
        this.udiScanDialog.masterBarcode = '';
        this.udiScanDialog.secondaryBarcode = '';
        if (showHint !== false) {
          this.udiScanDialog.lookupHint = '请输入或扫描完整条码后解析';
        }
        return null;
      }
      const parsed = this.parseUDIString(raw);
      if (!parsed) {
        this.udiScanDialog.lookupHint = '条码格式无法识别，请检查扫描结果或手工填写主条码';
        return null;
      }
      this.udiScanDialog.masterBarcode = parsed.udiCode || parsed.udiCodeForQuery || '';
      this.udiScanDialog.secondaryBarcode = parsed.secondaryBarcode || '';
      this.syncUdiScanPreviewFromParsed(parsed);
      if (showHint !== false) {
        this.udiScanDialog.lookupHint = '正在检索产品…';
      }
      return parsed;
    },
    buildUdiScanPreviewEntry(item, parsedUDI) {
      const priceNum = item && item.price != null ? parseFloat(item.price) : 0;
      const qty = '1';
      const amt = this.toMoneyStorage(Number.isFinite(priceNum) ? priceNum : 0);
      const batch = (parsedUDI && parsedUDI.batchNo) || '';
      return {
        materialId: item.id,
        material: item,
        materialName: item.name || '',
        materialCode: item.code || '',
        speci: item.speci || '',
        model: item.model || '',
        unit: item.unit || item.fdUnit || null,
        qty,
        price: item.price,
        amt,
        batchNo: batch,
        batchNumber: batch,
        beginTime: (parsedUDI && parsedUDI.productionDate) || '',
        endTime: (parsedUDI && parsedUDI.expiryDate) || '',
        serialNo: (parsedUDI && parsedUDI.serialNo) || ''
      };
    },
    syncUdiScanPreviewFromParsed(parsedUDI) {
      if (!parsedUDI || !this.udiScanDialog.previewEntry) {
        return;
      }
      const pe = this.udiScanDialog.previewEntry;
      if (parsedUDI.batchNo) {
        pe.batchNo = parsedUDI.batchNo;
        pe.batchNumber = parsedUDI.batchNo;
      }
      if (parsedUDI.productionDate) {
        pe.beginTime = parsedUDI.productionDate;
      }
      if (parsedUDI.expiryDate) {
        pe.endTime = parsedUDI.expiryDate;
      }
      if (parsedUDI.serialNo) {
        pe.serialNo = parsedUDI.serialNo;
      }
    },
    applyUdiScanPreviewToParsed(parsedUDI) {
      const pe = this.udiScanDialog.previewEntry;
      if (!pe || !parsedUDI) {
        return parsedUDI;
      }
      const batch = (pe.batchNumber || pe.batchNo || '').trim();
      if (batch) {
        parsedUDI.batchNo = batch;
      }
      if (pe.beginTime) {
        parsedUDI.productionDate = pe.beginTime;
      }
      if (pe.endTime) {
        parsedUDI.expiryDate = pe.endTime;
      }
      if (pe.serialNo) {
        parsedUDI.serialNo = pe.serialNo;
      }
      return parsedUDI;
    },
    buildParsedUdiFromScanDialog() {
      const raw = normalizeUdiScanInput(this.udiScanDialog.scanResult || '');
      let parsed = raw ? this.parseUDIString(raw) : null;
      if (!parsed) {
        parsed = {
          udiCode: '',
          udiCodeForQuery: '',
          secondaryBarcode: '',
          productionDate: '',
          expiryDate: '',
          batchNo: '',
          serialNo: ''
        };
      }
      const master = (this.udiScanDialog.masterBarcode || '').trim();
      const secondary = (this.udiScanDialog.secondaryBarcode || '').trim();
      if (master) {
        parsed.udiCode = master;
        if (master.startsWith('01') && master.length >= 16 && /^\d+$/.test(master)) {
          parsed.udiCodeForQuery = master.substring(2, 16);
        } else {
          parsed.udiCodeForQuery = master.replace(/\D/g, '') || master;
        }
      }
      if (secondary) {
        parsed.secondaryBarcode = secondary;
        const sec = this.parseSecondaryBarcode(secondary);
        if (sec.productionDate) {
          parsed.productionDate = sec.productionDate;
        }
        if (sec.expiryDate) {
          parsed.expiryDate = sec.expiryDate;
        }
        if (sec.batchNo) {
          parsed.batchNo = sec.batchNo;
        }
        if (sec.serialNo) {
          parsed.serialNo = sec.serialNo;
        }
      }
      return this.applyUdiScanPreviewToParsed(parsed);
    },
    queryMaterialByUdiVariants(rawInput, parsedUDI) {
      const uniqueVariants = buildUdiQueryVariants(rawInput, parsedUDI);
      const masterOnly = (this.udiScanDialog.masterBarcode || '').trim();
      if (masterOnly && !uniqueVariants.includes(masterOnly)) {
        uniqueVariants.unshift(masterOnly);
      }
      return new Promise((resolve, reject) => {
        const tryQuery = (index) => {
          if (index >= uniqueVariants.length) {
            resolve({ rows: [], variants: uniqueVariants });
            return;
          }
          listMaterial({ udiNo: uniqueVariants[index] }).then(response => {
            if (response.rows && response.rows.length > 0) {
              resolve({ rows: response.rows, variants: uniqueVariants, matchedVariant: uniqueVariants[index] });
            } else {
              tryQuery(index + 1);
            }
          }).catch(err => {
            if (index + 1 < uniqueVariants.length) {
              tryQuery(index + 1);
            } else {
              reject(err);
            }
          });
        };
        tryQuery(0);
      });
    },
    lookupUdiScanMaterial() {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      const master = (this.udiScanDialog.masterBarcode || '').trim();
      if (!raw && !master) {
        this.$modal.msgWarning('请先输入扫描结果或主条码');
        return Promise.resolve();
      }
      const parsedUDI = this.buildParsedUdiFromScanDialog();
      if (!parsedUDI.udiCodeForQuery && !master) {
        this.$modal.msgWarning('主条码无效，请核对后重试');
        return Promise.resolve();
      }
      this.udiScanDialog.loading = true;
      this.udiScanDialog.lookupHint = '正在查询产品字典…';
      return this.queryMaterialByUdiVariants(raw || master, parsedUDI).then(({ rows, variants, matchedVariant }) => {
        if (!rows || rows.length === 0) {
          this.udiScanDialog.materialRow = null;
          this.udiScanDialog.previewEntry = null;
          this.udiScanDialog.lookupHint = `未匹配到产品，已尝试：${variants.join('、')}`;
          return;
        }
        const item = rows[0];
        this.udiScanDialog.materialRow = item;
        this.udiScanDialog.previewEntry = this.buildUdiScanPreviewEntry(item, parsedUDI);
        this.udiScanDialog.lookupHint = matchedVariant
          ? `已匹配产品（查询键：${matchedVariant}），请核对条码段落后添加明细`
          : '已匹配产品，请核对条码段落后添加明细';
      }).catch(error => {
        this.udiScanDialog.materialRow = null;
        this.udiScanDialog.previewEntry = null;
        this.udiScanDialog.lookupHint = '';
        this.$modal.msgError('查询产品失败：' + (error.message || '未知错误'));
      }).finally(() => {
        this.udiScanDialog.loading = false;
      });
    },
    confirmUdiScanAddToEntry() {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      if (!raw) {
        this.$modal.msgWarning('请填写扫描结果');
        return;
      }
      if (!this.udiScanDialog.previewEntry || !this.udiScanDialog.materialRow) {
        this.$modal.msgWarning('请先点击「解析」并核对耗材信息');
        return;
      }
      const parsedUDI = this.buildParsedUdiFromScanDialog();
      if (!parsedUDI.udiCodeForQuery && !(this.udiScanDialog.masterBarcode || '').trim()) {
        this.$modal.msgWarning('主条码无效，请核对后重试');
        return;
      }
      const finishAdd = (rows) => {
        this.form.ztm = '';
        this.udiScanDialog.visible = false;
        this.processMaterialResponse({ rows }, parsedUDI);
      };
      if (this.udiScanDialog.materialRow) {
        finishAdd([this.udiScanDialog.materialRow]);
        return;
      }
      this.udiScanDialog.loading = true;
      this.queryMaterialByUdiVariants(raw, parsedUDI).then(({ rows, variants }) => {
        if (!rows || rows.length === 0) {
          this.$modal.msgWarning(`未找到匹配产品，请调整主条码后重试。已尝试：${variants.join('、')}`);
          return;
        }
        finishAdd(rows);
      }).catch(error => {
        this.$modal.msgError('查询产品失败：' + (error.message || '未知错误'));
      }).finally(() => {
        this.udiScanDialog.loading = false;
      });
    },
    /** @deprecated 请使用 openUdiScanDialog 核对后添加 */
    sm() {
      this.openUdiScanDialog();
    },
    /** 处理产品查询响应 */
    processMaterialResponse(response, parsedUDI) {
      // 获取产品的供应商ID
      const materialSupplierId = response.rows[0].supplierId || (response.rows[0].supplier && response.rows[0].supplier.id) || null;

      // 如果表单中还没有供应商，自动填充第一个产品的供应商
      if (!this.form.supplerId && materialSupplierId) {
        this.form.supplerId = materialSupplierId;
      }

      // 如果表单中已有供应商，检查是否与产品供应商一致
      if (this.form.supplerId && materialSupplierId && this.form.supplerId != materialSupplierId) {
        this.$modal.msgWarning('供应商不一致！请核对供应商。');
        return;
      }

      // 扫描 UDI 仅新增明细，不变更表头仓库
      this.addMaterialToEntryList(response.rows, parsedUDI);
    },
    /** 根据产品ID查找定数监测中该产品所在的仓库（只查询高值仓库） */
    findWarehousesByFixedNumber(materialId) {
      return new Promise((resolve, reject) => {
        try {
          const warehouseIds = [];
          
          // 先查询所有高值仓库，用于验证localStorage中的仓库ID是否为高值仓库
          listWarehouse({ warehouseType: '高值', pageNum: 1, pageSize: 1000 }).then(warehouseResponse => {
            const highValueWarehouses = warehouseResponse && warehouseResponse.rows ? warehouseResponse.rows : [];
            const highValueWarehouseIds = new Set(highValueWarehouses.map(w => String(w.id)));
            
            // 遍历localStorage，查找所有定数监测数据
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('fixedNumber_1_')) {
                try {
                  const savedData = localStorage.getItem(key);
                  if (savedData) {
                    const fixedNumberList = JSON.parse(savedData);
                    // 检查该产品是否在这个仓库的定数监测中
                    const hasMaterial = fixedNumberList.some(item => {
                      const itemMaterialId = item.materialId || (item.material && item.material.id);
                      return itemMaterialId == materialId;
                    });
                    
                    if (hasMaterial) {
                      // 提取仓库ID（从key中提取：fixedNumber_1_123 -> 123）
                      const warehouseId = key.replace('fixedNumber_1_', '');
                      // 只添加高值仓库的ID
                      if (highValueWarehouseIds.has(warehouseId)) {
                        warehouseIds.push(warehouseId);
                      }
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                  console.warn('解析定数监测数据失败:', key, e);
                }
              }
            }
            
            // 如果没有在localStorage找到，或者需要从后端查询更多数据
            if (warehouseIds.length === 0 || highValueWarehouses.length > 0) {
              // 对每个高值仓库查询定数监测
              const checkPromises = highValueWarehouses.map(warehouse => {
                return listFixedNumber({
                  warehouseId: warehouse.id,
                  fixedNumberType: '1',
                  onlyEnabled: true,
                  pageNum: 1,
                  pageSize: 1000
                }).then(fixedResponse => {
                  if (fixedResponse && fixedResponse.rows) {
                    const hasMaterial = fixedResponse.rows.some(item => {
                      const itemMaterialId = item.materialId || (item.material && item.material.id);
                      return itemMaterialId == materialId;
                    });
                    return hasMaterial ? warehouse : null;
                  }
                  return null;
                }).catch(() => null);
              });
              
              Promise.all(checkPromises).then(results => {
                const foundWarehouses = results.filter(w => w !== null);
                // 合并localStorage中找到的仓库ID和从后端查询到的仓库
                const allWarehouseIds = new Set([...warehouseIds, ...foundWarehouses.map(w => String(w.id))]);
                // 返回仓库对象列表（包含ID和名称）
                const finalWarehouses = highValueWarehouses.filter(w => allWarehouseIds.has(String(w.id)));
                resolve(finalWarehouses.map(w => w.id));
              }).catch(reject);
            } else {
              // 如果localStorage中有数据，需要查询仓库详细信息
              const warehouseDetailPromises = warehouseIds.map(id => {
                return listWarehouse({ id: id, pageNum: 1, pageSize: 1 }).then(res => {
                  if (res && res.rows && res.rows.length > 0) {
                    return res.rows[0];
                  }
                  return null;
                }).catch(() => null);
              });
              
              Promise.all(warehouseDetailPromises).then(warehouses => {
                const validWarehouses = warehouses.filter(w => w !== null && w.warehouseType === '高值');
                resolve(validWarehouses.map(w => w.id));
              }).catch(() => {
                // 如果查询失败，直接返回ID列表
                resolve(warehouseIds);
              });
            }
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    },
    /** 添加产品到明细列表 */
    addMaterialToEntryList(rows, parsedUDI) {
      if (!rows || rows.length === 0) {
        return;
      }
      const hasSecondaryBarcode = !!(parsedUDI && parsedUDI.secondaryBarcode && parsedUDI.secondaryBarcode.trim());
      // 仅按匹配结果首条新增，确保“扫描一次 UDI 只新增一条明细”
      const item = rows[0];
      const parsedBatchNo = (parsedUDI.batchNo || "").trim();

      // 仅扫描 UDI 时：同产品同批号命中则数量+1，不新增新行
      if (!hasSecondaryBarcode) {
        const existedRow = this.gzOrderEntryList.find((row) => {
          const rowBatchNo = (row.batchNo || row.batchNumber || "").trim();
          return String(row.materialId || "") === String(item.id || "") && rowBatchNo === parsedBatchNo;
        });
        if (existedRow) {
          const currentQty = Number(existedRow.qty) || 0;
          const nextQty = currentQty + 1;
          this.$set(existedRow, 'qty', String(nextQty));
          const priceNum = Number(existedRow.price) || 0;
          this.$set(existedRow, 'amt', this.calcLineAmt(nextQty, priceNum));
          // 同步主条码，确保后续展示与最近一次扫描一致
          this.$set(existedRow, 'masterBarcode', parsedUDI.udiCode || existedRow.masterBarcode || "");
          this.$set(existedRow, 'udiNo', parsedUDI.udiCodeForQuery || existedRow.udiNo || "");

          this.$nextTick(() => {
            if (this.$refs.gzOrderEntry) {
              this.$refs.gzOrderEntry.clearSelection();
              this.$refs.gzOrderEntry.toggleRowSelection(existedRow, true);
            }
            this.checkedGzOrderEntry = [existedRow];
          });
          this.form.ztm = "";
          return;
        }
      }

      let obj = {};
      obj.materialId = item.id;
      obj.material = item; // 保存完整的物料对象，方便访问嵌套属性
      obj.materialName = item.name || ""; // 保存耗材名称
      obj.materialCode = item.code || ""; // 保存耗材编码
      obj.speci = item.speci || ""; // 保存规格
      obj.model = item.model || ""; // 保存型号
      obj.unit = item.unit || item.fdUnit || null; // 保存单位
      obj.factoryName = (item.fdFactory && item.fdFactory.factoryName) || ""; // 保存生产厂家
      obj.certificateNo = item.certificateNo || (item.fdCertificate && item.fdCertificate.certificateNo) || ""; // 保存注册证号
      obj.warehouseCategoryName = (item.fdWarehouseCategory && item.fdWarehouseCategory.warehouseCategoryName) || ""; // 保存库房分类
      obj.financeCategoryName = (item.fdFinanceCategory && item.fdFinanceCategory.financeCategoryName) || ""; // 保存财务分类
      obj.qty = "1"; // 默认数量为1
      obj.price = item.price;
      obj.amt = (item.price ? this.formatAmount(item.price) : "0.00");
      // 使用解析出的数据填充字段
      obj.batchNo = parsedUDI.batchNo || "";
      obj.batchNumber = parsedUDI.batchNo || "";
      obj.beginTime = parsedUDI.productionDate || "";
      obj.endTime = parsedUDI.expiryDate || "";
      obj.serialNo = parsedUDI.serialNo || "";
      obj.remark = "";
      obj.masterBarcode = parsedUDI.udiCode; // UDI码（包含(01)前缀）
      obj.secondaryBarcode = parsedUDI.secondaryBarcode || ""; // 辅助条码（不包含(01)部分）
      obj.udiNo = parsedUDI.udiCodeForQuery || ""; // 保存UDI码（用于查询，不包含(01)前缀）
      const itemSupplierId = item.supplierId || (item.supplier && item.supplier.id) || null;
      obj.supplierId = this.form.supplerId || itemSupplierId || null;
      this.gzOrderEntryList.push(obj);

      // 主辅一起扫描可解析时：自动取消勾选；仅扫描 UDI 时：只勾选最新新增明细
      this.$nextTick(() => {
        if (this.$refs.gzOrderEntry) {
          this.$refs.gzOrderEntry.clearSelection();
          if (!hasSecondaryBarcode) {
            this.$refs.gzOrderEntry.toggleRowSelection(obj, true);
          }
        }
        this.checkedGzOrderEntry = hasSecondaryBarcode ? [] : [obj];
      });

      // 清空UDI码输入框
      this.form.ztm = "";
    },
    /** 处理仓库选择 */
    handleWarehouseSelect(warehouseId) {
      if (warehouseId && this.pendingMaterialData) {
        checkWarehouseInboundEnabled(warehouseId).then(() => {
          this.form.warehouseId = warehouseId;
          this.warehouseAutoFilled = true;
          this.addMaterialToEntryList(this.pendingMaterialData.rows, this.pendingMaterialData.parsedUDI);
          this.pendingMaterialData = null;
          this.warehouseSelectDialogVisible = false;
        }).catch((err) => {
          this.$modal.msgWarning((err && err.message) || '该仓库已经停用，不能进行备货入库');
        });
        return;
      }
      this.warehouseSelectDialogVisible = false;
    },
    /** 取消仓库选择 */
    cancelWarehouseSelect() {
      this.warehouseSelectDialogVisible = false;
      this.pendingMaterialData = null;
      this.$modal.msgWarning("未选择仓库，产品未添加");
    }
    ,sm2(){
      console.log('sm2方法被调用', {
        checkedGzOrderEntry: this.checkedGzOrderEntry,
        ftm: this.form.ftm
      });
      
      // 检查是否选择了明细
      if (!this.checkedGzOrderEntry || this.checkedGzOrderEntry.length < 1){
        this.$modal.msgWarning("请选择产品！");
        return;
      }
      
      // 检查辅助条码输入是否为空
      if (!this.form.ftm || !this.form.ftm.trim()) {
        this.$modal.msgWarning("请输入辅助条码");
        return;
      }
      
      this.form.ftm = this.toHalfWidth(this.form.ftm).trim();
      // 解析辅助条码
      const parsedSecondaryBarcode = this.parseSecondaryBarcode(this.form.ftm);
      console.log('解析结果:', parsedSecondaryBarcode);
      
      // 更新所有选中的明细行
      this.checkedGzOrderEntry.forEach(row => {
        // 使用 $set 确保 Vue 能检测到变化
        this.$set(row, 'secondaryBarcode', parsedSecondaryBarcode.secondaryBarcode || "");
        
        // 更新生产日期
        if (parsedSecondaryBarcode.productionDate) {
          this.$set(row, 'beginTime', parsedSecondaryBarcode.productionDate);
        }
        
        // 更新有效期
        if (parsedSecondaryBarcode.expiryDate) {
          this.$set(row, 'endTime', parsedSecondaryBarcode.expiryDate);
        }
        
        // 更新批号
        if (parsedSecondaryBarcode.batchNo) {
          this.$set(row, 'batchNo', parsedSecondaryBarcode.batchNo);
          this.$set(row, 'batchNumber', parsedSecondaryBarcode.batchNo);
        }
        
        // 更新序列号
        if (parsedSecondaryBarcode.serialNo) {
          this.$set(row, 'serialNo', parsedSecondaryBarcode.serialNo);
        }
      });
      
      // 强制更新表格
      this.$nextTick(() => {
        if (this.$refs.gzOrderEntry) {
          this.$refs.gzOrderEntry.doLayout();
        }
      });
      
      // 清空辅助条码输入框
      this.form.ftm = "";
      
      // 提示成功
      this.$modal.msgSuccess("辅助条码维护成功");
    },
    /** 解析辅助条码字符串 */
    parseSecondaryBarcode(secondaryBarcodeString) {
      if (!secondaryBarcodeString || typeof secondaryBarcodeString !== 'string') {
        return {
          secondaryBarcode: '',
          productionDate: '',
          expiryDate: '',
          batchNo: '',
          serialNo: ''
        };
      }
      
      secondaryBarcodeString = this.toHalfWidth(secondaryBarcodeString).trim();
      const result = {
        secondaryBarcode: secondaryBarcodeString, // 完整的辅助条码字符串
        productionDate: '',   // (11)后面的生产日期
        expiryDate: '',       // (17)后面的有效期
        batchNo: '',          // (10)后面的批号
        serialNo: ''          // (21)后面的序列号
      };
      
      // 提取(11)生产日期，格式：(11)230515 -> 2023-05-15
      const prodMatch = secondaryBarcodeString.match(/\(11\)(\d{6})/);
      if (prodMatch) {
        const dateStr = prodMatch[1];
        const year = '20' + dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const day = dateStr.substring(4, 6);
        result.productionDate = `${year}-${month}-${day}`;
      }
      
      // 提取(17)有效期，格式：(17)251230 -> 2025-12-30
      const expMatch = secondaryBarcodeString.match(/\(17\)(\d{6})/);
      if (expMatch) {
        const dateStr = expMatch[1];
        const year = '20' + dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const day = dateStr.substring(4, 6);
        result.expiryDate = `${year}-${month}-${day}`;
      }
      
      // 提取(10)批号
      const batchMatch = secondaryBarcodeString.match(/\(10\)([^\(]+)/);
      if (batchMatch) {
        result.batchNo = batchMatch[1].trim();
      }
      
      // 提取(21)序列号
      const serialMatch = secondaryBarcodeString.match(/\(21\)([^\(]+)/);
      if (serialMatch) {
        result.serialNo = serialMatch[1].trim();
      }
      
      return result;
    }
    ,getList() {
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
      
      const query = { ...this.queryParams };
      const params = this.normalizeQueryDateTime(query);
      listOrder(params).then(response => {
        console.log('查询响应:', response);
        this.orderList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        console.log('查询结果数量:', this.orderList.length, '总条数:', this.total);
        // 调试：打印总金额信息
        if (this.orderList && this.orderList.length > 0) {
          console.log('查询结果中的总金额:', this.orderList.map(row => ({
            orderNo: row.orderNo,
            totalAmt: row.totalAmt
          })));
        } else if (this.total > 0) {
          console.warn('警告：总条数为', this.total, '但rows为空数组，可能是分页参数问题');
          console.warn('完整响应:', JSON.stringify(response, null, 2));
        }
        // 强制更新表格
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
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
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
        obj.materialId = item.id;
        obj.material = item; // 保存完整的物料对象，方便访问嵌套属性
        obj.materialName = item.name || ""; // 保存耗材名称
        obj.materialCode = item.code || ""; // 保存耗材编码
        obj.speci = item.speci || ""; // 保存规格
        obj.model = item.model || ""; // 保存型号
        obj.unit = item.unit || item.fdUnit || null; // 保存单位
        obj.factoryName = (item.fdFactory && item.fdFactory.factoryName) || ""; // 保存生产厂家
        obj.warehouseCategoryName = (item.fdWarehouseCategory && item.fdWarehouseCategory.warehouseCategoryName) || ""; // 保存库房分类
        obj.financeCategoryName = (item.fdFinanceCategory && item.fdFinanceCategory.financeCategoryName) || ""; // 保存财务分类
        obj.qty = "1"; // 默认数量为1
        // 设置价格：优先使用item.price
        obj.price = item.price || 0;
        // 自动计算金额：数量 * 价格
        obj.amt = (obj.qty && obj.price) ? this.calcLineAmt(obj.qty, obj.price) : "0.00";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.serialNo = "";
        obj.remark = "";
        obj.masterBarcode = item.udiNo || ""; // UDI码赋值给masterBarcode字段用于显示
        obj.secondaryBarcode = "";
        obj.udiNo = item.udiNo || ""; // 保存UDI码
        obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || null;
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
      if (this.guardUnsavedThenStop()) {
        return;
      }
      this.open = false;
      this.reset();
      // 重置仓库自动填充状态
      this.warehouseAutoFilled = false;
      this.pendingMaterialData = null;
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        orderNo: null,
        supplerId: null,
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        auditBy: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null

      };
      this.gzOrderEntryList = [];
      this.resetForm("form");
      this.markSnapshotSaved();
      // 重置仓库自动填充状态
      this.warehouseAutoFilled = false;
      this.pendingMaterialData = null;
    },
    /** 数量列仅允许数字（替代原原生 onkeyup 过滤） */
    onQtyCellInput(row, val) {
      const digits = String(val != null ? val : '').replace(/\D/g, '');
      if (String(row.qty) !== digits) {
        row.qty = digits;
      }
      this.qtyChange(row);
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
      this.queryParams.orderNo = null;
      this.queryParams.supplerId = null;
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
      // 返回当前日期前5天的日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5); // 减去5天
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year.toString() + "-" + month + "-" + day + " 00:00:00";
      return statDate;
    },
    getEndDate(){
      // 返回当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year.toString() + "-" + month + "-" + day + " 23:59:59";
      return endDate;
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
      getOrder(id).then(response => {
        this.form = response.data;
        delete this.form.creatorName;
        delete this.form.auditorName;
        this.normalizeHeaderDisplayFields(row);
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        this.applyMaterialListToGzOrderEntries(response.data);
        this.markSnapshotSaved();
        this.open = true;
        this.action = false;
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.title = "查看高值备货入库";
      });
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 根据用户ID或登录名解析展示姓名（与后端 createBy/auditBy/updateBy 存储一致） */
    resolveSysUserDisplayName(rawKey) {
      if (rawKey === null || rawKey === undefined || rawKey === '') {
        return '';
      }
      const key = String(rawKey).trim();
      const list = this.userOptions || [];
      // 后端存的是用户ID（纯数字）时必须先按 userId 匹配，否则 userName 与数字串相同会误命中他人（保存后制单人错）
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
    /** 获取制单人姓名 */
    getCreatorName(row) {
      if (!row || !row.createBy) {
        return '';
      }
      return this.resolveSysUserDisplayName(row.createBy);
    },
    /** 获取审核人姓名（优先 audit_by，兼容历史数据 update_by） */
    getAuditorName(row) {
      if (!row) {
        return '';
      }
      const auditKey =
        row.auditBy != null && String(row.auditBy).trim() !== '' ? row.auditBy : row.updateBy;
      if (!auditKey) {
        return '';
      }
      return this.resolveSysUserDisplayName(auditKey);
    },
    /** 格式化日期，如果时分秒是00:00:00则使用createTime或updateTime的时分秒 */
    formatOrderDate(dateStr, timeStr) {
      // 列表场景优先显示 createTime / updateTime，确保到时分秒
      if (timeStr) {
        const fullTime = parseTime(timeStr, '{y}-{m}-{d} {h}:{i}:{s}');
        if (fullTime) {
          return fullTime;
        }
      }
      if (dateStr) {
        return parseTime(dateStr, '{y}-{m}-{d} {h}:{i}:{s}') || '--';
      }
      return '--';
    },
    /** 格式化总金额 */
    formatTotalAmt(row) {
      // 优先使用后端返回的totalAmt字段
      if (row.totalAmt !== undefined && row.totalAmt !== null && row.totalAmt !== '') {
        return this.formatAmount(row.totalAmt);
      }
      // 如果订单有明细列表，计算明细总金额
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        let total = 0;
        row.gzOrderEntryList.forEach(entry => {
          const amt = parseFloat(entry.amt || 0);
          total += amt;
        });
        return this.formatAmount(total);
      }
      return '0.00';
    },
    /** 从明细表格打印条码按钮操作 */
    handlePrintBarcodeFromDetail() {
      // 复用打印条码功能，使用当前表单数据
      if (!this.form.id) {
        this.$modal.msgWarning("请先保存订单后再打印条码");
        return;
      }
      const row = { id: this.form.id };
      this.handlePrintBarcode(row);
    },
    /** 打印对话框关闭处理 */
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
    /** 打印：跳转独立预览页（高值备货验收，与普通耗材入库单预览方式一致） */
    handlePrint(row) {
      if (!row || !row.id) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      const target = {
        path: '/print/gz-acceptance',
        query: {
          id: String(row.id),
          api: 'order',
          warehouseName: (row.warehouse && row.warehouse.name) || row.warehouseName || '',
          supplierName: (row.supplier && row.supplier.name) || row.supplierName || '',
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
    //组装打印信息
    getOrderDetail(row) {
      //查询详情
      return getOrder(row.id).then(response => {
        const details = response.data.gzOrderEntryList;
        const materiaDetails = response.data.materialList;
        const map = {};

        (materiaDetails || []).forEach(it => {
          map[it.id] = it;
        });

        let detailList = [], totalAmt = 0, totalQty = 0;

        details && details.forEach(item => {
          totalAmt += parseFloat(item.amt || 0);
          totalQty += parseFloat(item.qty || 0);

          const prod = map[item.materialId];

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
          });
        });

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
        };
      });
    },
    /** 按单据明细行解析院内码，避免同批号+物料跨单混用 */
    resolveInHospitalCodesForEntry(entry, qty, orderCodeRows, inventoryList, orderData) {
      const entryId = entry && entry.id != null ? String(entry.id) : '';
      const limit = qty > 0 ? qty : 0;
      const fromCodeRows = (orderCodeRows || [])
        .filter(row => row && row.inHospitalCode && entryId && String(row.detailId) === entryId)
        .map(row => String(row.inHospitalCode).trim())
        .filter(Boolean);
      if (fromCodeRows.length > 0) {
        return fromCodeRows.slice(0, limit);
      }

      const batchNo = entry.batchNo || entry.batchNumber;
      const materialId = entry.materialId;
      const fromInventory = (inventoryList || [])
        .filter(inv => {
          if (!inv || !inv.inHospitalCode) return false;
          if (entryId && inv.orderEntryId != null && String(inv.orderEntryId) === entryId) return true;
          const sameOrder = (orderData && orderData.id != null && inv.orderId != null && String(inv.orderId) === String(orderData.id))
            || (orderData && orderData.orderNo && inv.orderNo && String(inv.orderNo) === String(orderData.orderNo));
          if (!sameOrder) return false;
          return inv.materialId === materialId && (inv.batchNo || inv.batchNumber) === batchNo;
        })
        .map(inv => String(inv.inHospitalCode).trim())
        .filter(Boolean);
      return fromInventory.slice(0, limit);
    },
    /** 打印条码按钮操作（不依赖备货库存数量：含 qty=0 的库存行 + 审核生成的院内码明细表兜底） */
    handlePrintBarcode(row) {
      const id = row.id;
      const loading = this.$loading({
        lock: true,
        text: '正在准备打印数据...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      getOrder(id).then(response => {
        const orderData = response.data;
        const entryList = orderData.gzOrderEntryList || [];
        const materialList = orderData.materialList || [];
        const warehouseId = orderData.warehouseId;

        if (entryList.length === 0) {
          loading.close();
          this.$modal.msgWarning("该订单没有明细数据，无法打印条码");
          return;
        }

        if (!warehouseId) {
          loading.close();
          this.$modal.msgWarning("该订单没有仓库信息，无法打印条码");
          return;
        }

        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });

        const batchNos = entryList.map(item => item.batchNo || item.batchNumber).filter(bn => bn);
        const materialIds = entryList.map(item => item.materialId).filter(mid => mid);
        
        const queryParams = {
          warehouseId: warehouseId,
          orderId: id,
          orderNo: orderData.orderNo,
          includeZeroQty: true,
          pageNum: 1,
          pageSize: 10000
        };

        const loadInventory = () =>
          listDepotInventory(queryParams).then(invResponse => invResponse.rows || []);

        const loadOrderCodeRows = () =>
          listOrderInhospitalcode(id).then(codeRes => {
            const d = codeRes.data;
            return Array.isArray(d) ? d : [];
          });

        return Promise.all([loadInventory(), loadOrderCodeRows()]).then(([inventoryList, orderCodeRows]) => {
          console.log('查询到的库存记录数:', inventoryList.length);
          console.log('订单院内码明细数:', (orderCodeRows || []).length);
          console.log('订单明细中的批次号列表:', batchNos);
          console.log('订单明细中的物料ID列表:', materialIds);

          const allBarcodesToPrint = [];
          entryList.forEach((item) => {
            const material = materialMap[item.materialId] || {};
            const batchNo = item.batchNo || item.batchNumber;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;

            if (!batchNo) {
              this.$modal.msgWarning(`物料 ${item.materialName || material.name || materialId} 没有批次号，无法打印条码`);
              return;
            }

            if (!materialId) {
              this.$modal.msgWarning(`批次号 ${batchNo} 没有物料ID，无法打印条码`);
              return;
            }

            const codesToPrint = this.resolveInHospitalCodesForEntry(item, qty, orderCodeRows, inventoryList, orderData);

            if (codesToPrint.length === 0) {
              this.$modal.msgWarning(`批次号 ${batchNo} 没有找到院内码，无法打印条码`);
              return;
            }

            codesToPrint.forEach((inHospitalCode) => {
              allBarcodesToPrint.push({
                inHospitalCode: inHospitalCode,
                materialName: item.materialName || material.name || '',
                batchNumber: item.batchNumber || '',
                price: item.price ? this.formatAmount(item.price) : '',
                endTime: item.endTime || '',
                speci: material.speci || '',
                factoryName: (material.fdFactory && material.fdFactory.factoryName) ? material.fdFactory.factoryName : ''
              });
            });
          });

          if (allBarcodesToPrint.length === 0) {
            loading.close();
            this.$modal.msgWarning("没有找到可打印的条码");
            return;
          }

          loading.close();
          try {
            sessionStorage.setItem(GZ_BARCODE_SESSION_KEY, JSON.stringify({ list: allBarcodesToPrint }))
          } catch (e) {
            this.$modal.msgError('条码数据过大或浏览器禁止存储，无法打开预览')
            return
          }
          const target = {
            path: '/print/gz-barcode',
            query: { from: encodeURIComponent(this.$route.fullPath) }
          }
          const resolved = this.$router.resolve(target)
          this.$router.push(target).catch(() => {
            if (resolved && resolved.href) {
              window.location.href = resolved.href
            }
          })
        }).catch(() => {
          loading.close();
          this.$modal.msgError("查询条码数据失败");
        });
      }).catch(() => {
        loading.close();
        this.$modal.msgError("获取订单信息失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加高值备货入库";
      this.form.orderStatus = '1';
      this.form.orderType = '101';
      // 与后端一致存用户ID；制单人展示用当前登录昵称
      const uid = this.$store.getters.userId;
      this.form.createBy = uid != null && uid !== '' ? String(uid) : (this.$store.state.user.name || '');
      this.form.creatorName = this.$store.getters.nickName || this.$store.state.user.name || '--';
      this.form.orderDate = this.getOrderDate();
      this.action = true;
      // reset() 内已打过快照，但默认值与明细子组件（仓库/供应商等）会在下一帧写入表头，
      // 若仍用旧快照会导致「未保存」误报；在 DOM 更新后再对齐一次基准快照。
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.markSnapshotSaved();
        });
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        delete this.form.creatorName;
        delete this.form.auditorName;
        this.normalizeHeaderDisplayFields(row);
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        this.applyMaterialListToGzOrderEntries(response.data);
        this.markSnapshotSaved();
        this.open = true;
        this.title = "修改高值入库";
        this.action = true;
      });
    },
    handleAuditOnly() {
      if (this.guardUnsavedThenStop()) {
        return;
      }
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存后再审核');
        return;
      }
      if (this.form.orderStatus == 2 || this.form.orderStatus == '2') {
        this.$modal.msgSuccess('当前单据已审核');
        return;
      }
      auditOrder({ id: this.form.id, orderType: 101 }).then(() => {
        this.$modal.msgSuccess('审核成功');
        return getOrder(this.form.id, 101);
      }).then((response) => {
        if (response && response.data) {
          this.form = { ...this.form, ...response.data };
          delete this.form.creatorName;
          delete this.form.auditorName;
          this.normalizeHeaderDisplayFields(this.form);
        } else {
          this.form.orderStatus = '2';
        }
        this.markSnapshotSaved();
        this.getList();
      });
    },
    handlePrintOnly() {
      if (this.guardUnsavedThenStop()) {
        return;
      }
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存后再打印');
        return;
      }
      if (!(this.form.orderStatus == 2 || this.form.orderStatus == '2')) {
        this.$modal.msgWarning('请先审核后再打印');
        return;
      }
      this.handlePrint(this.form);
    },
    /** 提交按钮 */
    submitForm() {
      // 检查仓库是否已选择
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请选择仓库");
        return;
      }
      
      // 检查供应商是否已选择
      if (!this.form.supplerId) {
        this.$modal.msgWarning("请选择供应商");
        return;
      }

      assertWarehouseStockInboundEnabled(this.form.warehouseId, this).then((ok) => {
        if (!ok) {
          return;
        }
        this.continueSubmitForm();
      });
    },
    continueSubmitForm() {
      
      // 检查所有明细项的供应商是否一致
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.gzOrderEntryList.length; i++) {
          const entry = this.gzOrderEntryList[i];
          const materialSupplierId = entry.material && (entry.material.supplierId || (entry.material.supplier && entry.material.supplier.id));
          if (materialSupplierId && this.form.supplerId != materialSupplierId) {
            this.$modal.msgWarning(`第${i + 1}行的产品供应商与表单供应商不一致，请核对！`);
            return;
          }
        }
      }
      
      // 检查辅助条码是否为空
      const emptySecondaryBarcodeItems = [];
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.gzOrderEntryList.length; i++) {
          const item = this.gzOrderEntryList[i];
          if (!item.secondaryBarcode || item.secondaryBarcode.trim() === '') {
            emptySecondaryBarcodeItems.push({
              index: i + 1,
              materialName: item.materialName || '未知耗材'
            });
          }
        }
      }
      
      // 如果有空的辅助条码，提示用户
      if (emptySecondaryBarcodeItems.length > 0) {
        const materialNames = emptySecondaryBarcodeItems.map(item => `第${item.index}行：${item.materialName}`).join('\n');
        this.$confirm(
          `以下明细的辅助条码未维护：\n${materialNames}\n\n未维护辅助条码是否继续？`,
          '提示',
          {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: false
          }
        ).then(() => {
          // 用户点击继续，执行保存
          this.doSubmit();
        }).catch(() => {
          // 用户点击取消，不执行任何操作
        });
        return;
      }
      
      // 如果没有空的辅助条码，直接保存
      this.doSubmit();
    },
    /** 执行保存操作 */
    doSubmit() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!assertBillHasEntries(this.gzOrderEntryList, this, '请至少添加一条明细')) {
            return;
          }
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          this.form.gzOrderEntryList = this.form.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null
          }));
          if (this.form.id != null) {
            const updatePayload = { ...this.form };
            delete updatePayload.createBy;
            delete updatePayload.createTime;
            delete updatePayload.creatorName;
            delete updatePayload.auditorName;
            updateOrder(updatePayload).then(response => {
              this.$modal.msgSuccess("保存成功");
              return getOrder(this.form.id, 101);
            }).then((detailResp) => {
              if (detailResp && detailResp.data) {
                this.form = { ...this.form, ...detailResp.data };
                delete this.form.creatorName;
                delete this.form.auditorName;
                this.gzOrderEntryList = detailResp.data.gzOrderEntryList || this.gzOrderEntryList;
                this.applyMaterialListToGzOrderEntries(detailResp.data);
                this.normalizeHeaderDisplayFields(this.form);
              }
              this.markSnapshotSaved();
              // 保存后不关闭页面，继续操作
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("保存成功");
              // 保存后不关闭页面，继续操作
              // 更新表单ID，以便后续修改
              const maybeId = response && response.data
                ? (typeof response.data === 'object' ? response.data.id : response.data)
                : null;
              if (maybeId !== null && maybeId !== undefined && maybeId !== '') {
                this.form.id = maybeId;
                return getOrder(this.form.id, 101);
              }
              // 后端若未返回主键ID，避免请求 /gz/order/undefined
              return null;
            }).then((detailResp) => {
              if (detailResp && detailResp.data) {
                this.form = { ...this.form, ...detailResp.data };
                delete this.form.creatorName;
                delete this.form.auditorName;
                this.gzOrderEntryList = detailResp.data.gzOrderEntryList || this.gzOrderEntryList;
                this.applyMaterialListToGzOrderEntries(detailResp.data);
                this.normalizeHeaderDisplayFields(this.form);
              }
              this.markSnapshotSaved();
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除高值入库编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据项");
        return;
      }
      // 检查选中的订单是否都是未审核状态
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '1' && item.orderStatus !== 1);
      
      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核未审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }
      
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$modal.confirm('确定要审核选中的 ' + ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = ids.map(id => auditOrder({id: id}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    /** 批量打印按钮操作（仅支持已审核单据） */
    async handleBatchPrint() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要打印的数据项");
        return;
      }
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const printableOrders = selectedOrders.filter(item => item.orderStatus === '2' || item.orderStatus === 2);
      if (printableOrders.length === 0) {
        this.$modal.msgWarning("仅已审核单据支持打印，请重新选择");
        return;
      }
      const skippedCount = selectedOrders.length - printableOrders.length;
      const orderNos = printableOrders.map(item => item.orderNo).join('、');
      const confirmText = skippedCount > 0
        ? `已选择 ${selectedOrders.length} 条，符合打印条件 ${printableOrders.length} 条（已忽略 ${skippedCount} 条未审核单据）。\n是否开始连续打印？\n单号：${orderNos}`
        : `确定连续打印选中的 ${printableOrders.length} 个订单吗？\n单号：${orderNos}`;
      try {
        await this.$modal.confirm(confirmText);
        for (let i = 0; i < printableOrders.length; i++) {
          this.handlePrint(printableOrders[i]);
          if (i < printableOrders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        this.$modal.msgSuccess(`已触发连续打印，共 ${printableOrders.length} 条`);
      } catch (e) {
        // 用户取消确认时不提示错误
      }
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
      if (!this.checkedGzOrderEntry || this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        // 获取选中行的集合
        const selectedRows = this.checkedGzOrderEntry;
        this.gzOrderEntryList = this.gzOrderEntryList.filter(item => {
          return !selectedRows.includes(item);
        });
        // 清空选中状态
        this.checkedGzOrderEntry = [];
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      // 存储选中的行对象，而不是索引
      this.checkedGzOrderEntry = selection;
    },
    /** 导出按钮操作 */
    handleExport() {
      const query = { ...this.queryParams };
      const params = this.normalizeQueryDateTime(query);
      this.download('gz/order/export', {
        ...params
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
@import '../../caigou/jihua/styles/plan-modal-common.scss';

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
  padding: 6px 8px;
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
  min-height: 0;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 弹窗内顶部字段区：与到货验收 inWarehouse/audit 一致（apply-modal-query-panel 由 plan-modal 白卡片样式接管） */
.local-modal-content .form-fields-container:not(.apply-modal-query-panel) {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 弹窗内明细区 */
.local-modal-content .modal-detail-section {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
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

.local-modal-content .modal-detail-section .detail-toolbar-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.local-modal-content .modal-detail-section .detail-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  flex: 1;
  min-width: 0;
}

.local-modal-content .modal-detail-section .detail-toolbar-title {
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .detail-print-barcode-btn {
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
  overflow-x: hidden;
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
.gz-order-apply-page {
  position: relative;
}

/* 搜索区域：与到货验收 inWarehouse-audit-page 完全一致 */
.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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

/* 第二行单据状态对齐到仓库位置 */
.list-query-panel .el-form .query-row-second {
  position: relative;
}

/* 第二行“单据状态”列：与到货验收页面保持同一水平对齐 */
.list-query-panel .el-form .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
}

/* 确保日期区间在同一行 */
.list-query-panel .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.list-query-panel .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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

/* 弹窗内明细表：表头、表体滚动、表尾与到货验收一致 */
::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

/* 明细表体：字号/字体与表体一致，单行省略（过长悬停由 el-tooltip 展示全文） */
::v-deep .local-modal-content .modal-detail-section .el-table td .cell {
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table-column--selection .cell {
  overflow: visible;
  text-overflow: clip;
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
  overflow-x: hidden !important;
  overflow-y: visible !important;
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

/* 列表主表（勿作用到弹窗内表） */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 明细弹窗内：无框输入/日期，默认透明居中，聚焦内阴影主色；单行 + 省略与表体一致 */
::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-line-clip {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input.el-input {
  width: 100%;
  max-width: 76px;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor .gz-qty-cell-input.el-input {
  max-width: 100%;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input.el-input {
  width: 100%;
  max-width: 100%;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input .el-input__inner,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input .el-input__inner {
  border: none;
  background-color: transparent;
  text-align: center;
  padding: 0 4px;
  height: 28px;
  line-height: 28px;
  font-size: inherit;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input .el-input__inner:focus,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input .el-input__inner:focus {
  outline: none;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #409eff;
  border-radius: 2px;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input.is-disabled .el-input__inner,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input.is-disabled .el-input__inner {
  border: none;
  background: transparent;
  color: #606266;
  cursor: default;
  box-shadow: none;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor.el-input {
  width: 100%;
  max-width: 130px;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor .el-input__inner {
  border: none;
  background-color: transparent;
  text-align: center;
  padding-left: 8px;
  padding-right: 28px;
  height: 28px;
  line-height: 28px;
  font-size: inherit;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 只读日期框在部分浏览器会画出文本插入光标，表现为数字前一条黑竖线 */
  caret-color: transparent;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor .el-input__inner:focus {
  outline: none;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #409eff;
  border-radius: 2px;
  caret-color: transparent;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.is-disabled.el-date-editor .el-input__inner {
  border: none;
  background: transparent;
  color: #606266;
  cursor: default;
  box-shadow: none;
  caret-color: transparent;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor .gz-detail-cell-date.el-date-editor.el-input {
  max-width: 100%;
}

::v-deep .json-cell {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
  white-space: normal;
}

.udi-scan-inline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  max-width: 520px;
}

.udi-scan-inline-input {
  flex: 1;
  min-width: 0;
}

.udi-scan-mono ::v-deep textarea {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.45;
  word-break: break-all;
}

.udi-scan-hint {
  margin: -8px 0 0 88px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.udi-scan-hint-block {
  margin: 0 0 8px 0;
}

.udi-scan-preview-table {
  width: 100%;
}

::v-deep .udi-scan-verify-dialog .el-dialog__body {
  padding-top: 12px;
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

<style>
/* 本页主容器：顶部与标签栏留 8px 细缝，左右 8px；纵向 flex 铺满视口 */
.app-container.gz-order-apply-page {
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

.app-container.gz-order-apply-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.gz-order-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.gz-order-apply-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
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
.app-container.gz-order-apply-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.gz-order-apply-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.gz-order-apply-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.gz-order-apply-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
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
.app-container.gz-order-apply-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.gz-order-apply-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.gz-order-apply-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.gz-order-apply-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.gz-order-apply-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.gz-order-apply-page .list-query-panel,
.app-container.gz-order-apply-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.gz-order-apply-page > .form-fields-container.list-query-panel {
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

.app-container.gz-order-apply-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.gz-order-apply-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.gz-order-apply-page .apply-table-panel {
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

.app-container.gz-order-apply-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gz-order-apply-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .apply-pagination-wrap .pagination-container {
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

.app-container.gz-order-apply-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.gz-order-apply-page .apply-main-table .el-table__header-wrapper th,
.app-container.gz-order-apply-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.gz-order-apply-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.gz-order-apply-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.gz-order-apply-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.gz-order-apply-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.gz-order-apply-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.gz-order-apply-page .apply-main-table thead th .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.gz-order-apply-page .apply-main-table th.plan-col-status .cell,
.app-container.gz-order-apply-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gz-order-apply-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.gz-order-apply-page .apply-main-table.el-table {
  position: relative;
}

.app-container.gz-order-apply-page .apply-main-table th.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table th.el-table-column--selection,
.app-container.gz-order-apply-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-apply-page .apply-main-table td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .apply-main-table th.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.gz-order-apply-page .apply-main-table th.apply-action-col,
.app-container.gz-order-apply-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gz-order-apply-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr > td,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr > td .cell,
.app-container.gz-order-apply-page .apply-detail-table .el-table__body tr > td,
.app-container.gz-order-apply-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr:hover > td,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gz-order-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.gz-order-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gz-order-apply-page .apply-main-table .el-table__header th.gutter {
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
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.gz-order-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gz-order-apply-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

/* 弹窗查询区白卡片 + 表头 inline-flex + 明细行高（对齐到货验收） */
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel.form-fields-container {
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

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .detail-scan-form-item .el-form-item__label {
  white-space: nowrap;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 240px;
  max-width: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item {
  width: 100%;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 28px !important;
  min-height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-qty-cell-input .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-detail-cell-input .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-detail-cell-date .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  min-height: 28px !important;
}

</style>
