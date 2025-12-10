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
          <el-form-item label="校准单号" prop="calibrateNo">
            <el-input
              v-model="queryParams.calibrateNo"
              placeholder="请输入校准单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="校准状态" prop="calibrateStatus">
            <el-select v-model="queryParams.calibrateStatus" placeholder="请选择校准状态" clearable>
              <el-option
                v-for="dict in dict.type.calibrate_status"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
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
          size="small"
          @click="handleAdd"
          v-hasPermi="['equipment:calibrate:add']"
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
          v-hasPermi="['equipment:calibrate:edit']"
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
          v-hasPermi="['equipment:calibrate:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['equipment:calibrate:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="equipmentCalibrateList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="calibrateId" width="50"/>
      <el-table-column label="校准单号" align="center" prop="calibrateNo" width="120"/>
      <el-table-column label="设备名称" align="center" prop="equipmentName" width="180"/>
      <el-table-column label="校准机构" align="center" prop="calibrateOrg" width="120"/>
      <el-table-column label="校准人" align="center" prop="calibrateUser" width="100"/>
      <el-table-column label="校准状态" align="center" prop="calibrateStatus" width="80">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.calibrate_status" :value="scope.row.calibrateStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="校准时间" align="center" prop="calibrateTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.calibrateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:calibrate:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:calibrate:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改设备校准对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="校准单号" prop="calibrateNo">
                <el-input v-model="form.calibrateNo" placeholder="请输入校准单号" />
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
              <el-form-item label="校准机构" prop="calibrateOrg">
                <el-input v-model="form.calibrateOrg" placeholder="请输入校准机构" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="校准状态" prop="calibrateStatus">
                <el-select v-model="form.calibrateStatus" placeholder="请选择校准状态">
                  <el-option
                    v-for="dict in dict.type.calibrate_status"
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
              <el-form-item label="校准时间" prop="calibrateTime">
                <el-date-picker
                  v-model="form.calibrateTime"
                  type="datetime"
                  placeholder="选择校准时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="校准人" prop="calibrateUser">
                <el-input v-model="form.calibrateUser" placeholder="请输入校准人" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="校准费用" prop="calibrateCost">
                <el-input-number v-model="form.calibrateCost" :precision="2" :step="0.1" controls-position="right" />
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
import { listEquipmentCalibrate, getEquipmentCalibrate, delEquipmentCalibrate, addEquipmentCalibrate, updateEquipmentCalibrate, exportEquipmentCalibrate } from "@/api/equipment/equipmentCalibrate";

export default {
  name: "EquipmentCalibrate",
  dicts: ['calibrate_status'],
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
      // 设备校准表格数据
      equipmentCalibrateList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        calibrateCode: null,
        equipmentName: null,
        calibrateStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        calibrateCode: [
          { required: true, message: "校准编号不能为空", trigger: "blur" }
        ],
        equipmentName: [
          { required: true, message: "设备名称不能为空", trigger: "blur" }
        ],
        calibrateStatus: [
          { required: true, message: "校准状态不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备校准列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.equipmentCalibrateList = [
          {
            calibrateId: 1,
            calibrateCode: 'JZ001',
            equipmentName: '数控车床',
            calibrateStatus: '0',
            calibrateTime: '2024-01-15 09:00:00',
            calibrator: '张师傅',
            calibrateResult: '0',
            cost: 800,
            calibrateContent: '主轴精度校准、导轨平行度校准',
            nextCalibrateDate: '2024-07-15',
            remark: '校准合格，精度符合要求'
          },
          {
            calibrateId: 2,
            calibrateCode: 'JZ002',
            equipmentName: '激光切割机',
            calibrateStatus: '1',
            calibrateTime: '2024-01-20 14:00:00',
            calibrator: '李师傅',
            calibrateResult: '1',
            cost: 1200,
            calibrateContent: '激光功率校准、切割精度校准',
            nextCalibrateDate: '2024-07-20',
            remark: '校准中，需要调整激光参数'
          },
          {
            calibrateId: 3,
            calibrateCode: 'JZ003',
            equipmentName: '立式加工中心',
            calibrateStatus: '2',
            calibrateTime: '2024-01-25 10:00:00',
            calibrator: '王师傅',
            calibrateResult: '0',
            cost: 1500,
            calibrateContent: '三轴精度校准、刀库位置校准',
            nextCalibrateDate: '2024-07-25',
            remark: '校准完成，设备精度良好'
          },
          {
            calibrateId: 4,
            calibrateCode: 'JZ004',
            equipmentName: '折弯机',
            calibrateStatus: '0',
            calibrateTime: '2024-01-30 11:00:00',
            calibrator: '赵师傅',
            calibrateResult: '0',
            cost: 600,
            calibrateContent: '折弯角度校准、压力校准',
            nextCalibrateDate: '2024-07-30',
            remark: '校准合格，折弯精度达标'
          },
          {
            calibrateId: 5,
            calibrateCode: 'JZ005',
            equipmentName: '冲床',
            calibrateStatus: '1',
            calibrateTime: '2024-02-05 13:00:00',
            calibrator: '钱师傅',
            calibrateResult: '1',
            cost: 500,
            calibrateContent: '冲压力校准、行程精度校准',
            nextCalibrateDate: '2024-08-05',
            remark: '校准中，需要更换传感器'
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
        calibrateId: null,
        calibrateCode: null,
        equipmentName: null,
        calibrateStatus: "0",
        calibrateTime: null,
        calibrator: null,
        calibrateResult: null,
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
      this.ids = selection.map(item => item.calibrateId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备校准";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const calibrateId = row.calibrateId || this.ids
      getEquipmentCalibrate(calibrateId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备校准";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.calibrateId != null) {
            updateEquipmentCalibrate(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentCalibrate(this.form).then(response => {
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
      const calibrateIds = row.calibrateId || this.ids;
      this.$modal.confirm('是否确认删除设备校准编号为"' + calibrateIds + '"的数据项？').then(function() {
        return delEquipmentCalibrate(calibrateIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('equipment/calibrate/export', {
        ...this.queryParams
      }, `equipment_calibrate_${new Date().getTime()}.xlsx`)
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