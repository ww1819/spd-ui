<template>
  <div class="app-container list-page finance-category-page">
    <el-row :gutter="8" class="fc-layout-row">
      <!-- 左侧分类树（对齐耗材对照左侧列表） -->
      <el-col :span="5" class="fc-left-col">
        <div class="fc-side-panel" ref="leftStack">
          <div class="fc-side-header">
            <span>全部分类</span>
          </div>
          <div class="fc-side-list">
            <el-tree
              ref="categoryTree"
              :data="treeData"
              :props="treeProps"
              node-key="financeCategoryId"
              highlight-current
              :default-expand-all="true"
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
            >
              <span slot-scope="{ node }" class="custom-tree-node">
                <i class="el-icon-folder-opened" />
                <span>{{ node.label }}</span>
              </span>
            </el-tree>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="fc-right-col">
        <div class="fc-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="fc-query-row">
                <el-input
                  v-model="queryParams.financeCategoryCode"
                  placeholder="财务分类编码"
                  clearable
                  class="fc-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.financeCategoryName"
                  placeholder="财务分类名称"
                  clearable
                  class="fc-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="fc-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar fc-toolbar">
            <div class="list-toolbar-left">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:financeCategory:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:financeCategory:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:financeCategory:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="multiple"
                @click="handleUpdateReferred"
                v-hasPermi="['foundation:financeCategory:updateReferred']"
              >更新简码</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:financeCategory:export']"
              >导出</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('add')"
                v-hasPermi="['foundation:financeCategory:import']"
              >新增导入</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('update')"
                v-hasPermi="['foundation:financeCategory:import']"
              >更新导入</el-button>
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="financeCategoryTable"
              v-loading="loading"
              :data="financeCategoryList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="financeCategoryRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="财务类别编码" align="center" prop="financeCategoryCode" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="财务类别名称" align="center" prop="financeCategoryName" min-width="180" sortable="custom" show-overflow-tooltip />
              <el-table-column label="HIS系统ID" align="center" prop="hisId" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="简码" align="center" prop="referredName" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="地址" align="center" prop="financeCategoryAddress" min-width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="联系方式" align="center" prop="financeCategoryContact" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="使用状态" align="center" prop="isUse" width="120" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.is_use_status" :value="scope.row.isUse"/>
                </template>
              </el-table-column>
              <el-table-column label="组织结构ID" align="center" prop="tenantId" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip />
              <el-table-column label="创建日期" align="center" prop="createTime" width="150" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="140">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:financeCategory:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:financeCategory:remove']"
                  >删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="apply-pagination-wrap">
              <pagination
                v-show="total > 0"
                :total="total"
                :page.sync="queryParams.pageNum"
                :limit.sync="queryParams.pageSize"
                @pagination="getList"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 520px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="factoryImportRequiresHisId"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="衡水市第三人民医院：Excel 新增行须填「HIS系统ID」且组织机构内唯一；已存在编码的「更新」仅改名称与简码，不改库中 HIS ID。"
        />
        <p v-if="upload.mode === 'add'" style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>新增导入</strong>：与库房分类一致，按<strong>财务分类编码</strong>匹配组织机构数据；仅允许新增（库中已存在相同编码则整单校验不通过）。先校验并确认后写入。
        </p>
        <p v-else style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>更新导入</strong>：与库房分类一致，Excel 须含<strong>财务分类ID、财务分类名称</strong>；仅更新名称与拼音简码，不改编码与 HIS ID。先校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopFinanceUpload"
          :on-change="handleFinanceImportFileChange"
          :on-remove="handleFinanceImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <div v-if="upload.mode === 'update'" class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" disabled /> 当前为更新导入（按主键 ID）
            </div>
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importFinanceTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitFinanceImportFlow">校验并导入</el-button>
          <el-button @click="closeFinanceImport">取 消</el-button>
        </div>
      </div>
    </div>

    <el-dialog
      :title="importPreview.title"
      :visible.sync="importPreview.visible"
      width="90%"
      top="5vh"
      append-to-body
      @close="importPreview.rows = []; importPreview.columns = []"
    >
      <div style="margin-bottom:10px;">
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportFinanceImportPreview">导出解析结果</el-button>
      </div>
      <el-table :data="importPreview.rows" border max-height="520" size="small" style="width:100%">
        <el-table-column
          v-for="col in importPreview.columns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="120"
          show-overflow-tooltip
        />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="importPreview.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <!-- 页面内容区内右侧抽屉（不挂到 body，避免盖住顶栏/侧栏） -->
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="财务类别编码" prop="financeCategoryCode">
              <el-input v-model="form.financeCategoryCode" :disabled="isDisabled" placeholder="请输入编码" />
            </el-form-item>
            <el-form-item label="财务类别名称" prop="financeCategoryName">
              <el-input v-model="form.financeCategoryName" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="名称简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可点「更新简码」生成" clearable />
            </el-form-item>
            <el-form-item label="使用状态" prop="isUse">
              <el-select v-model="form.isUse" placeholder="使用状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="HIS系统ID" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.financeCategoryId"
                :placeholder="form.financeCategoryId ? '保存后不可修改' : (factoryImportRequiresHisId ? '衡水新增必填' : '非衡水无需填写')"
                clearable
              />
            </el-form-item>
            <el-form-item label="地址" prop="financeCategoryAddress">
              <el-input v-model="form.financeCategoryAddress" placeholder="地址" clearable />
            </el-form-item>
            <el-form-item label="联系方式" prop="financeCategoryContact">
              <el-input v-model="form.financeCategoryContact" placeholder="联系方式" clearable />
            </el-form-item>
            <el-form-item label="组织机构ID" prop="tenantId">
              <el-input v-model="form.tenantId" disabled placeholder="保存时默认当前组织机构" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listFinanceCategory, listFinanceCategoryAll, getFinanceCategory, delFinanceCategory, addFinanceCategory, updateFinanceCategory, updateFinanceCategoryReferred, validateFinanceCategoryImportAdd, validateFinanceCategoryImportUpdate, importFinanceCategoryAddData, importFinanceCategoryUpdateData } from "@/api/foundation/financeCategory";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import { mapGetters } from "vuex";

