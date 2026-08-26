<template>
  <div class="app-container list-page d-apply-page" :class="{ 'is-modal-open': open, 'is-select-filter-open': DialogComponentShow && selectTarget === 'apply' }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.applyBillNo"
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
            <el-form-item prop="applyBillStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.applyBillStatus" placeholder="单据状态"
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
          v-hasPermi="['department:dApply:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['department:dApply:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="applyList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="applyBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ scope.row.rejectReason || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="230">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.applyBillStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRowDetail(scope.row)"
              v-hasPermi="['department:dApply:export']"
              style="padding: 0 5px; margin: 0;"
            >导出明细</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:dApply:edit']"
              v-if="scope.row.applyBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:dApply:remove']"
              v-if="scope.row.applyBillStatus != 2"
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

    <!-- 添加或修改科室申领对话框（布局对齐到货验收 apply-modal） -->
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
                    <el-form-item label="单号" prop="applyBillNo" class="form-item-header-billno head-label-nowrap">
                      <el-input v-model="form.applyBillNo" :disabled="true" :title="form.applyBillNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="申领状态" prop="billStatus" class="head-label-nowrap">
                      <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态" :disabled="true" clearable>
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
                    <el-form-item label="科室" prop="departmentId" class="apply-modal-label-required head-label-nowrap">
                      <SelectDepartment v-model="form.departmentId" :disabled="isDeptLocked"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" class="head-label-nowrap">
                      <el-input :value="creatorDisplayName" disabled placeholder="—" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="申请日期" prop="applyBillDate" class="head-label-nowrap">
                      <el-date-picker
                        clearable
                        v-model="form.applyBillDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        :disabled="true"
                        placeholder="请选择申请日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="操作人" prop="userId" class="head-label-nowrap">
                      <SelectDeptApplyOperator v-model="form.userId" :department-id="form.departmentId" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8" class="apply-modal-form-row apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">科室申领明细信息</span>
                  <el-button
                    v-if="!action"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    @click="openOutboundRefDialog(null)"
                  >关联出库单一览</el-button>
                  <template v-if="action">
                    <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="nameBtn">添加</el-button>
                    <el-button type="success" size="small" class="spd-btn spd-btn--secondary" @click="handleRefTemplate">引用模板</el-button>
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteBasApplyEntry">删除</el-button>
                    <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
                  </template>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
              <div class="table-wrapper">
              <el-table
                :data="basApplyEntryList"
                class="apply-detail-table"
                :row-class-name="applyDetailRowClassName"
                @selection-change="handleBasApplyEntrySelectionChange"
                ref="basApplyEntry"
                :height="detailTableHeight"
                border
                :summary-method="getSummaries"
                show-summary
              >
                <el-table-column type="selection" width="60" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                <el-table-column label="产品编码" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="产品名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
                <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')" />
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNestedNumber(a,b,'unitPrice')">
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="action ? '数量' : '申请数量'" prop="qty" width="96" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input
                      v-if="action"
                      clearable
                      v-model="scope.row.qty"
                      placeholder="数量"
                      onkeyup="value=value.replace(/\D/g,'')"
                      onafterpaste="value=value.replace(/\D/g,'')"
                      @blur="form.result=$event.target.value"
                      @input="qtyChange(scope.row)"
                    />
                    <span v-else>{{ fmtQty(scope.row.qty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="仓库库存" prop="availableStockQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.availableStockQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="最小包装数" align="center" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtMinPackageQty(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库存仓库" align="center" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ (scope.row.stockWarehouse && scope.row.stockWarehouse.name) ? scope.row.stockWarehouse.name : '—' }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="待出库数量" prop="pendingOutboundQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.pendingOutboundQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="出库待审核数量" prop="ckPendingAuditQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.ckPendingAuditQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已下推出库合计" prop="linkedCkQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.linkedCkQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已审核出库数量" prop="ckAuditedQty" width="118" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.ckAuditedQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="已作废数量" prop="whLineVoidQty" width="100" align="right" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ fmtQty(scope.row.whLineVoidQty) }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="!action" label="关联出库" width="88" align="center">
                  <template slot-scope="scope">
                    <el-button type="text" size="small" @click="openOutboundRefDialog(scope.row.id)">查看</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                  </template>
                </el-table-column>

                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.remark" placeholder="备注" />
                  </template>
                </el-table-column>
                <el-table-column v-if="action" label="操作" align="center" width="100">
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
          </div>
        </transition>
      </div>
    </transition>

    <!-- 引用模板弹窗：制单模板（非打印设置），上搜索+左模板名列表+右明细 -->
    <transition name="modal-fade">
      <div v-if="templateDialogVisible" class="local-modal-mask template-dialog-mask" @click.self="closeTemplateDialog">
        <transition name="modal-zoom">
          <div v-if="templateDialogVisible" class="local-modal-content template-dialog-content">
            <div class="modal-header">
              <div class="modal-title">引用模板</div>
              <el-button size="small" @click="closeTemplateDialog" class="close-btn">关闭</el-button>
            </div>
            <div class="template-dialog-body">
              <!-- 顶部搜索框：仅搜索条件输入 -->
              <div class="template-search-box">
                <div class="template-search-row">
                  <el-input
                    v-model="templateNameSearch"
                    placeholder="按模板名称搜索"
                    clearable
                    class="template-search-input"
                    @keyup.enter.native="loadTemplateList"
                  />
                </div>
              </div>
              <!-- 中部：新增、删除、搜索、取消、引用按钮（与申领单新增按钮大小一致 medium） -->
              <div class="template-action-row">
                <el-button type="primary" size="medium" icon="el-icon-plus" @click="openAddTemplateDialog">新增</el-button>
                <el-button type="danger" size="medium" icon="el-icon-delete" :disabled="!selectedTemplate || !templateDetailSelection.length" @click="handleDeleteTemplateDetail">删除</el-button>
                <el-button type="primary" size="medium" icon="el-icon-search" @click="loadTemplateList">搜索</el-button>
                <el-button size="medium" icon="el-icon-refresh" @click="handleRefreshTemplate">刷 新</el-button>
                <el-button type="primary" size="medium" :disabled="!selectedTemplate" @click="confirmRefTemplate">引 用</el-button>
                <el-button type="primary" size="medium" :disabled="!selectedTemplate" @click="handleSaveTemplate">保 存</el-button>
              </div>
              <!-- 下部分：左模板名称列表 + 右侧明细框（仅保留列头） -->
              <div class="template-split-layout">
                <div class="template-list-box">
                  <div class="template-list-title">模板名称</div>
                  <div class="template-list-inner">
                    <div
                      v-for="item in printTemplateList"
                      :key="item.id"
                      :class="['template-list-item', { active: selectedTemplate && selectedTemplate.id === item.id }]"
                      @click="onSelectTemplate(item)"
                    >
                      <span class="template-list-item-name" @dblclick.stop="openRenameTemplateDialog(item)">{{ item.templateName }}</span>
                      <el-button type="text" size="mini" icon="el-icon-delete" class="template-list-item-delete" @click.stop="handleDeleteTemplateItem(item)">删除</el-button>
                    </div>
                    <div v-if="!printTemplateList || printTemplateList.length === 0" class="template-list-empty">暂无制单模板</div>
                  </div>
                </div>
                <!-- 右侧：明细框（表格设 height 固定表头）+ 分页固定在外侧底部 -->
                <div class="template-detail-table-wrap">
                  <div ref="templateDetailTableInner" class="template-detail-table-inner">
                    <el-table ref="templateDetailTable" :data="templateDetailPageList" :height="templateDetailTableHeight" border stripe size="small" show-header @selection-change="handleTemplateDetailSelectionChange">
                    <el-table-column type="selection" width="50" align="center" />
                    <el-table-column label="序号" width="50" align="center">
                      <template slot-scope="scope">
                        {{ (templateDetailPageNum - 1) * templateDetailPageSize + scope.$index + 1 }}
                      </template>
                    </el-table-column>
                    <el-table-column label="耗材编码" min-width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="耗材名称" min-width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.name ? scope.row.material.name : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.model ? scope.row.material.model : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" width="80" align="center">
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" width="90" align="center" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.price != null ? scope.row.material.price : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" min-width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName ? scope.row.material.fdFactory.factoryName : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" min-width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name ? scope.row.material.supplier.name : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" min-width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证有效期" width="110" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.periodDate ? parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="库房分类" width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName ? scope.row.material.fdWarehouseCategory.warehouseCategoryName : '—' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="财务分类" width="100" show-overflow-tooltip>
                      <template slot-scope="scope">
                        {{ scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName ? scope.row.material.fdFinanceCategory.financeCategoryName : '—' }}
                      </template>
                    </el-table-column>
                  </el-table>
                  </div>
                  <div class="template-detail-pagination">
                    <pagination
                      v-show="templateDetailList.length > 0"
                      :total="templateDetailList.length"
                      :page.sync="templateDetailPageNum"
                      :limit.sync="templateDetailPageSize"
                      :page-sizes="[10, 20, 50]"
                      @pagination="handleTemplateDetailPagination"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 双击模板：修改模板名称小窗（仅改内存，点主弹窗保存按钮才提交） -->
    <el-dialog title="修改模板名称" :visible.sync="renameTemplateDialogVisible" width="400px" append-to-body :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="renameTemplateName" placeholder="请输入模板名称" clearable maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="renameTemplateDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmRenameTemplate">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 未选模板时点新增：维护模板名称小窗，确定后创建空模板并选中 -->
    <el-dialog title="维护模板名称" :visible.sync="newTemplateNameDialogVisible" width="400px" append-to-body :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="newTemplateName" placeholder="请输入模板名称" clearable maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="closeNewTemplateNameDialog">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmNewTemplateName">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 新增制单模板弹窗：样式与添加科室申领一致 -->
    <transition name="modal-fade">
      <div v-if="addTemplateDialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="addTemplateDialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ addTemplateAppendMode ? '往当前模板插入明细' : '新增制单模板' }}</div>
              <el-button size="small" @click="closeAddTemplateDialog" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="addTemplateFormRef" :model="addTemplateForm" :rules="addTemplateRules" label-width="70px" size="small" class="modal-form-compact modal-form-wrapper add-template-form">
              <div class="form-fields-container add-template-search-row">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="供应商名称" prop="supplierId">
                      <SelectSupplier v-model="addTemplateForm.supplierId" :value2="false"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="耗材名称" prop="materialKeyword">
                      <el-input v-model="addTemplateForm.materialKeyword" placeholder="请输入耗材名称或首字母" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="规格搜索" prop="speciSearch">
                      <el-input v-model="addTemplateForm.speciSearch" placeholder="请输入规格或首字母" clearable />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>模板明细信息</span>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button type="primary" icon="el-icon-plus" size="medium" @click="nameBtnForTemplate">添加</el-button>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteAddTemplateEntry">删除</el-button>
                </el-col>
                <el-col :span="1.5" v-show="false">
                  <el-button size="medium" @click="closeAddTemplateDialog">取 消</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="primary" icon="el-icon-search" size="medium" @click="handleAddTemplateSearch">搜 索</el-button>
                </el-col>
                <el-col :span="1.5">
                  <el-button type="primary" size="medium" @click="submitAddTemplate">确 认</el-button>
                </el-col>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="addTemplateDetailPageList" row-key="id" :row-class-name="rowAddTemplateMaterialIndex" @selection-change="handleAddTemplateEntrySelectionChange" ref="addTemplateEntryTable" height="100%" border>
                  <el-table-column type="selection" width="50" align="center" resizable />
                  <el-table-column label="序号" align="center" width="60" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ (addTemplateDetailPageNum - 1) * addTemplateDetailPageSize + scope.$index + 1 }}
                    </template>
                  </el-table-column>
                  <el-table-column label="耗材编码" align="center" prop="code" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="名称" align="center" prop="name" width="140" show-overflow-tooltip resizable/>
                  <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable/>
                  <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdUnit && scope.row.fdUnit.unitName ? scope.row.fdUnit.unitName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单价" align="center" width="90" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.price != null ? scope.row.price : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" align="center" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdFactory && scope.row.fdFactory.factoryName ? scope.row.fdFactory.factoryName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="供应商" align="center" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" align="center" prop="registerNo" width="120" show-overflow-tooltip resizable/>
                  <el-table-column label="注册号有效期" align="center" width="110" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.periodDate ? parseTime(scope.row.periodDate, '{y}-{m}-{d}') : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="库房分类" align="center" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName ? scope.row.fdWarehouseCategory.warehouseCategoryName : '—' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="财务分类" align="center" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName ? scope.row.fdFinanceCategory.financeCategoryName : '—' }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="add-template-pagination-wrap">
                <pagination
                  v-show="addTemplateFilteredList.length > 0"
                  :total="addTemplateFilteredList.length"
                  :page.sync="addTemplateDetailPageNum"
                  :limit.sync="addTemplateDetailPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  @pagination="handleAddTemplateDetailPagination"
                />
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog
      :title="outboundRefFilterEntryId != null ? '本行关联出库单据与明细' : '关联出库单据与明细'"
      :visible.sync="outboundRefDialogVisible"
      width="1120px"
      append-to-body
      @closed="outboundRefFilterEntryId = null"
    >
      <el-table :data="filteredOutboundRefList" border size="small" max-height="420" empty-text="暂无关联出库记录">
        <el-table-column label="申领明细" align="center" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ outboundRefEntryLabel(scope.row.basApplyEntryId) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" align="center" min-width="120" prop="materialName" show-overflow-tooltip />
        <el-table-column label="库房申请单号" align="center" width="140" prop="whApplyBillNo" show-overflow-tooltip />
        <el-table-column label="出库单号" align="center" width="140" prop="ckBillNo" show-overflow-tooltip />
        <el-table-column label="出库状态" align="center" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.ckBillStatus" />
          </template>
        </el-table-column>
        <el-table-column label="关联数量" align="right" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtQty(scope.row.refQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库明细数量" align="right" width="110" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtQty(scope.row.ckEntryQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库单ID" align="center" width="100" prop="ckBillId" show-overflow-tooltip />
        <el-table-column label="出库明细ID" align="center" width="100" prop="ckEntryId" show-overflow-tooltip />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="outboundRefDialogVisible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <!-- 科室申领：全院聚合可用库存；制单模板：仍按仓库选库存明细 -->
    <SelectDepartmentApplyAvailableStock
      v-if="DialogComponentShow && selectTarget === 'apply'"
      :DialogComponentShow="DialogComponentShow"
      :selectedDetails="basApplyEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    />
    <SelectInventory
      v-if="DialogComponentShow && selectTarget === 'template'"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="currentSelectWarehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    />

  </div>
</template>

<script>
import { listApply, getApply, delApply, addApply, updateApply } from "@/api/department/apply";
import { listApplyTemplate, getApplyTemplate, addApplyTemplate, updateApplyTemplate, deleteApplyTemplate } from "@/api/department/applyTemplate";
import { listMaterialDeptSafe } from "@/api/foundation/material";
import { pinyin } from 'pinyin-pro';
import { matchMaterialKeyword, normalizeMaterialSearchKeyword } from '@/utils/materialSearch';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectDeptApplyOperator from '@/components/SelectModel/SelectDeptApplyOperator';
import SelectSupplier from '@/components/SelectModel/SelectSupplierDept';
import SelectDepartmentApplyAvailableStock from '@/components/SelectModel/SelectDepartmentApplyAvailableStock';
import SelectInventory from '@/components/SelectModel/SelectInventory';
import { assertMinPackageQtyOnSave } from '@/utils/minPackageQty';
import { parseTime } from '@/utils/ruoyi';

function buildDefaultDateRange() {
  const today = new Date();
  const endDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const beginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { beginDate, endDate };
}

export default {
  name: "dApply",
  dicts: ['biz_status','way_status'],
  components: { SelectWarehouse, SelectDepartment, SelectDeptApplyOperator, SelectSupplier, SelectDepartmentApplyAvailableStock, SelectInventory },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      /** 库存选择弹窗：当前用于哪个表单（apply=科室申领明细，template=新增制单模板明细） */
      selectTarget: 'apply',
      /** 制单模板选库存明细时传入的仓库 */
      currentSelectWarehouseValue: '',
      /** 新增制单模板弹窗：搜索条件（首字母+模糊） */
      addTemplateDialogVisible: false,
      addTemplateForm: { supplierId: null, materialKeyword: '', speciSearch: '' },
      /** 耗材基础产品字典（仅在用），加载后前端过滤 */
      addTemplateMaterialList: [],
      checkedAddTemplateEntry: [],
      /** 新增制单模板-明细分页 */
      addTemplateDetailPageNum: 1,
      addTemplateDetailPageSize: 10,
      /** 跨页勾选：已选中的耗材 id 数组（响应式） */
      addTemplateSelectedIds: [],
      addTemplateRules: {},
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedBasApplyEntry: [],
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
      // 科室申领表格数据
      applyList: [],
      selectRow: [],
      // 科室申领明细表格数据
      basApplyEntryList: [],
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 引用模板弹窗（制单模板，非打印设置）
      templateDialogVisible: false,
      templateNameSearch: '',
      printTemplateList: [],
      selectedTemplate: null,
      templateDetailList: [],
      /** 引用模板-明细分页 */
      templateDetailPageNum: 1,
      templateDetailPageSize: 10,
      /** 双击模板：修改名称小窗 */
      renameTemplateDialogVisible: false,
      renameTemplateItem: null,
      renameTemplateName: '',
      /** 未选模板时新增：维护模板名称小窗 */
      newTemplateNameDialogVisible: false,
      newTemplateName: '',
      /** 新增制单模板弹窗是否为“往当前模板插入明细”模式（仅追加到 templateDetailList，不新建模板） */
      addTemplateAppendMode: false,
      /** 引用模板-右侧明细表勾选的行（用于中间删除按钮删除明细） */
      templateDetailSelection: [],
      /** 引用模板-右侧明细表高度（用于固定表头，表格内部滚动） */
      templateDetailTableHeight: 280,
      /** 引用模板后的列配置（供打印等使用） */
      columnList: [],
      //是否显示
      action: true,
      // 新增明细后静默自动保存
      applyAutoSaveTimer: null,
      applyDraftSaving: false,
      /** 查看关联出库单弹窗 */
      outboundRefDialogVisible: false,
      /** null=整单全部明细；有值=仅该 bas_apply_entry.id */
      outboundRefFilterEntryId: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        ...buildDefaultDateRange(),
        departmentId: null,
        userId: null,
        applyBillStatus: null,
        billType: 1, // 只查询申领单类型，排除转科申请（billType=3）
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "change" }
        ],
      }
    };
  },
  computed: {
    /** 引用模板-当前页的明细列表（前端分页） */
    templateDetailPageList() {
      if (!this.templateDetailList || this.templateDetailList.length === 0) {
        return [];
      }
      const start = (this.templateDetailPageNum - 1) * this.templateDetailPageSize;
      return this.templateDetailList.slice(start, start + this.templateDetailPageSize);
    },
    /** 新增制单模板-耗材字典列表（按供应商/耗材名称/规格搜索过滤，支持首字母+模糊） */
    addTemplateFilteredList() {
      let list = this.addTemplateMaterialList || [];
      const supplierId = this.addTemplateForm.supplierId;
      const kw = (this.addTemplateForm.materialKeyword || '').trim();
      const spec = (this.addTemplateForm.speciSearch || '').trim();
      if (supplierId != null && supplierId !== '') {
        list = list.filter(row => row.supplierId === supplierId);
      }
      if (kw) {
        const normalizedKw = normalizeMaterialSearchKeyword(kw);
        list = list.filter(row => matchMaterialKeyword(row, normalizedKw));
      }
      if (spec) {
        const normalizedSpec = normalizeMaterialSearchKeyword(spec);
        list = list.filter(row => {
          const speci = row.speci || '';
          return speci.includes(normalizedSpec) || matchMaterialKeyword(row, normalizedSpec);
        });
      }
      return list;
    },
    /** 新增制单模板-当前页明细（分页切片） */
    addTemplateDetailPageList() {
      const list = this.addTemplateFilteredList || [];
      const start = (this.addTemplateDetailPageNum - 1) * this.addTemplateDetailPageSize;
      return list.slice(start, start + this.addTemplateDetailPageSize);
    },
    /** 弹窗明细表固定高度：表体可滚动，合计行始终在表格区域最底部 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },
    /** 已有明细、修改模式或正在选库存时锁定科室 */
    isDeptLocked() {
      return this.DialogComponentShow
        || (this.basApplyEntryList && this.basApplyEntryList.length > 0)
        || !!(this.form && this.form.id);
    },
    /** 制单人：已保存单据显示后端姓名；新增显示当前登录用户 */
    creatorDisplayName() {
      const n = this.form && this.form.createrNmae;
      if (n) {
        return n;
      }
      if (!this.form || !this.form.id) {
        return (this.$store.state.user && this.$store.state.user.name) ? this.$store.state.user.name : '';
      }
      return '—';
    },
    /** 关联出库一览（可按申领明细行过滤） */
    filteredOutboundRefList() {
      const list = (this.form && this.form.outboundRefList) || [];
      const eid = this.outboundRefFilterEntryId;
      if (eid == null || eid === '') {
        return list;
      }
      return list.filter(r => r.basApplyEntryId == eid);
    }
  },
  watch: {
    templateDialogVisible(val) {
      if (val) {
        this.$nextTick(() => {
          setTimeout(() => this.calcTemplateDetailTableHeight(), 120);
        });
      }
    },
    addTemplateDetailPageList: {
      handler(list) {
        if (!this.addTemplateDialogVisible || !list || !this.$refs.addTemplateEntryTable) return
        this.$nextTick(() => {
          list.forEach(row => {
            this.$refs.addTemplateEntryTable.toggleRowSelection(row, this.addTemplateSelectedIds.includes(row.id))
          })
        })
      },
      deep: true
    },
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
  },
  created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
    const that = this;
    this._templateDetailTableResize = () => {
      if (that.templateDialogVisible) that.calcTemplateDetailTableHeight();
    };
    window.addEventListener('resize', this._templateDetailTableResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
    if (this._templateDetailTableResize) window.removeEventListener('resize', this._templateDetailTableResize);
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
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    /** 嵌套字段排序：按 path 如 'department.name' 取值后比较 */
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
    /** 数值字段排序（单价等） */
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
      if (!table || !this.applyList || !this.applyList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.applyList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    /** 查询科室申领列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      params.billType = 1;
      listApply(params).then(response => {
        this.applyList = response.rows || [];
        this.total = response.total != null ? response.total : 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.applyList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    nameBtn() {
      this.selectTarget = 'apply'
      this.DialogComponentShow = true
    },
    closeDialog() {
      this.DialogComponentShow = false
    },
    /** 打开新增制单模板弹窗：有选中模板则往当前模板插入明细，无选中则先弹维护模板名称小窗 */
    openAddTemplateDialog() {
      if (this.selectedTemplate) {
        this.addTemplateAppendMode = true
        this.addTemplateForm = { supplierId: null, materialKeyword: '', speciSearch: '' }
        this.addTemplateMaterialList = []
        this.checkedAddTemplateEntry = []
        this.addTemplateDetailPageNum = 1
        this.addTemplateDetailPageSize = 10
        this.addTemplateSelectedIds = []
        this.addTemplateDialogVisible = true
        listMaterialDeptSafe().then(res => {
          const rows = Array.isArray(res) ? res : (res && res.data ? res.data : [])
          this.addTemplateMaterialList = rows
        }).catch(() => {
          this.addTemplateMaterialList = []
        })
      } else {
        this.newTemplateName = ''
        this.newTemplateNameDialogVisible = true
      }
    },
    /** 关闭新增制单模板弹窗 */
    closeAddTemplateDialog() {
      this.addTemplateDialogVisible = false
      this.addTemplateAppendMode = false
      this.addTemplateForm = { supplierId: null, materialKeyword: '', speciSearch: '' }
      this.addTemplateMaterialList = []
      this.checkedAddTemplateEntry = []
      this.addTemplateSelectedIds = []
    },
    /** 新增制单模板-搜索（条件已实时过滤，此处仅将分页重置为第 1 页） */
    handleAddTemplateSearch() {
      this.addTemplateDetailPageNum = 1
    },
    /** 新增制单模板-明细分页变更 */
    handleAddTemplateDetailPagination() {},
    /** 首字母（用于搜索过滤） */
    _getFirstLetters(str) {
      if (!str || typeof str !== 'string') return ''
      try {
        return pinyin(str, { pattern: 'first', toneType: 'none' }).replace(/\s/g, '') || ''
      } catch (e) {
        return ''
      }
    },
    rowAddTemplateMaterialIndex({ row, rowIndex }) {
      row._index = rowIndex + 1
    },
    /** 新增制单模板弹窗内：添加明细（打开库存选择，与科室申领添加一致） */
    nameBtnForTemplate() {
      if (!this.addTemplateForm.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      this.selectTarget = 'template'
      this.currentSelectWarehouseValue = this.addTemplateForm.warehouseId
      this.DialogComponentShow = true
    },
    /** 删除新增制单模板明细（多选） */
    handleDeleteAddTemplateEntry() {
      const rows = this.checkedAddTemplateEntry
      if (!rows || rows.length === 0) {
        this.$modal.msgError('请先选择要删除的明细')
        return
      }
      this.addTemplateEntryList = this.addTemplateEntryList.filter(row => !rows.includes(row))
    },
    handleAddTemplateEntrySelectionChange(rows) {
      this.checkedAddTemplateEntry = rows
      const pageList = this.addTemplateDetailPageList || []
      const pageIds = new Set(pageList.map(r => r.id))
      this.addTemplateSelectedIds = this.addTemplateSelectedIds.filter(id => !pageIds.has(id))
      rows.forEach(row => this.addTemplateSelectedIds.push(row.id))
    },
    rowAddTemplateEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1
    },
    /** 删除新增制单模板单行明细 */
    handleDeleteAddTemplateDetailRow(index) {
      this.addTemplateEntryList.splice(index, 1)
    },
    /** 确认：往当前模板插入明细（追加模式）或 保存为新制单模板（支持跨页勾选） */
    submitAddTemplate() {
      const ids = this.addTemplateSelectedIds
      const list = (this.addTemplateFilteredList || []).filter(row => ids.includes(row.id))
      if (list.length === 0) {
        this.$message.warning('请至少勾选一条耗材明细')
        return
      }
      if (this.addTemplateAppendMode && this.selectedTemplate) {
        const existingMaterialIds = new Set((this.templateDetailList || []).map(e => e.materialId))
        const duplicates = list.filter(row => existingMaterialIds.has(row.id))
        if (duplicates.length > 0) {
          const name = (duplicates[0].name || duplicates[0].code || '该耗材')
          this.$message.warning('【' + name + '】该产品已经存在模板中了，请勿重复维护！')
          return
        }
        const newEntries = list.map(row => ({
          materialId: row.id,
          material: row,
          qty: 1
        }))
        this.templateDetailList = (this.templateDetailList || []).concat(newEntries)
        this.$message.success('已插入明细，请点击保存按钮保存模板')
        this.closeAddTemplateDialog()
        return
      }
      const templateName = '制单模板_' + this.parseTime(new Date(), '{y}-{m}-{d} {h}:{i}')
      const payload = {
        templateName,
        warehouseId: null,
        remark: '',
        entryList: list.map(row => ({
          materialId: row.id,
          material: row,
          qty: 1
        }))
      }
      addApplyTemplate(payload).then(() => {
        this.$message.success('保存成功')
        this.closeAddTemplateDialog()
        if (this.templateDialogVisible) this.loadTemplateList()
      }).catch(() => {
        this.$message.error('保存失败')
      })
    },
    /** 双击模板：打开修改名称小窗 */
    openRenameTemplateDialog(item) {
      if (!item) return
      this.renameTemplateItem = item
      this.renameTemplateName = item.templateName || ''
      this.renameTemplateDialogVisible = true
    },
    /** 确定修改模板名称（仅更新内存，主弹窗点保存才提交） */
    confirmRenameTemplate() {
      const name = (this.renameTemplateName || '').trim()
      if (!name) {
        this.$message.warning('请输入模板名称')
        return
      }
      if (!this.renameTemplateItem) {
        this.renameTemplateDialogVisible = false
        return
      }
      const id = this.renameTemplateItem.id
      const idx = this.printTemplateList.findIndex(t => t.id === id)
      if (idx >= 0) this.$set(this.printTemplateList[idx], 'templateName', name)
      if (this.selectedTemplate && this.selectedTemplate.id === id) this.selectedTemplate.templateName = name
      this.renameTemplateDialogVisible = false
      this.renameTemplateItem = null
      this.$message.success('名称已更新，请点击保存按钮保存')
    },
    /** 关闭维护模板名称小窗（新建模板用） */
    closeNewTemplateNameDialog() {
      this.newTemplateNameDialogVisible = false
      this.newTemplateName = ''
    },
    /** 确定维护模板名称：创建空模板并选中，随后可点新增插入明细 */
    confirmNewTemplateName() {
      const name = (this.newTemplateName || '').trim()
      if (!name) {
        this.$message.warning('请输入模板名称')
        return
      }
      addApplyTemplate({ templateName: name, warehouseId: null, remark: '', entryList: [] }).then(() => {
        this.$message.success('模板已创建，可点击新增插入明细后再保存')
        this.closeNewTemplateNameDialog()
        this.loadTemplateList()
      }).catch(() => {
        this.$message.error('创建失败')
      })
    },
    /** 打开引用模板弹窗（制单模板） */
    handleRefTemplate() {
      this.templateDialogVisible = true;
      this.templateNameSearch = '';
      this.printTemplateList = [];
      this.selectedTemplate = null;
      this.templateDetailList = [];
      this.loadTemplateList();
    },
    /** 按模板名称加载制单模板列表；refresh 为 true 时不自动选中第一项（用于点击刷新按钮） */
    loadTemplateList(refresh) {
      listApplyTemplate({ templateName: this.templateNameSearch }).then(res => {
        this.printTemplateList = res.data || [];
        if (refresh) {
          return;
        }
        if (this.printTemplateList.length > 0 && !this.selectedTemplate) {
          this.onSelectTemplate(this.printTemplateList[0]);
        } else if (this.printTemplateList.length === 0) {
          this.selectedTemplate = null;
          this.templateDetailList = [];
        }
      }).catch(() => {
        this.printTemplateList = [];
      });
    },
    /** 选择左侧模板，加载明细 */
    onSelectTemplate(item) {
      this.selectedTemplate = item;
      this.templateDetailPageNum = 1;
      this.templateDetailSelection = [];
      getApplyTemplate(item.id).then(res => {
        const data = res.data || {};
        this.templateDetailList = data.entryList || [];
        this.$nextTick(() => this.calcTemplateDetailTableHeight());
      }).catch(() => {
        this.templateDetailList = [];
      });
    },
    /** 计算引用模板右侧明细表高度（固定表头用） */
    calcTemplateDetailTableHeight() {
      this.$nextTick(() => {
        const el = this.$refs.templateDetailTableInner;
        if (el && el.clientHeight) {
          this.templateDetailTableHeight = el.clientHeight;
        }
      });
    },
    /** 关闭引用模板弹窗 */
    closeTemplateDialog() {
      this.templateDialogVisible = false;
      this.templateNameSearch = '';
      this.printTemplateList = [];
      this.selectedTemplate = null;
      this.templateDetailList = [];
      this.templateDetailPageNum = 1;
      this.templateDetailPageSize = 10;
    },
    /** 引用模板-明细分页变更（前端分页，无需请求） */
    handleTemplateDetailPagination() {
      // 页码/每页条数由 .sync 更新，templateDetailPageList 计算属性自动响应
    },
    /** 确认引用模板：将选中制单模板的明细应用到当前申领单 */
    confirmRefTemplate() {
      if (!this.selectedTemplate || !this.templateDetailList || this.templateDetailList.length === 0) {
        this.$message.warning('请选择有明细的制单模板');
        return;
      }
      this.templateDetailList.forEach(entry => {
        this.basApplyEntryList.push({
          materialId: entry.materialId,
          material: entry.material || {},
          qty: entry.qty || 1,
          unitPrice: null,
          price: null,
          amt: null,
          remark: null
        });
      });
      this.calculateTotals();
      this.$message.success('已应用制单模板明细');
      this.closeTemplateDialog();
    },
    /** 右侧明细表勾选变更 */
    handleTemplateDetailSelectionChange(val) {
      this.templateDetailSelection = val || [];
    },
    /** 删除当前模板中勾选的明细行（不删整模板） */
    handleDeleteTemplateDetail() {
      if (!this.selectedTemplate) {
        this.$message.warning('请先选择模板');
        return;
      }
      const rows = this.templateDetailSelection;
      if (!rows || rows.length === 0) {
        this.$message.warning('请先在右侧明细中勾选要删除的行');
        return;
      }
      const set = new Set(rows)
      this.templateDetailList = this.templateDetailList.filter(entry => !set.has(entry))
      this.templateDetailSelection = []
      this.$nextTick(() => {
        if (this.$refs.templateDetailTable) this.$refs.templateDetailTable.clearSelection()
      })
      this.$message.success('已移除选中的明细，请点击保存按钮保存模板')
    },
    /** 刷新：重新加载模板列表并取消选中，不自动选中任一模板 */
    handleRefreshTemplate() {
      this.selectedTemplate = null
      this.templateDetailList = []
      this.templateDetailPageNum = 1
      this.templateDetailSelection = []
      this.loadTemplateList(true)
      this.$nextTick(() => {
        if (this.$refs.templateDetailTable) this.$refs.templateDetailTable.clearSelection()
      })
      this.$message.success('已刷新，请重新选择模板')
    },
    /** 删除模板名称列表中的某一项（该模板） */
    handleDeleteTemplateItem(item) {
      if (!item || !item.id) return;
      this.$confirm('确定删除该制单模板吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        return deleteApplyTemplate(item.id);
      }).then(() => {
        this.$message.success('删除成功');
        if (this.selectedTemplate && this.selectedTemplate.id === item.id) {
          this.selectedTemplate = null;
          this.templateDetailList = [];
          this.templateDetailPageNum = 1;
        }
        this.loadTemplateList();
      }).catch(() => {});
    },
    /** 保存当前选中的制单模板（更新模板及明细） */
    handleSaveTemplate() {
      if (!this.selectedTemplate || !this.selectedTemplate.id) {
        this.$message.warning('请先选择要保存的模板');
        return;
      }
      const entryList = (this.templateDetailList || []).map((e, i) => ({
        materialId: e.materialId,
        qty: e.qty != null ? e.qty : 1,
        sortOrder: i + 1
      }));
      const payload = {
        id: this.selectedTemplate.id,
        templateName: this.selectedTemplate.templateName,
        warehouseId: this.selectedTemplate.warehouseId,
        remark: this.selectedTemplate.remark,
        entryList
      };
      updateApplyTemplate(payload).then(() => {
        this.$message.success('保存成功');
        getApplyTemplate(this.selectedTemplate.id).then(res => {
          this.templateDetailList = (res.data && res.data.entryList) ? res.data.entryList : [];
          this.templateDetailPageNum = 1;
        });
      }).catch(() => {});
    },
    selectData(val) {
      this.selectRow = val
      if (this.selectTarget === 'template') {
        val.forEach(item => {
          this.addTemplateEntryList.push({
            materialId: item.materialId,
            material: item.material || {},
            qty: item.qty || 1
          })
        })
      } else {
        let addedCount = 0;
        let skippedCount = 0;
        const normalizeId = (v) => {
          if (v == null) return null;
          const s = String(v).trim();
          return s === '' ? null : s;
        };
        const existedKeys = new Set(
          (this.basApplyEntryList || [])
            .filter(e => e && e.materialId != null)
            .map(e => {
              const mid = normalizeId(e.materialId) || "x";
              const wid = normalizeId(
                e.stockWarehouseId != null
                  ? e.stockWarehouseId
                  : (e.stockWarehouse && e.stockWarehouse.id != null
                    ? e.stockWarehouse.id
                    : e.warehouseId)
              ) || "x";
              return `${mid}__${wid}`;
            })
        );
        val.forEach(item => {
          const candidateKey = `${normalizeId(item.materialId) || "x"}__${normalizeId(item.warehouseId) || "x"}`;
          if (existedKeys.has(candidateKey)) {
            skippedCount++;
            return;
          }
          const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : null
          const defaultQty = this.getDefaultApplyQtyFromMaterial(item)
          const row = {
            materialId: item.materialId,
            stockWarehouseId: item.warehouseId != null ? item.warehouseId : null,
            stockWarehouse: item.warehouseId != null ? {
              id: item.warehouseId,
              code: item.warehouseCode,
              name: item.warehouseName
            } : null,
            material: {
              id: item.materialId,
              code: item.materialCode,
              name: item.materialName,
              speci: item.materialSpeci,
              model: item.materialModel,
              registerNo: item.registerNo,
              packageSpeci: item.packageSpeci,
              minPackageQty: item.minPackageQty,
              minPackQty: item.minPackQty,
              minimumPackageQty: item.minimumPackageQty,
              isWay: item.isWay,
              fdUnit: item.unitName ? { unitName: item.unitName } : null,
              fdFactory: item.factoryName ? { factoryName: item.factoryName } : null,
              fdWarehouseCategory: item.warehouseCategoryName ? { warehouseCategoryName: item.warehouseCategoryName } : null,
              fdFinanceCategory: item.financeCategoryName ? { financeCategoryName: item.financeCategoryName } : null
            },
            unitPrice: unitPrice,
            qty: String(defaultQty),
            amt: '0',
            availableStockQty: item.availableQty != null ? item.availableQty : null,
            batchNo: null,
            batchNumer: null,
            beginTime: null,
            endTime: null,
            remark: null
          }
          this.basApplyEntryList.push(row)
          existedKeys.add(candidateKey);
          if (row.qty && row.unitPrice) {
            this.qtyChange(row);
          }
          addedCount++;
        })
        this.calculateTotals()
        if (addedCount > 0) {
          this.debouncedAutoSaveApply();
        }
        if (skippedCount > 0) {
          this.$message.warning(`已跳过 ${skippedCount} 条重复明细`);
        }
      }
    },
    /**
     * 科室申请默认数量：优先最小包装数；为空/空白/0/无效时返回 1。
     * 支持库存行字段、material 字段和 packageSpeci 文本提取。
     */
    getDefaultApplyQtyFromMaterial(item) {
      const src = item && typeof item === "object" ? item : {};
      const m = src.material && typeof src.material === "object" ? src.material : {};
      const toPositiveInt = (v) => {
        if (v == null || String(v).trim() === "") {
          return null;
        }
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) {
          return null;
        }
        return Math.max(1, Math.floor(n));
      };
      const keys = ["minPackageQty", "minPackQty", "minimumPackageQty", "min_package_qty"];
      for (const key of keys) {
        const n = toPositiveInt(src[key]);
        if (n != null) return n;
      }
      for (const key of keys) {
        const n = toPositiveInt(m[key]);
        if (n != null) return n;
      }
      const packageSpeci = src.packageSpeci != null ? src.packageSpeci : m.packageSpeci;
      if (packageSpeci != null && String(packageSpeci).trim() !== "") {
        const txt = String(packageSpeci).trim();
        const pure = toPositiveInt(txt);
        if (pure != null) return pure;
        const mch = txt.match(/\d+(?:\.\d+)?/);
        if (mch) {
          const n = toPositiveInt(mch[0]);
          if (n != null) return n;
        }
      }
      return 1;
    },
    // 新增明细后防抖自动保存草稿
    debouncedAutoSaveApply() {
      if (this.applyAutoSaveTimer) {
        clearTimeout(this.applyAutoSaveTimer);
      }
      this.applyAutoSaveTimer = setTimeout(() => {
        this.applyAutoSaveTimer = null;
        this.saveApplyDraftSilently();
      }, 500);
    },
    // 科室申请静默保存（不关闭页面，不提示成功）
    saveApplyDraftSilently() {
      if (!this.open || !this.action || this.applyDraftSaving) {
        return;
      }
      if (!this.form.departmentId) {
        return;
      }
      const list = (this.basApplyEntryList || []).filter(item => item && item.materialId);
      if (!list.length) {
        return;
      }
      const invalidQty = list.some(item => item.qty == null || item.qty === '' || Number(item.qty) <= 0);
      if (invalidQty) {
        return;
      }
      if (!assertMinPackageQtyOnSave(this, list, '科室申领')) {
        return;
      }
      this.form.basApplyEntryList = this.basApplyEntryList;
      let totalAmt = 0;
      this.basApplyEntryList.forEach(item => {
        if (item.amt && !isNaN(item.amt)) {
          totalAmt += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = this.toMoneyStorage(totalAmt);
      this.applyDraftSaving = true;
      const ax = { headers: { repeatSubmit: false, hideError: true } };
      const done = () => {
        this.applyDraftSaving = false;
      };
      if (this.form.id != null) {
        updateApply(this.form, ax).then(() => {}).catch(() => {}).finally(done);
      } else {
        addApply(this.form, ax).then((response) => {
          if (response && response.data) {
            if (response.data.id) {
              this.form.id = response.data.id;
            }
            if (response.data.applyBillNo) {
              this.form.applyBillNo = response.data.applyBillNo;
            }
            if (this.title === "添加科室申领") {
              this.title = "修改科室申领";
            }
          }
        }).catch(() => {}).finally(done);
      }
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
      if (this.applyAutoSaveTimer) {
        clearTimeout(this.applyAutoSaveTimer);
        this.applyAutoSaveTimer = null;
      }
      this.open = false;
      this.detailSelectedRowMap = {};
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        applyBillNo: null,
        applyBillDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        applyBillStatus: null,
        billType: 1,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.basApplyEntryList = [];
      this.detailSelectedRowMap = {};
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.basApplyEntryList.forEach(item => {
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
    // 表格合计方法
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
        if (column.property === 'qty') {
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
        if (column.property === 'amt') {
          const values = data.map(row => Number(row[prop]));
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = this.formatAmount(total);
          }
          return;
        }
        if (column.property === 'pendingOutboundQty' || column.property === 'ckPendingAuditQty'
          || column.property === 'linkedCkQty' || column.property === 'ckAuditedQty' || column.property === 'whLineVoidQty') {
          const values = data.map(row => {
            const v = row[prop];
            if (v === '' || v == null) return NaN;
            return Number(v);
          });
          if (!values.every(v => isNaN(v))) {
            sums[index] = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
          }
        }
      });
      return sums;
    },
    fmtQty(v) {
      if (v === null || v === undefined || v === '') {
        return '—';
      }
      return v;
    },
    fmtMinPackageQty(row) {
      const src = row && typeof row === 'object' ? row : {};
      const m = src.material && typeof src.material === 'object' ? src.material : {};
      const keys = ['minPackageQty', 'minPackQty', 'minimumPackageQty', 'min_package_qty'];
      for (const key of keys) {
        const v = src[key] != null ? src[key] : m[key];
        if (v != null && String(v).trim() !== '') {
          return v;
        }
      }
      return '—';
    },
    openOutboundRefDialog(entryId) {
      this.outboundRefFilterEntryId = entryId;
      this.outboundRefDialogVisible = true;
    },
    outboundRefEntryLabel(entryId) {
      if (entryId == null || entryId === '') {
        return '—';
      }
      const list = this.basApplyEntryList || [];
      const idx = list.findIndex(e => e.id == entryId);
      return idx >= 0 ? `第${idx + 1}行` : `明细${entryId}`;
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
      this.calculateTotals();
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
      this.queryParams.billType = 1;
      this.queryParams.applyBillNo = null;
      this.queryParams.departmentId = null;
      this.queryParams.applyBillStatus = null;
      Object.assign(this.queryParams, buildDefaultDateRange());
      this.handleQuery();
    },
    // 多选框选中数据（跨页缓存）
    handleSelectionChange(selection) {
      const pageKeys = (this.applyList || [])
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
      const id = row.id;
      getApply(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.applyBillStatus == 1){
          this.form.applyBillStatus = '1';
        }else{
          this.form.applyBillStatus = '2';
        }

        this.title = "查看科室申领";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.applyBillStatus = '1';
      this.form.applyBillDate = this.getBillDate();
      this.title = "添加科室申领";
      this.action = true;
      const uid = this.$store.state.user.userId;
      this.form.userId = uid != null && uid !== '' ? uid : null;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getApply(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.applyBillStatus = '1';
        this.title = "修改科室申领";
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证科室是否选择
      if (!this.form.departmentId) {
        this.$modal.msgError("请先选择科室");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          const validEntries = this.basApplyEntryList.filter(item => item.materialId);
          if (validEntries.length === 0) {
            this.$modal.msgError("请至少添加一条有效明细（选择耗材）");
            return;
          }
          const invalidQty = this.basApplyEntryList.filter(item =>
            item.materialId && (item.qty == null || item.qty === '' || Number(item.qty) <= 0)
          );
          if (invalidQty.length > 0) {
            this.$modal.msgError("存在明细数量为空或0，请填写有效数量后再保存。");
            return;
          }
          if (!assertMinPackageQtyOnSave(this, validEntries, '科室申领')) {
            return;
          }
          this.form.basApplyEntryList = this.basApplyEntryList;
          var totalAmt = 0;
          this.basApplyEntryList.forEach(item => {
            if (item.amt) {
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = this.toMoneyStorage(totalAmt);
          if (this.form.id != null) {
            updateApply(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
              this.getList();
            });
          } else {
            addApply(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 保存成功后更新表单ID，后续保存将变为修改操作
              // 后端返回的response.data就是basApply对象，包含id和applyBillNo
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.applyBillNo) {
                  this.form.applyBillNo = response.data.applyBillNo;
                }
                // 更新标题为修改模式
                this.title = "修改科室申领";
              }
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
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
      const ids = row.id != null ? row.id : this.ids;
      this.$modal.confirm('是否确认删除所选科室申领数据？').then(() => {
        return delApply(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 科室申领明细序号 */
    rowBasApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 明细表行 class（悬停/勾选高亮由 apply-detail-table CSS 接管） */
    applyDetailRowClassName({ row, rowIndex }) {
      this.rowBasApplyEntryIndex({ row, rowIndex });
      const key = row.index;
      if (key != null && this.detailSelectedRowMap && this.detailSelectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** 科室申领明细添加按钮操作 */
    handleAddBasApplyEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumer = "";
      obj.remark = "";
      this.basApplyEntryList.push(obj);
      this.calculateTotals();
    },
    /** 科室申领明细删除按钮操作 */
    handleDeleteBasApplyEntry() {
      if (this.checkedBasApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室申领明细数据");
      } else {
        const basApplyEntryList = this.basApplyEntryList;
        const checkedBasApplyEntry = this.checkedBasApplyEntry;
        this.basApplyEntryList = basApplyEntryList.filter(function(item) {
          return checkedBasApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.basApplyEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleBasApplyEntrySelectionChange(selection) {
      this.checkedBasApplyEntry = selection.map(item => item.index);
      const map = {};
      (selection || []).forEach((row, idx) => {
        const key = row.index != null ? row.index : idx;
        map[key] = true;
      });
      this.detailSelectedRowMap = map;
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/apply/export', {
        ...this.buildExportQueryParams(),
        exportBillIds: String(row.id)
      }, `apply_${row.applyBillNo || row.id}_${new Date().getTime()}.xlsx`)
    },
    /** 导出按钮操作（导出勾选单据明细） */
    handleExport() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先勾选要导出的单据')
        return
      }
      this.download('department/apply/export', {
        ...this.buildExportQueryParams(),
        exportBillIds: this.ids.join(',')
      }, `apply_${new Date().getTime()}.xlsx`)
    },
    buildExportQueryParams() {
      const params = { ...this.queryParams };
      params.billType = 1;
      return params;
    }
  }
};
</script>

<style scoped>
@import '../../caigou/jihua/styles/plan-modal-common.scss';

/* 内部弹窗样式 - 与 outWarehouse/apply 出库申请添加弹窗一致 */
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
  /* 禁止弹窗内容把主布局撑出纵向滚动条（95vh 曾导致超出主内容区高度） */
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow-x: hidden;
  /* 弹窗白底自身不滚动，只在明细表 body 内滚动 */
  overflow-y: hidden;
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
  min-height: 0;
  overflow: hidden;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 主弹窗 apply-modal：与到货验收一致，三块区域铺满标题栏宽度 */
.local-modal-content.apply-modal-root-content .el-form {
  padding: 8px 0 8px !important;
  overflow: visible;
  box-sizing: border-box;
}

.local-modal-content.apply-modal-root-content .modal-header {
  padding: 6px 8px;
}

.local-modal-content.apply-modal-root-content {
  padding-bottom: 8px;
}

.local-modal-content .el-form.modal-form-wrapper {
  padding: 6px 20px 12px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

/* 弹窗内顶部字段区：模板/制单模板等仍用旧卡片样式；apply-modal-query-panel 由 plan-modal-common 接管 */
.local-modal-content .form-fields-container:not(.apply-modal-query-panel) {
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

/* 弹窗内表单紧凑布局（与出库申请一致） */
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

/* 弹窗内明细区：apply-modal-table-panel 由 plan-modal-common 接管边距 */
.local-modal-content .modal-detail-section:not(.apply-modal-table-panel) {
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

/* 新增制单模板/往当前模板插入明细：与主弹窗同一紧凑表单，仅保留行距微调 */
.add-template-form .add-template-search-row {
  margin-bottom: 0;
}
.add-template-form .add-template-search-row .el-form-item {
  margin-bottom: 0;
}

/* 引用模板弹窗：贴顶、左右无留白、高度加倍 */
.template-dialog-mask {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
}

.local-modal-content.template-dialog-content {
  min-height: 100vh !important;
  height: 100vh !important;
  max-width: none;
  width: 100%;
  max-height: 100vh !important;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.template-dialog-body {
  padding: 16px 20px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 顶部搜索框容器：与库存明细等页面的查询条件框风格一致 */
.template-search-box {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.template-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  flex-shrink: 0;
}

.template-search-input {
  width: 260px;
}

/* 中部：搜索、取消、引用按钮行（位于搜索框与模板列表之间） */
.template-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* 下部分：仅模板名称列表，高度与弹窗匹配 */
.template-split-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  max-height: 520px;
  overflow: hidden;
}

.template-list-box {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.template-list-title {
  padding: 4px 12px;
  background: #F5F7FA;
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.template-list-inner {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: none;
}

.template-list-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #EBEEF5;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.template-list-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.template-list-item-delete {
  flex-shrink: 0;
  padding: 0 4px;
  color: #F56C6C;
}
.template-list-item-delete:hover {
  color: #f78989;
}
.template-list-item.active .template-list-item-delete {
  color: rgba(255,255,255,0.9);
}
.template-list-item.active .template-list-item-delete:hover {
  color: #fff;
}

.template-list-item:hover {
  background: #ECF5FF;
}

.template-list-item.active {
  background: #409EFF;
  color: #fff;
}

.template-list-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

/* 右侧：明细框（仅表格区域可滚动）+ 分页固定在外侧底部 */
.template-detail-table-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.template-detail-table-inner {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.template-detail-table-inner .el-table {
  width: 100%;
}

.template-detail-pagination {
  flex-shrink: 0;
  padding: 10px 0 0;
  margin-bottom: 0;
  min-height: 36px;
  border-top: 1px solid #EBEEF5;
  background: #fff;
}

.template-detail-inner {
  flex: 1;
  overflow: auto;
  min-height: 0;
  max-height: none;
  padding: 4px 8px;
}

.template-detail-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.template-dialog-footer {
  padding: 10px 12px;
  border-top: 1px solid #EBEEF5;
  text-align: right;
  flex-shrink: 0;
}

/* 弹窗内表格：高度由 el-table :height 控制（与出库申请一致） */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0 !important;
  overflow: hidden;
  padding-bottom: 0;
}

/* 主弹窗明细区：不重复出外层滚动条，纵向滚动只在表格 body 内 */
.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  padding-bottom: 0;
  box-sizing: border-box;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
}

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

::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table:not(.apply-detail-table) .el-table__fixed-footer-wrapper td {
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
}

/* 明细框表头/合计/表体：与到货验收 apply-detail-table 一致 */
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
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
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

/* 明细表紧凑行高 */
.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 1.35;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep thead th.el-table__cell {
  padding: 6px 0 !important;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}

/* 科室申领主弹窗：限制在内容区内。可用库存选择排除，按到货验收 SelectMaterialFilter 同等处理 */
::v-deep .local-modal-content:not(.template-dialog-content):not(.select-material-filter-content) {
  min-height: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
}

/* 可用库存弹窗：铺满锁定后的内容区；底栏翻页不被裁切 */
::v-deep .select-material-filter-content {
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  padding-bottom: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

::v-deep .local-modal-content .el-table:not(.apply-detail-table) .el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.25) rgba(0, 0, 0, 0.06);
}

/*
 * 明细表横向滚动条 12px（须放在 thin 规则之后，覆盖通配细滚动条）
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

/* 防止表格列自动换行（非 apply-detail-table 保留原规则） */
::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table:not(.apply-detail-table) .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table:not(.apply-detail-table) .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

.add-template-pagination-wrap {
  flex-shrink: 0;
  padding: 8px 0 0;
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

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担 */
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

/* 按钮行样式（仅弹窗内，勿影响主列表 list-toolbar 与搜索区间的全局留白） */
.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

</style>

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.d-apply-page {
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

.app-container.d-apply-page.is-select-filter-open {
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding-top: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
}

.app-container.d-apply-page .local-modal-mask:not(.select-material-filter-mask) {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}

.app-container.d-apply-page .select-material-filter-mask {
  z-index: 3000;
  overflow: hidden;
}

.app-container.d-apply-page .select-material-filter-content .pagination-container {
  padding: 0 !important;
}

.app-container.d-apply-page .list-query-panel,
.app-container.d-apply-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.d-apply-page .apply-table-panel {
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

.app-container.d-apply-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.d-apply-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.d-apply-page .apply-pagination-wrap .pagination-container {
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

.app-container.d-apply-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.d-apply-page .apply-main-table .el-table__header-wrapper th,
.app-container.d-apply-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.d-apply-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.d-apply-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.d-apply-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.d-apply-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.d-apply-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.d-apply-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.d-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.d-apply-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.d-apply-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.d-apply-page .apply-main-table.el-table {
  position: relative;
}

.app-container.d-apply-page .apply-main-table th.apply-select-col,
.app-container.d-apply-page .apply-main-table td.apply-select-col,
.app-container.d-apply-page .apply-main-table th.el-table-column--selection,
.app-container.d-apply-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-apply-page .apply-main-table td.apply-select-col,
.app-container.d-apply-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-apply-page .apply-main-table th.apply-select-col,
.app-container.d-apply-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.d-apply-page .apply-main-table th.apply-action-col,
.app-container.d-apply-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-apply-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.d-apply-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr > td,
.app-container.d-apply-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr:hover > td,
.app-container.d-apply-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.d-apply-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.d-apply-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.d-apply-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.d-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.d-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.d-apply-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/* 科室申领修改弹窗：对齐到货验收 apply-modal */
.app-container.d-apply-page.is-modal-open {
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding-top: 8px !important;
  padding-bottom: 0 !important;
  box-sizing: border-box !important;
}

.app-container.d-apply-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 8px;
  padding-left: 12px;
  box-sizing: border-box;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-input {
  width: 150px !important;
  max-width: 150px !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 200px;
  max-width: none !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-input,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content > * {
  width: 100% !important;
  max-width: none !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}

.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.app-container.d-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input {
  width: 162px !important;
  max-width: 162px !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

.app-container.d-apply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

.app-container.d-apply-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
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

.app-container.d-apply-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.d-apply-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: auto;
  scrollbar-color: #a8a8a8 #f1f1f1;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 8px !important;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.d-apply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr:hover > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__fixed-body-wrapper tr.apply-row-selected > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__fixed-right .el-table__body tr.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.d-apply-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.d-apply-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
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

.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.d-apply-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
}
</style>
