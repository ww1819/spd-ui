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
          <el-form-item label="盘点单号" prop="checkNo">
            <el-input
              v-model="queryParams.checkNo"
              placeholder="请输入盘点单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="盘点状态" prop="checkStatus">
            <el-select v-model="queryParams.checkStatus" placeholder="请选择盘点状态" clearable>
              <el-option
                v-for="dict in dict.type.check_status"
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
          v-hasPermi="['equipment:check:add']"
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
          v-hasPermi="['equipment:check:edit']"
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
          v-hasPermi="['equipment:check:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['equipment:check:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="checkList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="checkId" width="50"/>
      <el-table-column label="盘点单号" align="center" prop="checkNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="盘点数量" align="center" prop="checkNum" width="80"/>
      <el-table-column label="盘点人" align="center" prop="checkUser" width="100"/>
      <el-table-column label="盘点部门" align="center" prop="checkDept" width="120"/>
      <el-table-column label="盘点状态" align="center" prop="checkStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.check_status" :value="scope.row.checkStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="盘点时间" align="center" prop="checkTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.checkTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:check:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:check:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改设备盘点对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="盘点单号" prop="checkNo">
                <el-input v-model="form.checkNo" placeholder="请输入盘点单号" />
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
              <el-form-item label="盘点数量" prop="checkNum">
                <el-input-number v-model="form.checkNum" :min="1" controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="盘点状态" prop="checkStatus">
                <el-select v-model="form.checkStatus" placeholder="请选择盘点状态">
                  <el-option
                    v-for="dict in dict.type.check_status"
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
              <el-form-item label="盘点时间" prop="checkTime">
                <el-date-picker
                  v-model="form.checkTime"
                  type="datetime"
                  placeholder="选择盘点时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="盘点人" prop="checkUser">
                <el-input v-model="form.checkUser" placeholder="请输入盘点人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="盘点部门" prop="checkDept">
                <el-input v-model="form.checkDept" placeholder="请输入盘点部门" />
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
import { listEquipmentCheck, getEquipmentCheck, delEquipmentCheck, addEquipmentCheck, updateEquipmentCheck, exportEquipmentCheck } from "@/api/equipment/equipmentCheck";

export default {
  name: "EquipmentCheck",
  dicts: ['check_status', 'check_type'],
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
      // 设备检查表格数据
      equipmentCheckList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        checkCode: null,
        equipmentName: null,
        checkStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        checkCode: [
          { required: true, message: "检查编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        checkType: [
          { required: true, message: "检查类型不能为空", trigger: "change" }
        ],
        checkStatus: [
          { required: true, message: "检查状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备检查列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentCheckList = [
          {
            checkId: 1,
            checkCode: 'JC001',
            equipmentName: '数控车床',
            checkType: '0',
            checkStatus: '0',
            checkTime: '2024-01-15 08:00:00',
            checker: '张师傅',
            checkResult: '0',
            checkContent: '检查主轴运行、导轨润滑、电气系统',
            nextCheckDate: '2024-02-15',
            remark: '设备运行正常，无异常情况'
          },
          {
            checkId: 2,
            checkCode: 'JC002',
            equipmentName: '激光切割机',
            checkType: '1',
            checkStatus: '1',
            checkTime: '2024-01-20 09:00:00',
            checker: '李师傅',
            checkResult: '1',
            checkContent: '检查激光器、光学系统、切割精度',
            nextCheckDate: '2024-02-20',
            remark: '发现激光功率略有下降，需要调整'
          },
          {
            checkId: 3,
            checkCode: 'JC003',
            equipmentName: '立式加工中心',
            checkType: '0',
            checkStatus: '2',
            checkTime: '2024-01-25 10:00:00',
            checker: '王师傅',
            checkResult: '0',
            checkContent: '检查三轴运行、刀库、冷却系统',
            nextCheckDate: '2024-02-25',
            remark: '检查完成，设备状态良好'
          },
          {
            checkId: 4,
            checkCode: 'JC004',
            equipmentName: '折弯机',
            checkType: '1',
            checkStatus: '0',
            checkTime: '2024-01-30 11:00:00',
            checker: '赵师傅',
            checkResult: '0',
            checkContent: '检查液压系统、模具、安全装置',
            nextCheckDate: '2024-03-02',
            remark: '设备运行正常，液压系统稳定'
          },
          {
            checkId: 5,
            checkCode: 'JC005',
            equipmentName: '冲床',
            checkType: '0',
            checkStatus: '1',
            checkTime: '2024-02-05 12:00:00',
            checker: '钱师傅',
            checkResult: '1',
            checkContent: '检查离合器、制动器、安全装置',
            nextCheckDate: '2024-03-07',
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
        checkId: null,
        checkCode: null,
        equipmentName: null,
        checkType: null,
        checkStatus: "0",
        checkTime: null,
        checker: null,
        checkResult: null,
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
      this.ids = selection.map(item => item.checkId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备检查";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const checkId = row.checkId || this.ids
      getEquipmentCheck(checkId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备检查";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.checkId != null) {
            updateEquipmentCheck(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentCheck(this.form).then(response => {
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
      const checkIds = row.checkId || this.ids;
      this.$modal.confirm('是否确认删除设备检查编号为"' + checkIds + '"的数据项？').then(function() {
        return delEquipmentCheck(checkIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/check/export', {
        ...this.queryParams
      }, `equipment_check_${new Date().getTime()}.xlsx`)
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