export default {
  name: "FinanceCategory",
  dicts: ['is_use_status'],
  computed: {
    ...mapGetters(['customerId', 'factoryImportRequiresHisId']),
    isDisabled() {
      return this.form.financeCategoryId != null;
    }
  },
  data() {
    return {
      treeData: [],
      treeProps: {
        label: 'financeCategoryName',
        children: 'children'
      },
      selectedCategoryId: null,
      loading: true,
      financeCategoryList: [],
      total: 0,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        financeCategoryCode: null,
        financeCategoryName: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      open: false,
      title: "",
      upload: {
        open: false,
        title: "",
        isUploading: false,
        updateSupport: false,
        pendingFile: null,
        mode: 'add'
      },
      importPreview: {
        visible: false,
        title: "导入解析结果",
        rows: [],
        columns: []
      },
      rules: {
        financeCategoryCode: [
          { required: true, message: "财务分类编码不能为空", trigger: "blur" }
        ],
        financeCategoryName: [
          { required: true, message: "财务分类名称不能为空", trigger: "blur" }
        ],
        hisId: [
          {
            validator: (rule, value, callback) => {
              if (!this.form.financeCategoryId && this.factoryImportRequiresHisId) {
                if (value === undefined || value === null || String(value).trim() === "") {
                  callback(new Error("衡水市第三人民医院新增时必须填写HIS系统ID"));
                  return;
                }
              }
              callback();
            },
            trigger: "blur"
          }
        ]
      }
    };
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
    this.getList();
    this.getTreeList();
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight();
      setTimeout(() => this.updateMainTableHeight(), 80);
      setTimeout(() => this.updateMainTableHeight(), 200);
    });
    window.addEventListener('resize', this.updateMainTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight);
  },
  methods: {
    /** 明细框高度：底边对齐左侧分类面板 */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      if (!panel || !panel.getBoundingClientRect) return;
      const left = this.$refs.leftStack;
      if (!left || !left.getBoundingClientRect) return;
      const panelTop = panel.getBoundingClientRect().top;
      const targetBottom = left.getBoundingClientRect().bottom;
      const pagEl = panel.querySelector('.apply-pagination-wrap');
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52;
      if (pagH < 40) pagH = 52;
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0);
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY));
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next;
      }
      this.$nextTick(() => {
        if (this.$refs.financeCategoryTable && this.$refs.financeCategoryTable.doLayout) {
          this.$refs.financeCategoryTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.financeCategoryTable && this.$refs.financeCategoryTable.doLayout) {
              this.$refs.financeCategoryTable.doLayout();
            }
          });
        }
      });
    },
    getTreeList() {
      listFinanceCategoryAll({}).then(response => {
        const rows = Array.isArray(response) ? response : ((response && response.data) || []);
        this.treeData = [{
          financeCategoryId: 'root',
          financeCategoryName: '全部分类',
          children: rows || []
        }];
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.treeData = [{
          financeCategoryId: 'root',
          financeCategoryName: '全部分类',
          children: []
        }];
      });
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listFinanceCategory(params)
        .then(response => {
          const rows = (response && response.rows) || [];
          this.financeCategoryList = rows.map((item, index) => ({
            ...item,
            index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
          }));
          this.total = (response && response.total) || 0;
        })
        .catch(() => {
          this.financeCategoryList = [];
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
        });
    },
    handleNodeClick(data) {
      if (!data || data.financeCategoryId === 'root') {
        this.selectedCategoryId = null;
        this.queryParams.financeCategoryCode = null;
        this.queryParams.financeCategoryName = null;
      } else {
        this.selectedCategoryId = data.financeCategoryId;
        this.queryParams.financeCategoryCode = data.financeCategoryCode || null;
        this.queryParams.financeCategoryName = null;
      }
      this.handleQuery();
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.selectedCategoryId = null;
      this.queryParams.financeCategoryCode = null;
      this.queryParams.financeCategoryName = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.financeCategoryTable && this.$refs.financeCategoryTable.clearSort) {
        this.$refs.financeCategoryTable.clearSort();
      }
      if (this.$refs.categoryTree && this.$refs.categoryTree.setCurrentKey) {
        this.$refs.categoryTree.setCurrentKey('root');
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        financeCategoryCode: 'finance_category_code',
        financeCategoryName: 'finance_category_name',
        hisId: 'his_id',
        referredName: 'referred_name',
        financeCategoryAddress: 'finance_category_address',
        financeCategoryContact: 'finance_category_contact',
        isUse: 'is_use',
        tenantId: 'tenant_id',
        createTime: 'create_time'
      };
      if (!order) {
        this.queryParams.orderByColumn = null;
        this.queryParams.isAsc = null;
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSelectionChange(selection) {
      this.ids = (selection || []).map(item => item.financeCategoryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    financeCategoryRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.financeCategoryId != null ? String(row.financeCategoryId) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.form.isUse = '1';
      this.open = true;
      this.title = "添加财务分类";
    },
    handleUpdate(row) {
      this.reset();
      const financeCategoryId = row.financeCategoryId || this.ids;
      getFinanceCategory(financeCategoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改财务分类";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.financeCategoryId) {
            updateFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getTreeList();
            });
          } else {
            addFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getTreeList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const financeCategoryIds = row.financeCategoryId || this.ids;
      this.$modal.confirm('确认删除选中的数据？').then(() => {
        return delFinanceCategory(financeCategoryIds);
      }).then(() => {
        this.getList();
        this.getTreeList();
        this.$modal.msgSuccess("删除成功");
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        financeCategoryId: null,
        financeCategoryCode: null,
        financeCategoryName: null,
        referredName: null,
        financeCategoryAddress: null,
        financeCategoryContact: null,
        isUse: '1',
        remark: null,
        tenantId: null,
        hisId: null
      };
      this.resetForm("form");
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/financeCategory/export', params, `financeCategory_${new Date().getTime()}.xlsx`);
    },
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的财务分类");
        return;
      }
      this.$modal.confirm("是否为选中的财务分类更新名称简码？").then(() => {
        return updateFinanceCategoryReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    },
    handleImport(mode) {
      this.upload.mode = mode === "update" ? "update" : "add";
      this.upload.updateSupport = this.upload.mode === "update";
      this.upload.title = this.upload.mode === "update" ? "财务分类更新导入" : "财务分类新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.upload) this.$refs.upload.clearFiles();
      });
    },
    closeFinanceImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.upload) this.$refs.upload.clearFiles();
    },
    noopFinanceUpload() {},
    handleFinanceImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleFinanceImportFileRemove() {
      this.upload.pendingFile = null;
    },
    importFinanceTemplate() {
      const api = this.upload.mode === "update" ? "foundation/financeCategory/importUpdateTemplate" : "foundation/financeCategory/importAddTemplate";
      this.download(api, {}, `fd_finance_category_template_${new Date().getTime()}.xlsx`);
    },
    showImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportFinanceImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "finance_category_update" : "finance_category_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitFinanceImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateFinanceCategoryImportUpdate(f) : await validateFinanceCategoryImportAdd(f);
        const d = res.data || {};
        this.showImportPreviewFromPayload(d, isUpdate ? "财务分类更新导入 — 解析结果" : "财务分类新增导入 — 解析结果");
        if (!d.valid) {
          const errs = (d.errors && d.errors.length) ? d.errors.join("<br/>") : (res.msg || "校验失败");
          this.$alert("<div style='overflow:auto;max-height:60vh'>" + errs + "</div>", "校验未通过", { dangerouslyUseHTMLString: true });
          return;
        }
        const tc = d.totalRows != null ? d.totalRows : 0;
        const ic = d.insertCount != null ? d.insertCount : 0;
        const uc = d.updateCount != null ? d.updateCount : 0;
        let confirmText = "校验已通过。共 " + tc + " 行数据，确认后写入数据库，是否继续？";
        if (!isUpdate) {
          confirmText = "校验已通过。共 " + tc + " 行数据，预计新增 " + ic + " 条、更新 " + uc + " 条。确认后写入数据库，是否继续？";
        }
        await this.$modal.confirm(confirmText);
        const res2 = isUpdate ? await importFinanceCategoryUpdateData(f, true) : await importFinanceCategoryAddData(f, true);
        const d2 = res2.data || {};
        this.showImportPreviewFromPayload(d2, isUpdate ? "财务分类更新导入 — 导入结果" : "财务分类新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeFinanceImport();
        this.getList();
        this.getTreeList();
      } catch (e) {
        if (e !== "cancel" && e !== "close") {
          /* request 已提示 */
        }
      } finally {
        this.upload.isUploading = false;
      }
    }
  }
};
</script>

