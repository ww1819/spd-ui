<template>
  <div class="app-container list-page warehouse-category-page">
    <el-row :gutter="8" class="wc-layout-row">
      <!-- 左侧库房分类树（对齐耗材对照左侧列表） -->
      <el-col :span="5" class="wc-left-col">
        <div class="wc-side-panel" ref="leftStack">
          <div class="wc-side-header">
            <span>全部库房</span>
          </div>
          <div class="wc-side-list">
            <el-tree
              ref="categoryTree"
              :data="treeData"
              :props="treeProps"
              node-key="warehouseCategoryId"
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
      <el-col :span="19" class="wc-right-col">
        <div class="wc-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="wc-query-row">
                <el-input
                  v-model="queryParams.warehouseCategoryCode"
                  placeholder="分类编码"
                  clearable
                  class="wc-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.warehouseCategoryName"
                  placeholder="分类名称"
                  clearable
                  class="wc-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="wc-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar wc-toolbar">
            <div class="list-toolbar-left">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:warehouseCategory:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:warehouseCategory:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:warehouseCategory:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="multiple"
                @click="handleUpdateReferred"
                v-hasPermi="['foundation:warehouseCategory:updateReferred']"
              >更新简码</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:warehouseCategory:export']"
              >导出</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('add')"
                v-hasPermi="['foundation:warehouseCategory:import']"
              >新增导入</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('update')"
                v-hasPermi="['foundation:warehouseCategory:import']"
              >更新导入</el-button>
              <msun-his-sync-button sync-type="categories" label="HIS库房分类同步" :refresh="getList" :inline="true" />
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="warehouseCategoryTable"
              v-loading="loading"
              :data="warehouseCategoryList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="warehouseCategoryRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="分类编码" align="center" prop="warehouseCategoryCode" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="分类名称" align="center" prop="warehouseCategoryName" min-width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="HIS系统ID" align="center" prop="hisId" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="简码" align="center" prop="referredName" width="100" sortable="custom" show-overflow-tooltip />
              <el-table-column label="上级分类" align="center" width="140" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ getParentCategoryName(scope.row.parentId) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="创建日期" align="center" prop="createTime" width="120" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="组织机构ID" align="center" prop="tenantId" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
              <el-table-column label="启用" align="center" width="90">
                <template slot-scope="scope">
                  <el-switch
                    v-model="scope.row.delFlag"
                    :active-value="0"
                    :inactive-value="1"
                    @change="handleStatusChange(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="120">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:warehouseCategory:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:warehouseCategory:remove']"
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

    <!-- 页面内容区内右侧抽屉（不挂到 body，避免盖住顶栏/侧栏） -->
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="分类编码" prop="warehouseCategoryCode">
              <el-input v-model="form.warehouseCategoryCode" :disabled="isDisabled" placeholder="分类编码" />
            </el-form-item>
            <el-form-item label="分类名称" prop="warehouseCategoryName">
              <el-input v-model="form.warehouseCategoryName" placeholder="分类名称" />
            </el-form-item>
            <el-form-item label="选择上级分类" prop="parentId">
              <el-select v-model="form.parentId" placeholder="上级分类" clearable style="width: 100%">
                <el-option
                  v-for="item in parentOptions"
                  :key="item.warehouseCategoryId"
                  :label="item.warehouseCategoryName"
                  :value="item.warehouseCategoryId"
                  :disabled="form.warehouseCategoryId && item.warehouseCategoryId === form.warehouseCategoryId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="名称简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可点「更新简码」自动生成" clearable />
            </el-form-item>
            <el-form-item label="HIS系统ID" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.warehouseCategoryId"
                :placeholder="form.warehouseCategoryId ? '保存后不可修改' : (factoryImportRequiresHisId ? '衡水新增必填' : '非衡水无需填写')"
                clearable
              />
            </el-form-item>
            <el-form-item label="组织机构ID" prop="tenantId">
              <el-input v-model="form.tenantId" placeholder="保存时默认当前组织机构" disabled />
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
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：按库房分类编码匹配组织机构下数据；可勾选「更新已存在」后<strong>仅更新分类名称与简码</strong>。先整单校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopWarehouseUpload"
          :on-change="handleWarehouseImportFileChange"
          :on-remove="handleWarehouseImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <div class="el-upload__tip" slot="tip">
              <el-checkbox v-model="upload.updateSupport" disabled /> 更新模式（按系统主键）
            </div>
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importWarehouseTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitWarehouseImportFlow">校验并导入</el-button>
          <el-button @click="closeWarehouseImport">取 消</el-button>
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
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportWarehouseImportPreview">导出解析结果</el-button>
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
  </div>
</template>

