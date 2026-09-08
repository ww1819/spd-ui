<template>
  <div class="app-container list-page supplier-page">
    <el-row :gutter="8" class="supplier-layout-row">
      <!-- 左侧供应商列表（对齐耗材对照） -->
      <el-col :span="5" class="supplier-left-col">
        <div class="supplier-side-panel" ref="leftStack">
          <div class="supplier-side-header">
            <span>供应商</span>
          </div>
          <div class="supplier-side-list">
            <div
              v-for="supplier in allSupplierList"
              :key="supplier.id"
              :class="['supplier-item', { 'active': selectedSupplierId === supplier.id }]"
              @click="handleSupplierClick(supplier)"
            >
              {{ supplier.name }}
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="supplier-right-col">
        <div class="supplier-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="supplier-query-row">
                <el-input
                  v-model="queryParams.code"
                  placeholder="供应商编码"
                  clearable
                  class="supplier-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.name"
                  placeholder="供应商名称"
                  clearable
                  class="supplier-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.taxNumber"
                  placeholder="税号"
                  clearable
                  class="supplier-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-select
                  v-model="queryParams.supplierStatus"
                  placeholder="状态"
                  clearable
                  class="supplier-query-control"
                >
                  <el-option
                    v-for="d in dict.type.is_use_status"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
                <div class="supplier-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar supplier-toolbar">
            <div class="list-toolbar-left">
              <el-button
                v-if="!isZqTcmTenant"
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:supplier:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:supplier:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:supplier:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="multiple"
                @click="handleUpdateReferred"
                v-hasPermi="['foundation:supplier:updateReferred']"
              >更新简码</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:supplier:export']"
              >导出</el-button>
              <el-button
                v-if="!isZqTcmTenant"
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('add')"
                v-hasPermi="['foundation:supplier:import']"
              >新增导入</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('update')"
                v-hasPermi="['foundation:supplier:import']"
              >更新导入</el-button>
              <msun-his-sync-button sync-type="suppliers" label="HIS供应商同步" :inline="true" :refresh="getList" />
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="supplierTable"
              v-loading="loading"
              :data="supplierList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="supplierRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="供应商编码" align="center" prop="code" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="HIS供应商ID" align="center" prop="hisId" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="供应商名称" align="center" prop="name" min-width="200" sortable="custom" show-overflow-tooltip />
              <el-table-column label="名称简码" align="center" prop="referredCode" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="税号" align="center" prop="taxNumber" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="资质有效期" align="center" prop="validTime" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="状态" align="center" prop="supplierStatus" width="110" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.is_use_status" :value="scope.row.supplierStatus" />
                </template>
              </el-table-column>
              <el-table-column label="供应商类型" align="center" prop="supplierType" min-width="130" sortable="custom" show-overflow-tooltip />
              <el-table-column label="公司简称" align="center" prop="companyReferred" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="法人" align="center" prop="legalPerson" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="联系人" align="center" prop="contacts" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="地址" align="center" prop="address" min-width="200" show-overflow-tooltip />
              <el-table-column label="联系电话" align="center" prop="contactsPhone" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="240">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    icon="el-icon-document"
                    @click="openChangeLog(scope.row)"
                    v-hasPermi="['foundation:supplier:list']"
                  >变更记录</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:supplier:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:supplier:remove']"
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

    <!-- 添加或修改供应商对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="供应商编码" prop="code">
                <el-input v-model="form.code" :disabled="isDisabled" placeholder="供应商编码（不填自动生成）" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="供应商名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入供应商名称" @input="supplierNameChange" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="名称简码" prop="referredCode">
                <el-input v-model="form.referredCode" placeholder="可随名称自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司简称" prop="companyReferred">
                <el-input v-model="form.companyReferred" placeholder="公司简称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="12">
              <el-form-item label="HIS供应商ID" prop="hisId">
                <el-input
                  v-model="form.hisId"
                  :disabled="!!form.id || !supplierImportRequiresHisId"
                  :placeholder="hisIdPlaceholder"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="法人" prop="legalPerson">
                <el-input v-model="form.legalPerson" placeholder="法人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="资质有效期" prop="validTime">
                <el-date-picker
                  v-model="form.validTime"
                  type="date"
                  placeholder="选择日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="supplierStatus">
                <el-select v-model="form.supplierStatus" placeholder="状态" clearable style="width: 100%">
                  <el-option
                    v-for="d in dict.type.is_use_status"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="资质有效期" prop="validTime">
                <el-date-picker
                  v-model="form.validTime"
                  type="date"
                  placeholder="选择日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="supplierStatus">
                <el-select v-model="form.supplierStatus" placeholder="状态" clearable style="width: 100%">
                  <el-option
                    v-for="d in dict.type.is_use_status"
                    :key="d.value"
                    :label="d.label"
                    :value="d.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="证件号" prop="certNumber">
                <el-input v-model="form.certNumber" placeholder="证件号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="地址" prop="address">
                <el-input v-model="form.address" placeholder="地址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="注册资金" prop="regMoney">
                <el-input v-model="form.regMoney" placeholder="注册资金" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="银行账号" prop="bankAccount">
                <el-input v-model="form.bankAccount" placeholder="银行账号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="联系人" prop="contacts">
                <el-input v-model="form.contacts" placeholder="联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话" prop="contactsPhone">
                <el-input v-model="form.contactsPhone" placeholder="联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="网址" prop="website">
                <el-input v-model="form.website" placeholder="网址" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="邮编" prop="zipCode">
                <el-input v-model="form.zipCode" placeholder="邮编" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="传真" prop="fax">
                <el-input v-model="form.fax" placeholder="传真" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="公司负责人" prop="companyPerson">
                <el-input v-model="form.companyPerson" placeholder="公司负责人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="税号" prop="taxNumber">
                <el-input v-model="form.taxNumber" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="6">
              <el-form-item label="电话" prop="phone">
                <el-input v-model="form.phone" placeholder="电话" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="经营范围" prop="supplierRange">
                <el-input v-model="form.supplierRange" type="textarea" :rows="2" placeholder="请输入经营范围" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注（对应表 remark）" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 供应商类型容器 -->
          <el-row>
            <el-col :span="24">
              <div class="supplier-type-container">
                <el-form-item label="供应商类型：" prop="supplierType" label-width="100px">
                  <div class="supplier-type-buttons">
                    <span
                      v-for="type in supplierTypeOptions"
                      :key="type.value"
                      :class="['supplier-type-btn', { 'active': form.supplierTypeList && form.supplierTypeList.includes(type.value) }]"
                      @click="toggleSupplierType(type.value)">
                      {{ type.label }}
                    </span>
                  </div>
                </el-form-item>
              </div>
            </el-col>
          </el-row>
        </el-form>
        <div class="modal-footer-fixed">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>

    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 520px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="supplierImportRequiresHisId"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="衡水市第三人民医院：Excel 新增行须填「HIS供应商ID」且唯一；已存在编码的「更新」仅改名称与简码，不改库中 HIS ID。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：按供应商编码匹配组织机构下数据；可勾选「更新已存在」后<strong>仅更新供应商名称与名称简码</strong>。先整单校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopSupplierUpload"
          :on-change="handleSupplierImportFileChange"
          :on-remove="handleSupplierImportFileRemove"
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
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importSupplierTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitSupplierImportFlow">校验并导入</el-button>
          <el-button @click="closeSupplierImport">取 消</el-button>
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
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportSupplierImportPreview">导出解析结果</el-button>
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

    <!-- 变更记录：右侧抽屉（不挂到 body，避免盖住顶栏/侧栏） -->
    <div v-if="changeLog.open" class="change-log-drawer-mask" @click.self="closeChangeLog">
      <div class="change-log-drawer-panel" @click.stop>
        <div class="change-log-drawer-header">
          <span class="change-log-drawer-title">供应商变更记录 — {{ changeLog.supplierName }}</span>
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
import { listSupplier, getSupplier, delSupplier, addSupplier, updateSupplier, updateSupplierReferred, validateSupplierImportAdd, validateSupplierImportUpdate, importSupplierAddData, importSupplierUpdateData, listSupplierChangeLog } from "@/api/foundation/supplier";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import {pinyin} from "pinyin-pro";
import MsunHisSyncButton from '@/components/MsunHisSyncButton';

