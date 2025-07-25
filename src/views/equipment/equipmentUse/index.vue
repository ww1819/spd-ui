<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="设备名称" prop="equipmentName">
            <el-input
              v-model="queryParams.equipmentName"
              placeholder="请输入设备名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="使用单号" prop="useNo">
            <el-input
              v-model="queryParams.useNo"
              placeholder="请输入使用单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="使用状态" prop="useStatus">
            <el-select v-model="queryParams.useStatus" placeholder="请选择使用状态" clearable>
              <el-option
                v-for="dict in dict.type.use_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <div style="display: inline">
            <span>起</span>
            <el-date-picker clearable
                            v-model="queryParams.beginDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择起始日期"
                            style="width: 140px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 140px"
            >
            </el-date-picker>
          </div>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['equipment:use:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['equipment:use:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['equipment:use:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:use:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentUseList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="useId" width="50"/>
      <el-table-column label="使用单号" align="center" prop="useNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="使用人" align="center" prop="useUser" width="100"/>
      <el-table-column label="使用部门" align="center" prop="useDept" width="120"/>
      <el-table-column label="使用状态" align="center" prop="useStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.use_status" :value="scope.row.useStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="使用时间" align="center" prop="useTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.useTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:use:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:use:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改设备使用对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用单号" prop="useNo">
              <el-input v-model="form.useNo" placeholder="请输入使用单号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="equipmentName">
              <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用人" prop="useUser">
              <el-input v-model="form.useUser" placeholder="请输入使用人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用状态" prop="useStatus">
              <el-select v-model="form.useStatus" placeholder="请选择使用状态">
                <el-option
                  v-for="dict in dict.type.use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用时间" prop="useTime">
              <el-date-picker
                v-model="form.useTime"
                type="datetime"
                placeholder="选择使用时间"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用部门" prop="useDept">
              <el-input v-model="form.useDept" placeholder="请输入使用部门" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用用途" prop="usePurpose">
              <el-input v-model="form.usePurpose" placeholder="请输入使用用途" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
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
import { listEquipmentUse, getEquipmentUse, delEquipmentUse, addEquipmentUse, updateEquipmentUse, exportEquipmentUse } from "@/api/equipment/equipmentUse";

export default {
  name: "EquipmentUse",
  dicts: ['use_status'],
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
      // 设备使用表格数据
      equipmentUseList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        useNo: null,
        equipmentName: null,
        useStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        useNo: [
          { required: true, message: "使用单号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        useUser: [
          { required: true, message: "使用人不能为空", trigger: "blur" }
        ],
        useStatus: [
          { required: true, message: "使用状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备使用列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentUseList = [
          {
            useId: 1,
            useNo: 'SY001',
            equipmentName: '数控车床',
            useUser: '张三',
            useStatus: '0',
            useTime: '2024-01-15 08:00:00',
            useDept: '生产部',
            usePurpose: '精密零件加工',
            contactPhone: '13800138001',
            useLocation: '车间A-01',
            remark: '设备运行正常，生产效率高'
          },
          {
            useId: 2,
            useNo: 'SY002',
            equipmentName: '激光切割机',
            useUser: '李四',
            useStatus: '1',
            useTime: '2024-01-20 09:00:00',
            useDept: '技术部',
            usePurpose: '技术研发项目',
            contactPhone: '13800138002',
            useLocation: '车间C-03',
            remark: '激光功率稳定，切割精度高'
          },
          {
            useId: 3,
            useNo: 'SY003',
            equipmentName: '立式加工中心',
            useUser: '王五',
            useStatus: '2',
            useTime: '2024-01-25 10:00:00',
            useDept: '制造部',
            usePurpose: '复杂零件加工',
            contactPhone: '13800138003',
            useLocation: '车间B-02',
            remark: '五轴联动加工，效率显著提升'
          },
          {
            useId: 4,
            useNo: 'SY004',
            equipmentName: '折弯机',
            useUser: '赵六',
            useStatus: '0',
            useTime: '2024-01-30 11:00:00',
            useDept: '钣金部',
            usePurpose: '钣金件折弯加工',
            contactPhone: '13800138004',
            useLocation: '车间D-04',
            remark: '折弯精度高，产品质量稳定'
          },
          {
            useId: 5,
            useNo: 'SY005',
            equipmentName: '冲床',
            useUser: '钱七',
            useStatus: '1',
            useTime: '2024-02-05 12:00:00',
            useDept: '冲压部',
            usePurpose: '冲压件生产',
            contactPhone: '13800138005',
            useLocation: '车间E-05',
            remark: '冲压效率高，安全性能良好'
          }
        ];
        this.total = 5;
        this.loading = false;
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
        useId: null,
        useNo: null,
        equipmentName: null,
        useUser: null,
        useStatus: "0",
        useTime: null,
        useDept: null,
        usePurpose: null,
        contactPhone: null,
        remark: null
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
      this.ids = selection.map(item => item.useId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备使用";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const useId = row.useId || this.ids
      getEquipmentUse(useId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备使用";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.useId != null) {
            updateEquipmentUse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentUse(this.form).then(response => {
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
      const useIds = row.useId || this.ids;
      this.$modal.confirm('是否确认删除设备使用编号为"' + useIds + '"的数据项？').then(function() {
        return delEquipmentUse(useIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/use/export', {
        ...this.queryParams
      }, `equipment_use_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

 