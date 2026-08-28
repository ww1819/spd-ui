<template>
  <div class="app-container list-page stocktaking-profit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.stockNo"
              placeholder="业务单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
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
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="stockStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.stockStatus" placeholder="单据状态"
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
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="openProfitImportDialog"
          v-hasPermi="['stocktaking:in:add']"
        >导入盘盈明细</el-button>
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['stocktaking:in:audit']"
        >审核</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="inList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="业务单号" align="center" prop="stockNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="creater.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.creater && scope.row.creater.nickName) || scope.row.createUserNickName || scope.row.createrName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.profitAmount != null && scope.row.profitAmount !== ''">{{ scope.row.profitAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount != null && scope.row.totalAmount !== ''">{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="stockStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.auditPerson && scope.row.auditPerson.nickName) || scope.row.auditUserNickName || scope.row.auditPersonName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRow(scope.row)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrint(scope.row)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['stocktaking:in:remove']"
              v-if="scope.row.stockStatus != 2"
              :loading="rowActionLoadingId === scope.row.id"
              :disabled="rowActionLoadingId != null && rowActionLoadingId !== scope.row.id"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['stocktaking:in:edit']"
              v-if="scope.row.stockStatus != 2"
              :loading="rowActionLoadingId === scope.row.id"
              :disabled="rowActionLoadingId != null && rowActionLoadingId !== scope.row.id"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRow(scope.row)"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
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

    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact stocktaking-modal-head-form" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态" prop="stockStatus" class="apply-modal-label-required">
                      <el-input :value="stockStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="业务单号" prop="stockNo" class="form-item-header-billno">
                      <el-input v-model="form.stockNo" placeholder="业务单号" :disabled="true" :title="form.stockNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse v-model="form.warehouseId" :excludeWarehouseType="['高值', '设备']" placeholder="仓库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="stockDate" class="apply-modal-label-required">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 100%"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">盘点明细信息</span>
            <template v-if="detailEditable">
              <el-button type="primary" icon="el-icon-minus" size="small" class="spd-btn spd-btn--primary" @click="openAddLossEntry">新增盘亏明细</el-button>
              <el-button type="warning" icon="el-icon-plus" size="small" class="spd-btn" @click="openAddProfitEntry">新增盘盈明细</el-button>
              <el-button type="danger" icon="el-icon-delete" size="small" class="spd-btn" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
              <el-button type="success" icon="el-icon-refresh" size="small" class="spd-btn" @click="handleStocktakingInit">盘点初始化</el-button>
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" icon="el-icon-check" @click="submitForm" :loading="submitLoading">保 存</el-button>
            </template>
          </div>
        </el-row>

        <div class="modal-detail-section apply-modal-table-panel">
        <div class="table-wrapper">
        <el-table class="stocktaking-detail-table apply-detail-table" :data="stkIoStocktakingEntryList" v-loading="detailLoading" :row-class-name="applyDetailRowClassName" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" :height="detailTableHeight" border show-summary :summary-method="getSummaries">
          <el-table-column v-if="detailEditable" type="selection" width="60" align="center" header-align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" resizable />
          <el-table-column label="序号" align="center" header-align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <el-table-column label="耗材编码" align="center" header-align="center" width="100" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="耗材名称"
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
                :title="(scope.row.material && scope.row.material.name) || '--'"
              >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="规格"
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
                :title="(scope.row.material && scope.row.material.speci) || '--'"
              >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" header-align="center" width="56" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="账面数量" align="center" header-align="center" prop="qty" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点数量" align="center" header-align="center" prop="stockQty" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-if="detailEditable"
                clearable
                v-model="scope.row.stockQty"
                placeholder="盘点数量"
                size="small"
                class="detail-input-compact"
                onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                @blur="handleStockQtyBlur(scope.row)"
                @input="stockQtyChange(scope.row)"
              />
              <span v-else>{{ scope.row.stockQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="right" header-align="center" prop="price" width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.price != null && scope.row.price !== '' ? formatPrice(scope.row.price) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="right" header-align="center" prop="amt" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点金额" align="right" header-align="center" prop="stockAmount" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="right" header-align="center" prop="profitAmount" width="88" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" header-align="center" prop="beginTime" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.beginTime ? parseTime(scope.row.beginTime, '{y}-{m}-{d}') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" header-align="center" prop="endTime" width="96" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.endTime ? parseTime(scope.row.endTime, '{y}-{m}-{d}') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" header-align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.batchNumber" size="small" class="detail-input-compact" placeholder="批号" />
              <span v-else>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="型号"
            align="left"
            header-align="center"
            width="100"
            min-width="90"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" header-align="center" width="56" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1 || scope.row.material.isBilling === true || scope.row.material.isBilling === 'true')">是</span>
              <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2' || scope.row.material.isBilling === false || scope.row.material.isBilling === 'false')">否</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="160" class-name="detail-col-batch-no" :show-overflow-tooltip="false" resizable>
            <template slot-scope="scope">
              <span class="detail-batch-no-cell" :title="scope.row.batchNo || ''">{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" align="center" header-align="center" prop="hisId" width="168" label-class-name="col-his-id-header" class-name="col-his-id" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.hisId || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方批次号" align="center" header-align="center" prop="thirdPartyBatchNo" width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.thirdPartyBatchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" header-align="center" prop="remark" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.remark" size="small" placeholder="备注" />
              <span v-else>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="detailEditable" label="操作" align="center" header-align="center" class-name="small-padding fixed-width" width="72" fixed="right">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteDetailRow(scope.row)"
                style="padding: 0 5px; margin: 0;"
              >删除</el-button>
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
<!--    <SelectPdInventoryFilter-->
<!--      v-if="DialogComponentShow"-->
<!--      :DialogComponentShow="DialogComponentShow"-->
<!--      :warehouseValue="warehouseValue"-->
<!--      @closeDialog="closeDialog"-->
<!--      @selectData="selectData"-->
<!--    ></SelectPdInventoryFilter>-->

    <SelectInventory
      v-if="dialogInvShow"
      :DialogComponentShow="dialogInvShow"
      :warehouseValue="form.warehouseId"
      :selected-details="stkIoStocktakingEntryList"
      :stocktaking-pick-sort-by-material="true"
      @closeDialog="closeInvDialog"
      @selectData="selectWhInventoryData"
    />
    <SelectDepInventory
      v-if="dialogDepShow"
      :DialogComponentShow="dialogDepShow"
      :department-value="''"
      :use-material-dict="true"
      @closeDialog="closeDepDialog"
      @selectData="selectProfitMaterialData"
    />

    <el-dialog
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="1000px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small">
        <el-table-column label="耗材名称" min-width="150">
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="120">
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" @input="stockQtyChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.batchNumber" placeholder="批号" />
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="160">
          <template slot-scope="scope">
            <el-date-picker
              v-model="scope.row.beginTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="生产日期"
              clearable
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="160">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.endTime" type="date" value-format="yyyy-MM-dd" placeholder="有效期" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmPendingNewEntries">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="导入盘盈明细"
      :visible.sync="profitImport.visible"
      width="1080px"
      append-to-body
      :close-on-click-modal="false"
      @close="resetProfitImportDialog"
    >
      <div style="margin-bottom: 10px; color: #606266; line-height: 1.6;">
        按模板填写 SPD 仓库/产品/供应商 ID 及盘盈数量等信息，系统将按<strong> SPD仓库ID </strong>自动拆分为多张未审核盘点单。
        <strong>SPD仓库ID、SPD产品档案ID、SPD供应商ID</strong> 均不能为空，且必须在系统中能匹配到对应档案，任一行校验失败则整单导入失败。
        批号、第三方批次号若以单引号开头，系统会自动去除（避免 Excel 数字格式问题）。有效期为空时默认设为 2099-01-01。
      </div>
      <el-form size="small" :inline="true">
        <el-form-item>
          <el-upload
            ref="profitImportUploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleProfitImportFileChange"
            :on-exceed="handleProfitImportExceed"
            accept=".xlsx,.xls"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将 Excel 拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="downloadProfitImportTemplate">下载模板</el-link>
        </el-form-item>
      </el-form>
      <div v-if="profitImport.warehouseSummary && profitImport.warehouseSummary.length" style="margin-bottom: 10px;">
        <span style="font-weight: 600;">将生成盘点单：</span>
        <el-tag
          v-for="(w, idx) in profitImport.warehouseSummary"
          :key="w.warehouseId || idx"
          size="small"
          style="margin-right: 8px; margin-top: 4px;"
        >{{ w.warehouseName || w.warehouseId }}（{{ w.rowCount }} 条）</el-tag>
      </div>
      <div v-if="profitImport.previewList && profitImport.previewList.length">
        <div style="margin-bottom: 8px;">
          预览共 {{ profitImport.previewList.length }} 行，有效 {{ profitImport.validRows }} 行
        </div>
        <el-table :data="profitImport.previewList" border size="small" max-height="320" v-loading="profitImport.previewLoading">
          <el-table-column label="行号" prop="rowIndex" width="60" align="center" />
          <el-table-column label="仓库" prop="warehouseName" width="100" show-overflow-tooltip />
          <el-table-column label="耗材编码" prop="materialCode" width="110" show-overflow-tooltip />
          <el-table-column label="耗材名称" prop="materialName" min-width="120" show-overflow-tooltip />
          <el-table-column label="供应商" prop="supplierName" width="100" show-overflow-tooltip />
          <el-table-column label="单价" width="80" align="right">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.unitPrice }}</template>
          </el-table-column>
          <el-table-column label="数量" width="70" align="right">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.qty }}</template>
          </el-table-column>
          <el-table-column label="批号" width="110" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.batchNumber }}</template>
          </el-table-column>
          <el-table-column label="第三方批次号" width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.thirdPartyBatchNo }}</template>
          </el-table-column>
          <el-table-column label="有效期" width="100">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.endDateRaw }}</template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.hisId }}</template>
          </el-table-column>
          <el-table-column label="校验" width="160" fixed="right">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              <span v-else style="color: #67c23a;">通过</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="profitImport.visible = false">取 消</el-button>
        <el-button
          type="primary"
          class="spd-btn spd-btn--primary"
          @click="confirmProfitImport"
          :loading="profitImport.confirmLoading"
          :disabled="!canConfirmProfitImport"
        >确认导入</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="审核前确认（明细库存与仓库实物不一致）"
      :visible.sync="whAuditQtyMismatchVisible"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细账面库存与当前仓库库存不一致，请逐条确认盘点数量后再审核。
      </div>
      <el-table :data="qtyMismatchAuditList" border size="small">
        <el-table-column label="耗材" prop="materialName" min-width="150" />
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="明细账面数量" prop="detailQty" width="140" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="140" />
        <el-table-column label="盘点数量" min-width="140">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.adjustedStockQty"
              type="number"
              :disabled="scope.row.confirmed"
              placeholder="盘点数量"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhAuditMismatchRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="whAuditQtyMismatchVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmWhAuditQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listStocktaking, getStocktaking, delStocktaking, addStocktaking, updateStocktaking, patchSaveStocktaking, appendStocktakingEntries, auditStocktaking, checkStocktakingQty, previewWhStocktakingProfitImport, confirmWhStocktakingProfitImport, downloadWhStocktakingProfitImportTemplate, listWhStocktakingExportRows } from "@/api/warehouse/stocktaking";
import { exportWhStocktakingDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listPDFilter } from "@/api/warehouse/inventory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectPdInventoryFilter from "@/components/SelectModel/SelectPdInventoryFilter";
import SelectInventory from "@/components/SelectModel/SelectInventory";
import SelectDepInventory from "@/components/SelectModel/SelectDepInventory";
import { sortInventoryRowsByNameSpecCodeMaterialId } from "@/utils/stocktakingInventorySort";

export default {
  name: "InStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectPdInventoryFilter,SelectInventory,SelectDepInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      detailLoading: false,
      rowActionLoadingId: null,
      entrySaveSnapshots: {},
      dialogInvShow: false,
      dialogDepShow: false,
      newEntryDialogVisible: false,
      pendingNewEntries: [],
      stocktakingBatchSeqCounter: 0,
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoStocktakingEntry: [],
      // 明细勾选行高亮（与到货验收一致）
      detailSelectedRowMap: {},
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      // 总条数
      total: 0,
      // 盘点表格数据
      inList: [],
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      submitLoading: false,
      whAuditQtyMismatchVisible: false,
      qtyMismatchAuditList: [],
      pendingWhAuditId: null,
      pendingWhAuditExpectedUpdateTime: null,
      profitImport: {
        visible: false,
        previewLoading: false,
        confirmLoading: false,
        previewList: [],
        warehouseSummary: [],
        validRows: 0,
        canImport: false
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        supplerId: null,
        stockDate: null,
        beginDate: null,
        endDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        stockDate: [
          { required: true, message: "业务日期不能为空", trigger: "blur" }
        ],
        stockStatus: [
          { required: true, message: "单据状态不能为空", trigger: "change" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "change" }
        ],
      }
    };
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
  computed: {
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    stockStatusLabel() {
      const status = this.form && this.form.stockStatus;
      if (status == null || status === '') {
        return '';
      }
      const label = this.selectDictLabel(this.dict.type.biz_status, String(status));
      return label || '';
    },
    createrDisplayName() {
      const f = this.form || {};
      if (f.createUserNickName) {
        return f.createUserNickName;
      }
      if (f.creater && f.creater.nickName) {
        return f.creater.nickName;
      }
      if (f.createrName) {
        return f.createrName;
      }
      return this.$store.getters.nickName || this.$store.getters.name || '';
    },
    stocktakingHeadAudited() {
      const s = this.form && this.form.stockStatus;
      return s === 2 || s === '2';
    },
    detailEditable() {
      return this.action && !this.stocktakingHeadAudited;
    },
    canConfirmProfitImport() {
      const pi = this.profitImport || {};
      if (pi.canImport === false) return false;
      const list = pi.previewList || [];
      if (!list.length) return false;
      return list.every((p) => !p.error);
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
      this.open = false;
      this.profitImport.visible = false;
      this.whAuditQtyMismatchVisible = false;
      this.reset();
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    sortByNested(a, b, path) {
      const getVal = (obj, p) => p.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
      const va = getVal(a, path);
      const vb = getVal(b, path);
      if (va == null && vb == null) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      return String(va).localeCompare(String(vb), 'zh-CN');
    },
    /** 查询盘点列表 */
    getList(restoreSelection) {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      queryParams.stockType = "501";
      listStocktaking(queryParams).then(response => {
        this.inList = response.rows;
        this.total = response.total;
        this.loading = false;
        if (restoreSelection) {
          this.$nextTick(() => {
            this.restoreMainPageSelection();
            this.scheduleApplyLayoutRefresh();
          });
        } else {
          this.scheduleApplyLayoutRefresh();
        }
      });
    },
    openAddLossEntry() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      this.dialogInvShow = true;
    },
    openAddProfitEntry() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      this.dialogDepShow = true;
    },
    closeInvDialog() {
      this.dialogInvShow = false;
    },
    closeDepDialog() {
      this.dialogDepShow = false;
    },
    nextStocktakingBatchNo() {
      this.stocktakingBatchSeqCounter += 1;
      const d = new Date();
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      const ts = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
      return 'PC' + ts + String(this.stocktakingBatchSeqCounter).padStart(4, '0');
    },
    mapWhInventoryToStocktakingEntry(item) {
      const book = item.qty != null && item.qty !== '' ? item.qty : 0;
      const up = item.unitPrice != null && item.unitPrice !== '' ? item.unitPrice : (item.price != null ? item.price : null);
      const stockQty = book;
      const unitPriceNum = parseFloat(up || 0);
      const amt = (parseFloat(stockQty) || 0) * (Number.isFinite(unitPriceNum) ? unitPriceNum : 0);
      return {
        kcNo: item.id,
        materialId: item.materialId,
        material: item.material,
        supplierId: item.supplierId,
        unitPrice: up,
        price: up,
        qty: book,
        stockQty,
        profitQty: 0,
        profitAmount: 0,
        stockAmount: this.toMoneyStorage(amt),
        amt: this.toMoneyStorage(amt),
        batchNo: item.batchNo || '',
        batchNumber: item.batchNumber || item.materialNo || '',
        hisId: item.hisId != null && item.hisId !== '' ? String(item.hisId).trim() : '',
        thirdPartyBatchNo: item.thirdPartyBatchNo != null && item.thirdPartyBatchNo !== '' ? String(item.thirdPartyBatchNo).trim() : '',
        beginTime: item.beginTime,
        endTime: item.endTime,
        remark: ''
      };
    },
    selectWhInventoryData(val) {
      const sorted = sortInventoryRowsByNameSpecCodeMaterialId(val || []);
      const rows = sorted.map((it) => this.mapWhInventoryToStocktakingEntry(it));
      const exists = new Set(
        (this.stkIoStocktakingEntryList || [])
          .map((r) => (r && r.kcNo != null ? String(r.kcNo) : ''))
          .filter((s) => s)
      );
      const toAdd = [];
      let skip = 0;
      rows.forEach((r) => {
        const k = r && r.kcNo != null ? String(r.kcNo) : '';
        if (!k || exists.has(k)) {
          skip += 1;
          return;
        }
        exists.add(k);
        toAdd.push(r);
      });
      if (toAdd.length) {
        this.stkIoStocktakingEntryList.push(...toAdd);
      }
      if (skip) {
        this.$modal.msgWarning(`已过滤 ${skip} 条重复或无效的仓库库存明细`);
      }
    },
    selectProfitMaterialData(val) {
      const rows = (val || []).map((row) => {
        const mat = row.material || null;
        const materialPrice = mat && mat.price != null ? mat.price : (mat && mat.salePrice != null ? mat.salePrice : null);
        return {
          materialId: row.materialId != null ? row.materialId : (mat && mat.id),
          material: mat,
          supplierId: mat && mat.supplierId != null ? mat.supplierId : null,
          unitPrice: materialPrice,
          price: materialPrice,
          qty: 0,
          stockQty: 1,
          profitQty: 1,
          amt: '0.00',
          batchNo: this.nextStocktakingBatchNo(),
          batchNumber: '',
          beginTime: '',
          endTime: '',
          remark: ''
        };
      });
      rows.forEach((r) => this.stockQtyChange(r));
      this.pendingNewEntries = rows;
      this.newEntryDialogVisible = rows.length > 0;
    },
    cancelPendingNewEntries() {
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    confirmPendingNewEntries() {
      const rows = this.pendingNewEntries || [];
      if (!rows.length) {
        this.newEntryDialogVisible = false;
        return;
      }
      for (const r of rows) {
        if (!r.batchNumber || !r.endTime) {
          this.$modal.msgWarning('盘盈明细须填写批号、有效期');
          return;
        }
        if (!r.stockQty || parseFloat(r.stockQty) <= 0) {
          this.$modal.msgWarning('盘盈明细盘点数量须大于 0');
          return;
        }
        if (r.beginTime && r.endTime && new Date(r.endTime).getTime() < new Date(r.beginTime).getTime()) {
          this.$modal.msgWarning('有效期不能早于生产日期');
          return;
        }
      }
      rows.forEach((r) => {
        r.kcNo = null;
        r.qty = 0;
        r.countedFlag = 1;
        if (r.unitPrice != null && r.unitPrice !== '') {
          r.price = r.unitPrice;
        }
      });
      this.stkIoStocktakingEntryList.push(...rows);
      this.cancelPendingNewEntries();
    },
    stockQtyChangePending(row) {
      this.stockQtyChange(row);
    },
    openProfitImportDialog() {
      this.resetProfitImportDialog();
      this.profitImport.visible = true;
    },
    resetProfitImportDialog() {
      this.profitImport.previewList = [];
      this.profitImport.warehouseSummary = [];
      this.profitImport.validRows = 0;
      this.profitImport.canImport = false;
      this.profitImport.previewLoading = false;
      this.profitImport.confirmLoading = false;
      this.$refs.profitImportUploadRef && this.$refs.profitImportUploadRef.clearFiles();
    },
    handleProfitImportExceed() {
      this.$modal.msgWarning('仅支持单文件上传');
    },
    handleProfitImportFileChange(file) {
      const raw = file && file.raw;
      if (!raw) return;
      this.profitImport.previewLoading = true;
      previewWhStocktakingProfitImport(raw).then((res) => {
        if (res.code !== 200) {
          this.$modal.msgError(res.msg || '解析失败');
          return;
        }
        const data = res.data || {};
        this.profitImport.previewList = data.list || [];
        this.profitImport.warehouseSummary = data.warehouseSummary || [];
        this.profitImport.validRows = data.validRows != null ? data.validRows : 0;
        this.profitImport.canImport = data.canImport === true;
        if (!this.profitImport.previewList.length) {
          this.$modal.msgWarning('未解析到有效数据');
        } else if (!this.profitImport.canImport) {
          this.$modal.msgError('存在校验未通过的行，请修正 Excel 后重新上传；任一行失败则整单不可导入');
        } else {
          this.$modal.msgSuccess('解析成功，请确认后点击「确认导入」');
        }
      }).catch(() => {}).finally(() => {
        this.profitImport.previewLoading = false;
      });
    },
    downloadProfitImportTemplate() {
      downloadWhStocktakingProfitImportTemplate().then((res) => {
        const blob = res && res instanceof Blob ? res : (res && res.data);
        if (!blob || !(blob instanceof Blob)) {
          this.$modal.msgError('下载模板失败');
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '盘盈明细模板.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      }).catch(() => {
        this.$modal.msgError('下载模板失败');
      });
    },
    confirmProfitImport() {
      if (!this.canConfirmProfitImport) {
        this.$modal.msgWarning('存在校验未通过的行，请修正 Excel 后重新上传');
        return;
      }
      const rows = (this.profitImport.previewList || []).map((p) => p.data);
      if (!rows.length) {
        this.$modal.msgWarning('没有可导入的数据');
        return;
      }
      this.profitImport.confirmLoading = true;
      confirmWhStocktakingProfitImport(rows).then((res) => {
        const data = res.data || {};
        const bills = data.bills || [];
        const nos = bills.map((b) => b.stockNo).filter(Boolean).join('、');
        this.$modal.msgSuccess(
          res.msg || ('导入成功' + (nos ? '：' + nos : ''))
        );
        this.profitImport.visible = false;
        this.resetProfitImportDialog();
        this.getList();
      }).finally(() => {
        this.profitImport.confirmLoading = false;
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
      this.detailLoading = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        stockNo: null,
        supplerId: null,
        stockDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.checkedStkIoStocktakingEntry = [];
      this.detailSelectedRowMap = {};
      this.entrySaveSnapshots = {};
      if (this.$refs.form) {
        this.resetForm("form");
      }
    },
    prefillStocktakingFormFromRow(row) {
      if (!row) return;
      Object.assign(this.form, {
        id: row.id,
        stockNo: row.stockNo,
        stockDate: row.stockDate,
        warehouseId: row.warehouseId,
        departmentId: row.departmentId,
        stockStatus: row.stockStatus,
        stockType: row.stockType != null ? row.stockType : "501",
        supplerId: row.supplerId,
        createBy: row.createBy,
        createUserNickName: row.createUserNickName,
        createrName: row.createrName,
        creater: row.creater,
        updateTime: row.updateTime,
        createTime: row.createTime,
        remark: row.remark,
        totalAmount: row.totalAmount,
        profitAmount: row.profitAmount,
        warehouse: row.warehouse,
        department: row.department,
        auditAdjustsInventory: row.auditAdjustsInventory
      });
    },
    loadStocktakingDetail(id, row, options = {}) {
      const { title, action, onReady } = options;
      this.reset();
      this.prefillStocktakingFormFromRow(row);
      this.title = title;
      this.action = action;
      this.open = true;
      this.detailLoading = true;
      this.stkIoStocktakingEntryList = [];
      this.checkedStkIoStocktakingEntry = [];
      this.rowActionLoadingId = id;
      return getStocktaking(id)
        .then((response) => {
          const data = response.data || {};
          if (action && (data.stockStatus === 2 || data.stockStatus === "2")) {
            this.$modal.msgWarning("已审核的盘点单不可修改");
            this.open = false;
            this.detailLoading = false;
            return null;
          }
          this.form = data;
          this.form.stockType = "501";
          const entries = data.stkIoStocktakingEntryList || [];
          return this.$nextTick().then(() => {
            this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(entries);
            this.detailLoading = false;
            if (typeof onReady === "function") {
              onReady(data);
            }
            return data;
          });
        })
        .catch(() => {
          this.detailLoading = false;
          this.open = false;
          this.$modal.msgError("加载盘点单失败");
        })
        .finally(() => {
          this.rowActionLoadingId = null;
        });
    },
    normalizeLoadedEntries(list) {
      (list || []).forEach((row) => {
        if (!row) return;
        if (row.stockQty == null || row.stockQty === '') {
          row.stockQty = row.qty != null && row.qty !== '' ? row.qty : 0;
        }
        this.stockQtyChange(row);
      });
      this.refreshEntrySaveSnapshots(list);
      return list || [];
    },
    patchQtyNum(v) {
      if (v == null || v === '') return null;
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    },
    snapshotEntryForSave(row) {
      if (!row) return null;
      return {
        stockQty: this.patchQtyNum(row.stockQty),
        qty: this.patchQtyNum(row.qty),
        batchNumber: row.batchNumber != null ? String(row.batchNumber) : '',
        remark: row.remark != null ? String(row.remark) : ''
      };
    },
    refreshEntrySaveSnapshots(list) {
      const m = {};
      (list || []).forEach((row) => {
        if (row && row.id != null && row.id !== '') {
          m[String(row.id)] = this.snapshotEntryForSave(row);
        }
      });
      this.entrySaveSnapshots = m;
    },
    collectEntryQtyPatches(list) {
      const snap = this.entrySaveSnapshots || {};
      const patches = [];
      (list || []).forEach((row) => {
        if (!row || row.id == null || row.id === '') return;
        const key = String(row.id);
        const old = snap[key];
        const cur = this.snapshotEntryForSave(row);
        if (!old || !cur) return;
        const stockChanged = cur.stockQty !== old.stockQty;
        const qtyChanged = cur.qty !== old.qty;
        const batchChanged = cur.batchNumber !== old.batchNumber;
        const remarkChanged = cur.remark !== old.remark;
        if (!stockChanged && !qtyChanged && !batchChanged && !remarkChanged) return;
        const p = { id: row.id };
        if (stockChanged) p.stockQty = cur.stockQty;
        if (qtyChanged) p.bookQty = cur.qty;
        if (batchChanged) p.batchNumber = cur.batchNumber;
        if (remarkChanged) p.remark = cur.remark;
        patches.push(p);
      });
      return patches;
    },
    whStocktakingClientVersionTime() {
      return this.form.updateTime || this.form.createTime;
    },
    buildPatchSavePayload() {
      return {
        id: this.form.id,
        stockDate: this.form.stockDate,
        remark: this.form.remark,
        expectedUpdateTime: this.whStocktakingClientVersionTime(),
        entryPatches: this.collectEntryQtyPatches(this.stkIoStocktakingEntryList)
      };
    },
    serializeStocktakingEntryForSave(row) {
      const rest = { ...row };
      delete rest.material;
      delete rest.warehouse;
      delete rest.index;
      const up = rest.unitPrice != null && rest.unitPrice !== '' ? rest.unitPrice : rest.price;
      if (up != null && up !== '') {
        rest.unitPrice = up;
        rest.price = up;
      }
      return rest;
    },
    hasDeletedStocktakingEntries() {
      const snap = this.entrySaveSnapshots || {};
      const currentIds = new Set(
        (this.stkIoStocktakingEntryList || [])
          .filter((r) => r && r.id != null && r.id !== '')
          .map((r) => String(r.id))
      );
      return Object.keys(snap).some((k) => !currentIds.has(k));
    },
    collectNewStocktakingEntries() {
      return (this.stkIoStocktakingEntryList || []).filter(
        (r) => r && (r.id == null || r.id === '')
      );
    },
    doFullUpdateStocktaking() {
      this.form.stkIoStocktakingEntryList = (this.stkIoStocktakingEntryList || []).map((row) =>
        this.serializeStocktakingEntryForSave(row)
      );
      return updateStocktaking(this.form).then((response) => {
        const data = response.data || response;
        if (data && data.stkIoStocktakingEntryList) {
          this.form = data;
          this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
        }
        return data;
      });
    },
    async doSubmitStocktakingForm() {
      if (this.submitLoading) return;
      this.submitLoading = true;
      try {
        const isUpdate = this.form.id != null;
        let data;
        if (isUpdate) {
          if (this.hasDeletedStocktakingEntries()) {
            data = await this.doFullUpdateStocktaking();
          } else {
            const newEntries = this.collectNewStocktakingEntries().map((row) =>
              this.serializeStocktakingEntryForSave(row)
            );
            let appendData = null;
            if (newEntries.length) {
              const appendRes = await appendStocktakingEntries(this.form.id, {
                entries: newEntries,
                expectedUpdateTime: this.whStocktakingClientVersionTime()
              });
              appendData = (appendRes && appendRes.data) || null;
              if (appendData) {
                this.form = { ...this.form, ...appendData };
                this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(
                  appendData.stkIoStocktakingEntryList || []
                );
              }
            }
            const patches = this.collectEntryQtyPatches(this.stkIoStocktakingEntryList);
            if (patches.length) {
              const patchRes = await patchSaveStocktaking(this.buildPatchSavePayload());
              data = (patchRes && patchRes.data) || patchRes;
            } else {
              data = appendData || this.form;
            }
            if (data && data.stkIoStocktakingEntryList) {
              this.form = { ...this.form, ...data };
              this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(
                data.stkIoStocktakingEntryList || []
              );
            }
          }
        } else {
          this.form.stkIoStocktakingEntryList = (this.stkIoStocktakingEntryList || []).map((row) =>
            this.serializeStocktakingEntryForSave(row)
          );
          const addRes = await addStocktaking(this.form);
          data = (addRes && addRes.data) || addRes;
          if (data) {
            this.form.id = data.id;
            if (data.stockNo != null) this.form.stockNo = data.stockNo;
            if (data.stkIoStocktakingEntryList) {
              this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
            }
          }
        }
        this.$modal.msgSuccess(isUpdate ? '保存成功' : '新增成功');
        this.getList();
      } finally {
        this.submitLoading = false;
      }
    },
    //盘点数量改变：盈亏数量 = 盘点(stockQty) − 账面(qty)；盘点金额 = 盘点×单价；盈亏金额 = 盈亏×单价
    stockQtyChange(row){
      const sq = parseFloat(row.stockQty);
      const bq = parseFloat(row.qty);
      const pr = parseFloat(row.price) || 0;
      const totalProfitQty = (Number.isFinite(sq) && Number.isFinite(bq)) ? sq - bq : 0;
      row.profitQty = Number.isFinite(totalProfitQty) ? this.formatQty(totalProfitQty, '0') : '0';
      row.profitAmount = this.toMoneyStorage(Number.isFinite(totalProfitQty) ? totalProfitQty * pr : 0);
      row.stockAmount = this.toMoneyStorage(Number.isFinite(sq) ? sq * pr : 0);
      if (Number.isFinite(sq) && Number.isFinite(bq)) {
        if (sq > bq) row.profitLossFlag = 'PROFIT';
        else if (sq < bq) row.profitLossFlag = 'LOSS';
        else row.profitLossFlag = 'EQUAL';
      }
    },
    handleStockQtyBlur(row) {
      if (!row || !row.kcNo) return;
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return;
      if (stockQty > qty) {
        row.stockQty = qty;
        this.stockQtyChange(row);
        this.$modal.msgWarning('盘点数量不能大于账面数量。盘盈请点击「新增盘盈明细」。');
      }
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
    // 计算合计数量和金额
    getSummaries(param) {
      const { columns } = param;
      const data = this.stkIoStocktakingEntryList || [];
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
        // 合计：盘点数量、账面数量、盈亏数量、金额、盘点金额、盈亏金额
        if (['stockQty', 'qty', 'profitQty', 'amt', 'stockAmount', 'profitAmount'].includes(prop)) {
          const values = data.map(item => Number(item[prop]));
          if (!values.every(value => isNaN(value))) {
            const total = values.reduce((prev, curr) => {
              const value = Number(curr);
              return !isNaN(value) ? prev + value : prev;
            }, 0);
            if (['amt', 'stockAmount', 'profitAmount'].includes(prop)) {
              sums[index] = this.formatAmount(total);
          } else {
              sums[index] = Number.isInteger(total) ? String(total) : String(total);
            }
          }
        }
      });
      return sums;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.stockNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.stockStatus = null;
      this.handleQuery();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.inList || !this.inList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.inList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    // 多选框选中数据（跨页缓存 + 行高亮）
    handleSelectionChange(selection) {
      const pageKeys = (this.inList || [])
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
        const row = this.selectedRowMap[key];
        return row && row.id;
      }).filter((id) => id != null);
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加盘点";
      this.form.stockStatus = '1';
      this.form.stockType = '501';
      // 制单人：后端 create_by 存用户ID，弹窗展示姓名
      this.form.createBy = this.$store.getters.userId != null ? String(this.$store.getters.userId) : '';
      this.form.createUserNickName = this.$store.getters.nickName || this.$store.getters.name || '';
      this.form.stockDate = this.getBillDate();
      this.action = true;
    },
    /** 查看按钮操作 */
    handleView(row) {
      const id = row.id;
      this.loadStocktakingDetail(id, row, { title: "查看盘点", action: false });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids;
      const stockNo = row && row.stockNo != null ? row.stockNo : id;
      getStocktaking(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.stkIoStocktakingEntryList, this, '仓库盘点')) {
          return;
        }
        this.$modal
          .confirm('确定要审核"' + stockNo + '"的数据项？')
          .then(() => checkStocktakingQty({ id }))
        .then((res) => {
          const rows = (res && res.data) || [];
          if (!rows.length) {
            return auditStocktaking({ id, expectedUpdateTime: row.updateTime || row.createTime });
          }
          this.pendingWhAuditId = id;
          this.pendingWhAuditExpectedUpdateTime = row.updateTime || row.createTime;
          this.qtyMismatchAuditList = rows.map((r) => ({
            ...r,
            adjustedStockQty: r.stockQty != null ? r.stockQty : r.currentQty,
            confirmed: false
          }));
          this.whAuditQtyMismatchVisible = true;
          return null;
        })
          .then((result) => {
            if (!result) return;
            this.getList();
            this.$modal.msgSuccess('审核成功！');
          })
          .catch(() => {});
      }).catch(() => {});
    },
    confirmWhAuditMismatchRow(row) {
      const v = parseFloat(row.adjustedStockQty);
      if (!Number.isFinite(v) || v < 0) {
        this.$modal.msgWarning('请输入有效的盘点数量');
        return;
      }
      const cap = parseFloat(row.currentQty);
      if (Number.isFinite(cap) && v > cap) {
        row.adjustedStockQty = cap;
        this.$modal.msgWarning('来源于仓库库存的明细仅允许盘亏，盘点数量已回退为当前库存数量');
      } else {
        row.adjustedStockQty = v;
      }
      row.confirmed = true;
    },
    confirmWhAuditQtyMismatchAndAudit() {
      const unconfirmed = (this.qtyMismatchAuditList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交');
        return;
      }
      const qtyAdjustList = (this.qtyMismatchAuditList || []).map((r) => ({
        entryId: r.entryId,
        stockQty: r.adjustedStockQty
      }));
      auditStocktaking({
        id: this.pendingWhAuditId,
        qtyAdjustList,
        expectedUpdateTime: this.pendingWhAuditExpectedUpdateTime
      }).then(() => {
        this.whAuditQtyMismatchVisible = false;
        this.qtyMismatchAuditList = [];
        this.pendingWhAuditId = null;
        this.pendingWhAuditExpectedUpdateTime = null;
        this.getList();
        this.$modal.msgSuccess('审核成功！');
      });
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要审核的数据");
        return;
      }
      this.$modal
        .confirm('确定要审核选中的"' + ids.length + '"条数据项？')
        .then(() => {
          const checkTasks = ids.map((id) =>
            checkStocktakingQty({ id }).then((res) => {
              const mismatches = (res && res.data) || [];
              return { id, needManualConfirm: mismatches.length > 0 };
            })
          );
          return Promise.all(checkTasks);
        })
        .then((checkResults) => {
          const rowById = new Map((this.inList || []).map((r) => [r.id, r]));
          const canAuditIds = (checkResults || []).filter((r) => !r.needManualConfirm).map((r) => r.id);
          const blockedIds = (checkResults || []).filter((r) => r.needManualConfirm).map((r) => r.id);
          if (!canAuditIds.length) {
            this.$modal.msgWarning('所选单据均存在需逐条确认的数量差异，请改用单条审核处理。');
            return null;
          }
          return Promise.all(
            canAuditIds.map((id) =>
              auditStocktaking({ id, expectedUpdateTime: (rowById.get(id) || {}).updateTime || (rowById.get(id) || {}).createTime })
            )
          ).then(() => ({
            blockedIds,
            auditedCount: canAuditIds.length
          }));
        })
        .then((result) => {
          if (!result) return;
          this.getList();
          if (result.blockedIds && result.blockedIds.length) {
            this.$modal.msgWarning(
              '已审核' + result.auditedCount + '条；以下单据需单条逐条确认后审核：' + result.blockedIds.join('、')
            );
            return;
          }
          this.$modal.msgSuccess('批量审核成功！');
        })
        .catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      if (row && (row.stockStatus === 2 || row.stockStatus === '2')) {
        this.$modal.msgWarning('已审核的盘点单不可修改');
        return;
      }
      const id = row.id || this.ids;
      this.loadStocktakingDetail(id, row, { title: '修改盘点', action: true });
    },
    /** 提交按钮 */
    submitForm() {
      if (this.stocktakingHeadAudited) {
        this.$modal.msgWarning('已审核的盘点单不可保存');
        return;
      }
      this.$refs["form"].validate(valid => {
        if (!valid) return;
        if (!this.stkIoStocktakingEntryList || this.stkIoStocktakingEntryList.length === 0) {
          this.$modal.msgWarning('请至少添加一条盘点明细');
          return;
        }
        if (this.submitLoading) return;
        this.doSubmitStocktakingForm();
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const rowId = row && row.id;
      this.$modal.confirm('是否确认删除盘点编号为"' + ids + '"的数据项？')
        .then(() => {
          this.rowActionLoadingId = rowId || ids;
          return delStocktaking(ids);
        })
        .then(() => {
          if (rowId) {
            const prevLen = (this.inList || []).length;
            this.inList = (this.inList || []).filter((r) => r.id !== rowId);
            if (this.inList.length < prevLen) {
              this.total = Math.max(0, (this.total || 0) - 1);
            } else {
              this.getList();
            }
          } else {
            this.getList();
          }
          this.$modal.msgSuccess("删除成功");
        })
        .catch(() => {})
        .finally(() => {
          this.rowActionLoadingId = null;
        });
    },
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 明细表行 class：序号 + 勾选高亮（与到货验收一致） */
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowStkIoStocktakingEntryIndex({ row, rowIndex });
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** 盘点明细添加按钮操作 */
    handleAddStkIoStocktakingEntry() {
      let obj = {};
      obj.commodityId = "";
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
      this.stkIoStocktakingEntryList.push(obj);
    },
    /** 盘点明细删除按钮操作 */
    handleDeleteStkIoStocktakingEntry() {
      if (!this.detailEditable) {
        this.$modal.msgWarning('已审核的盘点单不可删除明细');
        return;
      }
      if (this.checkedStkIoStocktakingEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的盘点明细数据");
      } else {
        const stkIoStocktakingEntryList = this.stkIoStocktakingEntryList;
        const checkedStkIoStocktakingEntry = this.checkedStkIoStocktakingEntry;
        this.stkIoStocktakingEntryList = stkIoStocktakingEntryList.filter(function(item) {
          return checkedStkIoStocktakingEntry.indexOf(item.index) == -1
        });
        this.checkedStkIoStocktakingEntry = [];
        this.detailSelectedRowMap = {};
      }
    },
    /** 单行删除明细 */
    handleDeleteDetailRow(row) {
      if (!this.detailEditable) {
        this.$modal.msgWarning('已审核的盘点单不可删除明细');
        return;
      }
      const idx = this.stkIoStocktakingEntryList.indexOf(row);
      if (idx >= 0) {
        this.stkIoStocktakingEntryList.splice(idx, 1);
        this.detailSelectedRowMap = {};
        this.checkedStkIoStocktakingEntry = [];
      }
    },
    /** 盘点初始化前：同仓库是否存在其他未审核盘点单 */
    async assertNoPendingWhStocktakingForInit() {
      try {
        const res = await listStocktaking({
          warehouseId: this.form.warehouseId,
          stockStatus: 1,
          stockType: '501',
          pageNum: 1,
          pageSize: 50
        });
        const rows = (res && res.rows) || [];
        const currentId = this.form && this.form.id != null ? String(this.form.id) : null;
        const pending = rows.filter((r) => {
          if (!r) return false;
          if (currentId && r.id != null && String(r.id) === currentId) return false;
          const s = r.stockStatus;
          return s !== 2 && s !== '2';
        });
        if (pending.length > 0) {
          const stockNo = pending[0].stockNo || String(pending[0].id || '');
          this.$modal.msgWarning(`你有盘点单，单号（${stockNo}）未处理！请先处理。`);
          return true;
        }
        return false;
      } catch (e) {
        this.$modal.msgError('检查未审核盘点单失败，请稍后重试');
        return true;
      }
    },
    /** 盘点初始化 */
    async handleStocktakingInit() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      if (await this.assertNoPendingWhStocktakingForInit()) {
        return;
      }

      // 显示确认对话框
      this.$modal.confirm('确定要初始化盘点数据吗？这将加载该仓库的所有库存数据。').then(() => {
        // 显示loading
        const loading = this.$loading({
          lock: true,
          text: '正在加载库存数据，请稍候...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        // 清空现有明细
        this.stkIoStocktakingEntryList = [];
        
        // 设置超时，防止无限等待
        const timeoutId = setTimeout(() => {
          loading.close();
          this.$message({ 
            message: '加载超时，请检查网络连接或联系管理员', 
            type: 'error' 
          });
        }, 30000); // 30秒超时
        
        // 获取该仓库的所有库存（获取所有批次明细）
        const queryParams = {
          warehouseId: this.form.warehouseId,
          pageNum: 1,
          pageSize: 10000  // 增大pageSize，确保获取所有批次的库存明细
        };
        
        listPDFilter(queryParams).then(response => {
          clearTimeout(timeoutId);
          
          console.log('盘点初始化响应数据:', response);
          let inventoryList = response.rows || response.data || [];
          
          // 过滤数据：只保留该仓库且数量大于0的库存
          const warehouseId = String(this.form.warehouseId);
          inventoryList = inventoryList.filter((item) => {
            // 检查仓库ID是否匹配（使用宽松比较，支持字符串和数字）
            const itemWarehouseId = String((item.warehouse && item.warehouse.id) || item.warehouseId || '');
            // 检查数量是否大于0
            const qty = parseFloat(item.qty) || 0;
            return itemWarehouseId === warehouseId && qty > 0;
          });
          
          console.log('过滤后的库存数据:', inventoryList.length, inventoryList);
          
          if (!inventoryList || inventoryList.length === 0) {
            loading.close();
            this.$message({ 
              message: '该仓库暂无库存数据', 
              type: 'warning' 
            });
            return;
          }
          
          // 直接处理数据，保留完整的item对象，特别是material对象；item.id 为 stk_inventory.id，存为 kcNo 供盈亏审核按库存主键查
          const newList = [];
          inventoryList.forEach((item) => {
            let obj = {};
            obj.kcNo = item.id;
            // 保留完整的material对象，包括所有关联对象
            obj.materialId = (item.material && item.material.id) || item.materialId;
            obj.material = item.material || {};
            obj.stockQty = parseFloat(item.qty) || 0;  // 盘点数量初始化为库存数量
            obj.qty = parseFloat(item.qty) || 0;  // 库存数量
            obj.profitQty = 0;  // 盈亏数量初始化为0
            obj.price = parseFloat(item.unitPrice) || 0;
            obj.stockAmount = (obj.qty * obj.price);  // 盘点金额 = 盘点数量 * 单价
            obj.profitAmount = 0;
            obj.amt = parseFloat(item.amt) || (obj.qty * obj.price);
            obj.batchNo = item.batchNo || '';
            obj.batchNumber = item.batchNumber || item.materialNo || '';
            obj.beginTime = item.beginTime || item.materialDate || '';
            obj.endTime = item.endTime || '';
            obj.remark = item.remark || '';
            
            newList.push(obj);
          });
          
          // 一次性赋值，避免频繁触发响应式更新
          this.stkIoStocktakingEntryList = newList;
          
          loading.close();
          this.$message({ 
            message: `已加载 ${inventoryList.length} 条库存数据`, 
            type: 'success' 
          });
          
        }).catch(error => {
          clearTimeout(timeoutId);
          loading.close();
          console.error('获取库存数据失败:', error);
          this.$message({ 
            message: '获取库存数据失败：' + (error.msg || error.message || '请重试'), 
            type: 'error' 
          });
        });
      }).catch(() => {
        // 用户取消了操作
      });
    },
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index);
      const pageIndices = (this.stkIoStocktakingEntryList || []).map((row, idx) => idx);
      pageIndices.forEach((idx) => {
        if (this.detailSelectedRowMap[idx]) {
          this.$delete(this.detailSelectedRowMap, idx);
        }
      });
      (selection || []).forEach((row) => {
        const idx = this.stkIoStocktakingEntryList.indexOf(row);
        if (idx >= 0) {
          this.$set(this.detailSelectedRowMap, idx, true);
        }
      });
    },
    /** 导出：与出退库明细表同款版式（合并标题、宋体、边框、空行、合计红色） */
    async handleExport() {
      const exportQuery = { ...this.queryParams };
      delete exportQuery.pageNum;
      delete exportQuery.pageSize;
      exportQuery.stockType = "501";
      this.loading = true;
      try {
        const response = await listWhStocktakingExportRows(exportQuery);
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const whName = rows[0] && rows[0].warehouseName ? rows[0].warehouseName : '';
        const whSuffix = whName ? `_${whName}` : '';
        await exportWhStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          warehouseName: whName,
          fileName: `仓库盘点明细表${whSuffix}_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 单行导出（同上版式） */
    async handleExportRow(row) {
      this.loading = true;
      try {
        const response = await listWhStocktakingExportRows({
          stockNo: row.stockNo,
          stockType: this.queryParams.stockType || '501',
        });
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const whName = (row.warehouse && row.warehouse.name) || (rows[0] && rows[0].warehouseName) || '';
        await exportWhStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          warehouseName: whName,
          fileName: `仓库盘点明细表_${whName || row.stockNo}_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      // TODO: 实现打印功能
      this.$modal.msgInfo("打印功能待实现");
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
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor {
  width: 150px !important;
  max-width: 150px !important;
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

/* 盘点申请专用 */
.local-modal-content .stocktaking-modal-head-form .head-label-nowrap ::v-deep .el-form-item__label {
  white-space: nowrap;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table th.col-his-id-header .cell {
  white-space: nowrap !important;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非scoped确保生效） */
.app-container.stocktaking-profit-page {
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

.app-container.stocktaking-profit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.stocktaking-profit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.stocktaking-profit-page .list-query-panel,
.app-container.stocktaking-profit-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.stocktaking-profit-page .apply-table-panel {
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

.app-container.stocktaking-profit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .apply-pagination-wrap .pagination-container {
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

.app-container.stocktaking-profit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__header-wrapper th,
.app-container.stocktaking-profit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.stocktaking-profit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.stocktaking-profit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.stocktaking-profit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.stocktaking-profit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.stocktaking-profit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.stocktaking-profit-page .apply-main-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.stocktaking-profit-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

.app-container.stocktaking-profit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.stocktaking-profit-page .apply-main-table th.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table th.el-table-column--selection,
.app-container.stocktaking-profit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-profit-page .apply-main-table td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .apply-main-table th.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.stocktaking-profit-page .apply-main-table th.apply-action-col,
.app-container.stocktaking-profit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-profit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr > td,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.stocktaking-profit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.stocktaking-profit-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/* 弹窗明细框：与到货验收 apply-modal-table-panel 一致（铺满、无左右圆角边框） */
.app-container.stocktaking-profit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.app-container.stocktaking-profit-page .local-modal-content .apply-modal-table-panel {
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
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表滚动条：与到货验收一致（横向 12px，无两端箭头） */
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-button,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-button {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

/* 明细表勾选列 sticky */
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

/* 弹窗明细表：悬停 / 勾选行高亮（与到货验收、退货申请一致） */
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected:hover > td,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.stocktaking-profit-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

/* 合计行始终显示，样式与到货验收一致（表头同色灰蓝底） */
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
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

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:first-child,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:first-child {
  border-left: 1px solid #e2e8f0 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr td:last-child,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr td:last-child {
  border-right: 1px solid #e2e8f0 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell:empty,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell:empty {
  padding: 0;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table-column--selection .cell {
  font-size: 0;
}

/* 修改退库弹窗明细：名称/规格/型号最多两行，行高随内容；悬停 title 看全文 */
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 6px;
  padding-bottom: 6px;
}
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.45;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
}
</style>

