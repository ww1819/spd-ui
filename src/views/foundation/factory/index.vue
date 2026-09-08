<!--生产厂家信息维护-->
<template>
  <div class="app-container list-page factory-page">
    <el-row :gutter="8" class="factory-layout-row">
      <!-- 左侧厂家列表（对齐耗材对照） -->
      <el-col :span="5" class="factory-left-col">
        <div class="factory-side-panel" ref="leftStack">
          <div class="factory-side-header">
            <span>厂家</span>
          </div>
          <div class="factory-side-list">
            <div
              v-for="factory in allFactoryList"
              :key="factory.factoryId"
              :class="['factory-item', { 'active': selectedFactoryId === factory.factoryId }]"
              @click="handleFactoryClick(factory)"
            >
              {{ factory.factoryName }}
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="factory-right-col">
        <div class="factory-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="factory-query-row">
                <el-input
                  v-model="queryParams.factoryCode"
                  placeholder="厂家编码"
                  clearable
                  class="factory-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.factoryName"
                  placeholder="厂家名称"
                  clearable
                  class="factory-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="factory-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar factory-toolbar">
            <div class="list-toolbar-left">
              <el-button
                v-if="!isZqTcmTenant"
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:factory:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:factory:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:factory:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="multiple"
                @click="handleUpdateReferred"
                v-hasPermi="['foundation:factory:updateReferred']"
              >更新简码</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:factory:export']"
              >导出</el-button>
              <el-button
                v-if="!isZqTcmTenant"
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('add')"
                v-hasPermi="['foundation:factory:import']"
              >新增导入</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('update')"
                v-hasPermi="['foundation:factory:import']"
              >更新导入</el-button>
              <msun-his-sync-button sync-type="producers" label="HIS厂家同步" :inline="true" :refresh="getList" />
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="factoryTable"
              v-loading="loading"
              :data="factoryList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="factoryRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="厂家编码" align="center" prop="factoryCode" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="HIS生产厂家ID" align="center" prop="hisId" width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="厂家名称" align="center" prop="factoryName" min-width="220" sortable="custom" show-overflow-tooltip />
              <el-table-column label="厂家地址" align="center" prop="factoryAddress" min-width="220" sortable="custom" show-overflow-tooltip />
              <el-table-column label="厂家联系方式" align="center" prop="factoryContact" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="状态" align="center" prop="factoryStatus" width="110" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.is_use_status" :value="scope.row.factoryStatus"/>
                </template>
              </el-table-column>
              <el-table-column label="创建日期" align="center" prop="createTime" width="150" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="240">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    icon="el-icon-document"
                    @click="openChangeLog(scope.row)"
                    v-hasPermi="['foundation:factory:list']"
                  >变更记录</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:factory:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:factory:remove']"
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
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="厂家编码" prop="factoryCode">
              <el-input v-model="form.factoryCode" :disabled="isDisabled" placeholder="厂家编码（不填自动生成）" />
            </el-form-item>
            <el-form-item label="厂家名称" prop="factoryName">
              <el-input v-model="form.factoryName" @input="factoryNameChange" placeholder="厂家名称" />
            </el-form-item>
            <el-form-item label="厂家简码" prop="factoryReferredCode">
              <el-input v-model="form.factoryReferredCode" :disabled="true" placeholder="厂家名称" />
            </el-form-item>
            <el-form-item label="使用状态" prop="factoryStatus">
              <el-select v-model="form.factoryStatus" placeholder="使用状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="厂家联系方式" prop="factoryContact">
              <el-input v-model="form.factoryContact" placeholder="厂家联系方式" />
            </el-form-item>
            <el-form-item label="厂家地址" prop="factoryAddress">
              <el-input v-model="form.factoryAddress" type="textarea" :rows="2" placeholder="厂家地址" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
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
          title="衡水市第三人民医院：Excel 新增行须填「HIS生产厂家ID」且组织机构内唯一；已存在编码的「更新」仅改名称与简码，不改库中 HIS ID。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：按厂家编码匹配组织机构下数据；可勾选「更新已存在」后<strong>仅更新厂家名称与厂家简码</strong>。先整单校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopFactoryUpload"
          :on-change="handleFactoryImportFileChange"
          :on-remove="handleFactoryImportFileRemove"
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
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importFactoryTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitFactoryImportFlow">校验并导入</el-button>
          <el-button @click="closeFactoryImport">取 消</el-button>
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
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportFactoryImportPreview">导出解析结果</el-button>
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

    <!-- 变更记录：右侧抽屉 -->
    <div v-if="changeLog.open" class="change-log-drawer-mask" @click.self="closeChangeLog">
      <div class="change-log-drawer-panel" @click.stop>
        <div class="change-log-drawer-header">
          <span class="change-log-drawer-title">生产厂家变更记录 — {{ changeLog.factoryName }}</span>
          <i class="el-icon-close change-log-drawer-close" @click="closeChangeLog" />
        </div>
        <div class="change-log-drawer-body">
          <el-table v-loading="changeLog.loading" :data="changeLog.rows" height="100%" size="small" border stripe>
            <el-table-column label="时间" prop="changeTime" width="160" show-overflow-tooltip />
            <el-table-column label="操作人" prop="operator" width="100" show-overflow-tooltip />
            <el-table-column label="字段" prop="fieldLabel" width="100" show-overflow-tooltip />
            <el-table-column label="原值" prop="oldValue" min-width="120" show-overflow-tooltip />
            <el-table-column label="新值" prop="newValue" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>
        <div class="change-log-drawer-footer">
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="closeChangeLog">关 闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { listFactory, listFactoryAll, getFactory, delFactory, addFactory, updateFactory, updateFactoryReferred, validateFactoryImportAdd, validateFactoryImportUpdate, importFactoryAddData, importFactoryUpdateData, listFactoryChangeLog } from "@/api/foundation/factory";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import {pinyin} from "pinyin-pro";
import MsunHisSyncButton from '@/components/MsunHisSyncButton';

