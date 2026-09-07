<template>
  <div class="app-container list-page batch-consume-page" :class="{ 'is-modal-open': open || reverseDialogOpen }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.consumeBillNo"
              placeholder="单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.departmentId" field-placeholder="科室" />
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
            <el-form-item prop="consumeBillStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.consumeBillStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
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
        >新增</el-button>
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['department:batchConsume:audit']"
        >审核</el-button>
        <el-tooltip :content="getReverseButtonTip()" placement="top">
          <div style="display:inline-block;">
            <el-button
              size="small"
              class="spd-btn spd-btn--danger"
              :disabled="single || !canReverseSelected()"
              @click="openReverseDialog"
              v-hasPermi="['department:batchConsume:reverse']"
            >退消耗</el-button>
          </div>
        </el-tooltip>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:batchConsume:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="consumeList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="consumeBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ (scope.row.reverseFlag == 1 || scope.row.reverseFlag === '1') ? ('【退】' + scope.row.consumeBillNo) : scope.row.consumeBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="检验小组" align="center" prop="inspectTeamDeptName" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ scope.row.inspectTeamDeptName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据类型" align="center" prop="reverseFlag" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.reverseFlag == 1 || scope.row.reverseFlag === '1'" type="warning" size="mini">退消耗</el-tag>
          <el-tag v-else type="success" size="mini">正向消耗</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount !== null && scope.row.totalAmount !== undefined && scope.row.totalAmount !== ''">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByCreaterName">
        <template slot-scope="scope">
          <span>{{ formatPersonName(scope.row, 'creater') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="consumeBillStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.consumeBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByAuditPerson">
        <template slot-scope="scope">
          <span>{{ formatPersonName(scope.row, 'audit') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="来源单号" align="center" prop="reverseOfBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ scope.row.reverseOfBillNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="220">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.consumeBillStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              class="reverse-action-btn"
              @click="handleRowReverse(scope.row)"
              v-hasPermi="['department:batchConsume:reverse']"
              v-if="canReverseConsumeRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >退消耗</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:batchConsume:edit']"
              v-if="scope.row.consumeBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:batchConsume:remove']"
              v-if="scope.row.consumeBillStatus != 2"
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
        @pagination="getList"
      />
    </div>
    </div>

    <!-- 添加或修改科室批量消耗对话框（布局与到货验收 inWarehouse/apply 弹窗一致） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div
            v-if="open"
            class="local-modal-content apply-modal-root-content"
          >
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>

              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单号" prop="consumeBillNo" class="form-item-header-billno">
                      <el-input v-model="form.consumeBillNo" :disabled="true" :title="form.consumeBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="消耗状态" prop="consumeBillStatus">
                      <el-select v-model="form.consumeBillStatus" placeholder="请选择消耗状态" :disabled="true" clearable>
                        <el-option
                          v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required">
                      <SelectDepartment v-model="form.departmentId" :disabled="departmentLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col v-if="showInspectTeamSelector" class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="检验小组" prop="inspectTeamDeptId" label-width="80px">
                      <el-select
                        v-model="form.inspectTeamDeptId"
                        placeholder="可不选"
                        clearable
                        filterable
                        :disabled="!action"
                      >
                        <el-option
                          v-for="item in inspectTeamOptions"
                          :key="item.id"
                          :label="item.name"
                          :value="item.id"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="消耗日期" prop="consumeBillDate">
                      <el-date-picker
                        clearable
                        v-model="form.consumeBillDate"
                        type="date"
                        style="width: 100%"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择消耗日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="操作人" prop="userId">
                      <SelectUser v-model="form.userId"/>
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
                  <span class="apply-modal-detail-title">科室批量消耗明细信息</span>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" :disabled="!form.departmentId" @click="nameBtn">添加</el-button>
                    <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDeleteConsumeEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="deptBatchConsumeEntryList"
                :row-class-name="rowDeptBatchConsumeEntryIndex"
                class="apply-detail-table"
                show-summary
                :summary-method="getSummaries"
                @selection-change="handleConsumeEntrySelectionChange"
                ref="deptBatchConsumeEntry"
                border
                :height="detailTableHeight"
              >
                <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="仓库" align="center" width="120" min-width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) || (scope.row.warehouse && scope.row.warehouse.name) || '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="名称"
                  align="left"
                  header-align="center"
                  prop="material.name"
                  width="180"
                  min-width="140"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.name')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.name) || '--'">{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="规格"
                  align="left"
                  header-align="center"
                  prop="material.speci"
                  width="130"
                  min-width="110"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.speci')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.speci) || '--'">{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="型号"
                  align="left"
                  header-align="center"
                  prop="material.model"
                  width="130"
                  min-width="110"
                  :show-overflow-tooltip="false"
                  class-name="detail-col-text-wrap"
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.model')"
                >
                  <template slot-scope="scope">
                    <span class="detail-text-cell-2line" :title="(scope.row.material && scope.row.material.model) || '--'">{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="单位"
                  align="center"
                  prop="material.fdUnit.unitName"
                  width="70"
                  min-width="56"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')"
                >
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="单价"
                  prop="unitPrice"
                  width="100"
                  align="right"
                  header-align="center"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')"
                >
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="数量"
                  prop="qty"
                  width="100"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'qty')"
                >
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      clearable
                      v-model="scope.row.qty"
                      placeholder="数量"
                      size="small"
                      class="detail-input-compact"
                      onkeyup="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      onafterpaste="value=(String(value).match(/^-?\d*\.?\d{0,3}/)||[''])[0]"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批号" align="center" prop="batchNumer" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.batchNumer || scope.row.batchNo || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产日期" align="center" prop="beginTime" width="110" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatBatchEntryDate(scope.row.beginTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期" align="center" prop="endTime" width="110" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatBatchEntryDate(scope.row.endTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="金额"
                  prop="amt"
                  width="120"
                  align="right"
                  header-align="center"
                  show-overflow-tooltip
                  resizable
                  sortable
                  :sort-method="(a,b)=>sortByNestedNumber(a,b,'amt')"
                >
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag v-if="scope.row.material" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-if="action" v-model="scope.row.remark" placeholder="备注" size="small" class="detail-input-compact" />
                    <span v-else>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100" class-name="apply-action-col">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteDetailRow(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
              </div>
            </el-form>
            <!-- 嵌套在父弹窗内，避免全屏层被列表页 .local-modal-mask 绝对定位/max-width 挤偏 -->
            <SelectDepInventory
              v-if="DialogComponentShow"
              :nested="true"
              modal-title="XH-科室库存明细"
              :DialogComponentShow="DialogComponentShow"
              :departmentValue="departmentValue"
              :selectedDetails="deptBatchConsumeEntryList"
              @closeDialog="closeDialog"
              @selectData="selectData"
            />
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog title="退消耗" :visible.sync="reverseDialogOpen" width="900px" append-to-body>
      <el-alert
        title="请输入每条明细本次反消耗数量（必须大于0且不超过可退数量）"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 10px;"
      />
      <el-table :data="reverseRows" border max-height="420px">
        <el-table-column label="来源单号" prop="srcConsumeBillNo" width="170" />
        <el-table-column label="名称" prop="materialName" min-width="140" />
        <el-table-column label="规格" prop="materialSpeci" width="120" />
        <el-table-column label="型号" prop="materialModel" width="120" />
        <el-table-column label="正向消耗数量" prop="srcConsumeQty" width="120" />
        <el-table-column label="可退数量" prop="canReverseQty" width="110" />
        <el-table-column label="本次退消耗数量" width="150">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.reverseQty"
              :min="0"
              :max="Number(scope.row.canReverseQty || 0)"
              :step="0.001"
              controls-position="right"
              style="width: 130px;"
            />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="reverseDialogOpen = false">取 消</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="fillReverseAll">按可退数量整单反消耗</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitReverseConsume">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listConsume, getConsume, delConsume, addConsume, updateConsume, auditConsume, reverseEntryList, reverseConsume } from "@/api/department/batchConsume";
import { listDepartTenantOptionselect } from '@/api/foundation/depart';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';
import { parseTime } from '@/utils/ruoyi';

function buildListDefaultDateRange() {
  const today = new Date();
  const endDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const beginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { beginDate, endDate };
}

export default {
  name: "BatchConsume",
  dicts: ['biz_status','way_status'],
  components: {
    SelectDepartment,
    SelectUser,
    SelectDepInventory
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      reverseDialogOpen: false,
      reverseRows: [],
      reverseTargetConsumeId: null,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedConsumeEntry: [],
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
      // 科室批量消耗表格数据
      consumeList: [],
      tenantDepartmentList: [],
      selectRow: [],
      // 科室批量消耗明细表格数据
      deptBatchConsumeEntryList: [],
      /** 打开已保存单据时服务端原有明细条数（用于删光明细时整单删除确认） */
      originalEntryCount: 0,
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
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
        consumeBillNo: null,
        ...buildListDefaultDateRange(),
        departmentId: null,
        userId: null,
        consumeBillStatus: null,
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 与到货验收弹窗一致：固定明细表高度，表体滚动、合计贴在表底 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    /** 查看/修改已保存单，或新增且已有明细时锁定科室 */
    departmentLocked() {
      if (!this.action) {
        return true;
      }
      if (this.form && this.form.id) {
        return true;
      }
      return (this.deptBatchConsumeEntryList || []).length > 0;
    },
    showInspectTeamSelector() {
      const dept = this.findTenantDept(this.form && this.form.departmentId);
      const name = dept && dept.name ? String(dept.name) : '';
      return name.indexOf('检验科') !== -1;
    },
    inspectTeamOptions() {
      const parentId = this.form && this.form.departmentId;
      if (parentId == null || parentId === '') {
        return [];
      }
      const list = (this.tenantDepartmentList || []).filter(d =>
        d && d.parentId != null
        && String(d.parentId) === String(parentId)
        && String(d.status) !== '2'
      );
      const current = this.form && this.form.inspectTeamDeptId;
      if (current != null && current !== '' && !list.some(d => String(d.id) === String(current))) {
        const extra = this.findTenantDept(current);
        if (extra) {
          return list.concat([extra]);
        }
        if (this.form.inspectTeamDeptName) {
          return list.concat([{ id: current, name: this.form.inspectTeamDeptName }]);
        }
      }
      return list;
    }
  },
  created() {
    this.loadTenantDepartments();
    this.getList();
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
    },
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const table = this.$refs.deptBatchConsumeEntry;
          if (table && table.doLayout) {
            table.doLayout();
          }
        });
      }
    },
    'form.departmentId'(newVal, oldVal) {
      if (this.departmentLocked) {
        return;
      }
      if (oldVal == null || oldVal === '') {
        return;
      }
      if (String(oldVal) !== String(newVal == null ? '' : newVal)) {
        this.$set(this.form, 'inspectTeamDeptId', null);
      }
    }
  },
  methods: {
    findTenantDept(id) {
      if (id == null || id === '') {
        return null;
      }
      return (this.tenantDepartmentList || []).find(d => d && String(d.id) === String(id)) || null;
    },
    loadTenantDepartments() {
      listDepartTenantOptionselect().then(res => {
        this.tenantDepartmentList = (res && res.data) || [];
      }).catch(() => {
        this.tenantDepartmentList = [];
      });
    },
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
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.consumeList || !this.consumeList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.consumeList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
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
    sortByNestedNumber(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return NaN;
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        const n = Number(v);
        return isNaN(n) ? NaN : n;
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return -1;
      if (isNaN(vb)) return 1;
      return va - vb;
    },
    sortByCreaterName(a, b) {
      const va = this.formatPersonName(a, 'creater');
      const vb = this.formatPersonName(b, 'creater');
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByAuditPerson(a, b) {
      const va = this.formatPersonName(a, 'audit');
      const vb = this.formatPersonName(b, 'audit');
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    formatPersonName(row, type) {
      if (!row) {
        return '--';
      }
      if (type === 'creater') {
        const name = row.createrName
          || (row.creater && (row.creater.nickName || row.creater.userName))
          || (row.user && (row.user.nickName || row.user.userName));
        return name || '--';
      }
      const name = row.auditPersonName
        || (row.auditPerson && (row.auditPerson.nickName || row.auditPerson.userName));
      return name || '--';
    },
    formatBatchEntryDate(val) {
      if (val == null || val === '') {
        return '--';
      }
      return this.parseTime(val, '{y}-{m}-{d}');
    },
    /** 明细序号 */
    rowDeptBatchConsumeEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 明细表合计 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
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
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + this.formatAmount(totalAmount);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 查询科室批量消耗列表 */
    getList() {
      this.loading = true;
      const queryParams = { ...this.queryParams };
      listConsume(queryParams).then(response => {
        this.consumeList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(error => {
        console.error('查询科室批量消耗列表失败:', error);
        this.consumeList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败：' + (error.msg || error.message || '未知错误'));
      });
    },
    nameBtn() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }
      //打开"弹窗组件" - 显示科室库存明细
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    closeDialog() {
      //关闭"弹窗组件"
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      let skippedCount = 0;

      this.selectRow.forEach((item, index) => {
        const incomingDepInventoryId = item.depInventoryId || item.id || null;
        const incomingRefOutEntryId = item.refOutEntryId || (item.billEntryId != null ? String(item.billEntryId) : null);
        const duplicated = (this.deptBatchConsumeEntryList || []).some(exist => {
          const sameDepInventory = incomingDepInventoryId && exist.depInventoryId && String(exist.depInventoryId) === String(incomingDepInventoryId);
          const sameRefOutEntry = incomingRefOutEntryId && exist.refOutEntryId && String(exist.refOutEntryId) === String(incomingRefOutEntryId);
          return sameDepInventory || sameRefOutEntry;
        });
        if (duplicated) {
          skippedCount++;
          return;
        }
        const entry = {
          depInventoryId: item.depInventoryId || item.id || null,
          kcNo: item.kcNo || null,
          materialId: item.materialId || item.material?.id,
          material: item.material || {
            id: item.materialId || null,
            name: item.materialName || '',
            speci: item.materialSpeci || '',
            model: item.materialModel || ''
          },
          batchId: item.batchId || null,
          warehouseId: item.warehouseId || item.warehouse?.id || null,
          warehouse: item.warehouse || null,
          stockWarehouse: item.stockWarehouse || (item.warehouse ? { name: item.warehouse.name } : null),
          departmentId: item.departmentId || item.department?.id || this.form.departmentId || null,
          supplierId: item.supplierId || item.supplier?.id || null,
          factoryId: item.factoryId || item.fdFactory?.factoryId || item.material?.fdFactory?.factoryId || null,
          unitPrice: item.unitPrice || 0,
          qty: item.defaultConsumeQty || item.qty || 0,
          price: item.price || 0,
          amt: item.defaultConsumeQty ? this.calcLineAmt(item.defaultConsumeQty || 0, item.unitPrice || 0) : (item.amt || 0),
          batchNo: item.batchNo || '',
          batchNumer: item.batchNumer || item.materialNo || '',
          materialNo: item.materialNo || '',
          beginTime: item.beginTime || item.materialDate,
          endTime: item.endTime,
          materialDate: item.materialDate || null,
          warehouseDate: item.warehouseDate || null,
          settlementType: item.settlementType || '',
          materialName: item.materialName || item.material?.name || '',
          materialSpeci: item.materialSpeci || item.material?.speci || '',
          materialModel: item.materialModel || item.material?.model || '',
          materialFactoryId: item.materialFactoryId || item.material?.factoryId || item.factoryId || null,
          refOutBillId: item.refOutBillId || (item.billId != null ? String(item.billId) : null),
          refOutBillNo: item.refOutBillNo || item.billNo || null,
          refOutEntryId: item.refOutEntryId || (item.billEntryId != null ? String(item.billEntryId) : null),
          refOutEntryQty: item.outEntryQty || null,
          refOutAvailableQty: item.availableQty || item.qty || null,
          refDefaultConsumeQty: item.defaultConsumeQty || item.qty || null,
          mainBarcode: item.mainBarcode || '',
          subBarcode: item.subBarcode || '',
          remark: ''
        };
        this.deptBatchConsumeEntryList.push(entry);
      });
      if (skippedCount > 0) {
        this.$message({
          type: 'warning',
          message: `已自动过滤 ${skippedCount} 条重复明细`
        });
      }
      this.calculateTotals();
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
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
        consumeBillDate: null,
        departmentId: null,
        inspectTeamDeptId: null,
        userId: null,
        consumeBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.deptBatchConsumeEntryList = [];
      this.originalEntryCount = 0;
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.deptBatchConsumeEntryList.forEach(item => {
        if (item.qty && !isNaN(item.qty)) {
          totalQty += parseFloat(item.qty);
        }
        if (item.amt && !isNaN(item.amt)) {
          totalAmount += parseFloat(item.amt);
        }
      });
      
      this.totalQty = totalQty;
      this.totalAmount = totalAmount;
    },
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = parseFloat(row.qty) * parseFloat(row.unitPrice);
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
      this.calculateTotals();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.consumeBillNo = null;
      this.queryParams.departmentId = null;
      this.queryParams.consumeBillStatus = null;
      Object.assign(this.queryParams, buildListDefaultDateRange());
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.consumeList || [])
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
      getConsume(id).then(response => {
        this.form = response.data;
        this.deptBatchConsumeEntryList = response.data.deptBatchConsumeEntryList || [];
        this.originalEntryCount = this.deptBatchConsumeEntryList.length;
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.consumeBillStatus == 1){
          this.form.consumeBillStatus = '1';
        }else{
          this.form.consumeBillStatus = '2';
        }

        this.title = "查看科室批量消耗";
        this.$nextTick(() => {
          const table = this.$refs.deptBatchConsumeEntry;
          if (table && table.doLayout) table.doLayout();
        });
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.consumeBillStatus = '1';
      this.form.consumeBillDate = this.getBillDate();
      this.title = "添加科室批量消耗";
      this.action = true;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConsume(id).then(response => {
        this.form = response.data;
        this.deptBatchConsumeEntryList = response.data.deptBatchConsumeEntryList || [];
        this.originalEntryCount = this.deptBatchConsumeEntryList.length;
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.consumeBillStatus = '1';
        this.title = "修改科室批量消耗";
      });
    },
    /** 已保存单据删光全部明细时确认并删除整单 */
    confirmDeleteBillWhenClearAllEntries() {
      const billNo = this.form.consumeBillNo || '';
      return this.$modal.confirm(
        '若删除所有明细，消耗单' + (billNo ? '「' + billNo + '」' : '') + '将一并删除，是否继续？'
      ).then(() => delConsume(this.form.id)).then(() => {
        this.$modal.msgSuccess('删除成功');
        this.open = false;
        this.reset();
        this.getList();
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证科室是否选择
      if (!this.form.departmentId) {
        this.$modal.msgError("请先选择科室");
        return;
      }
      if (!this.showInspectTeamSelector) {
        this.form.inspectTeamDeptId = null;
      }
      if (!this.deptBatchConsumeEntryList || this.deptBatchConsumeEntryList.length === 0) {
        this.$modal.msgError("请至少添加一条消耗明细");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.deptBatchConsumeEntryList = this.deptBatchConsumeEntryList;
          var totalAmt = 0;
          this.deptBatchConsumeEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = this.toMoneyStorage(totalAmt);
          if (this.form.id != null) {
            updateConsume(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              this.originalEntryCount = (this.deptBatchConsumeEntryList || []).length;
              this.getList();
            });
          } else {
            addConsume(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.consumeBillNo) {
                  this.form.consumeBillNo = response.data.consumeBillNo;
                }
                this.title = "修改科室批量消耗";
              }
              this.originalEntryCount = (this.deptBatchConsumeEntryList || []).length;
              this.getList();
            }).catch(error => {
              console.error("新增失败:", error);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const billNo = row.consumeBillNo || '';
      this.$modal.confirm('是否确认删除消耗单，单号"' + billNo + '"的数据项？').then(function() {
        return delConsume(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 科室批量消耗明细删除按钮操作 */
    handleDeleteConsumeEntry() {
      if (this.checkedConsumeEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室批量消耗明细数据");
        return;
      }
      const checkedConsumeEntry = this.checkedConsumeEntry;
      const nextList = this.deptBatchConsumeEntryList.filter(function(item) {
        return checkedConsumeEntry.indexOf(item.index) == -1;
      });
      if (this.form.id && this.originalEntryCount > 0 && nextList.length === 0) {
        this.confirmDeleteBillWhenClearAllEntries().catch(() => {});
        return;
      }
      this.deptBatchConsumeEntryList = nextList;
      this.calculateTotals();
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      if (this.form.id && this.originalEntryCount > 0 && this.deptBatchConsumeEntryList.length === 1) {
        this.confirmDeleteBillWhenClearAllEntries().catch(() => {});
        return;
      }
      this.deptBatchConsumeEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleConsumeEntrySelectionChange(selection) {
      this.checkedConsumeEntry = selection.map(item => item.index)
    },
    canReverseConsumeRow(row) {
      if (!row) return false;
      const audited = row.consumeBillStatus == 2 || row.consumeBillStatus === '2';
      const isReverseBill = row.reverseFlag == 1 || row.reverseFlag === '1';
      const hisBlocked = row.disallowReverse == 1 || row.disallowReverse === '1';
      return audited && !isReverseBill && !hisBlocked;
    },
    canReverseSelected() {
      if (!this.ids || this.ids.length !== 1) {
        return false;
      }
      const selected = (this.consumeList || []).find(item => item.id === this.ids[0]);
      return this.canReverseConsumeRow(selected);
    },
    getReverseButtonTip() {
      if (!this.ids || this.ids.length === 0) return '请先选择一条单据';
      if (this.ids.length > 1) return '仅支持单选退消耗';
      const selected = (this.consumeList || []).find(item => item.id === this.ids[0]);
      if (!selected) return '未找到选中单据';
      if (!(selected.consumeBillStatus == 2 || selected.consumeBillStatus === '2')) return '仅已审核单据可退消耗';
      if (selected.reverseFlag == 1 || selected.reverseFlag === '1') return '退消耗单不能再次退消耗';
      if (selected.disallowReverse == 1 || selected.disallowReverse === '1') {
        return 'HIS计费产生的消耗请到「患者收费查询」冲销';
      }
      return '对当前已审核正向消耗单执行退消耗';
    },
    handleRowReverse(row) {
      this.openReverseDialogForRow(row);
    },
    openReverseDialog() {
      if (!this.ids || this.ids.length !== 1) {
        this.$modal.msgError("请先选择一条已审核的消耗单");
        return;
      }
      const selected = (this.consumeList || []).find(item => item.id === this.ids[0]);
      this.openReverseDialogForRow(selected);
    },
    openReverseDialogForRow(row) {
      if (!row || row.id == null) {
        this.$modal.msgError("未找到选中的消耗单");
        return;
      }
      if (!this.canReverseConsumeRow(row)) {
        if (row.disallowReverse == 1 || row.disallowReverse === '1') {
          this.$modal.msgError("该单来源于HIS计费消耗，请到「患者收费查询」冲销");
        } else if (row.reverseFlag == 1 || row.reverseFlag === '1') {
          this.$modal.msgError("退消耗单不能再次退消耗");
        } else {
          this.$modal.msgError("仅支持对已审核正向消耗单执行退消耗");
        }
        return;
      }
      this.reverseTargetConsumeId = row.id;
      reverseEntryList(row.id).then(response => {
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgError("该单据没有可退消耗明细");
          return;
        }
        this.reverseRows = rows.map(r => ({
          ...r,
          reverseQty: 0
        }));
        this.reverseDialogOpen = true;
      });
    },
    fillReverseAll() {
      this.reverseRows = (this.reverseRows || []).map(row => ({
        ...row,
        reverseQty: Number(row.canReverseQty || 0)
      }));
    },
    submitReverseConsume() {
      const validRows = (this.reverseRows || []).filter(row => Number(row.reverseQty || 0) > 0);
      if (!validRows.length) {
        this.$modal.msgError("请至少输入一条反消耗数量");
        return;
      }
      const invalid = validRows.find(row => Number(row.reverseQty) > Number(row.canReverseQty || 0));
      if (invalid) {
        this.$modal.msgError(`明细超限：${invalid.materialName || ''} 可退数量为 ${invalid.canReverseQty}`);
        return;
      }
      reverseConsume({
        consumeId: this.reverseTargetConsumeId,
        items: validRows.map(row => ({
          srcConsumeEntryId: row.srcConsumeEntryId,
          reverseQty: row.reverseQty
        }))
      }).then(response => {
        this.$modal.msgSuccess((response && response.msg) || "退消耗成功");
        this.reverseDialogOpen = false;
        this.reverseRows = [];
        this.reverseTargetConsumeId = null;
        this.getList();
      }).catch(err => {
        const msg = (err && (err.msg || err.message)) || "数据异常";
        this.$modal.msgError(`退消耗失败：${msg}`);
      });
    },
    applyMoreSearchToQueryParams(target) {
      if (!target) {
        return;
      }
    },
    /** 导出按钮操作 */
    handleExport() {
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      this.download('department/batchConsume/export', {
        ...queryParams
      }, `batchConsume_${new Date().getTime()}.xlsx`)
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据");
        return;
      }
      
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.consumeList.filter(item => this.ids.includes(item.id));
      const unreviewedRows = selectedRows.filter(row => row.consumeBillStatus == 1 || row.consumeBillStatus == '1');
      
      if (unreviewedRows.length === 0) {
        this.$modal.msgError("选中的数据中没有未审核的记录");
        return;
      }
      
      if (unreviewedRows.length < selectedRows.length) {
        this.$modal.confirm('选中的数据中包含已审核的记录，是否只审核未审核的记录？').then(() => {
          this.doBatchAudit(unreviewedRows.map(row => row.id));
        }).catch(() => {});
      } else {
        this.$modal.confirm('确认审核选中的 ' + unreviewedRows.length + ' 条数据？').then(() => {
          this.doBatchAudit(unreviewedRows.map(row => row.id));
        }).catch(() => {});
      }
    },
    /** 执行批量审核 */
    doBatchAudit(ids) {
      const auditBy = this.$store.state.user.userName || this.$store.state.user.nickName || 'admin';
      let successCount = 0;
      let failCount = 0;
      
      // 循环调用审核接口
      const auditPromises = ids.map(id => {
        return auditConsume({ id: id.toString(), auditBy: auditBy }).then(() => {
          successCount++;
        }).catch(() => {
          failCount++;
        });
      });
      
      Promise.all(auditPromises).then(() => {
        if (successCount > 0) {
          this.$modal.msgSuccess(`成功审核 ${successCount} 条数据${failCount > 0 ? '，失败 ' + failCount + ' 条' : ''}`);
          this.getList();
        } else {
          this.$modal.msgError('审核失败');
        }
      });
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 与到货验收 inWarehouse/apply、退库申请一致 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
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
  flex-shrink: 0;
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

.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-form-item__content > * {
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

::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
::v-deep .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
  -webkit-appearance: none;
  appearance: none;
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
  background-color: #f1f5f9 !important;
}

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
/* 列表样式见 department-apply-list-align.scss；以下为弹窗特例（对齐到货验收 apply） */
.app-container.batch-consume-page .local-modal-content:not(.material-filter-modal--nested) {
  min-height: 95vh !important;
}

.app-container.batch-consume-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 嵌套「XH-科室库存明细」：与到货验收 RK-添加明细一致（right:-8px 铺满父弹窗） */
.app-container.batch-consume-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}

.app-container.batch-consume-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.batch-consume-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.batch-consume-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.batch-consume-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.app-container.batch-consume-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.batch-consume-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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

.app-container.batch-consume-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.batch-consume-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* 仅父弹窗表单，避免样式泄漏进嵌套「科室库存明细」 */
.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  margin-bottom: 0;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-toolbar.list-toolbar {
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

.app-container.batch-consume-page .apply-modal-root-content > .el-form .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.batch-consume-page .apply-modal-root-content > .el-form .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.batch-consume-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.app-container.batch-consume-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}
.app-container.batch-consume-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}
.app-container.batch-consume-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}
.app-container.batch-consume-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
