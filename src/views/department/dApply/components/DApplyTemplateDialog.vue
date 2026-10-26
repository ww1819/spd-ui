<template>
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
