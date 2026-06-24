<template>
  <div class="app-container stocktaking-profit-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="业务单号" prop="stockNo" class="query-item-inline">
            <el-input v-model="queryParams.stockNo"
                      placeholder="业务单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="24">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-upload2"
          size="medium"
          @click="openProfitImportDialog"
          v-hasPermi="['stocktaking:in:add']"
        >导入盘盈明细</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-check"
          size="medium"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['stocktaking:in:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inList" class="table-compact" :row-class-name="inListIndex" @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="业务单号" align="center" prop="stockNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="150" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="creater.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.creater && scope.row.creater.nickName) || scope.row.createUserNickName || scope.row.createrName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.profitAmount | formatCurrency }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.totalAmount | formatCurrency }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="stockStatus" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.auditPerson && scope.row.auditPerson.nickName) || scope.row.auditUserNickName || scope.row.auditPersonName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
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

    <pagination
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
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" size="small" class="modal-form-compact stocktaking-modal-head-form">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="stockStatus" class="head-label-nowrap">
                      <el-input :value="stockStatusLabel" :disabled="true" placeholder="单据状态" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="业务单号" prop="stockNo" class="head-label-nowrap">
                      <el-input v-model="form.stockNo" placeholder="业务单号" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId" class="head-label-nowrap">
                      <SelectWarehouse v-model="form.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="stockDate" class="head-label-nowrap">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="createBy" class="head-label-nowrap">
                      <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

        <div class="modal-detail-section">
        <el-row :gutter="10" class="detail-toolbar-row">
          <el-col :span="1.5">
            <span>盘点明细信息</span>
          </el-col>

          <div v-show="detailEditable">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-minus" size="small" @click="openAddLossEntry">新增盘亏明细</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="warning" icon="el-icon-plus" size="small" @click="openAddProfitEntry">新增盘盈明细</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" icon="el-icon-refresh" size="small" @click="handleStocktakingInit">盘点初始化</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" size="small" @click="submitForm" :loading="submitLoading">保 存</el-button>
            </el-col>
          </div>
        </el-row>

        <div class="table-wrapper">
        <el-table class="stocktaking-detail-table" :data="stkIoStocktakingEntryList" v-loading="detailLoading" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" :height="detailTableHeight" border show-summary :summary-method="getSummaries">
          <el-table-column v-if="detailEditable" type="selection" width="46" align="center" header-align="center" resizable fixed="left" />
          <el-table-column label="序号" align="center" header-align="center" prop="index" width="52" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" header-align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材名称" align="center" header-align="center" width="130" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" header-align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" header-align="center" width="56" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="账面数量" align="center" header-align="center" prop="qty" width="88" show-overflow-tooltip resizable>
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
                onkeyup="value=value.replace(/\D/g,'')"
                onafterpaste="value=value.replace(/\D/g,'')"
                @blur="handleStockQtyBlur(scope.row)"
                @input="stockQtyChange(scope.row)"
              />
              <span v-else>{{ scope.row.stockQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="center" header-align="center" prop="price" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" header-align="center" prop="profitQty" width="88" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" header-align="center" prop="amt" width="88" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点金额" align="center" header-align="center" prop="stockAmount" width="88" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="center" header-align="center" prop="profitAmount" width="88" show-overflow-tooltip resizable>
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
              <el-input v-if="detailEditable" v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
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
          <el-table-column label="型号" align="center" header-align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
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
          <el-table-column label="批次号" align="center" header-align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
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
              <el-input v-if="detailEditable" v-model="scope.row.remark" placeholder="备注" />
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
        <el-button @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" @click="confirmPendingNewEntries">确 定</el-button>
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
        <el-button @click="whAuditQtyMismatchVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmWhAuditQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listStocktaking, getStocktaking, delStocktaking, addStocktaking, updateStocktaking, patchSaveStocktaking, appendStocktakingEntries, auditStocktaking, checkStocktakingQty, previewWhStocktakingProfitImport, confirmWhStocktakingProfitImport, downloadWhStocktakingProfitImportTemplate } from "@/api/warehouse/stocktaking";
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
  filters: {
    formatCurrency(value) {
      if (!value && value !== 0) return '--';
      return '¥' + parseFloat(value).toFixed(2);
    }
  },
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
    this.getList();
  },
  computed: {
    /** 与到货验收/出库申请弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
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
        stockAmount: amt.toFixed(2),
        amt: amt.toFixed(2),
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
      row.profitQty = Number.isFinite(totalProfitQty) ? totalProfitQty.toFixed(2) : '0.00';
      row.profitAmount = (Number.isFinite(totalProfitQty) ? totalProfitQty * pr : 0).toFixed(2);
      row.stockAmount = (Number.isFinite(sq) ? sq * pr : 0).toFixed(2);
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
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    // 计算合计数量和金额
    getSummaries(param) {
      const { columns } = param;
      const data = this.stkIoStocktakingEntryList || [];
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 2) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        // 合计：盘点数量、账面数量、盈亏数量、金额、盘点金额、盈亏金额
        if(['stockQty', 'qty', 'profitQty', 'amt', 'stockAmount', 'profitAmount'].includes(column.property)){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            // 金额类字段保留两位小数
            if(['amt', 'stockAmount', 'profitAmount'].includes(column.property)){
              sums[index] = sums[index].toFixed(2);
            }
            sums[index] += '';
          } else {
            sums[index] = '';
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
    /** 盘点列表序号 */
    inListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
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
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('stocktaking/in/export', {
        ...this.queryParams
      }, `仓库盘点单_${new Date().getTime()}.xlsx`)
    },
    /** 单行导出按钮操作 */
    handleExportRow(row) {
      this.download('stocktaking/in/export', {
        stockNo: row.stockNo
      }, `仓库盘点单_${row.stockNo}_${new Date().getTime()}.xlsx`)
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
/* 内部弹窗样式 - 与出库申请/到货验收保持一致 */
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
  min-height: 0;
}

/* 弹窗内顶部字段区：与出库申请/到货验收一致 */
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
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  flex: 0 1 auto;
  overflow: hidden;
}

.local-modal-content .modal-detail-section .modal-entry-pagination {
  flex-shrink: 0;
  margin-top: 4px;
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

.local-modal-content .stocktaking-modal-head-form .head-label-nowrap ::v-deep .el-form-item__label {
  white-space: nowrap;
}

/* 盘点弹窗明细表：表头居中加粗、合计加粗、列间距适中（字号与出库/到货验收一致） */
::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table th .cell {
  text-align: center !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table td .cell {
  font-size: 14px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__footer-wrapper td .cell,
::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__fixed-footer-wrapper td .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
  text-align: center;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__fixed-footer-wrapper td {
  background-color: #fff !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper {
  padding-bottom: 4px;
  box-sizing: border-box;
  scrollbar-width: auto;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 12px !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper:hover::-webkit-scrollbar {
  height: 16px !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 8px !important;
  border: 1px solid #e4e7ed !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 8px !important;
  border: 2px solid #f1f1f1 !important;
  min-width: 24px !important;
  min-height: 10px !important;
  transition: background 0.2s ease, min-height 0.15s ease, border-width 0.15s ease;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
  min-height: 14px !important;
  border-width: 1px !important;
}

::v-deep .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #303133 !important;
  min-height: 16px !important;
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

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
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
</style>

<style>
/* 库房盘点申请（本页路由）：与到货验收一致（非 scoped） */
.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.app-container.stocktaking-profit-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.stocktaking-profit-page > .el-form.query-form {
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

.app-container.stocktaking-profit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second {
  position: relative;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.stocktaking-profit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.stocktaking-profit-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.stocktaking-profit-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.stocktaking-profit-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

/* 盘点弹窗明细表（非 scoped 兜底）：表头居中加粗、合计加粗 */
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table th,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table thead th {
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table th .cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table thead th .cell {
  text-align: center !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table td .cell {
  font-size: 14px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__footer-wrapper td .cell,
.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__fixed-footer-wrapper td .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table th.col-his-id-header .cell {
  white-space: nowrap !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper:hover::-webkit-scrollbar {
  height: 16px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 8px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 10px !important;
  transition: background 0.2s ease, min-height 0.15s ease;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
  min-height: 14px !important;
}

.app-container.stocktaking-profit-page .local-modal-content .modal-detail-section .stocktaking-detail-table .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #303133 !important;
  min-height: 16px !important;
}
</style>
