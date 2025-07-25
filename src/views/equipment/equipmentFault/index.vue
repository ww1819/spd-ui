<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="故障单号" prop="faultCode">
            <el-input
              v-model="queryParams.faultCode"
              placeholder="请输入故障单号"
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
          <el-form-item label="故障状态" prop="faultStatus">
            <el-select v-model="queryParams.faultStatus" placeholder="请选择故障状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.fault_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
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
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['equipment:equipmentFault:add']"
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
          v-hasPermi="['equipment:equipmentFault:edit']"
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
          v-hasPermi="['equipment:equipmentFault:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentFault:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentFaultList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="faultId" width="50"/>
      <el-table-column label="故障单号" align="center" prop="faultCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="故障类型" align="center" prop="faultType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fault_type" :value="scope.row.faultType"/>
        </template>
      </el-table-column>
      <el-table-column label="故障状态" align="center" prop="faultStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.fault_status" :value="scope.row.faultStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="故障时间" align="center" prop="faultTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.faultTime, '{y}-{m}-{d}') }}</span>
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
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:equipmentFault:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentFault:remove']"
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

    <!-- 添加或修改设备故障记录对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="故障单号" prop="faultCode">
                <el-input v-model="form.faultCode" :disabled="isDisabled" placeholder="请输入故障单号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentName">
                <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="故障类型" prop="faultType">
                <el-select v-model="form.faultType" placeholder="请选择故障类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.fault_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="故障状态" prop="faultStatus">
                <el-select v-model="form.faultStatus" placeholder="请选择故障状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.fault_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="故障时间" prop="faultTime">
                <el-date-picker
                  v-model="form.faultTime"
                  type="datetime"
                  placeholder="选择故障时间"
                  style="width: 100%"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="故障描述" prop="faultDescription">
                <el-input v-model="form.faultDescription" type="textarea" placeholder="请输入故障描述" />
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
import { listEquipmentFault, getEquipmentFault, delEquipmentFault, addEquipmentFault, updateEquipmentFault, exportEquipmentFault } from "@/api/equipment/equipmentFault";

export default {
  name: "EquipmentFault",
  dicts: ['fault_status', 'fault_type'],
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
      // 设备故障表格数据
      equipmentFaultList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        faultCode: null,
        equipmentName: null,
        faultStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        faultCode: [
          { required: true, message: "故障编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        faultType: [
          { required: true, message: "故障类型不能为空", trigger: "change" }
        ],
        faultStatus: [
          { required: true, message: "故障状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备故障列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentFaultList = [
          {
            faultId: 1,
            faultCode: 'GZ001',
            equipmentName: '数控车床',
            faultType: '0',
            faultStatus: '0',
            faultTime: '2024-01-15 10:30:00',
            reporter: '张三',
            faultDescription: '主轴异响，运行时发出异常声音',
            faultLevel: '1',
            faultLocation: '主轴部位',
            remark: '需要立即停机检查，避免设备损坏'
          },
          {
            faultId: 2,
            faultCode: 'GZ002',
            equipmentName: '激光切割机',
            faultType: '1',
            faultStatus: '1',
            faultTime: '2024-01-20 14:15:00',
            reporter: '李四',
            faultDescription: '激光器功率下降，切割效果差',
            faultLevel: '2',
            faultLocation: '激光器',
            remark: '影响生产质量，需要调整激光参数'
          },
          {
            faultId: 3,
            faultCode: 'GZ003',
            equipmentName: '立式加工中心',
            faultType: '0',
            faultStatus: '2',
            faultTime: '2024-01-25 09:45:00',
            reporter: '王五',
            faultDescription: '刀库卡刀，无法正常换刀',
            faultLevel: '1',
            faultLocation: '刀库',
            remark: '已修复，设备恢复正常运行'
          },
          {
            faultId: 4,
            faultCode: 'GZ004',
            equipmentName: '折弯机',
            faultType: '1',
            faultStatus: '0',
            faultTime: '2024-01-30 16:20:00',
            reporter: '赵六',
            faultDescription: '液压系统漏油，压力不稳定',
            faultLevel: '2',
            faultLocation: '液压系统',
            remark: '紧急故障，需要立即处理'
          },
          {
            faultId: 5,
            faultCode: 'GZ005',
            equipmentName: '冲床',
            faultType: '0',
            faultStatus: '1',
            faultTime: '2024-02-05 11:30:00',
            reporter: '钱七',
            faultDescription: '离合器打滑，冲压无力',
            faultLevel: '1',
            faultLocation: '离合器',
            remark: '需要更换离合器片'
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
        faultId: null,
        faultCode: null,
        equipmentName: null,
        faultType: null,
        faultStatus: "0",
        faultTime: null,
        reporter: null,
        faultDescription: null,
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
      this.ids = selection.map(item => item.faultId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备故障";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const faultId = row.faultId || this.ids
      getEquipmentFault(faultId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备故障";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.faultId != null) {
            updateEquipmentFault(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentFault(this.form).then(response => {
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
      const faultIds = row.faultId || this.ids;
      this.$modal.confirm('是否确认删除设备故障编号为"' + faultIds + '"的数据项？').then(function() {
        return delEquipmentFault(faultIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/fault/export', {
        ...this.queryParams
      }, `equipment_fault_${new Date().getTime()}.xlsx`)
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