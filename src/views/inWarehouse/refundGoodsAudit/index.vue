<template>
  <div class="app-container list-page inWarehouse-refundGoodsAudit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="退货单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplerId"/>
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
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['inWarehouse:refundGoodsApply:audit']"
        >审核</el-button>
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
      <el-table-column label="退货单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')"/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')"/>
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
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
      <el-table-column label="引用单号" align="center" prop="refBillNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="被引用" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['inWarehouse:refundGoodsApply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['inWarehouse:refundGoodsApply:remove']"
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
              v-hasPermi="['inWarehouse:refundGoodsApply:query']"
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

    <!-- 添加或修改退货对话框 -->
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
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="供应商" prop="supplerId" class="form-item-header-supplier apply-modal-label-required">
              <el-input
                :value="supplierHeaderDisplayName"
                disabled
                :title="supplierHeaderDisplayName"
                class="header-field-supplier-readonly"
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
              <SelectWarehouse v-model="form.warehouseId" :value2="true" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="总金额" prop="totalAmount" class="apply-modal-label-required">
              <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" :disabled="true" placeholder="发票号" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="制单人">
              <el-input
                :value="(form.creater && (form.creater.nickName || form.creater.userName)) || form.createrName || '--'"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--date">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              style="width: 100%"
                              placeholder="发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--compact">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" :disabled="true" placeholder="配送员" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" :disabled="true" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" :disabled="true" placeholder="发票金额" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
          <el-col :span="7">
            <el-form-item label="退货原因" prop="returnReason" label-width="92px" class="return-reason-form-item">
              <el-input v-model="form.returnReason" placeholder="退货原因" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="17">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable disabled />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">退货明细信息</span>
            <template v-if="action">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                icon="el-icon-plus"
                @click="checkMaterialBtn"
                :disabled="!form.warehouseId"
              >添加</el-button>
              <el-button
                type="danger"
                size="small"
                icon="el-icon-delete"
                @click="handleDeleteStkIoBillEntry"
              >删除</el-button>
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                icon="el-icon-check"
                @click="submitForm"
              >保 存</el-button>
            </template>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="applyDetailRowClassName"
                  class="apply-detail-table"
                  show-summary :summary-method="getSummariesWithRefresh"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
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
            width="120"
            min-width="100"
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
          <el-table-column label="单位" align="center" width="80" min-width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="center" prop="unitPrice" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="数量"
                size="small"
                class="detail-cell-fluid-input"
                onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                @blur="form.result=$event.target.value"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" :disabled="true" placeholder="批号" size="small" class="detail-cell-fluid-input" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="128" min-width="128" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              size="small"
                              class="detail-cell-fluid-input"
                              placeholder="生产日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="endTime" width="128" min-width="128" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              size="small"
                              class="detail-cell-fluid-input"
                              placeholder="有效期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column
            label="批次号"
            align="center"
            prop="batchNo"
            width="200"
            min-width="160"
            :show-overflow-tooltip="false"
            class-name="detail-col-batch-no"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span class="detail-batch-no-cell" :title="scope.row.batchNo || ''">{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" align="center" prop="srcRefedQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="可引用" align="center" prop="srcRefableQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="true" placeholder="备注" size="small" class="detail-cell-fluid-input" />
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="生产厂家"
            align="left"
            header-align="center"
            width="180"
            min-width="150"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--'"
              >{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material && scope.row.material.isWay"/>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
        </el-form>
        <SelectInventory
          :nested="true"
          v-show="DialogComponentShow"
          :DialogComponentShow="DialogComponentShow"
          :warehouseValue="warehouseValue"
          :supplierValue="supplierValue"
          :hide-supplier-query="true"
          modal-title="TH-添加明细"
          @closeDialog="closeDialog"
          @selectData="selectData"
        />
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
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <!--          <el-radio :label=" 1 ">lodop打印</el-radio>-->
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 10px;">
          <span style="margin-right: 10px;">纸张</span>
          <el-radio-group v-model="modalObj.form.paperType" size="small">
            <el-radio label="a4">A4</el-radio>
            <el-radio label="third-split">三等分纸</el-radio>
          </el-radio-group>
        </div>
      </template>
      <template v-if="showPrintContent">
        <refund-goods-order-print
          :row=" modalObj.form.row "
          :print-orientation="modalObj.form.printOrientation || 'portrait'"
          :paper-type="modalObj.form.paperType || 'third-split'"
          ref="receiptRefundGoodsPrintRef"
        ></refund-goods-order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>

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
import { listThInventory, getThInventory, delThInventory, addThInventory, updateThInventory,auditThInventory } from "@/api/warehouse/thInventory";
import { listEntryChangeLog } from "@/api/warehouse/warehouse";
import { collectCkThScopeErrors } from '@/utils/auditBillScopeValidate';
import { assertBillEntriesForAudit } from '@/utils/billEntryValidate';
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectInventory from "@/components/SelectModel/SelectInventory";
import refundGoodsOrderPrint from "@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrint.vue";
import { buildRefundGoodsPrintRowFromDetail } from '@/views/warehouse/print/refundGoodsPrintRow'
import {STOCK_IN_TEMPLATE} from '@/utils/printData'

export default {
  name: "RefundGoodsAudit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {
    refundGoodsOrderPrint, SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectInventory},
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      supplierValue: "",
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
      selectedRowMap: {},
      // 子表选中数据
      checkedStkIoBillEntry: [],
      detailSelectedRowMap: {},
      detailSummaryTick: 0,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      mainTableHeight: 400,
      // 退货表格数据
      warehouseList: [],
      // 退货明细表格数据
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
        refBillNo: null,
        materialId: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        billStatus: null,
        userId: null,
        billType: null,
        sortScene: 'audit',
        dateQueryType: 'bill',
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        params: {}
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商ID不能为空", trigger: "blur" }
        ],
        billDate: [
          { required: true, message: "退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "退货类型不能为空", trigger: "change" }
        ],
      },
      _lastSidebarNavTick: null
    };
  },
  computed: {
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
    /** 明细表高度：与到货验收弹窗一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    supplierHeaderDisplayName() {
      if (this.form && this.form.supplier && this.form.supplier.name) {
        return this.form.supplier.name;
      }
      return '';
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
    open(val) {
      if (val) {
        this.detailSelectedRowMap = {};
        this.$nextTick(() => {
          const t = this.$refs.stkIoBillEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
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
      if (this.modalObj) {
        this.modalObj.show = false;
      }
      this.entryChangeLogDialog.visible = false;
      this.jsonViewer.visible = false;
      this.open = false;
      this.action = true;
      this.reset();
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    getSummariesWithRefresh(param) {
      void this.detailSummaryTick;
      return this.getSummaries(param);
    },
    refreshDetailSummary() {
      this.detailSummaryTick++;
      this.$nextTick(() => {
        const t = this.$refs.stkIoBillEntry;
        if (t && typeof t.doLayout === 'function') {
          t.doLayout();
        }
      });
    },
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
            sums[index] = this.formatSumByProp(sums[index], column.property);
          }
          if (prop === 'amt') {
            const res = parseFloat(sums[index]);
            if (!isNaN(res)) {
              this.form.totalAmount = this.toMoneyStorage(res);
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
            sums[index] = this.formatSumByProp(sums[index], column.property);
          }
        }
      });
      return sums;
    },
    /** 查询退货列表；弹窗打开时默认不刷新（顶部标签切回保留当前查看/编辑） */
    getList(allowWhenDialog) {
      if (this.open && !allowWhenDialog) {
        return;
      }
      this.loading = true;

      this.queryParams.billType = "301";
      // 如果 endDate 是日期格式（不包含时间），追加 " 23:59:59" 以包含当天的所有记录
      const queryParams = { ...this.queryParams };
      if (queryParams.endDate && queryParams.endDate.length === 10 && !queryParams.endDate.includes(' ')) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }

      listThInventory(queryParams).then(response => {
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
      return 'STK_IO_BILL_301';
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
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
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
        obj.material = item;
        obj.material = item.material;

        this.stkIoBillEntryList.push(obj);
      });
      this.refreshDetailSummary();
    },
    getStatDate(){
      // 返回前5天的日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 00:00:00";
    },
    getEndDate(){
      // 返回当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 23:59:59";
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
      this.refreshDetailSummary();
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
      this.refreshDetailSummary();
    },
    sortByNested(a, b, path) {
      const getVal = (row) => {
        const parts = path.split('.');
        let v = row;
        for (const p of parts) {
          v = v && v[p];
        }
        return (v == null ? '' : String(v)).toLowerCase();
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
      getThInventory(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '1';
        this.form.billType = '301';
        this.title = "查看退货";
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;
      getThInventory(id).then(async res => {
        const data = res.data
        if (!assertBillEntriesForAudit(data.stkIoBillEntryList, this, '退货单')) {
          return
        }
        const errs = await collectCkThScopeErrors(data, data.stkIoBillEntryList, data.billType)
        if (errs.length) {
          this.$modal.msgError(errs.join('；'))
          return
        }
        this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
          return auditThInventory({ id: id, auditBy: auditBy })
        }).then(() => {
          this.getList()
          this.$modal.msgSuccess('审核退货成功！')
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
        const promises = ids.map(id => auditThInventory({id: id, auditBy: auditBy}));
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
      getThInventory(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '301';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改退货";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(async valid => {
        if (!valid) return
        this.form.stkIoBillEntryList = this.stkIoBillEntryList
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
        this.form.totalAmount = this.toMoneyStorage(totalAmt)
        if (this.form.id != null) {
          updateThInventory(this.form).then(response => {
            this.$modal.msgSuccess('修改成功')
            this.open = false
            this.getList()
          })
        } else {
          addThInventory(this.form).then(response => {
            this.$modal.msgSuccess('新增成功')
            const resData = response && response.data
            if (resData && (resData.id != null || resData.billNo != null)) {
              this.form.id = resData.id
              this.form.billNo = resData.billNo
            }
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
        path: '/print/refund-goods',
        query: {
          id: String(row.id),
          from: encodeURIComponent(this.$route.fullPath)
        }
      })
    },
    doPrintOut(row, print) {
      this.getRefundGoodsDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_IN_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_IN_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getRefundGoodsDetail(row) {
      return getThInventory(row.id).then(response => {
        return buildRefundGoodsPrintRowFromDetail(row, response.data)
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      if (row && (Number(row.billStatus) === 2 || row.auditDate)) {
        this.$modal.msgError('单据已审核或已有审核时间，不能删除；请刷新列表后查看');
        this.getList();
        return;
      }
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除退货编号为"' + ids + '"的数据项？').then(function() {
        return delThInventory(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {
        this.getList();
      });
    },
    /** 退货明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
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
    /** 退货明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      // obj.unitPrice = "";
      obj.qty = "";
      obj.unitPrice = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 退货明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的退货明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
        this.detailSelectedRowMap = {};
        this.refreshDetailSummary();
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
  margin-top: 10px;
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
}

/* 弹窗内三块区域：与标题栏同宽铺满（标题栏灰条为整行宽） */
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .form-item-header-supplier .el-form-item__label {
  overflow: visible;
  padding-right: 6px;
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

/* 单据号 / 供应商：同宽紧凑输入（162px） */
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content,
.local-modal-content .apply-modal-query-panel .apply-modal-compact-field-col .el-form-item__content {
  max-width: 162px;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .header-field-supplier-readonly,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .header-field-select-compact,
.local-modal-content .apply-modal-query-panel .apply-modal-compact-field-col .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-compact-field-col .header-field-supplier-readonly,
.local-modal-content .apply-modal-query-panel .apply-modal-compact-field-col .header-field-select-compact {
  width: 162px !important;
  max-width: 162px !important;
}
.local-modal-content .apply-modal-query-panel .form-item-header-billno ::v-deep .el-input__inner,
.local-modal-content .apply-modal-query-panel .form-item-header-supplier ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗内明细表区：与列表 apply-table-panel 同款白卡片 */
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

/* 明细表可编辑列：输入框随列宽 100% 拉伸，不固定宽度 */
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-input-compact,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-cell-fluid-input,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-cell-fluid-input.el-input,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-cell-fluid-input.el-date-editor,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-cell-fluid-input.el-date-editor.el-input,
.local-modal-content .modal-detail-section .el-table ::v-deep td.detail-col-fluid-input .el-input,
.local-modal-content .modal-detail-section .el-table ::v-deep td.detail-col-fluid-input .el-date-editor {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box;
}
.local-modal-content .modal-detail-section .el-table ::v-deep td.detail-col-fluid-input .cell {
  overflow: visible;
}
.local-modal-content .modal-detail-section .el-table ::v-deep td.detail-col-fluid-input .el-input__inner,
.local-modal-content .modal-detail-section .el-table ::v-deep td.detail-col-fluid-input .el-date-editor .el-input__inner {
  width: 100% !important;
}

/* 明细表紧凑行高：单元格与输入框 */
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
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor--date.el-input--small {
  height: 28px !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor--date .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

/* 批号 / 有效期等可编辑列外层容器 */
.local-modal-content .modal-detail-section .el-table .detail-cell-edit-wrap {
  text-align: left;
  padding: 0;
}
/* 批号：单行输入 */
.local-modal-content .modal-detail-section .el-table .detail-batch-wrap {
  width: 100%;
}
/* 有效期：日期选择器与「长期」勾选项同行紧凑排布 */
.local-modal-content .modal-detail-section .el-table .detail-expiry-wrap {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}
.local-modal-content .modal-detail-section .el-table .detail-expiry-wrap .detail-date-expiry,
.local-modal-content .modal-detail-section .el-table .detail-expiry-wrap .detail-expiry-date-wrap {
  flex: 1 1 auto;
  min-width: 0;
}
.local-modal-content .modal-detail-section .el-table .detail-long-term-check {
  flex: 0 0 auto;
  margin-left: 0;
  margin-right: 0;
}
.local-modal-content .modal-detail-section .el-table .detail-long-term-check ::v-deep .el-checkbox__label {
  padding-left: 4px;
  font-size: 12px;
}
/* 有效期：避免日历/清空图标压住日期文字 */
.local-modal-content .modal-detail-section .el-table .detail-date-expiry {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table .detail-date-expiry.el-date-editor.el-input {
  width: 100% !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table .detail-begin-date-wrap {
  width: 100%;
}
.local-modal-content .modal-detail-section .el-table .detail-date-begin {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table .detail-date-begin.el-date-editor.el-input {
  width: 100% !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-expiry .el-input__prefix,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-expiry .el-input__suffix {
  display: none !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-expiry .el-input__inner {
  padding-left: 6px !important;
  padding-right: 6px !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-begin .el-input__prefix,
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-begin .el-input__suffix {
  display: none !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-begin .el-input__inner {
  padding-left: 6px !important;
  padding-right: 6px !important;
  text-align: center;
  letter-spacing: 0;
}
/* 有值时隐藏灰色占位符（勿改 font-size，避免日期显示异常） */
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor.detail-date-has-value .el-input__inner::placeholder,
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor.detail-date-has-value .el-input__inner::-webkit-input-placeholder {
  color: transparent !important;
  opacity: 0 !important;
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
/* 明细表内输入不受表头 140px 限制 */
.local-modal-content .modal-form-compact .modal-detail-section .el-input,
.local-modal-content .modal-form-compact .modal-detail-section .el-select,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor,
.local-modal-content .modal-form-compact .modal-detail-section .el-date-picker {
  width: 100% !important;
  max-width: 100% !important;
}

/* 单据号：列宽适中，过长时省略号，悬停看全文 */
.local-modal-content .modal-form-compact .form-item-header-billno .el-input {
  width: 162px !important;
  max-width: 162px !important;
}
.local-modal-content .modal-form-compact .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 供应商：与单据号同宽，过长省略 */
.local-modal-content .modal-form-compact .form-item-header-supplier .el-form-item__content {
  line-height: normal;
  max-width: 162px;
}
.local-modal-content .modal-form-compact .form-item-header-supplier .header-field-supplier-readonly,
.local-modal-content .modal-form-compact .form-item-header-supplier .header-field-select-compact {
  width: 162px !important;
  max-width: 162px !important;
}
.local-modal-content .modal-form-compact .form-item-header-supplier ::v-deep .header-field-select-compact .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 保留旧 class 兼容（若别处引用） */
.local-modal-content .modal-form-compact .form-item-header-wide .el-form-item__content {
  line-height: normal;
}
.local-modal-content .modal-form-compact .form-item-header-wide .header-field-textarea,
.local-modal-content .modal-form-compact .form-item-header-wide .header-field-select-wide {
  width: 100% !important;
  max-width: 100% !important;
}
.local-modal-content .modal-form-compact .form-item-header-wide ::v-deep .header-field-textarea .el-textarea__inner {
  min-height: 28px !important;
  line-height: 1.45 !important;
  padding: 4px 8px;
  word-break: break-all;
  white-space: pre-wrap;
  resize: none;
}
.local-modal-content .modal-form-compact .form-item-header-wide ::v-deep .header-field-select-wide .el-input__inner {
  height: auto !important;
  min-height: 28px;
  line-height: 1.45 !important;
  white-space: normal !important;
  word-break: break-all;
  padding-top: 4px;
  padding-bottom: 4px;
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

/* 弹窗内表格：高度由 el-table :height 控制；外层不滚动，表体在表内滚动，合计行贴在表底 */
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

/* 明细框表头：与耗材产品维护主表一致（冷静灰蓝） */
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

/* 表体横向滚动条与合计行错开（非明细表保留底部内边距） */
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  padding-bottom: 4px;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
}
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  padding-bottom: 0 !important;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 合计行：主表区 + 左侧固定列底部同步，避免被滚动条或固定层盖住 */
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow: visible !important;
}
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  box-shadow: none !important;
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
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper td {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  background-color: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

/* 弹窗内非明细表滚动条：细 */
.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table:not(.apply-detail-table)::-webkit-scrollbar,
.local-modal-content .table-wrapper:not(:has(.apply-detail-table))::-webkit-scrollbar {
  width: 5px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-track,
.local-modal-content .el-table:not(.apply-detail-table)::-webkit-scrollbar-track,
.local-modal-content .table-wrapper:not(:has(.apply-detail-table))::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table:not(.apply-detail-table)::-webkit-scrollbar-thumb,
.local-modal-content .table-wrapper:not(:has(.apply-detail-table))::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.local-modal-content .el-table:not(.apply-detail-table)::-webkit-scrollbar-thumb:hover,
.local-modal-content .table-wrapper:not(:has(.apply-detail-table))::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对Element UI表格滚动条的通用样式（排除明细表） */
.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__bar.is-vertical {
  width: 5px !important;
}
.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__bar {
  opacity: 1 !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__thumb {
  background-color: #c0c4cc !important;
  border-radius: 3px !important;
  min-height: 8px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__thumb:hover {
  background-color: #a8a8a8 !important;
}

/* 弹窗内通用滚动条（勿含 app-container，避免影响主列表） */
.local-modal-content *::-webkit-scrollbar,
.local-modal-mask *::-webkit-scrollbar {
  width: 5px !important;
  height: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-track,
.local-modal-mask *::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 4px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb,
.local-modal-mask *::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb:hover,
.local-modal-mask *::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对弹窗内非明细表的表格滚动条 */
.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar,
.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar {
  width: 5px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar-thumb,
.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
  min-width: 4px !important;
}

.local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar-track,
.local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
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

/* 覆盖弹窗组件的高度 - 调高添加弹窗中的弹窗高度（嵌套 RK-添加明细 除外） */
::v-deep .local-modal-content:not(.material-filter-modal--nested) {
  min-height: 95vh !important;
}

::v-deep .purchase-modal-content {
  min-height: 95vh !important;
}

/* 弹窗内非明细表表格滚动条：细 */
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 5px !important;
  height: 5px !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
  min-width: 4px !important;
  min-height: 8px !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 主列表表格滚动条：与耗材产品维护一致（固定粗细，不随 hover 加粗） */
::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  scrollbar-width: thin;
}

/*
 * 明细表：底部横向滚动条 + 合计行（必须放在 5px 通配滚动条规则之后）
 * scoped 内 [data-v-xxx] 优先级高于 unscoped，故在此覆盖
 */
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

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

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/*
 * RK-添加明细：横向滚动条与修改入库明细表一致（必须放在 5px 细滚动条规则之后）
 */
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

::v-deep .local-modal-content.apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

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

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__footer-wrapper td.el-table__cell,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__footer-wrapper td.el-table__cell .cell,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

/* 仅弹窗内按钮行，勿影响主列表 list-toolbar 与搜索区之间的留白 */
.local-modal-content .mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
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

</style>

<style>
/* 单据状态列表头不换行（第9列） */
.app-container.inWarehouse-refundGoodsAudit-page .apply-main-table thead th:nth-child(9) .cell {
  white-space: nowrap !important;
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

/* 弹窗表头：供应商/仓库/总金额标签红色，不显示 * 号 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
  width: 100%;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .return-reason-form-item .el-form-item__label {
  white-space: nowrap;
}

/* 添加入库弹窗：有效期列单元格允许换行展示 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-date .cell {
  white-space: normal;
  word-break: break-word;
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-date .detail-date-expiry .el-input__prefix,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-date .detail-date-expiry .el-input__suffix {
  display: none !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-date .detail-date-expiry .el-input__inner {
  padding-left: 6px !important;
  padding-right: 6px !important;
}

/* 添加入库弹窗：批号列单行输入（列宽不变，输入框铺满单元格） */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch .cell {
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 4px;
  padding-right: 4px;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch .detail-batch-input {
  width: 100% !important;
  max-width: 100% !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch .detail-batch-input .el-input__inner {
  padding-left: 6px;
  padding-right: 6px;
}

/* 日期列：有值时隐藏灰色占位符 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-date-editor.detail-date-has-value .el-input__inner::placeholder,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-date-editor.detail-date-has-value .el-input__inner::-webkit-input-placeholder {
  color: transparent !important;
  opacity: 0 !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-begin-date .cell {
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 4px;
  padding-right: 4px;
  overflow: visible;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-begin-date .detail-date-begin .el-input__prefix,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-begin-date .detail-date-begin .el-input__suffix {
  display: none !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-begin-date .detail-date-begin .el-input__inner {
  overflow: visible;
  text-overflow: clip;
  padding-right: 6px !important;
}

/* 明细表合计行：与表头同高、同色 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:first-child,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:first-child {
  border-left: 1px solid #e2e8f0 !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:last-child,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:last-child {
  border-right: 1px solid #e2e8f0 !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell:empty,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell:empty {
  padding: 0;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table-column--selection .cell {
  font-size: 0;
}

/* 批次号：完整展示，自动换行 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.35;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
}

/* 名称、规格、型号、生产厂家：左上对齐，最多两行；列可拖拽加宽 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 4px 6px;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.35;
  max-height: calc(1.35em * 2 + 2px);
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table thead th.el-table__cell {
  padding: 6px 0 !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper td {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  background-color: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.inWarehouse-refundGoodsAudit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
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
.app-container.inWarehouse-refundGoodsAudit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
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
.app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.inWarehouse-refundGoodsAudit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 单据状态列表头不换行 */
.app-container.inWarehouse-refundGoodsAudit-page .apply-main-table thead th:nth-child(9) .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/*
 * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏，滚动条易与合计行错位。
 * 强制显示表尾，横向滚动条固定在表体与合计之间。
 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


/* 弹窗明细表：排序图标与主列表一致 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表：勾选行高亮（与到货验收主列表一致） */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}


/* 弹窗明细表：排序图标与主列表一致 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表：勾选行高亮（与到货验收主列表一致） */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}



/* 明细表输入框：随列宽 100%，覆盖表单 140px 限制 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-form-compact .modal-detail-section .el-input,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-form-compact .modal-detail-section .el-select,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-form-compact .modal-detail-section .el-date-editor,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .detail-cell-fluid-input,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .detail-cell-fluid-input.el-input,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table .detail-cell-fluid-input.el-date-editor,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .el-input,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .el-date-editor {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .cell {
  overflow: visible !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .el-input__inner,
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-fluid-input .el-date-editor .el-input__inner {
  width: 100% !important;
}

/* 表头区与工具栏留白：与到货验收弹窗一致 */
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 8px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
  background: #fff !important;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}
.app-container.inWarehouse-refundGoodsAudit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
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
