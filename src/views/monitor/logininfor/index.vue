<template>
  <div class="app-container list-page logininfor-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.ipaddr"
              placeholder="登录地址"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.userName"
              placeholder="用户名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.status"
              placeholder="登录状态"
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
          v-hasPermi="['monitor:logininfor:remove']"
        >删除</el-button>
        <el-button
          size="small"
          icon="el-icon-delete"
          class="spd-btn spd-btn--danger"
          @click="handleClean"
          v-hasPermi="['monitor:logininfor:remove']"
        >清空</el-button>
        <el-button
          size="small"
          icon="el-icon-unlock"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUnlock"
          v-hasPermi="['monitor:logininfor:unlock']"
        >解锁</el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
          v-hasPermi="['monitor:logininfor:export']"
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
        row-key="infoId"
        :height="mainTableHeight"
        border
        stripe
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" type="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="访问编号" align="center" prop="infoId" width="100" show-overflow-tooltip resizable />
        <el-table-column
          label="用户名称"
          align="center"
          prop="userName"
          min-width="120"
          show-overflow-tooltip
          resizable
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column label="登录地址" align="center" prop="ipaddr" width="130" show-overflow-tooltip resizable />
        <el-table-column label="登录地点" align="center" prop="loginLocation" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="浏览器" align="center" prop="browser" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="操作系统" align="center" prop="os" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="登录状态" align="center" prop="status" width="100" resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_common_status" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column label="操作信息" align="center" prop="msg" min-width="140" show-overflow-tooltip resizable />
        <el-table-column
          label="登录日期"
          align="center"
          prop="loginTime"
          width="170"
          resizable
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
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
  </div>
</template>

<script>
import { list, delLogininfor, cleanLogininfor, unlockLogininfor } from "@/api/monitor/logininfor";

export default {
  name: "Logininfor",
  dicts: ['sys_common_status'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      selectName: "",
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      list: [],
      dateRange: [],
      defaultSort: { prop: 'loginTime', order: 'descending' },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        ipaddr: undefined,
        userName: undefined,
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.queryParams = {
        pageNum: 1,
        pageSize: this.queryParams.pageSize || 10,
        ipaddr: undefined,
        userName: undefined,
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
      this.ids = selection.map(item => item.infoId);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
      this.selectName = selection.map(item => item.userName);
    },
    handleSortChange(column) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    handleDelete(row) {
      const infoIds = row.infoId || this.ids;
      this.$modal.confirm('是否确认删除访问编号为"' + infoIds + '"的数据项？').then(function() {
        return delLogininfor(infoIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleClean() {
      this.$modal.confirm('是否确认清空所有登录日志数据项？').then(function() {
        return cleanLogininfor();
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("清空成功");
      }).catch(() => {});
    },
    handleUnlock() {
      const username = this.selectName;
      this.$modal.confirm('是否确认解锁用户"' + username + '"数据项?').then(function() {
        return unlockLogininfor(username);
      }).then(() => {
        this.$modal.msgSuccess("用户" + username + "解锁成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('monitor/logininfor/export', {
        ...this.queryParams
      }, `logininfor_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
