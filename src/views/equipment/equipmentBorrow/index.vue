<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="借用编号" prop="borrowCode">
            <el-input
              v-model="queryParams.borrowCode"
              placeholder="请输入借用编号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
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
          <el-form-item label="借用状态" prop="borrowStatus">
            <el-select v-model="queryParams.borrowStatus" placeholder="请选择借用状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.borrow_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
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
          v-hasPermi="['equipment:equipmentBorrow:add']"
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
          v-hasPermi="['equipment:equipmentBorrow:edit']"
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
          v-hasPermi="['equipment:equipmentBorrow:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentBorrow:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentBorrowList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="borrowId" width="50"/>
      <el-table-column label="借用编号" align="center" prop="borrowCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="借用类型" align="center" prop="borrowType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.borrow_type" :value="scope.row.borrowType"/>
        </template>
      </el-table-column>
      <el-table-column label="借用状态" align="center" prop="borrowStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.borrow_status" :value="scope.row.borrowStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
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
            v-hasPermi="['equipment:equipmentBorrow:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentBorrow:remove']"
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

    <!-- 添加或修改设备借用对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="借用编号" prop="borrowCode">
                <el-input v-model="form.borrowCode" :disabled="isDisabled" placeholder="请输入借用编号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentId">
                <el-select v-model="form.equipmentId" placeholder="请选择设备" style="width: 100%">
                  <el-option
                    v-for="item in equipmentOptions"
                    :key="item.equipmentId"
                    :label="item.equipmentName"
                    :value="item.equipmentId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用类型" prop="borrowType">
                <el-select v-model="form.borrowType" placeholder="请选择借用类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.borrow_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用状态" prop="borrowStatus">
                <el-select v-model="form.borrowStatus" placeholder="请选择借用状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.borrow_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用人" prop="borrowUser">
                <el-input v-model="form.borrowUser" placeholder="请输入借用人" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用部门" prop="borrowDept">
                <el-input v-model="form.borrowDept" placeholder="请输入借用部门" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用数量" prop="borrowNum">
                <el-input-number v-model="form.borrowNum" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="借用日期" prop="borrowDate">
                <el-date-picker
                  v-model="form.borrowDate"
                  type="date"
                  placeholder="选择借用日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="预计归还" prop="expectReturnDate">
                <el-date-picker
                  v-model="form.expectReturnDate"
                  type="date"
                  placeholder="选择预计归还日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="实际归还" prop="actualReturnDate">
                <el-date-picker
                  v-model="form.actualReturnDate"
                  type="date"
                  placeholder="选择实际归还日期"
                  style="width: 100%"
                  value-format="yyyy-MM-dd"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="借用说明" prop="borrowDesc">
                <el-input v-model="form.borrowDesc" type="textarea" placeholder="请输入借用说明" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="借用备注" prop="borrowRemark">
                <el-input v-model="form.borrowRemark" type="textarea" placeholder="请输入借用备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipmentBorrow, getEquipmentBorrow, delEquipmentBorrow, addEquipmentBorrow, updateEquipmentBorrow, exportEquipmentBorrow } from "@/api/equipment/equipmentBorrow";

export default {
  name: "EquipmentBorrow",
  dicts: ['borrow_status', 'borrow_type'],
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
      // 设备借用表格数据
      equipmentBorrowList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        borrowCode: null,
        equipmentName: null,
        borrowStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        borrowCode: [
          { required: true, message: "借用编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        borrowType: [
          { required: true, message: "借用类型不能为空", trigger: "change" }
        ],
        borrowStatus: [
          { required: true, message: "借用状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备借用列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentBorrowList = [
          {
            borrowId: 1,
            borrowCode: 'JY001',
            equipmentName: '数控车床',
            borrowType: '0',
            borrowStatus: '0',
            borrowTime: '2024-01-15 09:00:00',
            returnTime: '2024-01-20 17:00:00',
            borrower: '张三',
            borrowDepartment: '生产部',
            contactPhone: '13800138001',
            remark: '生产急需，用于加工精密零件'
          },
          {
            borrowId: 2,
            borrowCode: 'JY002',
            equipmentName: '激光切割机',
            borrowType: '1',
            borrowStatus: '1',
            borrowTime: '2024-01-18 14:00:00',
            returnTime: null,
            borrower: '李四',
            borrowDepartment: '技术部',
            contactPhone: '13800138002',
            remark: '技术研发项目使用'
          },
          {
            borrowId: 3,
            borrowCode: 'JY003',
            equipmentName: '立式加工中心',
            borrowType: '0',
            borrowStatus: '2',
            borrowTime: '2024-01-10 08:00:00',
            returnTime: '2024-01-12 18:00:00',
            borrower: '王五',
            borrowDepartment: '质检部',
            contactPhone: '13800138003',
            remark: '质量检测设备校准'
          },
          {
            borrowId: 4,
            borrowCode: 'JY004',
            equipmentName: '折弯机',
            borrowType: '1',
            borrowStatus: '0',
            borrowTime: '2024-01-22 10:00:00',
            returnTime: '2024-01-25 16:00:00',
            borrower: '赵六',
            borrowDepartment: '制造部',
            contactPhone: '13800138004',
            remark: '批量生产订单使用'
          },
          {
            borrowId: 5,
            borrowCode: 'JY005',
            equipmentName: '冲床',
            borrowType: '0',
            borrowStatus: '1',
            borrowTime: '2024-01-25 13:00:00',
            returnTime: null,
            borrower: '钱七',
            borrowDepartment: '维修部',
            contactPhone: '13800138005',
            remark: '设备维护保养'
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
        borrowId: null,
        borrowCode: null,
        equipmentName: null,
        borrowType: null,
        borrowStatus: "0",
        borrowTime: null,
        returnTime: null,
        borrower: null,
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
      this.ids = selection.map(item => item.borrowId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备借用";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const borrowId = row.borrowId || this.ids
      getEquipmentBorrow(borrowId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备借用";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.borrowId != null) {
            updateEquipmentBorrow(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentBorrow(this.form).then(response => {
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
      const borrowIds = row.borrowId || this.ids;
      this.$modal.confirm('是否确认删除设备借用编号为"' + borrowIds + '"的数据项？').then(function() {
        return delEquipmentBorrow(borrowIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/borrow/export', {
        ...this.queryParams
      }, `equipment_borrow_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.local-modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 6px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.dialog-footer {
  text-align: right;
  margin-top: 16px;
}
</style> 