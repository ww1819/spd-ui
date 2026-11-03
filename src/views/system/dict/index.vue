<template>
  <div class="app-container list-page dict-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form class="query-form" :model="queryParams" ref="queryForm" size="small" :inline="true">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.dictName"
              placeholder="字典名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.dictType"
              placeholder="字典类型"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.status"
              placeholder="字典状态"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="dict in dict.type.sys_normal_disable"
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
              <el-date-picker
                v-model="dateRange"
                value-format="yyyy-MM-dd"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button type="primary" size="small" icon="el-icon-plus" class="spd-btn spd-btn--primary" @click="handleAdd" v-hasPermi="['system:dict:add']">新增</el-button>
        <el-button size="small" icon="el-icon-edit" class="spd-btn spd-btn--secondary" :disabled="single" @click="handleUpdate" v-hasPermi="['system:dict:edit']">修改</el-button>
        <el-button size="small" icon="el-icon-delete" class="spd-btn spd-btn--danger" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:dict:remove']">删除</el-button>
        <el-button size="small" icon="el-icon-download" class="spd-btn spd-btn--secondary" @click="handleExport" v-hasPermi="['system:dict:export']">导出</el-button>
        <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="handleRefreshCache" v-hasPermi="['system:dict:remove']">刷新缓存</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="tables"
        v-loading="loading"
        :data="typeList"
        class="table-compact apply-main-table"
        row-key="dictId"
        :height="mainTableHeight"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" type="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="字典编号" align="center" prop="dictId" width="100" show-overflow-tooltip resizable />
        <el-table-column label="字典名称" align="center" prop="dictName" min-width="140" show-overflow-tooltip resizable />
        <el-table-column label="字典类型" align="center" min-width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <router-link :to="'/system/dict-data/index/' + scope.row.dictId" class="link-type">
              <span>{{ scope.row.dictType }}</span>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100" resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip resizable />
        <el-table-column label="创建时间" align="center" prop="createTime" width="170" resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="140"
          class-name="apply-action-col small-padding fixed-width"
          fixed="right"
        >
          <template slot-scope="scope">
            <el-button
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0;"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:dict:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0;"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:dict:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
        <div class="pagination-summary" />
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

    <DictTypeEditDialog v-if="open" />
  </div>
</template>

<script>
import { listType, getType, delType, addType, updateType, refreshCache } from "@/api/system/dict/type";

export default {
  components: {
    DictTypeEditDialog: () => import('./components/DictTypeEditDialog')
  },
  name: "Dict",
  dicts: ['sys_normal_disable'],
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
      mainTableHeight: 400,
      // 总条数
      total: 0,
      // 字典表格数据
      typeList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        dictName: undefined,
        dictType: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        dictName: [
          { required: true, message: "字典名称不能为空", trigger: "blur" }
        ],
        dictType: [
          { required: true, message: "字典类型不能为空", trigger: "blur" }
        ]
      }
    };
  },
  watch: {
    showSearch() {
      this.scheduleLayoutRefresh();
    },
    total() {
      this.scheduleLayoutRefresh();
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    this.scheduleLayoutRefresh();
    window.addEventListener('resize', this.onWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
  },
  methods: {
    onWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          ;[50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.tables;
        if (table && table.doLayout) table.doLayout();
      });
    },
    /** 查询字典类型列表 */
    getList() {
      this.loading = true;
      listType(this.addDateRange({ ...this.queryParams }, this.dateRange)).then(response => {
        this.typeList = response.rows;
        this.total = response.total;
        this.loading = false;
        this.scheduleLayoutRefresh();
      }).catch(() => {
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        dictId: undefined,
        dictName: undefined,
        dictType: undefined,
        status: "0",
        remark: undefined
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.queryParams = {
        pageNum: 1,
        pageSize: this.queryParams.pageSize || 10,
        dictName: undefined,
        dictType: undefined,
        status: undefined
      };
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加字典类型";
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.dictId)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const dictId = row.dictId || this.ids
      getType(dictId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改字典类型";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.dictId != undefined) {
            updateType(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addType(this.form).then(response => {
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
      const dictIds = row.dictId || this.ids;
      this.$modal.confirm('是否确认删除字典编号为"' + dictIds + '"的数据项？').then(function() {
        return delType(dictIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/dict/type/export', {
        ...this.queryParams
      }, `type_${new Date().getTime()}.xlsx`)
    },
    /** 刷新缓存按钮操作 */
    handleRefreshCache() {
      refreshCache().then(() => {
        this.$modal.msgSuccess("刷新成功");
        this.$store.dispatch('dict/cleanDict');
      });
    }
  }
};
</script>