<script>
import { listWarehouseCategory, getWarehouseCategory, delWarehouseCategory, addWarehouseCategory, updateWarehouseCategory, treeselect, updateWarehouseCategoryReferred, validateWarehouseCategoryImportAdd, validateWarehouseCategoryImportUpdate, importWarehouseCategoryAddData, importWarehouseCategoryUpdateData } from "@/api/foundation/warehouseCategory";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import { mapGetters } from "vuex";
import MsunHisSyncButton from '@/components/MsunHisSyncButton';

export default {
  name: "WarehouseCategory",
  components: { MsunHisSyncButton },
  computed: {
    ...mapGetters(['customerId', 'factoryImportRequiresHisId']),
    isDisabled() {
      return this.form.warehouseCategoryId != null;
    }
  },
  data() {
    return {
      treeData: [],
      treeProps: {
        label: 'warehouseCategoryName',
        children: 'children'
      },
      selectedCategoryId: null,
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      warehouseCategoryList: [],
      title: "",
      open: false,
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
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseCategoryCode: null,
        warehouseCategoryName: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      parentOptions: [],
      categoryMap: {},
      rules: {
        warehouseCategoryCode: [
          { required: true, message: "库房分类编码不能为空", trigger: "blur" }
        ],
        warehouseCategoryName: [
          { required: true, message: "库房分类名称不能为空", trigger: "blur" }
        ],
        hisId: [
          {
            validator: (rule, value, callback) => {
              if (!this.form.warehouseCategoryId && this.factoryImportRequiresHisId) {
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
        if (this.$refs.warehouseCategoryTable && this.$refs.warehouseCategoryTable.doLayout) {
          this.$refs.warehouseCategoryTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.warehouseCategoryTable && this.$refs.warehouseCategoryTable.doLayout) {
              this.$refs.warehouseCategoryTable.doLayout();
            }
          });
        }
      });
    },
    /** 查询库房分类列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      Promise.all([
        listWarehouseCategory(params),
        treeselect()
      ]).then(([listResponse, treeResponse]) => {
        const allData = treeResponse.data || [];
        this.buildCategoryMap(allData);
        const rows = (listResponse && listResponse.rows) || [];
        this.warehouseCategoryList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = (listResponse && listResponse.total) || 0;
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          warehouseCategoryId: 'root',
          warehouseCategoryName: '全部库房',
          children: tree
        }];
        this.parentOptions = this.buildParentOptions(allData, this.form.warehouseCategoryId);
      }).catch(() => {
        this.warehouseCategoryList = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    /** 加载树形数据（编辑弹窗用） */
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        this.buildCategoryMap(allData);
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          warehouseCategoryId: 'root',
          warehouseCategoryName: '全部库房',
          children: tree
        }];
        this.parentOptions = this.buildParentOptions(allData, this.form.warehouseCategoryId);
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    buildCategoryMap(data) {
      this.categoryMap = {};
      data.forEach(item => {
        this.categoryMap[item.warehouseCategoryId] = item.warehouseCategoryName;
      });
    },
    getParentCategoryName(parentId) {
      return this.categoryMap[parentId] || '';
    },
    buildTree(data, parentId) {
      const tree = [];
      data.forEach(item => {
        if (item.parentId === parentId || (parentId === 0 && (item.parentId === null || item.parentId === 0))) {
          const children = this.buildTree(data, item.warehouseCategoryId);
          if (children.length > 0) {
            item.children = children;
          }
          tree.push(item);
        }
      });
      return tree;
    },
    buildParentOptions(data, excludeId) {
      const options = [{ warehouseCategoryId: 0, warehouseCategoryName: '顶级分类' }];
      data.forEach(item => {
        if (item.warehouseCategoryId !== excludeId) {
          options.push(item);
        }
      });
      return options;
    },
    handleNodeClick(data) {
      if (!data || data.warehouseCategoryId === 'root') {
        this.selectedCategoryId = null;
        this.queryParams.warehouseCategoryCode = null;
        this.queryParams.warehouseCategoryName = null;
      } else {
        this.selectedCategoryId = data.warehouseCategoryId;
        this.queryParams.warehouseCategoryCode = data.warehouseCategoryCode || null;
        this.queryParams.warehouseCategoryName = null;
      }
      this.handleQuery();
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        warehouseCategoryId: null,
        parentId: 0,
        warehouseCategoryCode: null,
        warehouseCategoryName: null,
        referredName: null,
        remark: null,
        tenantId: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        hisId: null
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.selectedCategoryId = null;
      this.queryParams.warehouseCategoryCode = null;
      this.queryParams.warehouseCategoryName = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.warehouseCategoryTable && this.$refs.warehouseCategoryTable.clearSort) {
        this.$refs.warehouseCategoryTable.clearSort();
      }
      if (this.$refs.categoryTree && this.$refs.categoryTree.setCurrentKey) {
        this.$refs.categoryTree.setCurrentKey('root');
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        warehouseCategoryCode: 'warehouse_category_code',
        warehouseCategoryName: 'warehouse_category_name',
        hisId: 'his_id',
        referredName: 'referred_name',
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
      this.ids = (selection || []).map(item => item.warehouseCategoryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    warehouseCategoryRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.warehouseCategoryId != null ? String(row.warehouseCategoryId) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.loadTreeData();
      this.open = true;
      this.title = "添加库房分类";
    },
    handleUpdate(row) {
      this.reset();
      const warehouseCategoryId = row.warehouseCategoryId || this.ids;
      getWarehouseCategory(warehouseCategoryId).then(response => {
        this.form = response.data;
        this.loadTreeData();
        this.open = true;
        this.title = "修改库房分类";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.warehouseCategoryId != null) {
            updateWarehouseCategory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            if (this.form.parentId === null || this.form.parentId === undefined) {
              this.form.parentId = 0;
            }
            addWarehouseCategory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const warehouseCategoryIds = row.warehouseCategoryId || this.ids;
      this.$modal.confirm('是否确认删除库房分类编号为"' + warehouseCategoryIds + '"的数据项？').then(() => {
        return delWarehouseCategory(warehouseCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleStatusChange(row) {
      let text = row.delFlag === 0 ? "启用" : "禁用";
      this.$modal.confirm('确认要"' + text + '""' + row.warehouseCategoryName + '"库房分类吗？').then(() => {
        return updateWarehouseCategory(row);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.delFlag = row.delFlag === 0 ? 1 : 0;
      });
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/warehouseCategory/export', params, `warehouseCategory_${new Date().getTime()}.xlsx`);
    },
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的库房分类");
        return;
      }
      this.$modal.confirm("是否为选中的库房分类更新名称简码？").then(() => {
        return updateWarehouseCategoryReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    },
    handleImport(mode) {
      this.upload.mode = mode === "update" ? "update" : "add";
      this.upload.updateSupport = this.upload.mode === "update";
      this.upload.title = this.upload.mode === "update" ? "库房分类更新导入" : "库房分类新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.upload) this.$refs.upload.clearFiles();
      });
    },
    closeWarehouseImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.upload) this.$refs.upload.clearFiles();
    },
    noopWarehouseUpload() {},
    handleWarehouseImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleWarehouseImportFileRemove() {
      this.upload.pendingFile = null;
    },
    importWarehouseTemplate() {
      const api = this.upload.mode === "update" ? "foundation/warehouseCategory/importUpdateTemplate" : "foundation/warehouseCategory/importAddTemplate";
      this.download(api, {}, `fd_warehouse_category_template_${new Date().getTime()}.xlsx`);
    },
    showImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportWarehouseImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "warehouse_category_update" : "warehouse_category_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitWarehouseImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateWarehouseCategoryImportUpdate(f) : await validateWarehouseCategoryImportAdd(f);
        const d = res.data || {};
        this.showImportPreviewFromPayload(d, isUpdate ? "库房分类更新导入 — 解析结果" : "库房分类新增导入 — 解析结果");
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
        const res2 = isUpdate ? await importWarehouseCategoryUpdateData(f, true) : await importWarehouseCategoryAddData(f, true);
        const d2 = res2.data || {};
        this.showImportPreviewFromPayload(d2, isUpdate ? "库房分类更新导入 — 导入结果" : "库房分类新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeWarehouseImport();
        this.getList();
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
.wc-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.wc-left-col,
.wc-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.wc-side-panel {
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

.wc-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.wc-side-list {
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

.wc-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.warehouse-category-page .wc-main > .list-query-panel,
.warehouse-category-page .wc-main > .wc-toolbar,
.warehouse-category-page .wc-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.warehouse-category-page .wc-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.wc-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.wc-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.wc-query-actions {
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

.warehouse-category-page .apply-main-table.el-table {
  position: relative;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.warehouse-category-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.warehouse-category-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.warehouse-category-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr > td,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.warehouse-category-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.warehouse-category-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.warehouse-category-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.warehouse-category-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.warehouse-category-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.warehouse-category-page .apply-main-table ::v-deep th.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep td.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep th.el-table-column--selection,
.warehouse-category-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.warehouse-category-page .apply-main-table ::v-deep th.apply-action-col,
.warehouse-category-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.warehouse-category-page .apply-main-table ::v-deep td.apply-select-col,
.warehouse-category-page .apply-main-table ::v-deep td.el-table-column--selection,
.warehouse-category-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.warehouse-category-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
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
.app-container.warehouse-category-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.warehouse-category-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.warehouse-category-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.warehouse-category-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.warehouse-category-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.warehouse-category-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.warehouse-category-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
