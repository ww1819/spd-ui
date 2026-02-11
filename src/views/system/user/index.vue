<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!--工作组数据-->
      <el-col :span="5" :xs="24">
        <div class="dept-panel">
          <div class="dept-panel-header" v-if="hospitalName">
            {{ hospitalName }}
          </div>
          <div class="dept-panel-content">
            <div class="workgroup-list-wrapper">
              <el-table :data="workgroupList" 
                        :highlight-current-row="true"
                        @row-click="handleWorkgroupRowClick"
                        :row-class-name="getWorkgroupRowClassName"
                        style="width: 100%;"
                        :show-header="true"
                        height="calc(100vh - 220px)"
                        border>
                <el-table-column label="工作组" align="center" prop="postName" show-overflow-tooltip>
                  <template slot="header">
                    <span style="cursor: pointer; font-weight: 700;" @click="handleWorkgroupHeaderClick">工作组</span>
                  </template>
                  <template slot-scope="scope">
                    <span>{{ scope.row.postName }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="workgroupList.length === 0" class="warehouse-empty">
                暂无工作组数据
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <!--用户数据-->
      <el-col :span="19" :xs="24">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form-card">
          <el-row>
            <el-col :span="24">
              <el-form-item label="用户账户" prop="userName" class="query-item-inline">
                <el-input
                  v-model="queryParams.userName"
                  placeholder="请输入用户账户"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="手机号码" prop="phonenumber" class="query-item-inline">
                <el-input
                  v-model="queryParams.phonenumber"
                  placeholder="请输入手机号码"
                  clearable
                  style="width: 180px"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="状态" prop="status" class="query-item-inline">
                <el-select
                  v-model="queryParams.status"
                  placeholder="用户状态"
                  clearable
                  style="width: 180px"
                >
                  <el-option
                    v-for="dict in dict.type.sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="创建时间" class="query-item-inline">
                <el-date-picker
                  v-model="dateRange"
                  style="width: 240px"
                  value-format="yyyy-MM-dd"
                  type="daterange"
                  range-separator="-"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="24">
              <el-form-item class="query-item-inline">
                <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd" v-hasPermi="['system:user:add']">新增</el-button>
                <el-button type="success" icon="el-icon-edit" size="small" :disabled="single" @click="handleUpdate" v-hasPermi="['system:user:edit']" style="margin-left: 10px;">修改</el-button>
                <el-button type="danger" icon="el-icon-delete" size="small" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:user:remove']" style="margin-left: 10px;">删除</el-button>
                <el-button type="primary" icon="el-icon-refresh" size="small" :disabled="multiple" @click="handleUpdateReferred" v-hasPermi="['system:user:updateReferred']" style="margin-left: 10px;">更新简码</el-button>
                <el-button type="info" icon="el-icon-upload2" size="small" @click="handleImport" v-hasPermi="['system:user:import']" style="margin-left: 10px;">导入</el-button>
                <el-button type="warning" icon="el-icon-download" size="small" @click="handleExport" v-hasPermi="['system:user:export']" style="margin-left: 10px;">导出</el-button>
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery" style="margin-left: 10px;">搜索</el-button>
                <el-button icon="el-icon-refresh" size="small" @click="resetQuery" style="margin-left: 10px;">重置</el-button>
                <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns" style="margin-left: 10px;"></right-toolbar>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div class="table-wrapper">
          <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange" height="24vh" border>
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column type="index" label="序号" align="center" width="80" v-if="columns[0].visible" :index="indexMethod" />
          <el-table-column label="用户账户" align="center" key="userName" prop="userName" v-if="columns[1].visible" :show-overflow-tooltip="true" />
          <el-table-column label="用户姓名" align="center" key="nickName" prop="nickName" v-if="columns[2].visible" :show-overflow-tooltip="true" />
          <el-table-column label="工作组" align="center" key="deptName" prop="postName" v-if="columns[3].visible" :show-overflow-tooltip="true" />
          <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" v-if="columns[4].visible" width="120" />
          <el-table-column label="状态" align="center" key="status" v-if="columns[5].visible">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.status"
                active-value="0"
                inactive-value="1"
                @change="handleStatusChange(scope.row)"
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns[6].visible" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            align="center"
            width="200"
            class-name="small-padding fixed-width"
            fixed="right"
          >
            <template slot-scope="scope" v-if="scope.row.userId !== 1">
              <span style="white-space: nowrap;">
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:user:edit']"
                  v-if="false"
                >修改</el-button>
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['system:user:remove']"
                  v-if="false"
                >删除</el-button>
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-s-check"
                  @click="handleAuth(scope.row)"
                  v-hasPermi="['system:user:edit']"
                >授权</el-button>
              </span>
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
        </div>
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" size="small" class="modal-form-compact">
              <el-row>
                <el-col :span="4">
                  <el-form-item label="机构单位">
                    <el-input v-model="organizationUnit" placeholder="机构单位" disabled style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="角色">
                    <el-select 
                      v-model="form.roleIds" 
                      multiple 
                      placeholder="请选择角色" 
                      style="width: 100%;" 
                      :disabled="form.userId == undefined"
                      :allow-create="false"
                      @change="handleRoleChange"
                    >
                      <el-option
                        v-for="item in roleOptions"
                        :key="item.roleId"
                        :label="item.roleName"
                        :value="item.roleId"
                        :disabled="item.status == 1"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="用户性别">
                    <el-select v-model="form.sex" placeholder="请选择性别" style="width: 100%;">
                      <el-option
                        v-for="dict in dict.type.sys_user_sex"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="用户账户" prop="userName">
                    <el-input v-model="form.userName" placeholder="请输入用户账户" maxlength="30" :disabled="form.userId != undefined" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="工作组">
                    <el-select v-model="form.deptId" placeholder="请选择工作组" clearable style="width: 100%;">
                      <el-option
                        v-for="item in postOptions"
                        :key="item.postId"
                        :label="item.postName"
                        :value="item.postId"
                        :disabled="item.status == 1"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="用户密码" prop="password" v-if="form.userId == undefined">
                    <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password/>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="用户姓名" prop="nickName">
                    <el-input v-model="form.nickName" placeholder="请输入用户姓名" maxlength="30" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="手机号码" prop="phonenumber">
                    <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="状态">
                    <el-radio-group v-model="form.status">
                      <el-radio
                        v-for="dict in dict.type.sys_normal_disable"
                        :key="dict.value"
                        :label="dict.value"
                      >{{dict.label}}</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row></el-row>
              <el-row></el-row>

              <el-row v-if="false">
                <el-col :span="24">
                  <el-form-item label="仓库权限">
                    <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
                    <el-checkbox-group v-model="form.warehouseIds">
                      <el-checkbox v-for="item in userWarehouseOptions"
                                   :key="item.id"
                                   :label="item.id">{{item.name}}
                      </el-checkbox>
                    </el-checkbox-group>

                  </el-form-item>
                </el-col>
              </el-row>

              <el-row v-if="false">
                <el-col :span="24">
                  <el-form-item label="科室权限">
                    <el-checkbox :indeterminate="departmentIndeterminate" v-model="materialCheckAll" @change="handleCheckDepartmentAllChange">全选</el-checkbox>
                    <el-checkbox-group v-model="form.departmentIds">
                      <el-checkbox v-for="item in userDepartmentOptions"
                                   :key="item.id"
                                   :label="item.id">{{item.name}}
                      </el-checkbox>
                    </el-checkbox-group>

                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="false">
                <el-col :span="24">
                  <el-form-item label="授权菜单">
                    <el-checkbox :indeterminate="menuIndeterminate" v-model="menuCheckAll" @change="handleCheckMenuAllChange">全选</el-checkbox>
                    <el-tree
                      ref="menuTree"
                      :data="menuOptions"
                      :props="defaultProps"
                      node-key="id"
                      show-checkbox
                      :check-strictly="false"
                      :default-expand-all="false"
                      :expand-on-click-node="false"
                      :check-on-click-node="true"
                      @check="handleMenuCheck"
                      style="margin-top: 10px; max-height: 300px; overflow-y: auto;"
                    >
                      <span class="custom-tree-node" slot-scope="{ node, data }">
                        <span>{{ node.label }}</span>
                      </span>
                    </el-tree>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="false">
                <el-col :span="24">
                  <el-form-item label="授权菜单">
                    <el-checkbox :indeterminate="menuIndeterminate" v-model="menuCheckAll" @change="handleCheckMenuAllChange">全选</el-checkbox>
                    <el-tree
                      ref="menuTree"
                      :data="menuOptions"
                      :props="defaultProps"
                      node-key="id"
                      show-checkbox
                      :check-strictly="false"
                      :default-expand-all="false"
                      :expand-on-click-node="false"
                      :check-on-click-node="true"
                      @check="handleMenuCheck"
                      style="margin-top: 10px; max-height: 300px; overflow-y: auto;"
                    >
                      <span class="custom-tree-node" slot-scope="{ node, data }">
                        <span>{{ node.label }}</span>
                      </span>
                    </el-tree>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
            <div class="modal-footer">
              <el-button type="primary" @click="submitForm">确 定</el-button>
              <el-button @click="cancel">取 消</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 用户导入对话框 -->
    <el-dialog :title="upload.title" :visible.sync="upload.open" width="400px" append-to-body>
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的用户数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
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
import { listUser, getUser, delUser, addUser, updateUser, resetUserPwd, changeUserStatus, deptTreeSelect, updateUserReferred } from "@/api/system/user";
import { workgroupTreeSelect } from "@/api/system/workgroup";
import { listPost } from "@/api/system/post";
import { getConfigKey, listConfig } from "@/api/system/config";
import { treeselect as menuTreeselect } from "@/api/system/menu";
import { getToken } from "@/utils/auth";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "User",
  dicts: ['sys_normal_disable', 'sys_user_sex','warehouse_role'],
  components: { Treeselect },
  computed: {
    /** 科室筛选 */
    filteredDepartmentOptions() {
      const keyword = (this.departmentKeyword || "").trim();
      if (!keyword) {
        return this.userDepartmentOptions || [];
      }
      return (this.userDepartmentOptions || []).filter(item =>
        (item.name || "").includes(keyword)
      );
    },
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      checkAll: false,
      materialCheckAll: false,
      isIndeterminate: true,
      departmentIndeterminate: true,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 用户表格数据
      userList: null,
      // 弹出层标题
      title: "",
      // 部门树选项
      deptOptions: undefined,
      // 工作组树选项
      workgroupOptions: undefined,
      // 工作组列表
      workgroupList: [],
      // 当前选中的工作组ID
      currentWorkgroupId: undefined,
      // 是否显示弹出层
      open: false,
      // 部门名称
      deptName: undefined,
      // 默认密码
      initPassword: undefined,
      // 医院名称
      hospitalName: undefined,
      // 机构单位
      organizationUnit: undefined,
      // 日期范围
      dateRange: [],
      // 岗位选项
      postOptions: [],
      // 角色选项
      roleOptions: [],
      // 仓库选项
      userWarehouseOptions: [],
      // 耗材选项
      userDepartmentOptions: [],
      // 科室搜索关键字
      departmentKeyword: "",
      // 菜单选项
      menuOptions: [],
      // 菜单全选
      menuCheckAll: false,
      // 菜单半选状态
      menuIndeterminate: false,
      // 授权弹窗
      authOpen: false,
      authTitle: "",
      authForm: {
        userId: null,
        menuIds: [],
        departmentIds: [],
        warehouseIds: []
      },
      authMenuCheckAll: false,
      authMenuIndeterminate: false,
      // 表单参数
      form: {},
      defaultProps: {
        children: "children",
        label: "label"
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        status: undefined,
        deptId: undefined
      },
      // 列信息
      columns: [
        { key: 0, label: `序号`, visible: true },
        { key: 1, label: `用户账户`, visible: true },
        { key: 2, label: `用户姓名`, visible: true },
        { key: 3, label: `工作组`, visible: true },
        { key: 4, label: `手机号码`, visible: true },
        { key: 5, label: `状态`, visible: true },
        { key: 6, label: `创建时间`, visible: true }
      ],
      // 表单校验
      rules: {
        userName: [
          { required: true, message: "用户账户不能为空", trigger: "blur" },
          { min: 2, max: 20, message: '用户账户长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: "用户姓名不能为空", trigger: "blur" }
        ],
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        phonenumber: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      },
      // 用户导入参数
      upload: {
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/system/user/importData"
      },
    };
  },
  watch: {
  },
  created() {
    this.getList();
    this.getWorkgroupTree();
    this.getWorkgroupList();
    this.getConfigKey("sys.user.initPassword").then(response => {
      this.initPassword = response.msg;
    });
    this.getConfigKey("sys.hospital.name").then(response => {
      this.hospitalName = response.msg;
    });
    // 获取参数设置第七条参数的值
    this.getOrganizationUnit();

  },
  methods: {
    /** 查询用户列表 */
    getList() {
      this.loading = true;
      listUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.userList = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 仓库全选 */
    handleCheckAllChange(val) {
      let checkedWarehouseIds = [];
      for(let item of this.userWarehouseOptions){
        checkedWarehouseIds.push(item.id)
      }
      this.form.warehouseIds = val ? checkedWarehouseIds : [];
      this.isIndeterminate = false;
    },
    /** 耗材全选 */
    handleCheckDepartmentAllChange(val) {
      let checkeddepartmentIds = [];
      for(let item of this.userDepartmentOptions){
        checkeddepartmentIds.push(item.id)
      }
      this.form.departmentIds = val ? checkeddepartmentIds : [];
      this.departmentIndeterminate = false;
    },
    /** 获取菜单树 */
    getMenuTree() {
      return menuTreeselect().then(response => {
        this.menuOptions = response.data || [];
        return response;
      });
    },
    /** 菜单全选 */
    handleCheckMenuAllChange(val) {
      if (this.$refs.menuTree) {
        if (val) {
          // 获取所有菜单ID
          const allMenuIds = this.getAllMenuIds(this.menuOptions);
          this.$refs.menuTree.setCheckedKeys(allMenuIds);
          this.form.menuIds = allMenuIds;
        } else {
          this.$refs.menuTree.setCheckedKeys([]);
          this.form.menuIds = [];
        }
        this.menuIndeterminate = false;
      }
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
    /** 获取所有选中的菜单ID（包括半选中的父节点） */
    getAuthMenuAllCheckedKeys() {
      if (!this.$refs.authMenuTree) {
        return [];
      }
      // 目前被选中的菜单节点
      let checkedKeys = this.$refs.authMenuTree.getCheckedKeys() || [];
      // 半选中的菜单节点（父节点）
      let halfCheckedKeys = this.$refs.authMenuTree.getHalfCheckedKeys() || [];
      // 合并选中的和半选中的节点
      let allKeys = [...checkedKeys, ...halfCheckedKeys];
      // 去重
      return [...new Set(allKeys)];
    },
    /** 菜单选择变化 */
    handleMenuCheck(data, checked) {
      const checkedKeys = this.$refs.menuTree.getCheckedKeys();
      const halfCheckedKeys = this.$refs.menuTree.getHalfCheckedKeys();
      this.form.menuIds = checkedKeys;
      
      // 更新全选和半选状态
      const allMenuIds = this.getAllMenuIds(this.menuOptions);
      if (checkedKeys.length === 0) {
        this.menuCheckAll = false;
        this.menuIndeterminate = false;
      } else if (checkedKeys.length === allMenuIds.length) {
        this.menuCheckAll = true;
        this.menuIndeterminate = false;
      } else {
        this.menuCheckAll = false;
        this.menuIndeterminate = checkedKeys.length > 0 || halfCheckedKeys.length > 0;
      }
    },
    /** 授权弹窗 - 打开 */
    handleAuth(row) {
      this.authOpen = false;
      const userId = row.userId || row;
      const userName = row.userName || (typeof row === 'string' ? row : '');
      this.authTitle = `授权 - ${userName || userId}`;
      getUser(userId).then(response => {
        // 载入基础数据
        this.postOptions = response.posts;
        this.roleOptions = response.roles;
        this.userWarehouseOptions = response.warehouses;
        this.userDepartmentOptions = response.departments;
        // 载入授权数据
        const menuIds = response.menuIds || [];
        console.log('获取到的菜单权限:', menuIds);
        this.authForm = {
          userId: response.data.userId,
          menuIds: menuIds,
          departmentIds: response.departmentIds || [],
          warehouseIds: response.warehouseIds || []
        };
        return this.getMenuTree();
      }).then(() => {
        this.$nextTick(() => {
          if (this.$refs.authMenuTree) {
            // 确保 menuIds 是数字数组
            const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
            console.log('设置菜单树选中状态 - menuIds:', menuIds);
            this.$refs.authMenuTree.setCheckedKeys(menuIds);
            this.updateAuthMenuCheckState();
          }
        });
        // 确保弹窗打开后再设置一次（有时候需要延迟）
        setTimeout(() => {
          if (this.$refs.authMenuTree && this.authForm.menuIds && this.authForm.menuIds.length > 0) {
            const menuIds = (this.authForm.menuIds || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
            console.log('延迟设置菜单树选中状态 - menuIds:', menuIds);
            this.$refs.authMenuTree.setCheckedKeys(menuIds);
            this.updateAuthMenuCheckState();
          }
        }, 100);
        this.authOpen = true;
      });
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
      // 获取所有选中的菜单ID（包括半选中的父节点）
      const allMenuIds = this.getAuthMenuAllCheckedKeys();
      this.authForm.menuIds = allMenuIds;
      const checkedKeys = this.$refs.authMenuTree.getCheckedKeys();
      const halfCheckedKeys = this.$refs.authMenuTree.getHalfCheckedKeys();
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
        // 全选：将所有科室ID添加到数组
        this.authForm.departmentIds = this.userDepartmentOptions.map(item => item.id);
      } else {
        // 取消：清空数组
        this.authForm.departmentIds = [];
      }
    },
    /** 授权仓库权限全选/取消 */
    handleAuthWarehouseAll(val) {
      if (val) {
        // 全选：将所有仓库ID添加到数组
        this.authForm.warehouseIds = this.userWarehouseOptions.map(item => item.id);
      } else {
        // 取消：清空数组
        this.authForm.warehouseIds = [];
      }
    },
    /** 授权提交 */
    submitAuth() {
      // 从菜单树组件获取最新的选中菜单ID（包括半选中的父节点）
      let menuIds = [];
      if (this.$refs.authMenuTree) {
        menuIds = this.getAuthMenuAllCheckedKeys();
        console.log('从菜单树获取的 menuIds（包括半选中节点）:', menuIds);
      } else {
        // 如果菜单树组件不存在，使用 authForm 中的 menuIds
        menuIds = Array.isArray(this.authForm.menuIds) ? this.authForm.menuIds : [];
        console.log('从 authForm 获取的 menuIds:', menuIds);
      }
      
      console.log('开始提交授权 - 当前 menuIds:', menuIds);
      
      // 先获取完整的用户信息，然后合并权限数据
      getUser(this.authForm.userId).then(response => {
        const userData = response.data;
        // 确保 menuIds 是数字数组
        const finalMenuIds = menuIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
        console.log('处理后的 menuIds:', finalMenuIds);
        console.log('userData 中的 menuIds:', userData.menuIds);
        
        if (finalMenuIds.length === 0) {
          this.$modal.msgWarning("请至少选择一个菜单权限");
          return Promise.reject(new Error("菜单权限不能为空"));
        }
        
        // 合并权限数据到用户对象，确保 menuIds 不被覆盖
        const payload = {
          ...userData,
          userId: this.authForm.userId,
          menuIds: finalMenuIds, // 明确设置 menuIds，确保不被 userData 中的值覆盖
          departmentIds: this.authForm.departmentIds || [],
          warehouseIds: this.authForm.warehouseIds || []
        };
        // 再次确认 menuIds 没有被覆盖
        if (payload.menuIds !== finalMenuIds) {
          console.warn('警告：menuIds 被覆盖！原始值:', finalMenuIds, '当前值:', payload.menuIds);
          payload.menuIds = finalMenuIds;
        }
        console.log('提交授权数据 - userId:', payload.userId, 'menuIds:', payload.menuIds, 'menuIds类型:', typeof payload.menuIds, '是数组:', Array.isArray(payload.menuIds));
        console.log('完整 payload:', JSON.stringify(payload, null, 2));
        return updateUser(payload);
      }).then(response => {
        console.log('保存授权响应:', response);
        this.$modal.msgSuccess("授权成功");
        // 不关闭弹窗，刷新授权数据
        const userId = this.authForm.userId;
        // 重新获取用户信息以刷新菜单权限
        return getUser(userId);
      }).then(response => {
        const menuIds = response.menuIds || [];
        console.log('保存后重新获取的菜单权限:', menuIds, '完整响应:', response);
        this.authForm.menuIds = menuIds;
        if (this.$refs.authMenuTree) {
          // 设置选中状态时，需要同时设置选中的和半选中的节点
          this.$refs.authMenuTree.setCheckedKeys(menuIds);
          this.updateAuthMenuCheckState();
        }
      }).catch(error => {
        console.error('授权保存失败 - 错误详情:', error);
        console.error('错误堆栈:', error.stack);
        this.$modal.msgError("授权保存失败：" + (error.msg || error.message || error || '未知错误'));
      });
    },
    /** 查询部门下拉树结构 */
    getDeptTree() {
      deptTreeSelect().then(response => {
        this.deptOptions = response.data;
      });
    },
    /** 查询工作组下拉树结构 */
    getWorkgroupTree() {
      workgroupTreeSelect().then(response => {
        this.workgroupOptions = response.data;
      });
    },
    /** 查询工作组列表 */
    getWorkgroupList() {
      listPost({}).then(response => {
        this.workgroupList = response.rows || [];
      });
    },
    // 工作组行点击事件
    handleWorkgroupRowClick(row) {
      this.currentWorkgroupId = row.postId;
      this.queryParams.deptId = row.postId;
      this.handleQuery();
    },
    // 工作组表头点击事件 - 显示所有用户
    handleWorkgroupHeaderClick() {
      this.currentWorkgroupId = undefined;
      this.queryParams.deptId = undefined;
      this.handleQuery();
    },
    // 工作组行样式类名
    getWorkgroupRowClassName({ row, rowIndex }) {
      if (this.currentWorkgroupId === row.postId) {
        return 'workgroup-row-active';
      }
      return '';
    },
    // 工作组序号计算
    getWorkgroupIndex(index) {
      return index + 1;
    },
    /** 获取机构单位（参数设置第七条参数） */
    getOrganizationUnit() {
      listConfig({}).then(response => {
        if (response.rows && response.rows.length >= 7) {
          // 获取第七条参数的值
          const seventhConfig = response.rows[6]; // 索引从0开始，第七条是索引6
          this.organizationUnit = seventhConfig.configValue;
        }
      });
    },
    // 用户状态修改
    handleStatusChange(row) {
      let text = row.status === "0" ? "启用" : "停用";
      this.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗？').then(function() {
        return changeUserStatus(row.userId, row.status);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
      }).catch(function() {
        row.status = row.status === "0" ? "1" : "0";
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
        userId: undefined,
        deptId: undefined,
        userName: undefined,
        nickName: undefined,
        password: undefined,
        phonenumber: undefined,
        email: undefined,
        sex: undefined,
        status: "0",
        remark: undefined,
        postIds: [],
        roleIds: [],
        warehouseIds: [],
        departmentIds: [],
        menuIds: []
      };
      this.resetForm("form");
      // 重置菜单树
      if (this.$refs.menuTree) {
        this.$refs.menuTree.setCheckedKeys([]);
      }
      this.menuCheckAll = false;
      this.menuIndeterminate = false;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.queryParams.deptId = undefined;
      this.currentWorkgroupId = undefined;
      this.handleQuery();
    },
    // 序号计算方法
    indexMethod(index) {
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
    },
    // 更多操作触发
    handleCommand(command, row) {
      switch (command) {
        case "handleResetPwd":
          this.handleResetPwd(row);
          break;
        case "handleAuthRole":
          this.handleAuthRole(row);
          break;
        default:
          break;
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      getUser().then(response => {
        this.postOptions = response.posts;
        this.roleOptions = response.roles;
        this.userWarehouseOptions = response.warehouses;
        this.userDepartmentOptions = response.departments;

        // 设置默认角色为"普通角色"
        const normalRole = this.roleOptions.find(role => role.roleName === '普通角色');
        if (normalRole) {
          this.$set(this.form, "roleIds", [normalRole.roleId]);
        }

        // 获取菜单树
        this.getMenuTree();

        this.open = true;
        this.title = "添加用户";
        this.form.password = this.initPassword;
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const userId = row.userId || this.ids;
      getUser(userId).then(response => {
        this.form = response.data;
        this.postOptions = response.posts;
        this.roleOptions = response.roles;
        this.userWarehouseOptions = response.warehouses;
        this.userDepartmentOptions = response.departments;

        // 设置工作组（如果有postIds数组，取第一个值）
        if (response.postIds && response.postIds.length > 0) {
          this.$set(this.form, "deptId", response.postIds[0]);
        }
        this.$set(this.form, "roleIds", response.roleIds);
        this.$set(this.form, "warehouseIds", response.warehouseIds);
        this.$set(this.form, "departmentIds", response.departmentIds);
        this.$set(this.form, "menuIds", response.menuIds || []);

        // 获取菜单树并设置选中状态
        this.getMenuTree();
        this.$nextTick(() => {
          if (this.$refs.menuTree && response.menuIds && response.menuIds.length > 0) {
            this.$refs.menuTree.setCheckedKeys(response.menuIds);
            // 更新全选和半选状态
            const allMenuIds = this.getAllMenuIds(this.menuOptions);
            if (response.menuIds.length === allMenuIds.length) {
              this.menuCheckAll = true;
              this.menuIndeterminate = false;
            } else {
              this.menuCheckAll = false;
              this.menuIndeterminate = response.menuIds.length > 0;
            }
          }
        });

        this.open = true;
        this.title = "修改用户";
        this.form.password = "";
      });
    },
    /** 重置密码按钮操作 */
    handleResetPwd(row) {
      this.$prompt('请输入"' + row.userName + '"的新密码', "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        closeOnClickModal: false,
        inputPattern: /^.{5,20}$/,
        inputErrorMessage: "用户密码长度必须介于 5 和 20 之间"
      }).then(({ value }) => {
          resetUserPwd(row.userId, value).then(response => {
            this.$modal.msgSuccess("修改成功，新密码是：" + value);
          });
        }).catch(() => {});
    },
    /** 分配角色操作 */
    handleAuthRole: function(row) {
      const userId = row.userId;
      this.$router.push("/system/user-auth/role/" + userId);
    },
    /** 角色选择变化处理 */
    handleRoleChange(value) {
      // 过滤掉无效的角色ID，只保留在 roleOptions 中存在的角色ID
      if (value && value.length > 0) {
        const validRoleIds = this.roleOptions.map(role => role.roleId);
        const filteredRoleIds = value.filter(roleId => {
          // 确保角色ID是数字类型，并且在有效列表中
          const numRoleId = Number(roleId);
          return !isNaN(numRoleId) && validRoleIds.includes(numRoleId);
        });
        
        if (filteredRoleIds.length !== value.length) {
          // 如果有无效的角色ID，更新为过滤后的值
          this.$set(this.form, "roleIds", filteredRoleIds);
          this.$modal.msgWarning("已自动移除无效的角色选择");
        } else {
          // 确保所有角色ID都是数字类型
          this.$set(this.form, "roleIds", filteredRoleIds.map(id => Number(id)));
        }
      } else {
        this.$set(this.form, "roleIds", []);
      }
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 再次验证并清理角色ID，确保只提交有效的角色ID
          if (this.form.roleIds && this.form.roleIds.length > 0) {
            const validRoleIds = this.roleOptions.map(role => role.roleId);
            const filteredRoleIds = this.form.roleIds.filter(roleId => {
              const numRoleId = Number(roleId);
              return !isNaN(numRoleId) && validRoleIds.includes(numRoleId);
            });
            
            // 保存原始长度用于比较
            const originalLength = this.form.roleIds.length;
            // 确保 roleIds 是数组且只包含有效的数字ID
            this.form.roleIds = filteredRoleIds.map(id => Number(id));
            
            if (filteredRoleIds.length !== originalLength) {
              this.$modal.msgWarning("已自动移除无效的角色选择");
            }
          } else {
            // 如果没有选择角色，设置为空数组
            this.form.roleIds = [];
          }
          
          // 将工作组 deptId 转换为 postIds 数组
          if (this.form.deptId != null && this.form.deptId !== undefined && this.form.deptId !== '') {
            this.form.postIds = [this.form.deptId];
          } else {
            this.form.postIds = [];
          }
          
          if (this.form.userId != undefined) {
            updateUser(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addUser(this.form).then(response => {
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
      const userIds = row.userId || this.ids;
      this.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function() {
        return delUser(userIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/user/export', {
        ...this.queryParams
      }, `user_${new Date().getTime()}.xlsx`)
    },
    /** 更新用户名称简码 */
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的用户");
        return;
      }
      this.$modal.confirm("是否为选中的用户更新名称简码？").then(() => {
        return updateUserReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "用户导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('system/user/importTemplate', {
      }, `user_template_${new Date().getTime()}.xlsx`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 28px;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 隐藏页面滚动条 */
.app-container::-webkit-scrollbar {
  display: none !important;
}

.app-container {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

/* 左侧部门树区域 */
.app-container > .el-row {
  flex: 1;
  overflow: hidden;
  display: flex;
  padding: 10px;
}

.app-container > .el-row > .el-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 右侧用户数据区域 */
.app-container > .el-row > .el-col:last-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-left: 0;
}

/* 表格包装器 - 占据剩余空间 */
.app-container > .el-row > .el-col:last-child > .table-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 表格区域 - 占据剩余空间 */
.app-container > .el-row > .el-col:last-child > .table-wrapper > .el-table {
  flex: 1;
  overflow: hidden;
}

/* 左侧部门面板样式 - 参照定数监测 */
.dept-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  overflow: hidden;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.dept-panel-header {
  padding: 16px 20px;
  background-color: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 700;
  font-size: 18px;
  color: #606266;
  text-align: center;
}

.dept-panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dept-tree-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 16px 20px;
}

/* 工作组列表面板样式 */
.workgroup-list-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.warehouse-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

::v-deep .dept-panel .el-table {
  font-size: 12px;
}

::v-deep .dept-panel .el-table th {
  padding: 8px 0;
  background-color: #F5F7FA;
  font-weight: 700;
}

::v-deep .dept-panel .el-table td {
  padding: 8px 0;
}

::v-deep .dept-panel .el-table tbody tr {
  cursor: pointer;
}

::v-deep .dept-panel .el-table tbody tr:hover > td {
  background-color: #F5F7FA !important;
}

::v-deep .dept-panel .el-table .workgroup-row-active {
  background-color: #ECF5FF !important;
}

::v-deep .dept-panel .el-table .workgroup-row-active td {
  background-color: #ECF5FF !important;
  color: #409EFF;
}

::v-deep .dept-panel .el-table tbody tr.workgroup-row-active:hover > td {
  background-color: #ECF5FF !important;
}

/* 授权菜单树样式 */
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
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

/* 查询表单卡片样式 - 参照定数监测 */
.query-form-card {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  margin-bottom: 16px;
  margin-top: -10px;
}

.query-form-card .el-row {
  margin-bottom: 8px;
}

.query-form-card .el-row:last-child {
  margin-bottom: 0;
}

.query-form-card .el-form-item {
  margin-bottom: 0;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.query-form-card .query-item-inline .el-input {
  width: 180px;
}

.query-form-card .query-item-inline .el-select {
  width: 180px;
}

.query-form-card .query-item-inline .el-date-editor {
  width: 240px;
}

/* 表格样式优化 - 参照定数监测 */
.table-wrapper .el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.table-wrapper .el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: bold !important;
  height: 42px;
  padding: 4px 0;
  border-bottom: 1px solid #EBEEF5;
}

.table-wrapper .el-table td {
  padding: 6px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.table-wrapper .el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}
</style>

