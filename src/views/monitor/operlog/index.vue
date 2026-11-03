<template>
  <div class="app-container list-page operlog-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.title"
              placeholder="系统模块"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.operName"
              placeholder="操作人员"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.businessType"
              placeholder="操作类型"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="dict in dict.type.sys_oper_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <el-select
              v-model="queryParams.status"
              placeholder="操作状态"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="dict in dict.type.sys_common_status"
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
                value-format="yyyy-MM-dd HH:mm:ss"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="['00:00:00', '23:59:59']"
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          size="small"
          icon="el-icon-delete"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['monitor:operlog:remove']"
        >删除</el-button>
        <el-button
          size="small"
          icon="el-icon-delete"
          class="spd-btn spd-btn--danger"
          @click="handleClean"
          v-hasPermi="['monitor:operlog:remove']"
        >清空</el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
          v-hasPermi="['monitor:operlog:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="tables"
        v-loading="loading"
        :data="list"
        class="table-compact apply-main-table"
        row-key="operId"
        :height="mainTableHeight"
        border
        stripe
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" type="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="日志编号" align="center" prop="operId" width="100" show-overflow-tooltip resizable />
        <el-table-column label="系统模块" align="center" prop="title" min-width="140" show-overflow-tooltip resizable />
        <el-table-column label="操作类型" align="center" prop="businessType" width="110" resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_oper_type" :value="scope.row.businessType"/>
          </template>
        </el-table-column>
        <el-table-column
          label="操作人员"
          align="center"
          prop="operName"
          width="110"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column label="操作地址" align="center" prop="operIp" width="130" show-overflow-tooltip resizable />
        <el-table-column label="操作地点" align="center" prop="operLocation" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="操作状态" align="center" prop="status" width="100" resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_common_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column
          label="操作日期"
          align="center"
          prop="operTime"
          width="170"
          resizable
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="消耗时间"
          align="center"
          prop="costTime"
          width="110"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template slot-scope="scope">
            <span>{{ scope.row.costTime }}毫秒</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="100"
          class-name="apply-action-col small-padding fixed-width"
          fixed="right"
        >
          <template slot-scope="scope">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              style="padding: 0 5px; margin: 0;"
              @click="handleView(scope.row, scope.index)"
              v-hasPermi="['monitor:operlog:query']"
            >详细</el-button>
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

    <OperlogDetailDialog v-if="open" />
  </div>
</template>

<script>
import { list, delOperlog, cleanOperlog } from "@/api/monitor/operlog";

export default {
  components: {
    OperlogDetailDialog: () => import('./components/OperlogDetailDialog')
  },
  name: "Operlog",
  dicts: ['sys_oper_type', 'sys_common_status'],
  data() {
    return {
      loading: true,
      ids: [],
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      list: [],
      open: false,
      dateRange: [],
      defaultSort: { prop: 'operTime', order: 'descending' },
      form: {},
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        operName: undefined,
        businessType: undefined,
        status: undefined
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
    getList() {
      this.loading = true;
      list(this.addDateRange({ ...this.queryParams }, this.dateRange)).then(response => {
        this.list = response.rows;
        this.total = response.total;
        this.loading = false;
        this.scheduleLayoutRefresh();
      }).catch(() => {
        this.loading = false;
      });
    },
    typeFormat(row, column) {
      return this.selectDictLabel(this.dict.type.sys_oper_type, row.businessType);
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.queryParams = {
        pageNum: 1,
        pageSize: this.queryParams.pageSize || 10,
        title: undefined,
        operName: undefined,
        businessType: undefined,
        status: undefined
      };
      this.resetForm("queryForm");
      if (this.$refs.tables && this.$refs.tables.sort) {
        this.$refs.tables.sort(this.defaultSort.prop, this.defaultSort.order);
      } else {
        this.handleQuery();
      }
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.operId);
      this.multiple = !selection.length;
    },
    handleSortChange(column) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    handleView(row) {
      this.open = true;
      this.form = row;
    },
    handleDelete(row) {
      const operIds = row.operId || this.ids;
      this.$modal.confirm('是否确认删除日志编号为"' + operIds + '"的数据项？').then(function() {
        return delOperlog(operIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleClean() {
      this.$modal.confirm('是否确认清空所有操作日志数据项？').then(function() {
        return cleanOperlog();
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("清空成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('monitor/operlog/export', {
        ...this.queryParams
      }, `operlog_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
