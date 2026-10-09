<template>
  <div class="app-container list-page config-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form class="query-form" :model="queryParams" ref="queryForm" size="small" :inline="true">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.configName"
              placeholder="参数名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.configKey"
              placeholder="参数键名"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select v-model="queryParams.configType" placeholder="系统内置" clearable class="more-search-select-wrap apply-query-field">
              <el-option
                v-for="dict in dict.type.sys_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <span class="more-search-label">创建日期</span>
              <el-date-picker
                v-model="beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="开始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="结束日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="handleAdd" v-hasPermi="['system:config:add']">新增</el-button>
        <el-button type="warning" icon="el-icon-download" size="small" class="spd-btn" @click="handleExport" v-hasPermi="['system:config:export']">导出</el-button>
        <el-button type="info" icon="el-icon-refresh" size="small" class="spd-btn spd-btn--info" @click="handleRefreshCache" v-hasPermi="['system:config:remove']">刷新缓存</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table
      ref="applyMainTable"
      v-loading="loading"
      :data="configList"
      class="table-compact apply-main-table"
      row-key="configId"
      :row-class-name="applyMainRowClassName"
      :height="mainTableHeight"
      border
      stripe
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
      <el-table-column type="index" label="序号" align="center" width="70" :index="indexMethod" show-overflow-tooltip />
      <el-table-column label="参数主键" align="center" prop="configId" width="100" sortable="custom" show-overflow-tooltip />
      <el-table-column label="参数名称" align="center" prop="configName" min-width="160" sortable="custom" show-overflow-tooltip />
      <el-table-column label="参数键名" align="center" prop="configKey" min-width="180" show-overflow-tooltip />
      <el-table-column label="参数键值" align="center" prop="configValue" min-width="160" show-overflow-tooltip />
      <el-table-column label="系统内置" align="center" prop="configType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_yes_no" :value="scope.row.configType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="160" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="140">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:config:edit']"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              class="is-danger"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:config:remove']"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
      <div class="pagination-summary"></div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        :pager-count="7"
        @pagination="getList"
      />
    </div>
    </div>

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-select
            v-if="form.configKey === 'hc.login.defaultCustomerId'"
            v-model="form.configValue"
            placeholder="请选择耗材登录默认客户（组织机构）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in customerHcOptions"
              :key="item.customerId"
              :label="(item.customerName || '') + (item.customerCode ? '（' + item.customerCode + '）' : '')"
              :value="item.customerId"
            />
          </el-select>
          <el-input
            v-else
            v-model="form.configValue"
            :placeholder="form.configKey === 'sys.index.sidebarLogo' ? '请输入 1（默认）或 2（aisipute-wide2）' : '请输入参数键值'"
          />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache } from "@/api/system/config";
import { getCustomerOptions } from "@/api/login";

export default {
  name: "Config",
  dicts: ['sys_yes_no'],
  data() {
    return {
      /** 参数 hc.login.defaultCustomerId 下拉：耗材启用客户 */
      customerHcOptions: [],
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
      // 总条数
      total: 0,
      // 参数表格数据
      configList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      beginDate: undefined,
      endDate: undefined,
      mainTableHeight: 400,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        configName: undefined,
        configKey: undefined,
        configType: undefined,
        orderByColumn: undefined,
        isAsc: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        configName: [
          { required: true, message: "参数名称不能为空", trigger: "blur" }
        ],
        configKey: [
          { required: true, message: "参数键名不能为空", trigger: "blur" }
        ],
        configValue: [
          {
            validator: (rule, value, callback) => {
              if (this.form.configKey === "hc.login.defaultCustomerId") {
                callback();
                return;
              }
              if (this.form.configKey === "sys.index.sidebarLogo") {
                if (value !== "1" && value !== "2") {
                  callback(new Error("侧边栏Logo参数值只能为 1 或 2"));
                } else {
                  callback();
                }
                return;
              }
              if (value === undefined || value === null || String(value).trim() === "") {
                callback(new Error("参数键值不能为空"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.loadHcCustomerOptions();
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight();
      requestAnimationFrame(() => this.updateMainTableHeight());
      [50, 120, 300].forEach((ms) => setTimeout(() => this.updateMainTableHeight(), ms));
    });
    window.addEventListener("resize", this.updateMainTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateMainTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  methods: {
    applyMainRowClassName({ row }) {
      return this.ids.indexOf(row.configId) !== -1 ? "apply-row-selected" : "";
    },
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) {
        return;
      }
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) {
        return;
      }
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const height = Math.max(200, Math.floor(panelH - pagH));
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) {
          table.doLayout();
        }
      });
    },
    loadHcCustomerOptions() {
      getCustomerOptions("hc").then(res => {
        this.customerHcOptions = res.data || [];
      }).catch(() => {
        this.customerHcOptions = [];
      });
    },
    /** 查询参数列表 */
    getList() {
      this.loading = true;
      listConfig(this.addDateRange({ ...this.queryParams }, [this.beginDate, this.endDate])).then(response => {
          this.configList = response.rows;
          this.total = response.total;
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
        }
      );
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        configId: undefined,
        configName: undefined,
        configKey: undefined,
        configValue: undefined,
        configType: "Y",
        remark: undefined
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 表头排序 */
    handleSortChange({ prop, order }) {
      if (!order) {
        this.queryParams.orderByColumn = undefined;
        this.queryParams.isAsc = undefined;
      } else {
        this.queryParams.orderByColumn = prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.beginDate = undefined;
      this.endDate = undefined;
      this.resetForm("queryForm");
      this.queryParams.configName = undefined;
      this.queryParams.configKey = undefined;
      this.queryParams.configType = undefined;
      this.queryParams.orderByColumn = undefined;
      this.queryParams.isAsc = undefined;
      if (this.$refs.applyMainTable) {
        this.$refs.applyMainTable.clearSort();
      }
      this.handleQuery();
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加参数";
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.configId)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const configId = row.configId || this.ids
      getConfig(configId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改参数";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.configId != undefined) {
            updateConfig(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addConfig(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const configIds = row.configId || this.ids;
      this.$modal.confirm('是否确认删除参数编号为"' + configIds + '"的数据项？').then(function() {
          return delConfig(configIds);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/config/export', {
        ...this.addDateRange({ ...this.queryParams }, [this.beginDate, this.endDate])
      }, `config_${new Date().getTime()}.xlsx`)
    },
    /** 刷新缓存按钮操作 */
    handleRefreshCache() {
      refreshCache().then(() => {
        this.$modal.msgSuccess("刷新成功");
      });
    }
  }
};
</script>

<style scoped>
.app-container.config-page .list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 150px;
}
</style>
