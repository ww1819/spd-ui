<template>
    <!-- 引用模板：左模板名称，右模板明细 -->
    <transition name="modal-fade">
      <div v-if="templateDialogVisible" class="local-modal-mask template-dialog-mask" @click.self="closeTemplateDialog">
        <transition name="modal-zoom">
          <div v-if="templateDialogVisible" class="local-modal-content template-dialog-content">
            <div class="modal-header">
              <div class="modal-title">引用模板</div>
              <el-button size="small" @click="closeTemplateDialog" class="close-btn">关闭</el-button>
            </div>
            <div class="template-dialog-body">
              <div class="template-split-layout">
                <!-- 左侧：搜索 + 模板名称列表 -->
                <div class="template-list-panel">
                  <div class="template-list-panel__search">
                    <el-input
                      v-model="templateNameSearch"
                      placeholder="按模板名称搜索"
                      clearable
                      size="small"
                      prefix-icon="el-icon-search"
                      @keyup.enter.native="loadTemplateList"
                      @clear="loadTemplateList"
                    />
                  </div>
                  <div class="template-list-panel__title">模板名称</div>
                  <div class="template-list-panel__inner">
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

                <!-- 右侧：操作 + 明细表 -->
                <div class="template-detail-panel">
                  <div class="template-action-row">
                    <el-button type="primary" size="small" icon="el-icon-plus" class="spd-btn spd-btn--primary" @click="openAddTemplateDialog">新增</el-button>
                    <el-button type="danger" size="small" icon="el-icon-delete" :disabled="!selectedTemplate || !templateDetailSelection.length" @click="handleDeleteTemplateDetail">删除</el-button>
                    <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="loadTemplateList">搜索</el-button>
                    <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="handleRefreshTemplate">刷 新</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="!selectedTemplate" @click="confirmRefTemplate">引 用</el-button>
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="!selectedTemplate" @click="handleSaveTemplate">保 存</el-button>
                  </div>
                  <div class="template-detail-table-wrap">
                    <div ref="templateDetailTableInner" class="template-detail-table-inner">
                      <el-table
                        ref="templateDetailTable"
                        :data="templateDetailPageList"
                        :height="templateDetailTableHeight"
                        border
                        stripe
                        size="small"
                        show-header
                        @selection-change="handleTemplateDetailSelectionChange"
                      >
                        <el-table-column type="selection" width="50" align="center" />
                        <el-table-column label="序号" width="50" align="center">
                          <template slot-scope="scope">
                            {{ (templateDetailPageNum - 1) * templateDetailPageSize + scope.$index + 1 }}
                          </template>
                        </el-table-column>
                        <el-table-column label="产品编码" min-width="100" show-overflow-tooltip>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="产品名称" min-width="120" show-overflow-tooltip>
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
          </div>
        </transition>
      </div>
    </transition>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyTemplateDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  inheritAttrs: false
}
</script>

<style scoped>
.template-dialog-mask {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
}

.template-dialog-content {
  min-height: 100% !important;
  height: 100% !important;
  max-width: none;
  width: 100%;
  max-height: 100% !important;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.template-dialog-body {
  padding: 12px 16px 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f5f7fa;
}

.template-split-layout {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧模板名称 */
.template-list-panel {
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.template-list-panel__search {
  padding: 10px 10px 8px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.template-list-panel__title {
  padding: 8px 12px;
  background: #f5f7fa;
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.template-list-panel__inner {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.template-list-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
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
  color: #f56c6c;
}

.template-list-item-delete:hover {
  color: #f78989;
}

.template-list-item.active .template-list-item-delete {
  color: rgba(255, 255, 255, 0.9);
}

.template-list-item.active .template-list-item-delete:hover {
  color: #fff;
}

.template-list-item:hover {
  background: #ecf5ff;
}

.template-list-item.active {
  background: #409eff;
  color: #fff;
}

.template-list-empty {
  padding: 24px 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

/* 右侧明细 */
.template-detail-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.template-action-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.template-detail-table-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 0 0;
}

.template-detail-table-inner {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 12px;
}

.template-detail-table-inner >>> .el-table {
  width: 100%;
}

.template-detail-pagination {
  flex-shrink: 0;
  padding: 8px 12px 10px;
  min-height: 36px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
