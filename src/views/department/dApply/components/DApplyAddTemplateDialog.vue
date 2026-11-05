<template>
  <!-- 往当前模板插入明细-SL：数据口径对齐「可用库存（按耗材+仓库汇总）」，含库存为 0 -->
  <div
    v-show="addTemplateDialogVisible"
    class="local-modal-mask material-filter-mask material-filter-mask--nested add-template-mask"
  >
    <div
      class="local-modal-content material-filter-modal material-filter-modal--nested apply-inbound-nested-modal add-template-modal"
    >
      <div class="modal-header">
        <div class="modal-title">{{ addTemplateAppendMode ? '往当前模板插入明细-SL' : '新增制单模板-SL' }}</div>
        <el-button size="small" @click="closeAddTemplateDialog" class="close-btn">关闭</el-button>
      </div>
      <el-form
        ref="addTemplateFormRef"
        :model="addTemplateForm"
        :rules="addTemplateRules"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form add-template-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="产品名称" prop="materialKeyword" label-width="84px">
                <el-input
                  v-model="addTemplateForm.materialKeyword"
                  placeholder="名称/编码/简码"
                  clearable
                  size="small"
                  @keyup.enter.native="handleAddTemplateSearch"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="型号" prop="materialModel">
                <el-input
                  v-model="addTemplateForm.materialModel"
                  placeholder="型号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleAddTemplateSearch"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="仓库" prop="warehouseName">
                <el-input
                  v-model="addTemplateForm.warehouseName"
                  placeholder="仓库名称"
                  clearable
                  size="small"
                  @keyup.enter.native="handleAddTemplateSearch"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="规格" prop="speciSearch">
                <el-input
                  v-model="addTemplateForm.speciSearch"
                  placeholder="规格"
                  clearable
                  size="small"
                  @keyup.enter.native="handleAddTemplateSearch"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">可用库存明细信息</span>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-search"
              @click="handleAddTemplateSearch"
            >搜索</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-refresh"
              @click="handleAddTemplateReset"
            >重置</el-button>
            <el-button size="small" @click="closeAddTemplateDialog">取 消</el-button>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-check"
              @click="submitAddTemplate"
            >确 定</el-button>
          </div>
        </el-row>

        <div class="apply-table-panel" ref="addTemplateTablePanel">
          <el-table
            ref="addTemplateEntryTable"
            v-loading="addTemplateLoading"
            class="table-compact apply-main-table"
            :data="addTemplateDetailPageList"
            :row-key="getAddTemplateRowKey"
            :row-class-name="addTemplateDetailRowClassName"
            :height="addTemplateTableHeight"
            border
            stripe
            @selection-change="handleAddTemplateEntrySelectionChange"
            @row-dblclick="handleAddTemplateRowDblclick"
          >
            <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
            <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (addTemplateDetailPageNum - 1) * addTemplateDetailPageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.warehouseName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="编码" align="center" prop="materialCode" width="130" show-overflow-tooltip resizable />
            <el-table-column label="产品名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable />
            <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.materialSpeci || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="materialModel" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.materialModel || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.unitName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="本仓可用数量" align="center" prop="availableQty" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.availableQty != null ? scope.row.availableQty : 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="参考单价" align="center" prop="unitPrice" width="110" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.unitPrice != null ? scope.row.unitPrice : '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产厂家" align="center" prop="factoryName" width="160" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.factoryName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册证号" align="center" prop="registerNo" width="160" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.registerNo || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.financeCategoryName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ scope.row.warehouseCategoryName || '--' }}</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="apply-pagination-wrap" ref="addTemplatePaginationWrap">
            <pagination
              :total="addTemplateTotal"
              :page.sync="addTemplateDetailPageNum"
              :limit.sync="addTemplateDetailPageSize"
              :page-sizes="[10, 20, 50, 100]"
              @pagination="handleAddTemplateDetailPagination"
            />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'DApplyAddTemplateDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'DApply')],
  inheritAttrs: false,
  watch: {
    addTemplateDialogVisible(val) {
      if (val) {
        this.$nextTick(() => {
          if (typeof this.calcAddTemplateTableHeight === 'function') {
            this.calcAddTemplateTableHeight()
          }
        })
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onAddTemplateWindowResize)
    this.$nextTick(() => {
      if (typeof this.calcAddTemplateTableHeight === 'function') {
        this.calcAddTemplateTableHeight()
      }
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onAddTemplateWindowResize)
  },
  methods: {
    onAddTemplateWindowResize() {
      if (this.addTemplateDialogVisible && typeof this.calcAddTemplateTableHeight === 'function') {
        this.calcAddTemplateTableHeight()
      }
    }
  }
}
</script>
