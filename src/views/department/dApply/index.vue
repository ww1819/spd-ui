<template>
  <div class="app-container d-apply-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="applyBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.applyBillNo"
                placeholder="请输入单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId"/>
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="单据状态" prop="applyBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.applyBillStatus" placeholder="全部"
                         :disabled="false"
                         clearable
                         style="width: 180px">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="12">
            <el-form-item label="日期" style="display: flex; align-items: center;">
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
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['department:dApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:dApply:export']"
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="applyList" :row-class-name="rowApplyIndex" @selection-change="handleSelectionChange" height="64vh" border>
      <el-table-column type="selection" width="60" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="applyBillNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable />
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.rejectReason || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="230" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
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
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:dApply:edit']"
              v-if="scope.row.applyBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:dApply:remove']"
              v-if="scope.row.applyBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改科室申领对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="modal-form-wrapper">
              <div class="form-fields-container d-apply-form-fields">
              <el-row>
                <el-col :span="4">
                  <el-form-item label="单号" prop="applyBillNo" label-width="100px">
                    <el-input v-model="form.applyBillNo" :disabled="true" class="d-apply-form-input" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申领状态" prop="billStatus" label-width="100px">
                    <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态"
                               :disabled="true"
                               clearable class="d-apply-form-input">
                      <el-option v-for="dict in dict.type.biz_status"
                                 :key="dict.value"
                                 :label="dict.label"
                                 :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectWarehouse v-model="form.warehouseId"/>
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectDepartment v-model="form.departmentId"/>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="form.applyBillDate"
                                    type="date"
                                    class="d-apply-form-input"
                                    value-format="yyyy-MM-dd"
                                    :disabled="true"
                                    placeholder="请选择申请日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="操作人" prop="userId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectUser v-model="form.userId"/>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="备注" prop="remark" label-width="100px">
                    <el-input v-model="form.remark" placeholder="请输入备注" class="d-apply-form-input" />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>科室申领明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
<!--              <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddBasApplyEntry">添加</el-button>-->
                    <el-button type="primary" icon="el-icon-plus" size="medium" @click="nameBtn">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteBasApplyEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button size="medium" @click="cancel">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button type="primary" size="medium" @click="submitForm">保 存</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button type="success" size="medium" @click="handleRefTemplate">引用模板</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" @selection-change="handleBasApplyEntrySelectionChange" ref="basApplyEntry" height="100%" border :summary-method="getSummaries" show-summary>
                <el-table-column type="selection" width="50" align="center" resizable />
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="型号" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @blur="form.result=$event.target.value"
                              @input="qtyChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
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
                    <el-input v-model="scope.row.remark" placeholder="请输入备注" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right">
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
        <el-button @click="renameTemplateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmRenameTemplate">确 定</el-button>
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
        <el-button @click="closeNewTemplateNameDialog">取 消</el-button>
        <el-button type="primary" @click="confirmNewTemplateName">确 定</el-button>
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
            <el-form ref="addTemplateFormRef" :model="addTemplateForm" :rules="addTemplateRules" label-width="80px" class="modal-form-wrapper add-template-form">
              <div class="form-fields-container d-apply-form-fields add-template-search-row">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="供应商名称" prop="supplierId" label-width="100px">
                      <div class="d-apply-form-input">
                        <SelectSupplier v-model="addTemplateForm.supplierId" :value2="false"/>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="耗材名称" prop="materialKeyword" label-width="100px">
                      <el-input v-model="addTemplateForm.materialKeyword" placeholder="请输入耗材名称或首字母" clearable size="small" class="d-apply-form-input" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="规格搜索" prop="speciSearch" label-width="100px">
                      <el-input v-model="addTemplateForm.speciSearch" placeholder="请输入规格或首字母" clearable size="small" class="d-apply-form-input" />
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

    <!-- 3、使用组件（科室申领添加明细 / 新增制单模板添加明细 共用） -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="currentSelectWarehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

  </div>
</template>

<script>
import { listApply, getApply, delApply, addApply, updateApply } from "@/api/department/apply";
import { listApplyTemplate, getApplyTemplate, addApplyTemplate, updateApplyTemplate, deleteApplyTemplate } from "@/api/department/applyTemplate";
import { listMaterialAll } from "@/api/foundation/material";
import { pinyin } from 'pinyin-pro';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';

