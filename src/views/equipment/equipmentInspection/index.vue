<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="巡检单号" prop="inspectionCode">
            <el-input
              v-model="queryParams.inspectionCode"
              placeholder="请输入巡检单号"
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
          <el-form-item label="巡检状态" prop="inspectionStatus">
            <el-select v-model="queryParams.inspectionStatus" placeholder="请选择巡检状态" clearable style="width: 100%">
              <el-option
                v-for="dict in dict.type.inspection_status"
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
          v-hasPermi="['equipment:equipmentInspection:add']"
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
          v-hasPermi="['equipment:equipmentInspection:edit']"
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
          v-hasPermi="['equipment:equipmentInspection:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:equipmentInspection:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentInspectionList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="inspectionId" width="50"/>
      <el-table-column label="巡检单号" align="center" prop="inspectionCode" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="巡检类型" align="center" prop="inspectionType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.inspection_type" :value="scope.row.inspectionType"/>
        </template>
      </el-table-column>
      <el-table-column label="巡检状态" align="center" prop="inspectionStatus" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.inspection_status" :value="scope.row.inspectionStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="巡检时间" align="center" prop="inspectionTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.inspectionTime, '{y}-{m}-{d}') }}</span>
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
            v-hasPermi="['equipment:equipmentInspection:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:equipmentInspection:remove']"
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

    <!-- 添加或修改设备巡检记录对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="巡检单号" prop="inspectionCode">
                <el-input v-model="form.inspectionCode" :disabled="isDisabled" placeholder="请输入巡检单号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="设备名称" prop="equipmentName">
                <el-input v-model="form.equipmentName" placeholder="请输入设备名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="巡检类型" prop="inspectionType">
                <el-select v-model="form.inspectionType" placeholder="请选择巡检类型" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.inspection_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="巡检状态" prop="inspectionStatus">
                <el-select v-model="form.inspectionStatus" placeholder="请选择巡检状态" style="width: 100%">
                  <el-option
                    v-for="dict in dict.type.inspection_status"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="巡检时间" prop="inspectionTime">
                <el-date-picker
                  v-model="form.inspectionTime"
                  type="datetime"
                  placeholder="选择巡检时间"
                  style="width: 100%"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="巡检结果" prop="inspectionResult">
                <el-input v-model="form.inspectionResult" type="textarea" placeholder="请输入巡检结果" />
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
import { listEquipmentInspection, getEquipmentInspection, delEquipmentInspection, addEquipmentInspection, updateEquipmentInspection, exportEquipmentInspection } from "@/api/equipment/equipmentInspection";

export default {
  name: "EquipmentInspection",
  dicts: ['inspection_status', 'inspection_type'],
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
      // 设备检验表格数据
      equipmentInspectionList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        inspectionCode: null,
        equipmentName: null,
        inspectionStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        inspectionCode: [
          { required: true, message: "检验编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        inspectionType: [
          { required: true, message: "检验类型不能为空", trigger: "change" }
        ],
        inspectionStatus: [
          { required: true, message: "检验状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备检验列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentInspectionList = [
          {
            inspectionId: 1,
            inspectionCode: 'JC001',
            equipmentName: '数控车床',
            inspectionType: '0',
            inspectionStatus: '0',
            inspectionTime: '2024-01-15 08:00:00',
            inspector: '张师傅',
            inspectionResult: '0',
            inspectionContent: '检查主轴运行、导轨润滑、电气系统',
            nextInspectionDate: '2024-02-15',
            remark: '设备运行正常，无异常情况'
          },
          {
            inspectionId: 2,
            inspectionCode: 'JC002',
            equipmentName: '激光切割机',
            inspectionType: '1',
            inspectionStatus: '1',
            inspectionTime: '2024-01-20 09:00:00',
            inspector: '李师傅',
            inspectionResult: '1',
            inspectionContent: '检查激光器、光学系统、切割精度',
            nextInspectionDate: '2024-02-20',
            remark: '发现激光功率略有下降，需要调整'
          },
          {
            inspectionId: 3,
            inspectionCode: 'JC003',
            equipmentName: '立式加工中心',
            inspectionType: '0',
            inspectionStatus: '2',
            inspectionTime: '2024-01-25 10:00:00',
            inspector: '王师傅',
            inspectionResult: '0',
            inspectionContent: '检查三轴运行、刀库、冷却系统',
            nextInspectionDate: '2024-02-25',
            remark: '检查完成，设备状态良好'
          },
          {
            inspectionId: 4,
            inspectionCode: 'JC004',
            equipmentName: '折弯机',
            inspectionType: '1',
            inspectionStatus: '0',
            inspectionTime: '2024-01-30 11:00:00',
            inspector: '赵师傅',
            inspectionResult: '0',
            inspectionContent: '检查液压系统、模具、安全装置',
            nextInspectionDate: '2024-03-02',
            remark: '设备运行正常，液压系统稳定'
          },
          {
            inspectionId: 5,
            inspectionCode: 'JC005',
            equipmentName: '冲床',
            inspectionType: '0',
            inspectionStatus: '1',
            inspectionTime: '2024-02-05 12:00:00',
            inspector: '钱师傅',
            inspectionResult: '1',
            inspectionContent: '检查离合器、制动器、安全装置',
            nextInspectionDate: '2024-03-07',
            remark: '离合器有轻微磨损，建议更换'
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
        inspectionId: null,
        inspectionCode: null,
        equipmentName: null,
        inspectionType: null,
        inspectionStatus: "0",
        inspectionTime: null,
        inspector: null,
        inspectionResult: null,
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
      this.ids = selection.map(item => item.inspectionId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备检验";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const inspectionId = row.inspectionId || this.ids
      getEquipmentInspection(inspectionId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备检验";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.inspectionId != null) {
            updateEquipmentInspection(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentInspection(this.form).then(response => {
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
      const inspectionIds = row.inspectionId || this.ids;
      this.$modal.confirm('是否确认删除设备检验编号为"' + inspectionIds + '"的数据项？').then(function() {
        return delEquipmentInspection(inspectionIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/inspection/export', {
        ...this.queryParams
      }, `equipment_inspection_${new Date().getTime()}.xlsx`)
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