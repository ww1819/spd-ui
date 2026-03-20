<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="菜单名称" prop="menuName">
        <el-input
          v-model="queryParams.menuName"
          placeholder="请输入菜单名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="菜单状态" clearable>
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
          v-hasPermi="['system:menu:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-sort"
          size="small"
          @click="toggleExpandAll"
        >展开/折叠</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-finished"
          size="small"
          @click="openDefaultOpenBatch"
          v-hasPermi="['system:menu:edit']"
        >批量默认开放</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="menuList"
      row-key="menuId"
      :default-expand-all="isExpandAll"
      :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
    >
      <el-table-column prop="menuName" label="菜单名称" :show-overflow-tooltip="true" width="160"></el-table-column>
      <el-table-column prop="icon" label="图标" align="center" width="100">
        <template slot-scope="scope">
          <svg-icon :icon-class="scope.row.icon" />
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" width="60"></el-table-column>
      <el-table-column label="隐藏" align="center" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.visible === '1' || scope.row.visible === 1 ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="perms" label="权限标识" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column prop="component" label="组件路径" :show-overflow-tooltip="true"></el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" width="72">
        <template slot-scope="scope">
          <span>{{ (scope.row.isPlatform === '1' || scope.row.isPlatform === 1) ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="默认开放" align="center" width="88">
        <template slot-scope="scope">
          <span>{{ (scope.row.defaultOpenToCustomer === '1' || scope.row.defaultOpenToCustomer === 1) ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime">
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
            v-hasPermi="['system:menu:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-plus"
            @click="handleAdd(scope.row)"
            v-hasPermi="['system:menu:add']"
          >新增</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:menu:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改菜单对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上级菜单" prop="parentId">
              <treeselect
                v-model="form.parentId"
                :options="menuOptions"
                :normalizer="normalizer"
                :show-count="true"
                placeholder="选择上级菜单"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio label="M">目录</el-radio>
                <el-radio label="C">菜单</el-radio>
                <el-radio label="F">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="form.menuType != 'F'">
            <el-form-item label="菜单图标" prop="icon">
              <el-popover
                placement="bottom-start"
                width="460"
                trigger="click"
                @show="$refs['iconSelect'].reset()"
              >
                <IconSelect ref="iconSelect" @selected="selected" :active-icon="form.icon" />
                <el-input slot="reference" v-model="form.icon" placeholder="点击选择图标" readonly>
                  <svg-icon
                    v-if="form.icon"
                    slot="prefix"
                    :icon-class="form.icon"
                    style="width: 25px;"
                  />
                  <i v-else slot="prefix" class="el-icon-search el-input__icon" />
                </el-input>
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="form.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType != 'F'">
            <el-form-item prop="isFrame">
              <span slot="label">
                <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                是否外链
              </span>
              <el-radio-group v-model="form.isFrame">
                <el-radio label="0">是</el-radio>
                <el-radio label="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType != 'F'">
            <el-form-item prop="path">
              <span slot="label">
                <el-tooltip content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                路由地址
              </span>
              <el-input v-model="form.path" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType == 'C'">
            <el-form-item prop="component">
              <span slot="label">
                <el-tooltip content="访问的组件路径，如：`system/user/index`，默认在`views`目录下" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                组件路径
              </span>
              <el-input v-model="form.component" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType != 'M'">
            <el-form-item prop="perms">
              <el-input v-model="form.perms" placeholder="请输入权限标识" maxlength="100" />
              <span slot="label">
                <el-tooltip content="控制器中定义的权限字符，如：@PreAuthorize(`@ss.hasPermi('system:user:list')`)" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                权限字符
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType == 'C'">
            <el-form-item prop="query">
              <el-input v-model="form.query" placeholder="请输入路由参数" maxlength="255" />
              <span slot="label">
                <el-tooltip content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`' placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                路由参数
              </span>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType == 'C'">
            <el-form-item prop="isCache">
              <span slot="label">
                <el-tooltip content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                是否缓存
              </span>
              <el-radio-group v-model="form.isCache">
                <el-radio label="0">缓存</el-radio>
                <el-radio label="1">不缓存</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType != 'F'">
            <el-form-item prop="visible">
              <span slot="label">
                <el-tooltip content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                显示状态
              </span>
              <el-radio-group v-model="form.visible">
                <el-radio
                  v-for="dict in dict.type.sys_show_hide"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.menuType != 'F'">
            <el-form-item prop="status">
              <span slot="label">
                <el-tooltip content="选择停用则路由将不会出现在侧边栏，也不能被访问" placement="top">
                <i class="el-icon-question"></i>
                </el-tooltip>
                菜单状态
              </span>
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="isPlatform">
              <span slot="label">
                <el-tooltip content="是=仅平台管理员可见，租户菜单树中不展示（耗材 is_platform=1）" placement="top">
                  <i class="el-icon-question"></i>
                </el-tooltip>
                平台管理
              </span>
              <el-radio-group v-model="form.isPlatform" @change="onHcFlagChange">
                <el-radio label="0">否</el-radio>
                <el-radio label="1">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="defaultOpenToCustomer">
              <span slot="label">
                <el-tooltip content="是=耗材「客户功能重置」时默认写入客户/super/super_01；平台管理菜单不可同时勾选" placement="top">
                  <i class="el-icon-question"></i>
                </el-tooltip>
                默认对客户开放
              </span>
              <el-radio-group v-model="form.defaultOpenToCustomer" :disabled="form.isPlatform === '1'">
                <el-radio label="0">否</el-radio>
                <el-radio label="1">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="批量设置默认对客户开放"
      :visible.sync="defaultOpenOpen"
      width="620px"
      append-to-body
    >
      <div style="margin-bottom: 12px; color: #606266; font-size: 13px; line-height: 1.5;">
        <p style="margin: 0 0 8px;">
          目录、菜单、按钮各自对应一条权限；回显时按后台每条记录单独读取「默认开放」，不仅看父级。
        </p>
        <div style="display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px;">
          <el-tooltip
            content="开启：勾选父级会选中其下全部子菜单与按钮；勾选任意子级时父级会随之为全选或半选。关闭后各级互不牵连，可单独勾选。"
            placement="top"
          >
            <span style="cursor: help; border-bottom: 1px dashed #909399;">父子联动勾选</span>
          </el-tooltip>
          <el-switch
            :value="defaultOpenParentChildLink"
            active-text="开"
            inactive-text="关"
            @change="onDefaultOpenLinkageBeforeChange"
          />
        </div>
      </div>
      <el-tree
        ref="defaultOpenTree"
        :data="defaultOpenTreeData"
        show-checkbox
        node-key="menuId"
        :check-strictly="defaultOpenTreeCheckStrictly"
        :props="{ label: 'menuName', children: 'children', disabled: 'disabled' }"
        default-expand-all
        v-loading="defaultOpenLoading"
      >
        <span slot-scope="{ node, data }" class="custom-tree-node">
          <span>{{ node.label }}</span>
          <el-tag v-if="data.menuType === 'F'" type="info" size="mini" style="margin-left: 6px;">按钮</el-tag>
          <el-tag v-else-if="data.menuType === 'C'" type="success" size="mini" style="margin-left: 6px;">菜单</el-tag>
          <el-tag v-else-if="data.menuType === 'M'" size="mini" style="margin-left: 6px;">目录</el-tag>
        </span>
      </el-tree>
      <div slot="footer" class="dialog-footer">
        <el-button @click="defaultOpenOpen = false">取 消</el-button>
        <el-button type="primary" :loading="defaultOpenSubmitting" @click="submitDefaultOpenBatch">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listMenu, getMenu, delMenu, addMenu, updateMenu, getDefaultOpenMenuTree, batchSetDefaultOpenToCustomer } from "@/api/system/menu";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import IconSelect from "@/components/IconSelect";

export default {
  name: "Menu",
  dicts: ['sys_show_hide', 'sys_normal_disable'],
  components: { Treeselect, IconSelect },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 菜单表格树数据
      menuList: [],
      // 菜单树选项
      menuOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否展开，默认全部折叠
      isExpandAll: false,
      // 重新渲染表格状态
      refreshTable: true,
      defaultOpenOpen: false,
      defaultOpenLoading: false,
      defaultOpenSubmitting: false,
      defaultOpenTreeData: [],
      /** 父子联动勾选：勾选父级带全子级，勾选子级向上影响父级（Element 默认关联模式） */
      defaultOpenParentChildLink: true,
      applyingDefaultOpenDbKeys: false,
      // 查询参数
      queryParams: {
        menuName: undefined,
        visible: undefined
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        menuName: [
          { required: true, message: "菜单名称不能为空", trigger: "blur" }
        ],
        orderNum: [
          { required: true, message: "菜单顺序不能为空", trigger: "blur" }
        ],
        path: [
          { required: true, message: "路由地址不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  computed: {
    /** 回显库中每条勾选态时强制父子不关联，避免仅父级勾选掩盖子级/按钮实际状态 */
    defaultOpenTreeCheckStrictly() {
      if (this.applyingDefaultOpenDbKeys) return true;
      return !this.defaultOpenParentChildLink;
    }
  },
  methods: {
    // 选择图标
    selected(name) {
      this.form.icon = name;
    },
    /** 查询菜单列表 */
    getList() {
      this.loading = true;
      listMenu(this.queryParams).then(response => {
        this.menuList = this.handleTree(response.data, "menuId");
        this.loading = false;
      });
    },
    /** 转换菜单数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.menuId,
        label: node.menuName,
        children: node.children
      };
    },
    /** 查询菜单下拉树结构 */
    getTreeselect() {
      listMenu().then(response => {
        this.menuOptions = [];
        const menu = { menuId: 0, menuName: '主类目', children: [] };
        menu.children = this.handleTree(response.data, "menuId");
        this.menuOptions.push(menu);
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
        menuId: undefined,
        parentId: 0,
        menuName: undefined,
        icon: undefined,
        menuType: "M",
        orderNum: undefined,
        isFrame: "1",
        isCache: "0",
        visible: "0",
        status: "0",
        isPlatform: "0",
        defaultOpenToCustomer: "0"
      };
      this.resetForm("form");
    },
    /** 平台管理=是时，默认对客户开放强制为否（与后端耗材重置规则一致） */
    onHcFlagChange() {
      if (this.form.isPlatform === "1") {
        this.form.defaultOpenToCustomer = "0";
      }
    },
    applyDisabledToDefaultOpenTree(nodes, parentDisabled = false) {
      if (!nodes || !nodes.length) return;
      nodes.forEach(n => {
        const selfPlatform = n.isPlatform === "1" || n.isPlatform === 1;
        n.disabled = parentDisabled || selfPlatform;
        this.applyDisabledToDefaultOpenTree(n.children, n.disabled);
      });
    },
    collectDefaultOpenInitialCheckedKeys(nodes) {
      const keys = [];
      const isOpen = v =>
        v === "1" || v === 1 || v === true || String(v) === "1";
      const walk = arr => {
        if (!arr) return;
        arr.forEach(n => {
          if (!n.disabled && isOpen(n.defaultOpenToCustomer)) {
            keys.push(n.menuId);
          }
          walk(n.children);
        });
      };
      walk(nodes);
      return keys;
    },
    /**
     * 仅在 check-strictly 下 setCheckedKeys：与库中每条记录一致（含未默认开放的子菜单/按钮）。
     * 禁止在父子联动模式下再次 setCheckedKeys(keys)：keys 含父级时 Element 会把全部子孙勾上，造成「未默认开放却显示勾选」。
     * 随后仅切换 store.checkStrictly，保留已设勾选，由用户操作再触发父子联动。
     */
    syncDefaultOpenTreeChecked() {
      this.$nextTick(() => {
        this.$nextTick(() => {
          const tree = this.$refs.defaultOpenTree;
          if (!tree) return;
          const keys = this.collectDefaultOpenInitialCheckedKeys(this.defaultOpenTreeData);
          this.applyingDefaultOpenDbKeys = true;
          this.$nextTick(() => {
            tree.setCheckedKeys(keys);
            this.$nextTick(() => {
              this.applyingDefaultOpenDbKeys = false;
            });
          });
        });
      });
    },
    /**
     * 关闭联动→严格：用当前勾选 keys 回写，避免状态丢。
     * 开启联动：禁止 setCheckedKeys（否则 keys 含父级会把未勾选的子孙级联勾上，与库不一致）。
     */
    onDefaultOpenLinkageBeforeChange(val) {
      const tree = this.$refs.defaultOpenTree;
      const keys = tree ? [...tree.getCheckedKeys(false)] : [];
      this.defaultOpenParentChildLink = val;
      if (val) return;
      this.$nextTick(() => {
        const t = this.$refs.defaultOpenTree;
        if (t) t.setCheckedKeys(keys);
      });
    },
    openDefaultOpenBatch() {
      this.defaultOpenOpen = true;
      this.defaultOpenParentChildLink = true;
      this.defaultOpenTreeData = [];
      this.defaultOpenLoading = true;
      getDefaultOpenMenuTree()
        .then(res => {
          const data = res.data || [];
          this.applyDisabledToDefaultOpenTree(data);
          this.defaultOpenTreeData = data;
          this.syncDefaultOpenTreeChecked();
        })
        .finally(() => {
          this.defaultOpenLoading = false;
        });
    },
    submitDefaultOpenBatch() {
      const tree = this.$refs.defaultOpenTree;
      if (!tree) return;
      const menuIds = tree.getCheckedKeys();
      this.defaultOpenSubmitting = true;
      batchSetDefaultOpenToCustomer(menuIds)
        .then(() => {
          this.$modal.msgSuccess("保存成功");
          this.defaultOpenOpen = false;
          this.getList();
        })
        .finally(() => {
          this.defaultOpenSubmitting = false;
        });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 新增按钮操作 */
    handleAdd(row) {
      this.reset();
      this.getTreeselect();
      if (row != null && row.menuId) {
        this.form.parentId = row.menuId;
      } else {
        this.form.parentId = 0;
      }
      this.open = true;
      this.title = "添加菜单";
    },
    /** 展开/折叠操作 */
    toggleExpandAll() {
      this.refreshTable = false;
      this.isExpandAll = !this.isExpandAll;
      this.$nextTick(() => {
        this.refreshTable = true;
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.getTreeselect();
      getMenu(row.menuId).then(response => {
        const d = response.data;
        this.form = {
          ...d,
          isPlatform: d.isPlatform === "1" || d.isPlatform === 1 ? "1" : "0",
          defaultOpenToCustomer:
            d.defaultOpenToCustomer === "1" || d.defaultOpenToCustomer === 1 ? "1" : "0"
        };
        if (this.form.isPlatform === "1") {
          this.form.defaultOpenToCustomer = "0";
        }
        this.open = true;
        this.title = "修改菜单";
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.menuId != undefined) {
            updateMenu(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMenu(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除名称为"' + row.menuName + '"的数据项？').then(function() {
        return delMenu(row.menuId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>
