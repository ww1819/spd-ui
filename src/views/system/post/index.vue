<template>
  <div class="app-container">
    <el-form class="query-form" :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item prop="postCode">
        <el-input
          v-model="queryParams.postCode"
          placeholder="工作组编码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item prop="postName">
        <el-input
          v-model="queryParams.postName"
          placeholder="工作组名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item prop="status">
        <el-select v-model="queryParams.status" placeholder="工作组状态" clearable>
          <el-option
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" @click="handleQuery">搜索</el-button>
        <el-button type="primary" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleAdd"
          v-hasPermi="['system:post:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:post:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:post:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleExport"
          v-hasPermi="['system:post:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="multiple"
          @click="handleSyncWarehouse"
          v-hasPermi="['system:post:edit', 'system:post:sync']"
        >同步仓库</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="multiple"
          @click="handleSyncDepartment"
          v-hasPermi="['system:post:edit', 'system:post:sync']"
        >同步科室</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="multiple"
          @click="handleSyncMenu"
          v-hasPermi="['system:post:edit', 'system:post:sync']"
        >同步菜单</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="postList" stripe @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" align="center" width="80" :index="indexMethod" />
      <el-table-column label="编码" align="center" prop="postCode" />
      <el-table-column label="工作组名称" align="center" prop="postName" />
      <el-table-column label="工作组排序" align="center" prop="postSort" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:post:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:post:remove']"
          >删除</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleAuth(scope.row)"
            v-hasPermi="['system:post:edit']"
          >授权</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改工作组对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="工作组名称" prop="postName">
          <el-input v-model="form.postName" placeholder="工作组名称" />
        </el-form-item>
        <el-form-item label="工作组编码" prop="postCode">
          <el-input v-model="form.postCode" placeholder="编码名称" />
        </el-form-item>
        <el-form-item label="工作组排序" prop="postSort">
          <el-input-number v-model="form.postSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="工作组状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 授权弹窗 -->
    <el-dialog :title="authTitle || '授权'" :visible.sync="authOpen" width="700px" append-to-body>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
      title="此处保存的是工作组（岗位）权限。菜单树左列为已有权限（锁定），右列为本次选择，父子不联动。用户实际权限以「用户管理」为准；可通过「同步菜单」将工作组权限同步给用户。"
    />
    <el-tabs type="card">
      <el-tab-pane label="菜单权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthMenuAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthMenuAll(false)">取消</el-button>
        </div>
        <menu-auth-dual-tree
          ref="menuAuthDualTree"
          v-model="authForm.menuIds"
          :data="menuOptions"
          node-key="id"
          :tree-props="defaultProps"
          :existing-menu-ids="authExistingMenuIds"
          max-height="300px"
        />
      </el-tab-pane>
      <el-tab-pane label="科室权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthDepartmentAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthDepartmentAll(false)">取消</el-button>
          <el-input
            v-model="departmentKeyword"
            size="mini"
            clearable
            placeholder="搜索科室"
            style="width: 180px; margin-left: 10px;"
          />
        </div>
        <div class="auth-checkbox-container">
          <el-checkbox-group v-model="authForm.departmentIds" class="auth-checkbox-group">
            <el-checkbox v-for="item in filteredDepartmentOptions"
                         :key="item.id"
                         :label="item.id"
                         class="auth-checkbox-item">{{item.name}}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-tab-pane>
      <el-tab-pane label="仓库权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthWarehouseAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthWarehouseAll(false)">取消</el-button>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          <el-checkbox-group v-model="authForm.warehouseIds">
            <el-checkbox v-for="item in userWarehouseOptions"
                         :key="item.id"
                         :label="item.id">{{item.name}}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-tab-pane>
      <el-tab-pane label="单位权限">
        <div style="max-height: 300px; overflow-y: auto;">
          <div style="color:#909399; padding: 20px; text-align: center;">暂无数据</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待办事项">
        <div style="max-height: 300px; overflow-y: auto;">
          <div style="color:#909399; padding: 20px; text-align: center;">暂无数据</div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="submitAuth">保 存</el-button>
      <el-button @click="authOpen = false">取 消</el-button>
    </span>
    </el-dialog>
  </div>
</template>

