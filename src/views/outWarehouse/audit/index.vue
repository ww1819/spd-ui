<template>
  <div class="app-container list-page outWarehouse-audit-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="出库单号"
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
          v-hasPermi="['outWarehouse:apply:audit']"
        >审核</el-button>
        <el-button
          v-if="isZaoqiangTenant"
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="multiple"
          @click="handleBatchHisPush"
        >推送HIS</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['outWarehouse:audit:export']"
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
      <el-table-column label="出库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable sortable>
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
      <el-table-column v-if="isZaoqiangTenant" label="HIS推送" align="center" width="100" show-overflow-tooltip>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.billStatus == 2" :type="msunPushTag(scope.row.hisPushStatus).type" size="mini">
            {{ msunPushTag(scope.row.hisPushStatus).label }}
          </el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" show-overflow-tooltip resizable />
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

    <!-- 添加或修改出库对话框 -->
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
          <el-col :span="4" v-show="false">
            <el-form-item label="出库类型" prop="billType">
              <el-select v-model="form.billType" placeholder="请选择出库类型" :disabled="true" clearable style="width: 100%">
                <el-option v-for="dict in dict.type.bill_type" :key="dict.value" :label="dict.label" :value="dict.value" />
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
            <el-form-item label="领用人" prop="recipientName">
              <el-input v-model="form.recipientName" :disabled="true" placeholder="领用人" />
            </el-form-item>
          </el-col>
          <el-col class="apply-modal-field apply-modal-field--grow" style="flex: 1 1 auto; min-width: 200px;">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" clearable disabled style="width: 100%; max-width: none;" />
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
          title="引用库房申请单出库：「可引用」列为申请数扣减明细作废与其它出库单已占用后的参考值；保存与审核不再强制要求出库数量不得超过该参考值。"
        />

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">出库明细信息</span>
            <el-button
              v-if="form.id"
              type="warning"
              plain
              icon="el-icon-download"
              size="small"
              class="spd-btn"
              @click="handleExportDetailPickList"
              v-hasPermi="['outWarehouse:audit:export']"
            >导出拣货单</el-button>
            <el-button
              v-if="isZaoqiangTenant && form.billStatus == 2"
              type="warning"
              size="small"
              class="spd-btn"
              icon="el-icon-upload2"
              @click="handleHisPush(form)"
            >推送HIS</el-button>
            <el-button
              v-if="isZaoqiangTenant && form.id"
              type="info"
              plain
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-document"
              @click="openHisBillView(form)"
            >HIS单据</el-button>
            <span v-if="isZaoqiangTenant && form.billStatus == 2" class="his-bill-status">HIS：{{ msunPushTag(form.hisPushStatus).label }}</span>
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
                  show-summary :summary-method="getSummariesWithRefresh"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <el-table-column label="耗材编码" align="center" width="130" min-width="120" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
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
              <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.name) || '--'">{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
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
              <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.speci) || '--'">{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
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
              <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.model) || '--'">{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="70" min-width="56" show-overflow-tooltip resizable/>
          <el-table-column label="价格" prop="unitPrice" width="100" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice | formatPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="110" min-width="100" align="center" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-input
                  clearable
                  v-model="scope.row.qty"
                  :disabled="true"
                  placeholder="数量"
                  size="small"
                  class="detail-cell-fluid-input"
                  style="width: 100%"
                  onkeyup="value=value.replace(/\D/g,'')"
                  onafterpaste="value=value.replace(/\D/g,'')"
                  @blur="form.result=$event.target.value"
                  @input="qtyChange(scope.row)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="110" align="right" header-align="center" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt | formatAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-batch">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-batch-wrap detail-cell-fluid-wrap">
                <el-input
                  v-model="scope.row.batchNumber"
                  :disabled="true"
                  placeholder="批号"
                  size="small"
                  class="detail-cell-fluid-input detail-batch-input"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="150" min-width="140" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-begin-date">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-begin-date-wrap detail-cell-fluid-wrap">
                <el-date-picker
                  clearable
                  v-model="scope.row.beginTime"
                  type="date"
                  :disabled="true"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择生产日期"
                  size="small"
                  class="detail-cell-fluid-input detail-date-begin"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="150" min-width="140" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input detail-col-date">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-date-picker
                  clearable
                  v-model="scope.row.endTime"
                  type="date"
                  :disabled="true"
                  value-format="yyyy-MM-dd"
                  placeholder="请选择有效期"
                  size="small"
                  class="detail-cell-fluid-input detail-date-expiry"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="160" min-width="140" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span class="batch-no-text" :title="scope.row.batchNo || ''">{{ scope.row.batchNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" prop="srcRefedQty" width="72" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="srcRefableQty" width="88" align="center" show-overflow-tooltip resizable>
            <template slot="header">
              <el-tooltip content="可引用=申请数−已作废−其它单已出库占用，仅供参考；出库数量可大于该值。" placement="top">
                <span class="table-header-with-tip">可引用<i class="el-icon-question" /></span>
              </el-tooltip>
            </template>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" min-width="120" show-overflow-tooltip resizable sortable class-name="detail-col-fluid-input">
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-cell-fluid-wrap">
                <el-input v-model="scope.row.remark" :disabled="true" placeholder="备注" size="small" class="detail-cell-fluid-input" style="width: 100%" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="140" show-overflow-tooltip resizable/>
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
          <el-table-column v-if="action" label="操作" width="188" align="center" fixed="right" resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyOutEntryRow(scope.$index)">复制</el-button>
              <el-button type="text" size="small" style="color:#f56c6c" @click="deleteOutEntryRow(scope.$index)">删除</el-button>
              <el-button type="text" size="small" @click="openPickBatchForRow(scope.$index)">选批次</el-button>
            </template>
          </el-table-column>
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
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="modalObj.cancel">取消</el-button>
        <el-button size="small" class="spd-btn spd-btn--primary" type="primary" @click="modalObj.ok">确认</el-button>
      </template>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      modal-title="CK-添加明细"
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
import { assertBillEntriesForAudit, assertBillMaterialLinesQtyNotZero } from '@/utils/billEntryValidate';
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import outOrderPrint from "@/views/outWarehouse/audit/outOrderPrint";
import { buildOutboundPrintRowFromDetail } from '@/views/warehouse/print/outboundPrintRow'
import {
  cloneStkOutEntryForDuplicate,
  cloneDocRefRowForDuplicate
} from '@/utils/outWarehouseBillRow'
import {STOCK_OUT_TEMPLATE} from '@/utils/printData'
import { isZaoqiangTenant, msunPushStatusMeta } from '@/utils/msunHis'
import { pushMsunOutbound } from '@/api/foundation/msunHisBill'
import MsunHisEntryView from '@/components/MsunHisEntryView'
import MsunHisBillView from '@/components/MsunHisBillView'

export default {
  name: "Audit",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectUser,outOrderPrint,MsunHisEntryView,MsunHisBillView},
  data() {
    return {
      hisEntryView: { visible: false, entry: null },
      hisBillView: { visible: false, billId: null, billType: '201', billNo: null },
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
      selectedRowMap: {},
      // 子表选中数据
      checkedStkIoBillEntry: [],
      detailSelectedRowMap: {},
      detailSelectionTick: 0,
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
      },
      _lastSidebarNavTick: null
    };
  },
  computed: {
    isZaoqiangTenant() {
      return isZaoqiangTenant(this.$store.getters.customerId)
    },
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
      this.hisBillView.billType = row.billType || '201'
      this.hisBillView.billNo = row.billNo
      this.hisBillView.visible = true
    },
    handleHisPush(row) {
      const billId = row && row.id
      if (!billId) return
      if (row.billStatus != 2) {
        this.$modal.msgWarning('未审核出库单不允许推送HIS')
        return
      }
      this.$modal.confirm('确认对该出库单执行 HIS 推送？').then(() => {
        return pushMsunOutbound(billId)
      }).then(() => {
        this.$modal.msgSuccess('HIS 推送已提交')
        if (this.form && this.form.id === billId) {
          this.handleView(row)
        }
        this.getList()
      }).catch(() => {})
    },
    /** 批量推送 HIS（仅已审核） */
    handleBatchHisPush() {
      if (!this.isZaoqiangTenant) return
      const selected = this.warehouseList.filter(r => this.ids.includes(r.id))
      const pushable = selected.filter(r => r.billStatus == 2)
      if (!pushable.length) {
        this.$modal.msgWarning('请勾选已审核的出库单')
        return
      }
      this.$modal.confirm('确认对选中的 ' + pushable.length + ' 条出库单执行 HIS 推送？').then(() => {
        const tasks = pushable.map(r =>
          pushMsunOutbound(r.id).then(() => ({ ok: true, billNo: r.billNo }))
            .catch(err => ({ ok: false, billNo: r.billNo, err }))
        )
        return Promise.all(tasks)
      }).then(results => {
        const failed = (results || []).filter(r => r && !r.ok)
        if (failed.length) {
          const nos = failed.map(r => r.billNo).filter(Boolean).join('、')
          this.$modal.msgWarning('推送完成，' + failed.length + ' 条失败' + (nos ? '：' + nos : ''))
        } else {
          this.$modal.msgSuccess('HIS 推送已提交')
        }
        this.getList()
      }).catch(() => {})
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
            sums[index] = this.formatAmount(sums[index]);
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
            sums[index] = this.formatAmount(sums[index]);
          }
        }
      });
      return sums;
    },
    /** 查询出库列表；弹窗打开时默认不刷新（顶部标签切回保留当前查看/编辑） */
    getList(allowWhenDialog) {
      if (this.open && !allowWhenDialog) {
        return;
      }
      this.loading = true;
      const status = this.queryParams.billStatus
      const baseQuery = { ...this.queryParams, billType: "201" }
      const finishList = () => {
        this.loading = false;
        this.$nextTick(() => {
          this.updateMainTableHeight();
          this.restoreMainPageSelection();
        });
      };
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
          finishList();
        }).catch(() => {
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
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
        finishList();
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
        refBillNo: null,
        recipientName: null,
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
      row.amt = this.toMoneyStorage(totalAmt);
      this.refreshDetailSummary && this.refreshDetailSummary();
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
    // 多选框选中数据
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
        const docLabel = data.billType == 301 ? '退货单' : '出库单'
        if (!assertBillEntriesForAudit(data.stkIoBillEntryList, this, docLabel)) {
          return
        }
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
      const selected = this.warehouseList.filter(r => this.ids.includes(r.id) && r.billStatus != 2)
      const ids = selected.map(r => r.id)
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择未审核的出库单");
        return;
      }
      const auditBy = this.$store.state.user.userId;
      this.$modal.confirm('确定要审核选中的"' + ids.length + '"条数据项？').then(() => {
        const validatePromises = ids.map(id =>
          getOutWarehouse(id).then(res => {
            const data = res.data
            const docLabel = data.billType == 301 ? '退货单' : '出库单'
            if (!assertBillEntriesForAudit(data.stkIoBillEntryList, this, docLabel)) {
              return Promise.reject(new Error('audit_validate_failed'))
            }
          })
        )
        return Promise.all(validatePromises)
      }).then(() => {
        const promises = ids.map(id => auditOutWarehouse({id: id, auditBy: auditBy}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！");
      }).catch(err => {
        if (err && err.message !== 'audit_validate_failed') {
          const msg = (err && err.response && err.response.data && err.response.data.msg) || (err && err.message) || '批量审核失败'
          this.$modal.msgError(msg)
        }
      });
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
        if (!assertBillMaterialLinesQtyNotZero(this.stkIoBillEntryList, this)) {
          return
        }
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
        this.form.totalAmount = this.toMoneyStorage(totalAmt)
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
      row.index = rowIndex + 1;
    },
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowStkIoBillEntryIndex({ row, rowIndex });
      void this.detailSelectionTick;
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
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
      this.checkedStkIoBillEntry = selection.map(item => item.index);
      const nextMap = {};
      (selection || []).forEach((row) => {
        const idx = this.stkIoBillEntryList.indexOf(row);
        if (idx >= 0) nextMap[idx] = true;
      });
      this.detailSelectedRowMap = nextMap;
      this.detailSelectionTick++;
      this.$nextTick(() => {
        const t = this.$refs.stkIoBillEntry;
        if (t && typeof t.doLayout === 'function') t.doLayout();
      });
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
.his-bill-status {
  line-height: 32px;
  font-size: 13px;
  color: #606266;
}
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
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
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

.wh-apply-outbound-hint { margin: 4px 0 0; flex-shrink: 0; }
.table-header-with-tip { cursor: help; }
.table-header-with-tip .el-icon-question { margin-left: 2px; font-size: 12px; color: #909399; }
.his-bill-status { margin: 0 8px; color: #606266; font-size: 13px; line-height: 32px; }

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

/* 明细表可编辑列：与「数量」列同尺度（约 98px，small） */
.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 98px !important;
  max-width: 98px;
}
.local-modal-content .modal-detail-section .el-table .detail-input-compact.el-date-editor.el-input {
  width: 98px !important;
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
.local-modal-content .modal-form-compact .modal-detail-section .el-date-editor {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
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

.app-container.outWarehouse-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.outWarehouse-audit-page .list-query-panel,
.app-container.outWarehouse-audit-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.outWarehouse-audit-page .apply-table-panel {
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

.app-container.outWarehouse-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.outWarehouse-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.outWarehouse-audit-page .apply-pagination-wrap .pagination-container {
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

.app-container.outWarehouse-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.outWarehouse-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.outWarehouse-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.outWarehouse-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.outWarehouse-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.outWarehouse-audit-page .apply-main-table .col-bill-status .cell {
  white-space: nowrap !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.outWarehouse-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.outWarehouse-audit-page .apply-main-table th.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table th.el-table-column--selection,
.app-container.outWarehouse-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-audit-page .apply-main-table td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-audit-page .apply-main-table th.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.outWarehouse-audit-page .apply-main-table th.apply-action-col,
.app-container.outWarehouse-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.outWarehouse-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.outWarehouse-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr > td,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.outWarehouse-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.outWarehouse-audit-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}


/* AUDIT-MODAL-ALIGN: 明细高亮 / 流体输入 / 表头不换行 */
.app-container.outWarehouse-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected:hover > td,
.app-container.outWarehouse-audit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .cell {
  overflow: visible !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  text-align: left !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-fluid-wrap,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-edit-wrap,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-batch-wrap,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-begin-date-wrap {
  display: block !important;
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
  padding: 0 !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-input,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-date-editor,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-cell-fluid-input {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  display: block !important;
  box-sizing: border-box !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-input__inner,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .el-date-editor .el-input__inner {
  width: 100% !important;
  max-width: none !important;
  box-sizing: border-box !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin .el-input__prefix,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-begin .el-input__suffix,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry .el-input__prefix,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table td.detail-col-fluid-input .detail-date-expiry .el-input__suffix {
  display: none !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__header-wrapper th .cell,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
  word-break: keep-all !important;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 4px 6px;
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.35;
  max-height: calc(1.35em * 2 + 2px);
}
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.outWarehouse-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-weight: 600 !important;
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
