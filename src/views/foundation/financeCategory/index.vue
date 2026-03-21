<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧固定高度树形结构 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="financeCategoryId"
            highlight-current
            :default-expand-all="true"
            style="height: calc(100vh - 180px); overflow-y: auto"
          >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧内容区域 -->
      <el-col :span="20">
        <!-- 搜索表单 -->
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="财务分类编码" prop="financeCategoryCode" label-width="100px">
                <el-input
                  v-model="queryParams.financeCategoryCode"
                  placeholder="请输入财务分类编码"
                  clearable
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="财务分类名称" prop="financeCategoryName" label-width="100px">
                <el-input
                  v-model="queryParams.financeCategoryName"
                  placeholder="请输入财务分类名称"
                  clearable
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 操作按钮 -->
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="small"
              @click="handleAdd"
              v-hasPermi="['foundation:financeCategory:add']"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              icon="el-icon-edit"
              size="small"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['foundation:financeCategory:edit']"
            >修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="el-icon-delete"
              size="small"
              :disabled="single"
              @click="handleDelete"
              v-hasPermi="['foundation:financeCategory:remove']"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-refresh"
              size="small"
              :disabled="multiple"
              @click="handleUpdateReferred"
              v-hasPermi="['foundation:financeCategory:updateReferred']"
            >更新简码</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="small"
              @click="handleExport"
              v-hasPermi="['foundation:financeCategory:export']"
            >导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="info"
              plain
              icon="el-icon-upload2"
              size="small"
              @click="handleImport('add')"
              v-hasPermi="['foundation:financeCategory:import']"
            >新增导入</el-button>
          </el-col>
          <el-col :span="1.8">
            <el-button
              type="info"
              plain
              icon="el-icon-refresh-right"
              size="small"
              @click="handleImport('update')"
              v-hasPermi="['foundation:financeCategory:import']"
            >更新导入</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <!-- 数据表格 -->
        <el-table v-loading="loading" :data="financeCategoryList" :row-class-name="financeCategoryIndex" @selection-change="handleSelectionChange" height="calc(100vh - 280px)">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="财务类别编码" align="center" prop="financeCategoryCode" width="120"/>
          <el-table-column label="财务类别名称" align="center" prop="financeCategoryName" width="180"/>
          <el-table-column label="HIS系统ID" align="center" prop="hisId" width="120" show-overflow-tooltip/>
          <el-table-column label="简码" align="center" prop="referredName" width="100" show-overflow-tooltip/>
          <el-table-column label="地址" align="center" prop="financeCategoryAddress" min-width="120" show-overflow-tooltip/>
          <el-table-column label="联系方式" align="center" prop="financeCategoryContact" width="120" show-overflow-tooltip/>
          <el-table-column label="使用状态" align="center" prop="isUse" width="100">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.is_use_status" :value="scope.row.isUse"/>
            </template>
          </el-table-column>
          <el-table-column label="租户ID" align="center" prop="tenantId" width="110" show-overflow-tooltip/>
          <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip/>
          <el-table-column label="创建日期" align="center" prop="createTime" width="100">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['foundation:financeCategory:edit']"
              >修改</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
                v-hasPermi="['foundation:financeCategory:remove']"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />

        <!-- 新增/修改弹窗 -->
        <div v-if="open" class="local-modal-mask">
          <div class="local-modal-content">
            <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
            <el-form ref="form" :model="form" :rules="rules" label-width="110px">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="财务类别编码" prop="financeCategoryCode">
                    <el-input v-model="form.financeCategoryCode" :disabled="isDisabled" placeholder="请输入编码" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="财务类别名称" prop="financeCategoryName">
                    <el-input v-model="form.financeCategoryName" placeholder="请输入名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="名称简码" prop="referredName">
                    <el-input v-model="form.referredName" placeholder="可点「更新简码」生成" clearable />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="使用状态" prop="isUse">
                    <el-select v-model="form.isUse" placeholder="请选择使用状态" style="width: 100%">
                      <el-option
                        v-for="dict in dict.type.is_use_status"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="HIS系统ID" prop="hisId">
                    <el-input
                      v-model="form.hisId"
                      :disabled="!!form.financeCategoryId"
                      :placeholder="form.financeCategoryId ? '保存后不可修改' : (factoryImportRequiresHisId ? '衡水租户新增必填' : '非衡水租户无需填写')"
                      clearable
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="地址" prop="financeCategoryAddress">
                    <el-input v-model="form.financeCategoryAddress" placeholder="地址" clearable />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="联系方式" prop="financeCategoryContact">
                    <el-input v-model="form.financeCategoryContact" placeholder="联系方式" clearable />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="租户ID(客户)" prop="tenantId">
                    <el-input v-model="form.tenantId" disabled placeholder="保存时默认当前客户" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div class="dialog-footer" style="text-align:right;margin-top:16px;">
              <el-button type="primary" @click="submitForm">确 定</el-button>
              <el-button @click="cancel">取 消</el-button>
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
              title="衡水市第三人民医院：Excel 新增行须填「HIS系统ID」且租户内唯一；已存在编码的「更新」仅改名称与简码，不改库中 HIS ID。"
            />
            <p v-if="upload.mode === 'add'" style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
              <strong>新增导入</strong>：与库房分类一致，按<strong>财务分类编码</strong>匹配租户数据；仅允许新增（库中已存在相同编码则整单校验不通过）。先校验并确认后写入。
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
      </el-col>
    </el-row>

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
  </div>
