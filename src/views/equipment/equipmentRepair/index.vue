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
          <el-form-item label="维修单号" prop="repairNo">
            <el-input
              v-model="queryParams.repairNo"
              placeholder="请输入维修单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="维修状态" prop="repairStatus">
            <el-select v-model="queryParams.repairStatus" placeholder="请选择维修状态" clearable>
              <el-option
                v-for="dict in dict.type.repair_status"
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
          v-hasPermi="['equipment:repair:add']"
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
          v-hasPermi="['equipment:repair:edit']"
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
          v-hasPermi="['equipment:repair:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:repair:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentRepairList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="repairId" width="50"/>
      <el-table-column label="维修单号" align="center" prop="repairNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="维修人" align="center" prop="repairUser" width="100"/>
      <el-table-column label="维修部门" align="center" prop="repairDept" width="120"/>
      <el-table-column label="维修状态" align="center" prop="repairStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.repair_status" :value="scope.row.repairStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="维修时间" align="center" prop="repairTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.repairTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:repair:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:repair:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改设备维修对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="维修单号" prop="repairNo">
                <el-input v-model="form.repairNo" placeholder="请输入维修单号" />
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
              <el-form-item label="维修人" prop="repairUser">
                <el-input v-model="form.repairUser" placeholder="请输入维修人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="维修状态" prop="repairStatus">
                <el-select v-model="form.repairStatus" placeholder="请选择维修状态">
                  <el-option
                    v-for="dict in dict.type.repair_status"
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
              <el-form-item label="维修时间" prop="repairTime">
                <el-date-picker
                  v-model="form.repairTime"
                  type="datetime"
                  placeholder="选择维修时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="维修部门" prop="repairDept">
                <el-input v-model="form.repairDept" placeholder="请输入维修部门" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="维修费用" prop="repairCost">
                <el-input-number v-model="form.repairCost" :precision="2" :step="0.1" controls-position="right" />
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
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipmentRepair, getEquipmentRepair, delEquipmentRepair, addEquipmentRepair, updateEquipmentRepair, exportEquipmentRepair } from "@/api/equipment/equipmentRepair";

export default {
  name: "EquipmentRepair",
  dicts: ['repair_status', 'repair_type'],
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
      // 设备维修表格数据
      equipmentRepairList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        repairCode: null,
        equipmentName: null,
        repairStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        repairCode: [
          { required: true, message: "维修编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        repairType: [
          { required: true, message: "维修类型不能为空", trigger: "change" }
        ],
        repairStatus: [
          { required: true, message: "维修状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备维修列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentRepairList = [
          {
            repairId: 1,
            repairCode: 'WX001',
            equipmentName: '数控车床',
            repairType: '0',
            repairStatus: '0',
            repairTime: '2024-01-15 10:00:00',
            repairer: '张师傅',
            cost: 1500,
            faultDescription: '主轴异响，需要更换轴承',
            repairContent: '更换主轴轴承，调整主轴间隙',
            remark: '设备恢复正常运行'
          },
          {
            repairId: 2,
            repairCode: 'WX002',
            equipmentName: '激光切割机',
            repairType: '1',
            repairStatus: '1',
            repairTime: '2024-01-20 14:00:00',
            repairer: '李师傅',
            cost: 2000,
            faultDescription: '激光器功率下降，切割效果差',
            repairContent: '清洁激光器镜片，调整激光功率',
            remark: '维修中，预计明天完成'
          },
          {
            repairId: 3,
            repairCode: 'WX003',
            equipmentName: '立式加工中心',
            repairType: '0',
            repairStatus: '2',
            repairTime: '2024-01-25 09:00:00',
            repairer: '王师傅',
            cost: 3000,
            faultDescription: '刀库卡刀，无法正常换刀',
            repairContent: '修复刀库机械手，更换传感器',
            remark: '维修完成，设备已恢复正常'
          },
          {
            repairId: 4,
            repairCode: 'WX004',
            equipmentName: '折弯机',
            repairType: '1',
            repairStatus: '0',
            repairTime: '2024-01-30 16:00:00',
            repairer: '赵师傅',
            cost: 800,
            faultDescription: '液压系统漏油',
            repairContent: '更换密封圈，补充液压油',
            remark: '紧急维修，确保生产进度'
          },
          {
            repairId: 5,
            repairCode: 'WX005',
            equipmentName: '冲床',
            repairType: '0',
            repairStatus: '1',
            repairTime: '2024-02-05 11:00:00',
            repairer: '钱师傅',
            cost: 1200,
            faultDescription: '离合器打滑，冲压无力',
            repairContent: '更换离合器片，调整离合器间隙',
            remark: '维修中，需要更换配件'
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
        repairId: null,
        repairCode: null,
        equipmentName: null,
        repairType: null,
        repairStatus: "0",
        repairTime: null,
        repairer: null,
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
      this.ids = selection.map(item => item.repairId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备维修";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const repairId = row.repairId || this.ids
      getEquipmentRepair(repairId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备维修";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.repairId != null) {
            updateEquipmentRepair(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentRepair(this.form).then(response => {
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
      const repairIds = row.repairId || this.ids;
      this.$modal.confirm('是否确认删除设备维修编号为"' + repairIds + '"的数据项？').then(function() {
        return delEquipmentRepair(repairIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/repair/export', {
        ...this.queryParams
      }, `equipment_repair_${new Date().getTime()}.xlsx`)
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