<template>
    <!-- 引用模板：左模板名称，右模板明细（明细框对齐到货验收 apply-detail-table） -->
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

                <!-- 右侧：工具栏 + 到货验收同款明细框 -->
                <div class="template-detail-panel">
                  <el-row :gutter="0" class="list-toolbar apply-modal-toolbar template-action-toolbar">
                    <div class="list-toolbar-left">
                      <el-button type="primary" size="small" icon="el-icon-plus" class="spd-btn spd-btn--primary" @click="openAddTemplateDialog">新增</el-button>
                      <el-button type="danger" size="small" icon="el-icon-delete" :disabled="!selectedTemplate || !templateDetailSelection.length" @click="handleDeleteTemplateDetail">删除</el-button>
                      <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="loadTemplateList">搜索</el-button>
                      <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="handleRefreshTemplate">刷 新</el-button>
                      <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="!selectedTemplate" @click="confirmRefTemplate">引 用</el-button>
                      <el-button type="primary" size="small" class="spd-btn spd-btn--primary" :disabled="!selectedTemplate" @click="handleSaveTemplate">保 存</el-button>
                    </div>
                  </el-row>

                  <div class="modal-detail-section apply-modal-table-panel template-detail-table-panel">
                    <div ref="templateDetailTableInner" class="table-wrapper">
                      <el-table
                        ref="templateDetailTable"
                        :data="templateDetailPageList"
                        class="apply-detail-table"
                        :height="templateDetailTableHeight"
                        border
                        stripe
                        size="small"
                        show-header
                        @selection-change="handleTemplateDetailSelectionChange"
                      >
                        <el-table-column type="selection" width="50" align="center" resizable class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                        <el-table-column label="序号" width="60" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ (templateDetailPageNum - 1) * templateDetailPageSize + scope.$index + 1 }}
                          </template>
                        </el-table-column>
                        <el-table-column label="产品编码" width="130" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="产品名称" width="160" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.name ? scope.row.material.name : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="规格" width="120" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="型号" width="120" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.model ? scope.row.material.model : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="单位" width="80" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName ? scope.row.material.fdUnit.unitName : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="单价" width="100" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.price != null ? scope.row.material.price : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="生产厂家" width="180" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName ? scope.row.material.fdFactory.factoryName : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="供应商" width="180" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name ? scope.row.material.supplier.name : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="注册证号" width="160" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="注册证有效期" width="130" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.periodDate ? parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="库房分类" width="120" align="center" show-overflow-tooltip resizable>
                          <template slot-scope="scope">
                            {{ scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName ? scope.row.material.fdWarehouseCategory.warehouseCategoryName : '—' }}
                          </template>
                        </el-table-column>
                        <el-table-column label="财务分类" width="120" align="center" show-overflow-tooltip resizable>
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
/* 贴满主内容区：去掉 plan-modal-common 的 8px 灰边，左右盖住容器 */
.template-dialog-mask {
  display: flex !important;
  align-items: stretch !important;
  justify-content: stretch !important;
  padding: 0 !important;
  box-sizing: border-box;
}

.template-dialog-content {
  min-height: 0 !important;
  height: 100% !important;
  max-height: 100% !important;
  max-width: none !important;
  width: 100% !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.template-dialog-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f5f7fa;
}

.template-split-layout {
  display: flex;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 左侧模板名称 */
.template-list-panel {
  width: 240px;
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-right: 1px solid #e4e7ed;
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

/* 右侧明细：铺满剩余宽度 */
.template-detail-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.template-action-toolbar {
  flex-shrink: 0;
  margin: 0 !important;
  padding: 8px 12px !important;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.template-action-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.template-detail-table-panel {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden;
}

.template-detail-table-panel > .table-wrapper {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 0;
}

/* 单行不换行，超长走横向滚动 */
.template-detail-table-panel >>> .apply-detail-table .cell {
  white-space: nowrap !important;
  word-break: keep-all !important;
}

.template-detail-table-panel >>> .el-table.apply-detail-table > .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

.template-detail-table-panel >>> .el-table.apply-detail-table > .el-table__header-wrapper {
  overflow-x: hidden !important;
}

.template-detail-table-panel >>> .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
  width: 10px;
}

.template-detail-table-panel >>> .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 6px;
}

.template-detail-table-panel >>> .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.template-detail-pagination {
  flex-shrink: 0;
  padding: 6px 12px 8px;
  min-height: 36px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