<script>
import { listPost, getPost, delPost, addPost, updatePost, roleMenuTreeselectPost, listPostUserIds, syncPostMenuToUsers, getPostMenuSyncStatus, syncPostDepartmentToUsers, getPostDepartmentSyncStatus, syncPostWarehouseToUsers, getPostWarehouseSyncStatus } from "@/api/system/post";
import { deptTreeSelect, getUser, updateUser } from "@/api/system/user";
import { getOptionselect as getWarehouseOptionselect } from "@/api/foundation/warehouse";
import { listdepartAll } from "@/api/foundation/depart";
import { getToken } from "@/utils/auth";
import MenuAuthDualTree from "@/components/MenuAuthDualTree";

export default {
  name: "Post",
  components: { MenuAuthDualTree },
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
      // 总条数
      total: 0,
      // 工作组表格数据
      postList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        postCode: undefined,
        postName: undefined,
        status: undefined
      },
      // 表单参数
      form: {},
      // 授权弹窗
      authOpen: false,
      authTitle: "",
      authForm: {
        postId: null,
        menuIds: [],
        departmentIds: [],
        warehouseIds: []
      },
      // 保存的工作组权限（用于同步）
      savedPostPermissions: {},
      authMenuCheckAll: false,
      authMenuIndeterminate: false,
      /** 打开授权时已有的菜单 ID（锁定展示） */
      authExistingMenuIds: [],
      // 菜单选项
      menuOptions: [],
      // 仓库选项
      userWarehouseOptions: [],
      // 科室选项
      userDepartmentOptions: [],
      // 科室搜索关键字
      departmentKeyword: "",
      defaultProps: {
        children: "children",
        label: "label",
        disabled: "disabled"
      },
      syncMenuPollingTimer: null,
      syncMenuPollingPostId: null,
      /** 非空时表示批量同步：对每个 postId 轮询状态 */
      syncMenuPollingPostIds: null,
      syncMenuPollingTries: 0,
      syncMenuPollingType: "",
      syncMenuPollingMode: "supplement",
      // 表单校验
      rules: {
        postName: [
          { required: true, message: "工作组名称不能为空", trigger: "blur" }
        ],
        postCode: [
          { required: true, message: "工作组编码不能为空", trigger: "blur" }
        ],
        postSort: [
          { required: true, message: "工作组排序不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  beforeDestroy() {
    this.stopSyncMenuPolling();
  },
  methods: {
    /** 查询工作组列表 */
    getList() {
      this.loading = true;
      listPost(this.queryParams).then(response => {
        this.postList = response.rows;
        this.total = response.total;
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
        postId: undefined,
        postCode: undefined,
        postName: undefined,
        postSort: 0,
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
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    // 序号计算方法
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.postId)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加工作组";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const postId = row.postId || this.ids
      getPost(postId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改工作组";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.postId != undefined) {
            updatePost(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPost(this.form).then(response => {
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
      const postIds = row.postId || this.ids;
      this.$modal.confirm('是否确认删除工作组编号为"' + postIds + '"的数据项？').then(() => {
        return delPost(postIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(error => {
        // 显示后端返回的错误信息
        const errorMsg = error?.msg || error?.message || "删除失败";
        this.$modal.msgError(errorMsg);
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/post/export', {
        ...this.queryParams
      }, `post_${new Date().getTime()}.xlsx`)
    },
    /** 同步仓库：支持多选工作组，对每个组分别提交任务 */
    handleSyncWarehouse() {
      const postIds = this.getSelectedPostIdsOrWarn();
      if (!postIds) return;
      Promise.all(postIds.map(pid => getPost(pid))).then(responses => {
        for (let i = 0; i < responses.length; i++) {
          const warehouseIds = responses[i].data.warehouseIds || [];
          if (!warehouseIds.length) {
            const name = responses[i].data.postName || postIds[i];
            this.$modal.msgError("工作组「" + name + "」没有仓库权限，请先进行授权");
            return;
          }
        }
        this.chooseSyncMode("warehouse").then((syncMode) => {
          return Promise.all(postIds.map(pid => syncPostWarehouseToUsers(pid, syncMode))).then(() => syncMode);
        }).then((syncMode) => {
          this.notifySyncSubmitted("warehouse", syncMode);
          this.startSyncMenuPolling(postIds, "warehouse", syncMode);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 同步科室：支持多选工作组 */
    handleSyncDepartment() {
      const postIds = this.getSelectedPostIdsOrWarn();
      if (!postIds) return;
      Promise.all(postIds.map(pid => getPost(pid))).then(responses => {
        for (let i = 0; i < responses.length; i++) {
          const departmentIds = responses[i].data.departmentIds || [];
          if (!departmentIds.length) {
            const name = responses[i].data.postName || postIds[i];
            this.$modal.msgError("工作组「" + name + "」没有科室权限，请先进行授权");
            return;
          }
        }
        this.chooseSyncMode("department").then((syncMode) => {
          return Promise.all(postIds.map(pid => syncPostDepartmentToUsers(pid, syncMode))).then(() => syncMode);
        }).then((syncMode) => {
          this.notifySyncSubmitted("department", syncMode);
          this.startSyncMenuPolling(postIds, "department", syncMode);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 同步菜单：支持多选工作组 */
    handleSyncMenu() {
      const postIds = this.getSelectedPostIdsOrWarn();
      if (!postIds) return;
      Promise.all(postIds.map(pid => getPost(pid))).then(responses => {
        for (let i = 0; i < responses.length; i++) {
          const menuIds = responses[i].data.menuIds || [];
          if (!menuIds.length) {
            const name = responses[i].data.postName || postIds[i];
            this.$modal.msgError("工作组「" + name + "」没有菜单权限，请先进行授权");
            return;
          }
        }
        this.chooseSyncMode("menu").then((syncMode) => {
          return Promise.all(postIds.map(pid => syncPostMenuToUsers(pid, syncMode))).then(() => syncMode);
        }).then((syncMode) => {
          this.notifySyncSubmitted("menu", syncMode);
          this.startSyncMenuPolling(postIds, "menu", syncMode);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    getSelectedPostIdsOrWarn() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先勾选至少一个工作组");
        return null;
      }
      return [...this.ids];
    },
    getSyncModeLabel(syncMode) {
      return syncMode === "copy" ? "复制" : "补全";
    },
    chooseSyncMode(type) {
      const label = this.getSyncTypeLabel(type);
      return this.$confirm(
        `请选择${label}同步方式：\n【复制工作组权限】用工作组权限覆盖用户当前${label}\n【补全权限】仅补充用户缺失的${label}`,
        `${label}同步方式`,
        {
          confirmButtonText: "复制工作组权限",
          cancelButtonText: "补全权限",
          distinguishCancelAndClose: true,
          type: "warning"
        }
      ).then(() => "copy").catch((action) => {
        if (action === "cancel") {
          return "supplement";
        }
        return Promise.reject(action);
      });
    },
    getSyncTypeLabel(type) {
      const labelMap = {
        menu: "菜单权限",
        department: "科室权限",
        warehouse: "仓库权限"
      };
      return labelMap[type] || "权限";
    },
    notifySyncSubmitted(type, syncMode) {
      const label = this.getSyncTypeLabel(type);
      const modeLabel = this.getSyncModeLabel(syncMode);
      this.$modal.msgSuccess(`${label}${modeLabel}任务已提交，正在后台处理中`);
    },
    startSyncMenuPolling(postIdsOrId, type, syncMode) {
      this.stopSyncMenuPolling();
      const ids = Array.isArray(postIdsOrId) ? postIdsOrId.filter(id => id != null) : [postIdsOrId];
      this.syncMenuPollingPostIds = ids.length ? ids : null;
      this.syncMenuPollingPostId = ids.length ? ids[0] : null;
      this.syncMenuPollingTries = 0;
      this.syncMenuPollingType = type;
      this.syncMenuPollingMode = syncMode || "supplement";
      this.syncMenuPollingTimer = setInterval(() => {
        this.pollSyncMenuStatus();
      }, 2000);
      this.pollSyncMenuStatus();
    },
    stopSyncMenuPolling() {
      if (this.syncMenuPollingTimer) {
        clearInterval(this.syncMenuPollingTimer);
      }
      this.syncMenuPollingTimer = null;
      this.syncMenuPollingPostId = null;
      this.syncMenuPollingPostIds = null;
      this.syncMenuPollingTries = 0;
      this.syncMenuPollingType = "";
      this.syncMenuPollingMode = "supplement";
    },
    pollSyncMenuStatus() {
      const ids = (this.syncMenuPollingPostIds && this.syncMenuPollingPostIds.length)
        ? this.syncMenuPollingPostIds
        : (this.syncMenuPollingPostId != null ? [this.syncMenuPollingPostId] : []);
      const syncType = this.syncMenuPollingType;
      const syncMode = this.syncMenuPollingMode;
      if (!ids.length) {
        this.stopSyncMenuPolling();
        return;
      }
      this.syncMenuPollingTries += 1;
      const statusApiMap = {
        menu: getPostMenuSyncStatus,
        department: getPostDepartmentSyncStatus,
        warehouse: getPostWarehouseSyncStatus
      };
      const statusApi = statusApiMap[syncType] || getPostMenuSyncStatus;
      const successText = this.getSyncTypeLabel(syncType);
      const modeText = this.getSyncModeLabel(syncMode);
      Promise.all(ids.map(postId => statusApi(postId).then(res => ({ postId, st: res && res.data ? res.data : {} })))).then(results => {
        const allTerminal = results.every(({ st }) => st && (st.status === "SUCCESS" || st.status === "FAILED"));
        const anyFailed = results.some(({ st }) => st && st.status === "FAILED");
        const totalAffected = results.reduce((s, { st }) => s + (st && st.affected ? Number(st.affected) : 0), 0);
        if (allTerminal) {
          if (anyFailed) {
            const msg = results.find(({ st }) => st && st.status === "FAILED");
            this.$modal.msgError((msg && msg.st && msg.st.message) || `${successText}同步失败`);
          } else {
            const n = ids.length;
            this.$modal.msgSuccess(n > 1
              ? `已为 ${n} 个工作组完成${successText}${modeText}同步，累计处理用户侧约 ${totalAffected} 条`
              : `${successText}${modeText}完成，处理 ${results[0].st.affected || 0} 条用户${successText}`);
          }
          this.stopSyncMenuPolling();
          return;
        }
        if (this.syncMenuPollingTries >= 30) {
          this.$modal.msgWarning(`${successText}同步仍在进行中，请稍后刷新查看结果`);
          this.stopSyncMenuPolling();
        }
      }).catch(() => {
        if (this.syncMenuPollingTries >= 30) {
          this.$modal.msgWarning(`${successText}状态查询超时，请稍后刷新查看结果`);
          this.stopSyncMenuPolling();
        }
      });
    },
    /** 获取指定菜单ID列表的所有父级目录ID */
    getParentMenuIds(menuIds, menuTree) {
      const parentIds = new Set();
      const menuIdSet = new Set(menuIds.map(id => Number(id)));
      
      // 递归查找父级
      const findParents = (tree, parents = []) => {
        tree.forEach(node => {
          const currentParents = [...parents];
          if (node.children && node.children.length > 0) {
            // 检查子节点中是否有目标菜单
            const hasTargetChild = this.hasTargetMenuInChildren(node, menuIdSet);
            if (hasTargetChild) {
              // 将当前节点和所有祖先节点加入父级列表
              parentIds.add(Number(node.id));
              currentParents.forEach(p => parentIds.add(Number(p)));
            }
            // 继续递归，将当前节点ID加入父级链
            findParents(node.children, [...currentParents, node.id]);
          }
        });
      };
      
      findParents(menuTree);
      // 移除已经在menuIds中的ID
      menuIds.forEach(id => parentIds.delete(Number(id)));
      return Array.from(parentIds);
    },
    /** 检查节点的子孙节点中是否包含目标菜单 */
    hasTargetMenuInChildren(node, menuIdSet) {
      if (menuIdSet.has(Number(node.id))) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        return node.children.some(child => this.hasTargetMenuInChildren(child, menuIdSet));
      }
      return false;
    },
    /**
     * 用户详情接口将 postIds、roleIds、科室/仓库/菜单、workGroupIds 等放在响应根级，与 data 并列（与用户管理 handleUpdate 一致）。
     * 同步时若仅用 data 内的字段，会得到 undefined 并误传空数组，从而清空 sys_user_post、角色及租户侧 sb_work_group_user。
     */
    pickUserAssociationsFromDetail(userResponse) {
      const d = userResponse && userResponse.data ? userResponse.data : {};
      const numArr = (a) => (Array.isArray(a) ? a.map(Number).filter(n => !isNaN(n)) : []);
      const postIdsSrc = userResponse.postIds != null ? userResponse.postIds : d.postIds;
      const roleIdsSrc = userResponse.roleIds != null ? userResponse.roleIds : d.roleIds;
      const whSrc = userResponse.warehouseIds != null ? userResponse.warehouseIds : d.warehouseIds;
      const deptSrc = userResponse.departmentIds != null ? userResponse.departmentIds : d.departmentIds;
      const menuSrc = userResponse.menuIds != null ? userResponse.menuIds : d.menuIds;
      const wgSrc = userResponse.workGroupIds != null ? userResponse.workGroupIds : d.workGroupIds;
      return {
        postIds: numArr(postIdsSrc),
        roleIds: numArr(roleIdsSrc),
        warehouseIds: numArr(whSrc),
        departmentIds: numArr(deptSrc),
        menuIds: Array.isArray(menuSrc) ? menuSrc.map(id => (id != null ? String(id) : '')).filter(s => s !== '') : [],
        workGroupIds: Array.isArray(wgSrc) ? wgSrc.map(id => String(id)).filter(s => s !== '') : []
      };
    },
    /** 仓库/科室：工作组相对用户的补集并入用户现有（去重，保留用户原有顺序） */
    mergeNumericIdsBySupplement(userIds, groupIds) {
      const u = (userIds || []).map(Number).filter(n => !isNaN(n));
      const seen = new Set(u);
      const add = [];
      for (const x of groupIds || []) {
        const n = Number(x);
        if (!isNaN(n) && !seen.has(n)) {
          seen.add(n);
          add.push(n);
        }
      }
      return u.concat(add);
    },
    /** 菜单：工作组相对用户的补集并入用户现有（字符串 ID，与耗材 sys_user_menu 一致） */
    mergeMenuIdsBySupplement(userMenuIds, groupMenuIds) {
      const norm = (id) => (id != null && String(id).trim() !== '' ? String(id) : null);
      const u = (userMenuIds || []).map(norm).filter(Boolean);
      const seen = new Set(u);
      const add = [];
      for (const g of groupMenuIds || []) {
        const s = norm(g);
        if (s && !seen.has(s)) {
          seen.add(s);
          add.push(s);
        }
      }
      return u.concat(add);
    },
    /** 获取工作组下的所有用户（与设备端一致：sys_user_post 关联，避免全量用户扫描） */
    getUsersByPostId(postId) {
      const postIdNum = Number(postId);
      return listPostUserIds(postIdNum).then(res => {
        const userIds = res.data || [];
        const idList = Array.isArray(userIds) ? userIds.map(Number).filter(id => !isNaN(id)) : [];
        if (idList.length === 0) {
          return Promise.resolve([]);
        }
        return Promise.all(idList.map(uid => getUser(uid))).then(responses => responses.filter(r => r != null));
      });
    },
    /** 将菜单权限同步到工作组下的所有用户 */
    syncMenuToUsers(postId, menuIds) {
      this.getUsersByPostId(postId).then(users => {
        if (!users || users.length === 0) {
          this.$modal.msgWarning("该工作组下没有用户");
          return Promise.resolve(0);
        }
        
        // 仅补充：工作组菜单（含父级）相对用户菜单的补集
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          const assoc = this.pickUserAssociationsFromDetail(userResponse);
          const mergedMenuIds = this.mergeMenuIdsBySupplement(assoc.menuIds, menuIds);
          const payload = {
            ...userData,
            userId: userData.userId,
            menuIds: mergedMenuIds,
            postIds: assoc.postIds,
            roleIds: assoc.roleIds,
            departmentIds: assoc.departmentIds,
            warehouseIds: assoc.warehouseIds,
            workGroupIds: assoc.workGroupIds
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`已为 ${userCount} 个用户补充菜单权限（保留用户原有菜单）`);
          this.getList();
        }
      }).catch(error => {
        console.error('同步菜单权限失败:', error);
        this.$modal.msgError("同步菜单权限失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 将仓库权限同步到工作组下的所有用户 */
    syncWarehouseToUsers(postId, warehouseIds) {
      this.getUsersByPostId(postId).then(users => {
        if (!users || users.length === 0) {
          this.$modal.msgWarning("该工作组下没有用户");
          return Promise.resolve(0);
        }
        
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          const assoc = this.pickUserAssociationsFromDetail(userResponse);
          const mergedWh = this.mergeNumericIdsBySupplement(assoc.warehouseIds, warehouseIds);
          const payload = {
            ...userData,
            userId: userData.userId,
            warehouseIds: mergedWh,
            postIds: assoc.postIds,
            roleIds: assoc.roleIds,
            menuIds: assoc.menuIds,
            departmentIds: assoc.departmentIds,
            workGroupIds: assoc.workGroupIds
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`已为 ${userCount} 个用户补充仓库权限（保留用户原有仓库）`);
          this.getList();
        }
      }).catch(error => {
        console.error('同步仓库权限失败:', error);
        this.$modal.msgError("同步仓库权限失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 将科室权限同步到工作组下的所有用户 */
    syncDepartmentToUsers(postId, departmentIds) {
      this.getUsersByPostId(postId).then(users => {
        if (!users || users.length === 0) {
          this.$modal.msgWarning("该工作组下没有用户");
          return Promise.resolve(0);
        }
        
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          const assoc = this.pickUserAssociationsFromDetail(userResponse);
          const mergedDept = this.mergeNumericIdsBySupplement(assoc.departmentIds, departmentIds);
          const payload = {
            ...userData,
            userId: userData.userId,
            departmentIds: mergedDept,
            postIds: assoc.postIds,
            roleIds: assoc.roleIds,
            menuIds: assoc.menuIds,
            warehouseIds: assoc.warehouseIds,
            workGroupIds: assoc.workGroupIds
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`已为 ${userCount} 个用户补充科室权限（保留用户原有科室）`);
          this.getList();
        }
      }).catch(error => {
        console.error('同步科室权限失败:', error);
        this.$modal.msgError("同步科室权限失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 授权弹窗 - 打开 */
    handleAuth(row) {
      this.authOpen = false;
      const postId = row.postId || row;
      const postName = row.postName || (typeof row === 'string' ? row : '');
      this.authTitle = `授权 - ${postName || postId}`;
      getPost(postId).then(response => {
        const post = response.data;
        console.log('打开授权弹窗 - 获取工作组信息:', post);
        
        // 从后端返回的权限字段加载权限数据
        const menuIds = post.menuIds || [];
        const departmentIds = post.departmentIds || [];
        const warehouseIds = post.warehouseIds || [];
        
        console.log('获取到的权限数据 - menuIds:', menuIds, 'departmentIds:', departmentIds, 'warehouseIds:', warehouseIds);
        
        // 初始化授权数据
        this.authForm = {
          postId: postId,
          menuIds: menuIds,
          departmentIds: departmentIds,
          warehouseIds: warehouseIds
        };
        this.authExistingMenuIds = Array.isArray(menuIds) ? menuIds.slice() : [];
        console.log('初始化授权数据 - authForm:', this.authForm);
        // 获取菜单树
        return this.getMenuTree();
      }).then(() => {
        // 获取科室和仓库选项
        // 获取当前登录用户ID（用于获取所有仓库和科室）
        const currentUserId = this.$store?.state?.user?.userId || 1; // 默认使用管理员ID
        return Promise.all([
          // 获取所有仓库
          getWarehouseOptionselect().then(response => {
            console.log('获取仓库列表 - response:', response);
            // 将仓库数据转换为 {id, name} 格式
            const warehouses = response.data || response || [];
            this.userWarehouseOptions = warehouses.map(item => ({
              id: item.id,
              name: item.name
            }));
            console.log('处理后的仓库列表:', this.userWarehouseOptions);
          }).catch(error => {
            console.error('获取仓库列表失败:', error);
            this.userWarehouseOptions = [];
          }),
          // 获取所有科室
          listdepartAll(currentUserId).then(response => {
            console.log('获取科室列表 - response:', response);
            // 将科室数据转换为 {id, name} 格式
            const departments = response || [];
            this.userDepartmentOptions = departments.map(item => ({
              id: item.id,
              name: item.name
            }));
            console.log('处理后的科室列表:', this.userDepartmentOptions);
          }).catch(error => {
            console.error('获取科室列表失败:', error);
            this.userDepartmentOptions = [];
          })
        ]);
      }).then(() => {
        // 确保弹窗打开后再设置菜单树选中状态
        this.authOpen = true;
        // 使用多个 nextTick 确保菜单树完全渲染
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.applyAuthMenuSelectionFromForm();
          });
        });
      }).catch(error => {
        console.error('打开授权弹窗失败:', error);
        this.$modal.msgError("加载授权数据失败");
      });
    },
    /** 获取菜单树：展示本客户 hc_customer_menu 已开通的全部功能；勾选来自 sys_post_menu（接口 checkedKeys） */
    getMenuTree() {
      const postId = this.authForm.postId;
      if (!postId) {
        this.menuOptions = [];
        return Promise.resolve();
      }
      return roleMenuTreeselectPost(postId).then(response => {
        this.menuOptions = this.normalizeAuthMenuTree(response.menus || []);
        const allowed = new Set((this.getCheckableMenuIds(this.menuOptions) || []).map(Number));
        if (response.checkedKeys != null) {
          const keys = response.checkedKeys.map(id => Number(id)).filter(id => !isNaN(id) && id > 0 && allowed.has(id));
          this.authForm.menuIds = keys;
          this.authExistingMenuIds = keys.slice();
        }
        return response;
      });
    },
    /** 获取所有菜单ID（递归） */
    getAllMenuIds(menuList) {
      let ids = [];
      menuList.forEach(menu => {
        ids.push(menu.id);
        if (menu.children && menu.children.length > 0) {
          ids = ids.concat(this.getAllMenuIds(menu.children));
        }
      });
      return ids;
    },
    /** 授权树：仅客户已开通、可勾选的菜单 ID */
    getCheckableMenuIds(menuList) {
      let ids = [];
      if (!menuList) return ids;
      menuList.forEach(menu => {
        if (menu.checkable !== false) {
          ids.push(menu.id);
        }
        if (menu.children && menu.children.length > 0) {
          ids = ids.concat(this.getCheckableMenuIds(menu.children));
        }
      });
      return ids;
    },
    /** 授权树：目录节点不可勾选 */
    normalizeAuthMenuTree(nodes) {
      if (!Array.isArray(nodes)) return [];
      return nodes.map(n => {
        const item = { ...n };
        if (item.checkable === false) {
          item.disabled = true;
        }
        if (item.children && item.children.length > 0) {
          item.children = this.normalizeAuthMenuTree(item.children);
        }
        return item;
      });
    },
    applyAuthMenuSelectionFromForm() {
      const allowed = new Set((this.getCheckableMenuIds(this.menuOptions) || []).map(Number));
      const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0 && allowed.has(id));
      if (this.$refs.menuAuthDualTree) {
        this.$refs.menuAuthDualTree.setSelectedIds(menuIds);
      }
      this.updateAuthMenuCheckState(menuIds, []);
    },
    /** 授权菜单全选/取消 */
    handleAuthMenuAll(val) {
      if (!this.$refs.menuAuthDualTree) return;
      if (val) {
        this.$refs.menuAuthDualTree.selectAllCheckable();
      } else {
        this.$refs.menuAuthDualTree.clearSelection();
      }
      this.updateAuthMenuCheckState(this.authForm.menuIds, []);
    },
    /** 更新授权菜单全选/半选状态 */
    updateAuthMenuCheckState(checkedKeysParam, halfCheckedKeysParam) {
      const checkedKeys = checkedKeysParam || (this.$refs.menuAuthDualTree ? this.$refs.menuAuthDualTree.getSelectedIds() : (this.authForm.menuIds || []));
      const halfCheckedKeys = halfCheckedKeysParam || [];
      const allMenuIds = this.getCheckableMenuIds(this.menuOptions);
      if (!checkedKeys || checkedKeys.length === 0) {
        this.authMenuCheckAll = false;
        this.authMenuIndeterminate = false;
      } else if (checkedKeys.length === allMenuIds.length) {
        this.authMenuCheckAll = true;
        this.authMenuIndeterminate = false;
      } else {
        this.authMenuCheckAll = false;
        this.authMenuIndeterminate = checkedKeys.length > 0 || halfCheckedKeys.length > 0;
      }
    },
    /** 授权科室权限全选/取消 */
    handleAuthDepartmentAll(val) {
      if (val) {
        this.authForm.departmentIds = this.userDepartmentOptions.map(item => item.id);
      } else {
        this.authForm.departmentIds = [];
      }
    },
    /** 授权仓库权限全选/取消 */
    handleAuthWarehouseAll(val) {
      if (val) {
        this.authForm.warehouseIds = this.userWarehouseOptions.map(item => item.id);
      } else {
        this.authForm.warehouseIds = [];
      }
    },
    /** 授权提交 */
    submitAuth() {
      const allowed = new Set((this.getCheckableMenuIds(this.menuOptions) || []).map(Number));
      // 确保 menuIds 是数字数组，且仅保留客户已开通可勾选节点
      const rawMenuIds = this.$refs.menuAuthDualTree
        ? this.$refs.menuAuthDualTree.getSelectedIds()
        : (this.authForm.menuIds || []);
      const menuIds = Array.isArray(rawMenuIds)
        ? rawMenuIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0 && allowed.has(id))
        : [];
      
      const departmentIds = Array.isArray(this.authForm.departmentIds)
        ? this.authForm.departmentIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
        : [];
      
      const warehouseIds = Array.isArray(this.authForm.warehouseIds)
        ? this.authForm.warehouseIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
        : [];
      
      // 保存工作组权限到本地状态（用于后续同步）
      this.savedPostPermissions[this.authForm.postId] = {
        menuIds: menuIds,
        departmentIds: departmentIds,
        warehouseIds: warehouseIds
      };
      
      // 先获取完整的工作组信息，然后更新权限字段
      getPost(this.authForm.postId).then(response => {
        const post = response.data;
        
        // 构建提交数据，保留原有字段，添加权限字段
        const payload = {
          postId: post.postId,
          postCode: post.postCode,  // 保留原有编码
          postName: post.postName,  // 保留原有名称
          postSort: post.postSort,  // 保留原有排序
          status: post.status,      // 保留原有状态
          menuIds: menuIds,         // 菜单权限
          departmentIds: departmentIds,  // 科室权限
          warehouseIds: warehouseIds       // 仓库权限
        };
        
        // 保存工作组授权
        console.log('保存工作组授权 - payload:', payload);
        return updatePost(payload);
      }).then(response => {
        console.log('保存工作组授权成功 - response:', response);
        // 刷新工作组列表，确保数据是最新的
        this.getList();
        this.$modal.msgSuccess("授权成功");
        // 不关闭弹窗，但需要重新加载权限数据以确认保存成功
        // 重新获取工作组信息以刷新权限数据
        return getPost(this.authForm.postId);
      }).then(response => {
        const post = response.data;
        console.log('重新获取工作组信息 - post:', post);
        // 更新本地保存的权限和授权表单
        if (post.menuIds || post.departmentIds || post.warehouseIds) {
          this.authForm.menuIds = post.menuIds || [];
          this.authForm.departmentIds = post.departmentIds || [];
          this.authForm.warehouseIds = post.warehouseIds || [];
          this.authExistingMenuIds = Array.isArray(post.menuIds) ? post.menuIds.slice() : [];
          this.$nextTick(() => this.applyAuthMenuSelectionFromForm());
        } else if (post.remark) {
          // 兼容旧数据：如果新字段为空，尝试从remark字段解析
          try {
            const savedPermissions = JSON.parse(post.remark);
            this.savedPostPermissions[this.authForm.postId] = savedPermissions;
            this.authForm.menuIds = savedPermissions.menuIds || [];
            this.authForm.departmentIds = savedPermissions.departmentIds || [];
            this.authForm.warehouseIds = savedPermissions.warehouseIds || [];
            this.authExistingMenuIds = Array.isArray(savedPermissions.menuIds) ? savedPermissions.menuIds.slice() : [];
            this.$nextTick(() => this.applyAuthMenuSelectionFromForm());
          } catch (e) {
            console.error('解析保存的权限失败:', e);
          }
        }
      }).catch(error => {
        console.error('授权保存失败:', error);
        this.$modal.msgError("授权保存失败：" + (error.msg || error.message || '未知错误'));
      });
    }
  },
  computed: {
    filteredDepartmentOptions() {
      const keyword = (this.departmentKeyword || "").trim();
      if (!keyword) {
        return this.userDepartmentOptions || [];
      }
      return (this.userDepartmentOptions || []).filter(item =>
        (item.name || "").includes(keyword)
      );
    }
  }
};
</script>

<style scoped>
/* 授权树：客户未开通的目录节点不显示勾选框 */
.auth-menu-tree ::v-deep .el-tree-node:has(.menu-folder-only) > .el-tree-node__content > .el-checkbox {
  display: none;
}
/* 授权复选框容器样式 */
.auth-checkbox-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background-color: #fff;
}

.auth-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.auth-checkbox-item {
  margin-right: 0 !important;
  min-width: 120px;
  font-size: 14px;
}

::v-deep .el-tree {
  background-color: #fff;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 10px;
}

::v-deep .el-tree-node__content {
  height: 32px;
  line-height: 32px;
}

::v-deep .el-tree-node__label {
  font-size: 14px;
}
</style>