</template>

<script>
import { listFinanceCategory, getFinanceCategory, delFinanceCategory, addFinanceCategory, updateFinanceCategory, updateFinanceCategoryReferred, validateFinanceCategoryImportAdd, validateFinanceCategoryImportUpdate, importFinanceCategoryAddData, importFinanceCategoryUpdateData } from "@/api/foundation/financeCategory";
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
      // 树形数据配置
      treeData: [],
      treeProps: {
        label: 'financeCategoryName',
        children: 'children'
      },
      // 表格相关
      loading: true,
      financeCategoryList: [],
      total: 0,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        financeCategoryCode: null,
        financeCategoryName: null,
      },
      // 表单相关
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
  created() {
    this.getList();
  },
  methods: {
    // 获取数据列表
    getList() {
      this.loading = true;
      listFinanceCategory(this.queryParams)
        .then(response => {
          this.financeCategoryList = (response && response.rows) || [];
          this.total = (response && response.total) || 0;
          this.treeData = [{
            financeCategoryId: 'root',
            financeCategoryName: '全部分类',
            children: this.financeCategoryList
          }];
        })
        .catch(() => {
          this.financeCategoryList = [];
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    // 树节点点击事件
    handleNodeClick(data) {
      if (data.financeCategoryId !== 'root') {
        // 这里可以添加节点筛选逻辑
      }
    },
    // 搜索相关方法
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 表格多选
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.financeCategoryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    // 新增/修改操作
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
    // 表单提交
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.financeCategoryId) {
            updateFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addFinanceCategory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    // 删除操作
    handleDelete(row) {
      const financeCategoryIds = row.financeCategoryId || this.ids;
      this.$modal.confirm('确认删除选中的数据？').then(() => {
        return delFinanceCategory(financeCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      });
    },
    financeCategoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    // 其他辅助方法
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
    // 导出功能
    handleExport() {
      this.download('foundation/financeCategory/export', {
        ...this.queryParams
      }, `financeCategory_${new Date().getTime()}.xlsx`);
    },
    /** 更新财务分类名称简码 */
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
.tree-card {
  height: calc(100vh - 150px);
}
.tree-card ::v-deep .el-card__body {
  padding: 10px;
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
  min-width: 880px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.dialog-footer {
  text-align: right;
  margin-top: 16px;
}
</style>
