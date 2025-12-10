<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="维护单号" prop="maintenanceCode">
            <el-input
              v-model="queryParams.maintenanceCode"
              placeholder="请输入维护单号"
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
          <el-form-item label="维护状态" prop="maintenanceStatus">
            <el-select v-model="queryParams.maintenanceStatus" placeholder="请选择维护状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.maintenance_status"
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
          v-hasPermi="['equipment:equipmentMaintenance:add']"
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
          v-hasPermi="['equipment:equipmentMaintenance:edit']"
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
          v-hasPermi="['equipment:equipmentMaintenance:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentMaintenance:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentMaintenanceList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="maintenanceId" width="50"/>
      <el-table-column label="维护单号" align="center" prop="maintenanceCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="维护类型" align="center" prop="maintenanceType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintenance_type" :value="scope.row.maintenanceType"/>
        </template>
      </el-table-column>
      <el-table-column label="维护状态" align="center" prop="maintenanceStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.maintenance_status" :value="scope.row.maintenanceStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="维护时间" align="center" prop="maintenanceTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.maintenanceTime, '{y}-{m}-{d}') }}</span>
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
            v-hasPermi="['equipment:equipmentMaintenance:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentMaintenance:remove']"
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

    <!-- 添加或修改设备维护记录对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="维护单号" prop="maintenanceCode">
                <el-input v-model="form.maintenanceCode" :disabled="isDisabled" placeholder="请输入维护单号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentName">
                <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="维护类型" prop="maintenanceType">
                <el-select v-model="form.maintenanceType" placeholder="请选择维护类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintenance_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="维护状态" prop="maintenanceStatus">
                <el-select v-model="form.maintenanceStatus" placeholder="请选择维护状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.maintenance_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="维护时间" prop="maintenanceTime">
                <el-date-picker
                  v-model="form.maintenanceTime"
                  type="datetime"
                  placeholder="选择维护时间"
                  style="width: 100%"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="维护内容" prop="maintenanceContent">
                <el-input v-model="form.maintenanceContent" type="textarea" placeholder="请输入维护内容" />
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
import { listEquipmentMaintenance, getEquipmentMaintenance, delEquipmentMaintenance, addEquipmentMaintenance, updateEquipmentMaintenance, exportEquipmentMaintenance } from "@/api/equipment/equipmentMaintenance";

export default {
  name: "EquipmentMaintenance",
  dicts: ['maintenance_status', 'maintenance_type'],
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
      // 设备维护表格数据
      equipmentMaintenanceList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        maintenanceCode: null,
        equipmentName: null,
        maintenanceStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        maintenanceCode: [
          { required: true, message: "维护编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        maintenanceType: [
          { required: true, message: "维护类型不能为空", trigger: "change" }
        ],
        maintenanceStatus: [
          { required: true, message: "维护状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备维护列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentMaintenanceList = [
          {
            maintenanceId: 1,
            maintenanceCode: 'WH001',
            equipmentName: '数控车床',
            maintenanceType: '0',
            maintenanceStatus: '0',
            maintenanceTime: '2024-01-15 08:00:00',
            maintainer: '张师傅',
            cost: 800,
            maintenanceContent: '更换润滑油、清洁导轨、检查主轴',
            nextMaintenanceDate: '2024-04-15',
            remark: '定期维护，设备运行正常'
          },
          {
            maintenanceId: 2,
            maintenanceCode: 'WH002',
            equipmentName: '激光切割机',
            maintenanceType: '1',
            maintenanceStatus: '1',
            maintenanceTime: '2024-01-20 09:00:00',
            maintainer: '李师傅',
            cost: 1200,
            maintenanceContent: '清洁光学镜片、检查激光器、校准光路',
            nextMaintenanceDate: '2024-04-20',
            remark: '预防性维护，确保切割精度'
          },
          {
            maintenanceId: 3,
            maintenanceCode: 'WH003',
            equipmentName: '立式加工中心',
            maintenanceType: '0',
            maintenanceStatus: '2',
            maintenanceTime: '2024-01-25 10:00:00',
            maintainer: '王师傅',
            cost: 1500,
            maintenanceContent: '更换切削液、清洁工作台、检查刀库',
            nextMaintenanceDate: '2024-04-25',
            remark: '全面维护，提高设备效率'
          },
          {
            maintenanceId: 4,
            maintenanceCode: 'WH004',
            equipmentName: '折弯机',
            maintenanceType: '1',
            maintenanceStatus: '0',
            maintenanceTime: '2024-01-30 11:00:00',
            maintainer: '赵师傅',
            cost: 700,
            maintenanceContent: '检查液压系统、清洁模具、润滑导轨',
            nextMaintenanceDate: '2024-05-02',
            remark: '定期维护，延长设备寿命'
          },
          {
            maintenanceId: 5,
            maintenanceCode: 'WH005',
            equipmentName: '冲床',
            maintenanceType: '0',
            maintenanceStatus: '1',
            maintenanceTime: '2024-02-05 12:00:00',
            maintainer: '钱师傅',
            cost: 500,
            maintenanceContent: '检查离合器、清洁模具、润滑传动部件',
            nextMaintenanceDate: '2024-05-07',
            remark: '预防性维护，确保安全运行'
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
        maintenanceId: null,
        maintenanceCode: null,
        equipmentName: null,
        maintenanceType: null,
        maintenanceStatus: "0",
        maintenanceTime: null,
        maintainer: null,
        cost: 0,
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
      this.ids = selection.map(item => item.maintenanceId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备维护";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const maintenanceId = row.maintenanceId || this.ids
      getEquipmentMaintenance(maintenanceId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备维护";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.maintenanceId != null) {
            updateEquipmentMaintenance(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentMaintenance(this.form).then(response => {
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
      const maintenanceIds = row.maintenanceId || this.ids;
      this.$modal.confirm('是否确认删除设备维护编号为"' + maintenanceIds + '"的数据项？').then(function() {
        return delEquipmentMaintenance(maintenanceIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/maintenance/export', {
        ...this.queryParams
      }, `equipment_maintenance_${new Date().getTime()}.xlsx`)
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