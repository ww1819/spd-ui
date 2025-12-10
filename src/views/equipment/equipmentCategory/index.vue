<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="分类名称" prop="categoryName">
            <el-input
              v-model="queryParams.categoryName"
              placeholder="请输入分类名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="分类编码" prop="categoryCode">
            <el-input
              v-model="queryParams.categoryCode"
              placeholder="请输入分类编码"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['equipment:category:add']"
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
          v-hasPermi="['equipment:category:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="small"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['equipment:category:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="categoryId" width="50"/>
      <el-table-column label="分类编码" align="center" prop="categoryCode" width="100"/>
      <el-table-column label="分类名称" align="center" prop="categoryName" width="180"/>
      <el-table-column label="父级分类" align="center" prop="parentName" width="180"/>
      <el-table-column label="显示顺序" align="center" prop="orderNum" width="80"/>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:category:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:category:remove']"
          >删除</el-button>
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

    <!-- 添加或修改设备分类对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上级分类" prop="parentId">
              <treeselect
                v-model="form.parentId"
                :options="categoryOptions"
                :normalizer="normalizer"
                :show-count="true"
                placeholder="选择上级分类"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类名称" prop="categoryName">
              <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类编码" prop="categoryCode">
              <el-input v-model="form.categoryCode" placeholder="请输入分类编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
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

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEquipmentCategory, getEquipmentCategory, delEquipmentCategory, addEquipmentCategory, updateEquipmentCategory, treeselect } from "@/api/equipment/equipmentCategory";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "EquipmentCategory",
  dicts: ['sys_normal_disable'],
  components: { Treeselect },
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
      // 设备分类表格数据
      categoryList: [],
      // 设备分类树选项
      categoryOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        categoryName: null,
        categoryCode: null,
        status: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        parentId: [
          { required: true, message: "上级分类不能为空", trigger: "blur" }
        ],
        categoryName: [
          { required: true, message: "分类名称不能为空", trigger: "blur" }
        ],
        categoryCode: [
          { required: true, message: "分类编码不能为空", trigger: "blur" }
        ],
        orderNum: [
          { required: true, message: "显示顺序不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.getTreeselect();
  },
  methods: {
    /** 查询设备分类列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        const mockData = [
          {
            categoryId: 1,
            parentId: 0,
            categoryName: '机床设备',
            categoryCode: 'JC',
            orderNum: 1,
            status: '0',
            children: [
              {
                categoryId: 11,
                parentId: 1,
                categoryName: '车床',
                categoryCode: 'CC',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 12,
                parentId: 1,
                categoryName: '铣床',
                categoryCode: 'XC',
                orderNum: 2,
                status: '0'
              },
              {
                categoryId: 13,
                parentId: 1,
                categoryName: '加工中心',
                categoryCode: 'JGZX',
                orderNum: 3,
                status: '0'
              }
            ]
          },
          {
            categoryId: 2,
            parentId: 0,
            categoryName: '激光设备',
            categoryCode: 'JG',
            orderNum: 2,
            status: '0',
            children: [
              {
                categoryId: 21,
                parentId: 2,
                categoryName: '激光切割机',
                categoryCode: 'JGQG',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 22,
                parentId: 2,
                categoryName: '激光焊接机',
                categoryCode: 'JGHJ',
                orderNum: 2,
                status: '0'
              }
            ]
          },
          {
            categoryId: 3,
            parentId: 0,
            categoryName: '钣金设备',
            categoryCode: 'BJ',
            orderNum: 3,
            status: '0',
            children: [
              {
                categoryId: 31,
                parentId: 3,
                categoryName: '折弯机',
                categoryCode: 'ZWJ',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 32,
                parentId: 3,
                categoryName: '剪板机',
                categoryCode: 'JBJ',
                orderNum: 2,
                status: '0'
              }
            ]
          },
          {
            categoryId: 4,
            parentId: 0,
            categoryName: '冲压设备',
            categoryCode: 'CY',
            orderNum: 4,
            status: '0',
            children: [
              {
                categoryId: 41,
                parentId: 4,
                categoryName: '冲床',
                categoryCode: 'CC',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 42,
                parentId: 4,
                categoryName: '压力机',
                categoryCode: 'YLJ',
                orderNum: 2,
                status: '0'
              }
            ]
          }
        ];
        this.categoryList = this.handleTree(mockData, "categoryId");
        this.total = mockData.length;
        this.loading = false;
      }, 500);
    },
    /** 查询设备分类下拉树列表 */
    getTreeselect() {
      // 模拟数据
      setTimeout(() => {
        this.categoryOptions = [
          {
            categoryId: 1,
            parentId: 0,
            categoryName: '机床设备',
            categoryCode: 'JC',
            orderNum: 1,
            status: '0',
            children: [
              {
                categoryId: 11,
                parentId: 1,
                categoryName: '车床',
                categoryCode: 'CC',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 12,
                parentId: 1,
                categoryName: '铣床',
                categoryCode: 'XC',
                orderNum: 2,
                status: '0'
              },
              {
                categoryId: 13,
                parentId: 1,
                categoryName: '加工中心',
                categoryCode: 'JGZX',
                orderNum: 3,
                status: '0'
              }
            ]
          },
          {
            categoryId: 2,
            parentId: 0,
            categoryName: '激光设备',
            categoryCode: 'JG',
            orderNum: 2,
            status: '0',
            children: [
              {
                categoryId: 21,
                parentId: 2,
                categoryName: '激光切割机',
                categoryCode: 'JGQG',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 22,
                parentId: 2,
                categoryName: '激光焊接机',
                categoryCode: 'JGHJ',
                orderNum: 2,
                status: '0'
              }
            ]
          },
          {
            categoryId: 3,
            parentId: 0,
            categoryName: '钣金设备',
            categoryCode: 'BJ',
            orderNum: 3,
            status: '0',
            children: [
              {
                categoryId: 31,
                parentId: 3,
                categoryName: '折弯机',
                categoryCode: 'ZWJ',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 32,
                parentId: 3,
                categoryName: '剪板机',
                categoryCode: 'JBJ',
                orderNum: 2,
                status: '0'
              }
            ]
          },
          {
            categoryId: 4,
            parentId: 0,
            categoryName: '冲压设备',
            categoryCode: 'CY',
            orderNum: 4,
            status: '0',
            children: [
              {
                categoryId: 41,
                parentId: 4,
                categoryName: '冲床',
                categoryCode: 'CC',
                orderNum: 1,
                status: '0'
              },
              {
                categoryId: 42,
                parentId: 4,
                categoryName: '压力机',
                categoryCode: 'YLJ',
                orderNum: 2,
                status: '0'
              }
            ]
          }
        ];
      }, 500);
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        categoryId: null,
        parentId: 0,
        categoryName: null,
        categoryCode: null,
        orderNum: 0,
        status: "0"
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
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.categoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备分类";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const categoryId = row.categoryId || this.ids
      getEquipmentCategory(categoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备分类";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.categoryId != null) {
            updateEquipmentCategory(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentCategory(this.form).then(response => {
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
      const categoryIds = row.categoryId || this.ids;
      this.$modal.confirm('是否确认删除设备分类编号为"' + categoryIds + '"的数据项？').then(function() {
        return delEquipmentCategory(categoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 转换设备分类数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.categoryId,
        label: node.categoryName,
        children: node.children
      };
    }
  }
};
</script>

 