<style scoped>
.fc-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.fc-left-col,
.fc-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.fc-side-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
}

.fc-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.fc-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.custom-tree-node {
  font-size: 14px;
  display: flex;
  align-items: center;
}

.custom-tree-node i {
  margin-right: 5px;
  color: #409EFF;
}

.fc-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.finance-category-page .fc-main > .list-query-panel,
.finance-category-page .fc-main > .fc-toolbar,
.finance-category-page .fc-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.finance-category-page .fc-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.fc-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.fc-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.fc-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.apply-table-panel {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 !important;
  background: #fff !important;
  border: 1px solid #e8ecf1 !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05) !important;
  overflow: hidden;
  height: auto !important;
  width: 100%;
  box-sizing: border-box;
}

.apply-table-panel > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 0 !important;
  border-radius: 0;
  box-shadow: none;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 12px 14px;
  box-sizing: border-box;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  overflow: visible !important;
}

.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

.finance-category-page .apply-main-table.el-table {
  position: relative;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.finance-category-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.finance-category-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.finance-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.finance-category-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.finance-category-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body tr > td,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.finance-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.finance-category-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.finance-category-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.finance-category-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.finance-category-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.finance-category-page .apply-main-table ::v-deep th.apply-select-col,
.finance-category-page .apply-main-table ::v-deep td.apply-select-col,
.finance-category-page .apply-main-table ::v-deep th.el-table-column--selection,
.finance-category-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.finance-category-page .apply-main-table ::v-deep th.apply-action-col,
.finance-category-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.finance-category-page .apply-main-table ::v-deep td.apply-select-col,
.finance-category-page .apply-main-table ::v-deep td.el-table-column--selection,
.finance-category-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.finance-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.local-modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 6px;
  min-width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.dialog-footer {
  text-align: right;
  margin-top: 16px;
}

.page-drawer-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 20;
  display: flex;
  justify-content: flex-end;
}

.page-drawer-panel {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.page-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.page-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.page-drawer-close:hover {
  color: #409EFF;
}

.page-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.page-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.page-drawer-footer .el-button {
  margin: 0 8px;
}
</style>

<style>
.app-container.finance-category-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.finance-category-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.finance-category-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.finance-category-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.finance-category-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.finance-category-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.finance-category-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
