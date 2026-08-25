<template>
  <div class="app-container list-page outWarehouse-refundDepotAudit-page" :class="{ 'is-modal-open': open }">
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
                <el-option :label="'未审核'" :value="1" />
                <el-option :label="'已审核'" :value="2" />
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
          v-hasPermi="['outWarehouse:refundDepotApply:audit']"
        >审核</el-button>
        <el-button
          v-if="isZaoqiangTenant"
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="multiple"
          @click="handleBatchHisPush"
        >推送HIS</el-button>
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
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="科室" align="center" prop="department.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="creater.nickName" width="120" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span style="white-space: nowrap;">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="isZaoqiangTenant" label="HIS推送" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.billStatus == 2" :type="msunPushTag(scope.row.hisPushStatus).type" size="mini">
            {{ msunPushTag(scope.row.hisPushStatus).label }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable />
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
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
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
              @click="handleShowEntryChangeLog(scope.row)"
              style="padding: 0 5px; margin: 0;"
              v-hasPermi="['outWarehouse:refundDepotApply:query']"
            >变更记录</el-button>
            <el-button
              v-if="isZaoqiangTenant && scope.row.billStatus == 2"
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0; color: #e6a23c;"
              @click="handleHisPush(scope.row)"
            >推送HIS</el-button>
            <el-button
              v-if="isZaoqiangTenant"
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0;"
              @click="openHisBillView(scope.row)"
            >HIS单据</el-button>
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
              <SelectWarehouse v-model="form.warehouseId" :value2="true" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--standard">
            <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
              <SelectDepartment v-model="form.departmentId" :value2="true"/>
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
          <el-col class="apply-modal-field apply-modal-field--grow" style="flex: 1 1 auto; min-width: 200px;">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable disabled style="width: 100%; max-width: none;" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">退库明细信息</span>
            <template v-if="isZaoqiangTenant && form.id">
              <el-button type="info" plain size="small" icon="el-icon-document" class="spd-btn" @click="openHisBillView(form)">HIS单据</el-button>
            </template>
            <span v-if="isZaoqiangTenant && form.billStatus == 2" class="his-bill-status">HIS：{{ msunPushTag(form.hisPushStatus).label }}</span>
            <template v-if="isZaoqiangTenant && form.billStatus == 2 && form.id">
              <el-button type="warning" size="small" icon="el-icon-upload2" @click="handleHisPush(form)">推送HIS</el-button>
            </template>
            <template v-if="action">
              <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="nameBtn">添加</el-button>
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
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
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
              <el-input clearable v-model="scope.row.qty" :disabled="true" placeholder="数量" size="small" class="detail-input-compact"
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
              <el-input v-model="scope.row.remark" size="small" :disabled="true" placeholder="备注" />
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
          <el-table-column v-if="isZaoqiangTenant" label="HIS推送" align="center" width="90">
            <template slot-scope="scope">
              <el-tag v-if="form.billStatus == 2" :type="msunPushTag(scope.row.hisPushStatus).type" size="mini">
                {{ msunPushTag(scope.row.hisPushStatus).label }}
              </el-tag>
              <span v-else>—</span>
            </template>
          </el-table-column>
          <el-table-column v-if="isZaoqiangTenant" label="pharmacyStockId" prop="hisPharmacyStockId" width="130" show-overflow-tooltip />
          <el-table-column v-if="isZaoqiangTenant" label="HIS明细" align="center" width="88" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openHisEntryView(scope.row)">查看</el-button>
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

    <MsunHisEntryView
      :visible.sync="hisEntryView.visible"
      :entry="hisEntryView.entry"
      :department="form.department"
    />
    <MsunHisBillView
      :visible.sync="hisBillView.visible"
      :bill-id="hisBillView.billId"
      :bill-type="hisBillView.billType"
      :bill-no="hisBillView.billNo"
    />

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
            <el-radio label="third-split">二等分纸（210×140mm）</el-radio>
          </el-radio-group>
        </div>
      </template>
      <template v-if="showPrintContent">
        <refund-depot-order-print
          :row=" modalObj.form.row "
          :print-orientation="modalObj.form.printOrientation || 'portrait'"
          :paper-type="modalObj.form.paperType || 'a4'"
          :embed-preview="true"
          ref="receiptRefundDepotOrderPrintRef"
        ></refund-depot-order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

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
import { listTkInventory, getTkInventory, delTkInventory, addTkInventory, updateTkInventory,auditTkInventory } from "@/api/warehouse/tkInventory";
import { listEntryChangeLog } from "@/api/warehouse/outWarehouse";
import { collectTkScopeErrors } from '@/utils/auditBillScopeValidate';
import { assertBillEntriesForAudit } from '@/utils/billEntryValidate';
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';
import refundDepotOrderPrint from "@/views/outWarehouse/refundDepotAudit/refundDepotOrderPrint.vue";
import { buildRefundDepotPrintRowFromDetail } from '@/views/warehouse/print/refundDepotPrintRow'
import {STOCK_IN_TEMPLATE} from '@/utils/printData';
import refundGoodsOrderPrint from "@/views/inWarehouse/refundGoodsAudit/refundGoodsOrderPrint.vue";
import { isZaoqiangTenant, msunPushStatusMeta } from '@/utils/msunHis'
import { pushMsunReturn } from '@/api/foundation/msunHisBill'
import MsunHisEntryView from '@/components/MsunHisEntryView'
import MsunHisBillView from '@/components/MsunHisBillView'

export default {
  name: "RefundDepotAudit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {refundGoodsOrderPrint, refundDepotOrderPrint,SelectWarehouse,SelectDepartment,SelectUser,SelectDepInventory,MsunHisEntryView,MsunHisBillView},
  data() {
    return {
      hisEntryView: { visible: false, entry: null },
      hisBillView: { visible: false, billId: null, billType: '401', billNo: null },
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
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
          paperType: 'a4',
          printOrientation: 'portrait'
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
        departmentId: null,
        // 默认不选择单据状态
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
        billDate: [
          { required: true, message: "退库日期不能为空", trigger: "blur" }
        ],
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
    isZaoqiangTenant() {
      return isZaoqiangTenant(this.$store.getters.customerId)
    },
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
      if (this.modalObj) {
        this.modalObj.show = false;
      }
      this.entryChangeLogDialog.visible = false;
      this.jsonViewer.visible = false;
      this.hisEntryView.visible = false;
      this.hisBillView.visible = false;
      this.open = false;
      this.action = true;
      this.reset();
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    msunPushTag(status) {
      return msunPushStatusMeta(status)
    },
    openHisEntryView(entry) {
      this.hisEntryView.entry = entry
      this.hisEntryView.visible = true
    },
    openHisBillView(row) {
      if (!row || !row.id) return
      this.hisBillView.billId = row.id
      this.hisBillView.billType = row.billType || '401'
      this.hisBillView.billNo = row.billNo
      this.hisBillView.visible = true
    },
    handleHisPush(row) {
      const billId = row && row.id
      if (!billId) return
      if (row.billStatus != 2) {
        this.$modal.msgWarning('未审核退库单不允许推送HIS')
        return
      }
      this.$modal.confirm('确认对该退库单执行 HIS 推送？').then(() => {
        return pushMsunReturn(billId)
      }).then(() => {
        this.$modal.msgSuccess('HIS 推送已提交')
        if (this.form && this.form.id === billId) {
          this.handleView(row)
        }
        this.getList()
      }).catch(() => {})
    },
    handleBatchHisPush() {
      if (!this.isZaoqiangTenant) return
      const selected = this.warehouseList.filter(r => this.ids.includes(r.id))
      const pushable = selected.filter(r => r.billStatus == 2)
      if (!pushable.length) {
        this.$modal.msgWarning('请勾选已审核的退库单')
        return
      }
      this.$modal.confirm('确认对选中的 ' + pushable.length + ' 条退库单执行 HIS 推送？').then(() => {
        const tasks = pushable.map(r =>
          pushMsunReturn(r.id).then(() => ({ ok: true, billNo: r.billNo }))
            .catch(err => ({ ok: false, billNo: r.billNo, msg: (err && err.message) || '失败' }))
        )
        return Promise.all(tasks)
      }).then(results => {
        const ok = results.filter(r => r.ok).length
        const fail = results.length - ok
        if (fail === 0) {
          this.$modal.msgSuccess('批量 HIS 推送已提交（' + ok + ' 条）')
        } else {
          this.$modal.msgWarning('完成：成功 ' + ok + ' 条，失败 ' + fail + ' 条')
        }
        this.getList()
      }).catch(() => {})
    },
    applyBillDetail(data, options = {}) {
      this.form = data
      this.stkIoBillEntryList = data.stkIoBillEntryList || []
      this.open = true
      if (options.action != null) this.action = options.action
      if (options.title) this.title = options.title
      if (options.billType) this.form.billType = options.billType
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
    /** 查询退库列表；弹窗打开时默认不刷新（顶部标签切回保留当前查看/编辑） */
    getList(allowWhenDialog) {
      if (this.open && !allowWhenDialog) {
        return;
      }
      this.loading = true;
      const status = this.queryParams.billStatus
      const baseQuery = { ...this.queryParams, billType: "401" }
      if (String(status) === '1') {
        Promise.all([
          listTkInventory({ ...baseQuery, billStatus: 1 }),
          listTkInventory({ ...baseQuery, billStatus: 0 }),
          listTkInventory({ ...baseQuery, billStatus: null })
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
          this.$nextTick(() => {
            this.updateMainTableHeight();
            this.restoreMainPageSelection();
          });
        }).catch(() => {
          this.loading = false
          this.$nextTick(() => this.updateMainTableHeight());
        })
        return
      }
      listTkInventory(baseQuery).then(response => {
        const rows = (response && response.rows) || []
        if (String(status) === '2') {
          this.warehouseList = rows.filter(r => Number(r.billStatus) === 2)
          this.total = this.warehouseList.length
        } else {
          this.warehouseList = rows
          this.total = response.total
        }
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
      if(!this.form.departmentId) {
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
        obj.material = item.material;
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
        this.applyBillDetail(response.data, { action: false, title: '查看退库', billType: '401' })
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;
      getTkInventory(id).then(async res => {
        const data = res.data
        if (!assertBillEntriesForAudit(data.stkIoBillEntryList, this, '退库单')) {
          return
        }
        const errs = await collectTkScopeErrors(data, data.stkIoBillEntryList)
        if (errs.length) {
          this.$modal.msgError(errs.join('；'))
          return
        }
        this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
          return auditTkInventory({ id: id, auditBy: auditBy })
        }).then(() => {
          this.getList()
          this.$modal.msgSuccess('审核退库成功！')
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
        const promises = ids.map(id => auditTkInventory({id: id, auditBy: auditBy}));
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
      getTkInventory(id).then(response => {
        const data = { ...response.data, billStatus: '1', billType: '401' }
        this.applyBillDetail(data, { action: true, title: '修改退库' })
      });
    },

    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(async valid => {
        if (!valid) return
        this.form.stkIoBillEntryList = this.stkIoBillEntryList
        const scopeErrs = await collectTkScopeErrors(this.form, this.stkIoBillEntryList)
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
          updateTkInventory(this.form).then(response => {
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
        path: '/print/refund-depot',
        query: {
          id: String(row.id),
          from: encodeURIComponent(this.$route.fullPath)
        }
      })
    },
    doPrintOut(row, print) {
      this.getRefundGoodsDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_OUT_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_OUT_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getRefundGoodsDetail(row) {
      return getTkInventory(row.id).then(response => {
        return buildRefundDepotPrintRowFromDetail(row, response.data)
      })
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
    }
  }
};
</script>

<style scoped>
.his-bill-status {
  line-height: 32px;
  font-size: 13px;
  color: #606266;
  margin-right: 8px;
}
/* 内部弹窗样式 - 与到货验收 / 退库申请一致 */
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


/* 退库审核弹窗：与到货验收 / 退库申请明细框一致 */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.outWarehouse-refundDepotAudit-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/* 弹窗明细框：与到货验收 apply-modal-table-panel 一致（铺满、无左右圆角边框） */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-modal-table-panel {
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
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表滚动条：与到货验收一致（横向 12px，无两端箭头） */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

/* 明细表勾选列 sticky */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

/* 弹窗明细表：悬停 / 勾选行高亮（与到货验收、退货申请一致） */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected:hover > td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

/* 合计行始终显示，样式与到货验收一致（表头同色灰蓝底） */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
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

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:first-child,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:first-child {
  border-left: 1px solid #e2e8f0 !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:last-child,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:last-child {
  border-right: 1px solid #e2e8f0 !important;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell:empty,
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell:empty {
  padding: 0;
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table-column--selection .cell {
  font-size: 0;
}

/* 修改退库弹窗明细：名称/规格/型号最多两行，行高随内容；悬停 title 看全文 */
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}

.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 6px;
  padding-bottom: 6px;
}
.app-container.outWarehouse-refundDepotAudit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.45;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
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
