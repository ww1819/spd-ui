<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="工作组编码" prop="postCode">
        <el-input
          v-model="queryParams.postCode"
          placeholder="请输入工作组编码"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="工作组名称" prop="postName">
        <el-input
          v-model="queryParams.postName"
          placeholder="请输入工作组名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
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
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['system:post:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="small"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:post:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="small"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:post:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['system:post:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh"
          size="small"
          @click="handleSyncWarehouse"
          v-hasPermi="['system:post:sync']"
        >同步仓库</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh"
          size="small"
          @click="handleSyncDepartment"
          v-hasPermi="['system:post:sync']"
        >同步科室</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh"
          size="small"
          @click="handleSyncMenu"
          v-hasPermi="['system:post:sync']"
        >同步菜单</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="postList" @selection-change="handleSelectionChange">
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
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:post:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:post:remove']"
          >删除</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-s-check"
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
          <el-input v-model="form.postName" placeholder="请输入工作组名称" />
        </el-form-item>
        <el-form-item label="工作组编码" prop="postCode">
          <el-input v-model="form.postCode" placeholder="请输入编码名称" />
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
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 授权弹窗 -->
    <el-dialog :title="authTitle || '授权'" :visible.sync="authOpen" width="700px" append-to-body>
    <el-tabs type="card">
      <el-tab-pane label="菜单权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthMenuAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthMenuAll(false)">取消</el-button>
        </div>
        <el-tree
          ref="authMenuTree"
          :data="menuOptions"
          :props="defaultProps"
          node-key="id"
          show-checkbox
          :check-strictly="false"
          :default-expand-all="false"
          :expand-on-click-node="false"
          :check-on-click-node="true"
          @check="handleAuthMenuCheck"
          style="max-height: 300px; overflow-y: auto;"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span>{{ node.label }}</span>
          </span>
        </el-tree>
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
import { listPost, getPost, delPost, addPost, updatePost } from "@/api/system/post";
import { treeselect as menuTreeselect } from "@/api/system/menu";
import { deptTreeSelect, listUserAll, getUser, updateUser } from "@/api/system/user";
import { getOptionselect as getWarehouseOptionselect } from "@/api/foundation/warehouse";
import { listdepartAll } from "@/api/foundation/depart";
import { getToken } from "@/utils/auth";

export default {
  name: "Post",
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
        label: "label"
      },
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
    /** 同步仓库按钮操作 */
    handleSyncWarehouse() {
      // 检查是否选中了工作组
      if (this.single || !this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择一个工作组");
        return;
      }
      
      const postId = this.ids[0]; // 获取选中的工作组ID
      
      // 从后端获取工作组的权限
      getPost(postId).then(response => {
        const post = response.data;
        const warehouseIds = post.warehouseIds || [];
        
        if (!warehouseIds || warehouseIds.length === 0) {
          this.$modal.msgError("该工作组没有仓库权限，请先进行授权");
          return;
        }
        
        this.$modal.confirm(`是否确认将工作组的仓库权限同步到该工作组下的所有用户？`).then(() => {
          this.syncWarehouseToUsers(postId, warehouseIds);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 同步科室按钮操作 */
    handleSyncDepartment() {
      // 检查是否选中了工作组
      if (this.single || !this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择一个工作组");
        return;
      }
      
      const postId = this.ids[0]; // 获取选中的工作组ID
      
      // 从后端获取工作组的权限
      getPost(postId).then(response => {
        const post = response.data;
        const departmentIds = post.departmentIds || [];
        
        if (!departmentIds || departmentIds.length === 0) {
          this.$modal.msgError("该工作组没有科室权限，请先进行授权");
          return;
        }
        
        this.$modal.confirm(`是否确认将工作组的科室权限同步到该工作组下的所有用户？`).then(() => {
          this.syncDepartmentToUsers(postId, departmentIds);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 同步菜单按钮操作 */
    handleSyncMenu() {
      // 检查是否选中了工作组
      if (this.single || !this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择一个工作组");
        return;
      }
      
      const postId = this.ids[0]; // 获取选中的工作组ID
      
      // 从后端获取工作组的权限
      getPost(postId).then(response => {
        const post = response.data;
        const menuIds = post.menuIds || [];
        
        if (!menuIds || menuIds.length === 0) {
          this.$modal.msgError("该工作组没有菜单权限，请先进行授权");
          return;
        }
        
        this.$modal.confirm(`是否确认将工作组的菜单权限同步到该工作组下的所有用户？`).then(() => {
          this.syncMenuToUsers(postId, menuIds);
        }).catch(() => {});
      }).catch(error => {
        this.$modal.msgError("获取工作组信息失败：" + (error.msg || error.message || '未知错误'));
      });
    },
    /** 获取工作组下的所有用户 */
    getUsersByPostId(postId) {
      // 确保 postId 是数字类型
      const postIdNum = Number(postId);
      console.log('查询工作组下的用户 - postId:', postId, '转换为数字:', postIdNum);
      
      // 查询该工作组下的所有用户
      return listUserAll({}).then(response => {
        const allUsers = response || [];
        console.log('查询到所有用户数量:', allUsers.length);
        
        // 获取该工作组下的用户（通过查询每个用户的postIds）
        const userPromises = allUsers.map(user => {
          return getUser(user.userId).then(userResponse => {
            // 检查用户是否属于该工作组
            const postIds = userResponse.postIds || [];
            // 将 postIds 转换为数字数组进行比较
            const postIdsNum = postIds.map(id => Number(id));
            console.log('用户', user.userId, '的postIds:', postIds, '转换为数字:', postIdsNum);
            
            if (postIdsNum.includes(postIdNum)) {
              console.log('用户', user.userId, '属于工作组', postIdNum);
              return userResponse;
            }
            return null;
          }).catch(error => {
            console.error('获取用户信息失败:', user.userId, error);
            return null;
          });
        });
        
        return Promise.all(userPromises).then(userResponses => {
          const validUsers = userResponses.filter(res => res !== null);
          console.log('找到属于工作组', postIdNum, '的用户数量:', validUsers.length);
          return validUsers;
        });
      });
    },
    /** 将菜单权限同步到工作组下的所有用户 */
    syncMenuToUsers(postId, menuIds) {
      this.getUsersByPostId(postId).then(users => {
        if (!users || users.length === 0) {
          this.$modal.msgWarning("该工作组下没有用户");
          return Promise.resolve(0);
        }
        
        // 批量更新用户的菜单权限
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          // 合并工作组的菜单权限到用户
          const payload = {
            ...userData,
            userId: userData.userId,
            menuIds: menuIds, // 使用工作组的菜单权限
            // 保留用户原有的其他权限和工作组关联
            postIds: userResponse.postIds || [], // 保留用户的工作组关联
            departmentIds: userResponse.departmentIds || [],
            warehouseIds: userResponse.warehouseIds || []
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`成功同步菜单权限到 ${userCount} 个用户`);
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
        
        // 批量更新用户的仓库权限
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          // 合并工作组的仓库权限到用户
          const payload = {
            ...userData,
            userId: userData.userId,
            warehouseIds: warehouseIds, // 使用工作组的仓库权限
            // 保留用户原有的其他权限和工作组关联
            postIds: userResponse.postIds || [], // 保留用户的工作组关联
            menuIds: userResponse.menuIds || [],
            departmentIds: userResponse.departmentIds || []
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`成功同步仓库权限到 ${userCount} 个用户`);
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
        
        // 批量更新用户的科室权限
        const updatePromises = users.map(userResponse => {
          const userData = userResponse.data;
          // 合并工作组的科室权限到用户
          const payload = {
            ...userData,
            userId: userData.userId,
            departmentIds: departmentIds, // 使用工作组的科室权限
            // 保留用户原有的其他权限和工作组关联
            postIds: userResponse.postIds || [], // 保留用户的工作组关联
            menuIds: userResponse.menuIds || [],
            warehouseIds: userResponse.warehouseIds || []
          };
          return updateUser(payload);
        });
        
        return Promise.all(updatePromises).then(() => {
          return users.length;
        });
      }).then(userCount => {
        if (userCount > 0) {
          this.$modal.msgSuccess(`成功同步科室权限到 ${userCount} 个用户`);
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
            if (this.$refs.authMenuTree) {
              const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
              console.log('设置菜单树选中状态 - menuIds:', menuIds);
              this.$refs.authMenuTree.setCheckedKeys(menuIds);
              this.updateAuthMenuCheckState();
              // 如果第一次设置失败，延迟再试一次
              setTimeout(() => {
                if (this.$refs.authMenuTree) {
                  const currentKeys = this.$refs.authMenuTree.getCheckedKeys();
                  if (!currentKeys || currentKeys.length === 0) {
                    console.log('菜单树选中状态未设置成功，重试设置');
                    this.$refs.authMenuTree.setCheckedKeys(menuIds);
                    this.updateAuthMenuCheckState();
                  }
                }
              }, 200);
            } else {
              console.warn('菜单树引用不存在');
            }
          });
        });
      }).catch(error => {
        console.error('打开授权弹窗失败:', error);
        this.$modal.msgError("加载授权数据失败");
      });
    },
    /** 获取菜单树 */
    getMenuTree() {
      return menuTreeselect().then(response => {
        this.menuOptions = response.data || [];
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
    /** 授权菜单全选/取消 */
    handleAuthMenuAll(val) {
      if (this.$refs.authMenuTree) {
        if (val) {
          const allMenuIds = this.getAllMenuIds(this.menuOptions);
          this.$refs.authMenuTree.setCheckedKeys(allMenuIds);
          this.authForm.menuIds = allMenuIds;
        } else {
          this.$refs.authMenuTree.setCheckedKeys([]);
          this.authForm.menuIds = [];
        }
        this.updateAuthMenuCheckState();
      }
    },
    /** 授权菜单选择变化 */
    handleAuthMenuCheck(data, checked) {
      const checkedKeys = this.$refs.authMenuTree.getCheckedKeys();
      const halfCheckedKeys = this.$refs.authMenuTree.getHalfCheckedKeys();
      this.authForm.menuIds = checkedKeys;
      this.updateAuthMenuCheckState(checkedKeys, halfCheckedKeys);
    },
    /** 更新授权菜单全选/半选状态 */
    updateAuthMenuCheckState(checkedKeysParam, halfCheckedKeysParam) {
      const checkedKeys = checkedKeysParam || (this.$refs.authMenuTree ? this.$refs.authMenuTree.getCheckedKeys() : []);
      const halfCheckedKeys = halfCheckedKeysParam || (this.$refs.authMenuTree ? this.$refs.authMenuTree.getHalfCheckedKeys() : []);
      const allMenuIds = this.getAllMenuIds(this.menuOptions);
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
      // 确保 menuIds 是数字数组
      const menuIds = Array.isArray(this.authForm.menuIds) 
        ? this.authForm.menuIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
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
          // 更新菜单树选中状态
          this.$nextTick(() => {
            if (this.$refs.authMenuTree) {
              const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
              this.$refs.authMenuTree.setCheckedKeys(menuIds);
              this.updateAuthMenuCheckState();
            }
          });
        } else if (post.remark) {
          // 兼容旧数据：如果新字段为空，尝试从remark字段解析
          try {
            const savedPermissions = JSON.parse(post.remark);
            this.savedPostPermissions[this.authForm.postId] = savedPermissions;
            this.authForm.menuIds = savedPermissions.menuIds || [];
            this.authForm.departmentIds = savedPermissions.departmentIds || [];
            this.authForm.warehouseIds = savedPermissions.warehouseIds || [];
            // 更新菜单树选中状态
            this.$nextTick(() => {
              if (this.$refs.authMenuTree) {
                const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
                console.log('更新菜单树选中状态 - menuIds:', menuIds);
                this.$refs.authMenuTree.setCheckedKeys(menuIds);
                this.updateAuthMenuCheckState();
              }
            });
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