export default {
  name: "Supplier",
  components: { MsunHisSyncButton },
  dicts: ['is_use_status'],
  computed: {
    ...mapGetters(["supplierImportRequiresHisId", "isZqTcmTenant"]),
    hisIdPlaceholder() {
      if (this.form && this.form.id) {
        return "保存后不可修改";
      }
      return "选填：HIS 供应商标识（不填不影响保存）";
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
      supplierList: [],
      allSupplierList: [],
      selectedSupplierId: null,
      mainTableHeight: 400,
      title: "",
      open: false,
      supplierTypeOptions: [
        { label: '耗材', value: '耗材' },
        { label: '设备', value: '设备' },
        { label: '配件', value: '配件' }
      ],
      upload: {
        open: false,
        title: "",
        isUploading: false,
        updateSupport: false,
        pendingFile: null,
        mode: "add"
      },
      importPreview: {
        visible: false,
        title: "导入解析结果",
        rows: [],
        columns: []
      },
      changeLog: {
        open: false,
        loading: false,
        supplierName: "",
        rows: []
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        referredCode: null,
        taxNumber: null,
        supplierStatus: null,
        supplierType: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      rules: {
        name: [
          { required: true, message: "供应商名称不能为空", trigger: "blur" }
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
    this.getAllSupplierList();
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
        if (this.$refs.supplierTable && this.$refs.supplierTable.doLayout) {
          this.$refs.supplierTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.supplierTable && this.$refs.supplierTable.doLayout) {
              this.$refs.supplierTable.doLayout();
            }
          });
        }
      });
    },
    getAllSupplierList() {
      listSupplier({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allSupplierList = response.rows || [];
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listSupplier(params).then(response => {
        const rows = response.rows || [];
        this.supplierList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
        this.supplierList = [];
        this.total = 0;
      });
    },
    handleSupplierClick(supplier) {
      if (this.selectedSupplierId === supplier.id) {
        this.selectedSupplierId = null;
        this.queryParams.name = null;
      } else {
        this.selectedSupplierId = supplier.id;
        this.queryParams.name = supplier.name;
      }
      this.handleQuery();
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        code: null,
        name: null,
        delFlag: null,
        taxNumber: null,
        referredCode: null,
        regMoney: null,
        validTime: null,
        contacts: null,
        contactsPhone: null,
        website: null,
        legalPerson: null,
        zipCode: null,
        email: null,
        address: null,
        companyPerson: null,
        phone: null,
        certNumber: null,
        fax: null,
        bankAccount: null,
        companyReferred: null,
        supplierRange: null,
        supplierStatus: '1',
        supplierType: null,
        supplierTypeList: [],
        hisId: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.resetForm("form");
    },
    toggleSupplierType(type) {
      if (!this.form.supplierTypeList) {
        this.$set(this.form, 'supplierTypeList', []);
      }
      const index = this.form.supplierTypeList.indexOf(type);
      if (index > -1) {
        this.form.supplierTypeList.splice(index, 1);
      } else {
        this.form.supplierTypeList.push(type);
      }
      this.$set(this.form, 'supplierType', this.form.supplierTypeList.join(','));
    },
    supplierNameChange(val) {
      if (val === undefined || val === null || String(val).trim() === '') {
        this.form.referredCode = '';
        return;
      }
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      })
        .join('')
        .toUpperCase();
      this.form.referredCode = pinYinCode;
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.selectedSupplierId = null;
      this.queryParams.code = null;
      this.queryParams.name = null;
      this.queryParams.taxNumber = null;
      this.queryParams.supplierStatus = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.supplierTable && this.$refs.supplierTable.clearSort) {
        this.$refs.supplierTable.clearSort();
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        code: 'code',
        hisId: 'his_id',
        name: 'name',
        referredCode: 'referred_code',
        taxNumber: 'tax_number',
        validTime: 'valid_time',
        supplierStatus: 'supplier_status',
        supplierType: 'supplier_type',
        companyReferred: 'company_referred',
        legalPerson: 'legal_person',
        contacts: 'contacts',
        contactsPhone: 'contacts_phone'
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
      this.ids = (selection || []).map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    supplierRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.id != null ? String(row.id) : '';
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
      this.form.supplierTypeList = ['耗材'];
      this.form.supplierType = '耗材';
      this.open = true;
      this.isDisabled = false;
      this.title = "添加供应商";
      this.form.supplierStatus = '1';
    },
    handleUpdate(row) {
      const rawId = row && row.id != null ? row.id : this.ids;
      const id = Array.isArray(rawId) ? (rawId.length > 0 ? rawId[0] : null) : rawId;
      if (id == null) {
        return;
      }
      getSupplier(id).then(response => {
        this.reset();
        const responseData = response.data || response;
        const backendSupplierType = responseData?.supplierType || response?.supplierType;
        this.form = { ...this.form, ...responseData };
        if (backendSupplierType && typeof backendSupplierType === 'string' && backendSupplierType.trim()) {
          const typeList = backendSupplierType.split(',').map(item => item.trim()).filter(item => item);
          this.$set(this.form, 'supplierTypeList', typeList);
          this.$set(this.form, 'supplierType', backendSupplierType);
        } else if (backendSupplierType && Array.isArray(backendSupplierType)) {
          this.$set(this.form, 'supplierTypeList', backendSupplierType.filter(item => item));
          this.$set(this.form, 'supplierType', backendSupplierType.join(','));
        } else {
          if (this.form.supplierType && typeof this.form.supplierType === 'string' && this.form.supplierType.trim()) {
            const typeList = this.form.supplierType.split(',').map(item => item.trim()).filter(item => item);
            this.$set(this.form, 'supplierTypeList', typeList);
          } else {
            this.$set(this.form, 'supplierTypeList', []);
            this.$set(this.form, 'supplierType', '');
          }
        }
        this.open = true;
        this.isDisabled = true;
        this.title = "修改供应商";
      });
    },
    submitForm() {
      if (this.form.name && (!this.form.referredCode || String(this.form.referredCode).trim() === '')) {
        this.supplierNameChange(this.form.name);
      }
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!this.form.supplierTypeList || !Array.isArray(this.form.supplierTypeList)) {
            this.$set(this.form, 'supplierTypeList', []);
          }
          const supplierTypeStr = this.form.supplierTypeList.join(',');
          this.$set(this.form, 'supplierType', supplierTypeStr);
          const submitData = {
            ...this.form,
            supplierType: supplierTypeStr || '',
          };
          delete submitData.supplierTypeList;
          if (this.form.id != null) {
            updateSupplier(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllSupplierList();
              if (!response.data?.supplierType && !response.supplierType && submitData.supplierType) {
                this.$set(this.form, 'supplierType', submitData.supplierType);
                if (submitData.supplierType) {
                  this.$set(
                    this.form,
                    'supplierTypeList',
                    submitData.supplierType.split(',').filter(item => item.trim())
                  );
                }
              }
            }).catch(error => {
              this.$modal.msgError("修改失败：" + (error.msg || error.message || '未知错误'));
            });
          } else {
            addSupplier(submitData).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllSupplierList();
              if (!response.data?.supplierType && !response.supplierType && submitData.supplierType) {
                this.$set(this.form, 'supplierType', submitData.supplierType);
                if (submitData.supplierType) {
                  this.$set(
                    this.form,
                    'supplierTypeList',
                    submitData.supplierType.split(',').filter(item => item.trim())
                  );
                }
              }
            }).catch(error => {
              this.$modal.msgError("新增失败：" + (error.msg || error.message || '未知错误'));
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除供应商编号为"' + ids + '"的数据项？').then(function() {
        return delSupplier(ids);
      }).then(() => {
        this.getList();
        this.getAllSupplierList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/supplier/export', params, `supplier_${new Date().getTime()}.xlsx`);
    },
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的供应商");
        return;
      }
      this.$modal.confirm("是否为选中的供应商更新名称简码？").then(() => {
        return updateSupplierReferred(this.ids);
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
      this.upload.title = this.upload.mode === "update" ? "供应商更新导入" : "供应商新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.upload) this.$refs.upload.clearFiles();
      });
    },
    closeSupplierImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.upload) this.$refs.upload.clearFiles();
    },
    noopSupplierUpload() {},
    handleSupplierImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleSupplierImportFileRemove() {
      this.upload.pendingFile = null;
    },
    importSupplierTemplate() {
      const api = this.upload.mode === "update" ? "foundation/supplier/importUpdateTemplate" : "foundation/supplier/importAddTemplate";
      this.download(api, {}, `fd_supplier_template_${new Date().getTime()}.xlsx`);
    },
    openChangeLog(row) {
      if (!row || !row.id) return;
      this.changeLog.open = true;
      this.changeLog.supplierName = row.name || "";
      this.changeLog.rows = [];
      this.changeLog.loading = true;
      listSupplierChangeLog(row.id).then(res => {
        this.changeLog.rows = res.data || [];
        this.changeLog.loading = false;
      }).catch(() => {
        this.changeLog.loading = false;
      });
    },
    closeChangeLog() {
      this.changeLog.open = false;
      this.changeLog.rows = [];
      this.changeLog.supplierName = "";
    },
    showImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportSupplierImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "supplier_update" : "supplier_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitSupplierImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateSupplierImportUpdate(f) : await validateSupplierImportAdd(f);
        const d = res.data || {};
        this.showImportPreviewFromPayload(d, isUpdate ? "供应商更新导入 — 解析结果" : "供应商新增导入 — 解析结果");
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
        const res2 = isUpdate ? await importSupplierUpdateData(f, true) : await importSupplierAddData(f, true);
        const d2 = res2.data || {};
        this.showImportPreviewFromPayload(d2, isUpdate ? "供应商更新导入 — 导入结果" : "供应商新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeSupplierImport();
        this.getList();
        this.getAllSupplierList();
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
.supplier-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.supplier-left-col,
.supplier-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.supplier-side-panel {
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

.supplier-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.supplier-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.supplier-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  border-left: 3px solid transparent;
}

.supplier-item:hover {
  background-color: #D6EBFF;
  color: #303133;
}

.supplier-item.active {
  background-color: #B8DAFF;
  color: #303133;
  border-left-color: #2563EB;
  font-weight: 500;
}

.supplier-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.supplier-page .supplier-main > .list-query-panel,
.supplier-page .supplier-main > .supplier-toolbar,
.supplier-page .supplier-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.supplier-page .supplier-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.supplier-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.supplier-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.supplier-query-actions {
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

.supplier-page .apply-main-table.el-table {
  position: relative;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.supplier-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.supplier-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.supplier-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.supplier-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.supplier-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body tr > td,
.supplier-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.supplier-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.supplier-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.supplier-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.supplier-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.supplier-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.supplier-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.supplier-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.supplier-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.supplier-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.supplier-page .apply-main-table ::v-deep th.apply-select-col,
.supplier-page .apply-main-table ::v-deep td.apply-select-col,
.supplier-page .apply-main-table ::v-deep th.el-table-column--selection,
.supplier-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.supplier-page .apply-main-table ::v-deep th.apply-action-col,
.supplier-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.supplier-page .apply-main-table ::v-deep td.apply-select-col,
.supplier-page .apply-main-table ::v-deep td.el-table-column--selection,
.supplier-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.supplier-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
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
  width: 100% !important;
  max-width: 1900px !important;
  min-width: 1700px !important;
  max-height: 92%;
  min-height: 870px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

.supplier-type-container {
  background: #fafafa;
  padding: 16px 20px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  margin-top: 16px;
}

.supplier-type-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.supplier-type-btn {
  display: inline-flex;
  padding: 12px 20px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  user-select: none;
  height: 40px;
  line-height: 16px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
}

.supplier-type-btn:hover {
  border-color: #409EFF;
  color: #409EFF;
}

.supplier-type-btn.active {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}

.supplier-type-btn.active:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.modal-footer-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #EBEEF5;
  margin-top: 20px;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.modal-footer-fixed .el-button {
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
.app-container.supplier-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.supplier-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.supplier-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.supplier-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.supplier-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.supplier-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.supplier-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
