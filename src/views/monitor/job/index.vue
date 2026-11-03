<template>
  <div class="app-container list-page job-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.jobName"
              placeholder="任务名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.jobGroup"
              placeholder="任务组名"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="dict in dict.type.sys_job_group"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <el-select
              v-model="queryParams.status"
              placeholder="任务状态"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="dict in dict.type.sys_job_status"
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
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button type="primary" size="small" icon="el-icon-plus" class="spd-btn spd-btn--primary" @click="handleAdd" v-hasPermi="['monitor:job:add']">新增</el-button>
        <el-button size="small" icon="el-icon-edit" class="spd-btn spd-btn--secondary" :disabled="single" @click="handleUpdate" v-hasPermi="['monitor:job:edit']">修改</el-button>
        <el-button size="small" icon="el-icon-delete" class="spd-btn spd-btn--danger" :disabled="multiple" @click="handleDelete" v-hasPermi="['monitor:job:remove']">删除</el-button>
        <el-button size="small" icon="el-icon-download" class="spd-btn spd-btn--secondary" @click="handleExport" v-hasPermi="['monitor:job:export']">导出</el-button>
        <el-button size="small" icon="el-icon-s-operation" class="spd-btn spd-btn--secondary" @click="handleJobLog" v-hasPermi="['monitor:job:query']">日志</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="tables"
        v-loading="loading"
        :data="jobList"
        class="table-compact apply-main-table"
        row-key="jobId"
        :height="mainTableHeight"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" type="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="任务编号" width="100" align="center" prop="jobId" show-overflow-tooltip resizable />
        <el-table-column label="任务名称" align="center" prop="jobName" min-width="140" show-overflow-tooltip resizable />
        <el-table-column label="任务组名" align="center" prop="jobGroup" width="110" resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_job_group" :value="scope.row.jobGroup"/>
          </template>
        </el-table-column>
        <el-table-column label="调用目标字符串" align="center" prop="invokeTarget" min-width="180" show-overflow-tooltip resizable />
        <el-table-column label="cron执行表达式" align="center" prop="cronExpression" min-width="160" show-overflow-tooltip resizable />
        <el-table-column label="状态" align="center" width="90" resizable>
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="180"
          class-name="apply-action-col small-padding fixed-width"
          fixed="right"
        >
          <template slot-scope="scope">
            <el-button
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0;"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['monitor:job:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              style="padding: 0 5px; margin: 0;"
              @click="handleDelete(scope.row)"
              v-hasPermi="['monitor:job:remove']"
            >删除</el-button>
            <el-dropdown size="small" @command="(command) => handleCommand(command, scope.row)" v-hasPermi="['monitor:job:changeStatus', 'monitor:job:query']">
              <el-button size="small" type="text" style="padding: 0 5px; margin: 0;">更多</el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="handleRun" v-hasPermi="['monitor:job:changeStatus']">执行一次</el-dropdown-item>
                <el-dropdown-item command="handleView" v-hasPermi="['monitor:job:query']">任务详细</el-dropdown-item>
                <el-dropdown-item command="handleJobLog" v-hasPermi="['monitor:job:query']">调度日志</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
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

    <JobEditDialog v-if="open" />
    <JobCronDialog v-if="openCron" />
    <JobViewDialog v-if="openView" />
  </div>
</template>

<script>
import { listJob, getJob, delJob, addJob, updateJob, runJob, changeJobStatus } from "@/api/monitor/job";

export default {
  components: {
    JobEditDialog: () => import('./components/JobEditDialog'),
    JobCronDialog: () => import('./components/JobCronDialog'),
    JobViewDialog: () => import('./components/JobViewDialog')
  },
  name: "Job",
  dicts: ['sys_job_group', 'sys_job_status'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      jobList: [],
      title: "",
      open: false,
      openView: false,
      openCron: false,
      expression: "",
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        jobName: undefined,
        jobGroup: undefined,
        status: undefined
      },
      form: {},
      rules: {
        jobName: [
          { required: true, message: "任务名称不能为空", trigger: "blur" }
        ],
        invokeTarget: [
          { required: true, message: "调用目标字符串不能为空", trigger: "blur" }
        ],
        cronExpression: [
          { required: true, message: "cron执行表达式不能为空", trigger: "blur" }
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
    getList() {
      this.loading = true;
      listJob({ ...this.queryParams }).then(response => {
        this.jobList = response.rows;
        this.total = response.total;
        this.loading = false;
        this.scheduleLayoutRefresh();
      }).catch(() => {
        this.loading = false;
      });
    },
    jobGroupFormat(row) {
      return this.selectDictLabel(this.dict.type.sys_job_group, row.jobGroup);
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        jobId: undefined,
        jobName: undefined,
        jobGroup: undefined,
        invokeTarget: undefined,
        cronExpression: undefined,
        misfirePolicy: 1,
        concurrent: 1,
        status: "0"
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: this.queryParams.pageSize || 10,
        jobName: undefined,
        jobGroup: undefined,
        status: undefined
      };
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.jobId);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
    },
    handleCommand(command, row) {
      switch (command) {
        case "handleRun":
          this.handleRun(row);
          break;
        case "handleView":
          this.handleView(row);
          break;
        case "handleJobLog":
          this.handleJobLog(row);
          break;
        default:
          break;
      }
    },
    handleStatusChange(row) {
      let text = row.status === "0" ? "启用" : "停用";
      this.$modal.confirm('确认要"' + text + '""' + row.jobName + '"任务吗？').then(function() {
        return changeJobStatus(row.jobId, row.status);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
      }).catch(function() {
        row.status = row.status === "0" ? "1" : "0";
      });
    },
    handleRun(row) {
      this.$modal.confirm('确认要立即执行一次"' + row.jobName + '"任务吗？').then(function() {
        return runJob(row.jobId, row.jobGroup);
      }).then(() => {
        this.$modal.msgSuccess("执行成功");
      }).catch(() => {});
    },
    handleView(row) {
      getJob(row.jobId).then(response => {
        this.form = response.data;
        this.openView = true;
      });
    },
    handleShowCron() {
      this.expression = this.form.cronExpression;
      this.openCron = true;
    },
    crontabFill(value) {
      this.form.cronExpression = value;
    },
    handleJobLog(row) {
      const jobId = (row && row.jobId) || 0;
      this.$router.push('/monitor/job-log/index/' + jobId);
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加任务";
    },
    handleUpdate(row) {
      this.reset();
      const jobId = row.jobId || this.ids;
      getJob(jobId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改任务";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.jobId != undefined) {
            updateJob(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addJob(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const jobIds = row.jobId || this.ids;
      this.$modal.confirm('是否确认删除定时任务编号为"' + jobIds + '"的数据项？').then(function() {
        return delJob(jobIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('monitor/job/export', {
        ...this.queryParams
      }, `job_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>
