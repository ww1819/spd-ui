<template>
  <div class="app-container list-page print-setting-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form
        class="query-form"
        :model="queryParams"
        ref="queryForm"
        size="small"
        :inline="true"
      >
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field more-search-field--text"
          >
            <el-input
              v-if="t === 'tenantId'"
              v-model="queryParams.tenantId"
              placeholder="组织机构ID，全库默认留空"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.templateName"
              placeholder="模板名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="单据类型" clearable class="more-search-select-wrap">
                <el-option label="入库单" :value="101" />
                <el-option label="退货单" :value="102" />
                <el-option label="出库单" :value="201" />
                <el-option label="退库单" :value="202" />
                <el-option label="盘点单" :value="301" />
                <el-option label="入库单(高值)" :value="111" />
                <el-option label="退货单(高值)" :value="112" />
                <el-option label="出库单(高值)" :value="211" />
                <el-option label="退库单(高值)" :value="212" />
                <el-option label="跟台条码" :value="401" />
                <el-option label="备货条码" :value="402" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['system:printSetting:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:printSetting:edit']"
        >修改</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:printSetting:remove']"
        >删除</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-pagination-wrapper">
    <el-table v-loading="loading" :data="printSettingList" stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="模板名称" align="center" prop="templateName" width="140" show-overflow-tooltip />
      <el-table-column label="适用组织机构" align="center" prop="tenantId" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.tenantId || '全库默认' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据类型" align="center" prop="billType" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.billType === 101">入库单</span>
          <span v-else-if="scope.row.billType === 102">退货单</span>
          <span v-else-if="scope.row.billType === 201">出库单</span>
          <span v-else-if="scope.row.billType === 202">退库单</span>
          <span v-else-if="scope.row.billType === 301">盘点单</span>
          <span v-else-if="scope.row.billType === 111">入库单(高值)</span>
          <span v-else-if="scope.row.billType === 112">退货单(高值)</span>
          <span v-else-if="scope.row.billType === 211">出库单(高值)</span>
          <span v-else-if="scope.row.billType === 212">退库单(高值)</span>
          <span v-else-if="scope.row.billType === 401">跟台条码</span>
          <span v-else-if="scope.row.billType === 402">备货条码</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="页面尺寸" align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.pageWidth }}mm × {{ scope.row.pageHeight }}mm</span>
        </template>
      </el-table-column>
      <el-table-column label="方向" align="center" prop="orientation" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.orientation === 'landscape' ? '横向' : '纵向' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启用/停用" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="是否默认" align="center" prop="isDefault" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.isDefault === 1 ? 'success' : 'info'">
            {{ scope.row.isDefault === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="160" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建人" align="center" prop="createBy" width="100" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:printSetting:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleSetDefault(scope.row)"
            v-hasPermi="['system:printSetting:edit']"
            v-if="scope.row.isDefault !== 1"
          >设默认</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:printSetting:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bottom">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    </div>

    <!-- 添加或修改打印设置对话框：放在当前框架内，稍微增宽增高 -->
    <!-- 新增/修改打印设置弹窗：固定在内容容器内，不遮挡顶部菜单 -->
    <el-dialog
      class="print-setting-dialog"
      :title="title"
      :visible.sync="open"
      :append-to-body="false"
      :modal="false"
      :show-close="false"
    >
      <!-- 自定义标题：左侧标题，右侧“关闭”文字按钮 -->
      <span slot="title" class="print-setting-dialog-title">
        <span>{{ title }}</span>
        <el-button type="text" size="mini" class="dialog-header-close" @click="cancel">关闭</el-button>
      </span>
      <print-setting-form ref="form" :form-data="form" @success="handleFormSuccess" @cancel="cancel" />
    </el-dialog>
  </div>
</template>

<script>
import { listPrintSetting, getPrintSetting, delPrintSetting, setDefaultTemplate } from "@/api/system/printSetting";
import PrintSettingForm from "./form";

export default {
  name: "PrintSetting",
  dicts: ['sys_normal_disable'],
  components: {
    PrintSettingForm
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '模板名称', value: 'templateName' },
        { label: '组织机构ID', value: 'tenantId' }
      ],
      // 总条数
      total: 0,
      // 打印设置表格数据
      printSettingList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        templateName: undefined,
        tenantId: undefined,
        billType: undefined
      },
      // 表单参数
      form: {}
    };
  },
  computed: {
    moreSearchStorageKey() {
      return 'spd.system.printSetting.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  methods: {
    /** 查询打印设置列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      listPrintSetting(params).then(response => {
        this.printSettingList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass() {
      return 'more-search-field--text';
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === 'function') {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        templateName: 'templateName',
        tenantId: 'tenantId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.form = {};
      this.open = true;
      this.title = "添加打印设置";
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.resetForm();
        }
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const id = row.id || this.ids[0];
      getPrintSetting(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改打印设置";
        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.setFormData(this.form);
          }
        });
      });
    },
    /** 提交表单 */
    submitForm() {
      if (this.$refs.form) {
        this.$refs.form.submitForm();
      }
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.form = {};
    },
    /** 设置默认模板 */
    handleSetDefault(row) {
      this.$modal.confirm('是否确认将"' + row.templateName + '"设置为默认模板？').then(() => {
        return setDefaultTemplate({ id: row.id, billType: row.billType, tenantId: row.tenantId });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("设置成功");
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除打印设置编号为"' + ids + '"的数据项？').then(() => {
        return delPrintSetting(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 表单提交成功回调 */
    handleFormSuccess() {
      this.open = false;
      this.getList();
    }
  }
};
</script>

<style scoped>
.print-setting-page {
  /* 基础内边距，保留上下和右侧，左侧由全局规则强制为 0 */
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
}

.table-pagination-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 300px;
}

.table-pagination-wrapper .pagination-bottom {
  margin-top: auto;
  padding-bottom: 16px;
}

.list-query-panel {
  margin-top: -20px;
}
</style>

<style>
/* 打印设置弹窗：宽高尽量覆盖内容区域，但不遮挡顶部菜单和左侧菜单 */
/* 使用更具体的选择器覆盖 Element UI 的默认样式 */
.print-setting-page .print-setting-dialog.el-dialog,
.print-setting-dialog.el-dialog,
.print-setting-dialog .el-dialog {
  max-width: 100% !important;
  /* 弹窗宽度 = 总宽度 - 左侧菜单宽度，从菜单右侧紧贴开始 */
  width: calc(100% - 202px) !important;
  /* 顶部预留约 88px，高度撑满到底部，不留空隙 */
  height: calc(100vh - 88px) !important;
  max-height: calc(100vh - 88px) !important;
  margin-top: 88px !important;
  /* 紧贴左侧菜单（202px 宽） */
  margin-left: 202px !important;
  margin-right: 0 !important;
  /* 去掉 Element 默认的底部 50px 外边距，避免底部留白 */
  margin-bottom: 0 !important;
  left: 0 !important;
  transform: none !important;
}

.print-setting-dialog .el-dialog__body {
  height: calc(100vh - 88px - 54px - 40px);
  max-height: calc(100vh - 88px - 54px - 40px);
  overflow-y: auto;
  padding: 24px;
  padding-top: 0;
}

/* 隐藏弹窗内部右侧滚动条，只保留滚动功能 */
.print-setting-dialog .el-dialog__body::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.print-setting-dialog .el-dialog__body {
  scrollbar-width: none; /* Firefox */
}

.print-setting-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header-close {
  padding: 0 8px;
}

/* 参考科室申领弹窗的头部样式 */
.print-setting-page .print-setting-dialog .el-dialog__header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.print-setting-page .print-setting-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.print-setting-page .print-setting-dialog .el-dialog__headerbtn {
  top: 14px;
}
</style>
