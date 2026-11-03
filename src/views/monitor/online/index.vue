<template>
  <div class="app-container list-page online-page">
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
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left" />
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="tables"
        v-loading="loading"
        :data="list.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
        class="table-compact apply-main-table"
        :height="mainTableHeight"
        border
        stripe
      >
        <el-table-column label="序号" type="index" align="center" width="60" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="会话编号" align="center" prop="tokenId" min-width="160" show-overflow-tooltip resizable />
        <el-table-column label="登录名称" align="center" prop="userName" min-width="110" show-overflow-tooltip resizable />
        <el-table-column label="部门名称" align="center" prop="deptName" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="主机" align="center" prop="ipaddr" width="130" show-overflow-tooltip resizable />
        <el-table-column label="登录地点" align="center" prop="loginLocation" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="浏览器" align="center" prop="browser" min-width="110" show-overflow-tooltip resizable />
        <el-table-column label="操作系统" align="center" prop="os" min-width="110" show-overflow-tooltip resizable />
        <el-table-column label="登录时间" align="center" prop="loginTime" width="170" resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
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
              style="padding: 0 5px; margin: 0;"
              @click="handleForceLogout(scope.row)"
              v-hasPermi="['monitor:online:forceLogout']"
            >强退</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
        <div class="pagination-summary" />
        <pagination
          :total="total"
          :page.sync="pageNum"
          :limit.sync="pageSize"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { list, forceLogout } from "@/api/monitor/online";

export default {
  name: "Online",
  data() {
    return {
      loading: true,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      list: [],
      pageNum: 1,
      pageSize: 10,
      queryParams: {
        ipaddr: undefined,
        userName: undefined
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
      list({ ...this.queryParams }).then(response => {
        this.list = response.rows;
        this.total = response.total;
        this.loading = false;
        this.scheduleLayoutRefresh();
      }).catch(() => {
        this.loading = false;
      });
    },
    handleQuery() {
      this.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams = {
        ipaddr: undefined,
        userName: undefined
      };
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleForceLogout(row) {
      this.$modal.confirm('是否确认强退名称为"' + row.userName + '"的用户？').then(function() {
        return forceLogout(row.tokenId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("强退成功");
      }).catch(() => {});
    }
  }
};
</script>