export default {
  name: "dApply",
  dicts: ['biz_status','way_status'],
  components: { SelectWarehouse, SelectDepartment, SelectUser, SelectSupplier },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      /** 库存选择弹窗：当前用于哪个表单（apply=科室申领明细，template=新增制单模板明细） */
      selectTarget: 'apply',
      /** 库存选择弹窗：当前传入的仓库（科室申领用 form.warehouseId，制单模板用 addTemplateForm.warehouseId） */
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
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
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
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        beginDate: null,
        endDate: null,
        warehouseId: null,
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
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
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
        const k = kw.toLowerCase();
        const kFirst = this._getFirstLetters(kw);
        list = list.filter(row => {
          const name = (row.name || '').toLowerCase();
          const code = (row.code || '').toLowerCase();
          const referred = (row.referredName || '').toLowerCase();
          const first = this._getFirstLetters((row.name || '') + (row.code || '') + (row.referredName || ''));
          return name.indexOf(k) !== -1 || code.indexOf(k) !== -1 || referred.indexOf(k) !== -1 ||
            (kFirst && first && first.toLowerCase().indexOf(kFirst.toLowerCase()) !== -1);
        });
      }
      if (spec) {
        const s = spec.toLowerCase();
        const sFirst = this._getFirstLetters(spec);
        list = list.filter(row => {
          const speci = (row.speci || '').toLowerCase();
          const first = this._getFirstLetters(row.speci || '');
          return speci.indexOf(s) !== -1 || (sFirst && first && first.toLowerCase().indexOf(sFirst.toLowerCase()) !== -1);
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
  },
  created() {
    this.getList();
  },
  mounted() {
    const that = this;
    this._templateDetailTableResize = () => {
      if (that.templateDialogVisible) that.calcTemplateDetailTableHeight();
    };
    window.addEventListener('resize', this._templateDetailTableResize);
  },
  beforeDestroy() {
    if (this._templateDetailTableResize) window.removeEventListener('resize', this._templateDetailTableResize);
  },
  methods: {
    /** 查询科室申领列表 */
    getList() {
      this.loading = true;
      // 确保只查询申领单类型（billType=1），排除转科申请（billType=3）
      const params = { ...this.queryParams };
      params.billType = 1;
      listApply(params).then(response => {
        this.applyList = response.rows || [];
        this.total = response.total != null ? response.total : 0;
        this.loading = false;
      }).catch(() => {
        this.applyList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      this.selectTarget = 'apply'
      this.currentSelectWarehouseValue = this.form.warehouseId
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
        listMaterialAll({ isUse: '1' }).then(res => {
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
        val.forEach(item => {
          this.basApplyEntryList.splice(this.basApplyEntryList.length, 0, JSON.parse(JSON.stringify(item)))
        })
        this.calculateTotals()
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
      this.open = false;
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
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.basApplyEntryList = [];
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
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 1) {
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
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
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
      row.amt = totalAmt.toFixed(2);
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
      this.queryParams.billType = 1; // 重置后仍只查询申领单类型
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
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
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
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
      // 验证仓库是否选择
      if (!this.form.warehouseId) {
        this.$modal.msgError("请先选择仓库");
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
          this.form.basApplyEntryList = this.basApplyEntryList;
          var totalAmt = 0;
          this.basApplyEntryList.forEach(item => {
            if (item.amt) {
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
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
    row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    rowApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
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
      this.checkedBasApplyEntry = selection.map(item => item.index)
    },
    /** 单据列表行：导出该单明细 */
    handleExportRowDetail(row) {
      if (!row || !row.id) {
        return
      }
      this.download('department/apply/export', {
        ...this.queryParams,
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
        ...this.queryParams,
        exportBillIds: this.ids.join(',')
      }, `apply_${new Date().getTime()}.xlsx`)
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
  min-height: 95vh !important;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

/* 添加/修改科室申领弹窗：输入框容器距顶与左右各 6px，容器更宽 */
.local-modal-content .el-form.modal-form-wrapper {
  padding: 10px 6px 24px 6px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 弹窗内表单字段容器：与顶部、上下间距 10px */
.local-modal-content .form-fields-container.d-apply-form-fields {
  padding-top: 8px;
  margin-bottom: 10px;
}

.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

/* 科室申领弹窗内输入框/选择框统一加宽 */
.local-modal-content .d-apply-form-input {
  width: 180px;
}

.local-modal-content .d-apply-form-input .el-input__inner {
  width: 100%;
}

/* 新增制单模板/往当前模板插入明细：搜索框降低高度 */
.add-template-form .add-template-search-row {
  margin-bottom: 6px;
}
.add-template-form .add-template-search-row .el-form-item {
  margin-bottom: 8px;
}
.add-template-form .add-template-search-row .el-input__inner {
  height: 28px;
  line-height: 28px;
}
.add-template-form .add-template-search-row .d-apply-form-input .el-input__inner {
  height: 28px;
  line-height: 28px;
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

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
}

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 防止表格列自动换行 */
::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
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

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #EBEEF5 !important;
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

/* 搜索条件容器样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 24px 2px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-top: -2px;
  margin-bottom: 6px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 0px;
  margin-top: 0px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 8px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 0px;
  margin-top: 0px;
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

/* 按钮行样式：上移一点，与明细框距离保持 8px */
.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页底部不留空白 */
.d-apply-page .pagination-bottom-wrap {
  margin-bottom: 0;
  padding-bottom: 0;
}

/* 确保表格可以水平滚动和垂直滚动 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 增大底部滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

/* 确保固定列头部和主体都有正确的z-index */
::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

/* 确保固定列在滚动时保持固定 */
::v-deep .el-table__fixed {
  position: absolute !important;
}

::v-deep .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

/* 确保表格可以水平滚动 */
::v-deep .el-table {
  overflow-x: auto;
}

/* 确保明细表格可以水平滚动 */
::v-deep .local-modal-content .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.d-apply-page {
  padding-top: 10px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0px !important;
}

.app-container.d-apply-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-apply-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}
</style>
