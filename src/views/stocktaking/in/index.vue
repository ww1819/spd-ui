<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="业务单号" prop="stockNo" label-width="100px">
            <el-input v-model="queryParams.stockNo"
                      placeholder="业务单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="制单日期" prop="stockDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.stockDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择制单日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>

        <el-col :span="6" label-width="100px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>

      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-upload2"
          size="small"
          @click="openProfitImportDialog"
          v-hasPermi="['stocktaking:in:add']"
        >导入盘盈明细</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inList" @selection-change="handleSelectionChange" height="54vh" border stripe>
      <el-table-column label="业务单号" align="center" prop="stockNo" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="stockStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点类型" align="center" prop="stockType" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-dropdown v-if="scope.row.stockStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['stocktaking:in:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['stocktaking:in:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['stocktaking:in:remove']"
              >删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>


      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="stockStatus" label-width="100px">
              <el-select v-model="form.stockStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId" label-width="100px">
              <SelectSupplier v-model="form.supplerId" :disabled="true" />
            </el-form-item>

          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="stockDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.stockDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseLockedByAction"/>
            </el-form-item>

          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="盘点类型" prop="stockType" label-width="100px">
              <el-select v-model="form.stockType" placeholder="请选择盘点类型"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8 wh-stocktaking-detail-toolbar">
          <el-col :span="24">
            <div class="wh-stocktaking-detail-toolbar-inner">
              <span>盘点明细信息</span>
              <div v-show="detailEditable" class="wh-stocktaking-detail-toolbar-actions">
                <el-button type="primary" icon="el-icon-minus" size="small" @click="openAddLossEntry">新增盘亏明细</el-button>
                <el-button type="warning" icon="el-icon-plus" size="small" @click="openAddProfitEntry">新增盘盈明细</el-button>
                <el-button
                  type="primary"
                  icon="el-icon-refresh"
                  size="small"
                  :loading="whInventoryInitLoading"
                  :disabled="(stkIoStocktakingEntryList || []).length > 0"
                  @click="handleStocktakingInitFromWarehouseInventory"
                >盘点初始化</el-button>
                <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
              </div>
              <div class="wh-stocktaking-detail-toolbar-filters">
                <el-select
                  v-model="detailFilterCounted"
                  size="small"
                  clearable
                  placeholder="是否已盘"
                  class="wh-detail-filter-counted"
                >
                  <el-option label="已盘" :value="1" />
                  <el-option label="未盘" :value="0" />
                </el-select>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-table :data="filteredWhStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" height="calc(42vh)" border>
          <el-table-column v-if="detailEditable" type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材名称" prop="materialId" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-if="!scope.row.kcNo && action" v-model="scope.row.materialId" :value2="isShow"/>
              <span v-else>{{ scope.row.material ? (scope.row.material.name || '--') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="material.speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.speci || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdUnit">{{ scope.row.material.fdUnit.unitName || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <el-table-column label="明细账面数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatEntryQtyDisplay(scope.row, 'qty') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="实盘数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-if="detailEditable"
                v-model="scope.row.stockQty"
                type="number"
                :disabled="isEntryStockQtyLocked(scope.row)"
                @input="stockQtyChangeWh(scope.row)"
                @blur="handleStockQtyBlur(scope.row)"
                placeholder="实盘数量"
              />
              <span v-else>{{ formatEntryQtyDisplay(scope.row, 'stockQty') }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!action" label="当前库存数量" width="120" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatEntryCurrentInventoryQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" width="110" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏标志" align="center" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatProfitLossFlag(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已盘" width="72" align="center" resizable>
            <template slot-scope="scope">
              <el-checkbox
                :true-label="1"
                :false-label="0"
                v-model="scope.row.countedFlag"
                :disabled="!action || stocktakingHeadAudited || whEntryCountedCheckboxDisabled(scope.row)"
                @change="(v) => onWhEntryCountedChange(scope.row, v)"
              />
            </template>
          </el-table-column>
          <el-table-column v-if="detailEditable" label="盘盈复制" width="96" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyDetailToProfitDialog(scope.row)">盘盈复制</el-button>
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="!scope.row.kcNo && detailEditable" v-model="scope.row.price" type="number" @input="priceChange(scope.row)" placeholder="单价" />
              <span v-else>{{ scope.row.unitPrice != null ? parseFloat(scope.row.unitPrice).toFixed(2) : (scope.row.price != null ? parseFloat(scope.row.price).toFixed(2) : '--') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="金额" />
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="批次号" />
            </template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" prop="hisId" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.hisId || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="第三方批次号" prop="thirdPartyBatchNo" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.thirdPartyBatchNo || '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="供应商" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectSupplier
                v-if="!scope.row.kcNo && detailEditable"
                :value="scope.row.supplierId"
                finance-pick-mode
                placeholder="请选择供应商"
                style="width: 100%"
                @input="(v) => $set(scope.row, 'supplierId', v)"
              />
              <span v-else>{{ formatEntrySupplierName(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
              <span v-else>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-if="detailEditable"
                clearable
                v-model="scope.row.beginTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择出库日期"
              />
              <span v-else>{{ scope.row.beginTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker
                v-if="detailEditable"
                clearable
                v-model="scope.row.endTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择出库日期"
              />
              <span v-else>{{ scope.row.endTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="detailEditable" v-model="scope.row.remark" placeholder="备注" />
              <span v-else>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
        </el-table>
            </el-form>
            <div class="modal-footer" v-show="detailEditable">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

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
      custom-class="profit-pending-dialog"
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="1080px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small" v-loading="profitNameSpecStockLoading">
        <el-table-column label="耗材编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" placeholder="请输入盘点数量" @input="stockQtyChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="110" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatProfitNameSpecStockQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="340" width="360">
          <template slot-scope="scope">
            <div class="profit-batch-cell">
              <el-input
                v-model="scope.row.batchNumber"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 14 }"
                :disabled="scope.row._batchLocked"
                placeholder="请输入批号"
                class="profit-batch-textarea"
                @input="onProfitBatchNumberInput(scope.row)"
              />
              <div class="profit-batch-checks">
                <el-checkbox v-model="scope.row._cbBatchNone" @change="() => profitBatchNoneChange(scope.row)">无</el-checkbox>
                <el-checkbox v-model="scope.row._cbBatchUnknown" @change="() => profitBatchUnknownChange(scope.row)">未知</el-checkbox>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="240">
          <template slot-scope="scope">
            <div class="profit-expiry-cell">
              <el-date-picker
                v-model="scope.row.endTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择"
                :disabled="scope.row._longTerm"
                style="width: 150px"
                @change="onProfitExpiryManualChange(scope.row)"
              />
              <el-checkbox v-model="scope.row._longTerm" @change="profitLongTermChange(scope.row)">长期</el-checkbox>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="140">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.beginTime" type="date" value-format="yyyy-MM-dd" placeholder="可不填" />
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="220">
          <template slot-scope="scope">
            <SelectSupplier
              :value="scope.row.supplierId"
              finance-pick-mode
              placeholder="请选择供应商"
              style="width: 100%"
              @input="(v) => $set(scope.row, 'supplierId', v)"
            />
            <div v-if="scope.row.material && scope.row.material.supplierId" style="margin-top: 4px; color: #909399; font-size: 12px;">
              默认：{{ (scope.row.material.supplier && scope.row.material.supplier.name) || ('档案ID ' + scope.row.material.supplierId) }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" @click="confirmPendingNewEntries">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="保存前确认（明细库存与仓库实物不一致）"
      :visible.sync="saveQtyConfirmVisible"
      width="1020px"
      append-to-body
      :close-on-click-modal="false"
      v-loading="saveQtyConfirmLoading"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细「账面数量(qty)」与当前仓库库存不一致，请逐条点击「确定」确认；确认后将把明细账面更新为当前仓库数量，并重新计算金额。「盈亏数量」= 盘点数量 − 明细账面（第一列）。普通盘盈/盘亏（仅盘点与账面不同、但与仓库实时库存一致）不会进入本表。
      </div>
      <el-table :data="saveQtyConfirmList" border size="small">
        <el-table-column label="耗材编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.material && scope.row.material.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="72" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="140" />
        <el-table-column label="明细账面数量" prop="detailQty" width="120" align="center" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="120" align="center" />
        <el-table-column label="盘点数量" min-width="100" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.adjustedStockQty != null && scope.row.adjustedStockQty !== '' ? scope.row.adjustedStockQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏数量" width="120">
          <template slot-scope="scope">
            <span>{{ formatWhSaveConfirmProfitQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhSaveQtyRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="saveQtyConfirmVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmWhSaveQtyAndSubmit">确 定</el-button>
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
        <el-button @click="profitImport.visible = false">取 消</el-button>
        <el-button
          type="primary"
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
        以下明细账面库存与当前仓库库存不一致，请逐条确认盘点数量后再审核。来源于仓库库存的明细仅允许盘亏，盘点数量不得大于当前库存。
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
        <el-button @click="whAuditQtyMismatchVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmWhAuditQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listStocktaking, getStocktaking, delStocktaking, addStocktaking, patchSaveStocktaking, auditStocktaking, checkStocktakingQty, updateStocktakingEntryCounted, appendStocktakingEntries, initWarehouseStocktakingFromInventory, previewWhStocktakingProfitImport, confirmWhStocktakingProfitImport, downloadWhStocktakingProfitImportTemplate } from "@/api/warehouse/stocktaking";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listInventoryPick, listInventoryStocktakingProfitQtySummary } from "@/api/warehouse/inventory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectInventory from "@/components/SelectModel/SelectInventory";
import SelectDepInventory from "@/components/SelectModel/SelectDepInventory";
import { sortInventoryRowsByNameSpecCodeMaterialId } from "@/utils/stocktakingInventorySort";

export default {
  name: "InStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectInventory,SelectDepInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      dialogInvShow: false,
      dialogDepShow: false,
      whInventoryInitLoading: false,
      stocktakingBatchSeqCounter: 0,
      newEntryDialogVisible: false,
      pendingNewEntries: [],
      profitNameSpecStockMap: {},
      profitNameSpecStockLoading: false,
      supplierValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoStocktakingEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
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
      saveQtyConfirmVisible: false,
      saveQtyConfirmList: [],
      saveQtyConfirmLoading: false,
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
      /** 仅「新增盘点」弹窗内自动保存；修改/查看打开后为 false */
      stocktakingAutoSaveEnabled: false,
      entrySaveSnapshots: null,
      /** 明细是否已盘：null 全部，1 已盘，0 未盘（仅前端筛选表格） */
      detailFilterCounted: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        supplerId: null,
        stockDate: null,
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
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "change" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  watch: {
    newEntryDialogVisible(val) {
      if (val) {
        this.$nextTick(() => this.refreshProfitNameSpecStockWh());
      }
    },
    detailFilterCounted() {
      this.clearWhEntryTableSelection();
    }
  },
  computed: {
    warehouseLockedByAction() {
      return Array.isArray(this.stkIoStocktakingEntryList) && this.stkIoStocktakingEntryList.length > 0;
    },
    stocktakingHeadAudited() {
      const s = this.form && this.form.stockStatus;
      return s === 2 || s === '2';
    },
    detailEditable() {
      return this.action && !this.stocktakingHeadAudited;
    },
    /** 明细表格展示数据（是否已盘筛选）；保存仍用完整 stkIoStocktakingEntryList */
    filteredWhStocktakingEntryList() {
      const list = this.stkIoStocktakingEntryList || [];
      const countedRaw = this.detailFilterCounted;
      const countedFilter =
        countedRaw === 0 || countedRaw === '0'
          ? 0
          : countedRaw === 1 || countedRaw === '1'
            ? 1
            : null;
      const rowCounted = (row) => {
        if (!row) return 0;
        const v = row.countedFlag;
        return v === 1 || v === '1' ? 1 : 0;
      };
      if (countedFilter === null) {
        return list;
      }
      return list.filter((row) => rowCounted(row) === countedFilter);
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
    formatEntryQtyDisplay(row, field) {
      if (!row) return '0';
      const v = row[field];
      if (v == null || v === '') return '0';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '0';
    },
    formatEntryCurrentInventoryQty(row) {
      if (!row) return '--';
      if (row._currentInventoryQtyLoading) return '加载中…';
      const v = row._currentInventoryQty;
      if (v == null || v === '') return '--';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '--';
    },
    /** 查看时拉取仓库实时库存，与明细账面、实盘数量分列展示 */
    async hydrateWhEntryCurrentInventoryQty() {
      const list = this.stkIoStocktakingEntryList || [];
      list.forEach((row) => {
        if (!row) return;
        this.$set(row, '_currentInventoryQty', null);
        this.$set(row, '_currentInventoryQtyLoading', true);
      });
      const warehouseId = this.form && this.form.warehouseId;
      let invById = null;
      try {
        if (warehouseId != null && warehouseId !== '') {
          const invRows = await this._fetchAllWhInventoryPickForSaveQtyCheck(warehouseId);
          invById = new Map();
          (invRows || []).forEach((inv) => {
            if (inv && inv.id != null) {
              invById.set(String(inv.id), inv);
            }
          });
        }
        for (const row of list) {
          if (!row) continue;
          let live = null;
          if (row.kcNo != null && row.kcNo !== '') {
            const idStr = String(row.kcNo);
            if (invById && invById.has(idStr)) {
              const inv = invById.get(idStr);
              live = inv && inv.qty != null && inv.qty !== '' ? inv.qty : 0;
            } else if (!invById) {
              const idNum = parseInt(idStr, 10);
              if (Number.isFinite(idNum)) {
                try {
                  const res = await listInventoryPick({ id: idNum, pageNum: 1, pageSize: 1 });
                  const pickRows = (res && res.rows) || [];
                  if (pickRows[0] && pickRows[0].qty != null && pickRows[0].qty !== '') {
                    live = pickRows[0].qty;
                  }
                } catch (e) {
                  live = null;
                }
              }
            }
          }
          this.$set(row, '_currentInventoryQty', live);
          this.$set(row, '_currentInventoryQtyLoading', false);
        }
      } catch (e) {
        list.forEach((row) => {
          if (!row) return;
          this.$set(row, '_currentInventoryQty', null);
          this.$set(row, '_currentInventoryQtyLoading', false);
        });
      }
    },
    clearWhEntryTableSelection() {
      this.checkedStkIoStocktakingEntry = [];
      this.$nextTick(() => {
        const t = this.$refs.stkIoStocktakingEntry;
        if (t && typeof t.clearSelection === 'function') {
          t.clearSelection();
        }
      });
    },
    normalizeLoadedEntries(list) {
      (list || []).forEach((row) => {
        if (!row) return;
        if (row.countedFlag == null || row.countedFlag === '') {
          row.countedFlag = 0;
        } else {
          row.countedFlag = Number(row.countedFlag) === 1 ? 1 : 0;
        }
        if (row.stockQty == null || row.stockQty === '') {
          row.stockQty = row.qty != null && row.qty !== '' ? row.qty : 0;
        }
        const u = row.unitPrice != null && row.unitPrice !== '' ? row.unitPrice : null;
        const p = row.price != null && row.price !== '' ? row.price : null;
        const v = u != null ? u : p;
        if (v != null && v !== '') {
          row.unitPrice = v;
          row.price = v;
        }
        if (!row.kcNo && (row.supplierId == null || row.supplierId === '') && row.material && row.material.supplierId) {
          row.supplierId = row.material.supplierId;
        }
        const up = parseFloat(row.unitPrice != null && row.unitPrice !== '' ? row.unitPrice : row.price || 0);
        const sq = parseFloat(row.stockQty || 0);
        const a = sq * (Number.isFinite(up) ? up : 0);
        row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
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
        countedFlag: Number(row.countedFlag) === 1 ? 1 : 0
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
        const countedChanged = cur.countedFlag !== old.countedFlag;
        if (!stockChanged && !qtyChanged && !countedChanged) return;
        const p = { id: row.id };
        if (stockChanged) p.stockQty = cur.stockQty;
        if (qtyChanged) p.bookQty = cur.qty;
        if (countedChanged) p.countedFlag = cur.countedFlag;
        patches.push(p);
      });
      return patches;
    },
    /** 并发校验：主表 updateTime；历史数据未写 update_time 时与后端一致回退 createTime */
    whStocktakingClientVersionTime() {
      return this.form.updateTime || this.form.createTime;
    },
    buildPatchSavePayload() {
      return {
        id: this.form.id,
        stockDate: this.form.stockDate,
        remark: this.form.remark,
        isMonthInit: this.form.isMonthInit,
        expectedUpdateTime: this.whStocktakingClientVersionTime(),
        entryPatches: this.collectEntryQtyPatches(this.stkIoStocktakingEntryList)
      };
    },
    nextStocktakingBatchNo() {
      this.stocktakingBatchSeqCounter = (this.stocktakingBatchSeqCounter || 0) + 1;
      const d = new Date();
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      const ts =
        d.getFullYear() +
        p(d.getMonth() + 1) +
        p(d.getDate()) +
        p(d.getHours()) +
        p(d.getMinutes()) +
        p(d.getSeconds());
      return 'PC' + ts + String(this.stocktakingBatchSeqCounter).padStart(4, '0');
    },
    mapWhInventoryToStocktakingEntry(item) {
      const book = item.qty != null && item.qty !== '' ? item.qty : 0;
      const up =
        item.unitPrice != null && item.unitPrice !== ''
          ? item.unitPrice
          : item.price != null && item.price !== ''
            ? item.price
            : null;
      const stockQty = book;
      const unitPriceNum = parseFloat(up || 0);
      const amt = (parseFloat(stockQty) || 0) * (Number.isFinite(unitPriceNum) ? unitPriceNum : 0);
      /** 盘点初始化 / 选仓库库存：供应商仅 stk_inventory.supplier_id 及 join 的 item.supplier，不用 fd_material 上的 supplier */
      const baseMat = item.material || null;
      let material = baseMat;
      if (baseMat) {
        material = { ...baseMat };
        delete material.supplier;
        if (
          item.supplier &&
          ((item.supplier.name != null && item.supplier.name !== '') || item.supplier.id != null)
        ) {
          material.supplier = item.supplier;
        }
      }
      const supplierIdFromInv =
        item.supplierId != null && item.supplierId !== ''
          ? item.supplierId
          : item.supplier && item.supplier.id != null
            ? item.supplier.id
            : null;
      return {
        kcNo: item.id,
        materialId: item.materialId,
        material,
        supplierId: supplierIdFromInv,
        unitPrice: up,
        price: up,
        qty: book,
        stockQty,
        amt: amt.toFixed(2),
        batchNo: item.batchNo || '',
        batchNumber: item.batchNumber || item.materialNo || '',
        hisId: item.hisId != null && item.hisId !== '' ? String(item.hisId).trim() : '',
        thirdPartyBatchNo: item.thirdPartyBatchNo != null && item.thirdPartyBatchNo !== ''
          ? String(item.thirdPartyBatchNo).trim()
          : '',
        beginTime: item.beginTime ? (typeof item.beginTime === 'string' ? item.beginTime : this.parseTime(item.beginTime, '{y}-{m}-{d}')) : '',
        endTime: item.endTime ? (typeof item.endTime === 'string' ? item.endTime : this.parseTime(item.endTime, '{y}-{m}-{d}')) : '',
        remark: '',
        countedFlag: 0
      };
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
        if (!k) {
          skip += 1;
          return;
        }
        if (exists.has(k)) {
          skip += 1;
          return;
        }
        exists.add(k);
        toAdd.push(r);
      });
      if (toAdd.length) {
        this.stkIoStocktakingEntryList.push(...toAdd);
        this.$nextTick(() => this.attemptAutoSaveAfterStocktakingDetailChange(true));
      }
      if (skip) {
        this.$modal.msgWarning(`已过滤 ${skip} 条重复或无效的仓库库存明细`);
      }
    },
    selectProfitMaterialData(val) {
      const rows = (val || []).map((row) => {
        const mat = row.material || null;
        const materialPrice =
          mat && mat.price != null && mat.price !== ''
            ? mat.price
            : mat && mat.salePrice != null && mat.salePrice !== ''
              ? mat.salePrice
              : null;
        const rowPrice =
          row.unitPrice != null && row.unitPrice !== ''
            ? row.unitPrice
            : row.price != null && row.price !== ''
              ? row.price
              : null;
        const effectivePrice =
          materialPrice != null && materialPrice !== '' ? materialPrice : rowPrice;
        return {
          materialId: row.materialId != null ? row.materialId : mat && mat.id,
          material: mat,
          supplierId: mat && mat.supplierId != null && mat.supplierId !== '' ? mat.supplierId : null,
          unitPrice: effectivePrice,
          price: effectivePrice,
          qty: 0,
          stockQty: 1,
          amt: '0.00',
          batchNo: this.nextStocktakingBatchNo(),
          batchNumber: '',
          beginTime: '',
          endTime: '',
          remark: '',
          countedFlag: 1
        };
      });
      rows.forEach((r) => this.initProfitPendingEntryMeta(r));
      rows.forEach((r) => this.stockQtyChangePending(r));
      this.pendingNewEntries = rows;
      this.newEntryDialogVisible = rows.length > 0;
    },
    initProfitPendingEntryMeta(row) {
      if (!row) return;
      const b = row.batchNumber != null ? String(row.batchNumber).trim() : "";
      const isNone = b === "无";
      const isUnknown = b === "未知";
      this.$set(row, "_cbBatchNone", isNone);
      this.$set(row, "_cbBatchUnknown", isUnknown);
      this.$set(row, "_batchLocked", isNone || isUnknown);
      const et = row.endTime != null ? String(row.endTime).trim() : "";
      this.$set(row, "_longTerm", et === "2099-01-01");
    },
    profitBatchNoneChange(row) {
      if (row._cbBatchNone) {
        row._cbBatchUnknown = false;
        row.batchNumber = "无";
        row._batchLocked = true;
      } else {
        if (String(row.batchNumber || "").trim() === "无") {
          row.batchNumber = "";
        }
        row._batchLocked = !!row._cbBatchUnknown;
      }
    },
    profitBatchUnknownChange(row) {
      if (row._cbBatchUnknown) {
        row._cbBatchNone = false;
        row.batchNumber = "未知";
        row._batchLocked = true;
      } else {
        if (String(row.batchNumber || "").trim() === "未知") {
          row.batchNumber = "";
        }
        row._batchLocked = !!row._cbBatchNone;
      }
    },
    onProfitBatchNumberInput(row) {
      if (row._batchLocked) return;
      const t = String(row.batchNumber || "").trim();
      row._cbBatchNone = t === "无";
      row._cbBatchUnknown = t === "未知";
    },
    profitLongTermChange(row) {
      if (row._longTerm) {
        row.endTime = "2099-01-01";
      } else if (String(row.endTime || "").trim() === "2099-01-01") {
        row.endTime = "";
      }
    },
    onProfitExpiryManualChange(row) {
      if (String(row.endTime || "").trim() === "2099-01-01") {
        row._longTerm = true;
      } else {
        row._longTerm = false;
      }
    },
    formatDateYmdForProfitCopy(value) {
      if (value == null || value === "") return "";
      if (typeof value === "string") {
        const s = value.trim();
        return s.length >= 10 ? s.slice(0, 10) : s;
      }
      try {
        return this.parseTime(value, "{y}-{m}-{d}");
      } catch (e) {
        return "";
      }
    },
    getProfitNameSpecKey(row) {
      const m = row && row.material ? row.material : null;
      const name = m && m.name != null ? String(m.name).trim() : "";
      const spec = m && m.speci != null ? String(m.speci).trim() : "";
      return `${name}||${spec}`;
    },
    formatEntrySupplierName(row) {
      if (!row) return '--';
      if (row.material && row.material.supplier && row.material.supplier.name) {
        return row.material.supplier.name;
      }
      if (row.supplierId != null && row.supplierId !== '') {
        return '供应商ID ' + row.supplierId;
      }
      return '--';
    },
    formatProfitNameSpecStockQty(row) {
      const k = this.getProfitNameSpecKey(row);
      if (!k || k === "||") return "--";
      const v = this.profitNameSpecStockMap[k];
      if (v == null || !Number.isFinite(v)) return "0";
      const n = Number(v);
      return Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(2);
    },
    async refreshProfitNameSpecStockWh() {
      if (!this.newEntryDialogVisible || !this.form.warehouseId) {
        this.profitNameSpecStockMap = {};
        return;
      }
      this.profitNameSpecStockLoading = true;
      const map = {};
      try {
        const res = await listInventoryStocktakingProfitQtySummary({
          warehouseId: this.form.warehouseId
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        rows.forEach((it) => {
          const name = it.materialName != null ? String(it.materialName).trim() : "";
          const spec = it.materialSpeci != null ? String(it.materialSpeci).trim() : "";
          const key = `${name}||${spec}`;
          const q = parseFloat(it.materialQty);
          const add = Number.isFinite(q) ? q : 0;
          map[key] = (map[key] || 0) + add;
        });
        this.profitNameSpecStockMap = map;
      } catch (e) {
        this.profitNameSpecStockMap = {};
      } finally {
        this.profitNameSpecStockLoading = false;
      }
    },
    /** 盘盈复制：将被复制源行标为已盘（有明细 id 时同步服务端） */
    markSourceRowCountedAfterProfitCopy(detailRow) {
      if (!detailRow || Number(detailRow.countedFlag) === 1) {
        return Promise.resolve();
      }
      this.$set(detailRow, "countedFlag", 1);
      if (!detailRow.id) {
        return Promise.resolve();
      }
      const sq = parseFloat(detailRow.stockQty);
      const payload = {
        id: detailRow.id,
        countedFlag: 1,
        expectedUpdateTime: this.whStocktakingClientVersionTime()
      };
      if (Number.isFinite(sq)) {
        payload.stockQty = sq;
      }
      return updateStocktakingEntryCounted(payload)
        .then(() => {
          this.refreshEntrySaveSnapshots(this.stkIoStocktakingEntryList);
        })
        .catch(() => {
          this.$set(detailRow, "countedFlag", 0);
        });
    },
    copyDetailToProfitDialog(detailRow) {
      if (!this.form.warehouseId) {
        this.$message({ message: "请先选择仓库", type: "warning" });
        return;
      }
      this.markSourceRowCountedAfterProfitCopy(detailRow);
      const mid = detailRow.materialId || (detailRow.material && detailRow.material.id);
      if (!mid) {
        this.$modal.msgWarning("当前行缺少耗材信息，无法复制");
        return;
      }
      const mat = detailRow.material ? { ...detailRow.material } : { id: mid };
      const materialPrice =
        mat.price != null && mat.price !== ""
          ? mat.price
          : mat.salePrice != null && mat.salePrice !== ""
            ? mat.salePrice
            : null;
      const unitPrice =
        detailRow.unitPrice != null && detailRow.unitPrice !== ""
          ? detailRow.unitPrice
          : detailRow.price != null && detailRow.price !== ""
            ? detailRow.price
            : materialPrice;
      const batchNumber = detailRow.batchNumber != null ? String(detailRow.batchNumber) : "";
      const endTime = this.formatDateYmdForProfitCopy(detailRow.endTime);
      const beginTime = this.formatDateYmdForProfitCopy(detailRow.beginTime);
      const entry = {
        materialId: mid,
        material: mat,
        supplierId: mat.supplierId || detailRow.supplierId || null,
        unitPrice,
        price: unitPrice,
        qty: 0,
        stockQty: 1,
        amt: "0.00",
        batchNo: this.nextStocktakingBatchNo(),
        batchNumber,
        beginTime,
        endTime,
        remark: "",
        countedFlag: 1
      };
      this.initProfitPendingEntryMeta(entry);
      this.stockQtyChangePending(entry);
      if (!Array.isArray(this.pendingNewEntries)) {
        this.pendingNewEntries = [];
      }
      this.pendingNewEntries.push(entry);
      this.newEntryDialogVisible = true;
      this.$nextTick(() => this.refreshProfitNameSpecStockWh());
    },
    cancelPendingNewEntries() {
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    confirmPendingNewEntries() {
      const invalid = (this.pendingNewEntries || []).find(
        (r) =>
          !r.batchNumber ||
          !r.endTime ||
          r.unitPrice == null ||
          r.unitPrice === '' ||
          r.stockQty == null ||
          r.stockQty === ''
      );
      if (invalid) {
        this.$modal.msgWarning('请完整填写新增明细的批号、有效期、单价、盘点数量');
        return;
      }
      const invalidNum = (this.pendingNewEntries || []).find((r) => {
        const unitPrice = parseFloat(r.unitPrice);
        const stockQty = parseFloat(r.stockQty);
        return !Number.isFinite(unitPrice) || !Number.isFinite(stockQty) || unitPrice < 0 || stockQty <= 0;
      });
      if (invalidNum) {
        this.$modal.msgWarning('单价必须为不小于 0 的数字，盘点数量必须大于 0');
        return;
      }
      const needSup = (this.pendingNewEntries || []).find(
        (r) => r.supplierId == null || r.supplierId === ''
      );
      if (needSup) {
        const name = needSup.material && needSup.material.name ? needSup.material.name : '';
        this.$modal.msgWarning(
          name ? `耗材「${name}」盘盈明细必须选择供应商。` : '盘盈明细必须选择供应商。'
        );
        return;
      }
      const badDate = (this.pendingNewEntries || []).find(
        (r) => r.beginTime && r.endTime && new Date(r.endTime).getTime() < new Date(r.beginTime).getTime()
      );
      if (badDate) {
        this.$modal.msgWarning('有效期不能早于生产日期');
        return;
      }
      (this.pendingNewEntries || []).forEach((r) => {
        delete r._cbBatchNone;
        delete r._cbBatchUnknown;
        delete r._batchLocked;
        delete r._longTerm;
        r.price = r.unitPrice;
        const a = (parseFloat(r.stockQty) || 0) * (parseFloat(r.unitPrice) || 0);
        r.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
        r.kcNo = null;
        r.countedFlag = 1;
      });
      this.stkIoStocktakingEntryList.push(...this.pendingNewEntries);
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
      this.$nextTick(() => this.attemptAutoSaveAfterStocktakingDetailChange(true));
    },
    priceChangePending(row) {
      const a = (parseFloat(row.stockQty) || 0) * (parseFloat(row.unitPrice) || 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
      row.price = row.unitPrice;
    },
    stockQtyChangePending(row) {
      const a = (parseFloat(row.stockQty) || 0) * (parseFloat(row.unitPrice) || 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
      if (row.unitPrice != null && row.unitPrice !== '') {
        row.price = row.unitPrice;
      }
    },
    /** 按当前仓库：服务端生成并保存盘点单+明细后再加载到前端（失败不落库） */
    async handleStocktakingInitFromWarehouseInventory() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      if ((this.stkIoStocktakingEntryList || []).length > 0) {
        this.$modal.msgWarning('盘点单已有明细，请先删除后再进行盘点初始化');
        return;
      }
      this.whInventoryInitLoading = true;
      try {
        const payload = {
          id: this.form.id,
          warehouseId: this.form.warehouseId,
          departmentId: this.form.departmentId,
          stockDate: this.form.stockDate,
          stockStatus: this.form.stockStatus,
          stockType: this.form.stockType != null && this.form.stockType !== '' ? this.form.stockType : 501,
          remark: this.form.remark,
          updateTime: this.whStocktakingClientVersionTime()
        };
        const res = await initWarehouseStocktakingFromInventory(payload);
        const data = res && res.data;
        if (!data) {
          this.$modal.msgError('盘点初始化失败：未返回单据数据');
          return;
        }
        this.stocktakingBatchSeqCounter = 0;
        this.form = data;
        this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
        this.stocktakingAutoSaveEnabled = false;
        this.$modal.msgSuccess(`已生成并保存 ${this.stkIoStocktakingEntryList.length} 条仓库库存盘点明细`);
        this.getList();
      } catch (e) {
        // 错误由后端/拦截器提示
      } finally {
        this.whInventoryInitLoading = false;
      }
    },
    /** 库存行未落库前不可勾选已盘；盘盈新增行（无 kcNo）可本地勾选 */
    whEntryCountedCheckboxDisabled(row) {
      if (!row || !row.id) {
        return !!(row && row.kcNo);
      }
      return false;
    },
    /** 已盘且已落库明细：锁定实盘数量，取消已盘后恢复（无 id 的待确认行不锁） */
    isEntryStockQtyLocked(row) {
      if (!row || row.id == null || row.id === '') return false;
      return Number(row.countedFlag) === 1;
    },
    onWhEntryCountedChange(row, val) {
      if (!row) return;
      if (!row.id) {
        this.$set(row, "countedFlag", val === 1 ? 1 : 0);
        return;
      }
      const prev = val === 1 ? 0 : 1;
      const sq = parseFloat(row.stockQty);
      const payload = { id: row.id, countedFlag: val, expectedUpdateTime: this.whStocktakingClientVersionTime() };
      if (Number.isFinite(sq)) {
        payload.stockQty = sq;
      }
      updateStocktakingEntryCounted(payload).then(() => {
        this.stockQtyChangeWh(row);
        this.refreshEntrySaveSnapshots(this.stkIoStocktakingEntryList);
      }).catch(() => {
        this.$set(row, 'countedFlag', prev);
      });
    },
    stockQtyChangeWh(row) {
      if (!row) return;
      const up = parseFloat(row.unitPrice != null ? row.unitPrice : row.price || 0);
      const sq = parseFloat(row.stockQty || 0);
      const book = parseFloat(row.qty || 0);
      const a = sq * (Number.isFinite(up) ? up : 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
      if (Number.isFinite(sq) && Number.isFinite(book)) {
        const profitQty = sq - book;
        row.profitQty = profitQty;
        if (sq > book) row.profitLossFlag = 'PROFIT';
        else if (sq < book) row.profitLossFlag = 'LOSS';
        else row.profitLossFlag = 'EQUAL';
      }
    },
    handleStockQtyBlur(row) {
      if (!row) return;
      if (this.isEntryStockQtyLocked(row)) return;
      if (!row.kcNo) return;
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return;
      if (stockQty > qty) {
        row.stockQty = qty;
        this.stockQtyChangeWh(row);
        this.$modal.msgWarning('盘点数量不能大于账面数量。盘盈请点击「新增盘盈明细」。');
      }
    },
    getProfitQty(row) {
      const stockQty = parseFloat((row && row.stockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      const profitQty = stockQty - qty;
      if (!Number.isFinite(profitQty)) return '--';
      return profitQty > 0 ? '+' + profitQty.toFixed(2) : profitQty.toFixed(2);
    },
    formatProfitLossFlag(row) {
      const flag = (row && row.profitLossFlag ? String(row.profitLossFlag) : '').toUpperCase();
      if (flag === 'PROFIT') return '盘盈';
      if (flag === 'LOSS') return '盘亏';
      if (flag === 'EQUAL') return '持平';
      const stockQty = parseFloat((row && row.stockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return '--';
      if (stockQty > qty) return '盘盈';
      if (stockQty < qty) return '盘亏';
      return '持平';
    },
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockType = "501";
      listStocktaking(this.queryParams).then(response => {
        this.inList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
      this.entrySaveSnapshots = null;
      this.detailFilterCounted = null;
      this.checkedStkIoStocktakingEntry = [];
      this.stocktakingAutoSaveEnabled = false;
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      const n = parseFloat(row.stockQty != null ? row.stockQty : row.qty);
      const p = parseFloat(row.price);
      if (Number.isFinite(n) && Number.isFinite(p)) {
        totalAmt = n * p;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      row.unitPrice = row.price;
      this.qtyChange(row);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加盘点";
      this.form.stockStatus = '1';
      this.form.stockType = '501';
      this.stocktakingBatchSeqCounter = 0;
      // 制单人：与后端一致存用户ID（后端仍会强制覆盖，避免误传昵称）
      this.form.createBy = this.$store.getters.userId != null ? String(this.$store.getters.userId) : '';
      this.form.stockDate = this.getBillDate();
      this.action = true;
      this.stocktakingAutoSaveEnabled = true;
    },
    /** 查看按钮操作 */
    handleView(row){

      const id = row.id
      getStocktaking(id).then(response => {
        this.detailFilterCounted = null;
        this.checkedStkIoStocktakingEntry = [];
        this.form = response.data;
        this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(response.data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.action = false;
        this.form.stockType = '501';
        this.title = "查看盘点";
        this.stocktakingAutoSaveEnabled = false;
        this.hydrateWhEntryCurrentInventoryQty();
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids;
      const stockNo = row && row.stockNo != null ? row.stockNo : id;
      getStocktaking(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.stkIoStocktakingEntryList, this, '仓库盘点')) {
          return;
        }
        const entries = res.data.stkIoStocktakingEntryList || [];
        const kcProfitLine = entries.find((e) => {
          if (!e || e.kcNo == null || e.kcNo === '') return false;
          const sq = parseFloat(e.stockQty);
          const bq = parseFloat(e.qty);
          return Number.isFinite(sq) && Number.isFinite(bq) && sq > bq;
        });
        if (kcProfitLine) {
          const name = (kcProfitLine.material && kcProfitLine.material.name) || kcProfitLine.materialId || '';
          this.$modal.msgError(
            `审核失败：耗材[${name}]为仓库原有库存，实盘数量不能大于账面数量。盘盈请使用「新增盘盈明细」。`
          );
          return;
        }
        this.$modal
          .confirm('确定要审核"' + stockNo + '"的数据项？审核通过后将直接变更仓库库存，不再生成盈亏单。')
          .then(() => checkStocktakingQty({ id }))
          .then((checkRes) => {
            const rows = (checkRes && checkRes.data) || [];
            if (!rows.length) {
              return auditStocktaking({
                id,
                expectedUpdateTime: (row && (row.updateTime || row.createTime)) || undefined
              });
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
    /** 修改按钮操作 */
    handleUpdate(row) {
      if (row && (row.stockStatus === 2 || row.stockStatus === '2')) {
        this.$modal.msgWarning('已审核的盘点单不可修改');
        return;
      }
      this.reset();
      const id = row.id || this.ids
      getStocktaking(id).then(response => {
        const data = response.data || {};
        if (data.stockStatus === 2 || data.stockStatus === '2') {
          this.$modal.msgWarning('已审核的盘点单不可修改');
          return;
        }
        this.form = data;
        this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.title = "修改盘点";
        this.form.stockType = '501';
        this.action = true;
        this.stocktakingAutoSaveEnabled = false;
      });
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
        const profitNoSup = (this.stkIoStocktakingEntryList || []).find(
          (r) => r && !r.kcNo && (r.supplierId == null || r.supplierId === '')
        );
        if (profitNoSup) {
          const name = profitNoSup.material && profitNoSup.material.name ? profitNoSup.material.name : '';
          this.$modal.msgWarning(name ? `盘盈明细「${name}」必须选择供应商` : '盘盈明细必须选择供应商');
          return;
        }
        if (this.submitLoading) return;
        this.openSaveQtyConfirmDialogWarehouse();
      });
    },
    /**
     * 按仓库分页拉取库存明细，供保存前对账（与初始化同源条件）。
     * 避免对每条明细并发 listInventoryPick(id, pageSize=1) 导致请求风暴。
     */
    async _fetchAllWhInventoryPickForSaveQtyCheck(warehouseId) {
      const pageSize = 500;
      const allRows = [];
      const fetchNext = async (pageNum) => {
        const res = await listInventoryPick({
          warehouseId,
          pageNum,
          pageSize
        });
        const rows = (res && res.rows) || [];
        allRows.push(...rows);
        if (rows.length === 0 || rows.length < pageSize) {
          return allRows;
        }
        return fetchNext(pageNum + 1);
      };
      return fetchNext(1);
    },
    /** 计算保存前需逐条确认的仓库库存差异行（与 openSaveQtyConfirmDialogWarehouse 逻辑一致，不弹窗） */
    async _computeWhSaveQtyConfirmRows() {
      const list = this.stkIoStocktakingEntryList || [];
      const warehouseId = this.form && this.form.warehouseId;
      const entriesNeedingCheck = [];
      for (let idx = 0; idx < list.length; idx++) {
        const row = list[idx];
        if (!row || row.kcNo == null || row.kcNo === '') continue;
        const idRaw = row.kcNo;
        const idNum = typeof idRaw === 'number' ? idRaw : parseInt(String(idRaw).trim(), 10);
        if (!Number.isFinite(idNum)) continue;
        entriesNeedingCheck.push({ row, idx, idNum });
      }
      if (entriesNeedingCheck.length === 0) {
        return { fetchError: false, rows: [] };
      }

      let invById = null;
      try {
        if (warehouseId != null && warehouseId !== '') {
          const invRows = await this._fetchAllWhInventoryPickForSaveQtyCheck(warehouseId);
          invById = new Map();
          (invRows || []).forEach((inv) => {
            if (inv && inv.id != null) {
              invById.set(String(inv.id), inv);
            }
          });
        }
      } catch (e) {
        return { fetchError: true, rows: [] };
      }

      const out = [];
      let fetchError = false;
      for (const { row, idx, idNum } of entriesNeedingCheck) {
        let inv = null;
        if (invById) {
          inv = invById.get(String(idNum));
          if (!inv) {
            fetchError = true;
            break;
          }
        } else {
          try {
            const res = await listInventoryPick({
              id: idNum,
              pageNum: 1,
              pageSize: 1
            });
            const pickRows = (res && res.rows) || [];
            if (!pickRows.length) {
              fetchError = true;
              break;
            }
            inv = pickRows[0];
          } catch (e) {
            fetchError = true;
            break;
          }
        }
        const live = inv != null && inv.qty != null && inv.qty !== '' ? parseFloat(inv.qty) : NaN;
        const book = row.qty != null && row.qty !== '' ? parseFloat(row.qty) : NaN;
        if (!Number.isFinite(live) || !Number.isFinite(book) || book === live) {
          continue;
        }
        out.push({
          _confirmKey: `${row.id || 'new'}_${idx}`,
          _rowIndex: idx,
          id: row.id,
          material: row.material,
          batchNo: row.batchNo,
          detailQty: row.qty,
          currentQty: live,
          adjustedStockQty: row.stockQty != null && row.stockQty !== '' ? row.stockQty : row.qty,
          confirmed: false
        });
      }
      if (fetchError) {
        return { fetchError: true, rows: [] };
      }
      return { fetchError: false, rows: out };
    },
    /**
     * 盘点初始化 / 追加盘亏、盘盈明细后自动落库（不关闭编辑弹窗）。
     * @param {boolean} [allowAppendOnExisting] 为 true 时，已存在单据 id 的「修改」场景下追加明细也会保存；初始化回调勿传 true。
     */
    async attemptAutoSaveAfterStocktakingDetailChange(allowAppendOnExisting) {
      if (!this.open) return;
      const isNewDraftSession = this.stocktakingAutoSaveEnabled;
      const hasHeadId =
        this.form &&
        this.form.id != null &&
        this.form.id !== '';
      const patchExisting = !!allowAppendOnExisting && hasHeadId;
      if (!isNewDraftSession && !patchExisting) return;
      if (!this.stkIoStocktakingEntryList || !this.stkIoStocktakingEntryList.length) return;
      if (this.submitLoading) return;
      try {
        const valid = await new Promise((resolve) => {
          if (!this.$refs.form) {
            resolve(false);
            return;
          }
          this.$refs.form.validate((v) => resolve(v));
        });
        if (!valid) {
          this.$modal.msgWarning('请先补全盘点单主表必填项后再保存');
          return;
        }
        const { fetchError, rows } = await this._computeWhSaveQtyConfirmRows();
        if (fetchError) {
          this.$modal.msgError('加载仓库库存明细失败，无法自动保存，请稍后手动保存');
          return;
        }
        if (rows.length) {
          this.$modal.msgWarning('账面数量与当前仓库库存不一致，请点击「确定」手动保存并完成逐条确认');
          return;
        }
        const list = this.stkIoStocktakingEntryList || [];
        const newEntries = list.filter((r) => r && (r.id == null || r.id === ''));
        if (patchExisting) {
          if (!newEntries.length) {
            return;
          }
          this.submitLoading = true;
          try {
            const payload = newEntries.map((row) => this.serializeStocktakingEntryForSave(row));
            const res = await appendStocktakingEntries(this.form.id, {
              entries: payload,
              expectedUpdateTime: this.whStocktakingClientVersionTime()
            });
            const data = res && res.data;
            if (data) {
              this.form = data;
              this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
            }
            this.$modal.msgSuccess('已自动保存');
            this.getList();
          } finally {
            this.submitLoading = false;
          }
          return;
        }
        await this.doSubmitStocktakingForm({ keepDialogOpen: true, quietSuccess: true });
      } catch (e) {
        // 网络等异常由接口层提示；此处避免打断用户操作
      }
    },
    async openSaveQtyConfirmDialogWarehouse() {
      this.saveQtyConfirmLoading = true;
      try {
        const { fetchError, rows } = await this._computeWhSaveQtyConfirmRows();
        if (fetchError) {
          this.$modal.msgError('加载仓库库存明细失败，请检查网络后重试');
          return;
        }
        this.saveQtyConfirmList = rows;
        if (!rows.length) {
          this.doSubmitStocktakingForm();
          return;
        }
        this.saveQtyConfirmVisible = true;
      } finally {
        this.saveQtyConfirmLoading = false;
      }
    },
    confirmWhSaveQtyRow(row) {
      const idx = row && row._rowIndex;
      if (idx == null || idx < 0) return;
      const target = (this.stkIoStocktakingEntryList || [])[idx];
      if (!target) return;
      const live = parseFloat(row.currentQty);
      if (!Number.isFinite(live) || live < 0) {
        this.$modal.msgWarning('当前仓库库存数据无效');
        return;
      }
      this.$set(target, 'qty', live);
      const sq = parseFloat(target.stockQty);
      if (Number.isFinite(sq) && sq > live) {
        this.$set(target, 'stockQty', live);
        this.$modal.msgWarning('来源于仓库库存的明细仅允许盘亏，盘点数量已回退为当前库存数量');
      }
      this.stockQtyChangeWh(target);
      this.$set(row, 'detailQty', live);
      this.$set(row, 'adjustedStockQty', target.stockQty);
      this.$set(row, 'confirmed', true);
    },
    formatWhSaveConfirmProfitQty(row) {
      const stockQty = parseFloat((row && row.adjustedStockQty) || 0);
      const bookOnLine = parseFloat((row && row.detailQty) || 0);
      const v = stockQty - bookOnLine;
      if (!Number.isFinite(v) || !Number.isFinite(stockQty)) return '--';
      return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    },
    confirmWhSaveQtyAndSubmit() {
      const unconfirmed = (this.saveQtyConfirmList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交保存');
        return;
      }
      this.saveQtyConfirmVisible = false;
      this.doSubmitStocktakingForm();
    },
    /** 提交/追加明细时去掉前端展示用字段，减轻整包体积 */
    serializeStocktakingEntryForSave(row) {
      const rest = { ...row };
      delete rest.material;
      delete rest.warehouse;
      delete rest._warehouseName;
      delete rest._supplierName;
      delete rest.index;
      delete rest.fromStocktakingInit;
      delete rest._fromStocktakingInit;
      delete rest._cbBatchNone;
      delete rest._cbBatchUnknown;
      delete rest._batchLocked;
      delete rest._longTerm;
      const up = rest.unitPrice != null && rest.unitPrice !== '' ? rest.unitPrice : rest.price;
      if (up != null && up !== '') {
        rest.unitPrice = up;
        rest.price = up;
      }
      return rest;
    },
    doSubmitStocktakingForm(options) {
      if (this.submitLoading) return Promise.resolve();
      options = options || {};
      const keepDialogOpen = !!options.keepDialogOpen;
      const quietSuccess = !!options.quietSuccess;
      this.submitLoading = true;
      const isUpdate = this.form.id != null;
      let request;
      if (isUpdate) {
        request = patchSaveStocktaking(this.buildPatchSavePayload());
      } else {
        this.form.stkIoStocktakingEntryList = (this.stkIoStocktakingEntryList || []).map((row) =>
          this.serializeStocktakingEntryForSave(row)
        );
        request = addStocktaking(this.form);
      }
      return request.then(response => {
        const data = response.data || response;
        if (isUpdate && data && data.stkIoStocktakingEntryList) {
          this.form = data;
          this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(data.stkIoStocktakingEntryList || []);
        } else if (!isUpdate && data) {
          this.form.id = data.id;
          if (data.stockNo != null) this.form.stockNo = data.stockNo;
        }
        if (quietSuccess) {
          this.$modal.msgSuccess('已自动保存');
        } else {
          this.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功");
        }
        if (!keepDialogOpen) {
          this.open = false;
        }
        this.getList();
      }).finally(() => {
        this.submitLoading = false;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除盘点编号为"' + ids + '"的数据项？').then(function() {
        return delStocktaking(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
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
      obj.countedFlag = 0;
      this.stkIoStocktakingEntryList.push(obj);
    },
    /** 盘点明细删除按钮操作 */
    handleDeleteStkIoStocktakingEntry() {
      if (!this.detailEditable) {
        this.$modal.msgWarning('已审核的盘点单不可删除明细');
        return;
      }
      const checked = this.checkedStkIoStocktakingEntry || [];
      if (checked.length === 0) {
        this.$modal.msgError("请先选择要删除的盘点明细数据");
        return;
      }
      const sel = new Set(checked);
      this.stkIoStocktakingEntryList = (this.stkIoStocktakingEntryList || []).filter((item) => !sel.has(item));
      this.clearWhEntryTableSelection();
    },
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection || [];
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('stocktaking/in/export', {
        ...this.queryParams
      }, `in_${new Date().getTime()}.xlsx`)
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
  background: rgba(0,0,0,0.4);
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
  flex-shrink: 0;
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

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 10px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
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
  background-color: #F5F7FA !important;
  color: #606266 !important;
  font-weight: 600 !important;
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

.profit-pending-dialog .el-table .cell {
  vertical-align: top;
}
.profit-pending-dialog .profit-batch-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.profit-pending-dialog .profit-batch-textarea .el-textarea__inner {
  min-height: 48px !important;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  resize: vertical;
}
.profit-pending-dialog .profit-batch-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.profit-pending-dialog .profit-expiry-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.wh-stocktaking-detail-toolbar-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.wh-stocktaking-detail-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.wh-stocktaking-detail-toolbar-filters {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.wh-detail-filter-counted {
  width: 140px;
}
</style>
