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
          <el-form-item label="调拨单号" prop="allocateNo">
            <el-input
              v-model="queryParams.allocateNo"
              placeholder="请输入调拨单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="调拨状态" prop="allocateStatus">
            <el-select v-model="queryParams.allocateStatus" placeholder="请选择调拨状态" clearable>
              <el-option
                v-for="dict in dict.type.allocate_status"
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
          v-hasPermi="['equipment:allocate:add']"
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
          v-hasPermi="['equipment:allocate:edit']"
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
          v-hasPermi="['equipment:allocate:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:allocate:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentAllocateList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="allocateId" width="50"/>
      <el-table-column label="调拨单号" align="center" prop="allocateNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="调拨数量" align="center" prop="allocateNum" width="80"/>
      <el-table-column label="调出部门" align="center" prop="outDept" width="120"/>
      <el-table-column label="调入部门" align="center" prop="inDept" width="120"/>
      <el-table-column label="调拨状态" align="center" prop="allocateStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.allocate_status" :value="scope.row.allocateStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="调拨时间" align="center" prop="allocateTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.allocateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:allocate:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:allocate:remove']"
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

    <!-- 添加或修改设备调拨对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="调拨单号" prop="allocateNo">
                <el-input v-model="form.allocateNo" placeholder="请输入调拨单号" />
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
              <el-form-item label="调拨数量" prop="allocateNum">
                <el-input-number v-model="form.allocateNum" :min="1" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调拨状态" prop="allocateStatus">
                <el-select v-model="form.allocateStatus" placeholder="请选择调拨状态">
                  <el-option
                    v-for="dict in dict.type.allocate_status"
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
              <el-form-item label="调拨时间" prop="allocateTime">
                <el-date-picker
                  v-model="form.allocateTime"
                  type="datetime"
                  placeholder="选择调拨时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调拨人" prop="allocateUser">
                <el-input v-model="form.allocateUser" placeholder="请输入调拨人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="调出部门" prop="outDept">
                <el-input v-model="form.outDept" placeholder="请输入调出部门" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="调入部门" prop="inDept">
                <el-input v-model="form.inDept" placeholder="请输入调入部门" />
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
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipmentAllocate, getEquipmentAllocate, delEquipmentAllocate, addEquipmentAllocate, updateEquipmentAllocate, exportEquipmentAllocate } from "@/api/equipment/equipmentAllocate";

export default {
  name: "EquipmentAllocate",
  dicts: ['allocate_status'],
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
      // 设备分配表格数据
      equipmentAllocateList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        allocateCode: null,
        equipmentName: null,
        allocateStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        allocateCode: [
          { required: true, message: "分配编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        allocateStatus: [
          { required: true, message: "分配状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备分配列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentAllocateList = [
          {
            allocateId: 1,
            allocateCode: 'FP001',
            equipmentName: '数控车床',
            allocateStatus: '0',
            allocateTime: '2024-01-15 09:00:00',
            allocateUser: '张三',
            allocateDept: '生产部',
            allocateReason: '新项目需要，用于精密零件加工',
            allocateLocation: '车间A-01',
            remark: '设备已调试完成，可以正常使用'
          },
          {
            allocateId: 2,
            allocateCode: 'FP002',
            equipmentName: '激光切割机',
            allocateStatus: '1',
            allocateTime: '2024-01-20 14:00:00',
            allocateUser: '李四',
            allocateDept: '技术部',
            allocateReason: '技术研发项目使用',
            allocateLocation: '车间C-03',
            remark: '设备正在调试中'
          },
          {
            allocateId: 3,
            allocateCode: 'FP003',
            equipmentName: '立式加工中心',
            allocateStatus: '2',
            allocateTime: '2024-01-25 10:00:00',
            allocateUser: '王五',
            allocateDept: '制造部',
            allocateReason: '批量生产订单需要',
            allocateLocation: '车间B-02',
            remark: '设备分配完成，已投入使用'
          },
          {
            allocateId: 4,
            allocateCode: 'FP004',
            equipmentName: '折弯机',
            allocateStatus: '0',
            allocateTime: '2024-01-30 11:00:00',
            allocateUser: '赵六',
            allocateDept: '钣金部',
            allocateReason: '钣金加工项目需要',
            allocateLocation: '车间D-04',
            remark: '设备已就位，等待调试'
          },
          {
            allocateId: 5,
            allocateCode: 'FP005',
            equipmentName: '冲床',
            allocateStatus: '1',
            allocateTime: '2024-02-05 13:00:00',
            allocateUser: '钱七',
            allocateDept: '冲压部',
            allocateReason: '冲压件生产需要',
            allocateLocation: '车间E-05',
            remark: '设备正在安装调试'
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
        allocateId: null,
        allocateCode: null,
        equipmentName: null,
        allocateStatus: "0",
        allocateTime: null,
        allocateUser: null,
        allocateDept: null,
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
      this.ids = selection.map(item => item.allocateId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备分配";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const allocateId = row.allocateId || this.ids
      getEquipmentAllocate(allocateId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备分配";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.allocateId != null) {
            updateEquipmentAllocate(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentAllocate(this.form).then(response => {
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
      const allocateIds = row.allocateId || this.ids;
      this.$modal.confirm('是否确认删除设备分配编号为"' + allocateIds + '"的数据项？').then(function() {
        return delEquipmentAllocate(allocateIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/allocate/export', {
        ...this.queryParams
      }, `equipment_allocate_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.local-modal-content {
  background: #fff;
  border-radius: 6px;
  min-width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
</style> 