export default {
  name: "Factory",
  components: { MsunHisSyncButton },
  dicts: ['is_use_status'],
  computed: {
    ...mapGetters(["factoryImportRequiresHisId", "isZqTcmTenant"]),
    hisIdPlaceholder() {
      if (this.form && this.form.factoryId) {
        return "保存后不可修改";
      }
      return "选填：HIS 生产厂家标识（不填不影响保存）";
    }
  },
  data() {
    return {
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      isDisabled: false,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      factoryList: [],
      allFactoryList: [],
      selectedFactoryId: null,
      mainTableHeight: 400,
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
      changeLog: {
        open: false,
        loading: false,
        factoryName: "",
        rows: []
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
        factoryCode: null,
        factoryName: null,
        factoryAddress: null,
        factoryContact: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      rules: {
        factoryName: [
          { required: true, message: "厂家名称不能为空", trigger: "blur" }
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
    this.getAllFactoryList();
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
        if (this.$refs.factoryTable && this.$refs.factoryTable.doLayout) {
          this.$refs.factoryTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.factoryTable && this.$refs.factoryTable.doLayout) {
              this.$refs.factoryTable.doLayout();
            }
          });
        }
      });
    },
    getAllFactoryList() {
      listFactoryAll({})
        .then((response) => {
          this.allFactoryList = Array.isArray(response) ? response : (response && response.rows) || [];
          this.$nextTick(() => this.updateMainTableHeight());
        })
        .catch(() => {
          this.allFactoryList = [];
        });
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listFactory(params)
        .then((response) => {
          const rows = (response && response.rows) || [];
          this.factoryList = rows.map((item, index) => ({
            ...item,
            index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
          }));
          this.total = (response && response.total) || 0;
        })
        .catch(() => {
          this.factoryList = [];
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
        });
    },
    handleFactoryClick(factory) {
      if (this.selectedFactoryId === factory.factoryId) {
        this.selectedFactoryId = null;
        this.queryParams.factoryName = null;
      } else {
        this.selectedFactoryId = factory.factoryId;
        this.queryParams.factoryName = factory.factoryName;
      }
      this.handleQuery();
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        factoryId: null,
        factoryCode: null,
        factoryName: null,
        factoryAddress: null,
        factoryContact: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        factoryReferredCode: null,
        factoryStatus: '1',
        hisId: null,
        remark: null,
      };
      this.resetForm("form");
    },
    factoryNameChange(val) {
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();
      this.form.factoryReferredCode = pinYinCode;
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.selectedFactoryId = null;
      this.queryParams.factoryCode = null;
      this.queryParams.factoryName = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.factoryTable && this.$refs.factoryTable.clearSort) {
        this.$refs.factoryTable.clearSort();
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        factoryCode: 'factory_code',
        hisId: 'his_id',
        factoryName: 'factory_name',
        factoryAddress: 'factory_address',
        factoryContact: 'factory_contact',
        factoryStatus: 'factory_status',
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
      this.ids = (selection || []).map(item => item.factoryId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    factoryRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.factoryId != null ? String(row.factoryId) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      if (this.isZqTcmTenant) {
        this.$modal.msgWarning('枣强县中医院不允许手工新增，请从HIS系统同步');
        return;
      }
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.title = "添加厂家维护";
      this.form.factoryStatus = '1';
    },
    handleUpdate(row) {
      this.reset();
      const factoryId = row.factoryId || this.ids;
      getFactory(factoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改厂家维护";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.factoryId != null) {
            updateFactory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllFactoryList();
            });
          } else {
            addFactory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllFactoryList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const factoryIds = row.factoryId || this.ids;
      this.$modal.confirm('是否确认删除厂家维护编号为"' + factoryIds + '"的数据项？').then(function() {
        return delFactory(factoryIds);
      }).then(() => {
        this.getList();
        this.getAllFactoryList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/factory/export', params, `factory_${new Date().getTime()}.xlsx`);
    },
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的厂家");
        return;
      }
      this.$modal.confirm("是否为选中的厂家更新简码？").then(() => {
        return updateFactoryReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    },
    handleImport(mode) {
      if (this.isZqTcmTenant && mode === 'add') {
        this.$modal.msgWarning('枣强县中医院不允许手工新增，请从HIS系统同步');
        return;
      }
      this.upload.mode = mode === "update" ? "update" : "add";
      this.upload.updateSupport = this.upload.mode === "update";
      this.upload.title = this.upload.mode === "update" ? "生产厂家更新导入" : "生产厂家新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.upload) this.$refs.upload.clearFiles();
      });
    },
    closeFactoryImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.upload) this.$refs.upload.clearFiles();
    },
    noopFactoryUpload() {},
    handleFactoryImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleFactoryImportFileRemove() {
      this.upload.pendingFile = null;
    },
    importFactoryTemplate() {
      const api = this.upload.mode === "update" ? "foundation/factory/importUpdateTemplate" : "foundation/factory/importAddTemplate";
      this.download(api, {}, `fd_factory_template_${new Date().getTime()}.xlsx`);
    },
    openChangeLog(row) {
      if (!row || !row.factoryId) return;
      this.changeLog.open = true;
      this.changeLog.factoryName = row.factoryName || "";
      this.changeLog.rows = [];
      this.changeLog.loading = true;
      listFactoryChangeLog(row.factoryId).then(res => {
        this.changeLog.rows = res.data || [];
        this.changeLog.loading = false;
      }).catch(() => {
        this.changeLog.loading = false;
      });
    },
    closeChangeLog() {
      this.changeLog.open = false;
      this.changeLog.rows = [];
      this.changeLog.factoryName = "";
    },
    showImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportFactoryImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "factory_update" : "factory_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitFactoryImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateFactoryImportUpdate(f) : await validateFactoryImportAdd(f);
        const d = res.data || {};
        this.showImportPreviewFromPayload(d, isUpdate ? "生产厂家更新导入 — 解析结果" : "生产厂家新增导入 — 解析结果");
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
        const res2 = isUpdate ? await importFactoryUpdateData(f, true) : await importFactoryAddData(f, true);
        const d2 = res2.data || {};
        this.showImportPreviewFromPayload(d2, isUpdate ? "生产厂家更新导入 — 导入结果" : "生产厂家新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeFactoryImport();
        this.getList();
        this.getAllFactoryList();
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
.factory-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.factory-left-col,
.factory-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.factory-side-panel {
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

.factory-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.factory-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.factory-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  border-left: 3px solid transparent;
}

.factory-item:hover {
  background-color: #D6EBFF;
  color: #303133;
}

.factory-item.active {
  background-color: #B8DAFF;
  color: #303133;
  border-left-color: #2563EB;
  font-weight: 500;
}

.factory-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.factory-page .factory-main > .list-query-panel,
.factory-page .factory-main > .factory-toolbar,
.factory-page .factory-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.factory-page .factory-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.factory-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.factory-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.factory-query-actions {
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

.factory-page .apply-main-table.el-table {
  position: relative;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.factory-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.factory-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.factory-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.factory-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.factory-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.factory-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.factory-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.factory-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.factory-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.factory-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.factory-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body tr > td,
.factory-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.factory-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.factory-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.factory-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.factory-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.factory-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.factory-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.factory-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.factory-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.factory-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.factory-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.factory-page .apply-main-table ::v-deep th.apply-select-col,
.factory-page .apply-main-table ::v-deep td.apply-select-col,
.factory-page .apply-main-table ::v-deep th.el-table-column--selection,
.factory-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.factory-page .apply-main-table ::v-deep th.apply-action-col,
.factory-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.factory-page .apply-main-table ::v-deep td.apply-select-col,
.factory-page .apply-main-table ::v-deep td.el-table-column--selection,
.factory-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.factory-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.local-modal-content {
  background: #fff;
  border-radius: 6px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  max-height: 90%;
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

.change-log-drawer-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 30;
  display: flex;
  justify-content: flex-end;
}

.change-log-drawer-panel {
  width: 720px;
  max-width: 92%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.change-log-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.change-log-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 12px;
}

.change-log-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  flex-shrink: 0;
}

.change-log-drawer-close:hover {
  color: #409EFF;
}

.change-log-drawer-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 12px 16px;
  box-sizing: border-box;
}

.change-log-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>

<style>
.app-container.factory-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.factory-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.factory-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.factory-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.factory-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.factory-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.factory-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
